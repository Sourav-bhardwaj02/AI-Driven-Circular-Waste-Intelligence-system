# ================= BACKEND: main.py with TACO Engine =================

import base64
import cv2
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from taco_engine import taco_engine

# -------- INIT APP --------
app = FastAPI(
    title="WasteWise TACO Circular Intelligence API",
    description="AI Waste Classification using TACO (Trash Annotations in Context) Dataset & Taxonomy",
    version="2.1.0"
)

# -------- CORS --------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLASSES = ["biodegradable", "hazardous", "recyclable"]

# -------- YOLO SETUP (Optional fallback) --------
try:
    from ultralytics import YOLO
    print("🚀 Checking YOLO model...")
    yolo = YOLO("yolov8n.pt")
    YOLO_AVAILABLE = True
    print("✅ YOLO loaded successfully!")
except Exception as e:
    print(f"ℹ️ YOLO/Torch not present ({e}). Operating in TACO Native Intelligence Mode.")
    yolo = None
    YOLO_AVAILABLE = False


# -------- UTILS --------
def decode_base64_image(b64_string: str):
    try:
        if "," in b64_string:
            _, encoded = b64_string.split(",", 1)
        else:
            encoded = b64_string
        img_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print("❌ Decode error:", e)
        return None


# -------- REQUEST MODEL --------
class FrameRequest(BaseModel):
    frame: str


# -------- ROUTES --------

@app.get("/")
def root():
    return {
        "name": "WasteWise Circular Waste Intelligence API (TACO Enabled)",
        "version": "2.1.0",
        "status": "online",
        "taco_engine_loaded": taco_engine.loaded,
        "taco_classes_count": len(taco_engine.categories),
        "taco_supercategories_count": len(taco_engine.supercategories),
        "yolo_engine": YOLO_AVAILABLE
    }


@app.get("/api/status/")
def status():
    return {
        "status": "ok",
        "engine": "TACO Dataset & Vision Intelligence Engine",
        "dataset": "TACO (Trash Annotations in Context)",
        "taco_loaded": taco_engine.loaded,
        "taco_classes_count": len(taco_engine.categories),
        "classes": CLASSES
    }


@app.get("/api/taco/taxonomy/")
def taco_taxonomy():
    """Returns the full 60 TACO categories with circular mapping."""
    return {
        "success": True,
        "total_categories": len(taco_engine.categories),
        "supercategories": taco_engine.supercategories,
        "categories": list(taco_engine.categories.values())
    }


@app.get("/api/taco/stats/")
def taco_stats():
    """Returns summary statistics for the integrated TACO dataset."""
    return {
        "dataset_name": "TACO (Trash Annotations in Context)",
        "paper_citation": "Pedro F. Proença and Pedro Simões, TACO: Trash Annotations in Context for Litter Detection, arXiv:2003.06975, 2020",
        "total_categories": len(taco_engine.categories),
        "supercategories_count": len(taco_engine.supercategories),
        "supercategories": list(taco_engine.supercategories.keys())
    }


@app.post("/api/classify/")
def classify(req: FrameRequest):
    frame = decode_base64_image(req.frame)

    if frame is None:
        return {"success": False, "error": "Invalid base64 image data", "detections": []}

    try:
        # Use TACO-aligned detection and feature classification
        detections = taco_engine.detect_and_classify(frame)

        return {
            "success": True,
            "engine": "TACO Intelligence Engine",
            "dataset": "TACO Dataset",
            "detections": detections,
            "count": len(detections),
            "status": {
                "is_retraining": False,
                "engine": "TACO Vision Engine",
                "yolo_mode": YOLO_AVAILABLE
            }
        }
    except Exception as err:
        print("❌ TACO Classification error:", err)
        return {"success": False, "error": str(err), "detections": []}