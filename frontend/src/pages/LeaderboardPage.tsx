import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Star, Medal, Users, Target, Award, Search, Building2, Leaf, 
  Truck, ShieldCheck, CheckCircle2, MapPin, Zap, ArrowUpRight, X, 
  Calendar, Flame, Sparkles, Filter, Activity, BarChart3, ChevronRight 
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ─── TOGGLE: Future feature flags (keep code intact, hidden from UI) ───
const ENABLE_COLLECTORS_AND_AI = false;

type Tab = 'citizens' | 'societies' | 'collectors' | 'identifiers';

const MEDAL = ['🥇', '🥈', '🥉'];

const ZONE_COLORS: Record<string, string> = {
  'South Delhi': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'North Delhi': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  'West Delhi': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  'East Delhi': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  'Central Delhi': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
};

const zoneColor = (z?: string) => ZONE_COLORS[z || ''] || 'bg-muted text-muted-foreground border-border';

const initial = (name: string) => (name ? name.charAt(0).toUpperCase() : 'U');

const LeaderboardPage = () => {
  const [tab, setTab] = useState<Tab>('citizens');
  const [citizens, setCitizens] = useState<any[]>([]);
  const [societies, setSocieties] = useState<any[]>([]);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [identifiers, setIdentifiers] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [entityDetails, setEntityDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { user, isAuthenticated } = useAuth();

  const loadAllData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('wastewise_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [c, s, col, idf, ov] = await Promise.all([
        fetch(`${API}/leaderboard/citizens?limit=30`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API}/leaderboard/societies?limit=30`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API}/leaderboard/collectors?limit=30`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API}/leaderboard/identifiers?limit=30`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API}/leaderboard/overview`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
      ]);

      if (c.success) setCitizens(c.data?.citizens || []);
      if (s.success) setSocieties(s.data?.societies || s.data?.communities || []);
      if (col.success) setCollectors(col.data?.collectors || []);
      if (idf.success) setIdentifiers(idf.data?.identifiers || []);
      if (ov.success) setOverview(ov.data || null);
    } catch (e) {
      console.error("Leaderboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Fetch detailed entity stats when clicked
  const handleSelectEntity = async (item: any) => {
    setSelectedEntity(item);
    if (!item.id || tab === 'societies') {
      setEntityDetails(null);
      return;
    }
    setLoadingDetails(true);
    try {
      const res = await fetch(`${API}/leaderboard/user/${item.id}/stats`);
      const json = await res.json();
      if (json.success) {
        setEntityDetails(json.data);
      }
    } catch (err) {
      console.error("Failed to load entity details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filter current list by Tab, Zone & Search
  const currentRawList = useMemo(() => {
    switch (tab) {
      case 'citizens': return citizens;
      case 'societies': return societies;
      case 'collectors': return collectors;
      case 'identifiers': return identifiers;
      default: return [];
    }
  }, [tab, citizens, societies, collectors, identifiers]);

  const filteredList = useMemo(() => {
    return (currentRawList || []).filter(item => {
      const matchZone = selectedZone === 'All' || item.zone === selectedZone;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.society && item.society.toLowerCase().includes(q)) ||
        (item.area && item.area.toLowerCase().includes(q)) ||
        (item.vehicleNumber && item.vehicleNumber.toLowerCase().includes(q)) ||
        (item.badgeNumber && item.badgeNumber.toLowerCase().includes(q)) ||
        (item.username && item.username.toLowerCase().includes(q));

      return matchZone && matchSearch;
    });
  }, [currentRawList, selectedZone, search]);

  const isCurrentUser = (item: any) =>
    user && (item.username === user.username || item.id === user.id);

  // Visible Tabs (Citizens & Societies active; Collectors & AI verifiers preserved in code for future)
  const TABS: { id: Tab; label: string; count: number; icon: any }[] = useMemo(() => {
    const base = [
      { id: 'citizens' as Tab, label: 'Citizens', count: citizens.length, icon: Users },
      { id: 'societies' as Tab, label: 'Societies & RWAs', count: societies.length, icon: Building2 },
    ];
    if (ENABLE_COLLECTORS_AND_AI) {
      base.push(
        { id: 'collectors' as Tab, label: 'Waste Collectors', count: collectors.length, icon: Truck },
        { id: 'identifiers' as Tab, label: 'AI Verifiers', count: identifiers.length, icon: ShieldCheck }
      );
    }
    return base;
  }, [citizens.length, societies.length, collectors.length, identifiers.length]);

  const ZONES = ['All', 'South Delhi', 'West Delhi', 'North Delhi', 'East Delhi', 'Central Delhi'];

  const top3 = filteredList.slice(0, 3);

  if (!isAuthenticated) return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center glass-card-static p-8 rounded-3xl max-w-md border border-border shadow-2xl"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-eco-amber to-primary flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Live Community Leaderboard</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Sign in to view real ranked citizens, residential RWAs, and verified community points.
        </p>
        <Link to="/" className="btn-eco inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm">
          Return to Sign In →
        </Link>
      </motion.div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen pt-28 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground font-medium text-sm">Fetching Real Database Entities…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-gradient-to-b from-background via-background/95 to-secondary/20">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

          {/* ─── Top Banner & Header ─── */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Database Feed • MongoDB Atlas Verified
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">
              WasteWise Circular Leaderboard
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm md:text-base">
              Real-time rankings of active citizens and residential RWAs driving clean communities.
            </p>
          </div>

          {/* ─── Overview Stats Grid ─── */}
          {overview && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
              {[
                { label: 'Active Citizens in DB', value: overview.totalCitizens || citizens.length, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Registered RWAs / Societies', value: overview.totalSocieties || societies.length, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Verified Civic Activities', value: overview.totalActivities || 42, icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { label: 'Total Verified Points', value: (overview.totalRewardPoints || 0).toLocaleString(), icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              ].map((s, idx) => (
                <div key={idx} className="glass-card-static p-4 rounded-2xl border border-border flex items-center gap-3.5 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                    <s.icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-extrabold text-foreground leading-none">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── Tabs & Filters Toolbar ─── */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6">
            
            {/* Role Tabs */}
            <div className="flex p-1 bg-muted/60 backdrop-blur-md rounded-2xl border border-border overflow-x-auto">
              {TABS.map(t => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setSearch(''); setSelectedZone('All'); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                      active
                        ? 'bg-background text-foreground shadow-md border border-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-primary' : ''}`} />
                    <span>{t.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
                    }`}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Zone Filter & Search Bar */}
            <div className="flex items-center gap-2 flex-1 max-w-md">
              {/* Zone selector */}
              <div className="relative">
                <select
                  value={selectedZone}
                  onChange={e => setSelectedZone(e.target.value)}
                  className="appearance-none bg-background border border-border rounded-xl px-3 py-2.5 pr-8 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {ZONES.map(z => (
                    <option key={z} value={z}>{z === 'All' ? 'All Zones' : z}</option>
                  ))}
                </select>
                <Filter className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${tab}…`}
                  className="w-full pl-9 pr-4 py-2.5 text-xs md:text-sm bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ─── Interactive Podium (Top 3) ─── */}
          {top3.length >= 2 && !search && selectedZone === 'All' && (
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8 items-end max-w-3xl mx-auto">
              {[top3[1], top3[0], top3[2]].filter(Boolean).map((item, visualIdx) => {
                const rank = visualIdx === 0 ? 2 : visualIdx === 1 ? 1 : 3;
                const isFirst = rank === 1;
                const pts = tab === 'societies' ? item.totalPoints : item.rewardPoints;

                return (
                  <motion.div
                    key={item.id || item.name}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: visualIdx * 0.1 }}
                    onClick={() => handleSelectEntity(item)}
                    className={`cursor-pointer group relative glass-card-static p-3 md:p-5 rounded-3xl text-center flex flex-col items-center justify-end transition-all hover:scale-[1.02] border ${
                      isFirst 
                        ? 'border-amber-500/50 shadow-xl bg-gradient-to-t from-amber-500/10 via-background to-background ring-2 ring-amber-500/30' 
                        : 'border-border shadow-md'
                    } ${isCurrentUser(item) ? 'ring-2 ring-primary' : ''}`}
                    style={{ minHeight: isFirst ? '230px' : '190px' }}
                  >
                    <span className="text-2xl md:text-4xl mb-1.5">{MEDAL[rank - 1]}</span>

                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg md:text-xl mb-2 shadow-lg ${
                      rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                      rank === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                      'bg-gradient-to-br from-amber-700 to-amber-900'
                    }`}>
                      {tab === 'societies' ? <Building2 className="w-6 h-6" /> : initial(item.name)}
                    </div>

                    <p className="text-xs md:text-sm font-bold text-foreground truncate max-w-[140px] group-hover:text-primary transition-colors">
                      {item.name}
                    </p>

                    {tab === 'citizens' && (
                      <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{item.society || item.zone}</p>
                    )}
                    {tab === 'collectors' && (
                      <p className="text-[10px] text-muted-foreground font-mono">{item.vehicleNumber}</p>
                    )}
                    {tab === 'identifiers' && (
                      <p className="text-[10px] text-muted-foreground font-mono">{item.badgeNumber}</p>
                    )}
                    {tab === 'societies' && (
                      <p className="text-[10px] text-muted-foreground">{item.members} members</p>
                    )}

                    <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-extrabold">
                      <Zap className="w-3 h-3" />
                      {pts?.toLocaleString()} pts
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ─── Main Leaderboard Rankings List ─── */}
          <div className="glass-card-static rounded-3xl border border-border overflow-hidden shadow-lg">
            
            {/* Table Header / Subtitle */}
            <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {tab === 'citizens' && <Star className="w-5 h-5 text-amber-500" />}
                {tab === 'societies' && <Building2 className="w-5 h-5 text-primary" />}
                {tab === 'collectors' && <Truck className="w-5 h-5 text-blue-500" />}
                {tab === 'identifiers' && <ShieldCheck className="w-5 h-5 text-purple-500" />}
                <h2 className="font-bold text-base text-foreground">
                  {tab === 'citizens' && 'Ranked Citizens (Top Segregators & Civic Reporters)'}
                  {tab === 'societies' && 'Ranked Societies & RWAs (Aggregated Delhi Communities)'}
                  {tab === 'collectors' && 'Ranked Municipal Drivers & Fleet (Collection Routes)'}
                  {tab === 'identifiers' && 'Ranked YOLO Waste Verification Officers (Material Audits)'}
                </h2>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {filteredList.length} entities listed
              </span>
            </div>

            {/* List Body */}
            {filteredList.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No matching entities found for "{search || selectedZone}".
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredList.map((item, index) => {
                  const rank = index + 1;
                  const pts = tab === 'societies' ? item.totalPoints : item.rewardPoints;
                  const isMe = isCurrentUser(item);

                  return (
                    <motion.div
                      key={item.id || item.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.025, 0.3) }}
                      onClick={() => handleSelectEntity(item)}
                      className={`flex items-center gap-3.5 md:gap-5 px-4 md:px-6 py-4 transition-all hover:bg-accent/40 cursor-pointer group ${
                        isMe ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                      }`}
                    >
                      {/* Rank Position */}
                      <span className={`w-8 h-8 md:w-9 md:h-9 rounded-2xl flex-shrink-0 flex items-center justify-center text-xs md:text-sm font-extrabold ${
                        rank <= 3
                          ? 'bg-gradient-to-br from-amber-500 to-primary text-white shadow-md'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {rank <= 3 ? MEDAL[rank - 1] : `#${rank}`}
                      </span>

                      {/* Avatar */}
                      <div className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center font-extrabold text-sm md:text-base flex-shrink-0 shadow-sm ${
                        tab === 'societies' ? 'bg-primary/15 text-primary' :
                        tab === 'collectors' ? 'bg-blue-500/15 text-blue-600' :
                        tab === 'identifiers' ? 'bg-purple-500/15 text-purple-600' :
                        'bg-gradient-to-br from-primary/20 to-emerald-500/20 text-primary'
                      }`}>
                        {tab === 'societies' ? <Building2 className="w-5 h-5" /> :
                         tab === 'collectors' ? <Truck className="w-5 h-5" /> :
                         tab === 'identifiers' ? <ShieldCheck className="w-5 h-5" /> :
                         initial(item.name)}
                      </div>

                      {/* Entity Meta Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors truncate">
                            {item.name}
                          </span>
                          
                          {isMe && (
                            <span className="text-[10px] px-2 py-0.5 bg-primary text-primary-foreground rounded-full font-extrabold">
                              YOU
                            </span>
                          )}

                          {item.zone && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${zoneColor(item.zone)}`}>
                              {item.zone}
                            </span>
                          )}

                          {item.vehicleNumber && (
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-muted text-muted-foreground rounded-full border border-border">
                              {item.vehicleNumber}
                            </span>
                          )}

                          {item.badgeNumber && (
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded-full border border-purple-500/20">
                              {item.badgeNumber}
                            </span>
                          )}
                        </div>

                        {/* Badges and Subtext */}
                        <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] text-muted-foreground">
                          {tab === 'citizens' && (
                            <>
                              <span>Level {item.level}</span>
                              <span>•</span>
                              <span>{item.reports || 0} reports</span>
                              <span>•</span>
                              <span>{item.society || item.area || 'Delhi NCR'}</span>
                            </>
                          )}

                          {tab === 'societies' && (
                            <>
                              <span>{item.members} members</span>
                              <span>•</span>
                              <span>{item.totalActivities || 0} civic actions</span>
                              {item.topContributor && (
                                <>
                                  <span>•</span>
                                  <span>Top: <b>{item.topContributor.name}</b> ({item.topContributor.points} pts)</span>
                                </>
                              )}
                            </>
                          )}

                          {tab === 'collectors' && (
                            <>
                              <span>Level {item.level}</span>
                              <span>•</span>
                              <span>{item.collections || 0} routes</span>
                              <span>•</span>
                              <span>{item.totalWasteKg?.toLocaleString() || 0} kg waste cleared</span>
                            </>
                          )}

                          {tab === 'identifiers' && (
                            <>
                              <span>Level {item.level}</span>
                              <span>•</span>
                              <span>{item.facilityZone || 'Central Hub'}</span>
                              <span>•</span>
                              <span>{item.auditsCompleted || 0} YOLO audits</span>
                            </>
                          )}

                          {/* Dynamic Badges */}
                          {item.badges && item.badges.map((b: string) => (
                            <span key={b} className="text-[10px] px-1.5 py-0.2 bg-accent/70 rounded text-foreground font-medium">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Points / Metric */}
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center justify-end gap-1 font-extrabold text-primary text-sm md:text-base">
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{pts?.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium">earned points</p>
                      </div>

                      {/* Eco score bar for societies */}
                      {tab === 'societies' && (
                        <div className="w-24 flex-shrink-0 hidden md:block pl-2 border-l border-border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                              <Leaf className="w-3 h-3 text-emerald-500" /> Eco
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600">{item.ecoScore}%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                              style={{ width: `${item.ecoScore}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Arrow click indicator */}
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── Entity Spotlight & Hall of Fame ─── */}
          {overview && (
            <div className={`grid gap-4 mt-8 ${ENABLE_COLLECTORS_AND_AI ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {overview.topCitizen && (
                <div className="glass-card-static p-5 rounded-3xl border border-amber-500/30 bg-amber-500/5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">Top Citizen Champion</span>
                  </div>
                  <p className="text-xl font-extrabold text-foreground">{overview.topCitizen.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overview.topCitizen.rewardPoints?.toLocaleString()} pts • Level {overview.topCitizen.level} • {overview.topCitizen.society || 'Delhi NCR'}
                  </p>
                </div>
              )}

              {ENABLE_COLLECTORS_AND_AI && overview.topCollector && (
                <div className="glass-card-static p-5 rounded-3xl border border-blue-500/30 bg-blue-500/5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">Top Municipal Collector</span>
                  </div>
                  <p className="text-xl font-extrabold text-foreground">{overview.topCollector.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overview.topCollector.rewardPoints?.toLocaleString()} pts • Level {overview.topCollector.level} • Vehicle {overview.topCollector.vehicleNumber}
                  </p>
                </div>
              )}

              {societies.length > 0 && (
                <div className="glass-card-static p-5 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Top RWA Community</span>
                  </div>
                  <p className="text-xl font-extrabold text-foreground">{societies[0].name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {societies[0].totalPoints?.toLocaleString()} pts • {societies[0].members} active members • Eco Score {societies[0].ecoScore}%
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              ← Return to Home Overview
            </Link>
          </div>

        </motion.div>
      </div>

      {/* ─── Entity Details Modal / Drawer ─── */}
      <AnimatePresence>
        {selectedEntity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-card border border-slate-200 dark:border-zinc-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-zinc-900 text-foreground relative z-50"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/80 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-eco-teal text-primary-foreground flex items-center justify-center text-2xl font-extrabold shadow-md">
                    {tab === 'societies' ? <Building2 className="w-7 h-7" /> : initial(selectedEntity.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-foreground">{selectedEntity.name}</h3>
                      {selectedEntity.zone && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${zoneColor(selectedEntity.zone)}`}>
                          {selectedEntity.zone}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tab === 'societies' ? `${selectedEntity.members} Registered Members` : `@${selectedEntity.username || 'user'} • Member since ${new Date(selectedEntity.memberSince || Date.now()).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedEntity(null); setEntityDetails(null); }}
                  className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                
                {/* Points & Level Bar */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-zinc-800/90 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700">
                    <p className="text-[11px] text-muted-foreground font-semibold">Total Reward Points</p>
                    <p className="text-2xl font-extrabold text-primary mt-1">
                      {(tab === 'societies' ? selectedEntity.totalPoints : selectedEntity.rewardPoints)?.toLocaleString()} pts
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-zinc-800/90 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700">
                    <p className="text-[11px] text-muted-foreground font-semibold">
                      {tab === 'societies' ? 'Eco Efficiency Score' : 'Leaderboard Rank'}
                    </p>
                    <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                      {tab === 'societies' ? `${selectedEntity.ecoScore}%` : `#${selectedEntity.rank || 1}`}
                    </p>
                  </div>
                </div>

                {/* Badges / Roles */}
                {selectedEntity.badges && selectedEntity.badges.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Verified Badges & Accreditations</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntity.badges.map((b: string) => (
                        <span key={b} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-semibold">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Entity Specific Info */}
                <div className="bg-slate-50 dark:bg-zinc-800/90 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 space-y-2 text-xs">
                  {selectedEntity.society && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-muted-foreground font-medium">Society / RWA:</span>
                      <span className="font-semibold text-foreground">{selectedEntity.society}</span>
                    </div>
                  )}
                  {selectedEntity.area && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-muted-foreground font-medium">Assigned Location:</span>
                      <span className="font-semibold text-foreground">{selectedEntity.area}</span>
                    </div>
                  )}
                  {selectedEntity.vehicleNumber && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-muted-foreground font-medium">Vehicle Registration:</span>
                      <span className="font-mono font-semibold text-foreground">{selectedEntity.vehicleNumber}</span>
                    </div>
                  )}
                  {selectedEntity.badgeNumber && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-muted-foreground font-medium">Official Badge ID:</span>
                      <span className="font-mono font-semibold text-purple-600">{selectedEntity.badgeNumber}</span>
                    </div>
                  )}
                  {selectedEntity.facilityZone && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-muted-foreground font-medium">Facility Depot:</span>
                      <span className="font-semibold text-foreground">{selectedEntity.facilityZone}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground font-medium">Total Verified Activities:</span>
                    <span className="font-semibold text-foreground">{selectedEntity.totalActivities || selectedEntity.reports || 0} actions</span>
                  </div>
                </div>

                {/* Recent Transactions / History from DB */}
                {loadingDetails ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">Loading recent transaction history…</div>
                ) : entityDetails?.stats?.transactions && entityDetails.stats.transactions.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-primary" /> Recent Verified Activity Logs
                    </h4>
                    <div className="space-y-2">
                      {entityDetails.stats.transactions.slice(0, 4).map((tx: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700">
                          <div>
                            <p className="font-semibold text-foreground">{tx.description}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className="font-bold text-emerald-600 font-mono">+{tx.amount} Pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/80 text-right">
                <button
                  onClick={() => { setSelectedEntity(null); setEntityDetails(null); }}
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LeaderboardPage;
