import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Trash2,
  Edit2,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Recycle,
  Leaf,
  ShieldCheck,
  Building2,
  Truck,
  UserCheck,
  ArrowUpDown,
  ExternalLink,
  Lock,
  Unlock,
  X,
  FileDown,
  Sparkles,
  BarChart3,
  Scale,
  Calendar,
  Check
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export type CircularCategory = "biodegradable" | "recyclable" | "hazardous";
export type ProcessingStatus = "Verified & Processed" | "In Transit" | "Depot Sorting" | "Dispatched to Recycler";

export interface CollectorWasteRecord {
  id: string;
  timestamp: string;
  collectorName: string;
  vehicleNumber: string;
  verifierOfficer: string;
  badgeNumber: string;
  zone: string;
  itemName: string;
  tacoSupercat: string;
  category: CircularCategory;
  bin: string;
  weightKg: number;
  purityScore: number;
  status: ProcessingStatus;
  notes: string;
}

const CATEGORY_COLORS: Record<CircularCategory, string> = {
  biodegradable: "#16a34a",
  recyclable: "#2563eb",
  hazardous: "#dc2626",
};

const CATEGORY_BINS: Record<CircularCategory, string> = {
  biodegradable: "Green Bin (Compost)",
  recyclable: "Blue Bin (Recycle)",
  hazardous: "Red Bin (Hazardous)",
};

const INITIAL_SPREADSHEET_DATA: CollectorWasteRecord[] = [
  {
    id: "MCD-REC-8901",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toLocaleString(),
    collectorName: "Raj Kumar",
    vehicleNumber: "DL-01-AB-1234",
    verifierOfficer: "Vikram Das",
    badgeNumber: "ID-7842",
    zone: "South Delhi - Zone 4",
    itemName: "Clear PET Water & Beverage Bottles",
    tacoSupercat: "Bottle",
    category: "recyclable",
    bin: "Blue Bin (PET/HDPE)",
    weightKg: 84.5,
    purityScore: 97,
    status: "Verified & Processed",
    notes: "Baled & segregated at South Delhi Recovery Center",
  },
  {
    id: "MCD-REC-8902",
    timestamp: new Date(Date.now() - 1000 * 60 * 80).toLocaleString(),
    collectorName: "Priya Singh",
    vehicleNumber: "DL-02-CD-5678",
    verifierOfficer: "Ananya Roy",
    badgeNumber: "ID-5521",
    zone: "North Delhi - Zone 2",
    itemName: "Organic Food Waste & Vegetable Peels",
    tacoSupercat: "Food waste",
    category: "biodegradable",
    bin: "Green Bin (Compost)",
    weightKg: 162.0,
    purityScore: 94,
    status: "Verified & Processed",
    notes: "Direct transfer to Okhla Bio-Methanation Compost Plant",
  },
  {
    id: "MCD-REC-8903",
    timestamp: new Date(Date.now() - 1000 * 60 * 130).toLocaleString(),
    collectorName: "Amit Verma",
    vehicleNumber: "DL-07-EF-9012",
    verifierOfficer: "Vikram Das",
    badgeNumber: "ID-7842",
    zone: "East Delhi - Zone 7",
    itemName: "E-Waste Lithium Batteries & Circuit Scrap",
    tacoSupercat: "Battery",
    category: "hazardous",
    bin: "Red Bin (Hazardous)",
    weightKg: 18.2,
    purityScore: 99,
    status: "Dispatched to Recycler",
    notes: "Sent to Authorized Central E-Waste Facility",
  },
  {
    id: "MCD-REC-8904",
    timestamp: new Date(Date.now() - 1000 * 60 * 190).toLocaleString(),
    collectorName: "Raj Kumar",
    vehicleNumber: "DL-01-AB-1234",
    verifierOfficer: "Ananya Roy",
    badgeNumber: "ID-5521",
    zone: "Central Delhi - Zone 1",
    itemName: "Corrugated Cardboard & Paper Pulp",
    tacoSupercat: "Carton",
    category: "recyclable",
    bin: "Blue Bin (Paper/Carton)",
    weightKg: 115.0,
    purityScore: 96,
    status: "Verified & Processed",
    notes: "High-grade kraft paper fiber for circular mill repulping",
  },
  {
    id: "MCD-REC-8905",
    timestamp: new Date(Date.now() - 1000 * 60 * 250).toLocaleString(),
    collectorName: "Priya Singh",
    vehicleNumber: "DL-02-CD-5678",
    verifierOfficer: "Vikram Das",
    badgeNumber: "ID-7842",
    zone: "North Delhi - Zone 2",
    itemName: "Aluminium Drink Cans & Metal Caps",
    tacoSupercat: "Can",
    category: "recyclable",
    bin: "Blue Bin (Metals)",
    weightKg: 46.8,
    purityScore: 98,
    status: "Verified & Processed",
    notes: "Infinitely recyclable aluminium alloy",
  },
  {
    id: "MCD-REC-8906",
    timestamp: new Date(Date.now() - 1000 * 60 * 310).toLocaleString(),
    collectorName: "Amit Verma",
    vehicleNumber: "DL-07-EF-9012",
    verifierOfficer: "Ananya Roy",
    badgeNumber: "ID-5521",
    zone: "East Delhi - Zone 7",
    itemName: "Mixed Horticultural Yard Trimmings & Leaves",
    tacoSupercat: "Food waste",
    category: "biodegradable",
    bin: "Green Bin (Organic)",
    weightKg: 210.5,
    purityScore: 92,
    status: "Depot Sorting",
    notes: "Pre-shredding for municipal green cover composting",
  },
];

const ClassifierPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Admin Check: logged in as admin OR elevated supervisor toggle
  const [adminModeOverride, setAdminModeOverride] = useState<boolean>(false);
  const isAdmin = user?.role === "admin" || adminModeOverride;

  // ─── SPREADSHEET RECORDS STATE ───
  const [records, setRecords] = useState<CollectorWasteRecord[]>(() => {
    try {
      const saved = localStorage.getItem("wastewise_collector_spreadsheet");
      return saved ? JSON.parse(saved) : INITIAL_SPREADSHEET_DATA;
    } catch {
      return INITIAL_SPREADSHEET_DATA;
    }
  });

  // ─── FILTER & SEARCH STATES ───
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── MODAL STATES ───
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<CollectorWasteRecord | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("wastewise_collector_spreadsheet", JSON.stringify(records));
  }, [records]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ─── KPI STATS CALCULATION ───
  const stats = useMemo(() => {
    const totalKg = records.reduce((acc, r) => acc + (r.weightKg || 0), 0);
    const bioKg = records
      .filter((r) => r.category === "biodegradable")
      .reduce((acc, r) => acc + (r.weightKg || 0), 0);
    const recKg = records
      .filter((r) => r.category === "recyclable")
      .reduce((acc, r) => acc + (r.weightKg || 0), 0);
    const hazKg = records
      .filter((r) => r.category === "hazardous")
      .reduce((acc, r) => acc + (r.weightKg || 0), 0);
    const avgPurity =
      records.length > 0
        ? Math.round(records.reduce((acc, r) => acc + (r.purityScore || 0), 0) / records.length)
        : 0;

    return {
      totalEntries: records.length,
      totalKg: totalKg.toFixed(1),
      bioKg: bioKg.toFixed(1),
      recKg: recKg.toFixed(1),
      hazKg: hazKg.toFixed(1),
      avgPurity,
    };
  }, [records]);

  // Unique Zones list for filter dropdown
  const uniqueZones = useMemo(() => {
    const set = new Set(records.map((r) => r.zone).filter(Boolean));
    return Array.from(set);
  }, [records]);

  // ─── FILTERED DATA ───
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchCat = categoryFilter === "all" || r.category === categoryFilter;
      const matchZone = zoneFilter === "all" || r.zone === zoneFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;

      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.collectorName.toLowerCase().includes(q) ||
        r.verifierOfficer.toLowerCase().includes(q) ||
        r.vehicleNumber.toLowerCase().includes(q) ||
        r.itemName.toLowerCase().includes(q) ||
        r.zone.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q);

      return matchCat && matchZone && matchStatus && matchQuery;
    });
  }, [records, categoryFilter, zoneFilter, statusFilter, searchQuery]);

  // ─── SPREADSHEET ACTIONS (DOWNLOAD / CSV / JSON) ───

  const exportCSV = () => {
    if (records.length === 0) {
      alert("Spreadsheet has no records to export.");
      return;
    }

    const headers = [
      "Record ID",
      "Timestamp",
      "Collector Name",
      "Vehicle No",
      "Verification Officer",
      "Badge No",
      "Sorting Zone",
      "Waste Item Name",
      "YOLO Supercategory",
      "Circular Stream",
      "Destination Bin",
      "Weight (Kg)",
      "Purity Score (%)",
      "Status",
      "Notes"
    ];

    const rows = records.map((r) => [
      `"${r.id}"`,
      `"${r.timestamp}"`,
      `"${r.collectorName}"`,
      `"${r.vehicleNumber}"`,
      `"${r.verifierOfficer}"`,
      `"${r.badgeNumber}"`,
      `"${r.zone}"`,
      `"${r.itemName.replace(/"/g, '""')}"`,
      `"${r.tacoSupercat || ""}"`,
      `"${r.category}"`,
      `"${r.bin}"`,
      r.weightKg,
      r.purityScore,
      `"${r.status}"`,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `WasteWise_Collector_Registry_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded Verified Collector Spreadsheet (CSV)");
  };

  const exportJSON = () => {
    const jsonString = JSON.stringify(records, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `WasteWise_Collector_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded Complete JSON Database Backup");
  };

  // ─── ADMIN OPERATIONS (EDIT, DELETE, ADD, CLEAR) ───

  const handleOpenAddRecord = () => {
    const newEntry: CollectorWasteRecord = {
      id: `MCD-REC-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString(),
      collectorName: "Raj Kumar",
      vehicleNumber: "DL-01-AB-1234",
      verifierOfficer: user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ""}`.trim() : "MCD Admin Verifier",
      badgeNumber: (user?.profile as any)?.badgeNumber || "ADMIN-01",
      zone: "South Delhi - Zone 4",
      itemName: "Mixed High-Density Polymers",
      tacoSupercat: "Plastic container",
      category: "recyclable",
      bin: CATEGORY_BINS.recyclable,
      weightKg: 50.0,
      purityScore: 95,
      status: "Verified & Processed",
      notes: "Logged via MCD Administrative Terminal",
    };
    setEditingRecord(newEntry);
    setEditModalOpen(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setRecords((prev) => {
      const exists = prev.some((r) => r.id === editingRecord.id);
      if (exists) {
        return prev.map((r) => (r.id === editingRecord.id ? editingRecord : r));
      } else {
        return [editingRecord, ...prev];
      }
    });

    setEditModalOpen(false);
    setEditingRecord(null);
    showToast(`Record ${editingRecord.id} saved successfully`);
  };

  const handleDeleteSingle = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
    showToast("Record removed from registry");
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setRecords((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    showToast(`Removed ${selectedIds.size} records`);
  };

  const handleResetSampleData = () => {
    setRecords(INITIAL_SPREADSHEET_DATA);
    setSelectedIds(new Set());
    showToast("Reset to official MCD verified dataset");
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-gradient-to-b from-emerald-50/50 via-slate-50 to-white text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ─── PAGE HEADER & BANNER ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                Waste Intelligence & Collector Registry
              </h1>
            </div>
            <p className="text-sm text-slate-600 max-w-2xl">
              Centralized municipal spreadsheet ledger containing verified waste streams, collector batch weights, purity indexes, and sorting depot audit logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Link to Dedicated AI Studio (frontend2) */}
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200/80 transition-all border border-emerald-300/60 shadow-sm"
              title="Open the real-time AI Waste Scanner Studio"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Launch Live AI Scanner (Port 5174)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            {/* Admin Mode Toggle Indicator */}
            <button
              onClick={() => {
                setAdminModeOverride(!adminModeOverride);
                showToast(
                  !adminModeOverride
                    ? "Admin Controls Enabled (Edit/Delete permissions unlocked)"
                    : "Read-Only User Mode Enabled"
                );
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                isAdmin
                  ? "bg-slate-900 text-white border-slate-900 shadow-slate-900/20"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
              title="Toggle Administrator Management Capabilities"
            >
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Admin Mode: ACTIVE</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Public View (Read-Only)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ─── KPI SUMMARY CARDS ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Total Logged
            </span>
            <span className="text-2xl font-black text-slate-900">{stats.totalKg} <span className="text-xs font-semibold text-slate-500">kg</span></span>
            <span className="text-[11px] font-medium text-emerald-600 block mt-1">
              {stats.totalEntries} verified batches
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 shadow-sm">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
              🌱 Biodegradable
            </span>
            <span className="text-2xl font-black text-emerald-700">{stats.bioKg} <span className="text-xs font-semibold text-emerald-600">kg</span></span>
            <span className="text-[11px] font-medium text-emerald-600 block mt-1">
              Organic Compostable
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 shadow-sm">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-1">
              ♻️ Recyclable
            </span>
            <span className="text-2xl font-black text-blue-700">{stats.recKg} <span className="text-xs font-semibold text-blue-600">kg</span></span>
            <span className="text-[11px] font-medium text-blue-600 block mt-1">
              Circular Packaging
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/80 shadow-sm">
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider block mb-1">
              ⚠️ Hazardous
            </span>
            <span className="text-2xl font-black text-red-700">{stats.hazKg} <span className="text-xs font-semibold text-red-600">kg</span></span>
            <span className="text-[11px] font-medium text-red-600 block mt-1">
              Specialized Treatment
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Sorting Purity
            </span>
            <span className="text-2xl font-black text-emerald-600">{stats.avgPurity}%</span>
            <span className="text-[11px] font-medium text-slate-500 block mt-1">
              Verified by AI + Officers
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Active Depots
            </span>
            <span className="text-2xl font-black text-slate-900">{uniqueZones.length}</span>
            <span className="text-[11px] font-medium text-slate-500 block mt-1">
              Municipal Sorting Zones
            </span>
          </div>
        </div>

        {/* ─── SPREADSHEET TOOLBAR & CONTROLS ─── */}
        <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm space-y-4">
          
          {/* Top Row: Search & Export Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Collector, Vehicle No, Item, Zone, Notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* CSV Export */}
              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200 shadow-sm"
                title="Download verified spreadsheet in CSV format"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export Spreadsheet (CSV)</span>
              </button>

              {/* JSON Export */}
              <button
                onClick={exportJSON}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200"
                title="Download JSON Database Backup"
              >
                <FileDown className="w-4 h-4 text-slate-500" />
                <span>JSON Backup</span>
              </button>

              {/* Admin-Only: Add Record */}
              {isAdmin && (
                <button
                  onClick={handleOpenAddRecord}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Registry Entry</span>
                </button>
              )}

              {/* Admin-Only: Reset Data */}
              {isAdmin && (
                <button
                  onClick={handleResetSampleData}
                  className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200"
                  title="Reset to default official MCD dataset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Filter Pills & Category Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                Stream:
              </span>
              <button
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Streams ({records.length})
              </button>
              <button
                onClick={() => setCategoryFilter("biodegradable")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === "biodegradable"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                🌱 Biodegradable
              </button>
              <button
                onClick={() => setCategoryFilter("recyclable")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === "recyclable"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                ♻️ Recyclable
              </button>
              <button
                onClick={() => setCategoryFilter("hazardous")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === "hazardous"
                    ? "bg-red-600 text-white"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                ⚠️ Hazardous
              </button>
            </div>

            {/* Zone & Status Dropdowns */}
            <div className="flex items-center gap-2">
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Sorting Zones</option>
                {uniqueZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="Verified & Processed">Verified & Processed</option>
                <option value="Depot Sorting">Depot Sorting</option>
                <option value="In Transit">In Transit</option>
                <option value="Dispatched to Recycler">Dispatched to Recycler</option>
              </select>

              {isAdmin && selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selectedIds.size})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── SPREADSHEET TABLE ─── */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  {isAdmin && (
                    <th className="py-3.5 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredRecords.length > 0 &&
                          filteredRecords.every((r) => selectedIds.has(r.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="py-3.5 px-4">Batch ID</th>
                  <th className="py-3.5 px-4">Date / Time</th>
                  <th className="py-3.5 px-4">Collector & Vehicle</th>
                  <th className="py-3.5 px-4">Sorting Depot / Zone</th>
                  <th className="py-3.5 px-4">Classified Waste Item</th>
                  <th className="py-3.5 px-4">Stream</th>
                  <th className="py-3.5 px-4">Weight</th>
                  <th className="py-3.5 px-4">Purity</th>
                  <th className="py-3.5 px-4">Verification Officer</th>
                  <th className="py-3.5 px-4">Processing Status</th>
                  {isAdmin && <th className="py-3.5 px-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-emerald-50/30 transition-colors group"
                    >
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            onChange={(e) => {
                              const next = new Set(selectedIds);
                              if (e.target.checked) next.add(row.id);
                              else next.delete(row.id);
                              setSelectedIds(next);
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      )}
                      
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-800">
                        {row.id}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {row.timestamp}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{row.collectorName}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Truck className="w-3 h-3 text-slate-400" />
                          <span>{row.vehicleNumber}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                        {row.zone}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{row.itemName}</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {row.tacoSupercat || "Packaging Material"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            row.category === "biodegradable"
                              ? "bg-emerald-100/80 text-emerald-800"
                              : row.category === "recyclable"
                              ? "bg-blue-100/80 text-blue-800"
                              : "bg-red-100/80 text-red-800"
                          }`}
                        >
                          {row.category === "biodegradable" && "🌱"}
                          {row.category === "recyclable" && "♻️"}
                          {row.category === "hazardous" && "⚠️"}
                          <span className="capitalize">{row.category}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 text-xs">
                        {row.weightKg} kg
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700">
                            {row.purityScore}%
                          </span>
                          <div className="w-12 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${row.purityScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{row.verifierOfficer}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {row.badgeNumber}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                            row.status === "Verified & Processed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : row.status === "Dispatched to Recycler"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingRecord(row);
                                setEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="Edit / Update Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTargetId(row.id);
                                setDeleteConfirmOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isAdmin ? 12 : 11}
                      className="py-12 text-center text-slate-400"
                    >
                      <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="text-sm font-semibold text-slate-700">
                        No verified collector records match your filter criteria
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Try clearing search terms or selecting &quot;All Sorting Zones&quot;.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Displaying <b>{filteredRecords.length}</b> of <b>{records.length}</b> official municipal ledger records
            </span>

            <div className="flex items-center gap-3">
              <span>MCD Circular Registry v2.1</span>
              <span>•</span>
              <button
                onClick={exportCSV}
                className="font-bold text-emerald-700 hover:underline"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ─── MODAL: EDIT / ADD RECORD (ADMIN ONLY) ─── */}
      {editModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {records.some((r) => r.id === editingRecord.id)
                      ? `Update Record: ${editingRecord.id}`
                      : "Create New Collector Batch Log"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Municipal Administrative Registry Control
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Classified Waste Item *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRecord.itemName}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, itemName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Sorting Depot / Zone *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRecord.zone}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, zone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Circular Stream *
                  </label>
                  <select
                    value={editingRecord.category}
                    onChange={(e) => {
                      const cat = e.target.value as CircularCategory;
                      setEditingRecord({
                        ...editingRecord,
                        category: cat,
                        bin: CATEGORY_BINS[cat],
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="biodegradable">🌱 Biodegradable</option>
                    <option value="recyclable">♻️ Recyclable</option>
                    <option value="hazardous">⚠️ Hazardous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Batch Weight (Kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={editingRecord.weightKg}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        weightKg: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Purity Score (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editingRecord.purityScore}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        purityScore: parseInt(e.target.value) || 90,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Collector Name
                  </label>
                  <input
                    type="text"
                    value={editingRecord.collectorName}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, collectorName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={editingRecord.vehicleNumber}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, vehicleNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Verification Officer
                  </label>
                  <input
                    type="text"
                    value={editingRecord.verifierOfficer}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, verifierOfficer: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Processing Status
                  </label>
                  <select
                    value={editingRecord.status}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        status: e.target.value as ProcessingStatus,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Verified & Processed">Verified & Processed</option>
                    <option value="Depot Sorting">Depot Sorting</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Dispatched to Recycler">Dispatched to Recycler</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Handling Notes & Recovery Instructions
                </label>
                <input
                  type="text"
                  value={editingRecord.notes}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, notes: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="e.g. Clean & bailed for circular pelletizing"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE CONFIRMATION ─── */}
      {deleteConfirmOpen && deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Delete Registry Entry?
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Are you sure you want to remove record <b>{deleteTargetId}</b>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSingle(deleteTargetId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── NOTIFICATION TOAST ─── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl shadow-slate-900/40"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassifierPage;