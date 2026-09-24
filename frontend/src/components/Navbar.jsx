import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Activity,
  Bell,
  Bot,
  BrainCircuit,
  ChevronDown,
  Clock3,
  FileText,
  History,
  LifeBuoy,
  LogOut,
  Map,
  Menu,
  Moon,
  Radio,
  RefreshCw,
  Settings,
  Shield,
  Siren,
  Sun,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

import { getAlerts } from "../services/api.js";

import SOSModal from "./SOSModal.jsx";
import SituationReportModal from "./SituationReportModal.jsx";

const ALERT_REFRESH_INTERVAL = 30_000;
const MAX_NOTIFICATION_ITEMS = 5;
const EMPTY_ALERTS = Object.freeze([]);

const DEFAULT_RISK_DATA = {
  riskLevel: "HIGH",
  overallRisk: 72,
  floodRisk: 68,
  landslideRisk: 76,
  leadTime: "2–6 hours",
};

const DASHBOARD_NAVIGATION = Object.freeze([
  {
    id: "dashboard",
    label: "Command Center",
    shortLabel: "Dashboard",
    path: "/dashboard",
    icon: Activity,
    description: "Operational command dashboard",
  },
  {
    id: "monitoring",
    label: "Live Monitoring",
    shortLabel: "Monitoring",
    path: "/dashboard/monitoring",
    icon: Radio,
    description: "Real-time IoT telemetry",
  },
  {
    id: "risk-map",
    label: "Risk Intelligence",
    shortLabel: "Risk Map",
    path: "/dashboard/risk-map",
    icon: Map,
    description: "Geospatial hazard intelligence",
  },
  {
    id: "alerts",
    label: "Alert Center",
    shortLabel: "Alerts",
    path: "/dashboard/alerts",
    icon: Bell,
    description: "Active disaster warnings",
  },
  {
    id: "simulation",
    label: "Simulation Lab",
    shortLabel: "Simulation",
    path: "/dashboard/simulation",
    icon: Bot,
    description: "AI scenario modelling",
  },
  {
    id: "ai-assistant",
    label: "AI Learning Lab",
    shortLabel: "AI Lab",
    path: "/dashboard/ai-assistant",
    icon: BrainCircuit,
    description: "Adaptive training & 4-agent safety",
  },
  {
    id: "history",
    label: "Historical Data",
    shortLabel: "History",
    path: "/dashboard/history",
    icon: History,
    description: "Incident archive and analytics",
  },
  {
    id: "emergency-hub",
    label: "Emergency Hub",
    shortLabel: "Emergency",
    path: "/dashboard/emergency-hub",
    icon: LifeBuoy,
    description: "Emergency response coordination",
  },
  {
    id: "admin",
    label: "Administration",
    shortLabel: "Admin",
    path: "/dashboard/admin",
    icon: Settings,
    description: "Sensor and system administration",
    adminOnly: true,
  },
]);

function extractAlerts(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.alerts)) {
    return response.data.alerts;
  }

  if (Array.isArray(response?.data?.results)) {
    return response.data.results;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

function normalizeSeverity(alert) {
  const severity = String(
    alert?.level ??
      alert?.severity ??
      alert?.riskLevel ??
      alert?.priority ??
      "low"
  )
    .trim()
    .toLowerCase();

  if (
    ["critical", "urgent", "emergency"].includes(
      severity
    )
  ) {
    return "critical";
  }

  if (
    ["high", "major"].includes(severity)
  ) {
    return "high";
  }

  if (
    ["medium", "moderate"].includes(severity)
  ) {
    return "medium";
  }

  return "low";
}

function getAlertTitle(alert) {
  return (
    alert?.title ||
    alert?.type ||
    alert?.eventType ||
    alert?.hazard ||
    "Disaster Alert"
  );
}

function getAlertLocation(alert) {
  return (
    alert?.location ||
    alert?.area ||
    alert?.district ||
    alert?.region ||
    alert?.message ||
    "Active monitoring event"
  );
}

function getAlertId(alert, index) {
  return (
    alert?._id ||
    alert?.id ||
    alert?.alertId ||
    `navbar-alert-${index}`
  );
}

function isAdminUser(user) {
  if (!user) {
    return false;
  }

  const primaryRole = String(
    user?.role ||
      user?.userRole ||
      user?.accountType ||
      ""
  )
    .trim()
    .toLowerCase();

  const roles = Array.isArray(user?.roles)
    ? user.roles.map((role) =>
        String(role).trim().toLowerCase()
      )
    : [];

  const adminRoles = [
    "admin",
    "administrator",
    "superadmin",
    "super-admin",
    "super_admin",
    "system_admin",
  ];

  return (
    adminRoles.includes(primaryRole) ||
    roles.some((role) =>
      adminRoles.includes(role)
    ) ||
    user?.isAdmin === true
  );
}

function Navbar({
  toggleMobileSidebar,
  alerts: externalAlerts = EMPTY_ALERTS,
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  const [currentTime, setCurrentTime] = useState(
    new Date()
  );

  const [alerts, setAlerts] = useState(
    Array.isArray(externalAlerts)
      ? externalAlerts
      : EMPTY_ALERTS
  );

  const [alertsLoading, setAlertsLoading] =
    useState(false);

  const [lastAlertSync, setLastAlertSync] =
    useState(null);

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined"
      ? navigator.onLine
      : true
  );

  const [isSOSOpen, setIsSOSOpen] =
    useState(false);

  const [isSitrepOpen, setIsSitrepOpen] =
    useState(false);

  const [isNotificationOpen, setIsNotificationOpen] =
    useState(false);

  const [isUserMenuOpen, setIsUserMenuOpen] =
    useState(false);

  const [isNavigationOpen, setIsNavigationOpen] =
    useState(false);

  const navbarRef = useRef(null);
  const mountedRef = useRef(true);
  const alertRefreshTimerRef = useRef(null);

  const hasAdminAccess = useMemo(
    () => isAdminUser(user),
    [user]
  );

  const visibleNavigation = useMemo(
    () =>
      DASHBOARD_NAVIGATION.filter(
        (item) =>
          !item.adminOnly || hasAdminAccess
      ),
    [hasAdminAccess]
  );

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date());
    };

    updateClock();

    const timer = window.setInterval(
      updateClock,
      1000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);

      addToast?.({
        title: "Command Network Online",
        message:
          "Command network connection restored.",
        type: "success",
        duration: 3500,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);

      addToast?.({
        title: "Command Network Offline",
        message:
          "Live telemetry may become stale until network connectivity is restored.",
        type: "warning",
        duration: 5000,
      });
    };

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );
    };
  }, [addToast]);

  useEffect(() => {
    const handleNetworkStatus = (event) => {
      const online = Boolean(
        event?.detail?.online
      );

      setIsOnline(online);
    };

    window.addEventListener(
      "app:network-status",
      handleNetworkStatus
    );

    return () => {
      window.removeEventListener(
        "app:network-status",
        handleNetworkStatus
      );
    };
  }, []);

  const synchronizeAlerts = useCallback(
    async (manual = false) => {
      if (
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        return;
      }

      if (manual) {
        setAlertsLoading(true);
      }

      try {
        const response = await getAlerts();

        if (!mountedRef.current) {
          return;
        }

        const incomingAlerts =
          extractAlerts(response);

        setAlerts(incomingAlerts);
        setLastAlertSync(new Date());

        if (manual) {
          addToast?.({
            title: "Alert Center Updated",
            message:
              "Alert intelligence synchronized successfully.",
            type: "success",
            duration: 3500,
          });
        }
      } catch (error) {
        console.error(
          "Navbar alert synchronization failed:",
          error
        );

        if (
          mountedRef.current &&
          manual
        ) {
          addToast?.({
            title: "Alert Sync Failed",
            message:
              "Unable to synchronize alerts. Existing alert information has been retained.",
            type: "error",
            duration: 5000,
          });
        }
      } finally {
        if (mountedRef.current) {
          setAlertsLoading(false);
        }
      }
    },
    [addToast]
  );

  useEffect(() => {
    if (!Array.isArray(externalAlerts)) {
      return;
    }

    setAlerts((previousAlerts) => {
      if (
        previousAlerts.length ===
          externalAlerts.length &&
        previousAlerts.every(
          (alert, index) =>
            alert === externalAlerts[index]
        )
      ) {
        return previousAlerts;
      }

      return externalAlerts;
    });
  }, [externalAlerts]);

  useEffect(() => {
    mountedRef.current = true;

    synchronizeAlerts(false);

    alertRefreshTimerRef.current =
      window.setInterval(
        () => {
          synchronizeAlerts(false);
        },
        ALERT_REFRESH_INTERVAL
      );

    return () => {
      mountedRef.current = false;

      if (alertRefreshTimerRef.current) {
        window.clearInterval(
          alertRefreshTimerRef.current
        );

        alertRefreshTimerRef.current = null;
      }
    };
  }, [synchronizeAlerts]);

  const alertStats = useMemo(() => {
    const stats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      priority: 0,
      total: alerts.length,
    };

    alerts.forEach((alert) => {
      const severity =
        normalizeSeverity(alert);

      if (severity in stats) {
        stats[severity] += 1;
      }
    });

    stats.priority =
      stats.critical + stats.high;

    return stats;
  }, [alerts]);

  const sitrepData = useMemo(() => {
    let riskLevel = "MODERATE";

    if (alertStats.critical > 0) {
      riskLevel = "CRITICAL";
    } else if (alertStats.high > 0) {
      riskLevel = "HIGH";
    }

    return {
      ...DEFAULT_RISK_DATA,
      riskLevel,
      alerts,
    };
  }, [
    alerts,
    alertStats.critical,
    alertStats.high,
  ]);

  const formattedTime = useMemo(
    () =>
      currentTime.toLocaleTimeString(
        "en-IN",
        {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      ),
    [currentTime]
  );

  const formattedDate = useMemo(
    () =>
      currentTime.toLocaleDateString(
        "en-IN",
        {
          timeZone: "Asia/Kolkata",
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      ),
    [currentTime]
  );

  const userName =
    typeof user?.name === "string" &&
    user.name.trim()
      ? user.name.trim()
      : "Operator";

  const userInitial = userName
    .charAt(0)
    .toUpperCase();

  const userRole =
    typeof user?.role === "string" &&
    user.role.trim()
      ? user.role.trim()
      : "operator";

  const isRouteActive = useCallback(
    (path) => {
      if (location.pathname === path) {
        return true;
      }

      if (
        path !== "/dashboard" &&
        location.pathname.startsWith(
          `${path}/`
        )
      ) {
        return true;
      }

      return false;
    },
    [location.pathname]
  );

  const closeAllMenus = useCallback(() => {
    setIsNotificationOpen(false);
    setIsUserMenuOpen(false);
    setIsNavigationOpen(false);
  }, []);

  const navigateTo = useCallback(
    (path) => {
      if (!path) {
        return;
      }

      closeAllMenus();
      navigate(path);
    },
    [closeAllMenus, navigate]
  );

  const openDashboard = useCallback(() => {
    navigateTo("/dashboard");
  }, [navigateTo]);

  const openAlerts = useCallback(() => {
    navigateTo("/dashboard/alerts");
  }, [navigateTo]);

  const handleLogout = useCallback(() => {
    closeAllMenus();

    try {
      logout();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    }

    navigate("/login", {
      replace: true,
    });
  }, [
    closeAllMenus,
    logout,
    navigate,
  ]);

  const handleMobileMenu = useCallback(() => {
    if (
      typeof toggleMobileSidebar ===
      "function"
    ) {
      toggleMobileSidebar();
      return;
    }

    window.dispatchEvent(
      new CustomEvent("app:toggle-sidebar")
    );
  }, [toggleMobileSidebar]);

  useEffect(() => {
    const handleSidebarState = () => {
      setIsNavigationOpen(
        (previous) => !previous
      );
    };

    window.addEventListener(
      "app:toggle-sidebar",
      handleSidebarState
    );

    return () => {
      window.removeEventListener(
        "app:toggle-sidebar",
        handleSidebarState
      );
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeAllMenus();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [closeAllMenus]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(
          event.target
        )
      ) {
        setIsNotificationOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );
    };
  }, []);

  return (
    <>
      <header
        ref={navbarRef}
        className={`navbar ${
          theme === "dark"
            ? "navbar-dark"
            : "navbar-light"
        }`}
      >
        <div className="navbar-left">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={handleMobileMenu}
            aria-label="Open navigation menu"
          >
            <Menu
              size={20}
              strokeWidth={2.2}
            />
          </button>

          <button
            type="button"
            className="brand-wrap"
            onClick={openDashboard}
            aria-label="Go to Disaster Command dashboard"
          >
            <div className="brand-icon-box">
              <Shield
                size={22}
                className="brand-shield"
                strokeWidth={2.2}
              />

              <span className="brand-icon-status" />
            </div>

            <div className="brand-text">
              <h2>DISASTER COMMAND</h2>

              <span className="brand-subtitle">
                Early Warning &amp;
                Telemetry System
              </span>
            </div>
          </button>

          <div
            className={`live-status-pill ${
              isOnline
                ? "system-online"
                : "system-offline"
            }`}
          >
            <span className="live-pulse-wrapper">
              <span className="live-pulse-dot" />
            </span>

            <span className="live-status-text">
              {isOnline
                ? "SYSTEM ONLINE"
                : "OFFLINE"}
            </span>

            {isOnline ? (
              <Wifi size={13} />
            ) : (
              <WifiOff size={13} />
            )}
          </div>
        </div>

        <div className="navbar-center">
          <div
            className="command-clock"
            title="Indian Standard Time"
          >
            <div className="clock-icon">
              <Clock3 size={15} />
            </div>

            <div className="clock-content">
              <strong>
                {formattedTime}
              </strong>

              <span>
                {formattedDate}
                {" • "}
                IST
              </span>
            </div>
          </div>

          <div className="telemetry-status">
            <span className="telemetry-dot" />
            <Activity size={13} />
            <span>LIVE TELEMETRY</span>
          </div>
        </div>

        <div className="navbar-right">
          <div className="navbar-quick-nav">
            {visibleNavigation.map(
              (item) => {
                const Icon = item.icon;
                const active =
                  isRouteActive(
                    item.path
                  );

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`navbar-quick-nav-btn ${
                      active
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      navigateTo(
                        item.path
                      )
                    }
                    aria-label={
                      item.label
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                  >
                    <Icon size={16} />

                    <span>
                      {
                        item.shortLabel
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>

          <button
            type="button"
            className="nav-action-btn sos-btn"
            onClick={() =>
              setIsSOSOpen(true)
            }
          >
            <span className="sos-icon-wrapper">
              <Siren
                size={17}
                className="siren-shake"
                strokeWidth={2.4}
              />
            </span>

            <span className="btn-label">
              SOS Broadcast
            </span>
          </button>

          <button
            type="button"
            className="nav-action-btn sitrep-btn"
            onClick={() =>
              setIsSitrepOpen(true)
            }
          >
            <FileText
              size={16}
              strokeWidth={2.2}
            />

            <span className="btn-label">
              SITREP
            </span>
          </button>

          <button
            type="button"
            className="nav-icon-btn ai-quick-btn"
            onClick={() => navigate("/dashboard/ai-assistant")}
            title="AI Learning & Emergency Multi-Agent Studio"
            aria-label="Open AI Assistant"
            style={{
              color: "var(--primary, #06b6d4)",
              position: "relative",
            }}
          >
            <BrainCircuit size={18} />
            <span
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--primary, #06b6d4)",
                boxShadow: "0 0 6px var(--primary, #06b6d4)",
              }}
            />
          </button>

          <button
            type="button"
            className="nav-icon-btn theme-toggle-btn"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun
                size={18}
                className="theme-icon sun"
              />
            ) : (
              <Moon
                size={18}
                className="theme-icon moon"
              />
            )}
          </button>

          <div className="navbar-dropdown-wrapper">
            <button
              type="button"
              className={`nav-icon-btn alert-bell-btn ${
                alertStats.priority > 0
                  ? "has-alerts"
                  : ""
              }`}
              onClick={() =>
                setIsNotificationOpen(
                  (previous) =>
                    !previous
                )
              }
              aria-expanded={
                isNotificationOpen
              }
            >
              {alertsLoading ? (
                <RefreshCw
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Bell
                  size={18}
                  strokeWidth={2.2}
                />
              )}

              {alertStats.priority > 0 && (
                <span className="bell-badge">
                  {alertStats.priority > 99
                    ? "99+"
                    : alertStats.priority}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div
                className="navbar-dropdown notification-dropdown"
                role="dialog"
              >
                <div className="dropdown-header">
                  <div>
                    <strong>
                      Alert Center
                    </strong>

                    <span>
                      Real-time disaster
                      warnings
                    </span>
                  </div>

                  <div className="dropdown-header-actions">
                    <button
                      type="button"
                      className="dropdown-refresh-btn"
                      onClick={() =>
                        synchronizeAlerts(
                          true
                        )
                      }
                      disabled={alertsLoading}
                    >
                      <RefreshCw
                        size={15}
                        className={
                          alertsLoading
                            ? "animate-spin"
                            : ""
                        }
                      />
                    </button>

                    <button
                      type="button"
                      className="dropdown-close-btn"
                      onClick={() =>
                        setIsNotificationOpen(
                          false
                        )
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="alert-summary-grid">
                  <div className="alert-summary critical">
                    <strong>
                      {
                        alertStats.critical
                      }
                    </strong>
                    <span>Critical</span>
                  </div>

                  <div className="alert-summary high">
                    <strong>
                      {alertStats.high}
                    </strong>
                    <span>High</span>
                  </div>

                  <div className="alert-summary medium">
                    <strong>
                      {alertStats.medium}
                    </strong>
                    <span>Medium</span>
                  </div>
                </div>

                <div className="notification-body">
                  {alerts.length === 0 ? (
                    <div className="empty-alert-state">
                      <Radio size={24} />

                      <strong>
                        No active alerts
                      </strong>

                      <span>
                        Monitoring systems
                        are currently
                        stable.
                      </span>
                    </div>
                  ) : (
                    alerts
                      .slice(
                        0,
                        MAX_NOTIFICATION_ITEMS
                      )
                      .map(
                        (
                          alert,
                          index
                        ) => {
                          const severity =
                            normalizeSeverity(
                              alert
                            );

                          return (
                            <button
                              type="button"
                              className="notification-item"
                              key={getAlertId(
                                alert,
                                index
                              )}
                              onClick={
                                openAlerts
                              }
                            >
                              <span
                                className={`notification-severity ${severity}`}
                              />

                              <div className="notification-content">
                                <strong>
                                  {getAlertTitle(
                                    alert
                                  )}
                                </strong>

                                <span>
                                  {getAlertLocation(
                                    alert
                                  )}
                                </span>
                              </div>

                              <span className="notification-arrow">
                                →
                              </span>
                            </button>
                          );
                        }
                      )
                  )}
                </div>

                <div className="notification-footer">
                  <span>
                    {lastAlertSync
                      ? `Synced ${lastAlertSync.toLocaleTimeString(
                          "en-IN",
                          {
                            hour: "2-digit",
                            minute:
                              "2-digit",
                            second:
                              "2-digit",
                          }
                        )}`
                      : "Synchronization pending"}
                  </span>

                  <button
                    type="button"
                    className="view-all-alerts-btn"
                    onClick={
                      openAlerts
                    }
                  >
                    View All Alerts
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {user && (
            <div className="navbar-dropdown-wrapper user-wrapper">
              <button
                type="button"
                className={`user-profile-chip ${
                  isUserMenuOpen
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setIsUserMenuOpen(
                    (previous) =>
                      !previous
                  )
                }
                aria-expanded={
                  isUserMenuOpen
                }
              >
                <div className="user-avatar">
                  {userInitial}
                  <span className="user-online-indicator" />
                </div>

                <div className="user-details">
                  <strong className="user-name">
                    {userName}
                  </strong>

                  <span
                    className={`role-badge ${userRole
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        "-"
                      )}`}
                  >
                    {userRole.toUpperCase()}
                  </span>
                </div>

                <ChevronDown
                  size={15}
                  className={`user-chevron ${
                    isUserMenuOpen
                      ? "rotate"
                      : ""
                  }`}
                />
              </button>

              {isUserMenuOpen && (
                <div
                  className="navbar-dropdown user-dropdown"
                  role="menu"
                >
                  <div className="user-dropdown-header">
                    <div className="large-user-avatar">
                      {userInitial}
                    </div>

                    <div>
                      <strong>
                        {userName}
                      </strong>

                      <span>
                        {userRole.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="user-system-status">
                    <span
                      className={`status-indicator ${
                        isOnline
                          ? "online"
                          : "offline"
                      }`}
                    />

                    <span>
                      {isOnline
                        ? "Command network connected"
                        : "Network disconnected"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={
                      openDashboard
                    }
                    role="menuitem"
                  >
                    <Activity size={16} />
                    Command Dashboard
                  </button>

                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() =>
                      navigateTo(
                        "/dashboard/monitoring"
                      )
                    }
                    role="menuitem"
                  >
                    <Radio size={16} />
                    Live Monitoring
                  </button>

                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() =>
                      navigateTo(
                        "/dashboard/risk-map"
                      )
                    }
                    role="menuitem"
                  >
                    <Map size={16} />
                    Risk Intelligence
                  </button>

                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={openAlerts}
                    role="menuitem"
                  >
                    <Bell size={16} />
                    Alert Center

                    {alertStats.priority >
                      0 && (
                      <span className="user-menu-alert-count">
                        {
                          alertStats.priority
                        }
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() =>
                      navigateTo(
                        "/dashboard/simulation"
                      )
                    }
                    role="menuitem"
                  >
                    <Bot size={16} />
                    Simulation Lab
                  </button>

                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() =>
                      navigateTo(
                        "/dashboard/history"
                      )
                    }
                    role="menuitem"
                  >
                    <History size={16} />
                    Historical Data
                  </button>

                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() =>
                      navigateTo(
                        "/dashboard/emergency-hub"
                      )
                    }
                    role="menuitem"
                  >
                    <LifeBuoy size={16} />
                    Emergency Hub
                  </button>

                  {hasAdminAccess && (
                    <button
                      type="button"
                      className="user-menu-item"
                      onClick={() =>
                        navigateTo(
                          "/dashboard/admin"
                        )
                      }
                      role="menuitem"
                    >
                      <Settings size={16} />
                      Administration
                    </button>
                  )}

                  <div className="user-menu-divider" />

                  <button
                    type="button"
                    className="user-menu-item logout-menu-item"
                    onClick={
                      handleLogout
                    }
                    role="menuitem"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isNavigationOpen && (
          <div className="navbar-mobile-navigation">
            <div className="mobile-navigation-header">
              <div>
                <strong>
                  Command Modules
                </strong>

                <span>
                  GeoNexus Operations
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsNavigationOpen(false)
                }
                aria-label="Close navigation menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav
              className="mobile-navigation-list"
              aria-label="Dashboard navigation"
            >
              {visibleNavigation.map(
                (item) => {
                  const Icon = item.icon;
                  const active =
                    isRouteActive(
                      item.path
                    );

                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      className={`mobile-nav-item ${
                        active
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setIsNavigationOpen(
                          false
                        )
                      }
                      aria-current={
                        active
                          ? "page"
                          : undefined
                      }
                    >
                      <span className="mobile-nav-icon">
                        <Icon size={18} />
                      </span>

                      <span className="mobile-nav-copy">
                        <strong>
                          {item.label}
                        </strong>

                        <small>
                          {
                            item.description
                          }
                        </small>
                      </span>

                      {active && (
                        <span className="mobile-nav-active-dot" />
                      )}
                    </NavLink>
                  );
                }
              )}
            </nav>

            <div className="mobile-navigation-status">
              <div>
                <span
                  className={`mobile-status-dot ${
                    isOnline
                      ? "online"
                      : "offline"
                  }`}
                />

                <span>
                  {isOnline
                    ? "Command network operational"
                    : "Network connection unavailable"}
                </span>
              </div>

              <span>
                {alertStats.priority}{" "}
                priority warnings
              </span>
            </div>
          </div>
        )}
      </header>

      <SOSModal
        isOpen={isSOSOpen}
        onClose={() =>
          setIsSOSOpen(false)
        }
      />

      <SituationReportModal
        isOpen={isSitrepOpen}
        onClose={() =>
          setIsSitrepOpen(false)
        }
        data={sitrepData}
      />
    </>
  );
}

export default Navbar;