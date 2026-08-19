import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css'
import { BrowserRouter } from "react-router-dom";
import { DashboardProvider } from "@/context/DashboardContext";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>

        <App />

  </React.StrictMode>
);