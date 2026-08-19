import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ThumbsUp, Award, TrendingUp, Send, Plus, X, Upload, MapPin, Clock, ChevronUp, AlertTriangle, ShieldCheck, Truck, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Grievance {
  id?: string;
  _id?: string;
  citizenId?: any;
  title: string;
  description: string;
  category: string;
  location: string;
  coordinates?: {
    type?: string;
    coordinates?: number[];
  };
  image?: string | null;
  status: "Pending" | "In Progress" | "Resolved";
  priority: number;
  votedBy?: any[];
  comments?: any[];
  createdAt?: string;
}

interface Community {
  name: string;
  members?: number;
  totalPoints?: number;
  totalRewardPoints?: number;
  avgLevel?: number;
  recentReports?: number;
  recentCollections?: number;
  totalActivities?: number;
  avgPointsPerMember?: number;
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

        const token = localStorage.getItem('wastewise_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const [grievancesResponse, communitiesResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/grievance?sortBy=priority&sortOrder=desc&limit=20`, { headers }).catch(() => null),
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/leaderboard/communities?limit=5`, { headers }).catch(() => null)
        ]);

        if (grievancesResponse && grievancesResponse.ok) {
          const grievancesData = await grievancesResponse.json();
          if (grievancesData.success && Array.isArray(grievancesData.data?.grievances)) {
            setGrievances(grievancesData.data.grievances);
          }
        }

        if (communitiesResponse && communitiesResponse.ok) {
          const communitiesData = await communitiesResponse.json();
          if (communitiesData.success) {
            const list = communitiesData.data?.communities || communitiesData.data?.societies || [];
            if (Array.isArray(list)) {
              setCommunities(list);
            }
          }
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
        const response = await fetch(newReport.image);
        const blob = await response.blob();
        formData.append('image', blob, 'grievance.jpg');
      }

      let coordinatesStr = JSON.stringify([77.2090, 28.6139]); // Default Delhi coordinates
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          coordinatesStr = JSON.stringify([pos.coords.longitude, pos.coords.latitude]);
        } catch {
          // fallback to default
        }
      }
      formData.append('coordinates', coordinatesStr);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/grievance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wastewise_token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setGrievances([data.data, ...(grievances || [])]);
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

  const handleIncreaseWeight = async (grievanceId?: string) => {
    if (!grievanceId) return;
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
        setGrievances((prev) => (prev || []).map(g => 
          (g._id === grievanceId || g.id === grievanceId) ? data.data : g
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

  const handleComment = async (grievanceId?: string) => {
    if (!grievanceId) return;
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
        setGrievances((prev) => (prev || []).map(g => 
          (g._id === grievanceId || g.id === grievanceId) ? data.data : g
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

  const handleUpdateStatus = async (grievanceId: string, newStatus: "Pending" | "In Progress" | "Resolved") => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/admin/complaints/${grievanceId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wastewise_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus.toLowerCase().replace(' ', '_') })
      });
    } catch (e) {
      console.warn('Backend sync note:', e);
    }
    setGrievances(prev => (prev || []).map(g => (g._id === grievanceId || g.id === grievanceId) ? { ...g, status: newStatus } : g));
    toast({ title: "Grievance Updated", description: `Status changed to ${newStatus}` });
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

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${Math.max(diffMins, 1)} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getUserName = (grievance: Grievance) => {
    const citizen = grievance?.citizenId;
    if (!citizen) return "Anonymous Citizen";
    if (typeof citizen === 'string') return "Citizen";
    const firstName = citizen.profile?.firstName;
    const lastName = citizen.profile?.lastName;

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;

    return citizen.username || citizen.name || "Anonymous Citizen";
  };

  const getCommentAuthor = (comment: any) => {
    const u = comment?.user;
    if (!u) return { name: "User", initial: "U" };
    if (typeof u === 'string') return { name: "User", initial: "U" };
    const firstName = u.profile?.firstName;
    const lastName = u.profile?.lastName;
    const name = (firstName && lastName) ? `${firstName} ${lastName}` : (firstName || u.username || u.name || "User");
    return { name, initial: name.charAt(0).toUpperCase() || "U" };
  };

  const hasVoted = (grievance: Grievance) => {
    if (!grievance?.votedBy || !Array.isArray(grievance.votedBy) || !user?.id) return false;
    return grievance.votedBy.some(voter => {
      const vId = typeof voter === 'string' ? voter : voter?._id || voter?.id;
      return vId === user.id;
    });
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <h1 className="section-title">Community Grievance Hub</h1>
            {user?.role === 'citizen' && (
              <button onClick={() => setShowSubmitForm(true)} className="btn-eco text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Submit New Report
              </button>
            )}
            {user?.role === 'admin' && (
              <div className="px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>MCD Admin Oversight Hub (Monitoring & Resolution Mode)</span>
              </div>
            )}
            {user?.role === 'collector' && (
              <div className="px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                <span>Municipal Collection Fleet Mode</span>
              </div>
            )}
          </div>
          <p className="section-subtitle mb-8">Report issues, upvote complaints, and track resolution status</p>

          {/* Submit Report Modal */}
          <AnimatePresence>
            {showSubmitForm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowSubmitForm(false)}>
                <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", damping: 25 }}
                  className="modal-card p-6 md:p-8 w-full max-w-lg relative z-10 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-2xl text-foreground" onClick={e => e.stopPropagation()}>
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
                    <button onClick={handleSubmitReport} disabled={submitting} className="btn-eco flex-1 text-sm py-2.5">{submitting ? "Submitting..." : "Submit Report"}</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Grievance Feed */}
            <div className="lg:col-span-2 space-y-4">
              {grievances.length === 0 ? (
                <div className="glass-card-static p-8 text-center rounded-2xl">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-foreground font-semibold">No grievances reported yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Be the first to submit a community report!</p>
                </div>
              ) : (
                grievances.map((grievance, i) => {
                  const grievanceId = (grievance._id || grievance.id || `g-${i}`) as string;
                  return (
                    <motion.div key={grievanceId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card-static p-5">
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
                          <button onClick={() => handleIncreaseWeight(grievanceId)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${hasVoted(grievance) ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-primary/10 text-muted-foreground hover:text-primary"}`}
                            disabled={hasVoted(grievance)}
                          >
                            <ChevronUp className="w-5 h-5" />
                          </button>
                          <span className="text-sm font-bold text-foreground">{grievance.priority || 0}</span>
                          <span className="text-xs text-muted-foreground">priority</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleIncreaseWeight(grievanceId)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors" disabled={hasVoted(grievance)}>
                            <ThumbsUp className="w-4 h-4" /> +1 Increase Weight
                          </button>
                          <button onClick={() => toggleComments(grievanceId)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                            <MessageSquare className="w-4 h-4" /> {grievance.comments?.length || 0} Comments
                          </button>
                        </div>

                        {user?.role === 'admin' && (
                          <div className="flex items-center gap-1.5 bg-primary/5 p-1 rounded-xl border border-primary/20">
                            <span className="text-[11px] font-bold text-primary px-1.5">Admin Action:</span>
                            {grievance.status !== "In Progress" && (
                              <button
                                onClick={() => handleUpdateStatus(grievanceId, "In Progress")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors"
                              >
                                Set In Progress
                              </button>
                            )}
                            {grievance.status !== "Resolved" && (
                              <button
                                onClick={() => handleUpdateStatus(grievanceId, "Resolved")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Comments */}
                      <AnimatePresence>
                        {expandedComments.includes(grievanceId) && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 pt-3 border-t border-border space-y-2">
                            {grievance.comments && Array.isArray(grievance.comments) && grievance.comments.map((comment, ci) => {
                              const author = getCommentAuthor(comment);
                              return (
                                <div key={ci} className="flex items-start gap-2">
                                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                                    {author.initial}
                                  </div>
                                  <div className="bg-accent/50 rounded-xl px-3 py-2">
                                    <span className="text-xs font-semibold text-foreground">
                                      {author.name}
                                    </span>
                                    <p className="text-xs text-muted-foreground">{comment.text}</p>
                                  </div>
                                </div>
                              );
                            })}
                            <div className="flex items-center gap-2">
                              <input 
                                value={newComments[grievanceId] || ""} 
                                onChange={e => setNewComments({ ...newComments, [grievanceId]: e.target.value })} 
                                onKeyDown={e => e.key === "Enter" && handleComment(grievanceId)} 
                                placeholder="Write a comment..."
                                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" 
                              />
                              <button onClick={() => handleComment(grievanceId)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                                <Send className="w-4 h-4 text-primary" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Leaderboard */}
              <div className="glass-card-static p-5">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-eco-amber" /> Top Communities</h3>
                <div className="space-y-3">
                  {communities.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No community data available</p>
                  ) : (
                    communities.map((community, index) => (
                      <div key={community.name || index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? "bg-gradient-to-br from-eco-amber to-primary text-primary-foreground" : "bg-accent text-muted-foreground"}`}>
                            {index + 1}
                          </span>
                          <span className="text-sm text-foreground">{community.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-primary">{(community.totalPoints ?? community.totalRewardPoints ?? 0).toLocaleString()}</span>
                      </div>
                    ))
                  )}
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
