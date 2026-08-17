import { motion, AnimatePresence } from "framer-motion";
import { Home, ClipboardList, BarChart3, MessageSquare, MapPin, Users, Cloud, Bell, Search, ChevronRight, AlertTriangle, CheckCircle, Download, Send, RefreshCw, X, Radio, Star, Filter, ShieldCheck, UserCheck, Truck, Building, FileSpreadsheet, Eye } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { useDashboard } from "@/context/DashboardContext";
import LiveMap from "@/components/LiveMap";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const sidebarItems = [
  { icon: Home, label: "Overview", sub: "Dashboard" },
  { icon: FileSpreadsheet, label: "User Directory", sub: "Spreadsheet" },
  { icon: BarChart3, label: "Analytics", sub: "Metrics" },
  { icon: MessageSquare, label: "Citizen Feedback", sub: "Reviews" },
  { icon: MapPin, label: "Live Tracking", sub: "GPS" },
  { icon: Users, label: "Workforce", sub: "Members" },
  { icon: Cloud, label: "AI Engine", sub: "Optimization" },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  
  // Section toggle for User Directory (Citizens, Collectors, Admins)
  const [userTabSection, setUserTabSection] = useState<'citizens' | 'collectors' | 'admins'>('citizens');
  // Section toggle for Feedback
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState('all');

  const { data, complaints: initialComplaints, loading, error, refetch } = useDashboard();
  const { toast } = useToast();
  const mapSectionRef = useRef<HTMLDivElement>(null);

  // Live data states
  const [usersData, setUsersData] = useState<{ citizens: any[]; collectors: any[]; admins: any[] }>({
    citizens: [],
    collectors: [],
    admins: []
  });
  const [feedbacksData, setFeedbacksData] = useState<any[]>([]);
  const [complaintsList, setComplaintsList] = useState<any[]>([]);

  // Fetch users & feedbacks from API with rich fallback seed data
  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        const [usersRes, feedbacksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/users`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE_URL}/admin/feedbacks`).then(r => r.ok ? r.json() : null)
        ]);

        if (usersRes && usersRes.citizens) {
          setUsersData({
            citizens: usersRes.citizens || [],
            collectors: usersRes.collectors || [],
            admins: usersRes.admins || []
          });
        } else {
          // Fallback Seed User Dataset
          setUsersData({
            citizens: [
              { _id: 'CIT-101', username: 'citizen_rahul', email: 'citizen@wastewise.com', profile: { firstName: 'Rahul', lastName: 'Sharma', phone: '9876543212', address: 'Green Park RWA', zone: 'South Delhi' }, rewardPoints: 1240, level: 8, createdAt: '2026-01-15' },
              { _id: 'CIT-102', username: 'neha_green', email: 'neha@wastewise.com', profile: { firstName: 'Neha', lastName: 'Gupta', phone: '9876543218', address: 'Green Park Sector 4', zone: 'South Delhi' }, rewardPoints: 980, level: 6, createdAt: '2026-02-01' },
              { _id: 'CIT-103', username: 'kavya_hk', email: 'kavya@wastewise.com', profile: { firstName: 'Kavya', lastName: 'Nair', phone: '9876543224', address: 'Hauz Khas Enclave', zone: 'South Delhi' }, rewardPoints: 1650, level: 9, createdAt: '2026-01-10' },
              { _id: 'CIT-104', username: 'deepak_lnc', email: 'deepak@wastewise.com', profile: { firstName: 'Deepak', lastName: 'Joshi', phone: '9876543230', address: 'Lajpat Nagar Coop', zone: 'South Delhi' }, rewardPoints: 1380, level: 8, createdAt: '2026-02-12' },
              { _id: 'CIT-105', username: 'anita_dw7', email: 'anita@wastewise.com', profile: { firstName: 'Anita', lastName: 'Singh', phone: '9876543245', address: 'Dwarka Sector 7', zone: 'West Delhi' }, rewardPoints: 2100, level: 10, createdAt: '2025-12-05' }
            ],
            collectors: [
              { _id: 'COL-201', username: 'collector_raj', email: 'collector@wastewise.com', profile: { firstName: 'Raj', lastName: 'Kumar', phone: '9876543211', address: 'Zone 4 Depot', zone: 'South Delhi' }, vehicleNumber: 'DL-01-AB-1234', rewardPoints: 850, status: 'active', createdAt: '2025-11-20' },
              { _id: 'COL-202', username: 'collector_priya', email: 'collector2@wastewise.com', profile: { firstName: 'Priya', lastName: 'Singh', phone: '9876543221', address: 'Zone 2 Depot', zone: 'North Delhi' }, vehicleNumber: 'DL-02-CD-5678', rewardPoints: 620, status: 'active', createdAt: '2025-12-01' },
              { _id: 'COL-203', username: 'collector_amit', email: 'collector3@wastewise.com', profile: { firstName: 'Amit', lastName: 'Verma', phone: '9876543231', address: 'Zone 7 Depot', zone: 'East Delhi' }, vehicleNumber: 'DL-07-EF-9012', rewardPoints: 410, status: 'idle', createdAt: '2026-01-05' }
            ],
            admins: [
              { _id: 'ADM-301', username: 'mcd_admin', email: 'admin@wastewise.com', profile: { firstName: 'MCD', lastName: 'Admin', phone: '9876543210', address: 'Delhi MCD Headquarters', zone: 'Central Delhi' }, rewardPoints: 5000, role: 'admin', createdAt: '2025-01-01' }
            ]
          });
        }

        if (feedbacksRes && feedbacksRes.length > 0) {
          setFeedbacksData(feedbacksRes);
        } else {
          // Fallback Feedbacks Dataset
          setFeedbacksData([
            { id: 'FB-01', user: 'Rahul Sharma', email: 'citizen@wastewise.com', category: 'Garbage Pickup Timings', feedback: 'Morning truck arrived right on time today at Green Park!', location: 'Green Park RWA', rating: 5, status: 'Acknowledged', date: '2026-08-17' },
            { id: 'FB-02', user: 'Kavya Nair', email: 'kavya@wastewise.com', category: 'Segregation Awareness', feedback: 'App interface made dry/wet waste segregation so effortless.', location: 'Hauz Khas Enclave', rating: 5, status: 'Resolved', date: '2026-08-16' },
            { id: 'FB-03', user: 'Deepak Joshi', email: 'deepak@wastewise.com', category: 'Overflowing Bin', feedback: 'Community bin near market clearing delayed by 30 mins.', location: 'Lajpat Nagar II', rating: 3, status: 'In Progress', date: '2026-08-15' },
            { id: 'FB-04', user: 'Anita Singh', email: 'anita@wastewise.com', category: 'Collector Behavior', feedback: 'Collector Raj Kumar was very polite and helpful during collection.', location: 'Dwarka Sector 7', rating: 5, status: 'Acknowledged', date: '2026-08-14' }
          ]);
        }
      } catch (err) {
        console.error('Error fetching admin details:', err);
      }
    };

    fetchAdminDetails();
  }, []);

  // Sync complaints list from context
  useEffect(() => {
    if (initialComplaints && initialComplaints.length > 0) {
      setComplaintsList(initialComplaints);
    } else {
      setComplaintsList([
        { id: 1, sector: "Green Park - Block C Garbage Dump", time: "10 mins ago", status: "Pending", priority: "High", citizen: "Rahul Sharma" },
        { id: 2, sector: "Lajpat Nagar II - Overflowing Bin", time: "25 mins ago", status: "In Progress", priority: "Medium", citizen: "Deepak Joshi" },
        { id: 3, sector: "Hauz Khas Enclave - Commercial Waste", time: "1 hour ago", status: "Resolved", priority: "Low", citizen: "Kavya Nair" },
        { id: 4, sector: "Connaught Place Inner Circle", time: "2 hours ago", status: "Pending", priority: "High", citizen: "Priti Agarwal" },
        { id: 5, sector: "Dwarka Sector 7 Market Complex", time: "3 hours ago", status: "Resolved", priority: "Low", citizen: "Anita Singh" }
      ]);
    }
  }, [initialComplaints]);

  // Filter Users Spreadsheet Data
  const currentSpreadsheetUsers = useMemo(() => {
    const rawList = usersData[userTabSection] || [];
    return rawList.filter(u => {
      const fullText = `${u.username} ${u.email} ${u.profile?.firstName} ${u.profile?.lastName} ${u.profile?.zone} ${u.profile?.address} ${u.vehicleNumber || ''}`.toLowerCase();
      return fullText.includes(searchQuery.toLowerCase());
    });
  }, [usersData, userTabSection, searchQuery]);

  // Download Spreadsheet as CSV
  const handleDownloadSpreadsheet = (dataArray: any[], filenamePrefix: string) => {
    if (!dataArray || dataArray.length === 0) {
      toast({ title: "No Data", description: "No spreadsheet rows available to export." });
      return;
    }

    let csv = "";
    if (filenamePrefix.includes("users")) {
      csv = "User_ID,Username,Email,First_Name,Last_Name,Phone,Zone,Address,Reward_Points,Vehicle_Number,Created_At\n" +
        dataArray.map(u => 
          `"${u._id}","${u.username}","${u.email}","${u.profile?.firstName || ''}","${u.profile?.lastName || ''}","${u.profile?.phone || ''}","${u.profile?.zone || ''}","${u.profile?.address || ''}","${u.rewardPoints || 0}","${u.vehicleNumber || 'N/A'}","${u.createdAt || ''}"`
        ).join("\n");
    } else if (filenamePrefix.includes("feedback")) {
      csv = "Feedback_ID,User_Name,Email,Category,Feedback_Content,Location,Rating_Stars,Status,Date\n" +
        dataArray.map(f => 
          `"${f.id}","${f.user}","${f.email}","${f.category}","${f.feedback}","${f.location}","${f.rating}","${f.status}","${f.date}"`
        ).join("\n");
    } else {
      csv = JSON.stringify(dataArray, null, 2);
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Spreadsheet Exported",
      description: `${filenamePrefix.toUpperCase()} CSV file downloaded successfully!`,
    });
  };

  const handleResolveComplaint = (id: number) => {
    setComplaintsList(prev => prev.map(c => c.id === id ? { ...c, status: "Resolved" } : c));
    toast({
      title: "Task Resolved",
      description: "Municipal complaint status set to RESOLVED.",
    });
  };

  const handleSendBroadcastAlert = () => {
    if (!alertMessage.trim()) return;
    toast({
      title: "Broadcast Alert Dispatched",
      description: `Alert sent to active collectors: "${alertMessage}"`,
    });
    setAlertMessage("");
    setShowAlertModal(false);
  };

  const totalMembersCount = (usersData.citizens.length + usersData.collectors.length + usersData.admins.length);

  return (
    <div className="min-h-screen pt-20 flex bg-background">
      {/* Sidebar Navigation */}
      <div className="hidden md:flex flex-col items-center gap-2 p-3 glass-card-static rounded-none min-h-screen w-24 border-r border-border">
        {sidebarItems.map((item, i) => (
          <button
            key={item.label}
            onClick={() => setActiveTab(i)}
            className={`w-full py-2.5 px-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
              activeTab === i 
                ? "bg-primary text-primary-foreground shadow-lg font-bold scale-105" 
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Container */}
      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          {/* Top Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
                Municipal Intelligence Console
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
                  ● {sidebarItems[activeTab].label.toUpperCase()} VIEW
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">Admin oversight, workforce directory, live GPS tracking & reports</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap w-full md:w-auto justify-end">
              {/* Search Bar */}
              <div className="glass-card-static px-3 py-2 flex items-center gap-2 rounded-xl border border-border">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${sidebarItems[activeTab].label}...`}
                  className="bg-transparent text-xs text-foreground outline-none w-36 md:w-52"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-xs text-muted-foreground hover:text-foreground">
                    ✕
                  </button>
                )}
              </div>

              {/* Refresh Button */}
              <button 
                onClick={() => {
                  refetch();
                  toast({ title: "Console Refreshed", description: "Fetched latest system telemetry." });
                }} 
                className="p-2.5 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
                title="Refresh Console"
              >
                <RefreshCw className="w-4 h-4 text-foreground" />
              </button>

              {/* Bell Icon */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(prev => !prev)}
                  className="p-2.5 rounded-xl border border-border bg-card hover:bg-accent transition-colors relative"
                >
                  <Bell className="w-4 h-4 text-foreground" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center">
                    3
                  </span>
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl p-4 z-50"
                    >
                      <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                        <h4 className="text-xs font-bold text-foreground">System Broadcast Alerts</h4>
                        <button onClick={() => setShowNotifications(false)} className="text-xs text-muted-foreground">✕</button>
                      </div>
                      <div className="space-y-2">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-xs text-emerald-600 font-semibold">
                          🚛 3 Collectors active on live route
                        </div>
                        <div className="p-2 rounded-lg bg-amber-500/10 text-xs text-amber-600 font-semibold">
                          📋 {usersData.citizens.length} registered citizens synced
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/" className="text-xs font-semibold text-primary hover:underline">← Exit</Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 0: OVERVIEW DASHBOARD */}
          {/* ========================================================================= */}
          {activeTab === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card-static p-4 rounded-xl border border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">♻️</div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Waste</p>
                    <p className="text-xl font-extrabold text-foreground">{data?.stats?.totalCollections || 1420} kg</p>
                  </div>
                </div>
                <div className="glass-card-static p-4 rounded-xl border border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">👥</div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Members</p>
                    <p className="text-xl font-extrabold text-foreground">{totalMembersCount} Registered</p>
                  </div>
                </div>
                <div className="glass-card-static p-4 rounded-xl border border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">🚛</div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Active Collectors</p>
                    <p className="text-xl font-extrabold text-amber-600">{usersData.collectors.length} On Duty</p>
                  </div>
                </div>
                <div className="glass-card-static p-4 rounded-xl border border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">⭐</div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Citizen Reviews</p>
                    <p className="text-xl font-extrabold text-emerald-600">{feedbacksData.length} Logs</p>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3 glass-card-static p-5 rounded-2xl border border-border">
                  <h3 className="text-base font-bold text-foreground mb-3">City Waste Composition</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.pieData || [
                            { name: 'Dry Recyclables', value: 45, color: '#10b981' },
                            { name: 'Organic Wet Waste', value: 35, color: '#3b82f6' },
                            { name: 'Hazardous / E-Waste', value: 20, color: '#f43f5e' }
                          ]}
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {(data?.pieData || [
                            { name: 'Dry', value: 45, color: '#10b981' },
                            { name: 'Wet', value: 35, color: '#3b82f6' },
                            { name: 'Hazardous', value: 20, color: '#f43f5e' }
                          ]).map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-2 glass-card-static p-5 rounded-2xl border border-border flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-500 animate-pulse" /> Dispatch & Broadcast
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">Send real-time alerts directly to municipal collector mobile apps.</p>
                  </div>
                  <button onClick={() => setShowAlertModal(true)} className="btn-eco text-xs py-2.5 px-4 w-full">
                    Send Broadcast Alert
                  </button>
                </div>

                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-foreground">Live Municipal Tracking Map</h3>
                    <button onClick={() => setActiveTab(4)} className="text-xs text-primary font-semibold hover:underline">
                      Expand Full View →
                    </button>
                  </div>
                  <LiveMap />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: USER DIRECTORY & REPORT (SPREADSHEET VIEW FOR CITIZENS, COLLECTORS, ADMINS) */}
          {/* ========================================================================= */}
          {activeTab === 1 && (
            <div className="glass-card-static p-6 rounded-2xl border border-border space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                    User Directory & System Reports
                  </h2>
                  <p className="text-xs text-muted-foreground">Spreadsheet matrix view of all registered Citizens, Collectors, and Admins</p>
                </div>

                <button
                  onClick={() => handleDownloadSpreadsheet(currentSpreadsheetUsers, `users_${userTabSection}`)}
                  className="btn-eco text-xs py-2 px-4 flex items-center gap-2 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Download {userTabSection.toUpperCase()} Spreadsheet (.CSV)
                </button>
              </div>

              {/* 3 Section Buttons: Citizens | Collectors | Admins */}
              <div className="flex items-center gap-2 p-1 bg-accent/40 rounded-xl w-fit border border-border">
                <button
                  onClick={() => setUserTabSection('citizens')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    userTabSection === 'citizens' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Citizens ({usersData.citizens.length})
                </button>

                <button
                  onClick={() => setUserTabSection('collectors')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    userTabSection === 'collectors' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  Collectors ({usersData.collectors.length})
                </button>

                <button
                  onClick={() => setUserTabSection('admins')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    userTabSection === 'admins' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admins ({usersData.admins.length})
                </button>
              </div>

              {/* Spreadsheet Table */}
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="bg-accent/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
                    <tr>
                      <th className="p-3">User ID</th>
                      <th className="p-3">Username / Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Zone / Address</th>
                      <th className="p-3">Phone</th>
                      {userTabSection === 'collectors' && <th className="p-3">Vehicle No.</th>}
                      <th className="p-3">Reward Points</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium text-foreground">
                    {currentSpreadsheetUsers.length > 0 ? (
                      currentSpreadsheetUsers.map((u, i) => (
                        <tr key={u._id || i} className="hover:bg-accent/30 transition-colors">
                          <td className="p-3 font-mono text-[11px] text-muted-foreground">{u._id}</td>
                          <td className="p-3 font-bold text-foreground">
                            {u.profile?.firstName ? `${u.profile.firstName} ${u.profile.lastName || ''}` : u.username}
                          </td>
                          <td className="p-3 text-muted-foreground">{u.email}</td>
                          <td className="p-3">{u.profile?.address || u.profile?.zone || 'Delhi Municipal Zone'}</td>
                          <td className="p-3 text-muted-foreground">{u.profile?.phone || '9876543210'}</td>
                          {userTabSection === 'collectors' && (
                            <td className="p-3 font-bold text-emerald-600">{u.vehicleNumber || 'DL-01-AB-1234'}</td>
                          )}
                          <td className="p-3 font-extrabold text-emerald-600">{u.rewardPoints || 0} pts</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              ● ACTIVE
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          No users found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ANALYTICS & METRICS */}
          {/* ========================================================================= */}
          {activeTab === 2 && (
            <div className="glass-card-static p-6 rounded-2xl border border-border space-y-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                City Waste Analytics & Performance Trends
              </h2>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.areaData || [
                    { month: 'Jan', pickups: 320 },
                    { month: 'Feb', pickups: 410 },
                    { month: 'Mar', pickups: 580 },
                    { month: 'Apr', pickups: 720 },
                    { month: 'May', pickups: 890 },
                    { month: 'Jun', pickups: 1100 }
                  ]}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="pickups" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CITIZEN FEEDBACK & REVIEW PAGE */}
          {/* ========================================================================= */}
          {activeTab === 3 && (
            <div className="glass-card-static p-6 rounded-2xl border border-border space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                    Citizen & Collector Feedback Portal
                  </h2>
                  <p className="text-xs text-muted-foreground">Log of citizen feedback ratings, service complaints, and sentiment reviews</p>
                </div>

                <button
                  onClick={() => handleDownloadSpreadsheet(feedbacksData, 'citizen_feedback')}
                  className="btn-eco text-xs py-2 px-4 flex items-center gap-2 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Download Feedback Spreadsheet (.CSV)
                </button>
              </div>

              {/* Feedback Spreadsheet Table */}
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="bg-accent/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
                    <tr>
                      <th className="p-3">Ref ID</th>
                      <th className="p-3">Citizen Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Feedback Message</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium text-foreground">
                    {feedbacksData.map((f, i) => (
                      <tr key={f.id || i} className="hover:bg-accent/30 transition-colors">
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">{f.id}</td>
                        <td className="p-3 font-bold text-foreground">{f.user}</td>
                        <td className="p-3 text-emerald-600 font-semibold">{f.category}</td>
                        <td className="p-3">{f.location}</td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">{f.feedback}</td>
                        <td className="p-3 font-bold text-amber-500 flex items-center gap-1">
                          {f.rating} <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            f.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{f.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: LIVE GPS TRACKING */}
          {/* ========================================================================= */}
          {activeTab === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                Live GPS Collector Tracking System
              </h2>
              <LiveMap />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: WORKFORCE & MEMBERS DIRECTORY (ROLE-WISE, POSITION-WISE) */}
          {/* ========================================================================= */}
          {activeTab === 5 && (
            <div className="glass-card-static p-6 rounded-2xl border border-border space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500" />
                    Workforce & Member Roster
                  </h2>
                  <p className="text-xs text-muted-foreground">Comprehensive role-wise and position-wise distribution analysis</p>
                </div>

                <button
                  onClick={() => handleDownloadSpreadsheet([...usersData.citizens, ...usersData.collectors, ...usersData.admins], 'all_members')}
                  className="btn-eco text-xs py-2 px-4 flex items-center gap-2 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Download Roster Spreadsheet (.CSV)
                </button>
              </div>

              {/* Role-wise Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-accent/30 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-muted-foreground">Citizens Role</span>
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-extrabold text-foreground">{usersData.citizens.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Household Waste Generators</p>
                </div>

                <div className="p-4 rounded-xl bg-accent/30 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-muted-foreground">Collectors Role</span>
                    <Truck className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-2xl font-extrabold text-foreground">{usersData.collectors.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Municipal Vehicle Drivers</p>
                </div>

                <div className="p-4 rounded-xl bg-accent/30 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-muted-foreground">Admins Role</span>
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-extrabold text-foreground">{usersData.admins.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Municipal Dispatch Oversight</p>
                </div>
              </div>

              {/* Zone / Position Distribution */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3">Position & Zone-Wise Distribution</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-accent/40 border border-border text-center">
                    <span className="text-xs font-bold text-emerald-600 block mb-1">South Delhi Zone</span>
                    <span className="text-lg font-extrabold text-foreground">6 Members</span>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/40 border border-border text-center">
                    <span className="text-xs font-bold text-indigo-600 block mb-1">Central Delhi Zone</span>
                    <span className="text-lg font-extrabold text-foreground">3 Members</span>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/40 border border-border text-center">
                    <span className="text-xs font-bold text-amber-600 block mb-1">West Delhi Zone</span>
                    <span className="text-lg font-extrabold text-foreground">3 Members</span>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/40 border border-border text-center">
                    <span className="text-xs font-bold text-rose-600 block mb-1">North Delhi Zone</span>
                    <span className="text-lg font-extrabold text-foreground">2 Members</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: AI ENGINE */}
          {/* ========================================================================= */}
          {activeTab === 6 && (
            <div className="glass-card-static p-6 rounded-2xl border border-border space-y-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-500" />
                AI Route Optimization Engine
              </h2>
              <p className="text-xs text-muted-foreground">Nearest Neighbor & OSRM dynamic pathfinding algorithms active.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Broadcast Modal */}
      <AnimatePresence>
        {showAlertModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
              <button onClick={() => setShowAlertModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-500" /> Dispatch Collector Alert
              </h3>
              <textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Type emergency alert message..."
                className="w-full h-28 p-3 bg-accent/40 border border-border rounded-xl text-xs text-foreground outline-none resize-none mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAlertModal(false)} className="btn-eco-outline text-xs py-2 px-4">Cancel</button>
                <button onClick={handleSendBroadcastAlert} className="btn-eco text-xs py-2 px-4">Dispatch</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
