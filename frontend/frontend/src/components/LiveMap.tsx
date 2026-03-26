import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL); // your backend

const LiveMap = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markers = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // ✅ Initialize map
    mapInstance.current = L.map(mapRef.current).setView([28.6139, 77.2090], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OpenStreetMap",
    }).addTo(mapInstance.current);

    // ✅ Listen for location updates
    socket.on("receive-location", (data) => {
      const { id, latitude, longitude } = data;

      if (!mapInstance.current) return;

      mapInstance.current.setView([latitude, longitude], 16);

      if (markers.current[id]) {
        markers.current[id].setLatLng([latitude, longitude]);
      } else {
        markers.current[id] = L.marker([latitude, longitude]).addTo(mapInstance.current);
      }
    });

    // ✅ Remove marker on disconnect
    socket.on("user-disconnected", (id) => {
      if (markers.current[id] && mapInstance.current) {
        mapInstance.current.removeLayer(markers.current[id]);
        delete markers.current[id];
      }
    });

    return () => {
      socket.off("receive-location");
      socket.off("user-disconnected");
    };
  }, []);

  return <div ref={mapRef} style={{ height: "400px", width: "100%" }} />;
};

export default LiveMap;