import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";


const HEALTH_COLORS = {
  good: "#4d7042",
  medium: "#d9a441",
  low: "#b4472a",
  unknown: "#a9a494",
};

const SEARCH_CSS = `
  .map-search-control {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1000;
    display: flex;
    gap: 4px;
    pointer-events: auto;
  }
  .map-search-input {
    width: 220px;
    padding: 6px 10px;
    border: 2px solid #35502f;
    border-radius: 6px;
    font-size: 0.82rem;
    background: rgba(255,255,255,0.97);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    outline: none;
  }
  .map-search-input:focus {
    border-color: #4caf50;
    box-shadow: 0 2px 12px rgba(76,175,80,0.3);
  }
  .map-search-btn {
    padding: 6px 12px;
    background: #35502f;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 0.82rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    white-space: nowrap;
  }
  .map-search-btn:hover { background: #4caf50; }
  .map-search-results {
    position: absolute;
    top: 38px;
    right: 0;
    width: 280px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    z-index: 1001;
    max-height: 220px;
    overflow-y: auto;
  }
  .map-search-result-item {
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
    font-size: 0.82rem;
    cursor: pointer;
    line-height: 1.3;
  }
  .map-search-result-item:last-child { border-bottom: none; }
  .map-search-result-item:hover { background: #f5f5f5; }
  .map-search-no-result {
    padding: 12px;
    text-align: center;
    color: #888;
    font-size: 0.85rem;
  }
`;

async function nominatimSearch(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&countrycodes=in`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) return [];
  return res.json();
}

export default function NdviMap({ boundaryGeojson, gridCells, allBoundaries = [], height = '420px', farmName = '', hideSearch = false, activeLayer = 'NDVI', spectralData = null }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const layerGroupRef = useRef(null);
  const boundaryGroupRef = useRef(null);
  const searchMarkerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (mapRef.current) return;

    if (!document.getElementById("agritwin-search-css")) {
      const style = document.createElement("style");
      style.id = "agritwin-search-css";
      style.textContent = SEARCH_CSS;
      document.head.appendChild(style);
    }

    const map = L.map(containerRef.current, { zoomControl: true });
    mapRef.current = map;

    // Satellite + Road/Village Overlay
    L.tileLayer(
      "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        attribution: '&copy; Google Maps',
      }
    ).addTo(map);

    boundaryGroupRef.current = L.layerGroup().addTo(map);
    layerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update boundary layer
  useEffect(() => {
    if (!mapRef.current || !boundaryGroupRef.current) return;
    boundaryGroupRef.current.clearLayers();

    if (allBoundaries && allBoundaries.length > 0) {
      let activeBounds = null;
      allBoundaries.forEach((farm) => {
        const isSelected = JSON.stringify(farm.boundary) === JSON.stringify(boundaryGeojson);
        const bLayer = L.geoJSON(farm.boundary, {
          style: {
            color: isSelected ? "#2f4d27" : "#888275",
            weight: isSelected ? 3 : 1.5,
            fillColor: isSelected ? "#4d7042" : "#a9a494",
            fillOpacity: isSelected ? 0.15 : 0.05,
            dashArray: isSelected ? undefined : "4,4",
          },
        }).bindTooltip(farm.farm_name || "Farm Field").addTo(boundaryGroupRef.current);

        if (isSelected) {
          activeBounds = bLayer.getBounds();
        }
      });

      if (activeBounds) {
        mapRef.current.fitBounds(activeBounds, { padding: [30, 30] });
      }
    } else if (boundaryGeojson) {
      try {
        const boundaryLayer = L.geoJSON(boundaryGeojson, {
          style: { color: "#2f4d27", weight: 3, fill: true, fillColor: "#4d7042", fillOpacity: 0.15 },
        });
        if (farmName) {
          boundaryLayer.bindTooltip(farmName, { permanent: true, direction: "center", className: "farm-boundary-tooltip" });
        }
        boundaryLayer.addTo(boundaryGroupRef.current);
        const b = boundaryLayer.getBounds();
        mapRef.current.fitBounds(b, { padding: [30, 30] });
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
            mapRef.current.fitBounds(b, { padding: [30, 30] });
          }
        }, 200);
      } catch (err) {}
    }
  }, [boundaryGeojson, allBoundaries]);

  // Update grid cells layer
  useEffect(() => {
    if (!layerGroupRef.current) return;
    layerGroupRef.current.clearLayers();

    if (!gridCells) return;

    gridCells.forEach((cell) => {
      const color = HEALTH_COLORS[cell.health] || HEALTH_COLORS.unknown;
      L.geoJSON(cell.geometry, {
        style: {
          color,
          weight: 1,
          fillColor: color,
          fillOpacity: 0.45,
        },
      })
        .bindTooltip(
          cell.ndvi_mean !== null && cell.ndvi_mean !== undefined
            ? `NDVI ${cell.ndvi_mean.toFixed(2)} (${cell.health})`
            : "No data"
        )
        .addTo(layerGroupRef.current);
    });
  }, [gridCells]);


  // Active Multispectral Index Layer Overlay
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;
    layerGroupRef.current.clearLayers();

    if (!boundaryGeojson) return;

    // Layer-specific dynamic color styling
    const LAYER_THEMES = {
      Satellite: { color: '#059669', fillColor: '#10b981', fillOpacity: 0.12, label: 'High-Res Optical' },
      NDVI:      { color: '#16a34a', fillColor: '#22c55e', fillOpacity: 0.22, label: 'NDVI Vegetation Vigor' },
      NDMI:      { color: '#0284c7', fillColor: '#38bdf8', fillOpacity: 0.24, label: 'NDMI Canopy Moisture' },
      EVI:       { color: '#0d9488', fillColor: '#14b8a6', fillOpacity: 0.22, label: 'EVI Biomass Canopy' },
      GNDVI:     { color: '#65a30d', fillColor: '#84cc16', fillOpacity: 0.22, label: 'GNDVI Chlorophyll & Nitrogen' },
      NDRE:      { color: '#ea580c', fillColor: '#f97316', fillOpacity: 0.22, label: 'NDRE Red-Edge Early Stress' },
      SAVI:      { color: '#ca8a04', fillColor: '#eab308', fillOpacity: 0.22, label: 'SAVI Soil-Adjusted Index' },
      Moisture:  { color: '#0369a1', fillColor: '#0ea5e9', fillOpacity: 0.25, label: 'Soil & Canopy Moisture' },
    };

    const theme = LAYER_THEMES[activeLayer] || LAYER_THEMES.NDVI;

    try {
      L.geoJSON(boundaryGeojson, {
        style: {
          color: theme.color,
          weight: 3,
          fillColor: theme.fillColor,
          fillOpacity: theme.fillOpacity,
          dashArray: activeLayer === 'Satellite' ? undefined : '2, 2',
        },
      }).addTo(layerGroupRef.current);
    } catch {}
  }, [boundaryGeojson, activeLayer]);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setShowResults(true);
    try {
      const results = await nominatimSearch(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") {
      setShowResults(false);
      setSearchResults([]);
    }
  };

  const handleResultClick = useCallback((result) => {
    const map = mapRef.current;
    if (!map) return;
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    map.setView([lat, lon], 16);

    if (searchMarkerRef.current) searchMarkerRef.current.remove();
    searchMarkerRef.current = L.marker([lat, lon])
      .addTo(map)
      .bindPopup(`<strong>${result.display_name.split(",")[0]}</strong><br/>${result.display_name}`)
      .openPopup();

    setShowResults(false);
    setSearchResults([]);
    setSearchQuery(result.display_name.split(",")[0]);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {!hideSearch && <div className="map-search-control">
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            <input
              className="map-search-input"
              type="text"
              placeholder=""
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            <button className="map-search-btn" onClick={handleSearch} disabled={searching}>
              {searching ? "..." : "Search"}
            </button>
          </div>
          {showResults && (
            <div className="map-search-results">
              {searching ? (
                <div className="map-search-no-result">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="map-search-no-result">No results found</div>
              ) : (
                searchResults.map((r) => (
                  <div key={r.place_id} className="map-search-result-item" onClick={() => handleResultClick(r)}>
                    <span style={{ marginRight: "6px" }}>
                      {r.type === "village" || r.type === "hamlet" ? "🏘️" : r.type === "city" || r.type === "town" ? "🏙️" : "📍"}
                    </span>
                    <strong>{r.display_name.split(",")[0]}</strong>
                    <span style={{ color: "#888", fontSize: "0.75rem" }}>
                      {" "}· {r.display_name.split(",").slice(1, 3).join(",")}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>}
      <div
        ref={containerRef}
        style={{ height, width: "100%", borderRadius: "14px", border: "1px solid var(--line)" }}
        onClick={() => setShowResults(false)}
      />
    </div>
  );
}
