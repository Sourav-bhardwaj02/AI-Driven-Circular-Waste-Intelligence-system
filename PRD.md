# WasteWise — Product Requirement Document (PRD) & Platform Blueprint

> **Version:** 2.0.0  
> **Target Platform:** WasteWise AI-Driven Circular Waste Intelligence System  
> **Tech Stack:** React (TypeScript), Tailwind CSS, Framer Motion, Leaflet + OSM, Express.js (Node.js), MongoDB (Atlas), OSRM Routing Engine

---

## 📋 Table of Contents
1. [Executive Summary & Vision](#1-executive-summary--vision)
2. [User Personas & Role-Based Access Control](#2-user-personas--role-based-access-control)
3. [Page-by-Page Product Architecture](#3-page-by-page-product-architecture)
4. [Deep-Dive Feature Specifications](#4-deep-dive-feature-specifications)
   - [4.1 OSRM Road Navigation & Live Tracking](#41-osrm-road-navigation--live-tracking)
   - [4.2 Society & Community Leaderboard](#42-society--community-leaderboard)
   - [4.3 Real Interactive Rewards & Voucher System](#43-real-interactive-rewards--voucher-system)
   - [4.4 AI Trash & Waste Classifier](#44-ai-trash--waste-classifier)
   - [4.5 Garbage Reporting & Complaint Dispatch](#45-garbage-reporting--complaint-dispatch)
   - [4.6 Collector & Admin Dashboards](#46-collector--admin-dashboards)
5. [Specifications for Placeholder / Missing Pages & Buttons](#5-specifications-for-placeholder--missing-pages--buttons)
6. [Step-by-Step User Guide (How to Test & Use)](#6-step-by-step-user-guide-how-to-test--use)
7. [API Route Mapping & Security Model](#7-api-route-mapping--security-model)

---

## 1. Executive Summary & Vision

**WasteWise** is a full-stack, AI-driven circular waste intelligence platform designed for urban sanitation authorities (such as MCD in Delhi) and urban residents. It bridges the gap between citizens, waste collectors, and municipal administrators through:
- **Real-world street navigation** (powered by OpenStreetMap + OSRM) instead of straight-line coordinates.
- **AI-powered waste segregation** to educate citizens on dry, wet, hazardous, and e-waste disposal.
- **Community gamification** with society/RWA rankings, Eco-Scores, and digital voucher redemption.
- **Real-time operations tracking** for collection vehicles and grievance resolution.

---

## 🛠️ Complete Technology Stack & Architecture

### 1. Frontend Technologies
- **Core Framework:** React 18 with TypeScript
- **Build Tool & Bundler:** Vite 5
- **Styling & UI Tokens:** Tailwind CSS + Vanilla CSS tokens + Glassmorphic dark/light aesthetics
- **UI Components:** Shadcn UI component primitives
- **Icons & Visuals:** Lucide React (`lucide-react`)
- **Animations & Micro-interactions:** Framer Motion (`framer-motion`)
- **Mapping & GIS Engine:** Leaflet + OpenStreetMap Tiles (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`)
- **Routing & State Management:** React Router DOM v6 + React Context API (`AuthContext`)

### 2. Backend & API Services
- **Runtime:** Node.js
- **Web Framework:** Express.js
- **Authentication & Security:** JWT (JSON Web Tokens) with 64-character secret key + bcryptjs password hashing
- **File Upload Handler:** Multer (local disk storage for citizen photo reports)
- **API Proxy Architecture:** Express router proxy for OSRM navigation service (`/api/routing/route`) to prevent external API key leaks in client bundle
- **Environment Configuration:** `dotenv` configuration management

### 3. Database & Data Modeling
- **Database Engine:** MongoDB Atlas (Cloud NoSQL Cluster)
- **Object Data Modeling (ODM):** Mongoose
- **Geospatial Features:** 2dsphere GeoJSON Point indexing for real-time location tracking & distance calculation
- **Data Models:** `User`, `WasteCollection`, `Complaint`, `RewardTransaction`, `Route`, `Grievance`

### 4. Routing & Navigation Infrastructure
- **Routing Machine:** OSRM (Open Source Routing Machine) Driving Engine (`/route/v1/driving/...`)
- **Route Optimizer:** Custom 2-layer greedy nearest-neighbor ordering + OSRM road polyline generator
- **Polyline Decoder:** Dynamic GeoJSON coordinate decoder for Leaflet street rendering

### 5. AI & Machine Learning Integration
- **Waste Classification Model:** Google Gemini 2.0 / SWC AI model integration for real-time image analysis, dry/wet/e-waste identification, and bin color recommendations

---

## 2. User Personas & Role-Based Access Control

| Role | Access Level | Primary Objectives | Default Test Login |
|---|---|---|---|
| **Citizen** | Public / Logged In | Report uncollected garbage, track collection trucks, classify waste with AI, earn & redeem rewards, view society rank. | `citizen@wastewise.com` / `citizen123` |
| **Collector** | Authenticated | View daily assigned collection route, navigate using turn-by-turn road geometry, mark stops completed, track shift metrics. | `collector@wastewise.com` / `collector123` |
| **Admin** | Superuser | Monitor city-wide waste statistics, assign collection routes to collectors, triage citizen complaints, manage users. | `admin@wastewise.com` / `admin123` |

---

## 3. Page-by-Page Product Architecture

```
                                 ┌────────────────────────┐
                                 │   Landing Page (/)     │
                                 └───────────┬────────────┘
                                             │
      ┌───────────────────┬──────────────────┼───────────────────┬───────────────────┐
      ▼                   ▼                  ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Citizen      │   │ Collector    │   │ Admin        │   │ Leaderboard  │   │ Rewards      │
│ Dashboard    │   │ Dashboard    │   │ Dashboard    │   │ Page         │   │ Page         │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────────────┘   └──────────────┘
       │                  │                  │
       ├─ AI Classifier   ├─ Live Route Nav  ├─ Grievance Triage
       ├─ Report Garbage  └─ OSRM Metrics    ├─ Collector Dispatch
       └─ Track Truck                        └─ City Analytics
```

### Detailed Page Catalog

#### 1. Landing Page (`Index.tsx` / `/`)
* **Purpose:** High-impact hero portal showcasing platform value, live statistics, quick links to dashboards, and CTA buttons to login or register.
* **Key Components:**
  - Hero Section with glassmorphic cards and floating animations.
  - Quick Feature Matrix (AI Classifier, Live Route Tracking, Leaderboards, Rewards).
  - Public Impact Counter (Tons of waste collected, active societies, citizen reports resolved).

#### 2. Citizen Dashboard (`CitizenDashboard.tsx` / `/citizen`)
* **Purpose:** Central workspace for residents.
* **Key Features:**
  - Quick action widgets: **Report Garbage**, **Identify Waste with AI**, **Track Nearby Truck**, **Redeem Points**.
  - Personal stats card: Available Eco Points, current Level, activity history.
  - Live complaint status monitor.

#### 3. Collector Dashboard (`CollectorDashboard.tsx` / `/collector`)
* **Purpose:** Command screen for waste vehicle drivers and workers.
* **Key Features:**
  - **Interactive OSRM Live Map:** Real road-following truck movement, pickup pins, and depot locations.
  - **Navigation Card:** Live ETA, distance remaining (km), next pickup location address, and completed stop count.
  - **Route Controls:** "Start Navigation", "Mark Pickup Complete", "Pause Shift".

#### 4. Admin Dashboard (`AdminDashboard.tsx` / `/admin`)
* **Purpose:** Command center for municipal administrators (e.g., MCD officials).
* **Key Features:**
  - City Sanitation Overview (Total active complaints, open vs. resolved cases, active trucks).
  - Grievance Triage List: View citizen photo reports, GPS coordinates, priority level, and assign to nearby collectors.
  - Collector Management Table: Vehicle numbers, assigned zones, shift status.

#### 5. Leaderboard Page (`LeaderboardPage.tsx` / `/leaderboard`)
* **Purpose:** Multi-level competitive community ranking portal.
* **Key Features:**
  - **Top 3 Animated Podium** (Gold, Silver, Bronze badges).
  - **3 Tab Views:** Citizens, Societies/RWAs, Collectors.
  - **Society Eco-Score Bar:** Visual efficiency rating for residential societies.
  - **Search & Filter:** Find your RWA or username instantly.

#### 6. Rewards Center (`RewardsPage.tsx` / `/rewards`)
* **Purpose:** Digital wallet for earning & redeeming points.
* **Key Features:**
  - **Daily Check-in Bonus (+25 Pts):** Single-click daily reward claim.
  - **Digital Voucher Catalog:** 6 options (DJB Water Bill, BSES Power Bill, Jio/Airtel Recharge, Amazon Gift Voucher, DMRC Metro Pass, Flipkart Green Card).
  - **Voucher Generator Modal:** Generates instant codes (e.g. `WW-WATER-8X92K`) with a one-click copy button.
  - **Points History Filters:** All / Earned (+) / Redeemed (-).

#### 7. AI Waste Classifier (`ClassifierPage.tsx` / `/classifier`)
* **Purpose:** AI model for instant garbage identification & bin recommendations.
* **Key Features:**
  - Photo upload & Live camera capture interface.
  - AI Output Card: Waste type (Plastic, Organic, E-Waste, Glass, Paper), Recyclability %, Bin color recommendation (Green, Blue, Yellow, Black).

#### 8. Community Page (`CommunityPage.tsx` / `/community`)
* **Purpose:** Neighborhood feed & local cleanup drives.
* **Key Features:**
  - Community posts feed, upcoming waste drives, event RSVP buttons, and RWA announcements.

---

## 4. Deep-Dive Feature Specifications

### 4.1 OSRM Road Navigation & Live Tracking
- **Frontend File:** `src/components/LiveMap.tsx`, `src/services/osrmRouting.ts`, `src/services/routeOptimizer.ts`
- **Backend File:** `backend/routes/routing.js` (`POST /api/routing/route`)
- **How It Works:**
  1. Frontend submits depot, collection coordinates, and processing plant location to `/api/routing/route`.
  2. Backend proxy forwards request securely to the OSRM Driving Engine (`/route/v1/driving/...`).
  3. Returns high-precision Polyline geometry (`overview=full&geometries=geojson`).
  4. Leaflet renders the dual-polyline: **Dimmed Grey** for completed path, **Emerald Green** for active street route.
  5. Smooth interpolation moves the 🚛 truck marker along exact street turns.

### 4.2 Society & Community Leaderboard
- **Frontend File:** `src/pages/LeaderboardPage.tsx`
- **Backend File:** `backend/routes/leaderboard.js` (`GET /api/leaderboard/societies`, `/citizens`, `/collectors`, `/overview`)
- **How It Works:**
  1. Backend aggregates MongoDB `User` documents grouped by `profile.society`.
  2. Calculates total members, total points, average level, and total reports + collections.
  3. Computes the **Eco-Score** (composite rating of points efficiency and community activity).
  4. Renders top 3 in an animated 3D podium and highlights the logged-in user with a **YOU** badge.

### 4.3 Real Interactive Rewards & Voucher System
- **Frontend File:** `src/pages/RewardsPage.tsx`
- **Backend File:** `backend/routes/citizen.js` (`POST /api/citizen/daily-claim`, `POST /api/citizen/redeem`, `GET /api/citizen/rewards/:userId`)
- **How It Works:**
  1. Citizen clicks **Daily Check-in** to claim +25 Pts once every 24 hours.
  2. When selecting a voucher (e.g. DJB Water Bill - 500 Pts), the system validates point balance.
  3. Generates a random unique voucher code (e.g. `WW-WATER-7Y82A`) and updates MongoDB points balance.
  4. The code is displayed in a popup with a "Copy Code" button and saved in the user's transaction history.

---

## 5. Specifications for Placeholder / Missing Pages & Buttons

The following pages and buttons currently exist as placeholders or require expanded UI views. Here is their full specification for production:

### 1. User Profile & Settings Page (`/profile` — `ProfilePage.tsx`)
- **Current State:** Basic form showing name and email.
- **Specification for Complete Feature:**
  - **Society / RWA Selection Dropdown:** Allow citizens to select or change their registered RWA society (e.g., *Green Park RWA*, *Dwarka Sec-7 RWA*).
  - **Zone & Address Manager:** Input street address, landmark, and ward number for accurate garbage pickup.
  - **Vehicle Details (For Collectors):** Input vehicle registration number (e.g. `DL-01-AB-1234`), capacity (in tons), and assigned depot.
  - **Notification Preferences:** Toggle SMS / Email / Push notifications for truck arrival alerts and complaint status updates.

### 2. Live Tracking Standalone Page (`/live-tracking` — `LiveTrackingPage.tsx`)
- **Current State:** Minimal placeholder wrapper.
- **Specification for Complete Feature:**
  - **Full-Screen GIS Map:** Leaflet map with all active MCD collection trucks in the zone.
  - **ETA Calculator Widget:** Citizens input their address/society and get real-time ETA for the nearest collection vehicle.
  - **Truck Details Drawer:** Click on any truck icon to see driver name, vehicle number, current speed, and route progress.

### 3. Contact & Support Page (`/contact` — `ContactPage.tsx`)
- **Current State:** Basic contact form.
- **Specification for Complete Feature:**
  - **Helpline Directory:** Emergency contacts for MCD Control Room, Swachh Bharat Helpline (1969), and Zonal Nodal Officers.
  - **Direct Ticket Submission:** Submit platform bugs or feedback directly to the support backend.

### 4. Privacy Policy & Terms (`/privacy` — `PrivacyPolicyPage.tsx`)
- **Current State:** Static text layout.
- **Specification for Complete Feature:**
  - Data protection terms regarding GPS location usage, photo submission privacy, and reward point security.

---

## 6. Step-by-Step User Guide (How to Test & Use)

### Scenario A: Testing as a Citizen
1. Go to `http://localhost:8080/login`.
2. Login with: `citizen@wastewise.com` / `citizen123`.
3. **Daily Reward Claim:** Go to **Rewards Center** (`/rewards`), click **Daily Check-in (+25 Pts)**. Watch your points balance update!
4. **Voucher Redemption:** Click on **DJB Water Bill (500 pts)**, click **Confirm Redeem**, and copy your generated voucher code!
5. **Leaderboard:** Go to **Leaderboard** (`/leaderboard`). Click on the **Societies / RWAs** tab to view *Green Park RWA*, *Dwarka Sec-7 RWA*, etc.
6. **AI Waste Classifier:** Go to **AI Classifier** (`/classifier`), upload a photo of garbage or plastic, and inspect the AI classification and bin recommendation.

### Scenario B: Testing as a Waste Collector
1. Login with: `collector@wastewise.com` / `collector123`.
2. Navigate to **Collector Dashboard** (`/collector`).
3. View the **Interactive OSRM Live Map** with the real road-following route line.
4. Click **Start Route Navigation** to watch the truck move along streets with dynamic distance (km) and ETA updates.

### Scenario C: Testing as an MCD Admin
1. Login with: `admin@wastewise.com` / `admin123`.
2. Navigate to **Admin Dashboard** (`/admin`).
3. View city-wide complaint statistics, active collection vehicles, and triage citizen reports.

---

## 7. API Route Mapping & Security Model

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | User login & JWT issuance | Public |
| `POST` | `/api/routing/route` | OSRM Road navigation proxy | Internal Proxy |
| `GET` | `/api/leaderboard/societies` | Aggregated RWA leaderboard | Authenticated |
| `GET` | `/api/leaderboard/citizens` | Top citizen rankings | Authenticated |
| `GET` | `/api/leaderboard/collectors` | Top collector rankings | Authenticated |
| `GET` | `/api/citizen/rewards/:userId` | Get points & transactions | Authenticated |
| `POST` | `/api/citizen/daily-claim` | Claim daily +25 pts bonus | Authenticated |
| `POST` | `/api/citizen/redeem` | Redeem voucher & generate code | Authenticated |
| `POST` | `/api/citizen/report` | Upload garbage report & photo | Authenticated |
