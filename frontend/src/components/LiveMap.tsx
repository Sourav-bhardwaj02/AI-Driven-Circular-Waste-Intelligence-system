import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CollectorLocation {
  id: string;
  username: string;
  latitude: number;
  longitude: number;
  status: string;
  currentRoute?: string;
}

interface WasteLocation {
  id: string;
  area: string;
  coordinates: [number, number];
  status: 'pending' | 'in_progress' | 'completed';
  wasteTypes: { type: string; amount: number }[];
  estimatedTime: number;
}

interface OptimizedRoute {
  routeCode: string;
  name: string;
  waypoints: Array<{
    id: string;
    coordinates: [number, number];
    area: string;
    estimatedTime: number;
    order: number;
  }>;
  totalTime: number;
  totalDistance: number;
}

const LiveMap = ({ collectorMode = false }: { collectorMode?: boolean }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markers = useRef<{ [key: string]: L.Marker }>({});
  const routeLine = useRef<L.Polyline | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  const [collectors, setCollectors] = useState<CollectorLocation[]>([]);
  const [wasteLocations, setWasteLocations] = useState<WasteLocation[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Custom icons
  const collectorIcon = L.divIcon({
    html: `<div class="collector-marker">
      <div class="truck-icon">🚛</div>
      <div class="pulse"></div>
    </div>`,
    className: 'custom-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  const wasteIcon = L.divIcon({
    html: `<div class="waste-marker">
      <div class="waste-icon">🗑️</div>
    </div>`,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  const completedWasteIcon = L.divIcon({
    html: `<div class="waste-marker completed">
      <div class="waste-icon">✅</div>
    </div>`,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initialize socket connection
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    
    const socket = socketRef.current;

    // Join room based on user role
    if (user?.role === 'collector') {
      socket.emit('join-collector-room', user.id);
    } else {
      socket.emit('join-tracking-room');
    }

    // Listen for collector location updates
    socket.on('collector-location-update', (data: CollectorLocation) => {
      setCollectors(prev => {
        const updated = prev.filter(c => c.id !== data.id);
        return [...updated, data];
      });
      
      updateCollectorMarker(data);
    });

    // Listen for waste location updates
    socket.on('waste-locations-update', (locations: WasteLocation[]) => {
      setWasteLocations(locations);
      updateWasteMarkers(locations);
    });

    // Listen for route updates
    socket.on('route-update', (route: OptimizedRoute) => {
      setOptimizedRoute(route);
      updateRouteDisplay(route);
    });

    // Listen for collection status updates
    socket.on('collection-status-update', (data: { id: string; status: string }) => {
      setWasteLocations(prev => 
        prev.map(w => w.id === data.id ? { ...w, status: data.status as any } : w)
      );
      updateWasteMarkerStatus(data.id, data.status);
    });

    return () => {
      socket.off('collector-location-update');
      socket.off('waste-locations-update');
      socket.off('route-update');
      socket.off('collection-status-update');
      socket.disconnect();
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize map
    mapInstance.current = L.map(mapRef.current).setView([28.6139, 77.2090], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OpenStreetMap",
    }).addTo(mapInstance.current);

    // Fetch initial data
    fetchInitialData();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('wastewise_token');
      
      if (!token) {
        console.warn('No authentication token found');
        // Continue with demo data without authentication
        loadDemoData();
        return;
      }
      
      // Fetch waste locations
      const wasteResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/tracking/waste-locations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (wasteResponse.ok) {
        const wasteData = await wasteResponse.json();
        if (wasteData.success && Array.isArray(wasteData.data)) {
          setWasteLocations(wasteData.data);
          updateWasteMarkers(wasteData.data);
        }
      } else {
        console.warn('Failed to fetch waste locations, using demo data');
        loadDemoData();
      }

      // Fetch collector locations
      const collectorResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/tracking/collectors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (collectorResponse.ok) {
        const collectorData = await collectorResponse.json();
        if (collectorData.success && Array.isArray(collectorData.data?.collectors)) {
          setCollectors(collectorData.data.collectors);
          collectorData.data.collectors.forEach(updateCollectorMarker);
        }
      } else {
        console.warn('Failed to fetch collectors, using demo data');
        loadDemoData();
      }

      // If collector, fetch their optimized route
      if (user?.role === 'collector') {
        const routeResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/tracking/optimize-route/my-route`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (routeResponse.ok) {
          const routeData = await routeResponse.json();
          if (routeData.success) {
            setOptimizedRoute(routeData.data);
            updateRouteDisplay(routeData.data);
          }
        }
      }

      // Always add demo data for demonstration
      loadDemoData();

    } catch (error) {
      console.error('Error fetching initial data:', error);
      console.log('Loading demo data instead');
      loadDemoData();
      toast({ title: "Warning", description: "Using demo data. Backend may not be available.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = () => {
    // Add sample collector data for demonstration
    const demoCollector = {
      id: 'demo-collector-1',
      username: 'Rajesh Kumar',
      latitude: 28.6139,
      longitude: 77.2090,
      status: 'active',
      currentRoute: 'G-0923'
    };
    setCollectors(prev => {
      const exists = prev.find(c => c.id === demoCollector.id);
      if (!exists) return [...prev, demoCollector];
      return prev;
    });
    updateCollectorMarker(demoCollector);

    // Add sample waste points for demonstration
    const sampleWastePoints: WasteLocation[] = [
      {
        id: 'demo-waste-1',
        area: 'Sector 11 Market Complex',
        coordinates: [77.2090, 28.6139],
        status: 'pending',
        wasteTypes: [{ type: 'dry', amount: 45 }, { type: 'wet', amount: 35 }],
        estimatedTime: 15
      },
      {
        id: 'demo-waste-2',
        area: 'Green Park Colony',
        coordinates: [77.2150, 28.6180],
        status: 'pending',
        wasteTypes: [{ type: 'dry', amount: 30 }, { type: 'hazardous', amount: 8 }],
        estimatedTime: 20
      },
      {
        id: 'demo-waste-3',
        area: 'Sector 12 Residential',
        coordinates: [77.2190, 28.6239],
        status: 'in_progress',
        wasteTypes: [{ type: 'wet', amount: 55 }, { type: 'dry', amount: 20 }],
        estimatedTime: 12
      },
      {
        id: 'demo-waste-4',
        area: 'Lajpat Nagar Market',
        coordinates: [77.2250, 28.6280],
        status: 'pending',
        wasteTypes: [{ type: 'dry', amount: 40 }, { type: 'wet', amount: 30 }],
        estimatedTime: 25
      },
      {
        id: 'demo-waste-5',
        area: 'Mayur Vihar Community Center',
        coordinates: [77.2310, 28.6330],
        status: 'completed',
        wasteTypes: [{ type: 'hazardous', amount: 12 }, { type: 'dry', amount: 25 }],
        estimatedTime: 18
      }
    ];
    
    setWasteLocations(prev => {
      const existing = prev.filter(w => !w.id.startsWith('demo-'));
      return [...existing, ...sampleWastePoints];
    });
    updateWasteMarkers([...wasteLocations.filter(w => !w.id.startsWith('demo-')), ...sampleWastePoints]);

    // Create demo optimized route showing shortest path
    const demoRoute: OptimizedRoute = {
      routeCode: 'G-0923',
      name: 'South Delhi Central Route - Optimized',
      waypoints: [
        {
          id: 'demo-waypoint-1',
          coordinates: [77.2090, 28.6139],
          area: 'Sector 11 Market Complex',
          estimatedTime: 15,
          order: 1
        },
        {
          id: 'demo-waypoint-2',
          coordinates: [77.2150, 28.6180],
          area: 'Green Park Colony',
          estimatedTime: 20,
          order: 2
        },
        {
          id: 'demo-waypoint-3',
          coordinates: [77.2190, 28.6239],
          area: 'Sector 12 Residential',
          estimatedTime: 12,
          order: 3
        },
        {
          id: 'demo-waypoint-4',
          coordinates: [77.2250, 28.6280],
          area: 'Lajpat Nagar Market',
          estimatedTime: 25,
          order: 4
        },
        {
          id: 'demo-waypoint-5',
          coordinates: [77.2310, 28.6330],
          area: 'Mayur Vihar Center',
          estimatedTime: 18,
          order: 5
        }
      ],
      totalTime: 90,
      totalDistance: 12.5
    };
    
    setOptimizedRoute(demoRoute);
    updateRouteDisplay(demoRoute);
  };

  const updateCollectorMarker = (collector: CollectorLocation) => {
    if (!mapInstance.current) return;
    
    const markerId = `collector-${collector.id}`;
    
    if (markers.current[markerId]) {
      markers.current[markerId].setLatLng([collector.latitude, collector.longitude]);
    } else {
      const marker = L.marker([collector.latitude, collector.longitude], { icon: collectorIcon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div class="collector-popup">
            <h3>${collector.username}</h3>
            <p>Status: ${collector.status}</p>
            ${collector.currentRoute ? `<p>Route: ${collector.currentRoute}</p>` : ''}
          </div>
        `);
      markers.current[markerId] = marker;
    }
  };

  const updateWasteMarkers = (locations: WasteLocation[]) => {
    if (!mapInstance.current) return;

    // Clear existing waste markers
    Object.keys(markers.current).forEach(key => {
      if (key.startsWith('waste-')) {
        mapInstance.current?.removeLayer(markers.current[key]);
        delete markers.current[key];
      }
    });

    // Add new waste markers
    locations.forEach(location => {
      const markerId = `waste-${location.id}`;
      const icon = location.status === 'completed' ? completedWasteIcon : wasteIcon;
      
      const marker = L.marker([location.coordinates[1], location.coordinates[0]], { icon })
        .addTo(mapInstance.current!)
        .bindPopup(`
          <div class="waste-popup">
            <h3>${location.area}</h3>
            <p>Status: ${location.status}</p>
            <p>Waste Types: ${location.wasteTypes.map(w => `${w.type}(${w.amount}kg)`).join(', ')}</p>
            ${location.estimatedTime ? `<p>Est. Time: ${location.estimatedTime} mins</p>` : ''}
            ${collectorMode && location.status !== 'completed' ? 
              `<button onclick="collectWaste('${location.id}')" class="collect-btn">Collect Waste</button>` : ''}
          </div>
        `);
      markers.current[markerId] = marker;
    });
  };

  const updateWasteMarkerStatus = (wasteId: string, status: string) => {
    if (!mapInstance.current) return;
    
    const markerId = `waste-${wasteId}`;
    const marker = markers.current[markerId];
    
    if (marker) {
      const icon = status === 'completed' ? completedWasteIcon : wasteIcon;
      marker.setIcon(icon);
    }
  };

  const updateRouteDisplay = async (route: OptimizedRoute) => {
    if (!mapInstance.current) return;

    // Clear existing route line
    if (routeLine.current) {
      mapInstance.current.removeLayer(routeLine.current);
      routeLine.current = null;
    }

    if (!route.waypoints || route.waypoints.length < 2) return;

    const coords = route.waypoints
      .map((wp) => `${wp.coordinates[0]},${wp.coordinates[1]}`)
      .join(';');

    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
      );

      if (!res.ok) {
        throw new Error(`OSRM request failed with status ${res.status}`);
      }

      const data = await res.json();

      if (data.routes && data.routes.length > 0 && data.routes[0]?.geometry?.coordinates) {
        const routeGeo = data.routes[0].geometry;
        const leafletCoords = routeGeo.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as [number, number]
        );

        routeLine.current = L.polyline(leafletCoords, {
          color: '#10b981',
          weight: 5,
          opacity: 0.9
        }).addTo(mapInstance.current);

        mapInstance.current.fitBounds(routeLine.current.getBounds(), { padding: [50, 50] });
      }
    } catch (err) {
      console.error("Routing error:", err);

      // Fallback to direct polyline if OSRM is unavailable.
      const coordinates = route.waypoints.map(
        (wp) => [wp.coordinates[1], wp.coordinates[0]] as [number, number]
      );
      routeLine.current = L.polyline(coordinates, {
        color: '#10b981',
        weight: 5,
        opacity: 0.9
      }).addTo(mapInstance.current);
      mapInstance.current.fitBounds(routeLine.current.getBounds(), { padding: [50, 50] });
    }
  };

  const handleCollectWaste = async (wasteId: string) => {
    try {
      const token = localStorage.getItem('wastewise_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/tracking/collect-waste/${wasteId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Success", description: "Waste collection started" });
        
        // Emit real-time update
        socketRef.current?.emit('waste-collection-update', {
          wasteId,
          status: 'in_progress',
          collectorId: user?.id
        });
      } else {
        throw new Error(data.message || 'Failed to collect waste');
      }
    } catch (error: any) {
      console.error('Error collecting waste:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleOptimizeRoute = async () => {
    if (!selectedRoute) {
      toast({ title: "Error", description: "Please select a route first", variant: "destructive" });
      return;
    }

    try {
      const token = localStorage.getItem('wastewise_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/tracking/optimize-route/${selectedRoute}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        setOptimizedRoute(data.data);
        updateRouteDisplay(data.data);
        toast({ title: "Success", description: "Route optimized successfully" });
      } else {
        throw new Error(data.message || 'Failed to optimize route');
      }
    } catch (error: any) {
      console.error('Error optimizing route:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    (window as any).collectWaste = handleCollectWaste;
  }, []);

  return (
  <div className="relative w-full">

    {/* HEADER */}
    <div className="absolute top-3 left-3 right-3 z-[1000] bg-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      
      <div>
        <h3 className="text-sm font-bold">
          🗺️ Live Waste Collection Tracking
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Real-time monitoring of garbage collectors and waste collection points
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <span>Active Route</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Collectors</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Completed</span>
        </div>
      </div>
    </div>

    {/* LOGIN PANEL */}
    <div className="absolute bottom-3 left-3 z-[1000] bg-white p-3 rounded-xl shadow-lg text-[11px] max-w-[260px]">
      <h4 className="font-bold text-xs mb-2">🔑 Login Credentials</h4>

      <div className="flex flex-col gap-1">
        <div className="bg-gray-100 p-2 rounded">
          <strong>Admin:</strong> admin@wastewise.com / admin123
        </div>
        <div className="bg-gray-100 p-2 rounded">
          <strong>Citizen:</strong> citizen@wastewise.com / citizen123
        </div>
        <div className="bg-gray-100 p-2 rounded">
          <strong>Collector:</strong> collector@wastewise.com / collector123
        </div>
      </div>
    </div>

    {/* ROUTE PANEL */}
    {optimizedRoute && (
      <div className="absolute bottom-3 right-3 z-[1000] bg-white p-3 rounded-xl shadow-lg text-xs max-w-[220px]">
        <h4 className="font-bold mb-2">🚛 Route Info</h4>

        <div className="flex flex-col gap-1">
          <div className="font-semibold">
            {optimizedRoute.name}
          </div>
          <div>⏱️ {optimizedRoute.totalTime} mins</div>
          <div>📏 {optimizedRoute.totalDistance} km</div>
          <div>📍 {optimizedRoute.waypoints.length} stops</div>
        </div>
      </div>
    )}

    {/* MAP */}
    <div
      ref={mapRef}
      className="w-full h-[600px] rounded-xl overflow-hidden"
    />

  </div>
);
};

export default LiveMap;