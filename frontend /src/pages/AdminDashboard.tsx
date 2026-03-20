import { motion } from "framer-motion";
import { Home, ClipboardList, BarChart3, MessageSquare, MapPin, Users, Cloud, Bell, Search, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import mapImage from "@/assets/map-placeholder.png";
import heatmapImage from "@/assets/heatmap-placeholder.png";

const pieData = [
  { name: "Dry", value: 48, color: "hsl(155, 65%, 42%)" },
  { name: "Wet", value: 41, color: "hsl(175, 55%, 45%)" },
  { name: "Hazardous", value: 11, color: "hsl(350, 70%, 58%)" },
];

const areaData = [
  { month: "Jan", pickups: 2100, complaints: 180 },
  { month: "Feb", pickups: 2400, complaints: 150 },
  { month: "Mar", pickups: 2800, complaints: 120 },
  { month: "Apr", pickups: 3100, complaints: 90 },
  { month: "May", pickups: 3400, complaints: 75 },
  { month: "Jun", pickups: 3200, complaints: 85 },
];

const complaints = [
  { sector: "Sector 11", time: "Just now", status: "Resolved" },
  { sector: "Green Park", time: "15 mins ago", status: "In Progress" },
  { sector: "Lajpat Nagar", time: "32 mins ago", status: "Pending" },
  { sector: "Mayur Vihar", time: "1 hour ago", status: "Resolved" },
];

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
                <span className="text-xs text-muted-foreground">1110 - 30%</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-3">
                      <span className="text-2xl font-bold" style={{ color: d.color }}>{d.value}%</span>
                      <span className="text-sm text-foreground">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border">
                <div><p className="stat-value">109.2k</p><p className="stat-label">Dry Waste</p></div>
                <div><p className="stat-value">93.5k</p><p className="stat-label">Wet Waste</p></div>
                <div><p className="stat-value">23.6k</p><p className="stat-label">Hazardous</p></div>
              </div>
            </div>

            {/* Complaints Heatmap */}
            <div className="lg:col-span-2 glass-card-static p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">Complaints Heatmap</h3>
                <span className="status-green">Low</span>
              </div>
              <div className="rounded-xl overflow-hidden">
                <img src={heatmapImage} alt="Complaints heatmap" className="w-full h-48 object-cover rounded-xl" />
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">20</span>
              </div>
            </div>

            {/* Collection Progress */}
            <div className="lg:col-span-3 glass-card-static p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4">Garbage Collection Progress</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
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
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" /><span className="stat-value text-xl">86,199</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-eco-amber" /><span className="stat-value text-xl">93.5k</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-eco-rose" /><span className="stat-value text-xl">23.6k</span></div>
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
                {complaints.map((c, i) => (
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
