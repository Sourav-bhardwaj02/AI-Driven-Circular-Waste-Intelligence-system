import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Droplets,
  Zap,
  Star,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Ticket,
  X,
  Check,
  TrendingUp,
  Tag,
  ShieldCheck,
  Building2,
  Bus,
  Calculator,
  Percent,
  Award,
  ChevronRight,
  Flame
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface GovtRewardOption {
  id: string;
  category: 'water_bill' | 'electricity_bill' | 'bus_pass' | 'bill_payment' | 'property_tax';
  deptGroup: 'water' | 'electricity' | 'transit' | 'municipal';
  title: string;
  subtitle: string;
  discountPercentage: number;
  points: number;
  icon: any;
  color: string;
  badge?: string;
  govtDepartment: string;
  savingsHint: string;
}

// ─── OFFICIAL GOVT. UTILITY & TRANSIT CARDS ONLY ───
const GOVT_REWARDS_CATALOG: GovtRewardOption[] = [
  {
    id: "djb_water_30",
    category: "water_bill",
    deptGroup: "water",
    title: "DJB 30% Water Bill Waiver",
    subtitle: "30% Direct Subsidy on Delhi Jal Board Monthly Water Bill",
    discountPercentage: 30,
    points: 500,
    icon: Droplets,
    color: "from-blue-500 to-cyan-500",
    badge: "30% Off",
    govtDepartment: "Delhi Jal Board (Govt. of NCT of Delhi)",
    savingsHint: "Saves approx ₹300 - ₹600 on monthly water consumption"
  },
  {
    id: "djb_water_100",
    category: "water_bill",
    deptGroup: "water",
    title: "DJB 100% Full Month Water Waiver",
    subtitle: "100% Free Zero-Bill Water Month for Top Segregating Citizens",
    discountPercentage: 100,
    points: 1500,
    icon: Droplets,
    color: "from-blue-600 to-teal-500",
    badge: "100% Free Bill",
    govtDepartment: "Delhi Jal Board (Govt. of NCT of Delhi)",
    savingsHint: "Zero bill (100% waiver up to ₹2,000 water charge)"
  },
  {
    id: "bses_power_25",
    category: "electricity_bill",
    deptGroup: "electricity",
    title: "BSES 25% Electricity Subsidy",
    subtitle: "25% Power Tariff Rebate on BSES Rajdhani/Yamuna Discoms",
    discountPercentage: 25,
    points: 600,
    icon: Zap,
    color: "from-amber-500 to-yellow-500",
    badge: "25% Off",
    govtDepartment: "BSES Power Discoms & Delhi Energy Dept",
    savingsHint: "Saves approx ₹500 - ₹900 on power bill"
  },
  {
    id: "bses_power_50",
    category: "electricity_bill",
    deptGroup: "electricity",
    title: "BSES 50% Electricity Subsidy",
    subtitle: "50% Power Bill Waiver for High-Impact Eco Households",
    discountPercentage: 50,
    points: 1200,
    icon: Zap,
    color: "from-amber-600 to-orange-500",
    badge: "50% Off",
    govtDepartment: "BSES Power Discoms & Delhi Energy Dept",
    savingsHint: "Saves approx ₹1,200 - ₹2,500 on power bill"
  },
  {
    id: "dtc_bus_50",
    category: "bus_pass",
    deptGroup: "transit",
    title: "DTC 50% Electric Bus Pass",
    subtitle: "50% Subsidy on Daily & Weekly Delhi Govt Bus Transit",
    discountPercentage: 50,
    points: 350,
    icon: Bus,
    color: "from-emerald-500 to-teal-600",
    badge: "50% Off",
    govtDepartment: "Delhi Transport Corporation (DTC)",
    savingsHint: "Half price on all AC & Non-AC green electric routes"
  },
  {
    id: "dtc_bus_100",
    category: "bus_pass",
    deptGroup: "transit",
    title: "DTC 100% Free 1-Month Bus Pass",
    subtitle: "100% Free 30-Day All-Route Delhi Green Transit Pass",
    discountPercentage: 100,
    points: 1000,
    icon: Bus,
    color: "from-emerald-600 to-green-600",
    badge: "100% Free Pass",
    govtDepartment: "Delhi Transport Corporation (DTC)",
    savingsHint: "Unlimited free travel across all Delhi DTC bus routes"
  },
  {
    id: "dmrc_metro_card",
    category: "bill_payment",
    deptGroup: "transit",
    title: "DMRC Metro Smart Card ₹400 Credit",
    subtitle: "₹400 Transit Credit on Delhi Metro Smart Card for Low-Carbon Commute",
    discountPercentage: 40,
    points: 400,
    icon: Ticket,
    color: "from-rose-500 to-pink-600",
    badge: "Metro Credit",
    govtDepartment: "Delhi Metro Rail Corporation (DMRC)",
    savingsHint: "Direct ₹400 top-up on DMRC smart card"
  },
  {
    id: "mcd_property_tax_20",
    category: "property_tax",
    deptGroup: "municipal",
    title: "MCD 20% Property Tax Green Rebate",
    subtitle: "20% Municipal Property Tax Rebate for Segregating Homes",
    discountPercentage: 20,
    points: 800,
    icon: Building2,
    color: "from-purple-500 to-indigo-600",
    badge: "20% Tax Waiver",
    govtDepartment: "Municipal Corporation of Delhi (MCD)",
    savingsHint: "Substantial savings on annual residential property tax"
  }
];

// ─── TARGET MILESTONES DEFINITION ───
const MILESTONE_TARGETS = [
  { targetPoints: 250, waiverPercent: 15, label: "Level 1: 15% Waiver", desc: "15% discount on Water / Transit pass" },
  { targetPoints: 500, waiverPercent: 30, label: "Level 2: 30% Waiver", desc: "30% waiver on DJB Water Bill" },
  { targetPoints: 1000, waiverPercent: 50, label: "Level 3: 50% Waiver", desc: "50% waiver on BSES Power / Free DTC Pass" },
  { targetPoints: 1500, waiverPercent: 80, label: "Level 4: 80% Waiver", desc: "80% waiver on combined utilities" },
  { targetPoints: 2000, waiverPercent: 100, label: "Hero Tier: 100% Free Bill", desc: "100% Full Monthly Zero Utility Bill" }
];

const RewardsPage = () => {
  const { user, isAuthenticated, updateUserRewardPoints } = useAuth();
  const [points, setPoints] = useState<number>(user?.rewardPoints || 0);
  const [level, setLevel] = useState<number>(user?.level || 1);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Catalog department filter
  const [deptFilter, setDeptFilter] = useState<'all' | 'water' | 'electricity' | 'transit' | 'municipal'>('all');

  // Simulator state
  const [simulatedBillAmount, setSimulatedBillAmount] = useState<number>(1500);

  // Redemption modal state
  const [selectedReward, setSelectedReward] = useState<GovtRewardOption | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<{ voucherCode: string; title: string; discountPercent: number; govtDept: string } | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // History filter tab
  const [historyTab, setHistoryTab] = useState<'all' | 'earned' | 'redeemed' | 'vouchers'>('all');

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
        if (data.rewardPoints !== undefined) {
          setPoints(data.rewardPoints);
          updateUserRewardPoints(data.rewardPoints, data.level);
        }
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
        updateUserRewardPoints(data.newBalance, data.level);
        setClaimMsg({ type: 'success', text: data.message });
        fetchRewardsData();
      } else {
        setClaimMsg({ type: 'error', text: data.message || 'Daily bonus already claimed today' });
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
          description: `${selectedReward.title} (${selectedReward.discountPercentage}% Govt Subsidy)`
        })
      });
      const data = await res.json();

      if (data.success) {
        setPoints(data.newBalance);
        updateUserRewardPoints(data.newBalance);
        setRedeemSuccess({ 
          voucherCode: data.voucherCode, 
          title: selectedReward.title,
          discountPercent: selectedReward.discountPercentage,
          govtDept: selectedReward.govtDepartment
        });
        fetchRewardsData();
      } else {
        setRedeemError(data.message || 'Redemption failed. Please check points balance.');
      }
    } catch (err) {
      setRedeemError('Network error during redemption');
    } finally {
      setRedeeming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Filtered Catalog Items
  const filteredCatalog = useMemo(() => {
    if (deptFilter === 'all') return GOVT_REWARDS_CATALOG;
    return GOVT_REWARDS_CATALOG.filter(r => r.deptGroup === deptFilter);
  }, [deptFilter]);

  // Extract Claimed Vouchers from transactions
  const claimedVouchers = useMemo(() => {
    return transactions
      .filter(t => t.type === 'redeemed')
      .map(t => {
        const codeMatch = t.description?.match(/Code:\s*([A-Z0-9-]+)/i);
        const code = codeMatch ? codeMatch[1] : `WW-GOVT-${t._id?.substring(0, 6)?.toUpperCase()}`;
        return {
          id: t._id,
          title: t.description?.replace(/\(Code:[^)]+\)/i, '')?.trim() || 'Govt Utility Waiver',
          code,
          points: t.amount,
          date: t.createdAt
        };
      });
  }, [transactions]);

  // Target Milestone Calculations
  const currentUnlockedWaiver = useMemo(() => {
    let unlocked = 0;
    for (const m of MILESTONE_TARGETS) {
      if (points >= m.targetPoints) {
        unlocked = m.waiverPercent;
      }
    }
    return unlocked;
  }, [points]);

  const nextTargetMilestone = useMemo(() => {
    for (const m of MILESTONE_TARGETS) {
      if (points < m.targetPoints) {
        return m;
      }
    }
    return MILESTONE_TARGETS[MILESTONE_TARGETS.length - 1];
  }, [points]);

  const pointsToNextMilestone = Math.max(0, nextTargetMilestone.targetPoints - points);
  const milestoneProgress = Math.min(100, Math.round((points / 2000) * 100));

  // Bill Savings Calculation
  const estimatedSavings = useMemo(() => {
    const waiverRate = currentUnlockedWaiver > 0 ? currentUnlockedWaiver : 10;
    return Math.round((simulatedBillAmount * waiverRate) / 100);
  }, [simulatedBillAmount, currentUnlockedWaiver]);

  const finalPayableBill = Math.max(0, simulatedBillAmount - estimatedSavings);

  const totalEarned = useMemo(() => {
    return transactions.filter(t => t.type === 'earned').reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const totalRedeemed = useMemo(() => {
    return transactions.filter(t => t.type === 'redeemed').reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (historyTab === 'earned') return transactions.filter(t => t.type === 'earned');
    if (historyTab === 'redeemed') return transactions.filter(t => t.type === 'redeemed');
    return transactions;
  }, [transactions, historyTab]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center glass-card-static p-8 rounded-3xl max-w-sm border border-border shadow-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-eco-teal flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Govt. Utility Rewards</h2>
          <p className="text-muted-foreground text-xs mb-6">
            Sign in to check your target points and unlock direct percentage waivers on Water, Electricity, and Bus fares.
          </p>
          <Link to="/" className="btn-eco px-6 py-2.5 rounded-xl text-sm font-semibold inline-block">
            Sign In to Account →
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-gradient-to-b from-background via-background/95 to-secondary/20">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

          {/* ─── Top Header ─── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Delhi Govt. Green Citizen Utility Subsidy Scheme
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight flex items-center gap-3">
                <Building2 className="w-9 h-9 text-primary" />
                Govt. Utility & Bill Waiver Vault
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                Convert your verified circular waste points directly into <b>% Bill Waivers</b> on Water, Electricity, DTC Bus & Property Tax.
              </p>
            </div>

            {/* Daily Eco Bonus Claim Button (Citizens Only) */}
            {user?.role === 'citizen' && (
              <button
                onClick={handleDailyClaim}
                disabled={claiming}
                className="btn-eco px-6 py-3.5 rounded-2xl flex items-center gap-2.5 font-bold text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-primary shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex-shrink-0"
              >
                <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                {claiming ? "Claiming Bonus..." : "Daily Eco Check-in (+25 Pts)"}
              </button>
            )}
            {user?.role === 'admin' && (
              <div className="px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center gap-2 flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>Municipal Subsidy Authority Mode</span>
              </div>
            )}
            {user?.role === 'collector' && (
              <div className="px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-2 flex-shrink-0">
                <Truck className="w-4 h-5 text-blue-500" />
                <span>Collection Fleet Staff Mode</span>
              </div>
            )}
          </div>

          {/* ─── Daily Claim Feedback Alert ─── */}
          <AnimatePresence>
            {claimMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-2xl mb-6 flex items-center justify-between gap-3 text-sm font-semibold ${
                  claimMsg.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {claimMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                  <span>{claimMsg.text}</span>
                </div>
                <button onClick={() => setClaimMsg(null)} className="text-xs hover:underline">Dismiss</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── TARGET MILESTONE & % BILL WAIVER HERO SECTION ─── */}
          <div className="glass-card-static p-6 md:p-8 mb-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-emerald-500/5 shadow-xl relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid lg:grid-cols-12 gap-8 relative z-10 items-center">
              
              {/* Left Column: Live Points & % Bill Waiver Status */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <Percent className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl md:text-5xl font-black text-primary">{points.toLocaleString()}</span>
                      <span className="text-sm md:text-base font-bold text-muted-foreground">Eco Points</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs md:text-sm font-extrabold text-foreground">
                        Current Unlocked Waiver:
                      </span>
                      <span className="text-sm font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
                        {currentUnlockedWaiver > 0 ? `${currentUnlockedWaiver}% Bill Waiver` : '10% Base Waiver'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Progress Bar towards 100% Free Bill */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      Target to Next Milestone: <b>{nextTargetMilestone.waiverPercent}% Waiver ({nextTargetMilestone.targetPoints} Pts)</b>
                    </span>
                    <span className="text-emerald-600 font-extrabold">
                      {pointsToNextMilestone > 0 ? `${pointsToNextMilestone} pts needed` : '100% Maximum Waiver Reached!'}
                    </span>
                  </div>

                  <div className="w-full h-3.5 rounded-full bg-secondary/80 overflow-hidden p-0.5 border border-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-400 transition-all duration-700 shadow-sm"
                      style={{ width: `${milestoneProgress}%` }}
                    />
                  </div>

                  {/* Target Milestones Step Indicators */}
                  <div className="grid grid-cols-5 gap-1 text-[10px] md:text-xs pt-1 font-bold text-center">
                    {MILESTONE_TARGETS.map(m => {
                      const isReached = points >= m.targetPoints;
                      return (
                        <div key={m.targetPoints} className={`p-1.5 rounded-xl border ${isReached ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-extrabold' : 'bg-muted/40 border-border text-muted-foreground'}`}>
                          <div>{m.waiverPercent}%</div>
                          <div className="text-[9px] font-normal">{m.targetPoints} pts</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Bill Waiver Calculator Simulator */}
              <div className="lg:col-span-5 glass-card p-5 md:p-6 rounded-3xl border border-border shadow-md bg-card/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" />
                    Govt Bill Waiver Calculator
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary font-bold rounded-full">
                    Instant Simulation
                  </span>
                </div>

                {/* Input Simulator */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-medium">
                    <span>Monthly Utility Bill Amount:</span>
                    <span className="font-bold text-foreground font-mono">₹{simulatedBillAmount}</span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="5000"
                    step="100"
                    value={simulatedBillAmount}
                    onChange={e => setSimulatedBillAmount(parseInt(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>₹300</span>
                    <span>₹2,500</span>
                    <span>₹5,000</span>
                  </div>
                </div>

                {/* Calculated Result Breakdown */}
                <div className="p-3.5 rounded-2xl bg-accent/40 border border-border/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Bill:</span>
                    <span className="font-bold text-foreground">₹{simulatedBillAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Govt Circular Waiver ({currentUnlockedWaiver > 0 ? currentUnlockedWaiver : 10}%):</span>
                    <span>-₹{estimatedSavings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/70 pt-2 text-sm font-extrabold">
                    <span>Final Amount Payable:</span>
                    <span className="text-primary font-mono">₹{finalPayableBill.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ─── OFFICIAL GOVT REWARD CARDS CATALOG ─── */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            
            {/* ── Left 2 Columns: Govt Discount Cards Grid ── */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Official Government Subsidy Cards
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Direct government waivers recognized by MCD, DJB, BSES & DTC.
                  </p>
                </div>

                {/* Filter Tabs by Department */}
                <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border overflow-x-auto text-xs font-semibold">
                  {[
                    { id: 'all', label: 'All Utilities' },
                    { id: 'water', label: '💧 Water (DJB)' },
                    { id: 'electricity', label: '⚡ Electricity (BSES)' },
                    { id: 'transit', label: '🚌 Transit (DTC/DMRC)' },
                    { id: 'municipal', label: '🏠 MCD Tax' }
                  ].map(tabItem => (
                    <button
                      key={tabItem.id}
                      onClick={() => setDeptFilter(tabItem.id as any)}
                      className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                        deptFilter === tabItem.id
                          ? 'bg-background text-foreground shadow-sm font-bold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tabItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredCatalog.map((r, i) => {
                  const canAfford = points >= r.points;
                  const Icon = r.icon;

                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => {
                        setSelectedReward(r);
                        setRedeemSuccess(null);
                        setRedeemError(null);
                      }}
                      className={`glass-card p-5 rounded-3xl cursor-pointer relative flex flex-col justify-between transition-all hover:scale-[1.02] border border-border shadow-sm ${
                        canAfford ? 'hover:shadow-lg hover:border-primary/40' : 'opacity-90'
                      }`}
                    >
                      {/* Top Percentage Badge */}
                      <span className="absolute top-4 right-4 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                        {r.badge || `${r.discountPercentage}% Off`}
                      </span>

                      <div>
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white mb-3 shadow-md`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-extrabold text-foreground">{r.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 mb-1">{r.subtitle}</p>
                        
                        {/* Govt Department Pill */}
                        <span className="text-[10px] font-bold text-primary/90 bg-primary/10 px-2 py-0.5 rounded-md inline-block mb-2">
                          🏛️ {r.govtDepartment}
                        </span>

                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mb-4">
                          ✓ {r.savingsHint}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-auto">
                        <span className="text-sm font-black text-primary flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                          {r.points.toLocaleString()} pts
                        </span>
                        
                        <span className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all ${
                          canAfford
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {canAfford ? "Redeem Card" : `Need ${r.points - points} Pts`}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── Right Column: Claimed Govt Cards & Activity History ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  My Govt Cards & Logs
                </h2>
              </div>

              {/* Subtabs */}
              <div className="flex p-1 bg-muted/60 rounded-2xl border border-border text-xs font-semibold">
                {[
                  { id: 'vouchers', label: `My Cards (${claimedVouchers.length})` },
                  { id: 'all', label: 'All Logs' },
                  { id: 'earned', label: 'Earned' },
                  { id: 'redeemed', label: 'Redeemed' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setHistoryTab(t.id as any)}
                    className={`flex-1 py-1.5 rounded-xl capitalize transition-all ${
                      historyTab === t.id
                        ? 'bg-background text-foreground shadow-sm font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* List Container */}
              <div className="glass-card-static p-4 rounded-3xl border border-border max-h-[520px] overflow-y-auto space-y-2.5 shadow-sm">
                {loading ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">Loading records from MongoDB…</div>
                ) : historyTab === 'vouchers' ? (
                  /* ─── My Claimed Govt Vouchers Vault ─── */
                  claimedVouchers.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No government discount cards claimed yet. Choose any utility waiver above!
                    </div>
                  ) : (
                    claimedVouchers.map((v, idx) => (
                      <div key={v.id || idx} className="p-3.5 rounded-2xl bg-accent/40 border border-border/80 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-extrabold text-foreground">{v.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Claimed on {new Date(v.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            -{v.points} Pts
                          </span>
                        </div>

                        {/* Copy Code Bar */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-primary/20">
                          <span className="font-mono text-xs font-black text-primary">{v.code}</span>
                          <button
                            onClick={() => copyToClipboard(v.code)}
                            className="text-[10px] font-bold px-2.5 py-1 bg-primary text-primary-foreground rounded-lg flex items-center gap-1 hover:opacity-90 transition-opacity"
                          >
                            {copiedCode === v.code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedCode === v.code ? "Copied" : "Copy Code"}
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  /* ─── General Transaction Stream ─── */
                  filteredTransactions.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">No transactions recorded yet.</div>
                  ) : (
                    filteredTransactions.map((h, i) => (
                      <div
                        key={h._id || i}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-accent/40 transition-colors border border-border/40"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-bold text-foreground truncate">{h.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`text-xs font-black flex-shrink-0 font-mono ${
                          h.type === 'earned' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {h.type === 'earned' ? `+${h.amount}` : `-${h.amount}`}
                        </span>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>

          </div>

          {/* ─── HOW TO EARN MORE POINTS FOR % WAIVERS ─── */}
          <div className="glass-card-static p-6 md:p-8 rounded-3xl border border-border shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Ways to Earn More Points & Reach 100% Zero Utility Bill
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Waste Grievance Report", desc: "Report public waste with GPS coordinates and images", pts: "+15 Pts" },
                { title: "Daily Check-in Bonus", desc: "Claim daily streak bonuses for responsible habits", pts: "+25 Pts" },
                { title: "Wet & Dry Segregation", desc: "Verified doorstep segregation at municipal pickup", pts: "+50 Pts" },
                { title: "Community Top Rank", desc: "Rank top 3 in your residential RWA monthly standings", pts: "+200 Pts" }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-accent/30 border border-border/50 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full inline-block mb-2">
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

      {/* ─── Govt Voucher Redemption Confirmation Modal ─── */}
      <AnimatePresence>
        {selectedReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-card w-full max-w-md p-6 md:p-8 relative z-50 text-foreground bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-2xl"
            >
              <button
                onClick={() => setSelectedReward(null)}
                className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {!redeemSuccess ? (
                <div>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedReward.color} flex items-center justify-center text-white mb-4 shadow-lg mx-auto`}>
                    <selectedReward.icon className="w-8 h-8" />
                  </div>

                  <h3 className="text-xl font-black text-foreground text-center mb-1">{selectedReward.title}</h3>
                  <p className="text-xs text-muted-foreground text-center mb-2">{selectedReward.subtitle}</p>
                  
                  <p className="text-center text-[11px] font-bold text-primary mb-6">
                    Issued in partnership with {selectedReward.govtDepartment}
                  </p>

                  <div className="bg-slate-50 dark:bg-zinc-800/90 p-4 rounded-2xl mb-6 space-y-2.5 text-xs md:text-sm border border-slate-200 dark:border-zinc-700">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Bill Discount / Waiver:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{selectedReward.discountPercentage}% Direct Waiver</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Point Cost:</span>
                      <span className="font-black text-primary">{selectedReward.points.toLocaleString()} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Current Live Balance:</span>
                      <span className="font-bold text-foreground">{points.toLocaleString()} pts</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-zinc-700 pt-2 font-bold">
                      <span className="text-muted-foreground">Balance After:</span>
                      <span className={points - selectedReward.points >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                        {(points - selectedReward.points).toLocaleString()} pts
                      </span>
                    </div>
                  </div>

                  {redeemError && (
                    <div className="p-3.5 mb-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 text-xs font-semibold">
                      {redeemError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedReward(null)}
                      className="flex-1 py-3 text-xs font-bold rounded-2xl bg-slate-100 dark:bg-zinc-800 text-foreground hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRedeem}
                      disabled={redeeming || points < selectedReward.points}
                      className="flex-1 py-3 text-xs font-bold rounded-2xl btn-eco disabled:opacity-50"
                    >
                      {redeeming ? "Processing Waiver..." : points < selectedReward.points ? "Need More Points" : "Claim Govt Subsidy Card"}
                    </button>
                  </div>
                </div>
              ) : (
                /* ─── Success Govt Voucher Modal ─── */
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-1">Govt Waiver Card Issued!</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    <b>{redeemSuccess.discountPercent}% Waiver</b> authorized for <span className="font-bold text-foreground">{redeemSuccess.title}</span>.
                  </p>
                  <p className="text-[11px] text-primary font-semibold mb-6">
                    {redeemSuccess.govtDept}
                  </p>

                  <div className="bg-slate-50 dark:bg-zinc-800 border border-primary/40 p-4 rounded-2xl mb-4 flex items-center justify-between">
                    <span className="text-lg md:text-xl font-mono font-black text-primary tracking-widest">
                      {redeemSuccess.voucherCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(redeemSuccess.voucherCode)}
                      className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
                    >
                      {copiedCode === redeemSuccess.voucherCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode === redeemSuccess.voucherCode ? "Copied" : "Copy Code"}
                    </button>
                  </div>

                  <p className="text-[11px] text-muted-foreground mb-6">
                    Enter this subsidy code during your online utility bill payment on the DJB / BSES / DTC portal to apply your % waiver.
                  </p>

                  <button
                    onClick={() => { setSelectedReward(null); setHistoryTab('vouchers'); }}
                    className="w-full py-3 text-xs font-bold rounded-2xl btn-eco"
                  >
                    View in My Govt Cards Vault
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
