import { motion } from "framer-motion";
import { Home, MapPin, Gift, Camera, CreditCard, Phone, Droplets, Zap, Search, Bell, Upload, ChevronRight, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import mapImage from "@/assets/map-placeholder.png";

const recentPoints = [
  { action: "Weekly Report", points: "+150", time: "Today" },
  { action: "Daily Pickup", points: "+20", time: "Yesterday" },
  { action: "Proper Disposal", points: "+15", time: "Yesterday" },
];

const redeemOptions = [
  { icon: Droplets, label: "Water", points: "+126,466" },
  { icon: Droplets, label: "+220 Bill", points: "" },
  { icon: Phone, label: "Electricity", points: "+11,226" },
  { icon: CreditCard, label: "Mobile Recharge", points: "" },
];

const sidebarItems = [
  { icon: Home, active: true },
  { icon: MapPin },
  { icon: Camera },
  { icon: Gift },
  { icon: CreditCard },
];

const CitizenDashboard = () => {
  const [showUpload, setShowUpload] = useState(false);

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
                <span className="text-5xl font-extrabold text-primary">2,550</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-muted-foreground">Level 3</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">Lvl 3</span>
                  </div>
                  <div className="w-48 h-2 rounded-full bg-accent overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-eco-teal" style={{ width: "85%" }} />
                  </div>
                  <span className="text-xs text-muted-foreground">2,550 of 3,000 points</span>
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
                {recentPoints.map((p, i) => (
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
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/30 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload photo</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Mayur Vihar, Delhi, India</span>
                  </div>
                  <button className="btn-eco w-full text-center" onClick={() => setShowUpload(false)}>Report Garbage</button>
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
                {redeemOptions.map((opt, i) => (
                  <div key={i} className="glass-card p-3 text-center cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-accent mx-auto mb-2 flex items-center justify-center">
                      <opt.icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-xs font-medium text-foreground">{opt.label}</p>
                    {opt.points && <p className="text-xs text-primary">{opt.points}</p>}
                  </div>
                ))}
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
                  <span className="status-green">ETA: 12 mins</span>
                </div>
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
