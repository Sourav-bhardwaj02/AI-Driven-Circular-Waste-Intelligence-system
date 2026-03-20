import { motion } from "framer-motion";
import { Home, MapPin, ClipboardList, Clock, Navigation, Truck, CheckCircle, Circle, Star, Search, Bell } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import mapImage from "@/assets/map-placeholder.png";

const pickups = [
  { name: "Pickup Points Sector 11", time: "19 mins ago", status: "Completing" },
  { name: "Park Street 2", time: "35 mins ago", status: "Processed" },
  { name: "Market Area 1", time: "35 mins ago", status: "Collected" },
  { name: "Block C Apartments", time: "1 hour ago", status: "Completed" },
];

const areas = [
  { name: "Sarangar", value: "86,199", label: "Sewer Points" },
  { name: "Green Park", value: "93.5k", label: "Smart Bins" },
  { name: "Pool Street", value: "23.6k", label: "Street Points" },
  { name: "Free Mark", value: "23.6k", label: "Smart Points" },
];

const sidebarItems = [
  { icon: Home, active: true },
  { icon: MapPin },
  { icon: ClipboardList },
  { icon: Navigation },
  { icon: Truck },
  { icon: Clock },
];

const CollectorDashboard = () => {
  const [routeStarted, setRouteStarted] = useState(false);

  return (
    <div className="min-h-screen pt-20 flex">
      <div className="hidden md:flex flex-col items-center gap-3 p-4 glass-card-static rounded-none min-h-screen w-20">
        {sidebarItems.map((item, i) => (
          <div key={i} className={`sidebar-icon ${item.active ? "active" : ""}`}>
            <item.icon className="w-5 h-5" />
          </div>
        ))}
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
              <div className="mb-3">
                <p className="text-xl font-bold text-foreground">G-0923</p>
                <p className="text-sm text-muted-foreground">Sector 11 · Sector 12</p>
                <span className="status-green mt-2 inline-block">8:00 AM - 11:10 AM</span>
              </div>
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
                  <span className="text-sm font-semibold text-foreground">30</span>
                </div>
              </div>
            </div>

            {/* Map + Tasks */}
            <div className="lg:col-span-2 space-y-5">
              <div className="glass-card-static p-5">
                <div className="rounded-xl overflow-hidden mb-3">
                  <img src={mapImage} alt="Navigation" className="w-full h-36 object-cover rounded-xl" />
                </div>
                <button onClick={() => setRouteStarted(!routeStarted)} className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${routeStarted ? "bg-eco-rose/10 text-eco-rose border border-eco-rose/30" : "btn-eco"}`}>
                  {routeStarted ? "Stop Route" : "Start Route"}
                </button>
              </div>

              <div className="glass-card-static p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-foreground">Today's Task List</h3>
                </div>
                <div className="space-y-3">
                  {pickups.map((p, i) => (
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
                {areas.map(a => (
                  <div key={a.name} className="text-center">
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
                <span className="text-lg font-bold text-primary">435</span>
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
