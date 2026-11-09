import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  Navigation,
  Compass,
  Plane,
  Tractor,
  FlaskConical,
  Snowflake,
  ShieldCheck,
  Star,
  Phone,
  ArrowRight,
  Zap,
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const INDIAN_STATE_HUBS = [
  { id: "maharashtra", name: "Maharashtra", state: "Maharashtra", region: "Satara / Pune Corridor", lat: 17.6805, lng: 73.9994, zoom: 9 },
  { id: "punjab", name: "Punjab", state: "Punjab", region: "Ludhiana / Central Malwa", lat: 30.9010, lng: 75.8573, zoom: 9 },
  { id: "haryana", name: "Haryana", state: "Haryana", region: "Karnal / GT Road Basin", lat: 29.6857, lng: 76.9905, zoom: 9 },
  { id: "madhya_pradesh", name: "Madhya Pradesh", state: "Madhya Pradesh", region: "Indore / Malwa Plateau", lat: 22.7196, lng: 75.8577, zoom: 9 },
  { id: "gujarat", name: "Gujarat", state: "Gujarat", region: "Anand / Saurashtra Agro Belt", lat: 22.5645, lng: 72.9289, zoom: 9 },
  { id: "rajasthan", name: "Rajasthan", state: "Rajasthan", region: "Kota / Hadoti Basin", lat: 25.2138, lng: 75.8648, zoom: 9 },
  { id: "karnataka", name: "Karnataka", state: "Karnataka", region: "Dharwad / Mandya Sugar Belt", lat: 15.4589, lng: 75.0078, zoom: 9 },
  { id: "uttar_pradesh", name: "Uttar Pradesh", state: "Uttar Pradesh", region: "Varanasi / Meerut Basin", lat: 25.3176, lng: 82.9739, zoom: 9 },
  { id: "telangana", name: "Telangana", state: "Telangana", region: "Warangal / Nizamabad Corridor", lat: 17.9689, lng: 79.5941, zoom: 9 },
  { id: "andhra_pradesh", name: "Andhra Pradesh", state: "Andhra Pradesh", region: "Guntur / Krishna Delta", lat: 16.3067, lng: 80.4365, zoom: 9 },
  { id: "tamil_nadu", name: "Tamil Nadu", state: "Tamil Nadu", region: "Coimbatore / Cauvery Delta", lat: 11.0168, lng: 76.9558, zoom: 9 },
];

function getCategoryColor(cat) {
  switch (cat) {
    case "drone":
      return { bg: "#0284c7", border: "#38bdf8", shadow: "rgba(2, 132, 199, 0.4)", label: "Drone Spraying" };
    case "machinery":
      return { bg: "#d97706", border: "#fbbf24", shadow: "rgba(217, 119, 6, 0.4)", label: "Heavy Machinery" };
    case "soil":
      return { bg: "#16a34a", border: "#4ade80", shadow: "rgba(22, 163, 74, 0.4)", label: "Soil & Drip" };
    case "storage":
      return { bg: "#2563eb", border: "#60a5fa", shadow: "rgba(37, 99, 235, 0.4)", label: "Cold Storage" };
    default:
      return { bg: "#475569", border: "#94a3b8", shadow: "rgba(71, 85, 105, 0.4)", label: "Service Hub" };
  }
}

function createMarkerIcon(category, distance) {
  const c = getCategoryColor(category);
  const iconSvg =
    category === "drone"
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M7 7l10 10M17 7 7 17"/></svg>`
      : category === "machinery"
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 11 4.5-4.5"/><path d="M10 16a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm0 0h12v-5l-4-4h-5v9Z"/><circle cx="18" cy="16" r="2"/></svg>`
      : category === "soil"
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/></svg>`;

  const distBadge =
    distance != null
      ? `<div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); background: #0f172a; color: #fff; font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 6px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.4);">${distance.toFixed(0)}km</div>`
      : "";

  return L.divIcon({
    className: "custom-hub-marker",
    html: `
      <div style="position: relative; width: 34px; height: 34px;">
        <div style="
          width: 34px;
          height: 34px;
          background: ${c.bg};
          border: 2px solid ${c.border};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px ${c.shadow};
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          ${iconSvg}
        </div>
        ${distBadge}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

function createCenterIcon(label) {
  return L.divIcon({
    className: "center-location-marker",
    html: `
      <div style="position: relative; width: 30px; height: 30px;">
        <div style="
          position: absolute;
          inset: -8px;
          background: rgba(16, 185, 129, 0.25);
          border-radius: 50%;
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        "></div>
        <div style="
          width: 30px;
          height: 30px;
          background: #059669;
          border: 3px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(5, 150, 105, 0.6);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          top: 34px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.9);
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 8px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.2);
        ">${label}</div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function ServiceDiscoveryMap({
  selectedLocation,
  onSelectLocation,
  operators = [],
  activeCategory = "all",
  onSelectCategory,
  onBookOperator,
  farms = [],
}) {
  const { t } = useTranslation();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const centerLayerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat = selectedLocation?.lat || 17.6805;
    const initialLng = selectedLocation?.lng || 73.9994;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: selectedLocation?.zoom || 9,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    centerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Center and Markers whenever selectedLocation or operators change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const targetLat = selectedLocation?.lat || 17.6805;
    const targetLng = selectedLocation?.lng || 73.9994;

    map.flyTo([targetLat, targetLng], selectedLocation?.zoom || 9, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    // Update Center Marker & Coverage Circle
    if (centerLayerRef.current) {
      centerLayerRef.current.clearLayers();

      // Coverage Radar Circle (35km operating perimeter)
      L.circle([targetLat, targetLng], {
        radius: 35000,
        color: "#10b981",
        weight: 1.5,
        dashArray: "6, 6",
        fillColor: "#10b981",
        fillOpacity: 0.06,
      }).addTo(centerLayerRef.current);

      // Center Pin
      L.marker([targetLat, targetLng], {
        icon: createCenterIcon(selectedLocation?.name || "Selected State"),
        zIndexOffset: 1000,
      }).addTo(centerLayerRef.current);
    }

    // Update Operator Markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      operators.forEach((op) => {
        if (!op.lat || !op.lng) return;

        const marker = L.marker([op.lat, op.lng], {
          icon: createMarkerIcon(op.category, op.distance_km),
        }).addTo(markersLayerRef.current);

        const popupContent = `
          <div style="font-family: inherit; min-width: 210px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 6px; background: #e0f2fe; color: #0369a1;">
                ${op.category.toUpperCase()}
              </span>
              <span style="font-size: 11px; font-weight: 800; color: #059669;">
                ⭐ ${op.rating ? op.rating.toFixed(1) : "4.9"}
              </span>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.2; margin-bottom: 4px;">
              ${op.name}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
              📍 ${op.base_location}
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; margin-bottom: 8px; font-size: 10px;">
              <div style="font-weight: 700; color: #334155; margin-bottom: 2px;">🚜 ${op.equipment_type}</div>
              <div style="font-size: 9px; color: #64748b;">${op.dgca_license || "Verified Partner"}</div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 6px;">
              <div style="font-size: 11px; font-weight: 800; color: #047857;">
                ${op.distance_km != null ? `${op.distance_km.toFixed(1)} km away` : "Nearby"}
              </div>
              <button
                id="book-op-btn-${op.id}"
                style="background: #16a34a; color: #fff; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px;"
              >
                ⚡ Dispatch
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 280 });

        marker.on("popupopen", () => {
          const btn = document.getElementById(`book-op-btn-${op.id}`);
          if (btn) {
            btn.onclick = () => {
              if (mapRef.current) {
                mapRef.current.closePopup();
              }
              if (onBookOperator) onBookOperator(op);
            };
          }
        });
      });
    }
  }, [selectedLocation, operators, onBookOperator]);

  // Compute Nearby Infrastructure Radar Metrics
  const nearestDrone = operators.find((o) => o.category === "drone");
  const nearestMachinery = operators.find((o) => o.category === "machinery");
  const nearestSoil = operators.find((o) => o.category === "soil");
  const totalVerifiedInRegion = operators.length;

  return (
    <div
      className="p-6 rounded-3xl overflow-hidden mb-8"
      style={{
        background: "var(--clay-surface)",
        boxShadow: "var(--clay-card-shadow)",
        border: "1px solid rgba(255, 255, 255, 0.7)",
      }}
    >
      {/* Header with State Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-emerald-100 text-emerald-800 shadow-xs">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {t("services.radar_title", "Nearby Agri-Infrastructure & State Service Radar")}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  {selectedLocation?.name}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-bold">
                {t("services.radar_sub", "Select any state or farm on the map to instantly reveal all verified local drone pilots, combine CHCs & soil labs.")}
              </p>
            </div>
          </div>
        </div>

        {/* State Selection Dropdown & Farms */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" /> State:
          </span>
          <select
            value={selectedLocation?.id || "maharashtra"}
            onChange={(e) => {
              const loc =
                INDIAN_STATE_HUBS.find((s) => s.id === e.target.value) ||
                farms.find((f) => `farm_${f.id}` === e.target.value);
              if (loc) onSelectLocation(loc);
            }}
            className="px-3.5 py-2 rounded-2xl text-xs font-black text-slate-800 bg-white border border-slate-200 shadow-xs outline-none focus:border-emerald-500"
          >
            <optgroup label="📍 Indian Agricultural States">
              {INDIAN_STATE_HUBS.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.region})
                </option>
              ))}
            </optgroup>
            {farms.length > 0 && (
              <optgroup label="🌾 My Registered Farms">
                {farms.map((f) => (
                  <option key={`farm_${f.id}`} value={`farm_${f.id}`}>
                    {f.farm_name} ({f.crop || "Farm"} · {f.district || "Local"})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* State Quick-Chips Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-thin">
        {INDIAN_STATE_HUBS.map((st) => {
          const isSelected = selectedLocation?.id === st.id;
          return (
            <button
              key={st.id}
              onClick={() => onSelectLocation(st)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <span>{isSelected ? "📍" : "•"}</span>
              <span>{st.name}</span>
            </button>
          );
        })}
      </div>

      {/* Real-Time Nearby Infrastructure Radar Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase">Active Hubs</span>
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1">
            <div className="text-lg font-black text-slate-900">{totalVerifiedInRegion} Operators</div>
            <div className="text-[10px] text-emerald-600 font-bold">In {selectedLocation?.name}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase">Nearest Drone</span>
            <Plane className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="mt-1">
            <div className="text-lg font-black text-slate-900">
              {nearestDrone?.distance_km != null ? `${nearestDrone.distance_km.toFixed(1)} km` : "Available"}
            </div>
            <div className="text-[10px] text-slate-600 font-bold truncate">
              {nearestDrone ? nearestDrone.name.split("(")[0] : "DGCA Pilot"}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase">Nearest Harvester</span>
            <Tractor className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-1">
            <div className="text-lg font-black text-slate-900">
              {nearestMachinery?.distance_km != null ? `${nearestMachinery.distance_km.toFixed(1)} km` : "Available"}
            </div>
            <div className="text-[10px] text-slate-600 font-bold truncate">
              {nearestMachinery ? nearestMachinery.name : "Custom Hiring Center"}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase">Nearest Soil Lab</span>
            <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1">
            <div className="text-lg font-black text-slate-900">
              {nearestSoil?.distance_km != null ? `${nearestSoil.distance_km.toFixed(1)} km` : "Available"}
            </div>
            <div className="text-[10px] text-slate-600 font-bold truncate">
              {nearestSoil ? nearestSoil.name : "Govt Mobile Van"}
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-inner isolate z-0" style={{ height: "420px" }}>
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

        {/* Floating Category Filter Overlay on Top Right of Map */}
        <div className="absolute top-3 right-3 z-1000 flex items-center gap-1.5 p-1 rounded-2xl bg-white/95 shadow-md border border-slate-200">
          {[
            { id: "all", label: "All" },
            { id: "drone", label: "🛸 Drone" },
            { id: "machinery", label: "🚜 Harvester" },
            { id: "soil", label: "🧪 Soil" },
            { id: "storage", label: "❄️ Storage" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
                activeCategory === cat.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Legend Overlay at Bottom Left */}
        <div className="absolute bottom-3 left-3 z-1000 p-2.5 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md text-[10px] flex items-center gap-3">
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> Drones
          </div>
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Harvesters / Tractors
          </div>
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Soil Labs
          </div>
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> Cold Storage
          </div>
        </div>
      </div>
    </div>
  );
}
