import { motion } from "framer-motion";
import { Users, MessageSquare, ThumbsUp, Award, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const posts = [
  { user: "Priya S.", content: "Our sector achieved 95% segregation this month! Great teamwork everyone!", likes: 42, comments: 8, time: "2 hours ago" },
  { user: "Rahul M.", content: "The AI classifier is incredibly accurate. It correctly identified hazardous waste from my old batteries.", likes: 28, comments: 5, time: "5 hours ago" },
  { user: "Anita K.", content: "Love the new reward system! Already redeemed points for my electricity bill.", likes: 56, comments: 12, time: "1 day ago" },
];

const leaderboard = [
  { name: "Green Park Colony", points: 12500, rank: 1 },
  { name: "Sector 11 RWA", points: 10800, rank: 2 },
  { name: "Model Town Block A", points: 9200, rank: 3 },
  { name: "Mayur Vihar Phase 2", points: 8700, rank: 4 },
];

const CommunityPage = () => (
  <div className="min-h-screen pt-24 pb-16 px-6">
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/" className="text-sm text-primary hover:underline mb-6 inline-block">← Back to Home</Link>
        <h1 className="section-title mb-2">Community Hub</h1>
        <p className="section-subtitle mb-10">Connect, compete, and contribute to a cleaner city</p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {posts.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card-static p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-eco-teal flex items-center justify-center text-primary-foreground font-bold text-sm">{p.user[0]}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.user}</p>
                    <p className="text-xs text-muted-foreground">{p.time}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground mb-4">{p.content}</p>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"><ThumbsUp className="w-4 h-4" /> {p.likes}</button>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"><MessageSquare className="w-4 h-4" /> {p.comments}</button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-5">
            <div className="glass-card-static p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-eco-amber" /> Leaderboard</h3>
              <div className="space-y-3">
                {leaderboard.map(l => (
                  <div key={l.rank} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${l.rank <= 3 ? "bg-gradient-to-br from-eco-amber to-primary text-primary-foreground" : "bg-accent text-muted-foreground"}`}>{l.rank}</span>
                      <span className="text-sm text-foreground">{l.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{l.points.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card-static p-5">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Active Communities</span><span className="text-sm font-semibold text-foreground">156</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Reports</span><span className="text-sm font-semibold text-foreground">24,500+</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Points Distributed</span><span className="text-sm font-semibold text-foreground">1.2M</span></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);

export default CommunityPage;
