import { useEffect, useMemo, useRef } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  Wifi,
  BellRing,
  ShieldAlert,
} from "lucide-react";

import { useToast } from "../context/ToastContext";

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_DURATION = 5000;

// ============================================================
// TOAST ICON
// ============================================================

const getToastIcon = (type) => {
  const normalizedType = String(type || "info").toLowerCase();

  switch (normalizedType) {
    case "success":
      return CheckCircle2;

    case "warning":
      return AlertTriangle;

    case "critical":
      return ShieldAlert;

    case "error":
      return AlertOctagon;

    case "info":
    default:
      return Info;
  }
};

// ============================================================
// TOAST LABEL
// ============================================================

const getToastLabel = (type) => {
  const normalizedType = String(type || "info").toLowerCase();

  switch (normalizedType) {
    case "success":
      return "SUCCESS";

    case "warning":
      return "WARNING";

    case "critical":
      return "CRITICAL";

    case "error":
      return "ERROR";

    case "info":
    default:
      return "SYSTEM INFO";
  }
};

// ============================================================
// COMPONENT
// ============================================================

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const validToasts = useMemo(() => {
    if (!Array.isArray(toasts)) {
      return [];
    }

    return toasts.filter(
      (toast) => toast && toast.id !== undefined
    );
  }, [toasts]);

  if (!validToasts.length) {
    return null;
  }

  return (
    <aside
      className="toast-container-pro"
      aria-label="System notifications"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {/* ======================================================
          LIVE SYSTEM INDICATOR
          ====================================================== */}

      <div className="toast-system-header">
        <div className="toast-system-title">
          <div className="toast-system-icon">
            <BellRing size={13} />
          </div>

          <div>
            <span>COMMAND CENTER</span>
            <strong>NOTIFICATIONS</strong>
          </div>
        </div>

        <div className="toast-system-live">
          <span className="toast-system-live-dot" />
          <span>LIVE</span>
        </div>
      </div>

      {/* ======================================================
          TOAST LIST
          ====================================================== */}

      <div className="toast-list">
        {validToasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </aside>
  );
}

// ============================================================
// TOAST ITEM
// ============================================================

function ToastItem({ toast, onRemove }) {
  const toastRef = useRef(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);
  const remainingRef = useRef(null);
  const isPausedRef = useRef(false);

  const type = String(
    toast?.type || "info"
  ).toLowerCase();

  const Icon = getToastIcon(type);

  const label = getToastLabel(type);

  const title = toast?.title
    ? String(toast.title)
    : "";

  const message =
    toast?.message !== undefined &&
    toast?.message !== null
      ? String(toast.message)
      : "";

  const duration =
    Number.isFinite(Number(toast?.duration)) &&
    Number(toast.duration) > 0
      ? Number(toast.duration)
      : DEFAULT_DURATION;

  // ==========================================================
  // AUTO DISMISS
  // ==========================================================

  const clearToastTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startToastTimer = () => {
    clearToastTimer();

    const remaining =
      remainingRef.current ?? duration;

    startedAtRef.current = Date.now();
    remainingRef.current = remaining;

    timerRef.current = setTimeout(() => {
      remainingRef.current = 0;
      timerRef.current = null;

      onRemove();
    }, remaining);
  };

  const pauseToastTimer = () => {
    if (isPausedRef.current) {
      return;
    }

    isPausedRef.current = true;

    if (startedAtRef.current) {
      const elapsed =
        Date.now() - startedAtRef.current;

      remainingRef.current = Math.max(
        0,
        (remainingRef.current ?? duration) -
          elapsed
      );
    }

    clearToastTimer();
  };

  const resumeToastTimer = () => {
    if (!isPausedRef.current) {
      return;
    }

    isPausedRef.current = false;

    if (
      !remainingRef.current ||
      remainingRef.current <= 0
    ) {
      onRemove();
      return;
    }

    startToastTimer();
  };

  useEffect(() => {
    remainingRef.current = duration;
    startToastTimer();

    return () => {
      clearToastTimer();
    };
    // The toast duration should be initialized once
    // for its current lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id, duration]);

  // ==========================================================
  // KEYBOARD INTERACTION
  // ==========================================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Escape" ||
      event.keyCode === 27
    ) {
      event.preventDefault();
      onRemove();
    }
  };

  // ==========================================================
  // OPTIONAL ACTION SUPPORT
  // ==========================================================

  const hasAction =
    typeof toast?.action === "function";

  const actionLabel =
    toast?.actionLabel
      ? String(toast.actionLabel)
      : "Open";

  const handleAction = () => {
    if (!hasAction) {
      return;
    }

    try {
      toast.action();
    } catch (error) {
      console.error(
        "Toast action failed:",
        error
      );
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      ref={toastRef}
      className={`toast-card-pro toast-${type}`}
      role={
        type === "critical" ||
        type === "error"
          ? "alert"
          : "status"
      }
      tabIndex={0}
      onMouseEnter={pauseToastTimer}
      onMouseLeave={resumeToastTimer}
      onFocus={pauseToastTimer}
      onBlur={resumeToastTimer}
      onKeyDown={handleKeyDown}
    >
      {/* ====================================================
          SEVERITY ACCENT
          ==================================================== */}

      <div className="toast-severity-line" />

      {/* ====================================================
          ICON
          ==================================================== */}

      <div className="toast-icon-shell">
        <div className="toast-icon">
          <Icon size={19} strokeWidth={2.2} />
        </div>

        {type === "critical" && (
          <span className="critical-icon-wave" />
        )}
      </div>

      {/* ====================================================
          CONTENT
          ==================================================== */}

      <div className="toast-body">
        <div className="toast-heading-row">
          <div className="toast-title-wrap">
            <span className="toast-type-label">
              {label}
            </span>

            {title && (
              <strong className="toast-title">
                {title}
              </strong>
            )}
          </div>

          <span className="toast-time">
            <ToastTime timestamp={toast?.createdAt} />
          </span>
        </div>

        {message && (
          <p className="toast-msg">
            {message}
          </p>
        )}

        {/* Optional action */}
        {hasAction && (
          <button
            type="button"
            className="toast-action"
            onClick={handleAction}
          >
            {actionLabel}
          </button>
        )}

        {/* ==================================================
            META
            ================================================== */}

        <div className="toast-meta">
          <span className="toast-channel">
            <Wifi size={10} />

            {type === "critical"
              ? "EMERGENCY CHANNEL"
              : "SYSTEM CHANNEL"}
          </span>

          {type === "critical" && (
            <span className="toast-priority">
              PRIORITY
            </span>
          )}
        </div>

        {/* ==================================================
            PROGRESS
            ================================================== */}

        <div className="toast-progress-track">
          <div
            className="toast-progress-fill"
            style={{
              "--toast-duration": `${duration}ms`,
            }}
          />
        </div>
      </div>

      {/* ====================================================
          CLOSE BUTTON
          ==================================================== */}

      <button
        type="button"
        className="toast-close-pro"
        onClick={onRemove}
        aria-label={
          title
            ? `Dismiss ${title}`
            : "Dismiss notification"
        }
        title="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}

// ============================================================
// TOAST TIME
// ============================================================

function ToastTime({ timestamp }) {
  if (!timestamp) {
    return "NOW";
  }

  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    return "NOW";
  }

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default ToastContainer;