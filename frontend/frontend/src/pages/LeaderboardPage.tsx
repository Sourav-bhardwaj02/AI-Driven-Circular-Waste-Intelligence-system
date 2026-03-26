import { motion } from "framer-motion";
import { Award, Trophy, Star, TrendingUp, Medal, AlertTriangle, Users, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface Citizen {
  id: string;
  username: string;
  name: string;
  area: string;
  rewardPoints: number;
  level: number;
  reports: number;
  collections: number;
  totalActivities: number;
  recentTransactions: any[];
}

interface Community {
  name: string;
  members: number;
  totalRewardPoints: number;
  avgLevel: number;
  recentReports: number;
  recentCollections: number;
  totalActivities: number;
  avgPointsPerMember: number;
}

interface Overview {
  totalUsers: number;
  totalCitizens: number;
  totalCollectors: number;
  totalActivities: number;
  totalRewardPoints: number;
  topCitizen: {
    name: string;
    rewardPoints: number;
  } | null;
  topCollector: {
    name: string;
    rewardPoints: number;
  } | null;
}

const LeaderboardPage = () => {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'citizens' | 'communities'>('citizens');
  
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [citizensResponse, communitiesResponse, overviewResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/leaderboard/citizens?limit=10`),
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/leaderboard/communities?limit=5`),
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/leaderboard/overview`)
        ]);

        if (!citizensResponse.ok || !communitiesResponse.ok || !overviewResponse.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }

        const citizensData = await citizensResponse.json();
        const communitiesData = await communitiesResponse.json();
        const overviewData = await overviewResponse.json();

        if (citizensData.success) {
          setCitizens(citizensData.data.citizens);
        }

        if (communitiesData.success) {
          setCommunities(communitiesData.data.communities);
        }

        if (overviewData.success) {
          setOverview(overviewData.data);
        }
      } catch (err: any) {
        console.error('Error fetching leaderboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const getBadge = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please login to view leaderboards</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leaderboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center glass-card-static p-6 rounded-xl max-w-md">
          <AlertTriangle className="w-12 h-12 text-eco-rose mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Leaderboard</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-eco"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="text-sm text-primary hover:underline mb-6 inline-block">← Back to Home</Link>
          <h1 className="section-title mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-eco-amber" /> 
            Leaderboard
          </h1>
          <p className="section-subtitle mb-10">Top citizens and communities driving waste management excellence</p>

          {/* Overview Stats */}
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card-static p-4 text-center">
                <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{overview.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
              <div className="glass-card-static p-4 text-center">
                <Target className="w-6 h-6 text-eco-amber mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{overview.totalActivities.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Activities</p>
              </div>
              <div className="glass-card-static p-4 text-center">
                <Award className="w-6 h-6 text-eco-teal mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{overview.totalRewardPoints.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
              <div className="glass-card-static p-4 text-center">
                <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{overview.totalCitizens.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Active Citizens</p>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('citizens')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'citizens' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-accent text-muted-foreground hover:bg-accent/50'
              }`}
            >
              Top Citizens
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'communities' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-accent text-muted-foreground hover:bg-accent/50'
              }`}
            >
              Communities
            </button>
          </div>

          {activeTab === 'citizens' && (
            <>
              {/* Top 3 Highlight */}
              {citizens.length >= 3 && (
                <div className="grid md:grid-cols-3 gap-5 mb-8">
                  {citizens.slice(0, 3).map((citizen, i) => (
                    <motion.div 
                      key={citizen.id} 
                      initial={{ opacity: 0, y: 30 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: i * 0.15 }}
                      className={`glass-card-static p-6 text-center ${i === 0 ? "md:-mt-4 md:scale-105" : ""}`}
                    >
                      <span className="text-4xl mb-3 block">{getBadge(i + 1)}</span>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-eco-teal mx-auto mb-3 flex items-center justify-center text-primary-foreground font-bold text-xl">
                        {getInitial(citizen.name)}
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{citizen.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{citizen.area}</p>
                      <p className="text-2xl font-extrabold text-primary">{citizen.rewardPoints.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{citizen.totalActivities} activities</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Full Citizen Rankings */}
              <div className="glass-card-static p-5">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-eco-amber" /> 
                  Top Citizens
                </h3>
                {citizens.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No citizens found</p>
                ) : (
                  <div className="space-y-2">
                    {citizens.map((citizen, i) => (
                      <motion.div 
                        key={citizen.id} 
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-accent/30 transition-colors border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            i < 3 ? "bg-gradient-to-br from-eco-amber to-primary text-primary-foreground" : "bg-accent text-muted-foreground"
                          }`}>
                            {i + 1}
                          </span>
                          <div>
                            <span className="text-sm font-medium text-foreground">{citizen.name}</span>
                            <p className="text-xs text-muted-foreground">
                              {citizen.area} · Level {citizen.level} · {citizen.totalActivities} activities
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-primary">{citizen.rewardPoints.toLocaleString()}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'communities' && (
            <div className="glass-card-static p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Medal className="w-5 h-5 text-primary" /> 
                Top Communities
              </h3>
              {communities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No communities found</p>
              ) : (
                <div className="space-y-2">
                  {communities.map((community, i) => (
                    <motion.div 
                      key={community.name} 
                      initial={{ opacity: 0, x: 20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-accent/30 transition-colors border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          i < 3 ? "bg-gradient-to-br from-eco-amber to-primary text-primary-foreground" : "bg-accent text-muted-foreground"
                        }`}>
                          {i + 1}
                        </span>
                        <div>
                          <span className="text-sm font-medium text-foreground">{community.name}</span>
                          <p className="text-xs text-muted-foreground">
                            {community.members} members · Avg Level {community.avgLevel} · {community.totalActivities} activities
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-primary block">
                          {community.totalRewardPoints.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {community.avgPointsPerMember} avg/member
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
