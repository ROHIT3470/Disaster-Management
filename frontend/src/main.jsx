/**
 * ============================================================
 * GEONEXUS
 * APPLICATION ENTRY POINT
 * ============================================================
 *
 * File:
 * frontend/src/main.jsx
 *
 * Responsibilities:
 * - Global stylesheet loading
 * - Application bootstrap
 * - Runtime diagnostics
 * - Global error handling
 * - Network monitoring
 * - React error boundary
 * - HMR cleanup
 * ============================================================
 */

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";

/* ============================================================
   GLOBAL STYLES
   ============================================================ */

import "leaflet/dist/leaflet.css";

import "./styles/index.css";
import "./styles/App.css";
import "./styles/modern.css";
import "./styles/App-premium.css";
import "./styles/login-premium.css";
import "./styles/dashboard-premium.css";
import "./styles/Home.css";
import "./styles/MapView.css";
import "./styles/Animations.css";
import "./styles/Legal.css";
import "./styles/buttons.css";
import "./styles/visual-refresh.css";
import "./styles/theme-refresh.css";

/* ============================================================
   APPLICATION CONFIGURATION
   ============================================================ */

const APP_NAME = "GeoNexus";

const APP_VERSION =
  import.meta.env.VITE_APP_VERSION ||
  "1.0.0";

const APP_ENVIRONMENT =
  import.meta.env.MODE ||
  "development";

const IS_DEVELOPMENT =
  Boolean(import.meta.env.DEV);

const IS_PRODUCTION =
  Boolean(import.meta.env.PROD);

const START_TIME =
  typeof performance !== "undefined"
    ? performance.now()
    : Date.now();

const environment = Object.freeze({
  mode: APP_ENVIRONMENT,

  development:
    IS_DEVELOPMENT,

  production:
    IS_PRODUCTION,

  baseUrl:
    import.meta.env.BASE_URL || "/",

  hostname:
    typeof window !== "undefined"
      ? window.location.hostname
      : "unknown",
});

/* ============================================================
   EVENTS
   ============================================================ */

const EVENTS = Object.freeze({
  READY:
    "app:ready",

  ERROR:
    "app:error",

  NETWORK_STATUS:
    "app:network-status",

  VISIBILITY:
    "app:visibility",

  HEALTH:
    "app:health",
});

/* ============================================================
   STORAGE
   ============================================================ */

const STORAGE_KEYS = Object.freeze({
  SESSION_ID:
    "geonexus_app_session_id",
});

/* ============================================================
   LIMITS
   ============================================================ */

const MAX_ERROR_MESSAGE_LENGTH = 500;

const MAX_STACK_LENGTH = 2000;

/* ============================================================
   SAFE UTILITIES
   ============================================================ */

function safeString(
  value,
  fallback = "Unknown error",
) {
  try {
    if (value instanceof Error) {
      return (
        value.message ||
        fallback
      );
    }

    if (
      typeof value ===
      "string"
    ) {
      return (
        value ||
        fallback
      );
    }

    if (value == null) {
      return fallback;
    }

    return String(value);
  } catch {
    return fallback;
  }
}

function truncate(
  value,
  maxLength,
) {
  const stringValue =
    safeString(
      value,
      "",
    );

  if (
    stringValue.length <=
    maxLength
  ) {
    return stringValue;
  }

  return `${stringValue.slice(
    0,
    maxLength,
  )}…`;
}

function getErrorDetails(error) {
  if (
    error instanceof Error
  ) {
    return {
      name: truncate(
        error.name,
        100,
      ),

      message: truncate(
        error.message,
        MAX_ERROR_MESSAGE_LENGTH,
      ),

      stack: truncate(
        error.stack,
        MAX_STACK_LENGTH,
      ),
    };
  }

  return {
    name:
      "UnknownError",

    message: truncate(
      error,
      MAX_ERROR_MESSAGE_LENGTH,
    ),

    stack: "",
  };
}

/* ============================================================
   SESSION
   ============================================================ */

function createSessionId() {
  try {
    if (
      typeof crypto !==
        "undefined" &&
      typeof crypto.randomUUID ===
        "function"
    ) {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to timestamp-based ID.
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getSessionId() {
  try {
    if (
      typeof sessionStorage ===
      "undefined"
    ) {
      return "session-unavailable";
    }

    const existing =
      sessionStorage.getItem(
        STORAGE_KEYS.SESSION_ID,
      );

    if (existing) {
      return existing;
    }

    const sessionId =
      createSessionId();

    sessionStorage.setItem(
      STORAGE_KEYS.SESSION_ID,
      sessionId,
    );

    return sessionId;
  } catch {
    return "session-unavailable";
  }
}

const SESSION_ID =
  getSessionId();

/* ============================================================
   LOGGER
   ============================================================ */

const logger = {
  info(...args) {
    if (IS_DEVELOPMENT) {
      console.info(
        `[${APP_NAME}]`,
        ...args,
      );
    }
  },

  debug(...args) {
    if (IS_DEVELOPMENT) {
      console.debug(
        `[${APP_NAME}]`,
        ...args,
      );
    }
  },

  warn(...args) {
    console.warn(
      `[${APP_NAME}]`,
      ...args,
    );
  },

  error(...args) {
    console.error(
      `[${APP_NAME}]`,
      ...args,
    );
  },
};

/* ============================================================
   PERFORMANCE MONITORING
   ============================================================ */

const performanceMonitor = {
  marks: new Map(),

  mark(name) {
    try {
      const timestamp =
        typeof performance !==
        "undefined"
          ? performance.now()
          : Date.now();

      this.marks.set(
        name,
        timestamp,
      );

      if (
        typeof performance !==
          "undefined" &&
        typeof performance.mark ===
          "function"
      ) {
        performance.mark(name);
      }

      return timestamp;
    } catch {
      return Date.now();
    }
  },

  measure(
    name,
    startMark,
  ) {
    try {
      const startTime =
        this.marks.get(
          startMark,
        );

      if (
        typeof startTime !==
        "number"
      ) {
        return null;
      }

      const currentTime =
        typeof performance !==
        "undefined"
          ? performance.now()
          : Date.now();

      const duration =
        currentTime -
        startTime;

      if (
        typeof performance !==
          "undefined" &&
        typeof performance.measure ===
          "function"
      ) {
        try {
          performance.measure(
            name,
            startMark,
          );
        } catch {
          // Ignore duplicate/unsupported measures.
        }
      }

      logger.debug(
        `${name}: ${duration.toFixed(
          2,
        )}ms`,
      );

      return duration;
    } catch {
      return null;
    }
  },
};

performanceMonitor.mark(
  "app-bootstrap",
);

/* ============================================================
   RUNTIME STATE
   ============================================================ */

const runtimeState = {
  initialized: false,

  ready: false,

  startupFailed: false,

  lastError: null,

  errorCount: 0,

  networkOnline:
    typeof navigator !==
    "undefined"
      ? navigator.onLine
      : true,

  visibility:
    typeof document !==
    "undefined"
      ? document.visibilityState
      : "unknown",
};

/* ============================================================
   EVENT HELPERS
   ============================================================ */

function dispatchAppEvent(
  name,
  detail = {},
) {
  try {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(
        name,
        {
          detail: {
            timestamp:
              Date.now(),

            sessionId:
              SESSION_ID,

            ...detail,
          },
        },
      ),
    );
  } catch (error) {
    logger.warn(
      "Unable to dispatch application event:",
      error,
    );
  }
}

/* ============================================================
   ERROR REPORTING
   ============================================================ */

function recordApplicationError(
  error,
  context = "unknown",
) {
  const details =
    getErrorDetails(
      error,
    );

  runtimeState.errorCount +=
    1;

  runtimeState.lastError = {
    ...details,

    context,

    timestamp:
      Date.now(),
  };

  logger.error(
    `Application error [${context}]:`,
    error,
  );

  dispatchAppEvent(
    EVENTS.ERROR,
    {
      context,

      error: {
        name:
          details.name,

        message:
          details.message,
      },
    },
  );
}

/* ============================================================
   GLOBAL ERROR HANDLERS
   ============================================================ */

function handleGlobalError(event) {
  const error =
    event?.error ||
    event?.message ||
    event;

  recordApplicationError(
    error,
    "window.error",
  );
}

function handleUnhandledRejection(
  event,
) {
  const reason =
    event?.reason ||
    "Unknown promise rejection";

  recordApplicationError(
    reason,
    "unhandledrejection",
  );
}

/* ============================================================
   NETWORK MONITORING
   ============================================================ */

function handleOnline() {
  runtimeState.networkOnline =
    true;

  logger.info(
    "Network connection restored.",
  );

  dispatchAppEvent(
    EVENTS.NETWORK_STATUS,
    {
      online: true,

      state: "online",
    },
  );
}

function handleOffline() {
  runtimeState.networkOnline =
    false;

  logger.warn(
    "Network connection lost.",
  );

  dispatchAppEvent(
    EVENTS.NETWORK_STATUS,
    {
      online: false,

      state: "offline",
    },
  );
}

/* ============================================================
   VISIBILITY
   ============================================================ */

function handleVisibilityChange() {
  if (
    typeof document ===
    "undefined"
  ) {
    return;
  }

  const visibility =
    document.visibilityState;

  runtimeState.visibility =
    visibility;

  logger.debug(
    `Document visibility changed: ${visibility}`,
  );

  dispatchAppEvent(
    EVENTS.VISIBILITY,
    {
      visibility,

      visible:
        visibility ===
        "visible",
    },
  );
}

/* ============================================================
   PAGE LIFECYCLE
   ============================================================ */

function handlePageShow(event) {
  dispatchAppEvent(
    "app:pageshow",
    {
      persisted:
        Boolean(
          event?.persisted,
        ),
    },
  );
}

function handlePageHide() {
  dispatchAppEvent(
    "app:pagehide",
  );
}

/* ============================================================
   GLOBAL LISTENER MANAGEMENT
   ============================================================ */

let listenersRegistered =
  false;

function registerGlobalListeners() {
  if (
    listenersRegistered ||
    typeof window ===
      "undefined" ||
    typeof document ===
      "undefined"
  ) {
    return;
  }

  window.addEventListener(
    "error",
    handleGlobalError,
  );

  window.addEventListener(
    "unhandledrejection",
    handleUnhandledRejection,
  );

  window.addEventListener(
    "online",
    handleOnline,
  );

  window.addEventListener(
    "offline",
    handleOffline,
  );

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange,
  );

  window.addEventListener(
    "pageshow",
    handlePageShow,
  );

  window.addEventListener(
    "pagehide",
    handlePageHide,
  );

  listenersRegistered =
    true;

  logger.debug(
    "Global event listeners registered.",
  );
}

function unregisterGlobalListeners() {
  if (
    !listenersRegistered ||
    typeof window ===
      "undefined" ||
    typeof document ===
      "undefined"
  ) {
    return;
  }

  window.removeEventListener(
    "error",
    handleGlobalError,
  );

  window.removeEventListener(
    "unhandledrejection",
    handleUnhandledRejection,
  );

  window.removeEventListener(
    "online",
    handleOnline,
  );

  window.removeEventListener(
    "offline",
    handleOffline,
  );

  document.removeEventListener(
    "visibilitychange",
    handleVisibilityChange,
  );

  window.removeEventListener(
    "pageshow",
    handlePageShow,
  );

  window.removeEventListener(
    "pagehide",
    handlePageHide,
  );

  listenersRegistered =
    false;

  logger.debug(
    "Global event listeners removed.",
  );
}

/* ============================================================
   APPLICATION HEALTH
   ============================================================ */

function getApplicationHealth() {
  const currentTime =
    typeof performance !==
    "undefined"
      ? performance.now()
      : Date.now();

  return Object.freeze({
    name:
      APP_NAME,

    version:
      APP_VERSION,

    environment:
      APP_ENVIRONMENT,

    initialized:
      runtimeState.initialized,

    ready:
      runtimeState.ready,

    startupFailed:
      runtimeState.startupFailed,

    networkOnline:
      runtimeState.networkOnline,

    visibility:
      runtimeState.visibility,

    errorCount:
      runtimeState.errorCount,

    uptimeMs:
      Math.round(
        currentTime -
          START_TIME,
      ),

    timestamp:
      Date.now(),
  });
}

function dispatchHealthEvent() {
  dispatchAppEvent(
    EVENTS.HEALTH,
    getApplicationHealth(),
  );
}

/* ============================================================
   BROWSER CAPABILITIES
   ============================================================ */

function detectBrowserCapabilities() {
  return Object.freeze({
    localStorage:
      typeof window !==
        "undefined" &&
      "localStorage" in
        window,

    sessionStorage:
      typeof window !==
        "undefined" &&
      "sessionStorage" in
        window,

    serviceWorker:
      typeof navigator !==
        "undefined" &&
      "serviceWorker" in
        navigator,

    notifications:
      typeof window !==
        "undefined" &&
      "Notification" in
        window,

    geolocation:
      typeof navigator !==
        "undefined" &&
      "geolocation" in
        navigator,

    webSocket:
      typeof window !==
        "undefined" &&
      "WebSocket" in
        window,

    broadcastChannel:
      typeof window !==
        "undefined" &&
      "BroadcastChannel" in
        window,

    online:
      typeof navigator !==
        "undefined"
        ? navigator.onLine
        : true,

    reducedMotion:
      typeof window !==
        "undefined" &&
      typeof window.matchMedia ===
        "function"
        ? window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches
        : false,
  });
}

/* ============================================================
   REACT ERROR BOUNDARY
   ============================================================ */

class ApplicationErrorBoundary
  extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,

      error: null,

      errorId: null,
    };
  }

  static getDerivedStateFromError(
    error,
  ) {
    return {
      hasError: true,

      error,

      errorId:
        createSessionId(),
    };
  }

  componentDidCatch(
    error,
    errorInfo,
  ) {
    recordApplicationError(
      error,
      "react.error-boundary",
    );

    if (IS_DEVELOPMENT) {
      logger.error(
        "React component stack:",
        errorInfo?.componentStack,
      );
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    const baseUrl =
      import.meta.env.BASE_URL ||
      "/";

    window.location.href =
      baseUrl;
  };

  handleReset = () => {
    this.setState({
      hasError: false,

      error: null,

      errorId: null,
    });
  };

  render() {
    if (
      !this.state.hasError
    ) {
      return this.props.children;
    }

    const errorDetails =
      getErrorDetails(
        this.state.error,
      );

    return (
      <main
        role="alert"
        aria-live="assertive"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          boxSizing: "border-box",
          background:
            "radial-gradient(circle at top, #1e293b 0%, #0f172a 55%, #020617 100%)",
          color: "#f8fafc",
          fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "680px",
            padding: "40px",
            boxSizing: "border-box",
            borderRadius: "24px",
            background:
              "rgba(15, 23, 42, 0.94)",
            border:
              "1px solid rgba(148, 163, 184, 0.2)",
            boxShadow:
              "0 25px 80px rgba(0, 0, 0, 0.45)",
            textAlign: "center",
            backdropFilter:
              "blur(18px)",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              margin:
                "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "20px",
              background:
                "rgba(245, 158, 11, 0.12)",
              border:
                "1px solid rgba(245, 158, 11, 0.25)",
              fontSize: "36px",
            }}
            aria-hidden="true"
          >
            ⚠️
          </div>

          <h1
            style={{
              margin:
                "0 0 14px",
              fontSize:
                "clamp(24px, 4vw, 32px)",
              lineHeight: 1.2,
              fontWeight: 800,
            }}
          >
            Command Center
            Temporarily Unavailable
          </h1>

          <p
            style={{
              margin:
                "0 auto 28px",
              maxWidth: "520px",
              color: "#cbd5e1",
              lineHeight: 1.7,
              fontSize: "15px",
            }}
          >
            GeoNexus encountered
            an unexpected
            application error.
            Please reload the
            application.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent:
                "center",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={
                this.handleReload
              }
              style={{
                border: 0,
                borderRadius: "12px",
                padding:
                  "13px 22px",
                background:
                  "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reload Application
            </button>

            <button
              type="button"
              onClick={
                this.handleGoHome
              }
              style={{
                border:
                  "1px solid rgba(148, 163, 184, 0.3)",
                borderRadius: "12px",
                padding:
                  "13px 22px",
                background:
                  "rgba(30, 41, 59, 0.5)",
                color: "#f8fafc",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Return Home
            </button>

            {IS_DEVELOPMENT && (
              <button
                type="button"
                onClick={
                  this.handleReset
                }
                style={{
                  border:
                    "1px solid rgba(148, 163, 184, 0.25)",
                  borderRadius: "12px",
                  padding:
                    "13px 22px",
                  background:
                    "transparent",
                  color: "#cbd5e1",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
            )}
          </div>

          {IS_DEVELOPMENT && (
            <details
              style={{
                marginTop: "30px",
                textAlign: "left",
              }}
            >
              <summary
                style={{
                  cursor:
                    "pointer",
                  color:
                    "#fbbf24",
                  fontWeight: 700,
                }}
              >
                Development
                Error Details
              </summary>

              <div
                style={{
                  marginTop: "14px",
                  padding: "16px",
                  borderRadius:
                    "12px",
                  background:
                    "#020617",
                  border:
                    "1px solid rgba(148, 163, 184, 0.15)",
                }}
              >
                <strong
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "8px",
                    color:
                      "#f87171",
                  }}
                >
                  {errorDetails.name}
                </strong>

                <pre
                  style={{
                    margin: 0,
                    overflowX:
                      "auto",
                    color:
                      "#fca5a5",
                    fontSize:
                      "12px",
                    lineHeight:
                      1.6,
                    whiteSpace:
                      "pre-wrap",
                    wordBreak:
                      "break-word",
                  }}
                >
                  {errorDetails.stack ||
                    errorDetails.message ||
                    "Unknown error"}
                </pre>
              </div>
            </details>
          )}

          <footer
            style={{
              marginTop:
                "28px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            {APP_NAME} • v
            {APP_VERSION}
          </footer>
        </section>
      </main>
    );
  }
}

/* ============================================================
   ROOT VALIDATION
   ============================================================ */

function getRootElement() {
  const rootElement =
    document.getElementById(
      "root",
    );

  if (!rootElement) {
    throw new Error(
      'Critical startup failure: Root element "#root" was not found. Check index.html.',
    );
  }

  return rootElement;
}

/* ============================================================
   STARTUP FAILURE
   ============================================================ */

function renderStartupFailure(
  error,
) {
  const rootElement =
    document.getElementById(
      "root",
    );

  if (!rootElement) {
    return;
  }

  rootElement.replaceChildren();

  const main =
    document.createElement(
      "main",
    );

  main.setAttribute(
    "role",
    "alert",
  );

  main.setAttribute(
    "aria-live",
    "assertive",
  );

  Object.assign(
    main.style,
    {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      boxSizing: "border-box",
      background: "#0f172a",
      color: "#f8fafc",
      fontFamily:
        "system-ui, sans-serif",
      textAlign: "center",
    },
  );

  const section =
    document.createElement(
      "section",
    );

  Object.assign(
    section.style,
    {
      width: "100%",
      maxWidth: "600px",
    },
  );

  const icon =
    document.createElement(
      "div",
    );

  icon.textContent = "⚠️";

  Object.assign(
    icon.style,
    {
      fontSize: "48px",
      marginBottom: "16px",
    },
  );

  const title =
    document.createElement(
      "h1",
    );

  title.textContent =
    "Application Startup Failed";

  Object.assign(
    title.style,
    {
      fontSize: "28px",
      margin:
        "0 0 12px",
    },
  );

  const message =
    document.createElement(
      "p",
    );

  message.textContent =
    "GeoNexus could not be initialized. Please reload the application.";

  Object.assign(
    message.style,
    {
      color: "#cbd5e1",
      lineHeight: "1.6",
      margin: "0",
    },
  );

  const button =
    document.createElement(
      "button",
    );

  button.type = "button";

  button.textContent =
    "Reload Application";

  Object.assign(
    button.style,
    {
      marginTop: "20px",
      padding: "12px 20px",
      border: "0",
      borderRadius: "10px",
      background: "#2563eb",
      color: "#ffffff",
      fontWeight: "700",
      cursor: "pointer",
    },
  );

  button.addEventListener(
    "click",
    () =>
      window.location.reload(),
  );

  section.append(
    icon,
    title,
    message,
    button,
  );

  if (IS_DEVELOPMENT) {
    const details =
      getErrorDetails(error);

    const pre =
      document.createElement(
        "pre",
      );

    pre.textContent =
      details.stack ||
      details.message ||
      "Unknown startup error";

    Object.assign(
      pre.style,
      {
        marginTop: "24px",
        padding: "16px",
        textAlign: "left",
        overflow: "auto",
        background: "#020617",
        color: "#f87171",
        borderRadius: "10px",
        fontSize: "12px",
        lineHeight: "1.6",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      },
    );

    section.appendChild(pre);
  }

  main.appendChild(section);

  rootElement.appendChild(main);
}

/* ============================================================
   DEVELOPMENT DIAGNOSTICS
   ============================================================ */

function exposeDevelopmentDiagnostics(
  root,
) {
  if (
    !IS_DEVELOPMENT ||
    typeof window ===
      "undefined"
  ) {
    return;
  }

  try {
    window.__GEONEXUS_APP__ =
      Object.freeze({
        name: APP_NAME,

        version:
          APP_VERSION,

        environment,

        sessionId:
          SESSION_ID,

        capabilities:
          detectBrowserCapabilities(),

        getHealth:
          getApplicationHealth,

        getRuntimeState: () =>
          Object.freeze({
            ...runtimeState,
          }),

        root,
      });
  } catch (error) {
    logger.warn(
      "Unable to expose development diagnostics:",
      error,
    );
  }
}

/* ============================================================
   READY
   ============================================================ */

function markApplicationReady() {
  runtimeState.ready =
    true;

  const currentTime =
    typeof performance !==
    "undefined"
      ? performance.now()
      : Date.now();

  const startupDuration =
    currentTime -
    START_TIME;

  performanceMonitor.measure(
    "application-startup",
    "app-bootstrap",
  );

  logger.info(
    `Application ready in ${startupDuration.toFixed(
      2,
    )}ms.`,
  );

  dispatchAppEvent(
    EVENTS.READY,
    {
      version:
        APP_VERSION,

      startupDuration:
        Math.round(
          startupDuration,
        ),

      networkOnline:
        typeof navigator !==
        "undefined"
          ? navigator.onLine
          : true,
    },
  );

  dispatchHealthEvent();
}

/* ============================================================
   INITIALIZATION
   ============================================================ */

function initializeApplication() {
  performanceMonitor.mark(
    "application-initialization",
  );

  const rootElement =
    getRootElement();

  logger.info(
    "Initializing GeoNexus...",
  );

  logger.info(
    "Environment:",
    environment,
  );

  logger.info(
    "Version:",
    APP_VERSION,
  );

  if (IS_DEVELOPMENT) {
    logger.debug(
      "Session:",
      SESSION_ID,
    );

    logger.debug(
      "Capabilities:",
      detectBrowserCapabilities(),
    );
  }

  registerGlobalListeners();

  logger.info(
    "Initial network status:",
    runtimeState.networkOnline
      ? "ONLINE"
      : "OFFLINE",
  );

  const root =
    ReactDOM.createRoot(
      rootElement,
      {
        onRecoverableError(
          error,
          errorInfo,
        ) {
          recordApplicationError(
            error,
            "react.recoverable-error",
          );

          if (IS_DEVELOPMENT) {
            logger.debug(
              "React recoverable error info:",
              errorInfo,
            );
          }
        },

        onCaughtError(
          error,
          errorInfo,
        ) {
          recordApplicationError(
            error,
            "react.caught-error",
          );

          if (IS_DEVELOPMENT) {
            logger.debug(
              "React caught error info:",
              errorInfo,
            );
          }
        },

        onUncaughtError(
          error,
          errorInfo,
        ) {
          recordApplicationError(
            error,
            "react.uncaught-error",
          );

          if (IS_DEVELOPMENT) {
            logger.debug(
              "React uncaught error info:",
              errorInfo,
            );
          }
        },
      },
    );

  root.render(
    <React.StrictMode>
      <ApplicationErrorBoundary>
        <App />
      </ApplicationErrorBoundary>
    </React.StrictMode>,
  );

  runtimeState.initialized =
    true;

  performanceMonitor.measure(
    "application-initialization",
    "application-initialization",
  );

  exposeDevelopmentDiagnostics(
    root,
  );

  /*
   * React root.render() does not guarantee
   * that the UI has already painted when it
   * returns. Schedule the READY signal after
   * the browser gets a rendering opportunity.
   */
  const scheduleReady = () => {
    markApplicationReady();

    logger.info(
      "GeoNexus initialized successfully.",
    );
  };

  if (
    typeof window !==
    "undefined" &&
    typeof window.requestAnimationFrame ===
      "function"
  ) {
    window.requestAnimationFrame(
      scheduleReady,
    );
  } else {
    scheduleReady();
  }

  return root;
}

/* ============================================================
   START APPLICATION
   ============================================================ */

let applicationRoot =
  null;

try {
  applicationRoot =
    initializeApplication();
} catch (error) {
  runtimeState.startupFailed =
    true;

  recordApplicationError(
    error,
    "application.startup",
  );

  logger.error(
    "Application startup failed:",
    error,
  );

  renderStartupFailure(
    error,
  );
}

/* ============================================================
   DEVELOPMENT EVENT HANDLERS
   ============================================================ */

const handleReadyEvent = () => {
  logger.debug(
    "GEONEXUS READY EVENT RECEIVED.",
  );
};

const handleNetworkStatusEvent = (
  event,
) => {
  logger.debug(
    "NETWORK STATUS:",
    event.detail,
  );
};

/* ============================================================
   HMR
   ============================================================ */

if (import.meta.hot) {
  import.meta.hot.accept();

  import.meta.hot.dispose(() => {
    logger.debug(
      "Disposing GeoNexus HMR instance...",
    );

    unregisterGlobalListeners();

    if (applicationRoot) {
      try {
        applicationRoot.unmount();
      } catch (error) {
        logger.warn(
          "Failed to unmount React application during HMR:",
          error,
        );
      }

      applicationRoot = null;
    }

    if (
      IS_DEVELOPMENT &&
      typeof window !==
        "undefined"
    ) {
      window.removeEventListener(
        EVENTS.READY,
        handleReadyEvent,
      );

      window.removeEventListener(
        EVENTS.NETWORK_STATUS,
        handleNetworkStatusEvent,
      );

      try {
        delete window.__GEONEXUS_APP__;
      } catch {
        // Ignore cleanup failures.
      }
    }

    runtimeState.initialized =
      false;

    runtimeState.ready =
      false;
  });
}

/* ============================================================
   DEVELOPMENT EVENT LOGGING
   ============================================================ */

if (
  IS_DEVELOPMENT &&
  typeof window !==
    "undefined"
) {
  window.addEventListener(
    EVENTS.READY,
    handleReadyEvent,
  );

  window.addEventListener(
    EVENTS.NETWORK_STATUS,
    handleNetworkStatusEvent,
  );
}

logger.info(
  `${APP_NAME} v${APP_VERSION} bootstrap completed.`,
);