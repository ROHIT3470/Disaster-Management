/**
 * ============================================================
 * GEONEXUS
 * APPLICATION ROUTER & ROOT COMPONENT
 * ============================================================
 *
 * File:
 * frontend/src/App.jsx
 *
 * Responsibilities:
 * - Application providers
 * - Routing
 * - Authentication guards
 * - Admin authorization
 * - Dashboard layout
 * - Page metadata
 * - Network status
 * - Legacy route redirects
 * ============================================================
 */

import React, {
  useEffect,
  useState,
} from "react";

import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router-dom";

import {
  AnimatePresence,
  motion,
} from "motion/react";

/* ============================================================
   GLOBAL COMPONENTS
   ============================================================ */

import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ToastContainer from "./components/ToastContainer.jsx";
import { animatePageEntrance } from "./utils/anime.js";

/* ============================================================
   MODALS
   ============================================================ */

import SOSModal from "./components/SOSModal.jsx";
import SituationReportModal from "./components/SituationReportModal.jsx";

/* ============================================================
   CONTEXT PROVIDERS
   ============================================================ */

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext.jsx";

import {
  ThemeProvider,
} from "./context/ThemeContext.jsx";

import {
  ToastProvider,
} from "./context/ToastContext.jsx";

/* ============================================================
   PUBLIC PAGES
   ============================================================ */

import Home from "./pages/Home.jsx";
import Contact from "./pages/Contact.jsx";
import Privacy from "./pages/Privacy.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

/* ============================================================
   APPLICATION PAGES
   ============================================================ */

import Dashboard from "./pages/Dashboard.jsx";
import LiveMonitoring from "./pages/LiveMonitoring.jsx";
import RiskMap from "./pages/RiskMap.jsx";
import Alerts from "./pages/Alerts.jsx";
import SimulationLab from "./pages/SimulationLab.jsx";
import HistoricalData from "./pages/HistoricalData.jsx";
import EmergencyHub from "./pages/EmergencyHub.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import AIAssistant from "./pages/AIAssistant.jsx";

/* ============================================================
   APPLICATION CONFIGURATION
   ============================================================ */

const APP_NAME = "GeoNexus";

const APP_DESCRIPTION =
  "AI-powered multi-hazard disaster management and early warning command center.";

const APP_VERSION =
  import.meta.env.VITE_APP_VERSION || "1.0.0";

const APP_BASE_URL =
  import.meta.env.BASE_URL || "/";

/* ============================================================
   PAGE METADATA
   ============================================================ */

const PAGE_META = Object.freeze({
  "/": {
    title:
      "GeoNexus | Disaster Management Command Center",
    description:
      APP_DESCRIPTION,
  },

  "/contact": {
    title:
      "Contact | GeoNexus",
    description:
      "Contact the GeoNexus disaster management command center.",
  },

  "/privacy": {
    title:
      "Privacy Policy | GeoNexus",
    description:
      "GeoNexus privacy and data protection information.",
  },

  "/login": {
    title:
      "Secure Command Login | GeoNexus",
    description:
      "Secure access to the GeoNexus disaster management command center.",
  },

  "/forgot-password": {
    title:
      "Forgot Password | GeoNexus",
    description:
      "Reset your GeoNexus command account password securely.",
  },

  "/reset-password": {
    title:
      "Reset Password | GeoNexus",
    description:
      "Create a new secure password for your GeoNexus account.",
  },

  "/dashboard": {
    title:
      "Command Dashboard | GeoNexus",
    description:
      "Real-time disaster risk, telemetry, alerts and response intelligence.",
  },

  "/dashboard/monitoring": {
    title:
      "Live IoT Monitoring | GeoNexus",
    description:
      "Real-time IoT telemetry and sensor fleet monitoring.",
  },

  "/dashboard/risk-map": {
    title:
      "GIS Risk Map | GeoNexus",
    description:
      "Interactive geospatial disaster risk intelligence.",
  },

  "/dashboard/alerts": {
    title:
      "Early Warnings | GeoNexus",
    description:
      "Active disaster alerts and warning management.",
  },

  "/dashboard/simulation": {
    title:
      "AI Simulation Lab | GeoNexus",
    description:
      "Predictive disaster scenario simulation and analysis.",
  },

  "/dashboard/history": {
    title:
      "Incident Archive | GeoNexus",
    description:
      "Historical disaster incidents and analytics.",
  },

  "/dashboard/emergency-hub": {
    title:
      "Emergency Hub | GeoNexus",
    description:
      "Emergency response, shelters and resource coordination.",
  },

  "/dashboard/admin": {
    title:
      "Mission Control | GeoNexus",
    description:
      "GeoNexus system administration and sensor management.",
  },

  "/dashboard/ai-assistant": {
    title:
      "AI Learning & Multi-Agent Studio | GeoNexus",
    description:
      "Specialized AI disaster risk reduction learning lab, scenario testing, and emergency safety agent.",
  },

  "/dashboard/learning": {
    title:
      "AI Learning & Multi-Agent Studio | GeoNexus",
    description:
      "Specialized AI disaster risk reduction learning lab, scenario testing, and emergency safety agent.",
  },
});

/* ============================================================
   PAGE EFFECTS
   ============================================================ */

function PageEffects() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const normalizedPath =
      location.pathname.replace(/\/+$/, "") || "/";

    const exactMeta =
      PAGE_META[normalizedPath];

    const dashboardMeta =
      normalizedPath.startsWith("/dashboard")
        ? PAGE_META["/dashboard"]
        : null;

    const meta =
      exactMeta ||
      dashboardMeta || {
        title:
          `${APP_NAME} | Disaster Management`,
        description:
          APP_DESCRIPTION,
      };

    document.title = meta.title;

    let descriptionTag =
      document.querySelector(
        'meta[name="description"]',
      );

    if (!descriptionTag) {
      descriptionTag =
        document.createElement("meta");

      descriptionTag.setAttribute(
        "name",
        "description",
      );

      document.head.appendChild(
        descriptionTag,
      );
    }

    descriptionTag.setAttribute(
      "content",
      meta.description,
    );

    let themeColor =
      document.querySelector(
        'meta[name="theme-color"]',
      );

    if (!themeColor) {
      themeColor =
        document.createElement("meta");

      themeColor.setAttribute(
        "name",
        "theme-color",
      );

      document.head.appendChild(
        themeColor,
      );
    }

    themeColor.setAttribute(
      "content",
      "#07111f",
    );
  }, [location.pathname]);

  useEffect(() => {
    const mainContent =
      document.getElementById(
        "main-content",
      );

    if (
      mainContent &&
      navigationType !== "POP"
    ) {
      mainContent.focus({
        preventScroll: true,
      });
    }
  }, [
    location.pathname,
    navigationType,
  ]);

  useEffect(() => {
    try {
      animatePageEntrance(
        document,
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(
          "[GeoNexus] Page animation failed:",
          error,
        );
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const links =
      document.querySelectorAll(
        "a[href]",
      );

    links.forEach((link) => {
      link.removeAttribute(
        "aria-current",
      );
    });

    const currentPath =
      location.pathname;

    links.forEach((link) => {
      try {
        const url =
          new URL(
            link.href,
            window.location.origin,
          );

        if (
          url.origin ===
            window.location.origin &&
          url.pathname ===
            currentPath
        ) {
          link.setAttribute(
            "aria-current",
            "page",
          );
        }
      } catch {
        // Ignore malformed links.
      }
    });
  }, [location.pathname]);

  return null;
}

/* ============================================================
   LOADING SCREEN
   ============================================================ */

function AppLoading() {
  return (
    <div
      className="app-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading GeoNexus"
    >
      <div className="loading-orbit">
        <div className="loading-spinner" />
      </div>

      <div className="loading-content">
        <h2>GeoNexus</h2>

        <p>
          Initializing Disaster
          Management Command
          Center...
        </p>

        <span>
          Secure telemetry
          systems loading
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   NETWORK STATUS
   ============================================================ */

function NetworkStatus() {
  const [online, setOnline] =
    useState(() =>
      typeof navigator !== "undefined"
        ? navigator.onLine
        : true,
    );

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener(
      "online",
      handleOnline,
    );

    window.addEventListener(
      "offline",
      handleOffline,
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline,
      );

      window.removeEventListener(
        "offline",
        handleOffline,
      );
    };
  }, []);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          className="network-status-banner"
          initial={{
            opacity: 0,
            y: -30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: -30,
          }}
          transition={{
            duration: 0.25,
          }}
          role="alert"
          aria-live="assertive"
        >
          <span
            className="network-status-dot"
            aria-hidden="true"
          />

          <strong>
            OFFLINE MODE
          </strong>

          <span>
            Internet connection
            unavailable. Cached
            application data may
            still be accessible.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   ADMIN ROLE HELPER
   ============================================================ */

function userHasAdminAccess(user) {
  if (!user) {
    return false;
  }

  const primaryRole =
    String(
      user?.role ||
      user?.userRole ||
      user?.accountType ||
      "",
    )
      .trim()
      .toLowerCase();

  const roles =
    Array.isArray(user?.roles)
      ? user.roles.map(
          (role) =>
            String(role)
              .trim()
              .toLowerCase(),
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
      adminRoles.includes(role),
    ) ||
    user?.isAdmin === true
  );
}

/* ============================================================
   PROTECTED ROUTE
   ============================================================ */

function ProtectedRoute() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <AppLoading />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}

/* ============================================================
   ADMIN ROUTE
   ============================================================ */

function AdminRoute() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <AppLoading />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!userHasAdminAccess(user)) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
}

/* ============================================================
   PUBLIC-ONLY ROUTE
   ============================================================ */

function PublicOnlyRoute() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <AppLoading />;
  }

  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
}

/* ============================================================
   PAGE TRANSITION
   ============================================================ */

function PageTransition({ children }) {
  return <>{children}</>;
}

/* ============================================================
   PUBLIC LAYOUT
   ============================================================ */

function PublicLayout() {
  return (
    <div className="public-layout">
      <PageTransition>
        <Outlet />
      </PageTransition>
    </div>
  );
}

/* ============================================================
   DASHBOARD LAYOUT
   ============================================================ */

function DashboardLayout() {
  return (
    <div className="app-container dashboard-shell">
      <Navbar />

      <div className="main-layout-container">
        <Sidebar />

        <main
          id="main-content"
          className="content-container"
          tabIndex={-1}
        >
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      <SOSModal />
      <SituationReportModal />
    </div>
  );
}

/* ============================================================
   404 PAGE
   ============================================================ */

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main
      className="not-found-page"
      role="main"
      aria-labelledby="not-found-title"
    >
      <div className="not-found-card">
        <div
          className="not-found-code"
          aria-hidden="true"
        >
          404
        </div>

        <h1 id="not-found-title">
          Page Not Found
        </h1>

        <p>
          The requested GeoNexus
          module does not exist.
        </p>

        <button
          type="button"
          className="not-found-home"
          onClick={() =>
            navigate("/")
          }
        >
          Return to Command Center
        </button>
      </div>
    </main>
  );
}

/* ============================================================
   APPLICATION ROUTES
   ============================================================ */

function AppRoutes() {
  return (
    <>
      <PageEffects />
      <NetworkStatus />

      <Routes>

        {/* ==================================================
            PUBLIC-ONLY ROUTES
           ================================================== */}

        <Route
          element={
            <PublicOnlyRoute />
          }
        >
          <Route
            path="/login"
            element={
              <Login />
            }
          />
        </Route>

        {/* ==================================================
            PUBLIC ROUTES
           ================================================== */}

        <Route
          element={
            <PublicLayout />
          }
        >
          <Route
            path="/"
            element={
              <Home />
            }
          />

          <Route
            path="/home"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

          <Route
            path="/contact"
            element={
              <Contact />
            }
          />

          <Route
            path="/privacy"
            element={
              <Privacy />
            }
          />

          <Route
            path="/forgot-password"
            element={
              <ForgotPassword />
            }
          />

          <Route
            path="/reset-password"
            element={
              <ResetPassword />
            }
          />
        </Route>

        {/* ==================================================
            PROTECTED APPLICATION
           ================================================== */}

        <Route
          element={
            <ProtectedRoute />
          }
        >
          <Route
            path="/dashboard"
            element={
              <DashboardLayout />
            }
          >

            {/* COMMAND DASHBOARD */}
            <Route
              index
              element={
                <Dashboard />
              }
            />

            {/* LIVE MONITORING */}
            <Route
              path="monitoring"
              element={
                <LiveMonitoring />
              }
            />

            {/* GIS RISK MAP */}
            <Route
              path="risk-map"
              element={
                <RiskMap />
              }
            />

            {/* ALERT CENTER */}
            <Route
              path="alerts"
              element={
                <Alerts />
              }
            />

            {/* AI SIMULATION */}
            <Route
              path="simulation"
              element={
                <SimulationLab />
              }
            />

            {/* HISTORICAL DATA */}
            <Route
              path="history"
              element={
                <HistoricalData />
              }
            />

            {/* EMERGENCY HUB */}
            <Route
              path="emergency-hub"
              element={
                <EmergencyHub />
              }
            />

            {/* AI ASSISTANT */}
            <Route
              path="ai-assistant"
              element={
                <AIAssistant />
              }
            />

            {/* LEARNING ALIAS */}
            <Route
              path="learning"
              element={
                <AIAssistant />
              }
            />

            {/* ADMIN */}
            <Route
              path="admin"
              element={
                <AdminRoute />
              }
            >
              <Route
                index
                element={
                  <AdminPanel />
                }
              />
            </Route>

            {/* UNKNOWN DASHBOARD MODULE */}
            <Route
              path="*"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />
          </Route>

          {/* ==================================================
              LEGACY ROUTES
             ================================================== */}

          <Route
            path="/monitoring"
            element={
              <Navigate
                to="/dashboard/monitoring"
                replace
              />
            }
          />

          <Route
            path="/risk-map"
            element={
              <Navigate
                to="/dashboard/risk-map"
                replace
              />
            }
          />

          <Route
            path="/alerts"
            element={
              <Navigate
                to="/dashboard/alerts"
                replace
              />
            }
          />

          <Route
            path="/simulation"
            element={
              <Navigate
                to="/dashboard/simulation"
                replace
              />
            }
          />

          <Route
            path="/history"
            element={
              <Navigate
                to="/dashboard/history"
                replace
              />
            }
          />

          <Route
            path="/emergency-hub"
            element={
              <Navigate
                to="/dashboard/emergency-hub"
                replace
              />
            }
          />

          <Route
            path="/admin"
            element={
              <Navigate
                to="/dashboard/admin"
                replace
              />
            }
          />

          <Route
            path="/ai-assistant"
            element={
              <Navigate
                to="/dashboard/ai-assistant"
                replace
              />
            }
          />

          <Route
            path="/learning"
            element={
              <Navigate
                to="/dashboard/ai-assistant"
                replace
              />
            }
          />
        </Route>

        {/* ==================================================
            GLOBAL 404
           ================================================== */}

        <Route
          path="*"
          element={
            <NotFoundPage />
          }
        />

      </Routes>
    </>
  );
}

/* ============================================================
   APPLICATION ROOT
   ============================================================ */

function App() {
  const basename =
    APP_BASE_URL.replace(
      /\/+$/,
      "",
    ) || undefined;

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter
            basename={basename}
          >
            <ToastContainer />
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

/* ============================================================
   DEVELOPMENT DIAGNOSTICS
   ============================================================ */

if (
  import.meta.env.DEV &&
  typeof window !== "undefined"
) {
  window.__GEONEXUS__ =
    window.__GEONEXUS__ || {};

  Object.assign(
    window.__GEONEXUS__,
    {
      name: APP_NAME,
      version: APP_VERSION,
      baseUrl: APP_BASE_URL,

      routes: [
        "/",
        "/contact",
        "/privacy",
        "/login",
        "/forgot-password",
        "/reset-password",
        "/dashboard",
        "/dashboard/monitoring",
        "/dashboard/risk-map",
        "/dashboard/alerts",
        "/dashboard/simulation",
        "/dashboard/history",
        "/dashboard/emergency-hub",
        "/dashboard/admin",
        "/dashboard/ai-assistant",
        "/dashboard/learning",
      ],
    },
  );
}

export default App;