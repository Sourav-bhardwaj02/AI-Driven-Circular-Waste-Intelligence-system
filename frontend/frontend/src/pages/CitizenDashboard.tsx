import { motion } from "framer-motion";
import { Home, MapPin, Truck, Star, Search, Bell, Camera, Upload, Gift, CreditCard, Droplets, Phone, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import mapImage from "@/assets/map-placeholder.png";
import { getCitizenDashboard, reportGarbage, getNearbyTrucks } from "@/api/dashboard";
import { useAuth } from "@/context/AuthContext";

const CitizenDashboard = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [nearbyTrucks, setNearbyTrucks] = useState({ trucks: [], nearestTruck: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [garbageReport, setGarbageReport] = useState({
    sector: '',
    description: '',
    priority: 'medium',
    image: null as File | null
  });
  
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
        
        const [data, trucks] = await Promise.all([
          getCitizenDashboard(user.id),
          getNearbyTrucks(user.id)
        ]);

        setDashboardData(data);
        setNearbyTrucks(trucks);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthenticated]);

  const handleGarbageReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await reportGarbage({
        citizenId: user.id,
        sector: garbageReport.sector,
        description: garbageReport.description,
        latitude: 28.6139, // Default Delhi coordinates
        longitude: 77.2090,
        priority: garbageReport.priority,
        image: garbageReport.image
      });

      // Reset form
      setGarbageReport({
        sector: '',
        description: '',
        priority: 'medium',
        image: null
      });
      setShowUpload(false);
      
      // Refresh dashboard data
      const data = await getCitizenDashboard(user.id);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error reporting garbage:', err);
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
        <div className="sidebar-icon"><Camera className="w-5 h-5" /></div>
        <div className="sidebar-icon"><Gift className="w-5 h-5" /></div>
        <div className="sidebar-icon"><CreditCard className="w-5 h-5" /></div>
      </div>

      <div className="flex-1 p-6 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground"><span className="font-extrabold">Citizen</span> Dashboard</h1>
              <p className="text-sm text-muted-foreground">Report garbage, track trucks, earn rewards</p>
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
            {/* Reward Points */}
            <div className="lg:col-span-3 glass-card-static p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-foreground">Reward Points</h3>
                <div className="flex gap-2">
                  <Star className="w-5 h-5 text-eco-amber" />
                </div>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-5xl font-extrabold text-primary">{dashboardData.rewardPoints.toLocaleString()}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-muted-foreground">Level {dashboardData.level}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">Lvl {dashboardData.level}</span>
                  </div>
                  <div className="w-48 h-2 rounded-full bg-accent overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-eco-teal" style={{ width: `${dashboardData.progress}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{dashboardData.rewardPoints} of {dashboardData.nextLevelPoints} points</span>
                </div>
              </div>
              <button className="btn-eco w-full text-center text-base py-3">Redeem Rewards</button>
            </div>

            {/* Recently Earned */}
            <div className="lg:col-span-2 glass-card-static p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Recently Earned Points</h3>
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
              <div className="space-y-3">
                {dashboardData.recentPoints.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{p.action}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary">{p.points}</span>
                      <span className="status-green text-xs">{p.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Report Garbage */}
            <div className="lg:col-span-3 glass-card-static p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">Report Garbage</h3>
              </div>
              <div className="rounded-xl overflow-hidden mb-3 relative">
                <img src={mapImage} alt="Report location" className="w-full h-40 object-cover rounded-xl" />
                <div className="absolute bottom-3 left-3 glass-card-static px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Green Park</span>
                </div>
                <span className="absolute bottom-3 right-3 text-sm text-foreground glass-card-static px-2 py-1 rounded-lg">5 mins</span>
              </div>

              {showUpload ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                  <form onSubmit={handleGarbageReport} className="space-y-3">
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/30 transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload photo</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => setGarbageReport({...garbageReport, image: e.target.files?.[0] || null})}
                      />
                    </div>
                    <input 
                      type="text"
                      placeholder="Sector"
                      value={garbageReport.sector}
                      onChange={(e) => setGarbageReport({...garbageReport, sector: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      required
                    />
                    <textarea 
                      placeholder="Description"
                      value={garbageReport.description}
                      onChange={(e) => setGarbageReport({...garbageReport, description: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      rows={3}
                      required
                    />
                    <select 
                      value={garbageReport.priority}
                      onChange={(e) => setGarbageReport({...garbageReport, priority: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>Current location will be used</span>
                    </div>
                    <button type="submit" className="btn-eco w-full text-center">Report Garbage</button>
                  </form>
                </motion.div>
              ) : (
                <button onClick={() => setShowUpload(true)} className="btn-eco-outline w-full flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Upload Photo & Report
                </button>
              )}
            </div>

            {/* Redeem Rewards */}
            <div className="lg:col-span-2 glass-card-static p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4">Redeem Rewards</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="glass-card p-3 text-center cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-accent mx-auto mb-2 flex items-center justify-center">
                    <Droplets className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-foreground">Water</p>
                  <p className="text-xs text-primary">+126,466</p>
                </div>
                <div className="glass-card p-3 text-center cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-accent mx-auto mb-2 flex items-center justify-center">
                    <Droplets className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-foreground">+220 Bill</p>
                </div>
                <div className="glass-card p-3 text-center cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-accent mx-auto mb-2 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-foreground">Electricity</p>
                  <p className="text-xs text-primary">+11,226</p>
                </div>
                <div className="glass-card p-3 text-center cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-accent mx-auto mb-2 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-foreground">Mobile Recharge</p>
                </div>
              </div>
              <button className="btn-purple w-full text-center flex items-center justify-center gap-2">
                Pay Bills <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Track Truck */}
            <div className="lg:col-span-5 glass-card-static p-5">
              <h3 className="text-lg font-semibold text-foreground mb-3">Track Nearby Garbage Truck</h3>
              <div className="rounded-xl overflow-hidden relative">
                <img src={mapImage} alt="Truck tracking" className="w-full h-48 object-cover rounded-xl" />
                <div className="absolute top-3 right-3 glass-card-static px-3 py-1.5 rounded-lg">
                  <span className="status-green">
                    ETA: {nearbyTrucks?.nearestTruck?.eta || 'N/A'} mins
                  </span>
                </div>
                {nearbyTrucks?.trucks?.length > 0 && (
                  <div className="absolute bottom-3 left-3 glass-card-static px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-medium text-foreground">
                      {nearbyTrucks.trucks.length} trucks nearby
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-3">
                <button className="btn-eco flex-1 text-center">Track Truck</button>
                <button className="btn-eco-outline flex-1 text-center">View Schedule</button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
