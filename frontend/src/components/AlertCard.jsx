import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  MapPin,
  Clock,
  Volume2,
  CheckCircle,
  Share2,
  Radio,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { playEmergencySiren } from "../utils/audioAlert";
import { useToast } from "../context/ToastContext";

function AlertCard({ alert, onAcknowledge }) {
  const { addToast } = useToast();

  const [acknowledged, setAcknowledged] = useState(false);
  const [isPlayingSiren, setIsPlayingSiren] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // ------------------------------------------------------------
  // SAFE DEFAULT DATA
  // ------------------------------------------------------------

  const safeAlert = alert || {};

  const location =
    safeAlert.location?.toString().trim() || "Unknown Location";

  const message =
    safeAlert.message?.toString().trim() ||
    "Emergency information is currently unavailable.";

  const type =
    safeAlert.type?.toString().trim() || "Emergency";

  const level =
    safeAlert.level?.toString().trim() || "Low";

  // ------------------------------------------------------------
  // SEVERITY CONFIGURATION
  // ------------------------------------------------------------

  const severity = useMemo(() => {
    const normalized = level.toLowerCase();

    if (
      normalized.includes("critical") ||
      normalized.includes("severe") ||
      normalized.includes("extreme")
    ) {
      return {
        className: "critical",
        label: "CRITICAL",
        description: "Immediate Action Required",
        icon: ShieldAlert,
      };
    }

    if (
      normalized.includes("high") ||
      normalized.includes("danger")
    ) {
      return {
        className: "high",
        label: "HIGH",
        description: "High Risk Alert",
        icon: AlertTriangle,
      };
    }

    if (
      normalized.includes("moderate") ||
      normalized.includes("medium") ||
      normalized.includes("warning") ||
      normalized.includes("warn")
    ) {
      return {
        className: "moderate",
        label: "MODERATE",
        description: "Exercise Caution",
        icon: AlertTriangle,
      };
    }

    return {
      className: "low",
      label: "LOW",
      description: "Monitoring",
      icon: ShieldCheck,
    };
  }, [level]);

  const SeverityIcon = severity.icon;

  // ------------------------------------------------------------
  // TIME FORMATTER
  // ------------------------------------------------------------

  const formattedTime = useMemo(() => {
    if (!safeAlert.createdAt) {
      return "Active Now";
    }

    const date = new Date(safeAlert.createdAt);

    if (Number.isNaN(date.getTime())) {
      return "Active Now";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [safeAlert.createdAt]);

  // ------------------------------------------------------------
  // DATE FORMATTER
  // ------------------------------------------------------------

  const formattedDate = useMemo(() => {
    if (!safeAlert.createdAt) {
      return "Today";
    }

    const date = new Date(safeAlert.createdAt);

    if (Number.isNaN(date.getTime())) {
      return "Today";
    }

    return date.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [safeAlert.createdAt]);

  // ------------------------------------------------------------
  // ACKNOWLEDGE ALERT
  // ------------------------------------------------------------

  const handleAcknowledge = useCallback(() => {
    if (acknowledged) {
      return;
    }

    setAcknowledged(true);

    addToast({
      title: "Alert Acknowledged",
      message: `Emergency alert for ${location} acknowledged by operator.`,
      type: "success",
    });

    if (typeof onAcknowledge === "function") {
      onAcknowledge(safeAlert);
    }
  }, [
    acknowledged,
    addToast,
    location,
    onAcknowledge,
    safeAlert,
  ]);

  // ------------------------------------------------------------
  // PLAY EMERGENCY SIREN
  // ------------------------------------------------------------

  const handlePlaySiren = useCallback(() => {
    if (isPlayingSiren) {
      return;
    }

    try {
      setIsPlayingSiren(true);

      playEmergencySiren(4);

      addToast({
        title: "Emergency Tone Triggered",
        message: `4-second warning tone activated for ${location}.`,
        type: "warning",
      });

      // Reset visual state after the configured siren duration.
      window.setTimeout(() => {
        setIsPlayingSiren(false);
      }, 4000);
    } catch (error) {
      console.error("Unable to play emergency siren:", error);

      setIsPlayingSiren(false);

      addToast({
        title: "Audio Alert Failed",
        message:
          "The warning tone could not be played. Please check browser audio permissions.",
        type: "error",
      });
    }
  }, [
    addToast,
    isPlayingSiren,
    location,
  ]);

  // ------------------------------------------------------------
  // SHARE / COPY ALERT
  // ------------------------------------------------------------

  const getBroadcastMessage = useCallback(() => {
    return [
      `DISASTER ALERT`,
      `Severity: ${severity.label}`,
      `Type: ${type} Hazard`,
      `Location: ${location}`,
      `Message: ${message}`,
      `Time: ${formattedTime}`,
    ].join("\n");
  }, [
    formattedTime,
    location,
    message,
    severity.label,
    type,
  ]);

  const handleShare = useCallback(async () => {
    if (isSharing) {
      return;
    }

    const broadcastMessage = getBroadcastMessage();

    try {
      setIsSharing(true);

      // --------------------------------------------------------
      // Native Web Share API
      // --------------------------------------------------------

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        await navigator.share({
          title: `${severity.label} Disaster Alert`,
          text: broadcastMessage,
        });

        addToast({
          title: "Alert Shared",
          message: "Emergency alert shared successfully.",
          type: "success",
        });

        return;
      }

      // --------------------------------------------------------
      // Clipboard Fallback
      // --------------------------------------------------------

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(broadcastMessage);

        addToast({
          title: "Alert Copied",
          message: "Emergency broadcast text copied to clipboard.",
          type: "info",
        });

        return;
      }

      // --------------------------------------------------------
      // Legacy Clipboard Fallback
      // --------------------------------------------------------

      const textArea = document.createElement("textarea");

      textArea.value = broadcastMessage;

      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";

      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();

      const copied = document.execCommand("copy");

      document.body.removeChild(textArea);

      if (!copied) {
        throw new Error("Clipboard operation failed.");
      }

      addToast({
        title: "Alert Copied",
        message: "Emergency broadcast text copied.",
        type: "info",
      });
    } catch (error) {
      // User cancelling native share is not a system failure.
      if (error?.name === "AbortError") {
        return;
      }

      console.error("Alert sharing failed:", error);

      addToast({
        title: "Share Failed",
        message:
          "Unable to share or copy this emergency alert.",
        type: "error",
      });
    } finally {
      setIsSharing(false);
    }
  }, [
    addToast,
    getBroadcastMessage,
    isSharing,
    severity.label,
  ]);

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  return (
    <article
      className={`
        alert-card-pro
        card-${severity.className}
        ${acknowledged ? "acknowledged" : ""}
        ${isPlayingSiren ? "siren-active" : ""}
      `}
      aria-label={`${severity.label} disaster alert for ${location}`}
    >
      {/* ======================================================
          TOP HEADER
          ====================================================== */}

      <div className="alert-card-header">
        <div className="alert-badge-group">

          {/* Severity Badge */}
          <span
            className={`alert-pill ${severity.className}`}
            title={severity.description}
          >
            <SeverityIcon
              size={14}
              className="alert-icon-mini"
              aria-hidden="true"
            />

            <span>{severity.label}</span>
          </span>

          {/* Hazard Type */}
          <span className="alert-type-tag">
            {type} Hazard
          </span>
        </div>

        {/* Live Status */}
        <div className="alert-live-status">
          <span className="live-dot" />
          <span>ACTIVE</span>
        </div>
      </div>

      {/* ======================================================
          META INFORMATION
          ====================================================== */}

      <div className="alert-meta-row">

        <div className="alert-time-chip">
          <Clock size={13} aria-hidden="true" />

          <span>
            {formattedTime}
          </span>
        </div>

        <span className="alert-date-text">
          {formattedDate}
        </span>

        <div className="alert-monitoring-chip">
          <Radio
            size={12}
            aria-hidden="true"
          />

          <span>Live Monitoring</span>
        </div>
      </div>

      {/* ======================================================
          ALERT BODY
          ====================================================== */}

      <div className="alert-card-body">

        {/* Location */}
        <div className="alert-loc-row">

          <div className="location-icon-wrapper">
            <MapPin
              size={17}
              className="loc-pin-icon"
              aria-hidden="true"
            />
          </div>

          <div className="location-content">
            <span className="location-label">
              INCIDENT LOCATION
            </span>

            <h4>
              {location}
            </h4>
          </div>
        </div>

        {/* Message */}
        <div className="alert-message-container">
          <p className="alert-msg-text">
            {message}
          </p>
        </div>
      </div>

      {/* ======================================================
          ALERT STATUS
          ====================================================== */}

      <div className="alert-status-bar">

        <div className="alert-status-indicator">
          <span className="status-pulse" />

          <span>
            {acknowledged
              ? "Operator Acknowledged"
              : "Awaiting Operator Acknowledgement"}
          </span>
        </div>

        <span className="alert-priority-text">
          Priority: {severity.label}
        </span>
      </div>

      {/* ======================================================
          ACTIONS
          ====================================================== */}

      <div className="alert-card-actions">

        <div className="action-buttons-left">

          {/* Siren */}
          <button
            type="button"
            className={`alert-btn icon-only ${
              isPlayingSiren ? "active" : ""
            }`}
            onClick={handlePlaySiren}
            disabled={isPlayingSiren}
            title={
              isPlayingSiren
                ? "Emergency tone active"
                : "Sound emergency warning tone"
            }
            aria-label={
              isPlayingSiren
                ? "Emergency tone active"
                : "Sound emergency warning tone"
            }
          >
            <Volume2
              size={16}
              aria-hidden="true"
            />

            {isPlayingSiren && (
              <span className="button-pulse" />
            )}
          </button>

          {/* Share */}
          <button
            type="button"
            className="alert-btn icon-only"
            onClick={handleShare}
            disabled={isSharing}
            title="Share or copy emergency advisory"
            aria-label="Share or copy emergency advisory"
          >
            <Share2
              size={16}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Acknowledge */}
        <button
          type="button"
          className={`ack-btn ${
            acknowledged ? "acked" : ""
          }`}
          onClick={handleAcknowledge}
          disabled={acknowledged}
          aria-pressed={acknowledged}
        >
          {acknowledged ? (
            <>
              <CheckCircle
                size={15}
                aria-hidden="true"
              />

              <span>
                Acknowledged
              </span>
            </>
          ) : (
            <>
              <span>
                Acknowledge Alert
              </span>
            </>
          )}
        </button>
      </div>

      {/* ======================================================
          ACKNOWLEDGED FOOTER
          ====================================================== */}

      {acknowledged && (
        <div className="alert-acknowledged-footer">
          <CheckCircle
            size={14}
            aria-hidden="true"
          />

          <span>
            This alert has been acknowledged by the operator.
          </span>
        </div>
      )}
    </article>
  );
}

export default AlertCard;