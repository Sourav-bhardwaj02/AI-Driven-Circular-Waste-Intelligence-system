import { motion } from "framer-motion";
import { Home, ClipboardList, BarChart3, MessageSquare, MapPin, Users, Cloud, Bell, Search, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import mapImage from "@/assets/map-placeholder.png";
import heatmapImage from "@/assets/heatmap-placeholder.png";
import { useDashboard } from "@/context/DashboardContext";

const sidebarItems = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: ClipboardList, label: "Complaints" },
  { icon: BarChart3, label: "Analytics" },
  { icon: MessageSquare, label: "Reports" },
  { icon: MapPin, label: "Tracking" },
  { icon: Users, label: "Collectors" },
  { icon: Cloud, label: "AI Engine" },
];

const AdminDashboard = () => {
  const [activeTab] = useState(0);
  const { data, complaints, loading, error } = useDashboard();

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
          <AlertTriangle className="w-12 h-12 text-eco-rose mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Dashboard</h3>
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

  if (!data) {
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
      {/* Sidebar */}
      <div className="hidden md:flex flex-col items-center gap-3 p-4 glass-card-static rounded-none min-h-screen w-20">
        {sidebarItems.map((item, i) => (
          <div key={item.label} className={`sidebar-icon ${i === activeTab ? "active" : ""}`} title={item.label}>
            <item.icon className="w-5 h-5" />
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 p-6 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Municipal Collector Dashboard</h1>
              <p className="text-sm text-muted-foreground">Real-time city waste management overview</p>
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
            {/* City Overview */}
            <div className="lg:col-span-3 glass-card-static p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">City Overview</h3>
                <span className="text-xs text-muted-foreground">{data.stats?.totalCollections || 0} collections</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.pieData} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {data.pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {data.pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-3">
                      <span className="text-2xl font-bold" style={{ color: d.color }}>{d.value}%</span>
                      <span className="text-sm text-foreground">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border">
                <div><p className="stat-value">{data.pieData?.find(d => d.name === 'Dry')?.value || 0}%</p><p className="stat-label">Dry Waste</p></div>
                <div><p className="stat-value">{data.pieData?.find(d => d.name === 'Wet')?.value || 0}%</p><p className="stat-label">Wet Waste</p></div>
                <div><p className="stat-value">{data.pieData?.find(d => d.name === 'Hazardous')?.value || 0}%</p><p className="stat-label">Hazardous</p></div>
              </div>
            </div>

            {/* Complaints Heatmap */}
            <div className="lg:col-span-2 glass-card-static p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">Complaints Heatmap</h3>
                <span className={data.stats?.pendingComplaints > 10 ? "status-amber" : "status-green"}>
                  {data.stats?.pendingComplaints > 10 ? "High" : "Low"}
                </span>
              </div>
              <div className="rounded-xl overflow-hidden">
                <img src={heatmapImage} alt="Complaints heatmap" className="w-full h-48 object-cover rounded-xl" />
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{complaints?.length || 0}</span>
              </div>
            </div>

            {/* Collection Progress */}
            <div className="lg:col-span-3 glass-card-static p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4">Garbage Collection Progress</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.areaData}>
                    <defs>
                      <linearGradient id="pickupGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(155, 65%, 42%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(155, 65%, 42%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="pickups" stroke="hsl(155, 65%, 42%)" fill="url(#pickupGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" /><span className="stat-value text-xl">{data.areaData?.reduce((sum, d) => sum + d.pickups, 0).toLocaleString() || 0}</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-eco-amber" /><span className="stat-value text-xl">{data.stats?.activeCollectors || 0}</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-eco-rose" /><span className="stat-value text-xl">{data.stats?.pendingComplaints || 0}</span></div>
              </div>
            </div>

            {/* GPS Tracking */}
            <div className="lg:col-span-2 glass-card-static p-5">
              <h3 className="text-lg font-semibold text-foreground mb-3">Live GPS Tracking</h3>
              <div className="rounded-xl overflow-hidden mb-3">
                <img src={mapImage} alt="Live tracking map" className="w-full h-40 object-cover rounded-xl" />
              </div>
              <div className="flex gap-2">
                <button className="btn-eco text-xs py-2 px-4 flex-1">Track Truck</button>
                <button className="btn-eco-outline text-xs py-2 px-4 flex-1">Send Alert</button>
              </div>
            </div>

            {/* Recent Complaints */}
            <div className="lg:col-span-5 glass-card-static p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Recent Complaints</h3>
                <button className="text-sm text-primary hover:underline flex items-center gap-1">View All <ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                {complaints?.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`w-4 h-4 ${c.status === "Resolved" ? "text-primary" : c.status === "In Progress" ? "text-eco-amber" : "text-eco-rose"}`} />
                      <span className="text-sm font-medium text-foreground">{c.sector}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{c.time}</span>
                    <span className={c.status === "Resolved" ? "status-green" : c.status === "In Progress" ? "status-amber" : "status-rose"}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
