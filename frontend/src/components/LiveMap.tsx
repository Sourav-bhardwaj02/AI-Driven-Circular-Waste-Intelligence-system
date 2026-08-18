import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { interpolatePosition } from "@/services/osrmRouting";
import { optimizeWasteRoute, OptimizedRoutePlan, RouteStop, DELHI_DEPOT, DELHI_PLANT, DEMO_COLLECTION_STOPS } from "@/services/routeOptimizer";
import { AlertCircle, RefreshCw, Play, Pause, RotateCcw } from "lucide-react";

export interface NavigationMetrics {
  currentLocationName: string;
  currentStopName: string;
  nextStopName: string;
  remainingStopsCount: number;
  totalStopsCount: number;
  totalDistanceKm: number;
  completedDistanceKm: number;
  remainingDistanceKm: number;
  totalDurationMins: number;
  etaMins: number;
  progressPercent: number;
  isDemoActive: boolean;
  routingError?: string | null;
}

interface LiveMapProps {
  collectorMode?: boolean;
  onMetricsUpdate?: (metrics: NavigationMetrics) => void;
  externalDemoTrigger?: boolean;
}

const LiveMap = ({ collectorMode = false, onMetricsUpdate }: LiveMapProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const stopMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const completedPolylineRef = useRef<L.Polyline | null>(null);
  const remainingPolylineRef = useRef<L.Polyline | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentProgressRef = useRef<number>(0);

  // States
  const [routePlan, setRoutePlan] = useState<OptimizedRoutePlan | null>(null);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoSpeed, setDemoSpeed] = useState<number>(1);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Leaflet Marker Icons
  const truckIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-11 h-11 bg-emerald-600 text-white rounded-full shadow-2xl border-2 border-white transform transition-transform hover:scale-110">
        <span class="text-xl">🚛</span>
        <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-ping"></span>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

  const plantIcon = L.divIcon({
    html: `
      <div class="flex items-center justify-center w-10 h-10 bg-slate-900 text-white rounded-xl shadow-xl border-2 border-emerald-400">
        <span class="text-lg">🏭</span>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  const depotIcon = L.divIcon({
    html: `
      <div class="flex items-center justify-center w-9 h-9 bg-blue-600 text-white rounded-full shadow-lg border-2 border-white">
        <span class="text-base">🏢</span>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  // Admin Household Series Dot Icon
  const createHouseDotIcon = (label: string, status: 'pending' | 'in_progress' | 'completed') => {
    let dotBg = 'bg-rose-500 border-rose-300';
    let pulseClass = '';
    let badgeText = label;

    if (status === 'in_progress') {
      dotBg = 'bg-amber-500 border-amber-200';
      pulseClass = 'animate-pulse scale-110';
    } else if (status === 'completed') {
      dotBg = 'bg-emerald-500 border-emerald-200';
    }

    return L.divIcon({
      html: `
        <div class="flex items-center gap-1 px-2 py-0.5 ${dotBg} text-white font-bold text-[10px] rounded-full shadow-md border-2 whitespace-nowrap transition-transform ${pulseClass}">
          <span>🏠</span>
          <span>${badgeText}</span>
        </div>
      `,
      className: 'custom-leaflet-icon',
      iconSize: [50, 24],
      iconAnchor: [25, 12]
    });
  };

  // Calculate & Draw Route via OSRM
  const loadAndCalculateRoute = useCallback(async (stops: RouteStop[] = DEMO_COLLECTION_STOPS) => {
    setIsCalculatingRoute(true);
    setRoutingError(null);

    try {
      const plan = await optimizeWasteRoute(DELHI_DEPOT.coordinates, stops, DELHI_PLANT.coordinates);

      if (plan.osrmResult.error) {
        setRoutingError(plan.osrmResult.error);
        toast({
          title: "Routing Warning",
          description: plan.osrmResult.error,
          variant: "destructive"
        });
      } else {
        setRoutePlan(plan);
        setRoutingError(null);
      }
    } catch (err: any) {
      const errMsg = "Unable to calculate a road route for this location.";
      setRoutingError(errMsg);
      toast({
        title: "OSRM Error",
        description: errMsg,
        variant: "destructive"
      });
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [toast]);

  // Initialize Map ONCE
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([28.5800, 77.2200], 12);

    mapInstance.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    loadAndCalculateRoute();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [loadAndCalculateRoute]);

  // Render Polylines & Household Series Dots ONCE when route loads
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !routePlan || !routePlan.osrmResult.geometry.length) return;

    const fullGeometry = routePlan.osrmResult.geometry;

    // Polylines
    if (completedPolylineRef.current) map.removeLayer(completedPolylineRef.current);
    if (remainingPolylineRef.current) map.removeLayer(remainingPolylineRef.current);

    remainingPolylineRef.current = L.polyline(fullGeometry, {
      color: '#10b981',
      weight: 6,
      opacity: 0.95
    }).addTo(map);

    completedPolylineRef.current = L.polyline([], {
      color: '#6b7280',
      weight: 5,
      opacity: 0.6,
      dashArray: '8, 8'
    }).addTo(map);

    // Initial Truck Marker
    if (truckMarkerRef.current) map.removeLayer(truckMarkerRef.current);
    const startPos = fullGeometry[0];
    truckMarkerRef.current = L.marker(startPos, { icon: truckIcon })
      .addTo(map)
      .bindPopup(`
        <div class="p-2 font-sans">
          <h4 class="font-bold text-sm text-emerald-700 flex items-center gap-1">🚛 Municipal Waste Truck</h4>
          <p class="text-xs text-gray-600 mt-1">Admin Multi-Household Collection Route</p>
        </div>
      `);

    // Fit Bounds
    const bounds = L.latLngBounds(fullGeometry);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Render Household Stop Dots for Admin Overview
    Object.keys(stopMarkersRef.current).forEach(k => map.removeLayer(stopMarkersRef.current[k]));
    stopMarkersRef.current = {};

    let houseCounter = 0;
    routePlan.orderedStops.forEach((stop) => {
      const [lng, lat] = stop.coordinates;

      if (stop.type === 'depot') {
        const marker = L.marker([lat, lng], { icon: depotIcon })
          .addTo(map)
          .bindPopup(`<div class="p-1 font-bold text-xs">🏢 ${stop.name}</div>`);
        stopMarkersRef.current[stop.id] = marker;
      } else if (stop.type === 'plant') {
        const marker = L.marker([lat, lng], { icon: plantIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2 font-sans">
              <h4 class="font-bold text-sm text-slate-900">🏭 Waste Processing Facility</h4>
              <p class="text-xs text-gray-600 mt-1">${stop.name}</p>
            </div>
          `);
        stopMarkersRef.current[stop.id] = marker;
      } else {
        houseCounter++;
        const dotLabel = stop.houseNumber || `#${houseCounter}`;
        const marker = L.marker([lat, lng], { icon: createHouseDotIcon(dotLabel, stop.status) })
          .addTo(map)
          .bindPopup(`
            <div class="p-2 font-sans min-w-[170px]">
              <h4 class="font-bold text-xs text-gray-900">🏠 ${stop.name}</h4>
              <p class="text-xs text-gray-600 mt-1">Est. Pickup: ${stop.estimatedTime || 5} mins</p>
              <p class="text-xs text-emerald-600 font-semibold mt-0.5">Waste: ${stop.wasteAmountKg || 15} kg</p>
            </div>
          `);
        stopMarkersRef.current[stop.id] = marker;
      }
    });

  }, [routePlan]);

  // Socket.IO updates
  useEffect(() => {
    if (!isAuthenticated) return;

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    const socket = socketRef.current;

    if (user?.role === 'collector') {
      socket.emit('join-collector-room', user.id);
    } else {
      socket.emit('join-tracking-room');
    }

    socket.on('collector-location-update', (data: { latitude: number; longitude: number }) => {
      if (!isDemoActive && data.latitude && data.longitude) {
        if (truckMarkerRef.current) {
          truckMarkerRef.current.setLatLng([data.latitude, data.longitude]);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user, isDemoActive]);

  // Glitch-Free Admin Demo Loop
  useEffect(() => {
    if (!isDemoActive || !routePlan || routePlan.osrmResult.geometry.length === 0) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const fullGeometry = routePlan.osrmResult.geometry;
    let lastTimestamp: number | null = null;
    let lastMetricsUpdate = 0;

    const animateStep = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const increment = 0.018 * demoSpeed * deltaTime;
      currentProgressRef.current = Math.min(1, currentProgressRef.current + increment);
      const progress = currentProgressRef.current;

      // 1. Move truck marker cleanly
      const currentCoord = interpolatePosition(fullGeometry, progress);
      if (truckMarkerRef.current) {
        truckMarkerRef.current.setLatLng(currentCoord);
      }

      // 2. Update Polylines cleanly
      const totalNodes = fullGeometry.length;
      const splitIndex = Math.min(
        Math.floor(progress * (totalNodes - 1)),
        totalNodes - 1
      );
      const completedCoords = fullGeometry.slice(0, splitIndex + 1);
      const remainingCoords = fullGeometry.slice(splitIndex);

      if (completedPolylineRef.current) completedPolylineRef.current.setLatLngs(completedCoords);
      if (remainingPolylineRef.current) remainingPolylineRef.current.setLatLngs(remainingCoords);

      // 3. Update Household Dot Icons dynamically based on progress
      let houseCount = 0;
      routePlan.orderedStops.forEach((stop) => {
        if (stop.type === 'collection' && stopMarkersRef.current[stop.id]) {
          houseCount++;
          const stopIndexInPlan = routePlan.orderedStops.findIndex(s => s.id === stop.id);
          const stopFraction = stopIndexInPlan / (routePlan.orderedStops.length - 1);

          let newStatus: 'pending' | 'in_progress' | 'completed' = 'pending';
          if (progress >= stopFraction) {
            newStatus = 'completed';
          } else if (progress >= stopFraction - 0.12) {
            newStatus = 'in_progress';
          }

          const label = stop.houseNumber || `#${houseCount}`;
          stopMarkersRef.current[stop.id].setIcon(createHouseDotIcon(label, newStatus));
        }
      });

      // 4. Throttled Metrics Notification to Parent
      if (onMetricsUpdate && timestamp - lastMetricsUpdate > 120) {
        lastMetricsUpdate = timestamp;
        const totalStopsCount = routePlan.orderedStops.length;
        const collectionStops = routePlan.orderedStops.filter(s => s.type === 'collection');
        
        const activeIndex = Math.min(
          Math.floor(progress * (totalStopsCount - 1)),
          totalStopsCount - 1
        );

        const currentStop = routePlan.orderedStops[activeIndex] || routePlan.orderedStops[0];
        const nextStop = routePlan.orderedStops[activeIndex + 1] || routePlan.orderedStops[totalStopsCount - 1];

        const completedKm = Math.round(routePlan.totalDistanceKm * progress * 10) / 10;
        const remainingKm = Math.round((routePlan.totalDistanceKm - completedKm) * 10) / 10;

        const remainingStopsCount = Math.max(0, totalStopsCount - activeIndex - 1);
        const etaMins = Math.round(routePlan.totalDurationMins * (1 - progress));

        onMetricsUpdate({
          currentLocationName: currentStop.name,
          currentStopName: currentStop.name,
          nextStopName: nextStop.name,
          remainingStopsCount,
          totalStopsCount: collectionStops.length,
          totalDistanceKm: routePlan.totalDistanceKm,
          completedDistanceKm: completedKm,
          remainingDistanceKm: remainingKm,
          totalDurationMins: routePlan.totalDurationMins,
          etaMins,
          progressPercent: Math.round(progress * 100),
          isDemoActive,
          routingError
        });
      }

      if (progress >= 1) {
        setIsDemoActive(false);
        toast({
          title: "Demo Completed",
          description: "Truck reached Okhla Waste Processing Plant! All household pickups completed.",
        });
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animateStep);
    };

    animationFrameRef.current = requestAnimationFrame(animateStep);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isDemoActive, routePlan, demoSpeed, toast, onMetricsUpdate, routingError]);

  // Simulation Controls
  const handleToggleDemo = () => {
    if (routingError) {
      toast({
        title: "Cannot Start Demo",
        description: "Please retry road routing calculation first.",
        variant: "destructive"
      });
      return;
    }
    if (currentProgressRef.current >= 1) {
      currentProgressRef.current = 0;
    }
    setIsDemoActive(prev => !prev);
  };

  const handleResetDemo = () => {
    setIsDemoActive(false);
    currentProgressRef.current = 0;
    if (routePlan && routePlan.osrmResult.geometry.length > 0) {
      if (truckMarkerRef.current) {
        truckMarkerRef.current.setLatLng(routePlan.osrmResult.geometry[0]);
      }
      if (remainingPolylineRef.current) {
        remainingPolylineRef.current.setLatLngs(routePlan.osrmResult.geometry);
      }
      if (completedPolylineRef.current) {
        completedPolylineRef.current.setLatLngs([]);
      }
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">

      {/* TOP FLOATING OVERLAY: NAVIGATION METRICS HEADER */}
      <div className="absolute top-4 left-4 right-4 z-[1000] bg-background/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg">
            🚛
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Admin Municipal Live Tracking</h3>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-600 font-semibold rounded-full border border-indigo-500/20">
                Household Series Connected
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Full ward overview showing series of household collection dots along municipal truck route
            </p>
          </div>
        </div>

        {/* CONTROLS BAR */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleToggleDemo}
            disabled={isCalculatingRoute || !!routingError}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm ${
              isDemoActive
                ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isDemoActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isDemoActive ? 'Pause Tracking' : 'Track the Collector'}
          </button>

          <button
            onClick={handleResetDemo}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl transition-colors"
            title="Reset Route Position"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <select
            value={demoSpeed}
            onChange={(e) => setDemoSpeed(Number(e.target.value))}
            className="bg-accent text-accent-foreground text-xs font-semibold px-2.5 py-2 rounded-xl border border-border outline-none"
          >
            <option value={1}>1x Speed</option>
            <option value={2}>2x Speed</option>
            <option value={5}>5x Speed</option>
          </select>
        </div>
      </div>

      {/* OSRM ERROR BANNER OVERLAY */}
      {routingError && (
        <div className="absolute top-24 left-4 right-4 z-[1000] bg-destructive text-destructive-foreground p-4 rounded-xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Unable to calculate a road route for this location.</span>
          </div>
          <button
            onClick={() => loadAndCalculateRoute()}
            className="flex items-center gap-1.5 bg-white text-destructive hover:bg-gray-100 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            Retry
          </button>
        </div>
      )}

      {/* BOTTOM ROUTE PROGRESS INFO CARD */}
      {routePlan && !routingError && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-background/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-accent/40 border border-border">
            <span className="text-[10px] text-muted-foreground font-medium block">Route Distance</span>
            <span className="text-sm font-bold text-foreground">{routePlan.totalDistanceKm} km</span>
          </div>

          <div className="p-2.5 rounded-lg bg-accent/40 border border-border">
            <span className="text-[10px] text-muted-foreground font-medium block">Estimated Duration</span>
            <span className="text-sm font-bold text-foreground">{routePlan.totalDurationMins} mins</span>
          </div>

          <div className="p-2.5 rounded-lg bg-accent/40 border border-border">
            <span className="text-[10px] text-muted-foreground font-medium block">Progress</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${Math.round(currentProgressRef.current * 100)}%` }}
                ></div>
              </div>
              <span className="font-bold text-emerald-600 text-xs">{Math.round(currentProgressRef.current * 100)}%</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-700 font-medium block">Destination Plant</span>
            <span className="text-xs font-bold text-emerald-800 truncate block">{DELHI_PLANT.name}</span>
          </div>
        </div>
      )}

      {/* LEAFLET MAP ELEMENT */}
      <div
        ref={mapRef}
        className="w-full h-[620px] z-0 bg-muted"
      />

    </div>
  );
};

export default LiveMap;