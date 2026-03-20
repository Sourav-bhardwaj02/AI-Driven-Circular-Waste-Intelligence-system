import { motion } from "framer-motion";
import { Gift, Droplets, Phone, Zap, CreditCard, Star, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const rewards = [
  { icon: Droplets, title: "Water Bill", discount: "Up to ₹500", points: 500 },
  { icon: Zap, title: "Electricity Bill", discount: "Up to ₹1,000", points: 1000 },
  { icon: Phone, title: "Mobile Recharge", discount: "Up to ₹200", points: 200 },
  { icon: CreditCard, title: "Gift Cards", discount: "Up to ₹2,000", points: 2000 },
];

const history = [
  { type: "Weekly Report Bonus", points: "+150", date: "Today" },
  { type: "Daily Pickup Completion", points: "+20", date: "Yesterday" },
  { type: "Proper Disposal Verified", points: "+15", date: "Yesterday" },
  { type: "Community Challenge Won", points: "+300", date: "3 days ago" },
  { type: "Referral Bonus", points: "+100", date: "1 week ago" },
];

const RewardsPage = () => (
  <div className="min-h-screen pt-24 pb-16 px-6">
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/" className="text-sm text-primary hover:underline mb-6 inline-block">← Back to Home</Link>
        <h1 className="section-title mb-2">Rewards Center</h1>
        <p className="section-subtitle mb-10">Earn cashback for responsible waste management</p>

        {/* Points Overview */}
        <div className="glass-card-static p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-eco-teal flex items-center justify-center">
                <Star className="w-10 h-10 text-primary-foreground" />
              </div>
              <div>
                <p className="text-4xl font-extrabold text-primary">2,550</p>
                <p className="text-sm text-muted-foreground">Available Points · Level 3</p>
                <div className="w-48 h-2 rounded-full bg-accent mt-2 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-eco-teal" style={{ width: "85%" }} />
                </div>
              </div>
            </div>
            <button className="btn-eco text-base px-8 py-3 flex items-center gap-2">
              <Gift className="w-5 h-5" /> Redeem Now
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Redeem Options */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Redeem Options</h2>
            <div className="grid grid-cols-2 gap-4">
              {rewards.map((r, i) => (
                <motion.div key={r.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="glass-card p-4 text-center cursor-pointer">
                  <div className="w-14 h-14 rounded-full bg-accent mx-auto mb-3 flex items-center justify-center">
                    <r.icon className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground mb-2">{r.discount}</p>
                  <span className="text-xs font-medium text-primary">{r.points} pts</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* History */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Points History</h2>
            <div className="glass-card-static p-5 space-y-3">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{h.type}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">{h.points}</span>
                    <span className="text-xs text-muted-foreground">{h.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How to Earn */}
        <div className="glass-card-static p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">How to Earn Points</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {["Report garbage properly", "Complete daily pickups", "Win community challenges", "Refer new users"].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);

export default RewardsPage;
