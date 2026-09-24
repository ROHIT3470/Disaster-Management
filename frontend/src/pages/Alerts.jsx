import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AlertCard from "../components/AlertCard";
import Loading from "../components/Loading";
import { getAlerts } from "../services/api";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Radio,
  RefreshCw,
  Siren,
  ShieldAlert,
  ShieldCheck,
  Volume2,
  VolumeX,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import {
  playEmergencySiren,
  stopEmergencySiren,
} from "../utils/audioAlert";
import { useToast } from "../context/ToastContext";
import SOSModal from "../components/SOSModal";

const AUTO_REFRESH_INTERVAL = 30000;

const FILTERS = [
  {
    key: "all",
    label: "All Warnings",
    icon: Bell,
  },
  {
    key: "critical",
    label: "Critical",
    icon: ShieldAlert,
  },
  {
    key: "high",
    label: "High",
    icon: AlertTriangle,
  },
  {
    key: "moderate",
    label: "Moderate",
    icon: Clock3,
  },
];

function Alerts() {
  const { addToast, success, warning, error: toastError } = useToast();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set());

  const sirenTimeoutRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const loadAlerts = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await getAlerts();

        const incomingAlerts = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.alerts)
            ? response.data.alerts
            : [];

        setAlerts(incomingAlerts);
        setLastUpdated(new Date());

        if (manual) {
          success?.("Alert intelligence synchronized successfully.", {
            title: "Alert Feed Updated",
          });
        }
      } catch (err) {
        console.error("Alert feed error:", err);

        toastError?.(
          err?.response?.data?.message ||
            "Unable to retrieve the active early-warning feed.",
          {
            title: "Alert Feed Unavailable",
          }
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [success, toastError]
  );

  useEffect(() => {
    loadAlerts();

    refreshIntervalRef.current = setInterval(() => {
      loadAlerts();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      if (sirenTimeoutRef.current) {
        clearTimeout(sirenTimeoutRef.current);
      }

      try {
        stopEmergencySiren();
      } catch (err) {
        console.warn("Unable to stop emergency siren:", err);
      }
    };
  }, [loadAlerts]);

  const normalizeLevel = useCallback((level) => {
    return String(level || "Moderate").toLowerCase();
  }, []);

  const alertStats = useMemo(() => {
    const stats = {
      total: alerts.length,
      critical: 0,
      high: 0,
      moderate: 0,
      acknowledged: acknowledgedAlerts.size,
    };

    alerts.forEach((alert) => {
      const level = normalizeLevel(alert.level);

      if (level === "critical") stats.critical += 1;
      else if (level === "high") stats.high += 1;
      else if (level === "moderate") stats.moderate += 1;
    });

    return stats;
  }, [alerts, acknowledgedAlerts, normalizeLevel]);

  const filteredAlerts = useMemo(() => {
    if (selectedFilter === "all") {
      return alerts;
    }

    return alerts.filter(
      (alert) => normalizeLevel(alert.level) === selectedFilter
    );
  }, [alerts, selectedFilter, normalizeLevel]);

  const handleAcknowledge = useCallback(
    (alert) => {
      const alertId = alert?._id || alert?.id;

      if (!alertId) return;

      setAcknowledgedAlerts((previous) => {
        const next = new Set(previous);
        next.add(alertId);
        return next;
      });

      success?.(
        `${alert.title || "Alert"} has been acknowledged by the command center.`,
        {
          title: "Alert Acknowledged",
        }
      );
    },
    [success]
  );

  const toggleSirenTest = useCallback(() => {
    if (sirenPlaying) {
      try {
        stopEmergencySiren();
      } catch (err) {
        console.warn("Siren stop failed:", err);
      }

      if (sirenTimeoutRef.current) {
        clearTimeout(sirenTimeoutRef.current);
        sirenTimeoutRef.current = null;
      }

      setSirenPlaying(false);

      addToast({
        title: "Acoustic Siren Test Stopped",
        message: "The synthetic evacuation siren test has been terminated.",
        type: "info",
      });

      return;
    }

    try {
      playEmergencySiren(6);
      setSirenPlaying(true);

      warning?.(
        "A 6-second synthetic evacuation siren is being played for system verification.",
        {
          title: "Acoustic Siren Test Triggered",
          duration: 6000,
        }
      );

      sirenTimeoutRef.current = setTimeout(() => {
        try {
          stopEmergencySiren();
        } catch (err) {
          console.warn("Automatic siren stop failed:", err);
        }

        setSirenPlaying(false);
        sirenTimeoutRef.current = null;
      }, 6000);
    } catch (err) {
      console.error("Siren test failed:", err);

      setSirenPlaying(false);

      toastError?.(
        "The emergency audio subsystem could not start the siren test.",
        {
          title: "Siren Test Failed",
        }
      );
    }
  }, [addToast, sirenPlaying, toastError, warning]);

  const handleEmergencyBroadcast = useCallback(() => {
    if (alertStats.critical > 0) {
      warning?.(
        "Critical alerts are already active. Verify the affected zones before issuing an additional emergency broadcast.",
        {
          title: "Critical Alerts Active",
        }
      );
    }

    setIsSOSOpen(true);
  }, [alertStats.critical, warning]);

  const handleFilterChange = useCallback((filter) => {
    setSelectedFilter(filter);
  }, []);

  if (loading) {
    return (
      <Loading message="Retrieving Active Early Warning Advisories..." />
    );
  }

  return (
    <div className="alerts-page animate-fade-in">
      <div className="page-header-pro">
        <div className="header-left">
          <div className="header-icon-box danger">
            <AlertTriangle size={24} className="text-red" />
          </div>

          <div>
            <div className="page-eyebrow">
              <Radio size={13} />
              LIVE EARLY-WARNING NETWORK
            </div>

            <h1>Early Warnings & Active Alerts</h1>

            <p>
              High-priority advisories, evacuation notices and emergency
              broadcast operations across the disaster monitoring grid.
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadAlerts(true)}
            disabled={refreshing}
            title="Synchronize alert feed"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Synchronizing..." : "Refresh Feed"}
          </button>

          <button
            type="button"
            className={`btn-siren-tester ${
              sirenPlaying ? "active" : ""
            }`}
            onClick={toggleSirenTest}
          >
            {sirenPlaying ? (
              <>
                <VolumeX size={16} />
                Stop Siren Test
              </>
            ) : (
              <>
                <Volume2 size={16} />
                Test Audio Siren
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-danger-glow"
            onClick={handleEmergencyBroadcast}
          >
            <Siren size={16} />
            Broadcast Emergency Alert
          </button>
        </div>
      </div>

      <div className="alert-command-status">
        <div className="command-status-live">
          <span className="live-indicator" />
          <strong>LIVE ALERT FEED</strong>
          <span>Automatic synchronization every 30 seconds</span>
        </div>

        <div className="command-status-time">
          <Clock3 size={14} />
          Last update:{" "}
          {lastUpdated
            ? lastUpdated.toLocaleTimeString()
            : "Synchronizing..."}
        </div>
      </div>

      <div className="alert-statistics-grid">
        <div className="alert-stat-card total">
          <div className="alert-stat-icon">
            <Bell size={20} />
          </div>

          <div>
            <span>Total Active</span>
            <strong>{alertStats.total}</strong>
            <small>Current warning events</small>
          </div>
        </div>

        <div className="alert-stat-card critical">
          <div className="alert-stat-icon">
            <ShieldAlert size={20} />
          </div>

          <div>
            <span>Critical</span>
            <strong>{alertStats.critical}</strong>
            <small>Immediate response required</small>
          </div>
        </div>

        <div className="alert-stat-card high">
          <div className="alert-stat-icon">
            <AlertTriangle size={20} />
          </div>

          <div>
            <span>High Priority</span>
            <strong>{alertStats.high}</strong>
            <small>Rapid assessment required</small>
          </div>
        </div>

        <div className="alert-stat-card moderate">
          <div className="alert-stat-icon">
            <ActivityIcon />
          </div>

          <div>
            <span>Moderate</span>
            <strong>{alertStats.moderate}</strong>
            <small>Continuous monitoring</small>
          </div>
        </div>
      </div>

      <div className="alert-control-panel">
        <div className="alert-control-heading">
          <Filter size={17} />
          <div>
            <strong>Alert Severity Filter</strong>
            <span>Filter active warnings by operational priority</span>
          </div>
        </div>

        <div className="alert-tab-bar">
          {FILTERS.map((filter) => {
            const Icon = filter.icon;

            const count =
              filter.key === "all"
                ? alertStats.total
                : alertStats[filter.key] || 0;

            return (
              <button
                key={filter.key}
                type="button"
                className={`alert-tab-btn ${filter.key} ${
                  selectedFilter === filter.key ? "active" : ""
                }`}
                onClick={() => handleFilterChange(filter.key)}
                aria-pressed={selectedFilter === filter.key}
              >
                <Icon size={15} />
                {filter.label}
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="alerts-grid-pro">
        {filteredAlerts.length === 0 ? (
          <div className="empty-state-full">
            <div className="empty-state-icon">
              <ShieldCheck size={42} />
            </div>

            <h3>
              {alerts.length === 0
                ? "No Active Warnings"
                : "No Warnings In This Category"}
            </h3>

            <p>
              {alerts.length === 0
                ? "All monitored telemetry stations are currently reporting nominal environmental conditions."
                : "No active alerts match the selected severity filter."}
            </p>

            {alerts.length === 0 && (
              <div className="empty-state-status">
                <CheckCircle2 size={15} />
                Monitoring network operational
              </div>
            )}
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const alertId = alert?._id || alert?.id;
            const acknowledged = acknowledgedAlerts.has(alertId);

            return (
              <div
                key={alertId || `${alert.level}-${alert.timestamp}`}
                className={`alert-item-wrapper ${
                  acknowledged ? "acknowledged" : ""
                }`}
              >
                {acknowledged && (
                  <div className="acknowledged-banner">
                    <CheckCircle2 size={13} />
                    Acknowledged by Command Center
                  </div>
                )}

                <AlertCard
                  alert={alert}
                  onAcknowledge={() => handleAcknowledge(alert)}
                />
              </div>
            );
          })
        )}
      </div>

      <div className="alert-system-footer">
        <div>
          <Wifi size={14} />
          <span>Telemetry Network Connected</span>
        </div>

        <div>
          <Zap size={14} />
          <span>Early Warning Engine Active</span>
        </div>

        <div>
          <ShieldCheck size={14} />
          <span>Command Center Protected</span>
        </div>

        <div>
          <Clock3 size={14} />
          <span>Auto-refresh: 30s</span>
        </div>
      </div>

      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
      />
    </div>
  );
}

function ActivityIcon() {
  return <Zap size={20} />;
}

export default Alerts;