import { motion } from "framer-motion";
import { Home, MapPin, ClipboardList, Clock, Navigation, Truck, CheckCircle, Circle, Star, Search, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import mapImage from "@/assets/map-placeholder.png";
import { getCollectorDashboard, updateRouteStatus } from "@/api/dashboard";
import { useAuth } from "@/context/AuthContext";

const CollectorDashboard = () => {
  const [routeStarted, setRouteStarted] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getCollectorDashboard(user.id);
        setDashboardData(data);
        setRouteStarted(data.routeStarted);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthenticated]);

  const handleRouteToggle = async () => {
    if (!dashboardData?.currentRoute || !user) return;
    
    try {
      const newStatus = routeStarted ? 'assigned' : 'in_progress';
      await updateRouteStatus(dashboardData.currentRoute.routeCode, newStatus);
      
      // Refresh dashboard data
      const data = await getCollectorDashboard(user.id);
      setDashboardData(data);
      setRouteStarted(data.routeStarted);
    } catch (err: any) {
      console.error('Error updating route status:', err);
      setError(err.message);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please login to access your dashboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center glass-card-static p-6 rounded-xl max-w-md">
          <p className="text-eco-rose mb-4">{error}</p>
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

  if (!dashboardData) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No dashboard data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 flex">
      <div className="hidden md:flex flex-col items-center gap-3 p-4 glass-card-static rounded-none min-h-screen w-20">
        <div className="sidebar-icon active"><Home className="w-5 h-5" /></div>
        <div className="sidebar-icon"><MapPin className="w-5 h-5" /></div>
        <div className="sidebar-icon"><ClipboardList className="w-5 h-5" /></div>
        <div className="sidebar-icon"><Navigation className="w-5 h-5" /></div>
        <div className="sidebar-icon"><Truck className="w-5 h-5" /></div>
        <div className="sidebar-icon"><Clock className="w-5 h-5" /></div>
      </div>

      <div className="flex-1 p-6 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Garbage Collector Dashboard</h1>
              <p className="text-sm text-muted-foreground">Route optimization & task management</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="glass-card-static px-3 py-2 flex items-center gap-2 rounded-xl">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input placeholder="Search..." className="bg-transparent text-sm outline-none w-32" />
              </div>
              <button className="sidebar-icon !w-10 !h-10"><Bell className="w-4 h-4" /></button>
              <Link to="/" className="text-sm text-primary hover:underline">← Back</Link>
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-5">
            {/* Assigned Route */}
            <div className="lg:col-span-3 glass-card-static p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">Assigned Routes</h3>
                <span className="text-xs text-muted-foreground">210 - 2093</span>
              </div>
              {dashboardData.currentRoute ? (
                <>
                  <div className="mb-3">
                    <p className="text-xl font-bold text-foreground">{dashboardData.currentRoute.routeCode}</p>
                    <p className="text-sm text-muted-foreground">{dashboardData.currentRoute.areas}</p>
                    <span className="status-green mt-2 inline-block">
                      {new Date(dashboardData.currentRoute.scheduledStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(dashboardData.currentRoute.scheduledEnd).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </>
              ) : (
                <div className="mb-3">
                  <p className="text-xl font-bold text-foreground">No Route Assigned</p>
                  <p className="text-sm text-muted-foreground">Check back later for route assignments</p>
                </div>
              )}
              <div className="rounded-xl overflow-hidden mb-3">
                <img src={mapImage} alt="Route map" className="w-full h-56 object-cover rounded-xl" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {routeStarted ? (
                    <span className="status-green animate-pulse-glow">Route Active</span>
                  ) : (
                    <span className="status-amber">Route Pending</span>
                  )}
                  <span className="text-xs text-muted-foreground">AI Optimized</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-eco-amber" />
                  <span className="text-sm font-semibold text-foreground">{dashboardData.rewardPoints}</span>
                </div>
              </div>
            </div>

            {/* Map + Tasks */}
            <div className="lg:col-span-2 space-y-5">
              <div className="glass-card-static p-5">
                <div className="rounded-xl overflow-hidden mb-3">
                  <img src={mapImage} alt="Navigation" className="w-full h-36 object-cover rounded-xl" />
                </div>
                <button 
                  onClick={handleRouteToggle}
                  disabled={!dashboardData.currentRoute}
                  className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    routeStarted ? "bg-eco-rose/10 text-eco-rose border border-eco-rose/30" : "btn-eco"
                  }`}
                >
                  {routeStarted ? "Stop Route" : "Start Route"}
                </button>
              </div>

              <div className="glass-card-static p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-foreground">Today's Task List</h3>
                </div>
                <div className="space-y-3">
                  {dashboardData.pickups.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {p.status === "Completed" || p.status === "Completing" ? (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-foreground">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{p.time}</span>
                        <span className={p.status === "Completing" || p.status === "Completed" ? "status-green" : "status-rose"}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Collection Progress */}
            <div className="lg:col-span-3 glass-card-static p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Garbage Collection Progress</h3>
                <span className="text-xs text-muted-foreground">Rot: Lajpat Nagar</span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {dashboardData.areas.map((a, i) => (
                  <div key={i} className="text-center">
                    <span className="status-green text-xs mb-2 inline-block">{a.name}</span>
                    <p className="stat-value text-xl">{a.value}</p>
                    <p className="stat-label">{a.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reward Points */}
            <div className="lg:col-span-2 glass-card-static p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">Reward Points</h3>
                <span className="text-lg font-bold text-primary">{dashboardData.rewardPoints}</span>
              </div>
              <div className="glass-card-static p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-eco-teal flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">GlassGrow</p>
                  <p className="text-xs text-muted-foreground">₹2000 Card</p>
                </div>
                <span className="ml-auto text-sm font-bold text-primary">₹200.00</span>
              </div>
              <div className="mt-3 p-3 rounded-xl bg-accent/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Route Optimization:</span>
                  <span className="status-green">ENABLED</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CollectorDashboard;
