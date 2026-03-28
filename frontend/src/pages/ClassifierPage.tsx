import { motion } from "framer-motion";
import { Camera, Upload } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL2 || "http://127.0.0.1:8000/api";

const CLASS_BINS = {
  biodegradable: "Green Bin",
  recyclable: "Blue Bin",
  hazardous: "Red Bin",
  unknown: "Unknown",
};

const ClassifierPage = () => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [detections, setDetections] = useState([]);
  const [backendOk, setBackendOk] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  // ✅ Check backend
  useEffect(() => {
    axios.get(`${API_URL}/status/`)
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  // ✅ Draw boxes
  const drawBoxes = useCallback((dets) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    dets.forEach((det) => {
      const { x1, y1, x2, y2 } = det.box;

      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      ctx.fillStyle = "#22c55e";
      ctx.fillText(`${det.label} ${det.confidence}%`, x1, y1 - 5);
    });
  }, []);

  // ✅ Send frame to backend
  const sendFrame = useCallback(async () => {
    if (!videoRef.current || isProcessing || !backendOk) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    const frame = canvas.toDataURL("image/jpeg", 0.7);

    setIsProcessing(true);

    try {
      const res = await axios.post(`${API_URL}/classify/`, { frame });

      if (res.data.success) {
        setDetections(res.data.detections);
        drawBoxes(res.data.detections);
      }
    } catch (e) {
      console.error(e);
    }

    setIsProcessing(false);
  }, [backendOk, isProcessing, drawBoxes]);

  // ✅ Toggle camera
  const toggleCamera = async () => {
    if (isCameraOn) {
      clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setIsCameraOn(false);
      setDetections([]);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      setIsCameraOn(true);

      setTimeout(() => {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        intervalRef.current = setInterval(sendFrame, 1500);
      }, 200);
    }
  };

  useEffect(() => {
    drawBoxes(detections);
  }, [detections, drawBoxes]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">

        <Link to="/" className="text-sm text-primary mb-6 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-center mb-2">
          AI Waste Classifier
        </h1>

        <p className="text-center mb-6">
          {backendOk ? "✅ Backend Connected" : "❌ Backend Offline"}
        </p>

        <div className="glass-card-static p-6">

          {/* CAMERA */}
          <div className="relative rounded-xl overflow-hidden bg-black">
            {isCameraOn ? (
              <>
                <video ref={videoRef} autoPlay className="w-full" />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
              </>
            ) : (
              <div className="text-center p-20 text-gray-400">
                Camera Off
              </div>
            )}
          </div>

          {/* BUTTON */}
          <button
            onClick={toggleCamera}
            className="btn-eco-outline w-full mt-4 flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {isCameraOn ? "Stop Camera" : "Start Camera"}
          </button>

          {/* DETECTIONS */}
          {detections.length > 0 && (
            <div className="mt-6 space-y-3">
              {detections.map((det, i) => (
                <div key={i} className="glass-card p-4 flex justify-between">
                  <span className="font-semibold">{det.label}</span>
                  <span>{CLASS_BINS[det.label]}</span>
                  <span>{det.confidence}%</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ClassifierPage;