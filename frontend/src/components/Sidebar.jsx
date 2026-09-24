import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cpu,
  History,
  LayoutDashboard,
  LifeBuoy,
  Map,
  Menu,
  Radio,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Wifi,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";

// ============================================================
// NAVIGATION
// ============================================================

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Command Dashboard",
    description: "System overview",
    icon: LayoutDashboard,
    exact: true,
  },

  {
    to: "/dashboard/monitoring",
    label: "Live IoT Fleet",
    description: "Real-time sensor telemetry",
    icon: Radio,
    badge: "LIVE",
    badgeClass: "badge-pulse-green",
  },

  {
    to: "/dashboard/risk-map",
    label: "GIS Hazard Map",
    description: "Geospatial risk intelligence",
    icon: Map,
  },

  {
    to: "/dashboard/alerts",
    label: "Early Warnings",
    description: "Active disaster alerts",
    icon: AlertTriangle,
    badge: "ACTIVE",
    badgeClass: "badge-danger",
  },

  {
    to: "/dashboard/simulation",
    label: "AI Simulation Lab",
    description: "Predictive scenario analysis",
    icon: Cpu,
    badge: "AI",
    badgeClass: "badge-cyan",
  },

  {
    to: "/dashboard/ai-assistant",
    label: "AI Learning Lab",
    description: "Adaptive training & 4-agent safety",
    icon: BrainCircuit,
    badge: "AGENTIC",
    badgeClass: "badge-cyan",
  },

  {
    to: "/dashboard/history",
    label: "Incident Archive",
    description: "Historical incident records",
    icon: History,
  },

  {
    to: "/dashboard/emergency-hub",
    label: "Emergency & Shelters",
    description: "Response coordination",
    icon: LifeBuoy,
    badge: "24/7",
    badgeClass: "badge-gold",
  },

  {
    to: "/dashboard/admin",
    label: "Mission Control",
    description: "System administration",
    icon: SlidersHorizontal,
    adminOnly: true,
  },
];

// ============================================================
// COMPONENT
// ============================================================

function Sidebar({
  nodeCount = 9,
  totalNodes = 9,
  systemHealth = 98.4,
  activeAlerts = 4,
}) {
  const { user } = useAuth();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(new Date());

  const location = useLocation();

  // ==========================================================
  // ADMIN ACCESS
  // ==========================================================

  const hasAdminAccess = useMemo(() => {
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

    const roles = Array.isArray(
      user?.roles
    )
      ? user.roles.map((role) =>
          String(role)
            .trim()
            .toLowerCase()
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
  }, [user]);

  // ==========================================================
  // VISIBLE NAVIGATION
  // ==========================================================

  const visibleNavItems = useMemo(
    () =>
      NAV_ITEMS.filter(
        (item) =>
          !item.adminOnly ||
          hasAdminAccess
      ),
    [hasAdminAccess]
  );

  // ==========================================================
  // CLOCK
  // ==========================================================

  useEffect(() => {
    const timer = window.setInterval(
      () => {
        setCurrentTime(new Date());
      },
      1000
    );

    return () =>
      window.clearInterval(timer);
  }, []);

  // ==========================================================
  // MOBILE SIDEBAR
  // ==========================================================

  const closeSidebar = () => {
    setMobileOpen(false);
  };

  const toggleSidebar = () => {
    setMobileOpen(
      (previous) => !previous
    );
  };

  useEffect(() => {
    const handleNavbarToggle = () => {
      setMobileOpen(
        (previous) => !previous
      );
    };

    window.addEventListener(
      "app:toggle-sidebar",
      handleNavbarToggle
    );

    return () => {
      window.removeEventListener(
        "app:toggle-sidebar",
        handleNavbarToggle
      );
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
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
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [mobileOpen]);

  // ==========================================================
  // SAFE TELEMETRY
  // ==========================================================

  const safeNodeCount = Math.max(
    0,
    Number.isFinite(Number(nodeCount))
      ? Number(nodeCount)
      : 0
  );

  const safeTotalNodes = Math.max(
    1,
    Number.isFinite(Number(totalNodes))
      ? Number(totalNodes)
      : 1
  );

  const safeHealth = Math.min(
    100,
    Math.max(
      0,
      Number.isFinite(
        Number(systemHealth)
      )
        ? Number(systemHealth)
        : 0
    )
  );

  const safeAlertCount = Math.max(
    0,
    Number.isFinite(Number(activeAlerts))
      ? Number(activeAlerts)
      : 0
  );

  const onlinePercentage = Math.min(
    100,
    Math.round(
      (safeNodeCount /
        safeTotalNodes) *
        100
    )
  );

  // ==========================================================
  // SYSTEM STATE
  // ==========================================================

  const systemState = useMemo(() => {
    if (safeHealth >= 95) {
      return {
        level: "optimal",
        label: "OPTIMAL",
        description:
          "All critical systems operational",
        icon: ShieldCheck,
      };
    }

    if (safeHealth >= 80) {
      return {
        level: "stable",
        label: "STABLE",
        description:
          "System operating within normal range",
        icon: CheckCircle2,
      };
    }

    if (safeHealth >= 60) {
      return {
        level: "warning",
        label: "DEGRADED",
        description:
          "Some services require attention",
        icon: AlertTriangle,
      };
    }

    return {
      level: "critical",
      label: "CRITICAL",
      description:
        "Immediate system attention required",
      icon: AlertTriangle,
    };
  }, [safeHealth]);

  const SystemStateIcon =
    systemState.icon;

  // ==========================================================
  // TIME
  // ==========================================================

  const formattedTime =
    currentTime.toLocaleTimeString(
      "en-IN",
      {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }
    );

  const formattedDate =
    currentTime.toLocaleDateString(
      "en-IN",
      {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  // ==========================================================
  // ACTIVE ROUTE
  // ==========================================================

  const activeItem =
    visibleNavItems.find((item) => {
      if (item.exact) {
        return (
          location.pathname ===
          item.to
        );
      }

      return (
        location.pathname === item.to ||
        location.pathname.startsWith(
          `${item.to}/`
        )
      );
    }) || visibleNavItems[0];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <button
        type="button"
        className="mobile-sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={
          mobileOpen
            ? "Close navigation menu"
            : "Open navigation menu"
        }
        aria-expanded={mobileOpen}
        aria-controls="main-sidebar"
      >
        {mobileOpen ? (
          <X size={21} />
        ) : (
          <Menu size={21} />
        )}

        {!mobileOpen &&
          safeAlertCount > 0 && (
            <span className="mobile-alert-indicator">
              {safeAlertCount > 99
                ? "99+"
                : safeAlertCount}
            </span>
          )}
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-label="Close navigation menu"
          tabIndex={-1}
        />
      )}

      <aside
        id="main-sidebar"
        className={`sidebar ${
          mobileOpen ? "open" : ""
        }`}
        aria-label="Main navigation"
      >
        <div className="sidebar-mobile-header">
          <div className="sidebar-brand-mini">
            <div className="sidebar-brand-icon">
              <Activity size={18} />
            </div>

            <div>
              <strong>GEONEXUS</strong>

              <span>
                COMMAND CENTER
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-context-card">
          <div className="context-indicator">
            <span className="context-live-dot" />

            <span>
              ACTIVE MODULE
            </span>
          </div>

          <strong>
            {activeItem?.label ||
              "Command Dashboard"}
          </strong>

          <small>
            {activeItem?.description ||
              "System overview"}
          </small>
        </div>

        <nav
          className="sidebar-nav-group"
          aria-label="Mission modules"
        >
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">
              MISSION MODULES
            </span>

            <span className="module-count">
              {String(
                visibleNavItems.length
              ).padStart(2, "0")}
            </span>
          </div>

          <div className="sidebar-navigation-list">
            {visibleNavItems.map(
              (item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={closeSidebar}
                    title={
                      item.description
                    }
                    className={({
                      isActive,
                    }) =>
                      [
                        "sidebar-link",
                        isActive
                          ? "active"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }
                  >
                    <span className="sidebar-link-indicator" />

                    <div className="link-content">
                      <div className="nav-icon-wrap">
                        <Icon
                          size={18}
                          strokeWidth={2}
                          className="nav-icon"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="nav-copy">
                        <span className="nav-text">
                          {item.label}
                        </span>

                        <small className="nav-description">
                          {
                            item.description
                          }
                        </small>
                      </div>
                    </div>

                    <div className="nav-link-right">
                      {item.badge && (
                        <span
                          className={[
                            "nav-badge",
                            item.badgeClass ||
                              "",
                          ]
                            .filter(
                              Boolean
                            )
                            .join(" ")}
                        >
                          {item.badge}
                        </span>
                      )}

                      <ChevronRight
                        size={14}
                        className="nav-arrow"
                        aria-hidden="true"
                      />
                    </div>
                  </NavLink>
                );
              }
            )}
          </div>
        </nav>

        <section
          className={`sidebar-footer-card system-state-${systemState.level}`}
          aria-label="System status"
        >
          <div className="system-header">
            <div className="system-title">
              <SystemStateIcon size={17} />

              <span>
                SYSTEM STATUS
              </span>
            </div>

            <span className="system-state-label">
              {systemState.label}
            </span>
          </div>

          <p className="system-description">
            {systemState.description}
          </p>

          <div className="system-metrics">
            <div className="system-metric">
              <div>
                <span>
                  Sensor Network
                </span>

                <strong>
                  {onlinePercentage}%
                </strong>
              </div>

              <div className="system-progress">
                <span
                  style={{
                    width: `${onlinePercentage}%`,
                  }}
                />
              </div>
            </div>

            <div className="system-metric">
              <div>
                <span>
                  System Health
                </span>

                <strong>
                  {safeHealth.toFixed(
                    1
                  )}
                  %
                </strong>
              </div>

              <div className="system-progress">
                <span
                  style={{
                    width: `${safeHealth}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="system-footer-row">
            <span>
              <Server size={12} />

              {safeNodeCount}/
              {safeTotalNodes} nodes
            </span>

            <span>
              <AlertTriangle size={12} />

              {safeAlertCount} alerts
            </span>
          </div>
        </section>

        <footer className="sidebar-footer">
          <div className="sidebar-time">
            <Clock3 size={13} />

            <span>
              {formattedTime}
            </span>
          </div>

          <div className="sidebar-date">
            {formattedDate}
            {" • "}
            IST
          </div>

          <div className="sidebar-connection">
            <Wifi size={12} />

            <span>
              Secure telemetry
            </span>

            <span className="connection-dot" />
          </div>
        </footer>
      </aside>
    </>
  );
}

export default Sidebar;