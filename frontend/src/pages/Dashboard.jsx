import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import RiskCard from "../components/RiskCard";
import AlertCard from "../components/AlertCard";
import WeatherCard from "../components/WeatherCard";
import TelemetryChart from "../components/TelemetryChart";
import MapView from "../components/MapView";
import Loading from "../components/Loading";

import {
  getAlerts,
  getPredictions,
  getWeather,
  getSensors,
} from "../services/api";

import {
  Activity,
  AlertOctagon,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  LifeBuoy,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

import { useToast } from "../context/ToastContext";

/* ============================================================
   CONFIGURATION
   ============================================================ */

const REFRESH_INTERVAL = 30000;

const FALLBACK_PREDICTION = {
  overallRisk: 72,
  floodRisk: 68,
  landslideRisk: 76,
  riskLevel: "High",
  leadTime: "2–6 hours",
};

const RISK_LEVELS = {
  CRITICAL: "Critical",
  HIGH: "High",
  MODERATE: "Moderate",
  LOW: "Low",
};

/* ============================================================
   HELPERS
   ============================================================ */

function extractArray(response, keys = []) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  for (const key of keys) {
    if (Array.isArray(response?.data?.[key])) {
      return response.data[key];
    }
  }

  return [];
}

function extractObject(response, keys = []) {
  if (
    response?.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    for (const key of keys) {
      if (
        response.data[key] &&
        typeof response.data[key] === "object"
      ) {
        return response.data[key];
      }
    }

    return response.data;
  }

  return null;
}

function getRiskLevel(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return RISK_LEVELS.MODERATE;
  }

  if (numericValue >= 75) {
    return RISK_LEVELS.CRITICAL;
  }

  if (numericValue >= 55) {
    return RISK_LEVELS.HIGH;
  }

  if (numericValue >= 30) {
    return RISK_LEVELS.MODERATE;
  }

  return RISK_LEVELS.LOW;
}

function normalizeRiskLevel(level, fallback = RISK_LEVELS.MODERATE) {
  const normalized = String(level || "").trim().toLowerCase();

  if (normalized === "critical") return RISK_LEVELS.CRITICAL;
  if (normalized === "high") return RISK_LEVELS.HIGH;
  if (normalized === "moderate") return RISK_LEVELS.MODERATE;
  if (normalized === "low") return RISK_LEVELS.LOW;

  return fallback;
}

function getAlertLevel(alert) {
  return String(
    alert?.level ||
      alert?.severity ||
      alert?.riskLevel ||
      "Moderate"
  )
    .trim()
    .toLowerCase();
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function Dashboard() {
  const navigate = useNavigate();
  const { addToast, success, warning, error: toastError } = useToast();

  const [alerts, setAlerts] = useState([]);
  const [prediction, setPrediction] = useState(FALLBACK_PREDICTION);
  const [weather, setWeather] = useState(null);
  const [sensors, setSensors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  const [lastUpdated, setLastUpdated] = useState(null);
  const [syncError, setSyncError] = useState(false);

  const refreshTimerRef = useRef(null);
  const mountedRef = useRef(true);

  /* ============================================================
     DATA LOADING
     ============================================================ */

  const loadDashboard = useCallback(
    async (manual = false) => {
      if (manual) {
        setRefreshing(true);
      } else if (!lastUpdated) {
        setLoading(true);
      }

      try {
        const [
          alertResponse,
          predictionResponse,
          weatherResponse,
          sensorResponse,
        ] = await Promise.allSettled([
          getAlerts(),
          getPredictions(),
          getWeather(),
          getSensors(),
        ]);

        if (!mountedRef.current) return;

        let hasSyncError = false;

        /* ---------------- Alerts ---------------- */

        if (alertResponse.status === "fulfilled") {
          const incomingAlerts = extractArray(alertResponse.value, [
            "alerts",
            "data",
            "results",
          ]);

          setAlerts(incomingAlerts);
        } else {
          hasSyncError = true;
          console.error(
            "Alert telemetry synchronization failed:",
            alertResponse.reason
          );
        }

        /* ---------------- Predictions ---------------- */

        if (predictionResponse.status === "fulfilled") {
          const predictionData =
            extractArray(predictionResponse.value, [
              "predictions",
              "results",
            ]);

          const predictionObject = extractObject(
            predictionResponse.value,
            ["prediction", "result"]
          );

          const latestPrediction =
            predictionData.length > 0
              ? predictionData[0]
              : predictionObject;

          if (latestPrediction) {
            const overallRisk = Number(
              latestPrediction.overallRisk ??
                latestPrediction.overall ??
                latestPrediction.risk ??
                FALLBACK_PREDICTION.overallRisk
            );

            const floodRisk = Number(
              latestPrediction.floodRisk ??
                latestPrediction.flashFloodRisk ??
                FALLBACK_PREDICTION.floodRisk
            );

            const landslideRisk = Number(
              latestPrediction.landslideRisk ??
                latestPrediction.slopeRisk ??
                FALLBACK_PREDICTION.landslideRisk
            );

            setPrediction({
              ...FALLBACK_PREDICTION,
              ...latestPrediction,
              overallRisk: Number.isFinite(overallRisk)
                ? Math.min(100, Math.max(0, overallRisk))
                : FALLBACK_PREDICTION.overallRisk,
              floodRisk: Number.isFinite(floodRisk)
                ? Math.min(100, Math.max(0, floodRisk))
                : FALLBACK_PREDICTION.floodRisk,
              landslideRisk: Number.isFinite(landslideRisk)
                ? Math.min(100, Math.max(0, landslideRisk))
                : FALLBACK_PREDICTION.landslideRisk,
              riskLevel: normalizeRiskLevel(
                latestPrediction.riskLevel,
                getRiskLevel(overallRisk)
              ),
            });
          }
        } else {
          hasSyncError = true;
          console.error(
            "Prediction synchronization failed:",
            predictionResponse.reason
          );
        }

        /* ---------------- Weather ---------------- */

        if (weatherResponse.status === "fulfilled") {
          const weatherData = extractObject(weatherResponse.value, [
            "weather",
            "result",
          ]);

          setWeather(weatherData);
        } else {
          hasSyncError = true;
          console.error(
            "Weather synchronization failed:",
            weatherResponse.reason
          );
        }

        /* ---------------- Sensors ---------------- */

        if (sensorResponse.status === "fulfilled") {
          const sensorData = extractArray(sensorResponse.value, [
            "sensors",
            "results",
            "data",
          ]);

          setSensors(sensorData);
        } else {
          hasSyncError = true;
          console.error(
            "Sensor fleet synchronization failed:",
            sensorResponse.reason
          );
        }

        setSyncError(hasSyncError);
        setLastUpdated(new Date());

        if (manual) {
          if (hasSyncError) {
            warning?.(
              "Some telemetry services could not be synchronized. Available live data has been retained.",
              {
                title: "Partial Telemetry Sync",
              }
            );
          } else {
            success?.(
              "All dashboard telemetry channels synchronized successfully.",
              {
                title: "Command Grid Updated",
              }
            );
          }
        }
      } catch (err) {
        console.error("Dashboard synchronization error:", err);

        if (!mountedRef.current) return;

        setSyncError(true);

        if (manual) {
          toastError?.(
            "The command grid could not complete a telemetry synchronization cycle.",
            {
              title: "Telemetry Sync Failed",
            }
          );
        } else {
          addToast?.({
            title: "Telemetry Sync Warning",
            message:
              "Live telemetry is temporarily unavailable. The dashboard is retaining the latest available state.",
            type: "warning",
            duration: 5000,
          });
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      addToast,
      lastUpdated,
      success,
      toastError,
      warning,
    ]
  );

  /* ============================================================
     INITIAL LOAD + AUTO REFRESH
     ============================================================ */

  useEffect(() => {
    mountedRef.current = true;

    loadDashboard();

    refreshTimerRef.current = setInterval(() => {
      loadDashboard(false);
    }, REFRESH_INTERVAL);

    return () => {
      mountedRef.current = false;

      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [loadDashboard]);

  /* ============================================================
     NETWORK STATUS
     ============================================================ */

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);

      success?.("Network connection restored.", {
        title: "Command Network Online",
      });

      loadDashboard(true);
    };

    const handleOffline = () => {
      setIsOnline(false);

      warning?.(
        "Network connectivity has been interrupted. Live telemetry may become stale.",
        {
          title: "Command Network Offline",
        }
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadDashboard, success, warning]);

  /* ============================================================
     DERIVED TELEMETRY
     ============================================================ */

  const criticalAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const level = getAlertLevel(alert);

      return level === "critical" || level === "high";
    });
  }, [alerts]);

  const criticalCount = useMemo(
    () =>
      alerts.filter(
        (alert) => getAlertLevel(alert) === "critical"
      ).length,
    [alerts]
  );

  const highCount = useMemo(
    () =>
      alerts.filter(
        (alert) => getAlertLevel(alert) === "high"
      ).length,
    [alerts]
  );

  const onlineSensors = useMemo(
    () =>
      sensors.filter((sensor) => {
        const status = String(
          sensor?.status || "Online"
        ).toLowerCase();

        return (
          status === "online" ||
          status === "active" ||
          status === "connected"
        );
      }).length,
    [sensors]
  );

  const sensorHealth = useMemo(() => {
    if (sensors.length === 0) return 0;

    return Math.round(
      (onlineSensors / sensors.length) * 100
    );
  }, [onlineSensors, sensors.length]);

  const overallRisk = Number(
    prediction?.overallRisk ?? FALLBACK_PREDICTION.overallRisk
  );

  const floodRisk = Number(
    prediction?.floodRisk ?? FALLBACK_PREDICTION.floodRisk
  );

  const landslideRisk = Number(
    prediction?.landslideRisk ??
      FALLBACK_PREDICTION.landslideRisk
  );

  const overallRiskLevel = normalizeRiskLevel(
    prediction?.riskLevel,
    getRiskLevel(overallRisk)
  );

  const dashboardStatus = useMemo(() => {
    if (!isOnline) {
      return {
        label: "OFFLINE",
        className: "offline",
        icon: WifiOff,
      };
    }

    if (syncError) {
      return {
        label: "PARTIAL SYNC",
        className: "warning",
        icon: Activity,
      };
    }

    return {
      label: "LIVE",
      className: "online",
      icon: Wifi,
    };
  }, [isOnline, syncError]);

  const StatusIcon = dashboardStatus.icon;

  /* ============================================================
     THREAT ADVISORY
     ============================================================ */

  const advisory = useMemo(() => {
    if (criticalCount > 0 || overallRisk >= 75) {
      return {
        className: "critical",
        tag: "CRITICAL THREAT LEVEL",
        title: "MULTI-HAZARD EMERGENCY CONDITIONS DETECTED",
        message: `${criticalCount || 1} critical hazard condition${
          criticalCount === 1 ? "" : "s"
        } require immediate command-center attention. Maintain evacuation readiness and monitor active warning zones.`,
      };
    }

    if (overallRisk >= 55 || highCount > 0) {
      return {
        className: "critical",
        tag: "HIGH THREAT LEVEL",
        title: "ELEVATED LANDSLIDE & FLASH FLOOD ADVISORY",
        message:
          "Risk indicators are above operational thresholds. Continue enhanced monitoring and maintain emergency response readiness.",
      };
    }

    if (overallRisk >= 30) {
      return {
        className: "warning",
        tag: "MODERATE THREAT LEVEL",
        title: "ENHANCED HAZARD MONITORING ACTIVE",
        message:
          "Current telemetry indicates moderate hazard potential. Continue monitoring rainfall, soil saturation and slope-stability indicators.",
      };
    }

    return {
      className: "safe",
      tag: "NORMAL THREAT LEVEL",
      title: "HAZARD CONDITIONS WITHIN MONITORED THRESHOLDS",
      message:
        "Current telemetry remains within monitored operational ranges. Automated surveillance remains active across the sensor fleet.",
    };
  }, [criticalCount, highCount, overallRisk]);

  /* ============================================================
     NAVIGATION
     ============================================================ */

  const goTo = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate]
  );

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <Loading message="Initializing Multi-Hazard Early Warning Command Grid..." />
    );
  }

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="dashboard-page animate-fade-in">
      {/* ========================================================
          COMMAND STATUS STRIP
          ======================================================== */}

      <div className="dashboard-command-strip">
        <div className="command-strip-left">
          <div className="command-brand-mark">
            <ShieldCheck size={19} />
          </div>

          <div>
            <strong>FLASHGUARD AI COMMAND GRID</strong>
            <span>
              Multi-hazard intelligence & early-warning operations
            </span>
          </div>
        </div>

        <div className="command-strip-right">
          <div className="command-micro-stat">
            <Radio size={14} />
            <span>{alerts.length} alerts</span>
          </div>

          <div className="command-micro-stat">
            <Activity size={14} />
            <span>{sensors.length} sensors</span>
          </div>

          <div className="command-micro-stat">
            <Zap size={14} />
            <span>{sensorHealth}% fleet health</span>
          </div>

          <div
            className={`dashboard-live-status ${dashboardStatus.className}`}
          >
            <StatusIcon size={14} />
            <span>{dashboardStatus.label}</span>
          </div>

          <button
            type="button"
            className="dashboard-refresh-btn"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            title="Synchronize live telemetry"
            aria-label="Synchronize live telemetry"
          >
            {refreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================
          THREAT ADVISORY
          ======================================================== */}

      <div
        className={`threat-advisory-banner ${advisory.className}`}
      >
        <div className="advisory-left">
          <div className="advisory-pulse-icon">
            <AlertOctagon
              size={24}
              className={
                advisory.className === "safe"
                  ? ""
                  : "siren-pulse-fast"
              }
            />
          </div>

          <div className="advisory-text">
            <div className="advisory-title-row">
              <span
                className={`threat-tag ${
                  advisory.className === "safe"
                    ? "green"
                    : advisory.className === "warning"
                      ? "gold"
                      : "red"
                }`}
              >
                {advisory.tag}
              </span>

              <strong>{advisory.title}</strong>
            </div>

            <p>{advisory.message}</p>
          </div>
        </div>

        <div className="advisory-actions">
          <button
            type="button"
            className="advisory-btn primary"
            onClick={() => goTo("/alerts")}
          >
            Review Active Alerts ({alerts.length})
            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            className="advisory-btn secondary"
            onClick={() => goTo("/emergency-hub")}
          >
            Relief Protocols
            <LifeBuoy size={15} />
          </button>
        </div>
      </div>

      {/* ========================================================
          RISK GAUGES
          ======================================================== */}

      <div className="risk-grid">
        <RiskCard
          title="Overall Multi-Hazard Risk"
          value={overallRisk}
          level={overallRiskLevel}
          trend={
            prediction?.trend ||
            "AI ensemble composite"
          }
          subtitle="AI Ensemble Composite"
        />

        <RiskCard
          title="Flash Flood Threat"
          value={floodRisk}
          level={getRiskLevel(floodRisk)}
          trend={
            prediction?.floodTrend ||
            "Alaknanda Basin Gauges"
          }
          subtitle="River Surcharge Risk"
        />

        <RiskCard
          title="Slope & Landslide Risk"
          value={landslideRisk}
          level={getRiskLevel(landslideRisk)}
          trend={
            prediction?.landslideTrend ||
            "Joshimath & Chamoli"
          }
          subtitle="Shear Stress Instability"
        />

        <RiskCard
          title="Emergency Lead Time"
          value={
            prediction?.leadTime ||
            FALLBACK_PREDICTION.leadTime
          }
          level={overallRisk >= 75 ? "Critical" : "High"}
          trend={
            prediction?.leadTimeTrend ||
            "Evacuation Action Window"
          }
          subtitle="Time-to-Criticality"
        />
      </div>

      {/* ========================================================
          OPERATIONAL TELEMETRY
          ======================================================== */}

      <div className="dashboard-operational-overview">
        <div className="operational-status-card">
          <div className="operational-icon cyan">
            <Activity size={20} />
          </div>

          <div>
            <span>Telemetry Network</span>
            <strong>
              {isOnline ? "Operational" : "Disconnected"}
            </strong>
          </div>

          <div className="operational-status-indicator">
            <span
              className={
                isOnline ? "status-dot online" : "status-dot offline"
              }
            />
          </div>
        </div>

        <div className="operational-status-card">
          <div className="operational-icon emerald">
            <Radio size={20} />
          </div>

          <div>
            <span>Active Warnings</span>
            <strong>{criticalAlerts.length}</strong>
          </div>

          <button
            type="button"
            className="mini-action-btn"
            onClick={() => goTo("/alerts")}
          >
            Inspect
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="operational-status-card">
          <div className="operational-icon gold">
            <Zap size={20} />
          </div>

          <div>
            <span>Sensor Fleet Health</span>
            <strong>{sensorHealth}%</strong>
          </div>

          <button
            type="button"
            className="mini-action-btn"
            onClick={() => goTo("/admin")}
          >
            Manage
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="operational-status-card">
          <div className="operational-icon purple">
            <Clock3 size={20} />
          </div>

          <div>
            <span>Last Synchronization</span>
            <strong>
              {lastUpdated
                ? lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "Pending"}
            </strong>
          </div>
        </div>
      </div>

      {/* ========================================================
          MAIN DASHBOARD GRID
          ======================================================== */}

      <div className="dashboard-grid-pro">
        {/* ======================================================
            LEFT COLUMN
            ====================================================== */}

        <div className="dash-col-left">
          {/* ----------------------------------------------------
              TELEMETRY CHART
              ---------------------------------------------------- */}

          <div className="dash-card">
            <div className="dash-card-header">
              <div className="card-title-group">
                <TrendingUp size={18} className="text-cyan" />

                <div>
                  <h3>
                    Real-time Telemetry & Precipitation Trends
                  </h3>

                  <small>
                    Continuous sensor telemetry, rainfall and
                    soil-saturation indicators
                  </small>
                </div>
              </div>

              <button
                type="button"
                className="card-action-link"
                onClick={() => goTo("/monitoring")}
              >
                View Full Fleet
                <ArrowRight size={14} />
              </button>
            </div>

            <TelemetryChart />
          </div>

          {/* ----------------------------------------------------
              LIVE GIS MAP
              ---------------------------------------------------- */}

          <div className="dash-card live-server-map-card">
            <div className="dash-card-header">
              <div className="card-title-group">
                <MapPin size={18} className="text-cyan" />

                <div>
                  <h3>Live Hazard Intelligence Map</h3>

                  <small>
                    Regional command view with active hazard
                    zones, monitoring stations and risk areas
                  </small>
                </div>
              </div>

              <button
                type="button"
                className="card-action-link"
                onClick={() => goTo("/risk-map")}
              >
                Open GIS View
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="dashboard-live-map-wrap">
              <MapView
                selectedStation={null}
                onSelectStation={() => {}}
              />
            </div>
          </div>

          {/* ----------------------------------------------------
              QUICK MISSION ACTION HUB
              ---------------------------------------------------- */}

          <div className="quick-actions-card">
            <div className="quick-actions-header">
              <div>
                <span className="section-kicker">
                  OPERATIONAL TOOLS
                </span>

                <h3>Mission Operation Hub</h3>

                <p>
                  Launch critical command-center workflows
                  directly from the dashboard.
                </p>
              </div>

              <Zap size={21} />
            </div>

            <div className="quick-action-grid">
              <button
                type="button"
                className="action-tile"
                onClick={() => goTo("/dashboard/ai-assistant")}
              >
                <div className="action-tile-icon cyan">
                  <BrainCircuit size={20} />
                </div>

                <div>
                  <strong>AI Learning & Multi-Agent Lab</strong>
                  <p>
                    Interactive training & 4-agent safety
                  </p>
                </div>

                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="action-tile"
                onClick={() => goTo("/simulation")}
              >
                <div className="action-tile-icon cyan">
                  <Sliders size={20} />
                </div>

                <div>
                  <strong>AI What-If Simulator</strong>
                  <p>
                    Model flood, rainfall and slope scenarios
                  </p>
                </div>

                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="action-tile"
                onClick={() => goTo("/risk-map")}
              >
                <div className="action-tile-icon gold">
                  <MapPin size={20} />
                </div>

                <div>
                  <strong>Interactive GIS Map</strong>
                  <p>
                    Inspect stations and active danger zones
                  </p>
                </div>

                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="action-tile"
                onClick={() => goTo("/emergency-hub")}
              >
                <div className="action-tile-icon emerald">
                  <LifeBuoy size={20} />
                </div>

                <div>
                  <strong>Emergency Response</strong>
                  <p>
                    Response coordination and relief resources
                  </p>
                </div>

                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="action-tile"
                onClick={() => goTo("/history")}
              >
                <div className="action-tile-icon purple">
                  <FileSpreadsheet size={20} />
                </div>

                <div>
                  <strong>Incident Archive</strong>
                  <p>
                    Historical floods and hazard datasets
                  </p>
                </div>

                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================
            RIGHT COLUMN
            ====================================================== */}

        <div className="dash-col-right">
          {/* ----------------------------------------------------
              WEATHER
              ---------------------------------------------------- */}

          {weather && (
            <div className="dashboard-widget-wrapper">
              <WeatherCard weather={weather} />
            </div>
          )}

          {/* ----------------------------------------------------
              ACTIVE WARNINGS
              ---------------------------------------------------- */}

          <div className="dash-card alerts-feed-card">
            <div className="dash-card-header">
              <div className="card-title-group">
                <Radio
                  size={18}
                  className="text-red radar-pulse"
                />

                <div>
                  <h3>Active Early Warnings</h3>

                  <small>
                    {criticalAlerts.length} high-priority
                    {criticalAlerts.length === 1
                      ? " alert"
                      : " alerts"}{" "}
                    active
                  </small>
                </div>
              </div>

              <button
                type="button"
                className="card-action-link"
                onClick={() => goTo("/alerts")}
              >
                All Alerts ({alerts.length})
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="alerts-stack-scroll">
              {alerts.length === 0 ? (
                <div className="empty-state-box">
                  <ShieldCheck
                    size={34}
                    className="text-emerald"
                  />

                  <h4>No Active Warnings</h4>

                  <p>
                    Current monitored stations are reporting
                    within configured warning thresholds.
                  </p>

                  <button
                    type="button"
                    className="empty-state-action"
                    onClick={() => goTo("/monitoring")}
                  >
                    Open Live Monitoring
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <>
                  {alerts.slice(0, 5).map((alert, index) => (
                    <div
                      key={
                        alert?._id ||
                        alert?.id ||
                        `dashboard-alert-${index}`
                      }
                      className="dashboard-alert-wrapper"
                    >
                      <AlertCard alert={alert} />
                    </div>
                  ))}

                  {alerts.length > 5 && (
                    <button
                      type="button"
                      className="view-more-alerts"
                      onClick={() => goTo("/alerts")}
                    >
                      View {alerts.length - 5} more alerts
                      <ArrowRight size={15} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ----------------------------------------------------
              RISK COMMAND SUMMARY
              ---------------------------------------------------- */}

          <div className="dash-card risk-command-summary">
            <div className="dash-card-header">
              <div className="card-title-group">
                <ShieldAlert
                  size={18}
                  className="text-gold"
                />

                <div>
                  <h3>Risk Command Summary</h3>
                  <small>
                    Current AI-derived hazard indicators
                  </small>
                </div>
              </div>
            </div>

            <div className="risk-summary-list">
              <div className="risk-summary-row">
                <div>
                  <span>Overall Hazard Index</span>
                  <strong>{overallRisk}/100</strong>
                </div>

                <div
                  className={`risk-summary-badge ${overallRiskLevel.toLowerCase()}`}
                >
                  {overallRiskLevel}
                </div>
              </div>

              <div className="risk-summary-row">
                <div>
                  <span>Flash Flood Index</span>
                  <strong>{floodRisk}/100</strong>
                </div>

                <div
                  className={`risk-summary-badge ${getRiskLevel(
                    floodRisk
                  ).toLowerCase()}`}
                >
                  {getRiskLevel(floodRisk)}
                </div>
              </div>

              <div className="risk-summary-row">
                <div>
                  <span>Landslide Index</span>
                  <strong>{landslideRisk}/100</strong>
                </div>

                <div
                  className={`risk-summary-badge ${getRiskLevel(
                    landslideRisk
                  ).toLowerCase()}`}
                >
                  {getRiskLevel(landslideRisk)}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="summary-full-view-btn"
              onClick={() => goTo("/risk-map")}
            >
              Open Full Risk Analysis
              <ArrowRight size={15} />
            </button>
          </div>

          {/* ----------------------------------------------------
              SENSOR FLEET STATUS
              ---------------------------------------------------- */}

          <div className="dash-card sensor-fleet-card">
            <div className="dash-card-header">
              <div className="card-title-group">
                <Activity
                  size={18}
                  className="text-cyan"
                />

                <div>
                  <h3>Sensor Fleet Status</h3>
                  <small>
                    Live IoT monitoring infrastructure
                  </small>
                </div>
              </div>

              <button
                type="button"
                className="card-action-link"
                onClick={() => goTo("/admin")}
              >
                Manage Fleet
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="sensor-fleet-stat-grid">
              <div className="sensor-stat">
                <span>Total Nodes</span>
                <strong>{sensors.length}</strong>
              </div>

              <div className="sensor-stat">
                <span>Online</span>
                <strong>{onlineSensors}</strong>
              </div>

              <div className="sensor-stat">
                <span>Offline</span>
                <strong>
                  {Math.max(
                    0,
                    sensors.length - onlineSensors
                  )}
                </strong>
              </div>
            </div>

            <div className="sensor-health-progress">
              <div className="sensor-health-header">
                <span>Fleet Availability</span>
                <strong>{sensorHealth}%</strong>
              </div>

              <div className="sensor-health-track">
                <div
                  className="sensor-health-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, sensorHealth)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          FOOTER STATUS
          ======================================================== */}

      <div className="dashboard-footer-status">
        <div className="dashboard-footer-left">
          <CheckCircle2 size={14} />

          <span>
            FlashGuard AI command services operational
          </span>
        </div>

        <div className="dashboard-footer-right">
          <span>
            Auto-refresh: {REFRESH_INTERVAL / 1000}s
          </span>

          <span className="footer-separator">•</span>

          <span>
            {lastUpdated
              ? `Last sync ${lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}`
              : "Synchronization pending"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;