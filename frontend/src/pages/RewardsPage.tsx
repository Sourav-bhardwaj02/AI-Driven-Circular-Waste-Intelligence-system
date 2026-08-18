import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Droplets,
  Phone,
  Zap,
  CreditCard,
  Star,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  ShoppingCart,
  Ticket,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface RewardOption {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  points: number;
  icon: any;
  color: string;
  badge?: string;
}

const REWARD_CATALOG: RewardOption[] = [
  {
    id: "water_bill",
    category: "water_bill",
    title: "DJB Water Bill",
    subtitle: "Up to ₹500 discount on Delhi Jal Board",
    points: 500,
    icon: Droplets,
    color: "from-blue-500 to-cyan-500",
    badge: "Popular"
  },
  {
    id: "electricity_bill",
    category: "electricity_bill",
    title: "BSES Electricity Bill",
    subtitle: "Up to ₹1,000 off power utility bill",
    points: 1000,
    icon: Zap,
    color: "from-amber-500 to-yellow-500",
    badge: "High Value"
  },
  {
    id: "mobile_recharge",
    category: "mobile_recharge",
    title: "Mobile Recharge",
    subtitle: "Instant ₹200 recharge coupon (Jio/Airtel/Vi)",
    points: 200,
    icon: Phone,
    color: "from-emerald-500 to-teal-500"
  },
  {
    id: "amazon_gift",
    category: "bill_payment",
    title: "Amazon Eco Voucher",
    subtitle: "₹1,500 Amazon Pay gift voucher",
    points: 1500,
    icon: Gift,
    color: "from-orange-500 to-amber-600",
    badge: "Hot"
  },
  {
    id: "metro_card",
    category: "bill_payment",
    title: "DMRC Metro Topup",
    subtitle: "₹400 Delhi Metro Smart Card credit",
    points: 400,
    icon: Ticket,
    color: "from-red-500 to-rose-600"
  },
  {
    id: "shopping_card",
    category: "bill_payment",
    title: "Flipkart Green Card",
    subtitle: "₹800 voucher for eco-friendly products",
    points: 800,
    icon: ShoppingCart,
    color: "from-purple-500 to-indigo-600"
  }
];

const RewardsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [points, setPoints] = useState<number>(user?.rewardPoints || 0);
  const [level, setLevel] = useState<number>(user?.level || 1);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Redemption modal state
  const [selectedReward, setSelectedReward] = useState<RewardOption | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<{ voucherCode: string; title: string } | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter for history
  const [historyFilter, setHistoryFilter] = useState<'all' | 'earned' | 'redeemed'>('all');

  const userId = user?.id || (user as any)?._id;

  const fetchRewardsData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API}/citizen/rewards/${userId}`);
      const data = await res.json();

      if (data.success || Array.isArray(data)) {
        const txList = data.transactions || (Array.isArray(data) ? data : []);
        setTransactions(txList);
        if (data.rewardPoints !== undefined) setPoints(data.rewardPoints);
        if (data.level !== undefined) setLevel(data.level);
      }
    } catch (err) {
      console.error("Error fetching rewards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardsData();
  }, [userId]);

  // Handle Daily Check-in Claim
  const handleDailyClaim = async () => {
    if (!userId) return;
    setClaiming(true);
    setClaimMsg(null);
    try {
      const res = await fetch(`${API}/citizen/daily-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();

      if (data.success) {
        setPoints(data.newBalance);
        if (data.level) setLevel(data.level);
        setClaimMsg({ type: 'success', text: data.message });
        fetchRewardsData();
      } else {
        setClaimMsg({ type: 'error', text: data.message });
      }
    } catch (err) {
      setClaimMsg({ type: 'error', text: 'Network error claiming daily bonus' });
    } finally {
      setClaiming(false);
    }
  };

  // Handle Reward Redemption
  const handleRedeem = async () => {
    if (!selectedReward || !userId) return;
    setRedeeming(true);
    setRedeemError(null);
    try {
      const res = await fetch(`${API}/citizen/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          category: selectedReward.category,
          amount: selectedReward.points,
          description: selectedReward.title
        })
      });
      const data = await res.json();

      if (data.success) {
        setPoints(data.newBalance);
        setRedeemSuccess({ voucherCode: data.voucherCode, title: selectedReward.title });
        fetchRewardsData();
      } else {
        setRedeemError(data.message || 'Redemption failed');
      }
    } catch (err) {
      setRedeemError('Network error during redemption');
    } finally {
      setRedeeming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredTransactions = transactions.filter(t => {
    if (historyFilter === 'earned') return t.type === 'earned';
    if (historyFilter === 'redeemed') return t.type === 'redeemed';
    return true;
  });

  const nextLevelPoints = level * 500;
  const progressPercent = Math.min(100, Math.round(((points % 500) / 500) * 100));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center glass-card-static p-8 rounded-2xl max-w-sm">
          <Gift className="w-12 h-12 text-primary mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Please login to view & redeem rewards</p>
          <Link to="/" className="btn-eco px-5 py-2 text-sm inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="text-sm text-primary hover:underline mb-6 inline-block">← Back to Home</Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="section-title mb-1 flex items-center gap-3">
                <Gift className="w-8 h-8 text-primary" />
                Rewards Center
              </h1>
              <p className="section-subtitle">Earn cashback & vouchers for responsible waste management</p>
            </div>

            {/* Daily Check-in Button */}
            <button
              onClick={handleDailyClaim}
              disabled={claiming}
              className="btn-eco px-5 py-3 flex items-center gap-2 font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              {claiming ? "Claiming..." : "Daily Check-in (+25 Pts)"}
            </button>
          </div>

          {/* Daily claim feedback alert */}
          <AnimatePresence>
            {claimMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-xl mb-6 flex items-center justify-between gap-3 text-sm font-medium ${
                  claimMsg.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {claimMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                  <span>{claimMsg.text}</span>
                </div>
                <button onClick={() => setClaimMsg(null)} className="text-xs hover:underline">Dismiss</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Points Overview Card */}
          <div className="glass-card-static p-6 md:p-8 mb-8 rounded-2xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-eco-teal flex items-center justify-center shadow-lg text-white">
                  <Star className="w-10 h-10 fill-current text-amber-300" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-black text-primary">{points.toLocaleString()}</span>
                    <span className="text-sm font-semibold text-muted-foreground">Pts Available</span>
                  </div>
                  <p className="text-sm text-foreground font-medium mt-1">Level {level} Environmental Champion</p>
                  
                  {/* Progress bar to next level */}
                  <div className="w-56 h-2.5 rounded-full bg-accent mt-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-400 to-eco-teal transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {500 - (points % 500)} pts needed for Level {level + 1}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="glass-card p-4 rounded-xl text-center min-w-[120px]">
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                  <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    +{transactions.filter(t => t.type === 'earned').reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="glass-card p-4 rounded-xl text-center min-w-[120px]">
                  <p className="text-xs text-muted-foreground">Total Redeemed</p>
                  <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                    -{transactions.filter(t => t.type === 'redeemed').reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Redeem Options (2 columns) */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Redeem Rewards
                </h2>
                <span className="text-xs text-muted-foreground">Instant Digital Vouchers</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {REWARD_CATALOG.map((r, i) => {
                  const canAfford = points >= r.points;
                  const Icon = r.icon;

                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => {
                        setSelectedReward(r);
                        setRedeemSuccess(null);
                        setRedeemError(null);
                      }}
                      className={`glass-card p-5 rounded-2xl cursor-pointer relative flex flex-col justify-between transition-all hover:scale-[1.02] ${
                        !canAfford ? 'opacity-85' : 'hover:shadow-lg'
                      }`}
                    >
                      {r.badge && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm">
                          {r.badge}
                        </span>
                      )}

                      <div>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white mb-3 shadow-md`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-foreground">{r.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">{r.subtitle}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/60 pt-3">
                        <span className="text-sm font-extrabold text-primary flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                          {r.points.toLocaleString()} pts
                        </span>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${
                          canAfford
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-accent text-muted-foreground'
                        }`}>
                          {canAfford ? "Redeem" : "Need Pts"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Points History (1 column) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Points History
                </h2>
              </div>

              {/* History Filter Tabs */}
              <div className="flex gap-1 p-1 bg-accent rounded-xl mb-4 text-xs font-medium">
                {(['all', 'earned', 'redeemed'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setHistoryFilter(f)}
                    className={`flex-1 py-1.5 rounded-lg capitalize transition-all ${
                      historyFilter === f
                        ? 'bg-background text-foreground shadow-sm font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="glass-card-static p-4 rounded-2xl max-h-[440px] overflow-y-auto space-y-3">
                {loading ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">Loading history...</div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">No transactions found</div>
                ) : (
                  filteredTransactions.map((h, i) => (
                    <div
                      key={h._id || i}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-accent/40 transition-colors border-b border-border/50 last:border-0"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-foreground truncate">{h.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`text-xs font-extrabold flex-shrink-0 ${
                        h.type === 'earned' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {h.type === 'earned' ? `+${h.amount}` : `-${h.amount}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* How to Earn Points Section */}
          <div className="glass-card-static p-6 md:p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-eco-amber" />
              How to Earn Eco Points
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Garbage Reporting", desc: "Report uncollected waste with photos", pts: "+15 Pts" },
                { title: "Daily Check-in", desc: "Log in daily to claim bonus points", pts: "+25 Pts" },
                { title: "Proper Segregation", desc: "Segregate dry & wet waste at pickup", pts: "+50 Pts" },
                { title: "Community Leaderboard", desc: "Rank top in your society leaderboard", pts: "+200 Pts" }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-accent/30 border border-border/40 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block mb-2">
                      {item.pts}
                    </span>
                    <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Redemption Confirmation Modal */}
      <AnimatePresence>
        {selectedReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card-static w-full max-w-md p-6 rounded-2xl shadow-2xl relative bg-background border border-border"
            >
              <button
                onClick={() => setSelectedReward(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </button>

              {!redeemSuccess ? (
                <div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedReward.color} flex items-center justify-center text-white mb-4 shadow-lg mx-auto`}>
                    <selectedReward.icon className="w-8 h-8" />
                  </div>

                  <h3 className="text-xl font-extrabold text-foreground text-center mb-1">{selectedReward.title}</h3>
                  <p className="text-xs text-muted-foreground text-center mb-6">{selectedReward.subtitle}</p>

                  <div className="bg-accent/40 p-4 rounded-xl mb-6 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="font-extrabold text-primary">{selectedReward.points.toLocaleString()} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your Balance:</span>
                      <span className="font-bold text-foreground">{points.toLocaleString()} pts</span>
                    </div>
                    <div className="flex justify-between border-t border-border/60 pt-2">
                      <span className="text-muted-foreground">Balance After:</span>
                      <span className={`font-bold ${points - selectedReward.points >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {(points - selectedReward.points).toLocaleString()} pts
                      </span>
                    </div>
                  </div>

                  {redeemError && (
                    <div className="p-3 mb-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 text-xs font-semibold">
                      {redeemError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedReward(null)}
                      className="flex-1 py-3 text-sm font-semibold rounded-xl bg-accent text-foreground hover:bg-accent/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRedeem}
                      disabled={redeeming || points < selectedReward.points}
                      className="flex-1 py-3 text-sm font-bold rounded-xl btn-eco disabled:opacity-50"
                    >
                      {redeeming ? "Processing..." : points < selectedReward.points ? "Insufficient Pts" : "Confirm Redeem"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Success View with Voucher Code */
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-1">Voucher Claimed!</h3>
                  <p className="text-xs text-muted-foreground mb-6">
                    Here is your digital voucher code for <span className="font-bold text-foreground">{redeemSuccess.title}</span>
                  </p>

                  <div className="bg-accent/60 border border-primary/30 p-4 rounded-2xl mb-6 relative flex items-center justify-between">
                    <span className="text-xl font-mono font-black text-primary tracking-widest">
                      {redeemSuccess.voucherCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(redeemSuccess.voucherCode)}
                      className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1 text-xs font-bold"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <p className="text-[11px] text-muted-foreground mb-6">
                    This voucher code has also been saved to your Rewards History.
                  </p>

                  <button
                    onClick={() => setSelectedReward(null)}
                    className="w-full py-3 text-sm font-bold rounded-xl btn-eco"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RewardsPage;
