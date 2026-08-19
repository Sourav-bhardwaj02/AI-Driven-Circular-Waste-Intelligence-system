# ================= BACKEND: main.py with YOLOv8/v11 Waste Intelligence =================

import base64
import cv2
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from yolo_waste_engine import yolo_waste_engine, YOLO_WASTE_KNOWLEDGE

# -------- INIT APP --------
app = FastAPI(
    title="WasteWise YOLOv8/YOLOv11 Circular Intelligence API",
    description="Real-time Waste Classification & Localization using YOLOv8/YOLOv11 Waste-Trained Engine",
    version="3.0.0"
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
        "name": "WasteWise Circular Waste Intelligence API (YOLOv8/YOLOv11 Enabled)",
        "version": "3.0.0",
        "status": "online",
        "engine": "YOLOv8/YOLOv11 Waste-Trained Neural Network",
        "yolo_loaded": yolo_waste_engine.loaded,
        "classes": CLASSES
    }


@app.get("/api/status/")
def status():
    return {
        "status": "ok",
        "engine": "YOLOv8/YOLOv11 Waste-Trained Intelligence Engine",
        "dataset": "YOLO Waste Localization & Circular Taxonomy",
        "yolo_loaded": yolo_waste_engine.loaded,
        "classes": CLASSES
    }


@app.get("/api/taco/taxonomy/")
@app.get("/api/yolo/taxonomy/")
def yolo_taxonomy():
    """Returns the full waste categories with circular mapping."""
    categories_list = []
    for idx, (k, v) in enumerate(YOLO_WASTE_KNOWLEDGE.items(), 1):
        categories_list.append({
            "id": idx,
            "name": k,
            "supercategory": v["supercategory"],
            "circular_category": v["category"],
            "bin": v["bin"],
            "action": v["action"],
            "material": v["material"]
        })

    supercats = {}
    for item in categories_list:
        sc = item["supercategory"]
        if sc not in supercats:
            supercats[sc] = []
        supercats[sc].append(item["name"])

    return {
        "success": True,
        "engine": "YOLOv8 Waste Taxonomy",
        "total_categories": len(categories_list),
        "supercategories": supercats,
        "categories": categories_list
    }


@app.get("/api/taco/stats/")
@app.get("/api/yolo/stats/")
def yolo_stats():
    """Returns summary statistics for the YOLO waste model."""
    return {
        "dataset_name": "YOLOv8/YOLOv11 Waste Localization & Circular Dataset",
        "engine": "Ultralytics YOLO Neural Network",
        "model": "yolov8n.pt (Waste-Trained)",
        "total_categories": len(YOLO_WASTE_KNOWLEDGE),
        "classes": CLASSES
    }


@app.post("/api/classify/")
def classify(req: FrameRequest):
    frame = decode_base64_image(req.frame)

    if frame is None:
        return {"success": False, "error": "Invalid base64 image data", "detections": []}

    try:
        # Real-time YOLOv8 Waste Inference
        detections = yolo_waste_engine.detect_and_classify(frame)

        return {
            "success": True,
            "engine": "YOLOv8 Waste-Trained Intelligence Engine",
            "model": "YOLOv8 / YOLOv11",
            "detections": detections,
            "count": len(detections),
            "status": {
                "engine": "YOLOv8 Real-Time Inference",
                "yolo_mode": True,
                "yolo_loaded": yolo_waste_engine.loaded
            }
        }
    except Exception as err:
        print("❌ YOLO Classification error:", err)
        return {"success": False, "error": str(err), "detections": []}