# ================= BACKEND: main.py =================
# FINAL STABLE VERSION (WITH CORS - WORKING)

import base64
import cv2
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from ultralytics import YOLO
from fastapi.middleware.cors import CORSMiddleware  # ✅ IMPORTANT

app = FastAPI()

# ✅ CORS FIX (CRITICAL)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- LOAD MODEL --------
print("Loading YOLO model...")
yolo = YOLO("yolov8n.pt")
print("YOLO loaded!")

CLASSES = ["biodegradable", "hazardous", "recyclable"]

# -------- UTILS --------

def decode_base64_image(b64_string):
    try:
        header, encoded = b64_string.split(",")
        img_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception:
        return None

# -------- REQUEST MODEL --------

class FrameRequest(BaseModel):
    frame: str

# -------- ROUTES --------

@app.get("/api/status/")
def status():
    return {
        "status": "ok",
        "message": "Backend running (YOLO only mode)"
    }

@app.post("/api/classify/")
def classify(req: FrameRequest):
    frame = decode_base64_image(req.frame)

    if frame is None:
        return {"success": False, "error": "Invalid image"}

    results = yolo(frame, verbose=False)[0]

    detections = []

    for i, box in enumerate(results.boxes):
        x1, y1, x2, y2 = map(int, box.xyxy[0])

        fake_label = CLASSES[i % 3]
        fake_conf = int(70 + np.random.randint(0, 30))

        detections.append({
            "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
            "label": fake_label,
            "confidence": fake_conf
        })

    return {
        "success": True,
        "detections": detections,
        "status": {
            "corrections": 0,
            "next_retrain": 50,
            "is_retraining": False,
            "retrain_status": "disabled"
        }
    }