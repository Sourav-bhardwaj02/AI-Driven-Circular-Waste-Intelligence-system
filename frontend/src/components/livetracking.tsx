import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Truck, Clock, CheckCircle, AlertCircle, Route, Navigation, Users, Navigation2, ArrowRight } from "lucide-react";
import LiveMap, { NavigationMetrics } from "./LiveMap";
import { useAuth } from "@/context/AuthContext";

interface Collector {
  id: string;
  username: string;
  status: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  currentRoute?: string;
  completedCollections: number;
  totalCollections: number;
  estimatedTimeRemaining?: number;
}

interface WasteCollectionPoint {
  id: string;
  area: string;
  coordinates: [number, number];
  status: 'pending' | 'in_progress' | 'completed';
  wasteTypes: { type: string; amount: number }[];
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
  assignedCollector?: string;
}

const LiveTracking = () => {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [wastePoints, setWastePoints] = useState<WasteCollectionPoint[]>([]);
  const [selectedCollector, setSelectedCollector] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Real-time Navigation Metrics from OSRM & LiveMap
  const [navMetrics, setNavMetrics] = useState<NavigationMetrics | null>(null);

  const { user, isAuthenticated } = useAuth();

  const safeCollectors = collectors || [];
  const safeWastePoints = wastePoints || [];

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchTrackingData();
    
    const interval = realTimeMode ? setInterval(fetchTrackingData, 5000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, realTimeMode]);

  const fetchTrackingData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('wastewise_token');
      
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
      }

      const [collectorsResponse, wasteResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/tracking/collectors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => {
          console.warn('Failed to fetch collectors:', err);
          return { ok: false };
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/tracking/waste-locations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => {
          console.warn('Failed to fetch waste locations:', err);
          return { ok: false };
        })
      ]);

      if (collectorsResponse.ok) {
        const collectorsData = await collectorsResponse.json();
        if (collectorsData.success && collectorsData.data?.collectors) {
          setCollectors(collectorsData.data.collectors);
        }
      }

      if (wasteResponse.ok) {
        const wasteData = await wasteResponse.json();
        if (wasteData.success && wasteData.data) {
          setWastePoints(wasteData.data);
        }
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError('Failed to fetch tracking data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'idle': return 'text-yellow-600';
      case 'offline': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Truck className="w-4 h-4" />;
      case 'idle': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please login to view live tracking</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading OSRM Road Navigation & Tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-foreground">OSRM Live Road Navigation</h1>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 font-bold text-xs rounded-full border border-emerald-500/20">
                  OpenStreetMap + OSRM
                </span>
              </div>
              <p className="text-muted-foreground mt-1">Real-time street-level navigation and municipal truck tracking</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 glass-card-static rounded-xl text-xs">
                <div className={`w-2.5 h-2.5 rounded-full ${realTimeMode ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-muted-foreground font-medium">
                  {realTimeMode ? 'Socket Live' : 'Static View'}
                </span>
              </div>
              <button
                onClick={() => setRealTimeMode(!realTimeMode)}
                className={`btn-${realTimeMode ? 'eco-outline' : 'eco'} text-xs px-4 py-2 rounded-xl`}
              >
                {realTimeMode ? 'Pause Socket' : 'Resume Socket'}
              </button>
            </div>
          </div>

          {/* OSRM Error Alert */}
          {navMetrics?.routingError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Unable to calculate a road route for this location.</h4>
                  <p className="text-xs text-destructive/80 mt-0.5">Please check network connection or retry OSRM API.</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Dashboard Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="glass-card-static p-4 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Current Stop</p>
                  <p className="text-sm font-bold text-foreground truncate max-w-[140px] mt-1">
                    {navMetrics?.currentStopName || 'Central Depot'}
                  </p>
                </div>
                <Navigation2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>

            <div className="glass-card-static p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Next Stop</p>
                  <p className="text-sm font-bold text-foreground truncate max-w-[140px] mt-1">
                    {navMetrics?.nextStopName || 'Okhla Plant'}
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-blue-500" />
              </div>
            </div>

            <div className="glass-card-static p-4 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Remaining Stops</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {navMetrics ? `${navMetrics.remainingStopsCount} stops` : '5 stops'}
                  </p>
                </div>
                <MapPin className="w-6 h-6 text-amber-500" />
              </div>
            </div>

            <div className="glass-card-static p-4 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Est. Arrival (ETA)</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {navMetrics ? `${navMetrics.etaMins} mins` : '35 mins'}
                  </p>
                </div>
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
            </div>

            <div className="glass-card-static p-4 border-l-4 border-l-teal-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Route</p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {navMetrics ? `${navMetrics.totalDistanceKm} km (${navMetrics.totalDurationMins} min)` : '16.4 km'}
                  </p>
                </div>
                <Route className="w-6 h-6 text-teal-500" />
              </div>
            </div>
          </div>

          {/* Main Grid: LiveMap + Right Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: OSRM Map Container */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-card-static p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    OSRM Road Route Map
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    Attribution: OpenStreetMap contributors
                  </span>
                </div>
                
                <LiveMap 
                  collectorMode={user?.role === 'collector'} 
                  onMetricsUpdate={setNavMetrics} 
                />
              </div>
            </div>

            {/* Right: Sidebar Cards */}
            <div className="space-y-6">
              
              {/* Route Navigation Summary Card */}
              {navMetrics && (
                <div className="glass-card-static p-6 border border-emerald-500/20 bg-emerald-500/5">
                  <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-emerald-600" />
                    Live Route Navigation
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Route Progress</span>
                      <span className="font-bold text-emerald-600">{navMetrics.progressPercent}% Completed</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Distance Covered</span>
                      <span className="font-semibold text-foreground">{navMetrics.completedDistanceKm} / {navMetrics.totalDistanceKm} km</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Remaining Distance</span>
                      <span className="font-semibold text-foreground">{navMetrics.remainingDistanceKm} km</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Tracking Engine</span>
                      <span className="font-bold text-emerald-600 uppercase">OSRM Driving</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Collectors List */}
              <div className="glass-card-static p-6">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Active Collectors ({safeCollectors.length})
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {safeCollectors.map((collector) => (
                    <div
                      key={collector.id}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedCollector === collector.id 
                          ? 'border-emerald-500 bg-emerald-500/10' 
                          : 'border-border hover:border-emerald-500/40'
                      }`}
                      onClick={() => setSelectedCollector(collector.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 font-medium text-xs text-foreground">
                          {getStatusIcon(collector.status)}
                          <span>{collector.username}</span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold ${getStatusColor(collector.status)}`}>
                          {collector.status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
                        <span>Collections: {collector.completedCollections}/{collector.totalCollections}</span>
                        <span className="text-emerald-600 font-semibold">Active</span>
                      </div>
                    </div>
                  ))}
                  
                  {safeCollectors.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      No active collectors online
                    </p>
                  )}
                </div>
              </div>

              {/* Destination Facility Card */}
              <div className="glass-card-static p-6">
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Route className="w-5 h-5 text-slate-800" />
                  Disposal Facility
                </h3>
                <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1">
                  <p className="font-bold text-emerald-400">Okhla Waste-to-Energy Facility</p>
                  <p className="text-[11px] text-slate-300">Coordinates: 77.2798, 28.5284</p>
                  <p className="text-[10px] text-slate-400 mt-2">Final destination after completing all municipal collection stops.</p>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveTracking;