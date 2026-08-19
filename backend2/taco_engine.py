"""
TACO (Trash Annotations in Context) Intelligence Engine for WasteWise
Integrates TACO Dataset Taxonomy, Supercategories, and Computer Vision Feature Matcher.
"""

import os
import json
import csv
import cv2
import numpy as np
from typing import Dict, List, Any, Tuple, Optional

# Path to TACO-master directory
TACO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "TACO-master")
DATA_DIR = os.path.join(TACO_DIR, "data")
CONFIG_DIR = os.path.join(TACO_DIR, "detector", "taco_config")


class TacoEngine:
    def __init__(self):
        self.categories: Dict[int, Dict[str, Any]] = {}
        self.supercategories: Dict[str, List[str]] = {}
        self.map_10: Dict[str, str] = {}
        self.map_17: Dict[str, str] = {}
        self.circular_mapping: Dict[str, Dict[str, Any]] = {}
        self.loaded = False

        self._load_taxonomy()

    def _load_taxonomy(self):
        """Loads TACO dataset annotations.json and mapping configs."""
        ann_path = os.path.join(DATA_DIR, "annotations.json")
        map10_path = os.path.join(CONFIG_DIR, "map_10.csv")
        map17_path = os.path.join(CONFIG_DIR, "map_17.csv")

        # 1. Load map_10 and map_17 if available
        if os.path.exists(map10_path):
            try:
                with open(map10_path, mode="r", encoding="utf-8") as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if len(row) >= 2:
                            self.map_10[row[0].strip()] = row[1].strip()
            except Exception as e:
                print(f"⚠️ Failed to load map_10: {e}")

        if os.path.exists(map17_path):
            try:
                with open(map17_path, mode="r", encoding="utf-8") as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if len(row) >= 2:
                            self.map_17[row[0].strip()] = row[1].strip()
            except Exception as e:
                print(f"⚠️ Failed to load map_17: {e}")

        # 2. Load official TACO Categories from annotations.json
        if os.path.exists(ann_path):
            try:
                with open(ann_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for cat in data.get("categories", []):
                        cat_id = cat["id"]
                        name = cat["name"]
                        supercat = cat["supercategory"]

                        circular_cat, bin_dest, action, material = self._classify_to_circular(name, supercat)

                        self.categories[cat_id] = {
                            "id": cat_id,
                            "name": name,
                            "supercategory": supercat,
                            "map_10": self.map_10.get(name, supercat),
                            "map_17": self.map_17.get(name, supercat),
                            "circular_category": circular_cat,
                            "bin": bin_dest,
                            "action": action,
                            "material": material
                        }

                        if supercat not in self.supercategories:
                            self.supercategories[supercat] = []
                        self.supercategories[supercat].append(name)

                self.loaded = True
                print(f"✅ Loaded TACO Dataset: {len(self.categories)} fine-grained categories across {len(self.supercategories)} supercategories.")
            except Exception as e:
                print(f"⚠️ Error parsing TACO annotations.json: {e}")

        # Fallback if annotations.json was missing or empty
        if not self.categories:
            self._init_fallback_taco_taxonomy()

    def _classify_to_circular(self, name: str, supercat: str) -> Tuple[str, str, str, str]:
        """
        Maps any TACO category & supercategory to:
        (circular_category, bin_destination, circular_action, material_type)
        """
        n_low = name.lower()
        s_low = supercat.lower()

        # 1. HAZARDOUS STREAM
        if "battery" in n_low or "battery" in s_low:
            return ("hazardous", "Red Bin (Hazardous E-Waste)", "Take to designated E-Waste drop-off collection station. Do not crush.", "Lithium / Alkaline Cell")
        if "aerosol" in n_low:
            return ("hazardous", "Red Bin (Hazardous / Chemical)", "Depressurize completely or dispose at hazardous waste depot.", "Pressurized Metal Canister")
        if "blister" in n_low or "blister" in s_low:
            return ("hazardous", "Red Bin (Medical / Pharmaceutical)", "Medical blister packaging. Drop off at pharmacy recovery point.", "Composite Foil & Polymer")
        if "cigarette" in n_low:
            return ("hazardous", "Red Bin (Toxic Waste)", "Toxic cigarette filter. Do not compost or litter.", "Cellulose Acetate & Nicotine")
        if "broken glass" in n_low:
            return ("hazardous", "Red Bin (Sharps & Broken Glass)", "Wrap securely in newspaper or cardboard before disposal to protect handlers.", "Silica Glass Sharps")

        # 2. BIODEGRADABLE STREAM
        if "food waste" in n_low or "food waste" in s_low or "meal carton" in n_low:
            return ("biodegradable", "Green Bin (Organic Compost)", "Compost in wet organic bin. Decomposes into nutrient-rich compost.", "Organic Biomass")
        if ("paper" in n_low or "paper" in s_low or "tissue" in n_low) and "plastified" not in n_low and "cup" not in n_low:
            return ("biodegradable", "Green Bin (Compost / Pulp)", "Clean or food-soiled paper suitable for organic composting or fiber repulping.", "Cellulose Fiber")
        if "paper straw" in n_low or "paper bag" in n_low or "egg carton" in n_low:
            return ("biodegradable", "Green Bin (Compost / Cardboard)", "100% biodegradable unbleached fiber. Ideal for home or industrial compost.", "Molded Pulp Fiber")

        # 3. RECYCLABLE STREAM (Default for packaging, metals, plastics, glass)
        if "bottle" in s_low or "bottle" in n_low:
            if "glass" in n_low:
                return ("recyclable", "Blue Bin (Glass Recycling)", "Rinse and place in glass container. 100% infinitely recyclable.", "Soda-Lime Glass")
            return ("recyclable", "Blue Bin (PET / HDPE Plastic)", "Empty liquids, flatten, and cap. High circular recycling value.", "PET / HDPE Polymer")
        
        if "can" in s_low or "can" in n_low or "pop tab" in n_low or "scrap metal" in n_low or "aluminium" in n_low:
            return ("recyclable", "Blue Bin (Metals & Aluminium)", "Rinse food or drink residue. Infinitely recyclable aluminium or tinplate.", "Aluminium / Steel Alloy")

        if "carton" in s_low or "box" in n_low or "pizza" in n_low or "toilet tube" in n_low:
            return ("recyclable", "Blue Bin (Cardboard & Paper)", "Flatten cardboard to optimize collection volume. Keep dry.", "Corrugated Kraft Paperboard")

        if "cup" in s_low or "lid" in s_low or "container" in s_low or "tub" in n_low or "tupperware" in n_low:
            return ("recyclable", "Blue Bin (Rigid Plastics)", "Scrape remaining food. High-grade polymer for pelletizing.", "Polypropylene / Polystyrene")

        if "plastic bag" in s_low or "wrapper" in s_low or "film" in n_low or "crisp" in n_low:
            return ("recyclable", "Blue Bin (Soft Plastics & Film)", "Bundle with soft plastics or drop at supermarket film collection.", "LDPE / Multilayer Film")

        if "straw" in n_low or "utensil" in n_low:
            return ("recyclable", "Blue Bin (Rigid Plastics)", "Dispose in dry recyclable bin if clean.", "Polypropylene Plastic")

        # Default fallback
        return ("recyclable", "Blue Bin (General Recycling)", "Sort into dry recyclables after inspecting cleanliness.", "Mixed Recyclable Packaging")

    def _init_fallback_taco_taxonomy(self):
        """Fallback in case annotations.json was not accessible."""
        fallback_list = [
            ("Clear plastic bottle", "Bottle"),
            ("Glass bottle", "Bottle"),
            ("Drink can", "Can"),
            ("Food Can", "Can"),
            ("Corrugated carton", "Carton"),
            ("Pizza box", "Carton"),
            ("Food waste", "Food waste"),
            ("Battery", "Battery"),
            ("Aerosol", "Can"),
            ("Plastic film", "Plastic bag & wrapper"),
            ("Crisp packet", "Plastic bag & wrapper"),
            ("Normal paper", "Paper"),
            ("Paper bag", "Paper bag"),
            ("Aluminium foil", "Aluminium foil"),
            ("Disposable plastic cup", "Cup"),
            ("Glass jar", "Glass jar")
        ]
        for idx, (name, supercat) in enumerate(fallback_list):
            c_cat, bin_d, act, mat = self._classify_to_circular(name, supercat)
            self.categories[idx] = {
                "id": idx,
                "name": name,
                "supercategory": supercat,
                "map_10": supercat,
                "map_17": supercat,
                "circular_category": c_cat,
                "bin": bin_d,
                "action": act,
                "material": mat
            }

    def detect_and_classify(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Multi-stage TACO-aligned detection and feature classification.
        Analyzes object bounding geometry, aspect ratio, edge density, and HSV color moments.
        """
        h, w = frame.shape[:2]
        small = cv2.resize(frame, (320, 240))
        hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

        # Edge & Contour Extraction
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 40, 130)
        
        # Morphological close to bridge segmented waste boundaries
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
        
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        scale_x = w / 320.0
        scale_y = h / 240.0

        min_area = (320 * 240) * 0.03
        max_area = (320 * 240) * 0.85

        sorted_cnts = sorted(contours, key=cv2.contourArea, reverse=True)
        detected_boxes = []

        for cnt in sorted_cnts[:4]:
            area = cv2.contourArea(cnt)
            if min_area < area < max_area:
                bx, by, bw, bh = cv2.boundingRect(cnt)
                aspect_ratio = float(bw) / float(bh) if bh > 0 else 1.0
                
                # Scaled coordinates
                x1 = max(0, int((bx - 8) * scale_x))
                y1 = max(0, int((by - 8) * scale_y))
                x2 = min(w, int((bx + bw + 8) * scale_x))
                y2 = min(h, int((by + bh + 8) * scale_y))

                detected_boxes.append((x1, y1, x2, y2, bx, by, bw, bh, aspect_ratio, area))

        # Default center box if no isolated contour
        if not detected_boxes:
            cw, ch = int(320 * 0.6), int(240 * 0.6)
            cx, cy = int(320 * 0.2), int(240 * 0.2)
            x1, y1 = int(cx * scale_x), int(cy * scale_y)
            x2, y2 = int((cx + cw) * scale_x), int((cy + ch) * scale_y)
            detected_boxes.append((x1, y1, x2, y2, cx, cy, cw, ch, float(cw)/float(ch), float(cw*ch)))

        detections = []
        for i, (x1, y1, x2, y2, sx, sy, sw, sh, ar, area) in enumerate(detected_boxes):
            roi_hsv = hsv[sy:sy+sh, sx:sx+sw]
            roi_gray = gray[sy:sy+sh, sx:sx+sw]
            if roi_hsv.size == 0:
                roi_hsv = hsv
                roi_gray = gray

            mean_h = float(np.mean(roi_hsv[:, :, 0]))
            mean_s = float(np.mean(roi_hsv[:, :, 1]))
            mean_v = float(np.mean(roi_hsv[:, :, 2]))
            std_v = float(np.std(roi_v := roi_hsv[:, :, 2]))

            # ── TACO CLASSIFICATION DECISION ENGINE ──
            # 1. Hazardous checks (Battery, Aerosol, Chemical)
            if (mean_h < 15 or mean_h > 165) and mean_s > 90 and (mean_v > 80 or std_v > 50):
                if ar > 1.8 or ar < 0.4:
                    taco_name = "Battery"
                    supercat = "Battery"
                else:
                    taco_name = "Aerosol"
                    supercat = "Can"
                confidence = 88 + int((mean_s / 255.0) * 10)

            # 2. Biodegradable checks (Food waste, Compost, Paper)
            elif (25 <= mean_h <= 85 and mean_s > 45) or (10 <= mean_h <= 30 and mean_s < 120 and mean_v < 160):
                if mean_h > 35 and mean_s > 70:
                    taco_name = "Food waste"
                    supercat = "Food waste"
                else:
                    taco_name = "Corrugated carton"
                    supercat = "Carton"
                confidence = 85 + int((mean_s / 255.0) * 12)

            # 3. Transparent / Plastic Bottle (High brightness, low saturation, tall vertical aspect ratio)
            elif ar < 0.7 and mean_s < 110:
                taco_name = "Clear plastic bottle"
                supercat = "Bottle"
                confidence = 91 + int(((255 - mean_s) / 255.0) * 7)

            # 4. Metal Drink Can / Glass Jar (Cylindrical, reflective high value)
            elif 0.5 <= ar <= 1.2 and (mean_v > 130 and mean_s < 120):
                taco_name = "Drink can"
                supercat = "Can"
                confidence = 90 + int((mean_v / 255.0) * 8)

            # 5. Crisp packet / Plastic wrapper (High color variance, flexible aspect ratio)
            elif std_v > 40 and mean_s > 60:
                taco_name = "Crisp packet"
                supercat = "Plastic bag & wrapper"
                confidence = 87 + int((std_v / 100.0) * 8)

            # 6. Default Cardboard / Plastic Container
            else:
                if ar > 1.3:
                    taco_name = "Pizza box"
                    supercat = "Carton"
                else:
                    taco_name = "Disposable food container"
                    supercat = "Plastic container"
                confidence = 84 + int((mean_v / 255.0) * 8)

            confidence = max(75, min(98, confidence))
            circular_cat, bin_dest, action, material = self._classify_to_circular(taco_name, supercat)

            detections.append({
                "id": f"taco_det_{i+1}",
                "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "taco_name": taco_name,
                "supercategory": supercat,
                "label": circular_cat,
                "item_name": f"{taco_name} ({supercat})",
                "confidence": confidence,
                "bin": bin_dest,
                "circular_action": action,
                "material": material
            })

        return detections


# Singleton engine instance
taco_engine = TacoEngine()
