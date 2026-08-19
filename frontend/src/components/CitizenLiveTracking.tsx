import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Navigation,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import CitizenLiveMap, { CitizenMetrics } from "./CitizenLiveMap";

interface CollectorInfo {
  id: string;
  name: string;
  username: string;
  vehicleNumber: string;
  phone: string;
  rating: number;
  status: string;
  latitude: number;
  longitude: number;
}

interface CitizenLocation {
  latitude: number;
  longitude: number;
  address: string;
  label: string;
}

const CitizenLiveTracking = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Locations & Collector State
  const [citizenLoc, setCitizenLoc] = useState<CitizenLocation>({
    latitude: 28.5835,
    longitude: 77.2250,
    address: "House #42, Sector 5, Green Park, New Delhi",
    label: "Your Home Location"
  });

  const [collector, setCollector] = useState<CollectorInfo>({
    id: "collector_1",
    name: "Ramesh Kumar",
    username: "ramesh_collector",
    vehicleNumber: "DL-01-WB-4821 (Municipal EV Truck)",
    phone: "+91 98765 43210",
    rating: 4.9,
    status: "active",
    latitude: 28.6080,
    longitude: 77.2120
  });

  // Dynamic Status & Tracking Metrics
  const [metrics, setMetrics] = useState<CitizenMetrics>({
    distanceKm: 2.4,
    distanceMeters: 2400,
    etaMins: 12,
    progressPercent: 0,
    pickupStatus: 'on_the_way'
  });

  // Simulation Controls
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoSpeed, setDemoSpeed] = useState<number>(1);
  const [resetSignal, setResetSignal] = useState<number>(0);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);

  // Fetch Live Tracking Payload
  const fetchLiveDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('wastewise_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/tracking/citizen-live`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          if (result.data.citizenLocation) {
            setCitizenLoc(result.data.citizenLocation);
          }
          if (result.data.assignedCollector) {
            setCollector(result.data.assignedCollector);
          }
        }
      }
    } catch (err: any) {
      console.warn("Using fallback citizen tracking data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveDetails();
  }, [fetchLiveDetails]);

  // Socket.IO Real-Time Updates
  useEffect(() => {
    const socket: Socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

    socket.emit('join-tracking-room');

    socket.on('collector-location-update', (data: { id: string; latitude: number; longitude: number }) => {
      if (!isDemoActive && data.latitude && data.longitude) {
        setCollector(prev => ({
          ...prev,
          latitude: data.latitude,
          longitude: data.longitude
        }));
      }
    });

    socket.on('citizen-pickup-status-update', (data: { status: string }) => {
      if (data.status) {
        setMetrics(prev => ({ ...prev, pickupStatus: data.status as any }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isDemoActive]);

  // Format Dynamic ETA Timestamp (e.g., "10:42 AM")
  const calculateETAString = (etaMins: number) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + etaMins);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Status Stepper Data
  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'on_the_way': return 1;
      case 'approaching': return 2;
      case 'arrived': return 3;
      case 'collected': return 4;
      default: return 1;
    }
  };

  const currentStep = getStatusStepIndex(metrics.pickupStatus);

  const handleCallCollector = () => {
    setShowCallModal(true);
  };

  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const handleDemoToggle = () => {
    setIsDemoActive(prev => {
      const nextState = !prev;
      if (nextState) {
        toast({
          title: "Collector Tracking Active",
          description: "Map focused! Truck is now moving on live map towards your location."
        });
        setTimeout(() => {
          mapContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
      return nextState;
    });
  };

  const collectorPosMemo: [number, number] = useMemo(
    () => [collector.latitude, collector.longitude],
    [collector.latitude, collector.longitude]
  );

  const citizenPosMemo: [number, number] = useMemo(
    () => [citizenLoc.latitude, citizenLoc.longitude],
    [citizenLoc.latitude, citizenLoc.longitude]
  );

  const handleMetricsUpdate = useCallback((newMetrics: CitizenMetrics) => {
    setMetrics(newMetrics);
  }, []);

  const handleDemoComplete = useCallback(() => {
    setIsDemoActive(false);
    toast({
      title: "Garbage Collected!",
      description: "Your assigned collector reached your household location."
    });
  }, [toast]);

  const handleDemoReset = () => {
    setIsDemoActive(false);
    setResetSignal(prev => prev + 1);
    setMetrics({
      distanceKm: 2.4,
      distanceMeters: 2400,
      etaMins: 12,
      progressPercent: 0,
      pickupStatus: 'on_the_way'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground text-sm font-medium">Connecting to live collector tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card-static p-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-background to-teal-950/20"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Citizen Live Tracking
              </span>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Privacy Protected
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mt-2">
              Live Garbage Collector Tracking
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Track your assigned municipal truck's arrival in real time. Private & secure.
            </p>
          </div>

          {/* Interactive Simulation Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDemoToggle}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shadow-md ${
                isDemoActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isDemoActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isDemoActive ? 'Pause Tracking' : 'Track My Collector'}
            </button>

            <button
              onClick={handleDemoReset}
              className="p-2.5 glass-card text-muted-foreground hover:text-foreground rounded-2xl transition-colors"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <select
              value={demoSpeed}
              onChange={(e) => setDemoSpeed(Number(e.target.value))}
              className="bg-accent text-accent-foreground text-xs font-bold px-3 py-2.5 rounded-2xl border border-border outline-none cursor-pointer"
            >
              <option value={1}>1x Speed</option>
              <option value={2}>2x Speed</option>
              <option value={4}>4x Speed</option>
            </select>
          </div>
        </motion.div>

        {/* ZOMATO-STYLE TOP FLOATING STATUS & ETA CARD */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-static p-6 rounded-3xl border border-border shadow-xl space-y-6"
        >
          {/* Main Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-all ${
                metrics.pickupStatus === 'collected'
                  ? 'bg-emerald-500 text-white'
                  : metrics.pickupStatus === 'arrived'
                  ? 'bg-indigo-600 text-white animate-bounce'
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              }`}>
                {metrics.pickupStatus === 'collected' ? '✅' : '🚛'}
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Current Pickup Status
                </span>
                <h2 className="text-xl md:text-2xl font-black text-foreground mt-0.5">
                  {metrics.pickupStatus === 'on_the_way' && 'Garbage Collector is on the way'}
                  {metrics.pickupStatus === 'approaching' && 'Approaching your location'}
                  {metrics.pickupStatus === 'arrived' && 'Collector Has Arrived!'}
                  {metrics.pickupStatus === 'collected' && 'Garbage Collected 🎉'}
                </h2>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> {citizenLoc.address}
                </p>
              </div>
            </div>

            {/* DYNAMIC ETA BADGE */}
            {metrics.pickupStatus !== 'collected' ? (
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow-lg text-center min-w-[160px]">
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">
                  Estimated Arrival
                </span>
                <div className="text-2xl font-black mt-0.5">
                  {metrics.etaMins <= 1 ? 'Under 1 min' : `${metrics.etaMins} mins`}
                </div>
                <span className="text-[11px] font-medium opacity-85 block mt-0.5">
                  Expected: {calculateETAString(metrics.etaMins)}
                </span>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-4 rounded-2xl text-center min-w-[160px]">
                <span className="text-xs font-extrabold uppercase block">Status</span>
                <span className="text-lg font-black text-emerald-600 mt-0.5 block">Collection Completed</span>
              </div>
            )}
          </div>

          {/* STATUS STEPPER PROGRESS BAR */}
          <div className="space-y-3">
            <div className="grid grid-cols-4 text-center text-xs font-bold">
              <span className={currentStep >= 1 ? 'text-emerald-500' : 'text-muted-foreground'}>1. On the Way</span>
              <span className={currentStep >= 2 ? 'text-emerald-500' : 'text-muted-foreground'}>2. Approaching</span>
              <span className={currentStep >= 3 ? 'text-emerald-500' : 'text-muted-foreground'}>3. Arrived</span>
              <span className={currentStep >= 4 ? 'text-emerald-500' : 'text-muted-foreground'}>4. Collected</span>
            </div>

            <div className="w-full bg-secondary h-3 rounded-full overflow-hidden relative border border-border">
              <motion.div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                animate={{
                  width:
                    currentStep === 1 ? '25%' :
                    currentStep === 2 ? '55%' :
                    currentStep === 3 ? '85%' : '100%'
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* MAIN LAYOUT GRID: MAP (LEFT) + SIDEBAR INFO (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* PRIVACY-PRESERVING MAP CANVAS (COLSPAN 2) */}
          <div ref={mapContainerRef} className="lg:col-span-2 space-y-4">
            <CitizenLiveMap
              collectorPos={collectorPosMemo}
              citizenPos={citizenPosMemo}
              collectorName={collector.name}
              vehicleNumber={collector.vehicleNumber}
              isDemoActive={isDemoActive}
              demoSpeed={demoSpeed}
              resetSignal={resetSignal}
              onMetricsUpdate={handleMetricsUpdate}
              onDemoComplete={handleDemoComplete}
            />
          </div>

          {/* RIGHT SIDEBAR: COLLECTOR INFO & PRIVACY GUARANTEE */}
          <div className="space-y-6">

            {/* COLLECTOR PROFILE CARD */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card-static p-6 rounded-3xl border border-border space-y-5"
            >
              <h3 className="text-base font-extrabold text-foreground flex items-center justify-between">
                <span>Assigned Collector</span>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full border border-emerald-500/20">
                  Verified Driver
                </span>
              </h3>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-extrabold text-xl flex items-center justify-center shadow-lg border border-white/20">
                  {collector.name.charAt(0)}
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-base text-foreground">{collector.name}</h4>
                  <p className="text-xs text-muted-foreground font-medium">{collector.vehicleNumber}</p>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold pt-1">
                    <span>★ {collector.rating}</span>
                    <span className="text-muted-foreground font-normal">• Municipal Sanitation Department</span>
                  </div>
                </div>
              </div>

              {/* DISTANCE & SPEED METRICS */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-accent/40 rounded-2xl border border-border text-center">
                  <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Remaining Distance</span>
                  <span className="text-base font-black text-foreground mt-0.5 block">
                    {metrics.distanceKm < 1 ? `${metrics.distanceMeters} m` : `${metrics.distanceKm} km`}
                  </span>
                </div>

                <div className="p-3 bg-accent/40 rounded-2xl border border-border text-center">
                  <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Est. Speed</span>
                  <span className="text-base font-black text-foreground mt-0.5 block">
                    ~25 km/h
                  </span>
                </div>
              </div>

              {/* CALL COLLECTOR BUTTON */}
              <button
                onClick={handleCallCollector}
                className="w-full btn-eco text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg"
              >
                <Phone className="w-4 h-4" /> Call Collector ({collector.name})
              </button>
            </motion.div>

            {/* PRIVACY GUARANTEE CARD */}
            <div className="glass-card-static p-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-sm">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>Privacy Protection Enforced</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For citizen safety and location confidentiality, only your assigned garbage collector's live location is displayed. Other households, delivery points, and private stop locations remain strictly hidden.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* CALL MODAL DIALOG */}
      <AnimatePresence>
        {showCallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-card p-6 md:p-8 rounded-3xl max-w-sm w-full space-y-4 text-center border border-slate-200 dark:border-zinc-700 shadow-2xl bg-white dark:bg-zinc-900 text-foreground relative z-50"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center text-2xl border border-emerald-500/20 animate-pulse">
                <Phone className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground">Contact Garbage Collector</h3>
                <p className="text-xs text-muted-foreground mt-1">Connecting to {collector.name}</p>
              </div>

              <div className="p-4 bg-accent/50 rounded-2xl text-foreground font-mono font-bold text-lg">
                {collector.phone}
              </div>

              <div className="flex gap-3">
                <a
                  href={`tel:${collector.phone.replace(/\s+/g, '')}`}
                  className="btn-eco flex-1 py-3 text-xs font-bold rounded-xl text-center"
                >
                  Dial Number
                </a>
                <button
                  onClick={() => setShowCallModal(false)}
                  className="btn-eco-outline flex-1 py-3 text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CitizenLiveTracking;
