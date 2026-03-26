import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, Truck, AlertTriangle, Users, Route } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LiveMap from "@/components/LiveMap";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL);
interface Collector {
  id: string;
  username: string;
  profile: {
    firstName?: string;
    lastName?: string;
  };
  rewardPoints: number;
  location: {
    type: string;
    coordinates: [number, number];
  };
  activeRoute: {
    id: string;
    routeCode: string;
    name: string;
    status: string;
    checkpoints: any[];
  } | null;
  distance?: number;
  eta?: number;
  lastLocationUpdate?: string;
}

interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  type: string;
  status: string;
}

const LiveTrackingPage = () => {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [selectedCollector, setSelectedCollector] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setElapsedTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
  if (!navigator.geolocation) return;

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      socket.emit("send-location", {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    },
    console.error,
    { enableHighAccuracy: true }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch collectors and heatmap data
        const [collectorsResponse, heatmapResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/tracking/collectors`),
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/tracking/heatmap`)
        ]);

        if (!collectorsResponse.ok || !heatmapResponse.ok) {
          throw new Error('Failed to fetch tracking data');
        }

        const collectorsData = await collectorsResponse.json();
        const heatmapData = await heatmapResponse.json();

        if (collectorsData.success) {
          setCollectors(collectorsData.data);
        }

        if (heatmapData.success) {
          setHeatmapData(heatmapData.data);
        }
      } catch (err: any) {
        console.error('Error fetching tracking data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time updates
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const getCollectorName = (collector: Collector) => {
    if (collector.profile.firstName && collector.profile.lastName) {
      return `${collector.profile.firstName} ${collector.profile.lastName}`;
    }
    return collector.username;
  };

  const initializeMap = () => {
    if (!mapRef.current) return;

    // This would initialize OpenStreetMap with Leaflet
    // For now, we'll show a placeholder with real data
    console.log('Map would be initialized here with collectors:', collectors);
    console.log('Heatmap data:', heatmapData);
  };

  useEffect(() => {
    initializeMap();
  }, [collectors, heatmapData]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please login to access live tracking</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center glass-card-static p-6 rounded-xl max-w-md">
          <AlertTriangle className="w-12 h-12 text-eco-rose mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Tracking</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-eco"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="text-sm text-primary hover:underline mb-6 inline-block">← Back to Home</Link>
          <h1 className="section-title mb-2">Live Tracking</h1>
          <p className="section-subtitle mb-8">Track garbage collectors in real-time with AI-optimized routes</p>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2 glass-card-static p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">Live Map</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live · {formatTime(elapsedTime)}</span>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden relative" ref={mapRef}>
                {/* OpenStreetMap would be rendered here */}
                {/* <div className="w-full h-96 bg-accent/20 rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">OpenStreetMap Integration</p>
                    <p className="text-xs text-muted-foreground">
                      {collectors.length} active collectors tracked
                    </p>
                  </div>
                </div> */}
                <div className="rounded-xl overflow-hidden relative" ref={mapRef}>
                  <LiveMap />
                </div>

                {/* Real collector positions */}
                {collectors.map((collector, index) => (
                  <motion.div
                    key={collector.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 cursor-pointer transition-all ${
                      selectedCollector === index ? "scale-125 border-primary bg-primary" : "border-border bg-accent"
                    }`}
                    style={{ 
                      top: `${20 + (index * 15) % 60}%`, 
                      left: `${10 + (index * 20) % 70}%` 
                    }}
                    onClick={() => setSelectedCollector(index)}
                  >
                    <Truck className="w-5 h-5" />
                  </motion.div>
                ))}

                {/* Route visualization for selected collector */}
                {selectedCollector !== null && collectors[selectedCollector]?.activeRoute && (
                  <div className="absolute bottom-3 left-3 glass-card-static px-3 py-1.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Route className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-foreground">
                        {collectors[selectedCollector].activeRoute.routeCode}
                      </span>
                      <span className="status-green text-xs">
                        {collectors[selectedCollector].activeRoute.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {selectedCollector !== null && collectors[selectedCollector] && (
                <div className="mt-4 p-3 rounded-xl bg-accent/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Route: {collectors[selectedCollector].activeRoute?.name || 'No Active Route'}
                    </span>
                    {collectors[selectedCollector].activeRoute?.status === 'in_progress' && (
                      <span className="status-green ml-auto">AI Optimized</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {collectors[selectedCollector].activeRoute?.checkpoints?.length || 0} checkpoints • 
                    {collectors[selectedCollector].eta ? ` ETA: ${collectors[selectedCollector].eta} mins` : ' Calculating...'}
                  </div>
                </div>
              )}
            </div>

            {/* Collector List */}
            <div className="space-y-4">
              <div className="glass-card-static p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Active Collectors</h3>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{collectors.length}</span>
                  </div>
                </div>
                
                {collectors.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No active collectors</p>
                ) : (
                  <div className="space-y-3">
                    {collectors.map((collector, index) => (
                      <div 
                        key={collector.id} 
                        onClick={() => setSelectedCollector(index)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedCollector === index ? "border-primary bg-accent" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {getCollectorName(collector)}
                          </span>
                          <span className={
                            collector.activeRoute?.status === 'in_progress' 
                              ? "status-green" 
                              : collector.activeRoute?.status === 'assigned'
                              ? "status-amber"
                              : "status-rose"
                          }>
                            {collector.activeRoute?.status || 'Offline'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3" /> 
                            {collector.activeRoute?.routeCode || 'No Route'}
                          </span>
                          {collector.distance && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> 
                              {collector.distance.toFixed(1)} km
                            </span>
                          )}
                        </div>
                        {collector.eta && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-primary font-medium">
                            <Clock className="w-3 h-3" /> ETA: {collector.eta} mins
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card-static p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">System Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Route Optimization</span>
                    <span className="status-green">ENABLED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">GPS Tracking</span>
                    <span className="status-green">LIVE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">AI Engine</span>
                    <span className="status-green">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Heatmap Points</span>
                    <span className="text-primary">{heatmapData.length}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card-static p-5">
                <p className="text-xs text-muted-foreground italic mb-3">
                  "AI automatically optimizes routes based on real-time waste density and traffic conditions."
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Real-time GPS tracking
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <span className="w-2 h-2 rounded-full bg-eco-amber" />
                    AI route optimization
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <span className="w-2 h-2 rounded-full bg-eco-teal" />
                    Fuel efficient paths
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveTrackingPage;
