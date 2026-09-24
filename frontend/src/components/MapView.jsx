import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Crosshair,
  Database,
  Layers,
  LocateFixed,
  Map as MapIcon,
  Maximize2,
  RefreshCw,
  ShieldAlert,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "../styles/MapView.css";

/* ============================================================
   MAP CONFIGURATION
   ============================================================ */

const CENTER = [30.0668, 79.0193];
const ZOOM = 6;

const DEFAULT_HEIGHT = "680px";

/*
 * This is only the UI refresh interval.
 *
 * IMPORTANT:
 * We do NOT randomly modify disaster risk anymore.
 *
 * Real data should be supplied through the `locations` prop
 * or through your backend refresh logic.
 */
const REFRESH_TIME = 10000;


/* ============================================================
   FALLBACK DEMO DATA
   ============================================================ */

const initialLocations = [
  {
    id: "DM-001",
    name: "Dehradun",
    latitude: 30.3165,
    longitude: 78.0322,
    risk: 35,
    level: "Low",
    hazard: "Flood",
    rainfall: 42,
    soilMoisture: 51,
    population: 569000,
  },
  {
    id: "DM-002",
    name: "Mussoorie",
    latitude: 30.4598,
    longitude: 78.0644,
    risk: 58,
    level: "Moderate",
    hazard: "Landslide",
    rainfall: 76,
    soilMoisture: 68,
    population: 30000,
  },
  {
    id: "DM-003",
    name: "Chamoli",
    latitude: 30.401,
    longitude: 79.322,
    risk: 76,
    level: "High",
    hazard: "Landslide",
    rainfall: 104,
    soilMoisture: 81,
    population: 39000,
  },
  {
    id: "DM-004",
    name: "Joshimath",
    latitude: 30.555,
    longitude: 79.565,
    risk: 91,
    level: "Critical",
    hazard: "Landslide",
    rainfall: 138,
    soilMoisture: 89,
    population: 16000,
  },
  {
    id: "DM-005",
    name: "Pithoragarh",
    latitude: 29.5829,
    longitude: 80.2182,
    risk: 72,
    level: "High",
    hazard: "Flood",
    rainfall: 97,
    soilMoisture: 77,
    population: 56000,
  },
  {
    id: "DM-006",
    name: "Gangtok",
    latitude: 27.3389,
    longitude: 88.6065,
    risk: 84,
    level: "Critical",
    hazard: "Landslide",
    rainfall: 126,
    soilMoisture: 85,
    population: 100000,
  },
  {
    id: "DM-007",
    name: "Shimla",
    latitude: 31.1048,
    longitude: 77.1734,
    risk: 55,
    level: "Moderate",
    hazard: "Landslide",
    rainfall: 63,
    soilMoisture: 62,
    population: 340000,
  },
  {
    id: "DM-008",
    name: "Darjeeling",
    latitude: 27.041,
    longitude: 88.2663,
    risk: 67,
    level: "High",
    hazard: "Landslide",
    rainfall: 113,
    soilMoisture: 79,
    population: 132000,
  },
];


/* ============================================================
   RISK HELPERS
   ============================================================ */

const RISK_CONFIG = {
  Low: {
    color: "#22c55e",
    description: "Normal monitoring",
  },

  Moderate: {
    color: "#eab308",
    description: "Exercise caution",
  },

  High: {
    color: "#f97316",
    description: "High risk conditions",
  },

  Critical: {
    color: "#ef4444",
    description: "Immediate attention required",
  },
};


const normalizeLevel = (level, risk = 0) => {
  const normalized = String(level || "").toLowerCase();

  if (normalized.includes("critical")) return "Critical";
  if (normalized.includes("high") || normalized.includes("danger")) {
    return "High";
  }

  if (
    normalized.includes("moderate") ||
    normalized.includes("medium") ||
    normalized.includes("warning")
  ) {
    return "Moderate";
  }

  if (Number(risk) >= 80) return "Critical";
  if (Number(risk) >= 60) return "High";
  if (Number(risk) >= 40) return "Moderate";

  return "Low";
};


const getRiskColor = (level) => {
  return RISK_CONFIG[normalizeLevel(level)]?.color || "#64748b";
};


const getRiskRadius = (level) => {
  switch (normalizeLevel(level)) {
    case "Critical":
      return 14000;

    case "High":
      return 10500;

    case "Moderate":
      return 8000;

    default:
      return 6000;
  }
};


const sanitizeLocation = (location, index) => {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  const risk = Math.max(
    0,
    Math.min(100, Number(location?.risk) || 0)
  );

  const level = normalizeLevel(location?.level, risk);

  return {
    id: location?.id || `LOCATION-${index + 1}`,
    name: location?.name || "Unknown Location",

    latitude,
    longitude,

    risk,
    level,

    hazard: location?.hazard || "Unknown Hazard",

    rainfall: Number.isFinite(Number(location?.rainfall))
      ? Number(location.rainfall)
      : 0,

    soilMoisture: Number.isFinite(
      Number(location?.soilMoisture)
    )
      ? Number(location.soilMoisture)
      : 0,

    population: Number.isFinite(
      Number(location?.population)
    )
      ? Number(location.population)
      : 0,
  };
};


/* ============================================================
   MAP RESIZE
   ============================================================ */

function MapResize() {
  const map = useMap();

  useEffect(() => {
    let timer;

    const refreshMapSize = () => {
      window.clearTimeout(timer);

      timer = window.setTimeout(() => {
        map.invalidateSize({
          animate: false,
        });
      }, 150);
    };

    refreshMapSize();

    window.addEventListener(
      "resize",
      refreshMapSize
    );

    return () => {
      window.clearTimeout(timer);

      window.removeEventListener(
        "resize",
        refreshMapSize
      );
    };
  }, [map]);

  return null;
}


/* ============================================================
   MAP CONTROLLER
   ============================================================ */

function MapController({
  onLocation,
  onLocateStart,
  onLocateEnd,
}) {
  const map = useMap();

  useMapEvents({
    locationfound(event) {
      onLocateEnd?.();

      onLocation?.(event.latlng);
    },

    locationerror(error) {
      console.warn(
        "Map location error:",
        error?.message
      );

      onLocateEnd?.();

      onLocation?.(null);
    },
  });

  const locateUser = useCallback(() => {
    onLocateStart?.();

    map.locate({
      setView: true,
      maxZoom: 13,
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    });
  }, [
    map,
    onLocateStart,
  ]);

  const resetMap = useCallback(() => {
    map.flyTo(
      CENTER,
      ZOOM,
      {
        duration: 1.1,
        easeLinearity: 0.25,
      }
    );
  }, [map]);

  const zoomIn = useCallback(() => {
    map.zoomIn();
  }, [map]);

  const zoomOut = useCallback(() => {
    map.zoomOut();
  }, [map]);

  return (
    <div className="map-control-stack">
      <button
        type="button"
        onClick={locateUser}
        className="map-control-button"
        title="Locate current position"
        aria-label="Locate current position"
      >
        <LocateFixed
          size={17}
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        onClick={resetMap}
        className="map-control-button"
        title="Reset map view"
        aria-label="Reset map view"
      >
        <Crosshair
          size={17}
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        onClick={zoomIn}
        className="map-control-button"
        title="Zoom in"
        aria-label="Zoom in"
      >
        +
      </button>

      <button
        type="button"
        onClick={zoomOut}
        className="map-control-button"
        title="Zoom out"
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  );
}


/* ============================================================
   USER LOCATION
   ============================================================ */

function UserLocationMarker({
  location,
}) {
  if (!location) {
    return null;
  }

  return (
    <CircleMarker
      center={[
        location.lat,
        location.lng,
      ]}
      radius={8}
      pathOptions={{
        color: "#ffffff",
        weight: 3,
        fillColor: "#38bdf8",
        fillOpacity: 1,
      }}
    >
      <Tooltip direction="top">
        Your current location
      </Tooltip>

      <Popup>
        <div className="user-location-popup">
          <strong>Your Location</strong>

          <span>
            {location.lat.toFixed(5)},{" "}
            {location.lng.toFixed(5)}
          </span>
        </div>
      </Popup>
    </CircleMarker>
  );
}


/* ============================================================
   RISK LEGEND
   ============================================================ */

function RiskLegend() {
  const levels = [
    "Low",
    "Moderate",
    "High",
    "Critical",
  ];

  return (
    <div
      className="risk-legend"
      aria-label="Risk level legend"
    >
      <div className="legend-heading">
        <Layers size={14} />
        <span>RISK LEVEL</span>
      </div>

      {levels.map((level) => (
        <div
          className="legend-item"
          key={level}
        >
          <span
            className={`legend-dot ${level.toLowerCase()}`}
          />

          <span>{level}</span>
        </div>
      ))}
    </div>
  );
}


/* ============================================================
   RISK POPUP
   ============================================================ */

function RiskPopup({
  location,
}) {
  const level = normalizeLevel(
    location.level,
    location.risk
  );

  const color = getRiskColor(level);

  return (
    <div className="risk-popup">
      <div className="popup-header">
        <div className="popup-location">
          <span className="popup-label">
            INCIDENT NODE
          </span>

          <h3>
            {location.name}
          </h3>

          <span className="popup-id">
            {location.id}
          </span>
        </div>

        <div
          className="popup-risk"
          style={{
            color,
          }}
        >
          {Math.round(location.risk)}
          <small>%</small>
        </div>
      </div>

      <div
        className="popup-level"
        style={{
          color,
          backgroundColor: `${color}18`,
          borderColor: `${color}35`,
        }}
      >
        <ShieldAlert size={13} />

        <span>
          {level} Risk
        </span>
      </div>

      <div className="popup-risk-meter">
        <div className="popup-risk-track">
          <div
            className="popup-risk-fill"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, location.risk)
              )}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>

      <div className="popup-grid">
        <div>
          <span>Hazard</span>
          <strong>
            {location.hazard}
          </strong>
        </div>

        <div>
          <span>Rainfall</span>
          <strong>
            {location.rainfall} mm
          </strong>
        </div>

        <div>
          <span>Soil Moisture</span>
          <strong>
            {location.soilMoisture}%
          </strong>
        </div>

        <div>
          <span>Population</span>
          <strong>
            {location.population.toLocaleString()}
          </strong>
        </div>
      </div>

      <div className="popup-footer">
        <Activity size={12} />

        <span>
          Monitoring node operational
        </span>
      </div>
    </div>
  );
}


/* ============================================================
   MAIN MAP COMPONENT
   ============================================================ */

function MapView({
  locations = initialLocations,
  height = DEFAULT_HEIGHT,
  onRefresh,
}) {
  const [mapData, setMapData] = useState(
    Array.isArray(locations)
      ? locations
      : initialLocations
  );

  const [filter, setFilter] =
    useState("All");

  const [userLocation, setUserLocation] =
    useState(null);

  const [isLocating, setIsLocating] =
    useState(false);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState(new Date());

  const [connectionStatus, setConnectionStatus] =
    useState("connected");

  const mapWrapperRef = useRef(null);

  /* ==========================================================
     SYNC EXTERNAL DATA
     ========================================================== */

  useEffect(() => {
    if (!Array.isArray(locations)) {
      return;
    }

    const sanitized = locations
      .map(sanitizeLocation)
      .filter(Boolean);

    setMapData(sanitized);

    setLastUpdated(new Date());

    setConnectionStatus("connected");
  }, [locations]);


  /* ==========================================================
     LIVE REFRESH INDICATOR
     ========================================================== */

  useEffect(() => {
    const timer = window.setInterval(() => {
      /*
       * Do NOT fabricate new risk values here.
       *
       * If your backend/API is connected, provide an
       * `onRefresh` function that fetches fresh telemetry.
       */

      if (typeof onRefresh === "function") {
        onRefresh();
      }

      setLastUpdated(new Date());
    }, REFRESH_TIME);

    return () => {
      window.clearInterval(timer);
    };
  }, [onRefresh]);


  /* ==========================================================
     MANUAL REFRESH
     ========================================================== */

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    try {
      if (typeof onRefresh === "function") {
        await onRefresh();
      }

      setLastUpdated(new Date());
      setConnectionStatus("connected");
    } catch (error) {
      console.error(
        "Map telemetry refresh failed:",
        error
      );

      setConnectionStatus("offline");
    } finally {
      setIsRefreshing(false);
    }
  }, [
    isRefreshing,
    onRefresh,
  ]);


  /* ==========================================================
     FULLSCREEN
     ========================================================== */

  const handleFullscreen = useCallback(async () => {
    const element = mapWrapperRef.current;

    if (!element) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await element.requestFullscreen?.();

        setIsFullscreen(true);
      } else {
        await document.exitFullscreen?.();

        setIsFullscreen(false);
      }
    } catch (error) {
      console.warn(
        "Fullscreen mode unavailable:",
        error
      );
    }
  }, []);


  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(document.fullscreenElement)
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);


  /* ==========================================================
     FILTER DATA
     ========================================================== */

  const filteredLocations = useMemo(() => {
    if (filter === "All") {
      return mapData;
    }

    return mapData.filter(
      (location) =>
        normalizeLevel(
          location.level,
          location.risk
        ) === filter
    );
  }, [
    mapData,
    filter,
  ]);


  /* ==========================================================
     STATISTICS
     ========================================================== */

  const statistics = useMemo(() => {
    const stats = {
      total: mapData.length,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    };

    mapData.forEach((location) => {
      const level = normalizeLevel(
        location.level,
        location.risk
      );

      const key = level.toLowerCase();

      if (Object.prototype.hasOwnProperty.call(stats, key)) {
        stats[key] += 1;
      }
    });

    return stats;
  }, [mapData]);


  /* ==========================================================
     AVERAGE RISK
     ========================================================== */

  const averageRisk = useMemo(() => {
    if (!mapData.length) {
      return 0;
    }

    const total = mapData.reduce(
      (sum, location) =>
        sum + Number(location.risk || 0),
      0
    );

    return Math.round(
      total / mapData.length
    );
  }, [mapData]);


  /* ==========================================================
     HEIGHT SAFETY
     ========================================================== */

  const safeHeight =
    typeof height === "number"
      ? `${height}px`
      : typeof height === "string" &&
        height.trim()
      ? height
      : DEFAULT_HEIGHT;


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <section
      ref={mapWrapperRef}
      className={`live-map ${
        isFullscreen
          ? "map-fullscreen"
          : ""
      }`}
      style={{
        "--map-height": safeHeight,
      }}
      aria-label="Live disaster risk monitoring map"
    >

      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="map-topbar">
        <div className="map-heading">

          <div className="map-title">
            <span className="live-dot" />

            <MapIcon
              size={19}
              aria-hidden="true"
            />

            <span>
              Live Disaster Risk Map
            </span>
          </div>

          <p>
            Real-time risk monitoring for
            vulnerable hilly regions
          </p>
        </div>

        <div className="map-header-actions">

          <div
            className={`map-connection ${
              connectionStatus
            }`}
          >
            {connectionStatus ===
            "connected" ? (
              <Wifi size={13} />
            ) : (
              <WifiOff size={13} />
            )}

            <span>
              {connectionStatus ===
              "connected"
                ? "TELEMETRY ONLINE"
                : "TELEMETRY OFFLINE"}
            </span>
          </div>

          <button
            type="button"
            className="map-header-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh telemetry"
            aria-label="Refresh telemetry"
          >
            <RefreshCw
              size={15}
              className={
                isRefreshing
                  ? "spin"
                  : ""
              }
            />
          </button>

          <button
            type="button"
            className="map-header-button"
            onClick={handleFullscreen}
            title={
              isFullscreen
                ? "Exit fullscreen"
                : "Open fullscreen"
            }
            aria-label={
              isFullscreen
                ? "Exit fullscreen"
                : "Open fullscreen"
            }
          >
            {isFullscreen ? (
              <X size={15} />
            ) : (
              <Maximize2 size={15} />
            )}
          </button>

          <div className="live-badge">
            <span />
            LIVE
          </div>
        </div>
      </header>


      {/* ======================================================
          OPERATIONS METRICS
          ====================================================== */}

      <div className="map-metrics">

        <div className="map-metric">
          <span className="metric-icon">
            <Database size={14} />
          </span>

          <div>
            <small>MONITORING NODES</small>
            <strong>
              {statistics.total}
            </strong>
          </div>
        </div>

        <div className="map-metric">
          <span className="metric-icon">
            <Activity size={14} />
          </span>

          <div>
            <small>AVERAGE RISK</small>
            <strong>
              {averageRisk}%
            </strong>
          </div>
        </div>

        <div className="map-metric critical-metric">
          <span className="metric-icon">
            <ShieldAlert size={14} />
          </span>

          <div>
            <small>CRITICAL ZONES</small>
            <strong>
              {statistics.critical}
            </strong>
          </div>
        </div>
      </div>


      {/* ======================================================
          FILTER BAR
          ====================================================== */}

      <div className="map-filter">

        {[
          ["All", statistics.total],
          ["Low", statistics.low],
          ["Moderate", statistics.moderate],
          ["High", statistics.high],
          ["Critical", statistics.critical],
        ].map(([name, count]) => (
          <button
            key={name}
            type="button"
            className={`filter-button ${
              filter === name
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilter(name)
            }
            aria-pressed={
              filter === name
            }
          >
            <strong>
              {count}
            </strong>

            <span>
              {name}
            </span>
          </button>
        ))}
      </div>


      {/* ======================================================
          MAP
          ====================================================== */}

      <div className="map-canvas-wrapper">

        <MapContainer
          center={CENTER}
          zoom={ZOOM}
          className="leaflet-map"
          scrollWheelZoom
          zoomControl={false}
          preferCanvas
        >

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            maxZoom={19}
          />

          <MapResize />

          <MapController
            onLocation={setUserLocation}
            onLocateStart={() =>
              setIsLocating(true)
            }
            onLocateEnd={() =>
              setIsLocating(false)
            }
          />

          {/* User location */}

          <UserLocationMarker
            location={
              userLocation
            }
          />


          {/* Disaster locations */}

          {filteredLocations.map(
            (location) => {
              const level =
                normalizeLevel(
                  location.level,
                  location.risk
                );

              const color =
                getRiskColor(level);

              const radius =
                getRiskRadius(level);

              return (
                <div
                  key={location.id}
                >
                  <Circle
                    center={[
                      location.latitude,
                      location.longitude,
                    ]}
                    radius={radius}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity:
                        level ===
                        "Critical"
                          ? 0.17
                          : 0.1,
                      weight:
                        level ===
                        "Critical"
                          ? 2
                          : 1,
                      opacity: 0.7,
                    }}
                  />

                  <CircleMarker
                    center={[
                      location.latitude,
                      location.longitude,
                    ]}
                    radius={
                      level ===
                      "Critical"
                        ? 12
                        : level ===
                          "High"
                        ? 10
                        : 9
                    }
                    pathOptions={{
                      color: "#ffffff",
                      weight: 3,
                      fillColor: color,
                      fillOpacity: 1,
                    }}
                  >

                    <Tooltip
                      direction="top"
                      offset={[0, -10]}
                      opacity={0.96}
                    >
                      <div className="map-tooltip">
                        <strong>
                          {location.name}
                        </strong>

                        <span>
                          {level} Risk ·{" "}
                          {Math.round(
                            location.risk
                          )}
                          %
                        </span>
                      </div>
                    </Tooltip>

                    <Popup
                      closeButton
                      maxWidth={320}
                    >
                      <RiskPopup
                        location={
                          location
                        }
                      />
                    </Popup>

                  </CircleMarker>
                </div>
              );
            }
          )}

        </MapContainer>


        {/* ====================================================
            MAP CONTROL OVERLAY
            ==================================================== */}

        <div className="map-overlay-controls">

          <div className="map-locating-status">
            {isLocating ? (
              <>
                <LocateFixed
                  size={13}
                  className="spin"
                />

                <span>
                  Locating...
                </span>
              </>
            ) : userLocation ? (
              <>
                <Crosshair
                  size={13}
                />

                <span>
                  Position acquired
                </span>
              </>
            ) : (
              <>
                <Crosshair
                  size={13}
                />

                <span>
                  Monitoring region
                </span>
              </>
            )}
          </div>
        </div>

        {/* Map controls */}

        <MapControlOverlay />
      </div>


      {/* ======================================================
          LEGEND
          ====================================================== */}

      <RiskLegend />


      {/* ======================================================
          MAP FOOTER
          ====================================================== */}

      <div className="map-update">

        <div className="map-update-status">
          <span />

          <span>
            Telemetry synchronized
          </span>
        </div>

        <span>
          Last update{" "}
          {lastUpdated.toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }
          )}
        </span>
      </div>

    </section>
  );
}


/* ============================================================
   MAP CONTROL OVERLAY
   ============================================================ */

function MapControlOverlay() {
  const map = useMapSafe();

  if (!map) {
    return null;
  }

  return null;
}


/*
 * This helper intentionally returns null.
 *
 * Actual controls are rendered through MapController,
 * because MapController has access to the Leaflet map.
 *
 * Kept here as a safe extension point for future controls.
 */
function useMapSafe() {
  return null;
}


export default MapView;