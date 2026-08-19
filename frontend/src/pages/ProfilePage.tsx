import { motion } from "framer-motion";
import { User, Shield, Mail, MapPin, Clock, Activity, Phone, Edit, Trophy, MessageSquare, Truck, Star, AlertTriangle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import EditProfileModal from "@/components/EditProfileModal";
import { useToast } from "@/hooks/use-toast";

interface ProfilePageProps {
  userRole: string | null;
}

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    avatar: string | null;
  };
  location?: {
    type: string;
    coordinates: number[];
  };
  rewardPoints: number;
  level: number;
  assignedRoute?: {
    routeCode: string;
    name: string;
    status: string;
  };
}

interface Activity {
  type: string;
  action: string;
  description: string;
  status: string;
  createdAt: string;
  id: string;
}

interface Stats {
  rewardPoints: number;
  level: number;
  totalActivities: number;
  grievances?: number;
  collections?: number;
  resolvedGrievances?: number;
  completedRoutes?: number;
  managedCitizens?: number;
  managedCollectors?: number;
  totalGrievances?: number;
  pendingGrievances?: number;
}

const ProfilePage = ({ userRole }: ProfilePageProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('wastewise_token');
        const [profileResponse, activityResponse, statsResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/profile/activity?limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/profile/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!profileResponse.ok || !activityResponse.ok || !statsResponse.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const profileData = await profileResponse.json();
        const activityData = await activityResponse.json();
        const statsData = await statsResponse.json();

        if (profileData.success) {
          setProfile(profileData.data);
        }

        if (activityData.success) {
          setActivities(activityData.data.activities);
        }

        if (statsData.success) {
          setStats(statsData.data);
        }
      } catch (err: any) {
        console.error('Error fetching profile data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated, user]);

  const handleProfileUpdate = async (updatedProfile: any) => {
    try {
      const token = localStorage.getItem('wastewise_token');

      const formData = new FormData();
      formData.append('firstName', updatedProfile.name.split(' ')[0] || '');
      formData.append('lastName', updatedProfile.name.split(' ').slice(1).join(' ') || '');
      formData.append('phone', updatedProfile.phone);
      formData.append('address', updatedProfile.address);
      formData.append('location', updatedProfile.location);

      if (updatedProfile.avatar && updatedProfile.avatar.startsWith('data:')) {
        // Convert base64 to blob
        const response = await fetch(updatedProfile.avatar);
        const blob = await response.blob();
        formData.append('avatar', blob, 'avatar.jpg');
      }

      const profileResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await profileResponse.json();

      if (data.success) {
        setProfile(data.data);
        toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('wastewise_token');
      const [profileResponse, activityResponse, statsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/profile/activity?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/profile/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const profileData = await profileResponse.json();
      const activityData = await activityResponse.json();
      const statsData = await statsResponse.json();

      if (profileData.success) setProfile(profileData.data);
      if (activityData.success) setActivities(activityData.data.activities);
      if (statsData.success) setStats(statsData.data);
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      toast({ title: "Error", description: "Failed to refresh data", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const getDisplayName = () => {
    if (!profile) return "Loading...";
    if (profile.profile.firstName && profile.profile.lastName) {
      return `${profile.profile.firstName} ${profile.profile.lastName}`;
    }
    return profile.username;
  };

  const getProfileData = () => {
    if (!profile) return {
      name: "",
      phone: "",
      email: "",
      address: "",
      location: "",
      avatar: null
    };

    return {
      name: getDisplayName(),
      phone: profile.profile.phone || "",
      email: profile.email,
      address: profile.profile.address || "",
      location: profile.location 
        ? `${profile.location.coordinates[1]}, ${profile.location.coordinates[0]}`
        : "",
      avatar: profile.profile.avatar
    };
  };

  const roleSpecificInfo = () => {
    if (!stats) return null;

    if (userRole === "collector") {
      return (
        <div className="glass-card-static p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Collector Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Assigned Route</span><span className="text-sm font-semibold text-foreground">{profile?.assignedRoute?.routeCode || "Not assigned"}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Area</span><span className="text-sm font-semibold text-foreground">{profile?.assignedRoute?.name || "Not assigned"}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Status</span><span className="status-green">Active</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Collections</span><span className="text-sm font-semibold text-foreground">{stats.collections || 0}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Completed Routes</span><span className="text-sm font-semibold text-foreground">{stats.completedRoutes || 0}</span></div>
          </div>
        </div>
      );
    }
    if (userRole === "admin") {
      return (
        <div className="glass-card-static p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Admin Privileges</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Managed Citizens</span><span className="text-sm font-semibold text-foreground">{stats.managedCitizens || 0}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Managed Collectors</span><span className="text-sm font-semibold text-foreground">{stats.managedCollectors || 0}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Open Complaints</span><span className="text-sm font-semibold text-eco-rose">{stats.pendingGrievances || 0}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Complaints</span><span className="text-sm font-semibold text-foreground">{stats.totalGrievances || 0}</span></div>
            <Link to="/dashboard/admin" className="btn-eco text-sm w-full text-center block mt-2">Manage Users</Link>
          </div>
        </div>
      );
    }
    return (
      <div className="glass-card-static p-6">
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-eco-amber" /> Citizen Stats</h3>
        <div className="space-y-3">
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Reward Points</span><span className="text-sm font-semibold text-primary">{stats?.rewardPoints || 0}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Complaints Filed</span><span className="text-sm font-semibold text-foreground">{stats?.grievances || 0}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Resolved</span><span className="text-sm font-semibold text-primary">{stats?.resolvedGrievances || 0}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Collections</span><span className="text-sm font-semibold text-foreground">{stats?.collections || 0}</span></div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please login to view your profile</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center glass-card-static p-6 rounded-xl max-w-md">
          <AlertTriangle className="w-12 h-12 text-eco-rose mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Profile</h3>
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
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="text-sm text-primary hover:underline mb-6 inline-block">← Back to Home</Link>

          <div className="glass-card-static p-8 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-eco-teal flex items-center justify-center overflow-hidden">
                  {profile?.profile.avatar ? (
                    <img src={profile.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary-foreground" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{getDisplayName()}</h1>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><Shield className="w-4 h-4" /> {userRole || "Citizen"}</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><Mail className="w-4 h-4" /> {profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><Phone className="w-4 h-4" /> {profile?.profile.phone || "Not set"}</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="w-4 h-4" /> {profile?.profile.address || "Not set"}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setEditOpen(true)} className="btn-eco text-sm flex items-center gap-1"><Edit className="w-4 h-4" /> Edit Profile</button>
                <button onClick={refreshData} className="btn-eco-outline text-sm flex items-center gap-1" disabled={refreshing}>
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card-static p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Activity Log</h3>
              <div className="space-y-3">
                {activities.map((activity, i) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-foreground">{activity.action}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 
                      {(() => {
                        const date = new Date(activity.createdAt);
                        const now = new Date();
                        const diffMs = now.getTime() - date.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffHours = Math.floor(diffMins / 60);
                        const diffDays = Math.floor(diffHours / 24);

                        if (diffMins < 60) return `${diffMins} minutes ago`;
                        if (diffHours < 24) return `${diffHours} hours ago`;
                        return `${diffDays} days ago`;
                      })()}
                    </span>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                )}
              </div>
            </div>

            {roleSpecificInfo()}
          </div>
        </motion.div>
      </div>

      <EditProfileModal 
        isOpen={editOpen} 
        onClose={() => setEditOpen(false)} 
        profile={getProfileData()} 
        onSave={handleProfileUpdate} 
      />
    </div>
  );
};

export default ProfilePage;
