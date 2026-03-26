import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Truck, Clock, CheckCircle, AlertCircle, Route, Navigation, Users } from "lucide-react";
import LiveMap from "./LiveMap";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

interface RouteStats {
  totalDistance: number;
  totalTime: number;
  completedStops: number;
  totalStops: number;
  efficiency: number;
}

const LiveTracking = () => {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [wastePoints, setWastePoints] = useState<WasteCollectionPoint[]>([]);
  const [selectedCollector, setSelectedCollector] = useState<string | null>(null);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Ensure collectors is always an array
  const safeCollectors = collectors || [];
  const safeWastePoints = wastePoints || [];

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchTrackingData();
    
    // Set up real-time updates
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
      } else if (collectorsResponse.status === 401) {
        setError('Authentication failed. Please login again.');
      }

      if (wasteResponse.ok) {
        const wasteData = await wasteResponse.json();
        if (wasteData.success && wasteData.data) {
          setWastePoints(wasteData.data);
        }
      } else if (wasteResponse.status === 401) {
        setError('Authentication failed. Please login again.');
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching tracking data:', error);
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
      case 'offline': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateEfficiency = (collector: Collector) => {
    if (collector.totalCollections === 0) return 0;
    return Math.round((collector.completedCollections / collector.totalCollections) * 100);
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
          <p className="text-muted-foreground">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Live Waste Collection Tracking</h1>
              <p className="text-muted-foreground mt-1">Real-time monitoring of garbage collectors and waste collection points</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${realTimeMode ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {realTimeMode ? 'Live Updates' : 'Static View'}
                </span>
              </div>
              <button
                onClick={() => setRealTimeMode(!realTimeMode)}
                className={`btn-${realTimeMode ? 'eco-outline' : 'eco'} text-sm px-4 py-2`}
              >
                {realTimeMode ? 'Pause Updates' : 'Resume Live'}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
              <button 
                onClick={fetchTrackingData}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Last Update Info */}
          {lastUpdate && !error && (
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
              <button 
                onClick={fetchTrackingData}
                className="hover:text-primary transition-colors"
              >
                Refresh Now
              </button>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="glass-card-static p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Collectors</p>
                  <p className="text-2xl font-bold text-foreground">
                    {safeCollectors.filter(c => c.status === 'active' || c.status === 'in_progress').length || 0}
                  </p>
                </div>
                <Truck className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            <div className="glass-card-static p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Collections</p>
                  <p className="text-2xl font-bold text-foreground">
                    {safeWastePoints.filter(w => w.status === 'pending').length || 0}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-eco-rose" />
              </div>
            </div>
            
            <div className="glass-card-static p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-foreground">
                    {safeWastePoints.filter(w => w.status === 'in_progress').length || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="glass-card-static p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold text-foreground">
                    {safeWastePoints.filter(w => w.status === 'completed').length || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2">
              <div className="glass-card-static p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Live Collection Map
                </h2>
                <LiveMap collectorMode={user?.role === 'collector'} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Collectors List */}
              <div className="glass-card-static p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Active Collectors
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {safeCollectors.map((collector) => (
                    <motion.div
                      key={collector.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCollector === collector.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedCollector(collector.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(collector.status)}
                          <span className="font-medium text-foreground">{collector.username}</span>
                        </div>
                        <span className={`text-xs ${getStatusColor(collector.status)}`}>
                          {collector.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          Progress: {collector.completedCollections}/{collector.totalCollections}
                        </div>
                        <div>
                          Efficiency: {calculateEfficiency(collector)}%
                        </div>
                      </div>
                      
                      {collector.currentRoute && (
                        <div className="mt-2 text-xs text-primary">
                          Route: {collector.currentRoute}
                        </div>
                      )}
                      
                      {collector.estimatedTimeRemaining && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Est. remaining: {collector.estimatedTimeRemaining} mins
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {safeCollectors.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No active collectors
                    </p>
                  )}
                </div>
              </div>

              {/* Waste Points Summary */}
              <div className="glass-card-static p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Route className="w-5 h-5 text-primary" />
                  Collection Points
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {safeWastePoints.slice(0, 10).map((point) => (
                    <div key={point.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground text-sm">{point.area}</span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(point.priority)}`}>
                          {point.priority}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        {getStatusIcon(point.status)}
                        <span>{point.status.replace('_', ' ')}</span>
                        <span>• {point.estimatedTime} mins</span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {point.wasteTypes.map(w => `${w.type}(${w.amount}kg)`).join(', ')}
                      </div>
                      
                      {point.assignedCollector && (
                        <div className="mt-1 text-xs text-primary">
                          Assigned: {point.assignedCollector}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {safeWastePoints.length > 10 && (
                    <p className="text-center text-xs text-muted-foreground pt-2">
                      And {(safeWastePoints.length || 0) - 10} more points...
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              {user?.role === 'admin' && (
                <div className="glass-card-static p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-primary" />
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button className="btn-eco text-sm w-full py-2">
                      Optimize All Routes
                    </button>
                    <button className="btn-eco-outline text-sm w-full py-2">
                      Send Alerts
                    </button>
                    <button className="btn-eco-outline text-sm w-full py-2">
                      Export Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveTracking;