import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckSquare,
  Home as HomeIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL2 || "http://localhost:8000/api";
// const API_URL = "http://127.0.0.1:8000/api";

type Detection = {
  box: { x1: number; y1: number; x2: number; y2: number };
  label: string;
  confidence: number;
};

const CLASS_COLORS: Record<string, string> = {
  biodegradable: "#16a34a",
  recyclable: "#2563eb",
  hazardous: "#dc2626",
  unknown: "#9ca3af",
};

const CLASS_BINS: Record<string, string> = {
  biodegradable: "Green Bin",
  recyclable: "Blue Bin",
  hazardous: "Red Bin",
  unknown: "Unknown",
};

const wasteTypes = [
  { type: "biodegradable", label: "Biodegradable", icon: CheckSquare },
  { type: "recyclable", label: "Recyclable", icon: HomeIcon },
  { type: "hazardous", label: "Hazardous", icon: AlertTriangle },
];

const ClassifierPage: React.FC = () => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [backendOk, setBackendOk] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Backend check
  useEffect(() => {
    axios
      .get(`${API_URL}/status/`)
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  // ✅ Draw bounding boxes
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
      const color = CLASS_COLORS[det.label] || "#9ca3af";

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      const text = `${det.label} ${det.confidence}%`;
      ctx.fillStyle = color;
      ctx.fillRect(x1, y1 - 20, text.length * 7, 20);

      ctx.fillStyle = "#000";
      ctx.fillText(text, x1 + 4, y1 - 5);
    });
  }, []);

  // ✅ Send frame to backend
  const sendFrame = useCallback(async () => {
    if (!videoRef.current || !backendOk || isProcessing) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = videoRef.current.videoWidth || 640;
    tempCanvas.height = videoRef.current.videoHeight || 480;

    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const frameB64 = tempCanvas.toDataURL("image/jpeg", 0.7);

    setIsProcessing(true);

    try {
      const res = await axios.post(`${API_URL}/classify/`, {
        frame: frameB64,
      });

      if (res.data.success) {
        setDetections(res.data.detections);
        drawBoxes(res.data.detections);
      }
    } catch (e) {
      console.error(e);
    }

    setIsProcessing(false);
  }, [backendOk, isProcessing, drawBoxes]);

  // ✅ Camera toggle
  const toggleCamera = async () => {
    if (isCameraOn) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setIsCameraOn(false);
      setDetections([]);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      setIsCameraOn(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          intervalRef.current = setInterval(sendFrame, 1500);
        }
      }, 200);
    }
  };

  useEffect(() => {
    drawBoxes(detections);
  }, [detections, drawBoxes]);

  // 👉 Get main detected result
  const topDetection = detections[0];

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Link to="/" className="text-sm text-primary mb-4 inline-block">
            ← Back
          </Link>

          <h1 className="text-3xl font-bold text-center mb-6">
            AI Waste Scanner
          </h1>

          {/* CAMERA */}
          <div className="relative rounded-2xl overflow-hidden bg-black mb-6">
            {isCameraOn ? (
              <>
                <video ref={videoRef} autoPlay className="w-full" />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                />
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-white">
                Camera Off
              </div>
            )}
          </div>

          {/* BUTTON */}
          <button
            onClick={toggleCamera}
            className="btn-eco w-full mb-6 flex justify-center items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            {isCameraOn ? "Stop Camera" : "Start Camera"}
          </button>

          {/* STATUS */}
          <p className="text-center mb-4">
            {backendOk ? "🟢 Backend Connected" : "🔴 Backend Offline"}
          </p>

          {/* RESULT */}
          {topDetection && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="glass-card p-6"
            >
              <h2 className="text-2xl font-bold mb-2 capitalize">
                {topDetection.label}
              </h2>
              <p>{CLASS_BINS[topDetection.label]}</p>
              <p>{topDetection.confidence}% confidence</p>

              <div className="grid grid-cols-3 gap-3 mt-4">
                {wasteTypes.map((w) => (
                  <div
                    key={w.type}
                    className={`p-3 text-center rounded-lg ${
                      topDetection.label === w.type
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                  >
                    <w.icon className="mx-auto mb-2" />
                    <p>{w.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* FALLBACK UI */}
          {!isCameraOn && !topDetection && (
            <div className="text-center mt-10">
              <Upload className="mx-auto mb-3" />
              <p>Start camera to begin detection</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ClassifierPage;