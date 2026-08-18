import { motion } from "framer-motion";
import { Trophy, Star, Medal, Users, Target, Award, TrendingUp, Search, Building2, Truck, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

type Tab = 'citizens' | 'societies' | 'collectors';

const MEDAL = ['🥇','🥈','🥉'];
const ZONE_COLORS: Record<string,string> = {
  'South Delhi': 'bg-emerald-100 text-emerald-800',
  'North Delhi': 'bg-blue-100 text-blue-800',
  'West Delhi': 'bg-purple-100 text-purple-800',
  'East Delhi': 'bg-amber-100 text-amber-800',
  'Central Delhi': 'bg-rose-100 text-rose-800',
};
const zoneColor = (z?: string) => ZONE_COLORS[z||''] || 'bg-gray-100 text-gray-700';

const initial = (name: string) => name.charAt(0).toUpperCase();

const LeaderboardPage = () => {
  const [tab, setTab] = useState<Tab>('citizens');
  const [citizens, setCitizens] = useState<any[]>([]);
  const [societies, setSocieties] = useState<any[]>([]);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const headers: any = {};
        const token = localStorage.getItem('wastewise_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const [c, s, col, ov] = await Promise.all([
          fetch(`${API}/leaderboard/citizens?limit=20`, { headers }).then(r => r.json()),
          fetch(`${API}/leaderboard/societies?limit=20`, { headers }).then(r => r.json()),
          fetch(`${API}/leaderboard/collectors?limit=20`, { headers }).then(r => r.json()),
          fetch(`${API}/leaderboard/overview`, { headers }).then(r => r.json()),
        ]);

        if (c.success) setCitizens(c.data.citizens || []);
        if (s.success) setSocieties(s.data.societies || []);
        if (col.success) setCollectors(col.data.collectors || []);
        if (ov.success) setOverview(ov.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filterList = (list: any[], key: string) =>
    list.filter(item => (item[key] || '').toLowerCase().includes(search.toLowerCase()));

  const isCurrentUser = (item: any) =>
    user && (item.username === user.username || item.id === user.id);

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'citizens', label: 'Citizens', icon: Users },
    { id: 'societies', label: 'Societies / RWAs', icon: Building2 },
    { id: 'collectors', label: 'Collectors', icon: Truck },
  ];

  if (!isAuthenticated) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center glass-card-static p-8 rounded-2xl max-w-sm">
        <Trophy className="w-12 h-12 text-eco-amber mx-auto mb-3" />
        <p className="text-muted-foreground">Please login to view the leaderboard</p>
        <Link to="/" className="btn-eco mt-4 inline-block text-sm px-4 py-2">Go Home</Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading leaderboard…</p>
      </div>
    </div>
  );

  const currentList =
    tab === 'citizens' ? filterList(citizens, 'name') :
    tab === 'societies' ? filterList(societies, 'name') :
    filterList(collectors, 'name');

  const top3 = currentList.slice(0, 3);
  const rest = currentList.slice(3);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-eco-amber to-primary flex items-center justify-center shadow-xl">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold text-foreground">WasteWise Leaderboard</h1>
            <p className="text-muted-foreground mt-2">Top citizens, societies & collectors driving cleaner Delhi</p>
          </div>

          {/* Overview Stats */}
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Total Citizens', value: overview.totalCitizens, icon: Users, color: 'text-primary' },
                { label: 'Active Collectors', value: overview.totalCollectors, icon: Truck, color: 'text-emerald-600' },
                { label: 'Total Points', value: overview.totalRewardPoints?.toLocaleString(), icon: Star, color: 'text-eco-amber' },
                { label: 'Activities', value: overview.totalActivities, icon: Target, color: 'text-blue-500' },
              ].map(s => (
                <div key={s.label} className="glass-card-static p-4 rounded-2xl flex items-center gap-3">
                  <s.icon className={`w-7 h-7 ${s.color} flex-shrink-0`} />
                  <div>
                    <p className="text-xl font-bold text-foreground leading-tight">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Bar + Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex gap-1 p-1 bg-accent rounded-xl">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setSearch(''); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tab === t.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${tab}…`}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Podium — top 3 */}
          {top3.length >= 2 && !search && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[top3[1], top3[0], top3[2]].filter(Boolean).map((item, visualIdx) => {
                const realRank = visualIdx === 0 ? 2 : visualIdx === 1 ? 1 : 3;
                const heights = ['h-28', 'h-36', 'h-24'];
                return (
                  <motion.div
                    key={item.id || item.name}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: visualIdx * 0.12 }}
                    className={`glass-card-static p-4 rounded-2xl text-center flex flex-col items-center justify-end ${heights[visualIdx]} ${
                      realRank === 1 ? 'border-eco-amber border-2 shadow-xl' : ''
                    } ${isCurrentUser(item) ? 'ring-2 ring-primary' : ''}`}
                  >
                    <span className="text-3xl mb-1">{MEDAL[realRank - 1]}</span>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-1 ${
                      realRank === 1 ? 'bg-gradient-to-br from-eco-amber to-primary' :
                      realRank === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                      'bg-gradient-to-br from-amber-600 to-amber-800'
                    }`}>
                      {initial(item.name)}
                    </div>
                    <p className="text-xs font-bold text-foreground truncate max-w-[90px]">{item.name}</p>
                    {tab === 'societies' && (
                      <p className="text-[10px] text-muted-foreground">{item.members} members</p>
                    )}
                    <p className="text-sm font-extrabold text-primary mt-0.5">
                      {tab === 'societies'
                        ? item.totalPoints?.toLocaleString()
                        : item.rewardPoints?.toLocaleString()} pts
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Main Rankings List */}
          <div className="glass-card-static rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              {tab === 'citizens' && <Star className="w-5 h-5 text-eco-amber" />}
              {tab === 'societies' && <Building2 className="w-5 h-5 text-primary" />}
              {tab === 'collectors' && <Truck className="w-5 h-5 text-emerald-600" />}
              <h2 className="font-bold text-foreground">
                {tab === 'citizens' ? 'Citizen Rankings' : tab === 'societies' ? 'Society / RWA Rankings' : 'Collector Rankings'}
              </h2>
              <span className="ml-auto text-xs text-muted-foreground">{currentList.length} entries</span>
            </div>

            {currentList.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                No results found
              </div>
            ) : (
              <div className="divide-y divide-border">
                {currentList.map((item, i) => {
                  const rank = i + 1;
                  const pts = tab === 'societies' ? item.totalPoints : item.rewardPoints;
                  const isMe = isCurrentUser(item);

                  return (
                    <motion.div
                      key={item.id || item.name}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.4) }}
                      className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/30 ${
                        isMe ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                      }`}
                    >
                      {/* Rank badge */}
                      <span className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                        rank <= 3
                          ? 'bg-gradient-to-br from-eco-amber to-primary text-white'
                          : 'bg-accent text-muted-foreground'
                      }`}>
                        {rank <= 3 ? MEDAL[rank - 1] : rank}
                      </span>

                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        tab === 'societies'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-gradient-to-br from-primary/20 to-eco-teal/20 text-primary'
                      }`}>
                        {tab === 'societies' ? <Building2 className="w-4 h-4" /> : initial(item.name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground truncate">{item.name}</span>
                          {isMe && <span className="text-[10px] px-2 py-0.5 bg-primary text-primary-foreground rounded-full font-bold">YOU</span>}
                          {item.zone && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${zoneColor(item.zone)}`}>
                              {item.zone}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {tab === 'citizens' && `Level ${item.level} · ${item.totalActivities} activities · ${item.society || item.area}`}
                          {tab === 'societies' && `${item.members} members · ${item.totalActivities} activities · Eco Score: ${item.ecoScore}`}
                          {tab === 'collectors' && `Level ${item.level} · ${item.collections} collections · ${item.vehicleNumber || 'No vehicle'}`}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-extrabold text-primary text-sm">{pts?.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">points</p>
                      </div>

                      {/* Eco score bar for societies */}
                      {tab === 'societies' && (
                        <div className="w-20 flex-shrink-0 hidden sm:block">
                          <div className="flex items-center justify-between mb-0.5">
                            <Leaf className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-600">{item.ecoScore}%</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                              style={{ width: `${item.ecoScore}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Performer Spotlight */}
          {overview && (overview.topCitizen || overview.topCollector) && (
            <div className="grid md:grid-cols-2 gap-4 mt-8">
              {overview.topCitizen && (
                <div className="glass-card-static p-5 rounded-2xl border border-eco-amber/30 bg-eco-amber/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-6 h-6 text-eco-amber" />
                    <span className="font-bold text-sm text-foreground">Top Citizen</span>
                  </div>
                  <p className="text-xl font-extrabold text-foreground">{overview.topCitizen.name}</p>
                  <p className="text-sm text-muted-foreground">{overview.topCitizen.rewardPoints?.toLocaleString()} pts · Level {overview.topCitizen.level}</p>
                </div>
              )}
              {overview.topCollector && (
                <div className="glass-card-static p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                    <span className="font-bold text-sm text-foreground">Top Collector</span>
                  </div>
                  <p className="text-xl font-extrabold text-foreground">{overview.topCollector.name}</p>
                  <p className="text-sm text-muted-foreground">{overview.topCollector.rewardPoints?.toLocaleString()} pts · Level {overview.topCollector.level}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-primary hover:underline">← Back to Home</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
