import { motion, AnimatePresence } from "framer-motion";
import { Users, MessageSquare, ThumbsUp, Award, TrendingUp, Send, Image, Plus, X, Upload, MapPin, Clock, ChevronUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Grievance {
  id: string;
  citizenId: {
    _id: string;
    username: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  title: string;
  description: string;
  category: string;
  location: string;
  coordinates: {
    type: string;
    coordinates: number[];
  };
  image: string | null;
  status: "Pending" | "In Progress" | "Resolved";
  priority: number;
  votedBy: {
    _id: string;
    username: string;
  }[];
  comments: {
    user: {
      _id: string;
      username: string;
      profile: {
        firstName: string;
        lastName: string;
      };
    };
    text: string;
    createdAt: string;
  }[];
  createdAt: string;
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

const categories = ["Overflow", "Illegal Dumping", "Missed Pickup", "Hazardous", "Wet Waste", "Other"];

const CommunityPage = () => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newReport, setNewReport] = useState({ 
    title: "", 
    description: "", 
    location: "", 
    category: "Overflow", 
    image: null as string | null 
  });
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [grievancesResponse, communitiesResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/grievance?sortBy=priority&sortOrder=desc&limit=20`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('wastewise_token')}`
            }
          }),
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/leaderboard/communities?limit=5`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('wastewise_token')}`
            }
          })
        ]);

        if (!grievancesResponse.ok || !communitiesResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const grievancesData = await grievancesResponse.json();
        const communitiesData = await communitiesResponse.json();

        if (grievancesData.success) {
          setGrievances(grievancesData.data.grievances);
        }

        if (communitiesData.success) {
          setCommunities(communitiesData.data.communities);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const handleSubmitReport = async () => {
    if (!newReport.title.trim() || !newReport.description.trim() || !newReport.location.trim()) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', newReport.title);
      formData.append('description', newReport.description);
      formData.append('category', newReport.category);
      formData.append('location', newReport.location);
      
      if (newReport.image) {
        // Convert base64 to blob
        const response = await fetch(newReport.image);
        const blob = await response.blob();
        formData.append('image', blob, 'grievance.jpg');
      }

      // Add coordinates if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            formData.append('coordinates', JSON.stringify([pos.coords.longitude, pos.coords.latitude]));
          },
          () => {
            formData.append('coordinates', JSON.stringify([77.2090, 28.6139])); // Default Delhi coordinates
          }
        );
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/grievance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wastewise_token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setGrievances([data.data, ...grievances]);
        setNewReport({ title: "", description: "", location: "", category: "Overflow", image: null });
        setShowSubmitForm(false);
        toast({ title: "Report Submitted", description: "Your grievance has been registered successfully." });
      } else {
        throw new Error(data.message || 'Failed to submit report');
      }
    } catch (err: any) {
      console.error('Error submitting report:', err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleIncreaseWeight = async (grievanceId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/grievance/${grievanceId}/vote`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wastewise_token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setGrievances(grievances.map(g => 
          g.id === grievanceId ? data.data : g
        ));
      } else {
        throw new Error(data.message || 'Failed to vote');
      }
    } catch (err: any) {
      console.error('Error voting:', err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleComments = (id: string) => {
    setExpandedComments(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleComment = async (grievanceId: string) => {
    const text = newComments[grievanceId];
    if (!text?.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/grievance/${grievanceId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wastewise_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (data.success) {
        setGrievances(grievances.map(g => 
          g.id === grievanceId ? data.data : g
        ));
        setNewComments({ ...newComments, [grievanceId]: "" });
      } else {
        throw new Error(data.message || 'Failed to add comment');
      }
    } catch (err: any) {
      console.error('Error adding comment:', err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewReport({ ...newReport, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleAutoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setNewReport({ 
          ...newReport, 
          location: `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}` 
        }),
        () => setNewReport({ ...newReport, location: "New Delhi, India" })
      );
    } else {
      setNewReport({ ...newReport, location: "New Delhi, India" });
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "Resolved") return "status-green";
    if (status === "In Progress") return "status-amber";
    return "status-rose";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getUserName = (grievance: Grievance) => {
  const user = grievance.citizenId;
  const firstName = user?.profile?.firstName;
  const lastName = user?.profile?.lastName;

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return user?.username || "Unknown User";
};

  const hasVoted = (grievance: Grievance) => {
    return grievance.votedBy.some(voter => voter._id === user?.id);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please login to view community grievances</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading community data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center glass-card-static p-6 rounded-xl max-w-md">
          <AlertTriangle className="w-12 h-12 text-eco-rose mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Data</h3>
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
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="text-sm text-primary hover:underline mb-6 inline-block">← Back to Home</Link>

          <div className="flex items-center justify-between mb-2">
            <h1 className="section-title">Community Grievance Hub</h1>
            <button onClick={() => setShowSubmitForm(true)} className="btn-eco text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Submit New Report</button>
          </div>
          <p className="section-subtitle mb-8">Report issues, upvote complaints, and track resolution status</p>

          {/* Submit Report Modal */}
          <AnimatePresence>
            {showSubmitForm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowSubmitForm(false)}>
                <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", damping: 25 }}
                  className="glass-card-static p-6 w-full max-w-lg relative z-10" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-foreground">Submit Grievance Report</h2>
                    <button onClick={() => setShowSubmitForm(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
                  </div>

                  {/* Image Upload */}
                  <label className="block mb-4 cursor-pointer">
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors">
                      {newReport.image ? (
                        <img src={newReport.image} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload image</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>

                  {/* Location */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
                    <div className="flex gap-2">
                      <input value={newReport.location} onChange={e => setNewReport({ ...newReport, location: e.target.value })} placeholder="Enter location or use GPS"
                        className="flex-1 px-3 py-2 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <button onClick={handleAutoLocation} className="px-3 py-2 rounded-xl border border-border hover:bg-accent transition-colors" title="Auto-detect GPS">
                        <MapPin className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                    <select value={newReport.category} onChange={e => setNewReport({ ...newReport, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                    <textarea value={newReport.description} onChange={e => setNewReport({ ...newReport, description: e.target.value })} placeholder="Describe the issue in detail..."
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-24" />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setShowSubmitForm(false)} className="btn-eco-outline flex-1 text-sm py-2.5">Cancel</button>
                    <button onClick={handleSubmitReport} className="btn-eco flex-1 text-sm py-2.5">Submit Report</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Grievance Feed */}
            <div className="lg:col-span-2 space-y-4">
              {grievances.map((grievance, i) => (
                <motion.div key={grievance.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card-static p-5">
                  <div className="flex gap-4">
                    {/* Image or Placeholder */}
                    <div className="w-24 h-24 rounded-xl bg-accent overflow-hidden shrink-0">
                      {grievance.image ? (
                        <img src={grievance.image} alt="Report" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <AlertTriangle className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">{grievance.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTimeAgo(grievance.createdAt)}</span>
                            <span className="text-xs text-muted-foreground">by {getUserName(grievance)}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">{grievance.category}</span>
                          </div>
                        </div>
                        <span className={getStatusStyle(grievance.status)}>{grievance.status}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{grievance.description}</p>
                    </div>

                    {/* Priority Score */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button onClick={() => handleIncreaseWeight(grievance.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${hasVoted(grievance) ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-primary/10 text-muted-foreground hover:text-primary"}`}
                        disabled={hasVoted(grievance)}
                      >
                        <ChevronUp className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-bold text-foreground">{grievance.priority}</span>
                      <span className="text-xs text-muted-foreground">priority</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <button onClick={() => handleIncreaseWeight(grievance.id)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors" disabled={hasVoted(grievance)}>
                      <ThumbsUp className="w-4 h-4" /> +1 Increase Weight
                    </button>
                    <button onClick={() => toggleComments(grievance.id)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <MessageSquare className="w-4 h-4" /> {grievance.comments.length} Comments
                    </button>
                  </div>

                  {/* Comments */}
                  <AnimatePresence>
                    {expandedComments.includes(grievance.id) && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 pt-3 border-t border-border space-y-2">
                        {grievance.comments.map((comment, ci) => (
                          <div key={ci} className="flex items-start gap-2">
                            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                              {comment.user.profile.firstName ? comment.user.profile.firstName[0] : comment.user.username[0]}
                            </div>
                            <div className="bg-accent/50 rounded-xl px-3 py-2">
                              <span className="text-xs font-semibold text-foreground">
                                {comment.user.profile.firstName && comment.user.profile.lastName 
                                  ? `${comment.user.profile.firstName} ${comment.user.profile.lastName}`
                                  : comment.user.username
                                }
                              </span>
                              <p className="text-xs text-muted-foreground">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <input 
                            value={newComments[grievance.id] || ""} 
                            onChange={e => setNewComments({ ...newComments, [grievance.id]: e.target.value })} 
                            onKeyDown={e => e.key === "Enter" && handleComment(grievance.id)} 
                            placeholder="Write a comment..."
                            className="flex-1 px-3 py-2 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" 
                          />
                          <button onClick={() => handleComment(grievance.id)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                            <Send className="w-4 h-4 text-primary" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Leaderboard */}
              <div className="glass-card-static p-5">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-eco-amber" /> Top Communities</h3>
                <div className="space-y-3">
                  {communities.map((community, index) => (
                    <div key={community.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? "bg-gradient-to-br from-eco-amber to-primary text-primary-foreground" : "bg-accent text-muted-foreground"}`}>
                          {index + 1}
                        </span>
                        <span className="text-sm text-foreground">{community.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">{community.totalRewardPoints.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <Link to="/leaderboard" className="text-sm text-primary hover:underline mt-3 block text-center">View Full Leaderboard →</Link>
              </div>

              {/* Quick Stats */}
              <div className="glass-card-static p-5">
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Reports</span><span className="text-sm font-semibold text-foreground">{grievances.length}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Pending</span><span className="text-sm font-semibold text-eco-rose">{grievances.filter(g => g.status === "Pending").length}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Resolved</span><span className="text-sm font-semibold text-primary">{grievances.filter(g => g.status === "Resolved").length}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">Active Communities</span><span className="text-sm font-semibold text-foreground">{communities.length}</span></div>
                </div>
              </div>

              {/* Report Status Legend */}
              <div className="glass-card-static p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Status Legend</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><span className="status-rose">Pending</span><span className="text-xs text-muted-foreground">Awaiting review</span></div>
                  <div className="flex items-center gap-2"><span className="status-amber">In Progress</span><span className="text-xs text-muted-foreground">Collector assigned</span></div>
                  <div className="flex items-center gap-2"><span className="status-green">Resolved</span><span className="text-xs text-muted-foreground">Issue cleared</span></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CommunityPage;
