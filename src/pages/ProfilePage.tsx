import { motion } from "framer-motion";
import { User, Shield, Mail, MapPin, Clock, Activity } from "lucide-react";
import { Link } from "react-router-dom";

interface ProfilePageProps {
  userRole: string | null;
}

const activityLog = [
  { action: "Logged in", time: "2 mins ago" },
  { action: "Viewed dashboard", time: "5 mins ago" },
  { action: "Updated profile", time: "1 hour ago" },
  { action: "Redeemed 500 points", time: "2 hours ago" },
  { action: "Reported garbage at Sector 11", time: "Yesterday" },
];

const ProfilePage = ({ userRole }: ProfilePageProps) => (
  <div className="min-h-screen pt-24 pb-16 px-6">
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/" className="text-sm text-primary hover:underline mb-6 inline-block">← Back to Home</Link>

        <div className="glass-card-static p-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-eco-teal flex items-center justify-center">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Demo User</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><Shield className="w-4 h-4" /> {userRole || "Citizen"}</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><Mail className="w-4 h-4" /> demo@wastewise.ai</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="w-4 h-4" /> New Delhi, India
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card-static p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Activity Log</h3>
            <div className="space-y-3">
              {activityLog.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{a.action}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {a.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="glass-card-static p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Reports Filed</span><span className="text-sm font-semibold text-foreground">24</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Points Earned</span><span className="text-sm font-semibold text-primary">2,550</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Points Redeemed</span><span className="text-sm font-semibold text-foreground">1,200</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Member Since</span><span className="text-sm font-semibold text-foreground">Jan 2026</span></div>
              </div>
            </div>

            <div className="glass-card-static p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Settings</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors">Edit Profile</button>
                <button className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors">Notification Preferences</button>
                <button className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors">Privacy Settings</button>
                <button className="w-full text-left px-3 py-2 text-sm text-eco-rose hover:bg-accent rounded-lg transition-colors">Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);

export default ProfilePage;
