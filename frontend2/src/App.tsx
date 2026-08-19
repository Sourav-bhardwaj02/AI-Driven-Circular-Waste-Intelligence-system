import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CameraOff,
  Upload,
  AlertTriangle,
  Recycle,
  Leaf,
  Download,
  Search,
  Trash2,
  Edit2,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  X,
  Layers,
  Sparkles,
  BookOpen,
  Info,
  LogOut,
  ShieldCheck,
  BadgeCheck,
  UserCheck
} from "lucide-react";
import { AuthScreen } from "./components/AuthScreen";
import { authService } from "./services/authService";
import { AuthUser } from "./types/auth";

// ─── API CONFIG ───────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ─── TYPES ───────────────────────────────────────────────────
export type WasteCategory = "biodegradable" | "recyclable" | "hazardous";

export interface Detection {
  id?: string;
  box: { x1: number; y1: number; x2: number; y2: number };
  label: WasteCategory;
  taco_name?: string;
  supercategory?: string;
  item_name?: string;
  confidence: number;
  bin?: string;
  circular_action?: string;
  material?: string;
}

export interface WasteRecord {
  id: string;
  timestamp: string;
  itemName: string;
  tacoSupercat: string;
  category: WasteCategory;
  bin: string;
  confidence: number;
  quantity: number;
  unit: string;
  notes: string;
  material?: string;
  loggedBy?: string;
}

export interface TacoCategory {
  id: number;
  name: string;
  supercategory: string;
  circular_category: WasteCategory;
  bin: string;
  action: string;
  material: string;
}

// ─── CONSTANTS ───────────────────────────────────────────────
const CLASS_COLORS: Record<WasteCategory, string> = {
  biodegradable: "#16a34a",
  recyclable: "#2563eb",
  hazardous: "#dc2626",
};

const CLASS_BINS: Record<WasteCategory, string> = {
  biodegradable: "Green Bin (Compost)",
  recyclable: "Blue Bin (Recycle)",
  hazardous: "Red Bin (Hazardous)",
};

const SAMPLE_RECORDS: WasteRecord[] = [
  {
    id: "YOLO-101",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleString(),
    itemName: "Clear Plastic Bottle",
    tacoSupercat: "Bottle",
    category: "recyclable",
    bin: "Blue Bin (PET/HDPE)",
    confidence: 95,
    quantity: 2,
    unit: "pcs",
    notes: "PET polymer, high circular recovery value",
    material: "PET Polymer",
    loggedBy: "Vikram Das (ID-7842)"
  },
  {
    id: "YOLO-102",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toLocaleString(),
    itemName: "Food Waste / Fruit Peels",
    tacoSupercat: "Food waste",
    category: "biodegradable",
    bin: "Green Bin (Compost)",
    confidence: 91,
    quantity: 0.4,
    unit: "kg",
    notes: "Decomposes into organic nitrogen compost",
    material: "Organic Biomass",
    loggedBy: "Vikram Das (ID-7842)"
  },
  {
    id: "YOLO-103",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleString(),
    itemName: "Lithium-Ion Battery",
    tacoSupercat: "Battery",
    category: "hazardous",
    bin: "Red Bin (E-Waste)",
    confidence: 93,
    quantity: 3,
    unit: "pcs",
    notes: "Requires dedicated e-waste dropoff",
    material: "Lithium / Heavy Metals",
    loggedBy: "Ananya Roy (ID-5521)"
  },
  {
    id: "YOLO-104",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toLocaleString(),
    itemName: "Aluminium Drink Can",
    tacoSupercat: "Can",
    category: "recyclable",
    bin: "Blue Bin (Metals)",
    confidence: 96,
    quantity: 1,
    unit: "pcs",
    notes: "100% infinitely recyclable metal alloy",
    material: "Aluminium Alloy",
    loggedBy: "Vikram Das (ID-7842)"
  },
];

const App: React.FC = () => {
  // ─── AUTHENTICATION STATE ───
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getStoredUser());
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // ─── STATE: CAMERA & DETECTION ───
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [backendOk, setBackendOk] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [autoLogEnabled, setAutoLogEnabled] = useState<boolean>(false);
  const [scanSpeedMs, setScanSpeedMs] = useState<number>(350);
  const [activeTab, setActiveTab] = useState<"dual" | "sheet" | "scanner">("dual");

  // ─── STATE: SPREADSHEET RECORDS ───
  const [records, setRecords] = useState<WasteRecord[]>(() => {
    try {
      const saved = localStorage.getItem("wastewise_taco_records");
      return saved ? JSON.parse(saved) : SAMPLE_RECORDS;
    } catch {
      return SAMPLE_RECORDS;
    }
  });

  // ─── STATE: TACO TAXONOMY ───
  const [tacoTaxonomy, setTacoTaxonomy] = useState<TacoCategory[]>([]);
  const [taxonomyModalOpen, setTaxonomyModalOpen] = useState<boolean>(false);
  const [taxonomySearch, setTaxonomySearch] = useState<string>("");

  // ─── STATE: SPREADSHEET TOOLBAR & FILTERING ───
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─── STATE: MODALS ───
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<WasteRecord | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState<boolean>(false);

  // ─── REFS ───
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAutoLogRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Verify Auth Session on Mount
  useEffect(() => {
    authService.verifySession().then((user) => {
      if (user) setCurrentUser(user);
      setAuthChecking(false);
    });
  }, []);

  // Save records to LocalStorage on update
  useEffect(() => {
    localStorage.setItem("wastewise_taco_records", JSON.stringify(records));
  }, [records]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Logout Handler
  const handleLogout = () => {
    if (isCameraOn) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setIsCameraOn(false);
    }
    authService.logout();
    setCurrentUser(null);
    showToast("Signed out of Identifier Portal");
  };

  // ─── BACKEND HEALTH & TACO TAXONOMY LOAD ───
  useEffect(() => {
    if (!currentUser) return;

    const checkBackend = () => {
      axios
        .get(`${API_URL}/status/`)
        .then(() => setBackendOk(true))
        .catch(() => setBackendOk(false));
    };
    checkBackend();
    const t = setInterval(checkBackend, 10000);

    // Fetch TACO Taxonomy
    axios
      .get(`${API_URL}/taco/taxonomy/`)
      .then((res) => {
        if (res.data && res.data.categories) {
          setTacoTaxonomy(res.data.categories);
        }
      })
      .catch(() => {});

    return () => clearInterval(t);
  }, [currentUser]);

  // ─── DRAW BOUNDING BOXES ON CANVAS ───
  const drawBoxes = useCallback((dets: Detection[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    dets.forEach((det) => {
      const { x1, y1, x2, y2 } = det.box;
      const color = CLASS_COLORS[det.label] || "#22c55e";
      const w = x2 - x1;
      const h = y2 - y1;

      // Glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, w, h);
      ctx.shadowBlur = 0;

      // Badge header
      const labelText = `${det.taco_name || det.label} (${det.confidence}%)`;
      ctx.font = "bold 13px Inter, sans-serif";
      const textWidth = ctx.measureText(labelText).width + 16;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x1, Math.max(0, y1 - 26), textWidth, 24, 6);
      ctx.fill();

      // Label text
      ctx.fillStyle = "#ffffff";
      ctx.fillText(labelText, x1 + 8, Math.max(16, y1 - 9));
    });
  }, []);

  // ─── CAPTURE & SEND FRAME TO BACKEND (Ultra-Low Latency Mode) ───
  const sendFrame = useCallback(async () => {
    if (!videoRef.current || !backendOk || isProcessing || isFrozen) return;

    const video = videoRef.current;
    if (video.readyState < 2) return;

    // Scale frame down to 480px width for < 10ms network transmission time
    const targetW = 480;
    const scaleFactor = targetW / (video.videoWidth || 640);
    const targetH = Math.round((video.videoHeight || 480) * scaleFactor);

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = targetW;
    tempCanvas.height = targetH;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, targetW, targetH);
    const frameB64 = tempCanvas.toDataURL("image/jpeg", 0.55);

    setIsProcessing(true);
    try {
      const res = await axios.post(`${API_URL}/classify/`, { frame: frameB64 });
      if (res.data && res.data.success && res.data.detections) {
        // Rescale detected boxes to fit video display dimensions
        const scaleX = (video.videoWidth || 640) / targetW;
        const scaleY = (video.videoHeight || 480) / targetH;
        const scaledDetections: Detection[] = res.data.detections.map((d: Detection) => ({
          ...d,
          box: {
            x1: Math.round(d.box.x1 * scaleX),
            y1: Math.round(d.box.y1 * scaleY),
            x2: Math.round(d.box.x2 * scaleX),
            y2: Math.round(d.box.y2 * scaleY),
          }
        }));

        setDetections(scaledDetections);
        drawBoxes(scaledDetections);

        // Auto-Log feature with 4-second cooldown
        if (autoLogEnabled && scaledDetections.length > 0) {
          const top = scaledDetections[0];
          const now = Date.now();
          if (top.confidence >= 82 && now - lastAutoLogRef.current > 4000) {
            lastAutoLogRef.current = now;
            logDetectionToSpreadsheet(top, "YOLO AI Auto-Trigger");
          }
        }
      }
    } catch (err) {
      console.error("Frame classification error:", err);
    }
    setIsProcessing(false);
  }, [backendOk, isProcessing, isFrozen, autoLogEnabled, drawBoxes]);

  // ─── CAMERA TOGGLE ───
  const toggleCamera = async () => {
    if (isCameraOn) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setIsCameraOn(false);
      setIsFrozen(false);
      setDetections([]);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        streamRef.current = stream;
        setIsCameraOn(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            intervalRef.current = setInterval(sendFrame, scanSpeedMs);
          }
        }, 250);
      } catch (err) {
        alert("Camera permission denied or device not accessible.");
        console.error(err);
      }
    }
  };

  // Adjust scan interval speed
  useEffect(() => {
    if (!isCameraOn || isFrozen) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(sendFrame, scanSpeedMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sendFrame, isCameraOn, isFrozen, scanSpeedMs]);

  // ─── LOG DETECTION TO SPREADSHEET ───
  const logDetectionToSpreadsheet = (det: Detection, customNotes?: string) => {
    const officerName = currentUser?.profile?.firstName
      ? `${currentUser.profile.firstName} ${currentUser.profile.lastName || ""}`.trim()
      : currentUser?.username || "Authorized Verifier";
    const badge = currentUser?.profile?.badgeNumber || "ID-OFFICER";

    const newRecord: WasteRecord = {
      id: `YOLO-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleString(),
      itemName: det.taco_name || det.item_name || `${det.label.charAt(0).toUpperCase() + det.label.slice(1)} Item`,
      tacoSupercat: det.supercategory || "Litter Item",
      category: det.label,
      bin: det.bin || CLASS_BINS[det.label],
      confidence: det.confidence,
      quantity: 1,
      unit: "pcs",
      notes: customNotes || det.circular_action || "Classified using YOLOv8/v11 Engine",
      material: det.material || "Recoverable Material",
      loggedBy: `${officerName} (${badge})`
    };

    setRecords((prev) => [newRecord, ...prev]);
    showToast(`Logged to Sheet: ${newRecord.itemName} (${newRecord.category})`);
  };

  // ─── SPREADSHEET OPERATIONS ───

  // 1. Download CSV
  const exportToCSV = () => {
    if (records.length === 0) {
      alert("Spreadsheet is empty. Scan or add items first!");
      return;
    }

    const headers = [
      "ID",
      "Timestamp",
      "YOLO Item Name",
      "YOLO Supercategory",
      "Category",
      "Bin Destination",
      "Confidence (%)",
      "Quantity",
      "Unit",
      "Material",
      "Verified By Officer",
      "Notes"
    ];
    const rows = records.map((r) => [
      `"${r.id}"`,
      `"${r.timestamp}"`,
      `"${r.itemName.replace(/"/g, '""')}"`,
      `"${r.tacoSupercat || ""}"`,
      `"${r.category}"`,
      `"${r.bin}"`,
      r.confidence,
      r.quantity,
      `"${r.unit}"`,
      `"${(r.material || "").replace(/"/g, '""')}"`,
      `"${(r.loggedBy || "").replace(/"/g, '""')}"`,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `WasteWise_YOLO_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded Official YOLO Waste Report (CSV)");
  };

  // 2. Download JSON Backup
  const exportToJSON = () => {
    const jsonStr = JSON.stringify(records, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `WasteWise_YOLO_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded JSON Backup");
  };

  // 3. Import CSV / JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            setRecords((prev) => [...parsed, ...prev]);
            showToast(`Imported ${parsed.length} records!`);
          }
        } else {
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length <= 1) throw new Error("Empty CSV file");

          const newItems: WasteRecord[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
            if (cols.length >= 4) {
              const cat = (cols[4]?.toLowerCase() || cols[3]?.toLowerCase() || "recyclable") as WasteCategory;
              newItems.push({
                id: cols[0] || `TACO-${Math.floor(100 + Math.random() * 900)}`,
                timestamp: cols[1] || new Date().toLocaleString(),
                itemName: cols[2] || "Imported TACO Item",
                tacoSupercat: cols[3] || "General Litter",
                category: ["biodegradable", "recyclable", "hazardous"].includes(cat) ? cat : "recyclable",
                bin: cols[5] || CLASS_BINS[cat] || "Blue Bin",
                confidence: parseInt(cols[6]) || 90,
                quantity: parseFloat(cols[7]) || 1,
                unit: cols[8] || "pcs",
                material: cols[9] || "Recoverable Material",
                loggedBy: cols[10] || "External Import",
                notes: cols[11] || "Imported from CSV",
              });
            }
          }
          if (newItems.length > 0) {
            setRecords((prev) => [...newItems, ...prev]);
            showToast(`Imported ${newItems.length} records from CSV!`);
          }
        }
      } catch (err) {
        alert("Failed to parse file. Please verify CSV or JSON format.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 4. Delete Single Record
  const deleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showToast("Record deleted");
  };

  // 5. Delete Selected Records
  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    setRecords((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    showToast(`Removed ${selectedIds.size} records`);
  };

  // 6. Clear All Records
  const confirmClearAll = () => {
    setRecords([]);
    setSelectedIds(new Set());
    setClearConfirmOpen(false);
    showToast("Spreadsheet cleared");
  };

  // 7. Edit Record Save
  const saveEditedRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setRecords((prev) =>
      prev.map((r) => (r.id === editingRecord.id ? editingRecord : r))
    );
    setEditModalOpen(false);
    setEditingRecord(null);
    showToast("Record updated");
  };

  // 8. Add Manual Entry
  const openNewManualRecord = () => {
    const officerName = currentUser?.profile?.firstName
      ? `${currentUser.profile.firstName} ${currentUser.profile.lastName || ""}`.trim()
      : currentUser?.username || "Officer";
    const badge = currentUser?.profile?.badgeNumber || "ID-MANUAL";

    const fresh: WasteRecord = {
      id: `TACO-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleString(),
      itemName: "Plastic Packaging Container",
      tacoSupercat: "Plastic container",
      category: "recyclable",
      bin: CLASS_BINS.recyclable,
      confidence: 100,
      quantity: 1,
      unit: "pcs",
      notes: "Manually cataloged TACO entry",
      material: "Polypropylene Plastic",
      loggedBy: `${officerName} (${badge})`
    };
    setEditingRecord(fresh);
    setEditModalOpen(true);
  };

  // ─── FILTERED & SEARCHED SPREADSHEET ROWS ───
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchCat = categoryFilter === "all" || r.category === categoryFilter;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.itemName.toLowerCase().includes(q) ||
        (r.tacoSupercat && r.tacoSupercat.toLowerCase().includes(q)) ||
        r.bin.toLowerCase().includes(q) ||
        (r.material && r.material.toLowerCase().includes(q)) ||
        (r.loggedBy && r.loggedBy.toLowerCase().includes(q)) ||
        r.notes.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [records, categoryFilter, searchQuery]);

  // ─── FILTERED TACO TAXONOMY ───
  const filteredTaxonomy = useMemo(() => {
    const q = taxonomySearch.toLowerCase();
    return tacoTaxonomy.filter((c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.supercategory.toLowerCase().includes(q) ||
      c.circular_category.toLowerCase().includes(q) ||
      c.action.toLowerCase().includes(q)
    );
  }, [tacoTaxonomy, taxonomySearch]);

  // ─── KPI METRICS ───
  const stats = useMemo(() => {
    const total = records.length;
    const bio = records.filter((r) => r.category === "biodegradable").length;
    const rec = records.filter((r) => r.category === "recyclable").length;
    const haz = records.filter((r) => r.category === "hazardous").length;
    const avgConf =
      total > 0
        ? Math.round(records.reduce((acc, r) => acc + r.confidence, 0) / total)
        : 0;
    return { total, bio, rec, haz, avgConf };
  }, [records]);

  // If not logged in, display Auth Screen
  if (authChecking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--muted)", fontWeight: 600 }}>Verifying Identifier Authorization...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  const topDetection = detections[0];
  const officerDisplayName = currentUser.profile?.firstName
    ? `${currentUser.profile.firstName} ${currentUser.profile.lastName || ""}`.trim()
    : currentUser.username;

  return (
    <>
      {/* ─── APP HEADER ─── */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">
            <Recycle size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>WasteWise Studio</span>
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "2px 7px",
                  borderRadius: 6,
                  background: "hsl(155, 60%, 90%)",
                  color: "hsl(155, 65%, 30%)",
                  fontWeight: 700,
                }}
              >
                YOLOv8/v11 Waste AI
              </span>
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 500 }}>
              Waste Identifier & Verification Hub (YOLO Waste Neural Engine)
            </div>
          </div>
        </div>

        {/* View mode switcher */}
        <div className="view-switcher">
          <button
            className={`view-tab ${activeTab === "dual" ? "active" : ""}`}
            onClick={() => setActiveTab("dual")}
          >
            <Layers size={15} />
            Dual Studio
          </button>
          <button
            className={`view-tab ${activeTab === "sheet" ? "active" : ""}`}
            onClick={() => setActiveTab("sheet")}
          >
            <FileSpreadsheet size={15} />
            Spreadsheet
            <span className="tab-badge">{records.length}</span>
          </button>
          <button
            className={`view-tab ${activeTab === "scanner" ? "active" : ""}`}
            onClick={() => setActiveTab("scanner")}
          >
            <Camera size={15} />
            Vision Scanner
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setTaxonomyModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: "0.78rem" }}
            title="Browse YOLO Waste Classes"
          >
            <BookOpen size={14} /> YOLO Classes ({tacoTaxonomy.length || 38})
          </button>

          {/* User Profile Widget */}
          <div className="user-profile-widget">
            <div className={`user-avatar-badge ${currentUser.role === "admin" ? "admin" : ""}`}>
              {currentUser.role === "admin" ? <ShieldCheck size={16} /> : <BadgeCheck size={16} />}
            </div>
            <div className="user-info-meta">
              <span className="user-name-title">{officerDisplayName}</span>
              <span className={`user-role-badge-tag ${currentUser.role === "admin" ? "admin" : ""}`}>
                {currentUser.role === "admin" ? "Administrator" : `Identifier • ${currentUser.profile?.badgeNumber || "ID"}`}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="logout-btn"
              title="Sign Out of Identifier Portal"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTAINER ─── */}
      <div className="app-container">
        {/* Verification Station Info Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "hsla(0, 0%, 100%, 0.65)",
            padding: "8px 16px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            marginBottom: 16,
            fontSize: "0.8rem",
            color: "var(--muted)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserCheck size={15} color="#16a34a" />
            <span>
              Active Identifier: <b>{officerDisplayName}</b> ({currentUser.profile?.badgeNumber || "ID-7842"})
            </span>
            <span>•</span>
            <span>Facility: <b>{currentUser.profile?.facilityZone || "Central Processing Station"}</b></span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="status-dot" style={{ background: backendOk ? "#22c55e" : "#ef4444" }} />
            <span style={{ fontWeight: 600, color: backendOk ? "var(--eco-green)" : "var(--eco-red)" }}>
              {backendOk ? "YOLOv8 Engine Active (Port 8000)" : "Backend Offline"}
            </span>
          </div>
        </div>

        {/* KPI Metrics Dashboard Bar */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-title">Total Verified</span>
            <span className="kpi-value">{stats.total}</span>
            <span className="kpi-sub">Spreadsheet entries</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-title" style={{ color: "#16a34a" }}>
              🌱 Biodegradable
            </span>
            <span className="kpi-value" style={{ color: "#16a34a" }}>
              {stats.bio}
            </span>
            <span className="kpi-sub" style={{ color: "#16a34a" }}>
              Compostable organic
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-title" style={{ color: "#2563eb" }}>
              ♻️ Recyclable
            </span>
            <span className="kpi-value" style={{ color: "#2563eb" }}>
              {stats.rec}
            </span>
            <span className="kpi-sub" style={{ color: "#2563eb" }}>
              Circular packaging
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-title" style={{ color: "#dc2626" }}>
              ⚠️ Hazardous
            </span>
            <span className="kpi-value" style={{ color: "#dc2626" }}>
              {stats.haz}
            </span>
            <span className="kpi-sub" style={{ color: "#dc2626" }}>
              Special collection
            </span>
          </div>
        </div>

        {/* ─── DUAL / SCANNER / SPREADSHEET VIEWS ─── */}
        <div
          className={
            activeTab === "dual"
              ? "dual-layout"
              : activeTab === "sheet"
              ? "single-sheet-layout"
              : "single-scanner-layout"
          }
        >
          {/* ══════════ LEFT COLUMN: AI CAMERA SCANNER ══════════ */}
          {(activeTab === "dual" || activeTab === "scanner") && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Camera Video Viewport */}
              <div className="camera-wrapper">
                {isCameraOn ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted />
                    <canvas ref={canvasRef} />
                    <div className="corner corner-tl" />
                    <div className="corner corner-tr" />
                    <div className="corner corner-bl" />
                    <div className="corner corner-br" />

                    {/* Scanning Status */}
                    <div className="scan-indicator">
                      <span className="scan-dot" />
                      {isFrozen
                        ? "STREAM FROZEN / LOCKED"
                        : isProcessing
                        ? "YOLO AI MATCHING..."
                        : "YOLO VISION ACTIVE"}
                    </div>
                  </>
                ) : (
                  <div className="camera-off-placeholder">
                    <div className="camera-off-icon">
                      <CameraOff size={28} />
                    </div>
                    <p style={{ fontWeight: 600 }}>YOLO Vision Scanner Standby</p>
                    <p style={{ fontSize: "0.8rem" }}>
                      Start camera to identify waste via YOLOv8/v11 neural network
                    </p>
                  </div>
                )}
              </div>

              {/* Primary Action Buttons */}
              <div className="control-grid">
                <button
                  onClick={toggleCamera}
                  className={`btn ${isCameraOn ? "btn-danger" : "btn-primary"}`}
                >
                  {isCameraOn ? (
                    <>
                      <CameraOff size={18} /> Stop Camera
                    </>
                  ) : (
                    <>
                      <Camera size={18} /> Start Camera
                    </>
                  )}
                </button>

                <button
                  disabled={!isCameraOn}
                  onClick={() => setIsFrozen(!isFrozen)}
                  className={`btn ${isFrozen ? "btn-success" : "btn-secondary"}`}
                  title="Freeze stream to lock current identification"
                >
                  {isFrozen ? (
                    <>
                      <Play size={17} /> Unfreeze Stream
                    </>
                  ) : (
                    <>
                      <Pause size={17} /> Freeze / Lock Readout
                    </>
                  )}
                </button>
              </div>

              {/* Auxiliary Controls (Auto-Log & Speed) */}
              <div className="scanner-aux-controls">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={autoLogEnabled}
                    onChange={(e) => setAutoLogEnabled(e.target.checked)}
                  />
                  <span>Auto-Log High Confidence (&gt;80%)</span>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "var(--muted)" }}>
                  <SlidersHorizontal size={14} />
                  <span>Scan rate:</span>
                  <select
                    value={scanSpeedMs}
                    onChange={(e) => setScanSpeedMs(Number(e.target.value))}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    <option value={1000}>Fast (1.0s)</option>
                    <option value={1800}>Smooth / Stable (1.8s)</option>
                    <option value={3000}>Relaxed (3.0s)</option>
                  </select>
                </div>
              </div>

              {/* Live Detection Result Card */}
              {topDetection ? (
                <div className="result-card">
                  <div className="result-header">
                    <div className="result-left">
                      <div
                        className="result-icon"
                        style={{
                          background: `${CLASS_COLORS[topDetection.label]}20`,
                          border: `1.5px solid ${CLASS_COLORS[topDetection.label]}50`,
                          color: CLASS_COLORS[topDetection.label],
                        }}
                      >
                        {topDetection.label === "biodegradable" && <Leaf size={22} />}
                        {topDetection.label === "recyclable" && <Recycle size={22} />}
                        {topDetection.label === "hazardous" && <AlertTriangle size={22} />}
                      </div>
                      <div>
                        <div
                          className="result-label"
                          style={{ color: CLASS_COLORS[topDetection.label] }}
                        >
                          {topDetection.taco_name || topDetection.item_name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>
                          YOLO Supercategory: <b>{topDetection.supercategory || "Waste Item"}</b> • Material: <b>{topDetection.material || "Packaging"}</b>
                        </div>
                        <div className="result-bin" style={{ marginTop: 4 }}>
                          Destination: <b>{topDetection.bin || CLASS_BINS[topDetection.label]}</b>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => logDetectionToSpreadsheet(topDetection)}
                      className="btn btn-success btn-sm"
                      style={{ padding: "8px 14px" }}
                    >
                      <Plus size={15} /> Log to Sheet
                    </button>
                  </div>

                  {/* Handling Action Banner */}
                  {topDetection.circular_action && (
                    <div
                      style={{
                        padding: "8px 12px",
                        background: "hsla(0, 0%, 100%, 0.6)",
                        borderRadius: 8,
                        fontSize: "0.78rem",
                        color: "var(--foreground)",
                        marginBottom: 14,
                        border: "1px solid var(--border)",
                      }}
                    >
                      💡 <b>Action:</b> {topDetection.circular_action}
                    </div>
                  )}

                  {/* Confidence Bar */}
                  <div className="confidence-bar-wrap">
                    <div className="confidence-label">
                      <span>YOLO Classification Confidence</span>
                      <span style={{ color: CLASS_COLORS[topDetection.label] }}>
                        {topDetection.confidence}%
                      </span>
                    </div>
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        style={{
                          width: `${topDetection.confidence}%`,
                          background: `linear-gradient(90deg, ${CLASS_COLORS[topDetection.label]}, ${CLASS_COLORS[topDetection.label]}cc)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: "20px", textAlign: "center", marginBottom: 20 }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                    {isCameraOn
                      ? "🔍 Scanning frame with YOLOv8 Vision Engine... Point your camera at a waste item."
                      : "Start the camera to identify items or manage records in the spreadsheet."}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════ RIGHT COLUMN: SPREADSHEET STUDIO ══════════ */}
          {(activeTab === "dual" || activeTab === "sheet") && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="spreadsheet-container"
            >
              {/* Spreadsheet Header Toolbar */}
              <div className="spreadsheet-toolbar">
                <div className="search-input-wrap">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search by YOLO Item, Officer, Supercat, Material..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--muted)",
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="toolbar-actions">
                  <button onClick={openNewManualRecord} className="btn btn-primary btn-sm">
                    <Plus size={15} /> Add Record
                  </button>

                  <button onClick={exportToCSV} className="btn btn-secondary btn-sm" title="Download CSV Spreadsheet">
                    <Download size={15} /> Export CSV
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary btn-sm"
                    title="Import CSV or JSON Data"
                  >
                    <Upload size={15} /> Import Data
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportFile}
                    accept=".csv,.json"
                    style={{ display: "none" }}
                  />

                  {records.length > 0 && (
                    <button
                      onClick={() => setClearConfirmOpen(true)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: "var(--eco-red)" }}
                      title="Clear all spreadsheet rows"
                    >
                      <RotateCcw size={14} /> Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="filter-pills">
                <button
                  className={`filter-pill ${categoryFilter === "all" ? "active" : ""}`}
                  onClick={() => setCategoryFilter("all")}
                >
                  All Items ({records.length})
                </button>
                <button
                  className={`filter-pill bio ${categoryFilter === "biodegradable" ? "active" : ""}`}
                  onClick={() => setCategoryFilter("biodegradable")}
                >
                  🌱 Biodegradable ({stats.bio})
                </button>
                <button
                  className={`filter-pill rec ${categoryFilter === "recyclable" ? "active" : ""}`}
                  onClick={() => setCategoryFilter("recyclable")}
                >
                  ♻️ Recyclable ({stats.rec})
                </button>
                <button
                  className={`filter-pill haz ${categoryFilter === "hazardous" ? "active" : ""}`}
                  onClick={() => setCategoryFilter("hazardous")}
                >
                  ⚠️ Hazardous ({stats.haz})
                </button>

                {selectedIds.size > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="btn btn-danger btn-sm"
                    style={{ marginLeft: "auto", padding: "4px 10px", fontSize: "0.75rem" }}
                  >
                    <Trash2 size={13} /> Delete Selected ({selectedIds.size})
                  </button>
                )}
              </div>

              {/* ─── SPREADSHEET TABLE ─── */}
              <div className="table-scroll-wrap">
                <table className="sheet-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36, textAlign: "center" }}>
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
                        />
                      </th>
                      <th>Record ID</th>
                      <th>Timestamp</th>
                      <th>YOLO Item Class</th>
                      <th>Supercategory</th>
                      <th>Circular Stream</th>
                      <th>Destination Bin</th>
                      <th>Confidence</th>
                      <th>Qty</th>
                      <th>Verified By Officer</th>
                      <th>Material / Notes</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((row) => (
                        <tr key={row.id}>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(row.id)}
                              onChange={(e) => {
                                const next = new Set(selectedIds);
                                if (e.target.checked) next.add(row.id);
                                else next.delete(row.id);
                                setSelectedIds(next);
                              }}
                            />
                          </td>
                          <td className="mono-cell">{row.id}</td>
                          <td style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                            {row.timestamp}
                          </td>
                          <td style={{ fontWeight: 700 }}>{row.itemName}</td>
                          <td>
                            <span style={{ fontSize: "0.78rem", color: "var(--muted)", fontWeight: 600 }}>
                              {row.tacoSupercat || "Litter"}
                            </span>
                          </td>
                          <td>
                            <span className={`category-badge ${row.category}`}>
                              {row.category === "biodegradable" && "🌱"}
                              {row.category === "recyclable" && "♻️"}
                              {row.category === "hazardous" && "⚠️"}
                              {row.category}
                            </span>
                          </td>
                          <td style={{ fontSize: "0.8rem", fontWeight: 500 }}>{row.bin}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontWeight: 700, fontSize: "0.78rem" }}>
                                {row.confidence}%
                              </span>
                              <div
                                style={{
                                  width: 42,
                                  height: 5,
                                  borderRadius: 99,
                                  background: "hsl(220, 15%, 88%)",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${row.confidence}%`,
                                    height: "100%",
                                    background: CLASS_COLORS[row.category],
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {row.quantity} {row.unit}
                          </td>
                          <td style={{ fontSize: "0.78rem", color: "var(--primary-dark)", fontWeight: 600 }}>
                            {row.loggedBy || "Verifier"}
                          </td>
                          <td
                            style={{
                              maxWidth: 180,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              color: "var(--muted)",
                              fontSize: "0.78rem",
                            }}
                          >
                            {row.material ? `${row.material} • ` : ""}
                            {row.notes || "—"}
                          </td>
                          <td>
                            <div className="action-btn-group">
                              <button
                                onClick={() => {
                                  setEditingRecord(row);
                                  setEditModalOpen(true);
                                }}
                                className="table-btn"
                                title="Edit Record"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => deleteRecord(row.id)}
                                className="table-btn delete"
                                title="Delete Record"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={12} className="empty-table">
                          <FileSpreadsheet size={32} style={{ margin: "0 auto 8px", color: "var(--muted)" }} />
                          <p style={{ fontWeight: 600, color: "var(--foreground)" }}>
                            No spreadsheet records match your search
                          </p>
                          <p style={{ fontSize: "0.8rem", marginTop: 4 }}>
                            Scan items using the YOLOv8/v11 engine or click &quot;Add Record&quot; above.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 14,
                  fontSize: "0.78rem",
                  color: "var(--muted)",
                }}
              >
                <span>
                  Showing <b>{filteredRecords.length}</b> of <b>{records.length}</b> records logged
                </span>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={exportToJSON}
                    style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}
                  >
                    Download JSON Backup
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ─── MODAL: YOLO TAXONOMY EXPLORER ─── */}
      {taxonomyModalOpen && (
        <div className="modal-backdrop" onClick={() => setTaxonomyModalOpen(false)}>
          <div
            className="modal-box"
            style={{ maxWidth: 780, maxHeight: "85vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <BookOpen size={20} color="var(--primary)" /> YOLO Waste Dataset Taxonomy
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>
                  Fine-grained Waste Categories across Supercategories mapped to Circular Streams
                </div>
              </div>
              <button
                onClick={() => setTaxonomyModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <input
                type="text"
                placeholder="Search YOLO categories (e.g. bottle, banana, battery, apple, laptop)..."
                value={taxonomySearch}
                onChange={(e) => setTaxonomySearch(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ overflowY: "auto", flex: 1, border: "1px solid var(--border)", borderRadius: 10 }}>
              <table className="sheet-table" style={{ fontSize: "0.8rem" }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>YOLO Category Name</th>
                    <th>Supercategory</th>
                    <th>Circular Stream</th>
                    <th>Destination Bin</th>
                    <th>Handling / Recycling Protocol</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTaxonomy.map((c) => (
                    <tr key={c.id}>
                      <td className="mono-cell">{c.id}</td>
                      <td style={{ fontWeight: 700 }}>{c.name}</td>
                      <td style={{ color: "var(--muted)" }}>{c.supercategory}</td>
                      <td>
                        <span className={`category-badge ${c.circular_category}`}>
                          {c.circular_category}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.75rem" }}>{c.bin}</td>
                      <td style={{ fontSize: "0.75rem", color: "var(--muted)", maxWidth: 220 }}>{c.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer" style={{ marginTop: 14 }}>
              <button onClick={() => setTaxonomyModalOpen(false)} className="btn btn-primary btn-sm">
                Done Exploring
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT / ADD RECORD ─── */}
      {editModalOpen && editingRecord && (
        <div className="modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {records.some((r) => r.id === editingRecord.id)
                  ? `Edit Record: ${editingRecord.id}`
                  : "Add New YOLO Waste Record"}
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveEditedRecord}>
              <div className="form-group">
                <label className="form-label">YOLO Item Description</label>
                <input
                  type="text"
                  required
                  value={editingRecord.itemName}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, itemName: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">YOLO Supercategory</label>
                  <input
                    type="text"
                    value={editingRecord.tacoSupercat}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, tacoSupercat: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Circular Category</label>
                  <select
                    value={editingRecord.category}
                    onChange={(e) => {
                      const cat = e.target.value as WasteCategory;
                      setEditingRecord({
                        ...editingRecord,
                        category: cat,
                        bin: CLASS_BINS[cat],
                      });
                    }}
                    className="form-select"
                  >
                    <option value="biodegradable">🌱 Biodegradable</option>
                    <option value="recyclable">♻️ Recyclable</option>
                    <option value="hazardous">⚠️ Hazardous</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Bin Destination</label>
                  <input
                    type="text"
                    value={editingRecord.bin}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, bin: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Material Composition</label>
                  <input
                    type="text"
                    value={editingRecord.material || ""}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, material: e.target.value })
                    }
                    className="form-input"
                    placeholder="e.g. PET Plastic, Aluminium"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Confidence (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingRecord.confidence}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        confidence: Number(e.target.value),
                      })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    min={0.1}
                    value={editingRecord.quantity}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select
                    value={editingRecord.unit}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, unit: e.target.value })
                    }
                    className="form-select"
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="grams">grams</option>
                    <option value="liters">liters</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes & Circular Handling Details</label>
                <input
                  type="text"
                  value={editingRecord.notes}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, notes: e.target.value })
                  }
                  className="form-input"
                  placeholder="e.g. Rinse before disposal or compost"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CLEAR ALL CONFIRMATION ─── */}
      {clearConfirmOpen && (
        <div className="modal-backdrop" onClick={() => setClearConfirmOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title" style={{ color: "var(--eco-red)", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={20} /> Clear YOLO Spreadsheet Data?
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "14px 0 20px" }}>
              Are you sure you want to delete all <b>{records.length}</b> recorded entries? This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button
                onClick={() => setClearConfirmOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                className="btn btn-danger btn-sm"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── NOTIFICATION TOAST ─── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="toast-msg"
          >
            <CheckCircle2 size={18} color="#22c55e" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
