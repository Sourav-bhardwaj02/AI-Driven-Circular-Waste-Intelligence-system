import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getRouteFromOSRM, interpolatePosition, OSRMRouteResult } from "@/services/osrmRouting";
import { AlertCircle, RefreshCw } from "lucide-react";

export interface CitizenMetrics {
  distanceKm: number;
  distanceMeters: number;
  etaMins: number;
  progressPercent: number;
  pickupStatus: 'on_the_way' | 'approaching' | 'arrived' | 'collected';
  routingError?: string | null;
}

interface CitizenLiveMapProps {
  collectorPos: [number, number]; // [lat, lng]
  citizenPos: [number, number]; // [lat, lng]
  collectorName?: string;
  vehicleNumber?: string;
  isDemoActive?: boolean;
  demoSpeed?: number;
  resetSignal?: number;
  onMetricsUpdate?: (metrics: CitizenMetrics) => void;
  onDemoComplete?: () => void;
}

const CitizenLiveMap = ({
  collectorPos,
  citizenPos,
  collectorName = "Ramesh Kumar",
  vehicleNumber = "DL-01-WB-4821",
  isDemoActive = false,
  demoSpeed = 1,
  resetSignal = 0,
  onMetricsUpdate,
  onDemoComplete
}: CitizenLiveMapProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const homeMarkerRef = useRef<L.Marker | null>(null);
  const activePolylineRef = useRef<L.Polyline | null>(null);
  const completedPolylineRef = useRef<L.Polyline | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentProgressRef = useRef<number>(0);

  // Extract primitive numbers to prevent array reference equality issues
  const collectorLat = collectorPos[0];
  const collectorLng = collectorPos[1];
  const citizenLat = citizenPos[0];
  const citizenLng = citizenPos[1];

  // Callback refs to prevent re-triggering animation loops when parent re-renders
  const onMetricsUpdateRef = useRef(onMetricsUpdate);
  useEffect(() => {
    onMetricsUpdateRef.current = onMetricsUpdate;
  }, [onMetricsUpdate]);

  const onDemoCompleteRef = useRef(onDemoComplete);
  useEffect(() => {
    onDemoCompleteRef.current = onDemoComplete;
  }, [onDemoComplete]);

  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [totalDistanceKm, setTotalDistanceKm] = useState<number>(0);
  const [totalDurationMins, setTotalDurationMins] = useState<number>(0);
  const [routingError, setRoutingError] = useState<string | null>(null);

  // Custom Leaflet Icons
  const truckIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-12 h-12 bg-emerald-600 text-white rounded-full shadow-2xl border-2 border-white transform transition-transform hover:scale-110">
        <span class="text-2xl">🚛</span>
        <span class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-ping"></span>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });

  const homeIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-11 h-11 bg-indigo-600 text-white rounded-full shadow-2xl border-2 border-white">
        <span class="text-xl">🏠</span>
        <span class="absolute -bottom-1 px-1.5 py-0.5 bg-indigo-700 text-white font-bold text-[9px] rounded-full border border-white uppercase tracking-wider">Your Home</span>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

  // Calculate OSRM Road Route from Collector -> Citizen Destination
  const fetchRoadRoute = useCallback(async () => {
    setRoutingError(null);

    try {
      // OSRM requires [lng, lat]
      const origin: [number, number] = [collectorLng, collectorLat];
      const destination: [number, number] = [citizenLng, citizenLat];

      const routeResult: OSRMRouteResult = await getRouteFromOSRM([origin, destination]);

      if (routeResult.error || !routeResult.geometry.length) {
        setRoutingError(routeResult.error || 'Unable to calculate road route');
        setRouteGeometry([[collectorLat, collectorLng], [citizenLat, citizenLng]]);
      } else {
        setRouteGeometry(routeResult.geometry);
        setTotalDistanceKm(routeResult.distanceKm);
        setTotalDurationMins(routeResult.durationMins);
        setRoutingError(null);
      }
    } catch (err: any) {
      setRoutingError('Road route calculation failed');
      setRouteGeometry([[collectorLat, collectorLng], [citizenLat, citizenLng]]);
    }
  }, [collectorLat, collectorLng, citizenLat, citizenLng]);

  // Initialize Map ONCE
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([citizenLat, citizenLng], 14);

    mapInstance.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Create Home Marker (Citizen's single house)
    homeMarkerRef.current = L.marker([citizenLat, citizenLng], { icon: homeIcon })
      .addTo(map)
      .bindPopup(`
        <div class="p-2 font-sans">
          <h4 class="font-bold text-sm text-indigo-700 flex items-center gap-1">🏠 Your Home Address</h4>
          <p class="text-xs text-gray-600 mt-1">Collector truck is scheduled for pickup at your household.</p>
        </div>
      `);

    // Create Collector Truck Marker
    truckMarkerRef.current = L.marker([collectorLat, collectorLng], { icon: truckIcon })
      .addTo(map)
      .bindPopup(`
        <div class="p-2 font-sans">
          <h4 class="font-bold text-sm text-emerald-700 flex items-center gap-1">🚛 Garbage Collector Truck</h4>
          <p class="text-xs text-gray-700 font-semibold mt-1">${collectorName}</p>
          <p class="text-[11px] text-gray-500">${vehicleNumber}</p>
        </div>
      `);

    fetchRoadRoute();

    // Resize invalidate after mount
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [citizenLat, citizenLng, collectorLat, collectorLng, collectorName, vehicleNumber, fetchRoadRoute]);

  // Draw initial route polylines when routeGeometry loads
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || routeGeometry.length === 0) return;

    if (activePolylineRef.current) map.removeLayer(activePolylineRef.current);
    if (completedPolylineRef.current) map.removeLayer(completedPolylineRef.current);

    activePolylineRef.current = L.polyline(routeGeometry, {
      color: '#10b981',
      weight: 6,
      opacity: 0.95
    }).addTo(map);

    completedPolylineRef.current = L.polyline([], {
      color: '#9ca3af',
      weight: 4,
      opacity: 0.6,
      dashArray: '6, 6'
    }).addTo(map);

    const bounds = L.latLngBounds(routeGeometry);
    map.fitBounds(bounds, { padding: [70, 70] });
  }, [routeGeometry]);

  // Invalidate map size when demo active or container size changes
  useEffect(() => {
    if (mapInstance.current) {
      const timer = setTimeout(() => {
        mapInstance.current?.invalidateSize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isDemoActive]);

  // Handle Reset Signal
  useEffect(() => {
    currentProgressRef.current = 0;
    if (truckMarkerRef.current) {
      truckMarkerRef.current.setLatLng([collectorLat, collectorLng]);
    }
    if (activePolylineRef.current && routeGeometry.length > 0) {
      activePolylineRef.current.setLatLngs(routeGeometry);
    }
    if (completedPolylineRef.current) {
      completedPolylineRef.current.setLatLngs([]);
    }
  }, [resetSignal, collectorLat, collectorLng, routeGeometry]);

  // Smooth, Glitch-Free Animation Loop
  useEffect(() => {
    if (!isDemoActive || routeGeometry.length === 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let lastTimestamp: number | null = null;
    let lastMetricsUpdate = 0;

    const animateStep = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const progressStep = 0.025 * demoSpeed * deltaTime;
      currentProgressRef.current = Math.min(1, currentProgressRef.current + progressStep);
      const progress = currentProgressRef.current;

      // 1. Smoothly update truck position using setLatLng (No DOM re-creation!)
      const nextCoord = interpolatePosition(routeGeometry, progress);
      if (truckMarkerRef.current) {
        truckMarkerRef.current.setLatLng(nextCoord);
      }

      // 2. Smoothly update polylines using setLatLngs (No DOM re-creation!)
      const splitIdx = Math.min(
        Math.floor(progress * (routeGeometry.length - 1)),
        routeGeometry.length - 1
      );
      const completedCoords = routeGeometry.slice(0, splitIdx + 1);
      const remainingCoords = routeGeometry.slice(splitIdx);

      if (completedPolylineRef.current) {
        completedPolylineRef.current.setLatLngs(completedCoords);
      }
      if (activePolylineRef.current) {
        activePolylineRef.current.setLatLngs(remainingCoords);
      }

      // 3. Throttled Parent Metrics Update (~100ms throttle via callback ref)
      if (onMetricsUpdateRef.current && timestamp - lastMetricsUpdate > 100) {
        lastMetricsUpdate = timestamp;
        const remFraction = 1 - progress;
        const distanceKm = Math.round(totalDistanceKm * remFraction * 10) / 10;
        const distanceMeters = Math.round(totalDistanceKm * remFraction * 1000);
        const etaMins = Math.max(1, Math.round(totalDurationMins * remFraction));

        let pickupStatus: 'on_the_way' | 'approaching' | 'arrived' | 'collected' = 'on_the_way';
        if (progress >= 0.98 || distanceMeters <= 20) {
          pickupStatus = 'collected';
        } else if (distanceMeters <= 50) {
          pickupStatus = 'arrived';
        } else if (distanceMeters <= 300) {
          pickupStatus = 'approaching';
        }

        onMetricsUpdateRef.current({
          distanceKm,
          distanceMeters,
          etaMins,
          progressPercent: Math.round(progress * 100),
          pickupStatus,
          routingError
        });
      }

      if (progress >= 1) {
        if (onDemoCompleteRef.current) onDemoCompleteRef.current();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animateStep);
    };

    animationFrameRef.current = requestAnimationFrame(animateStep);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isDemoActive, routeGeometry, demoSpeed, totalDistanceKm, totalDurationMins, routingError]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-card">
      {/* OSRM Error Alert */}
      {routingError && (
        <div className="absolute top-4 left-4 right-4 z-[1000] bg-destructive/90 text-destructive-foreground p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Unable to calculate road route. Showing direct vector route.</span>
          </div>
          <button
            onClick={fetchRoadRoute}
            className="flex items-center gap-1 bg-white text-destructive font-bold px-2.5 py-1 rounded-xl transition-colors shadow-sm text-[11px]"
          >
            <RefreshCw className="w-3 h-3 animate-spin-slow" /> Retry
          </button>
        </div>
      )}

      {/* Interactive Leaflet Canvas */}
      <div ref={mapRef} className="w-full h-[520px] md:h-[600px] z-0 bg-muted" />
    </div>
  );
};

export default CitizenLiveMap;
