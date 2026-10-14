import React, { useEffect, useState } from "react";

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

import { AnimatePresence, motion } from "motion/react";

/* ============================================================
   GLOBAL COMPONENTS
   ============================================================ */

import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
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

import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

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
import Prediction from "./pages/Prediction.jsx";

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

const APP_ROUTES = Object.freeze([
  "/",
  "/contact",
  "/privacy",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/dashboard",
  "/dashboard/monitoring",
  "/dashboard/risk-map",
  "/dashboard/prediction",
  "/dashboard/alerts",
  "/dashboard/simulation",
  "/dashboard/history",
  "/dashboard/emergency-hub",
  "/dashboard/admin",
  "/dashboard/ai-assistant",
  "/dashboard/learning",
]);

/* ============================================================
   PAGE METADATA
   ============================================================ */

const PAGE_META = Object.freeze({
  "/": {
    title: "GeoNexus | Disaster Management Command Center",
    description: APP_DESCRIPTION,
  },

  "/contact": {
    title: "Contact | GeoNexus",
    description:
      "Contact the GeoNexus disaster management command center.",
  },

  "/privacy": {
    title: "Privacy Policy | GeoNexus",
    description:
      "GeoNexus privacy and data protection information.",
  },

  "/login": {
    title: "Secure Command Login | GeoNexus",
    description:
      "Secure access to the GeoNexus disaster management command center.",
  },

  "/forgot-password": {
    title: "Forgot Password | GeoNexus",
    description:
      "Reset your GeoNexus command account password securely.",
  },

  "/reset-password": {
    title: "Reset Password | GeoNexus",
    description:
      "Create a new secure password for your GeoNexus account.",
  },

  "/dashboard": {
    title: "Command Dashboard | GeoNexus",
    description:
      "Real-time disaster risk, telemetry, alerts and response intelligence.",
  },

  "/dashboard/monitoring": {
    title: "Live IoT Monitoring | GeoNexus",
    description:
      "Real-time IoT telemetry and sensor fleet monitoring.",
  },

  "/dashboard/risk-map": {
    title: "GIS Risk Map | GeoNexus",
    description:
      "Interactive geospatial disaster risk intelligence.",
  },

  "/dashboard/prediction": {
    title: "Disaster Risk Prediction | GeoNexus",
    description:
      "AI-assisted flood and landslide risk prediction for monitored locations.",
  },

  "/dashboard/alerts": {
    title: "Early Warnings | GeoNexus",
    description:
      "Active disaster alerts and warning management.",
  },

  "/dashboard/simulation": {
    title: "AI Simulation Lab | GeoNexus",
    description:
      "Predictive disaster scenario simulation and analysis.",
  },

  "/dashboard/history": {
    title: "Incident Archive | GeoNexus",
    description:
      "Historical disaster incidents and analytics.",
  },

  "/dashboard/emergency-hub": {
    title: "Emergency Hub | GeoNexus",
    description:
      "Emergency response, shelters and resource coordination.",
  },

  "/dashboard/admin": {
    title: "Mission Control | GeoNexus",
    description:
      "GeoNexus system administration and sensor management.",
  },

  "/dashboard/ai-assistant": {
    title: "AI Assistant | GeoNexus",
    description:
      "AI-powered disaster risk reduction, scenario analysis and emergency safety assistance.",
  },

  "/dashboard/learning": {
    title: "AI Learning Studio | GeoNexus",
    description:
      "Disaster risk reduction learning, scenario testing and emergency safety assistance.",
  },
});

/* ============================================================
   SHARED HELPERS
   ============================================================ */

function normalizePath(pathname) {
  if (!pathname) {
    return "/";
  }

  return pathname.replace(/\/+$/, "") || "/";
}

function getPageMetadata(pathname) {
  const normalizedPath = normalizePath(pathname);

  if (PAGE_META[normalizedPath]) {
    return PAGE_META[normalizedPath];
  }

  if (normalizedPath.startsWith("/dashboard/")) {
    return {
      title: "Dashboard Module | GeoNexus",
      description: APP_DESCRIPTION,
    };
  }

  return {
    title: `${APP_NAME} | Disaster Management`,
    description: APP_DESCRIPTION,
  };
}

function getDocumentTheme() {
  const root = document.documentElement;

  return (
    root.dataset.theme === "dark" ||
    root.classList.contains("dark")
  )
    ? "dark"
    : "light";
}

function userHasAdminAccess(user) {
  if (!user || typeof user !== "object") {
    return false;
  }

  const normalizeRole = (role) =>
    String(role ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

  const primaryRole = normalizeRole(
    user.role ?? user.userRole ?? user.accountType,
  );

  const roles = Array.isArray(user.roles)
    ? user.roles.map(normalizeRole)
    : [];

  const adminRoles = new Set([
    "admin",
    "administrator",
    "superadmin",
    "super_admin",
    "system_admin",
  ]);

  return (
    adminRoles.has(primaryRole) ||
    roles.some((role) => adminRoles.has(role)) ||
    user.isAdmin === true
  );
}

/* ============================================================
   PAGE METADATA AND ROUTE EFFECTS
   ============================================================ */

function PageEffects() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const metadata = getPageMetadata(location.pathname);

    document.title = metadata.title;

    let descriptionTag = document.querySelector(
      'meta[name="description"]',
    );

    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.name = "description";
      document.head.appendChild(descriptionTag);
    }

    descriptionTag.content = metadata.description;
  }, [location.pathname]);

  /* Keep the browser theme color synchronized with the theme. */
  useEffect(() => {
    let themeColorTag = document.querySelector(
      'meta[name="theme-color"]',
    );

    if (!themeColorTag) {
      themeColorTag = document.createElement("meta");
      themeColorTag.name = "theme-color";
      document.head.appendChild(themeColorTag);
    }

    const updateThemeColor = () => {
      themeColorTag.content =
        getDocumentTheme() === "dark"
          ? "#08191d"
          : "#f4f8f7";
    };

    updateThemeColor();

    const observer = new MutationObserver(updateThemeColor);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  /* Move keyboard focus to the main dashboard content on navigation. */
  useEffect(() => {
    if (navigationType === "POP") {
      return;
    }

    const mainContent = document.getElementById("main-content");

    if (mainContent) {
      mainContent.focus({ preventScroll: true });
    }
  }, [location.pathname, navigationType]);

  /* Run the existing entrance animation safely. */
  useEffect(() => {
    try {
      animatePageEntrance(document);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(
          "[GeoNexus] Page entrance animation failed:",
          error,
        );
      }
    }
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
      <div className="loading-orbit" aria-hidden="true">
        <div className="loading-spinner" />
      </div>

      <div className="loading-content">
        <h2>GeoNexus</h2>

        <p>
          Initializing Disaster Management Command Center...
        </p>

        <span>Secure telemetry systems loading</span>
      </div>
    </div>
  );
}

/* ============================================================
   NETWORK STATUS
   ============================================================ */

function NetworkStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined"
      ? true
      : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          key="network-offline"
          className="network-status-banner"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
        >
          <span
            className="network-status-dot"
            aria-hidden="true"
          />

          <strong>OFFLINE MODE</strong>

          <span>
            Internet connection unavailable. Cached data may
            remain accessible.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   ROUTE GUARDS
   ============================================================ */

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!userHasAdminAccess(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoading />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <ThemeToggle variant="floating" />
      <Outlet />
    </>
  );
}

/* ============================================================
   PAGE TRANSITIONS
   ============================================================ */

function PageTransition({ children }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="page-transition"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ============================================================
   PUBLIC LAYOUT
   ============================================================ */

function PublicLayout() {
  return (
    <div className="public-layout">
      <ThemeToggle variant="floating" />
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
          className="content-container dashboard-content-container"
          tabIndex={-1}
          aria-label="GeoNexus dashboard content"
        >
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>


    </div>
  );
}

/* ============================================================
   NOT FOUND PAGES
   ============================================================ */

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main
      className="not-found-page"
      aria-labelledby="not-found-title"
    >
      <div className="not-found-card">
        <div className="not-found-code" aria-hidden="true">
          404
        </div>

        <h1 id="not-found-title">Page Not Found</h1>

        <p>
          The requested GeoNexus module could not be found.
        </p>

        <button
          type="button"
          className="btn-primary not-found-home"
          onClick={() => navigate("/")}
        >
          Return to Command Center
        </button>
      </div>
    </main>
  );
}

function DashboardNotFoundPage() {
  const navigate = useNavigate();

  return (
    <section
      className="dashboard-not-found"
      aria-labelledby="dashboard-not-found-title"
    >
      <div className="not-found-card">
        <div className="not-found-code" aria-hidden="true">
          404
        </div>

        <h1 id="dashboard-not-found-title">
          Module Not Found
        </h1>

        <p>
          This dashboard module does not exist or may have
          moved.
        </p>

        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   ROUTE DEFINITIONS
   ============================================================ */

function AppRoutes() {
  return (
    <>
      <PageEffects />
      <NetworkStatus />

      <Routes>
        {/* Public-only routes */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Public pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />

          <Route
            path="/home"
            element={<Navigate to="/" replace />}
          />

          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />
        </Route>

        {/* Authenticated application */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<DashboardLayout />}
          >
            <Route index element={<Dashboard />} />

            <Route
              path="monitoring"
              element={<LiveMonitoring />}
            />

            <Route
              path="risk-map"
              element={<RiskMap />}
            />

            <Route
              path="prediction"
              element={<Prediction />}
            />

            <Route path="alerts" element={<Alerts />} />

            <Route
              path="simulation"
              element={<SimulationLab />}
            />

            <Route
              path="history"
              element={<HistoricalData />}
            />

            <Route
              path="emergency-hub"
              element={<EmergencyHub />}
            />

            <Route
              path="ai-assistant"
              element={<AIAssistant />}
            />

            <Route
              path="learning"
              element={<Navigate to="/dashboard/ai-assistant" replace />}
            />

            {/* Admin-only module */}
            <Route path="admin" element={<AdminRoute />}>
              <Route index element={<AdminPanel />} />
            </Route>

            {/* Unknown dashboard module */}
            <Route
              path="*"
              element={<DashboardNotFoundPage />}
            />
          </Route>

          {/* Legacy route redirects */}
          <Route
            path="/monitoring"
            element={<Navigate to="/dashboard/monitoring" replace />}
          />

          <Route
            path="/risk-map"
            element={<Navigate to="/dashboard/risk-map" replace />}
          />

          <Route
            path="/alerts"
            element={<Navigate to="/dashboard/alerts" replace />}
          />

          <Route
            path="/simulation"
            element={<Navigate to="/dashboard/simulation" replace />}
          />

          <Route
            path="/history"
            element={<Navigate to="/dashboard/history" replace />}
          />

          <Route
            path="/emergency-hub"
            element={<Navigate to="/dashboard/emergency-hub" replace />}
          />

          <Route
            path="/admin"
            element={<Navigate to="/dashboard/admin" replace />}
          />

          <Route
            path="/ai-assistant"
            element={<Navigate to="/dashboard/ai-assistant" replace />}
          />

          <Route
            path="/learning"
            element={<Navigate to="/dashboard/ai-assistant" replace />}
          />
        </Route>

        {/* Global fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

/* ============================================================
   APPLICATION ROOT
   ============================================================ */

function App() {
  const basename =
    APP_BASE_URL.replace(/\/+$/, "") || undefined;

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter basename={basename}>
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

if (import.meta.env.DEV && typeof window !== "undefined") {
  window.__GEONEXUS__ = {
    name: APP_NAME,
    version: APP_VERSION,
    baseUrl: APP_BASE_URL,
    routes: APP_ROUTES,
  };
}

export default App;