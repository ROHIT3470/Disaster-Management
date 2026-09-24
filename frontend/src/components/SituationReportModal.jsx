import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";

import { downloadSituationReport } from "../utils/exportUtils";
import { useToast } from "../context/ToastContext";

function SituationReportModal({
  isOpen,
  onClose,
  data = {},
}) {
  const { addToast } = useToast();

  const [isDownloading, setIsDownloading] = useState(false);
  const [reportTime, setReportTime] = useState(new Date());

  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // ============================================================
  // LIVE REPORT TIME
  // ============================================================

  useEffect(() => {
    if (!isOpen) return;

    const updateTime = () => {
      setReportTime(new Date());
    };

    updateTime();

    const timer = window.setInterval(updateTime, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isOpen]);

  // ============================================================
  // ESCAPE KEY
  // ============================================================

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // ============================================================
  // FOCUS CLOSE BUTTON WHEN MODAL OPENS
  // ============================================================

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  // ============================================================
  // NORMALIZED DATA
  // ============================================================

  const normalized = useMemo(() => {
    const alerts = Array.isArray(data?.alerts)
      ? data.alerts
      : [];

    const sensors = Array.isArray(data?.sensors)
      ? data.sensors
      : [];

    const overallRisk = Number(data?.overallRisk);

    const floodRisk = Number(data?.floodRisk);

    const landslideRisk = Number(data?.landslideRisk);

    return {
      riskLevel: String(data?.riskLevel || "").trim(),
      overallRisk: Number.isFinite(overallRisk)
        ? Math.min(100, Math.max(0, overallRisk))
        : 72,
      floodRisk: Number.isFinite(floodRisk)
        ? Math.min(100, Math.max(0, floodRisk))
        : 68,
      landslideRisk: Number.isFinite(landslideRisk)
        ? Math.min(100, Math.max(0, landslideRisk))
        : 76,
      leadTime: String(
        data?.leadTime || "2–6 hours"
      ),
      alerts,
      sensors,
    };
  }, [data]);

  // ============================================================
  // RISK CLASSIFICATION
  // ============================================================

  const riskInfo = useMemo(() => {
    const level = normalized.riskLevel.toLowerCase();
    const score = normalized.overallRisk;

    if (
      level.includes("critical") ||
      score >= 85
    ) {
      return {
        level: "CRITICAL",
        className: "critical",
        icon: ShieldAlert,
        description:
          "Immediate operational attention required",
      };
    }

    if (
      level.includes("high") ||
      score >= 65
    ) {
      return {
        level: "HIGH",
        className: "high",
        icon: ShieldAlert,
        description:
          "Elevated hazard conditions detected",
      };
    }

    if (
      level.includes("moderate") ||
      score >= 40
    ) {
      return {
        level: "MODERATE",
        className: "moderate",
        icon: AlertTriangle,
        description:
          "Enhanced monitoring recommended",
      };
    }

    return {
      level: "LOW",
      className: "low",
      icon: ShieldCheck,
      description:
        "No immediate high-risk indicators",
    };
  }, [normalized.riskLevel, normalized.overallRisk]);

  const RiskIcon = riskInfo.icon;

  // ============================================================
  // SENSOR COUNT
  // ============================================================

  const onlineSensors = normalized.sensors.filter((sensor) => {
    const status = String(
      sensor?.status || "online"
    ).toLowerCase();

    return !(
      status.includes("off") ||
      status.includes("error") ||
      status.includes("fault")
    );
  }).length;

  // ============================================================
  // DOWNLOAD
  // ============================================================

  const handleDownload = async () => {
    if (isDownloading) return;

    try {
      setIsDownloading(true);

      await Promise.resolve(
        downloadSituationReport({
          ...data,
          riskLevel: riskInfo.level,
          overallRisk: normalized.overallRisk,
          floodRisk: normalized.floodRisk,
          landslideRisk: normalized.landslideRisk,
          leadTime: normalized.leadTime,
        })
      );

      addToast?.({
        title: "📥 SITREP Downloaded",
        message:
          "Daily Situation Report was generated successfully.",
        type: "success",
      });

      onClose?.();
    } catch (error) {
      console.error(
        "Situation report download failed:",
        error
      );

      addToast?.({
        title: "Unable to Download",
        message:
          "The SITREP could not be generated. Please try again.",
        type: "error",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // ============================================================
  // BACKDROP
  // ============================================================

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  // ============================================================
  // ALERT LEVEL
  // ============================================================

  const getAlertClass = (level) => {
    const value = String(level || "").toLowerCase();

    if (
      value.includes("critical") ||
      value.includes("danger")
    ) {
      return "critical";
    }

    if (
      value.includes("high") ||
      value.includes("warning") ||
      value.includes("warn")
    ) {
      return "high";
    }

    if (value.includes("moderate")) {
      return "moderate";
    }

    return "normal";
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-backdrop sitrep-backdrop"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`modal-card sitrep-modal sitrep-${riskInfo.className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sitrep-title"
        aria-describedby="sitrep-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* ====================================================
            MODAL HEADER
            ==================================================== */}

        <header className="modal-header sitrep-header">
          <div className="modal-title-wrap">
            <div
              className={`modal-icon-badge primary sitrep-icon-${riskInfo.className}`}
            >
              <FileText size={22} strokeWidth={2.1} />
            </div>

            <div className="sitrep-title-content">
              <div className="sitrep-overline">
                <span className="official-indicator">
                  <span />
                  OFFICIAL OPERATIONS DOCUMENT
                </span>

                <span className="sitrep-reference">
                  SITREP / LIVE
                </span>
              </div>

              <h3 id="sitrep-title">
                Daily Situation Report
              </h3>

              <p id="sitrep-description">
                Himalayan Region Early Warning & Risk
                Assessment
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="modal-close sitrep-close-btn"
            onClick={onClose}
            aria-label="Close situation report"
            title="Close"
          >
            <X size={18} />
          </button>
        </header>

        {/* ====================================================
            REPORT META BAR
            ==================================================== */}

        <div className="sitrep-meta-strip">
          <div className="sitrep-meta-left">
            <div className="report-id">
              <span>DOCUMENT TYPE</span>
              <strong>DAILY SITREP</strong>
            </div>

            <div className="meta-divider" />

            <div className="report-time-display">
              <Clock3 size={14} />

              <div>
                <span>ISSUED</span>
                <strong>
                  {reportTime.toLocaleString([], {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </strong>
              </div>
            </div>
          </div>

          <div
            className={`threat-pill threat-${riskInfo.className}`}
          >
            <RiskIcon size={15} />

            <div>
              <span>THREAT LEVEL</span>
              <strong>
                {riskInfo.level} ·{" "}
                {normalized.overallRisk}%
              </strong>
            </div>
          </div>
        </div>

        {/* ====================================================
            REPORT CONTENT
            ==================================================== */}

        <div className="sitrep-preview-box">
          {/* Risk overview */}
          <section className="sitrep-risk-overview">
            <div className="risk-overview-main">
              <span className="section-kicker">
                CURRENT REGIONAL THREAT
              </span>

              <div className="risk-score-display">
                <strong>
                  {normalized.overallRisk}
                </strong>
                <span>%</span>
              </div>

              <div className="risk-status-line">
                <span
                  className={`risk-status-dot ${riskInfo.className}`}
                />

                <strong>{riskInfo.level}</strong>

                <span>—</span>

                <span>
                  {riskInfo.description}
                </span>
              </div>
            </div>

            <div className="risk-meter">
              <div className="risk-meter-scale">
                <span>LOW</span>
                <span>MODERATE</span>
                <span>HIGH</span>
                <span>CRITICAL</span>
              </div>

              <div
                className="risk-meter-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={normalized.overallRisk}
                aria-label={`Overall risk: ${normalized.overallRisk}%`}
              >
                <div
                  className={`risk-meter-fill ${riskInfo.className}`}
                  style={{
                    width: `${normalized.overallRisk}%`,
                  }}
                />
              </div>
            </div>
          </section>

          {/* ==================================================
              THREAT METRICS
              ================================================== */}

          <section className="sitrep-section">
            <div className="sitrep-section-heading">
              <div>
                <span className="section-kicker">
                  HAZARD ASSESSMENT
                </span>

                <h4>Regional Risk Indicators</h4>
              </div>

              <span className="section-status">
                <RefreshCw size={12} />
                LIVE DATA
              </span>
            </div>

            <div className="sitrep-grid">
              <div className="sitrep-item risk-metric-flood">
                <div className="metric-top">
                  <span>Flood Threat</span>
                  <span className="metric-tag">
                    HYDRO
                  </span>
                </div>

                <strong>
                  {normalized.floodRisk}%
                </strong>

                <div className="metric-bar">
                  <span
                    style={{
                      width: `${normalized.floodRisk}%`,
                    }}
                  />
                </div>

                <small>
                  River & precipitation indicators
                </small>
              </div>

              <div className="sitrep-item risk-metric-landslide">
                <div className="metric-top">
                  <span>Landslide Threat</span>
                  <span className="metric-tag">
                    GEO
                  </span>
                </div>

                <strong>
                  {normalized.landslideRisk}%
                </strong>

                <div className="metric-bar">
                  <span
                    style={{
                      width: `${normalized.landslideRisk}%`,
                    }}
                  />
                </div>

                <small>
                  Slope & soil stability indicators
                </small>
              </div>

              <div className="sitrep-item">
                <div className="metric-top">
                  <span>Expected Lead Time</span>
                  <span className="metric-tag">
                    FORECAST
                  </span>
                </div>

                <strong className="lead-time-value">
                  {normalized.leadTime}
                </strong>

                <small>
                  Estimated warning window
                </small>
              </div>

              <div className="sitrep-item">
                <div className="metric-top">
                  <span>Telemetry Network</span>
                  <span className="metric-tag">
                    IOT
                  </span>
                </div>

                <strong className="node-count-value">
                  {onlineSensors}/{normalized.sensors.length}
                </strong>

                <small>
                  {normalized.sensors.length === 0
                    ? "No sensor data available"
                    : "Nodes reporting successfully"}
                </small>
              </div>
            </div>
          </section>

          {/* ==================================================
              ACTIVE WARNINGS
              ================================================== */}

          <section className="sitrep-section">
            <div className="sitrep-section-heading">
              <div>
                <span className="section-kicker">
                  OPERATIONAL PRIORITY
                </span>

                <h4>
                  Active Priority Warnings
                  <span className="heading-count">
                    {normalized.alerts.length}
                  </span>
                </h4>
              </div>

              {normalized.alerts.length === 0 ? (
                <span className="section-status status-clear">
                  <CheckCircle2 size={12} />
                  CLEAR
                </span>
              ) : (
                <span className="section-status status-attention">
                  <AlertTriangle size={12} />
                  ATTENTION
                </span>
              )}
            </div>

            <div className="sitrep-alert-list">
              {normalized.alerts.length > 0 ? (
                normalized.alerts.map((alert, index) => {
                  const alertClass = getAlertClass(
                    alert?.level
                  );

                  const alertKey =
                    alert?._id ||
                    alert?.id ||
                    `${alert?.location || "unknown"}-${
                      alert?.message || "alert"
                    }-${index}`;

                  return (
                    <div
                      key={alertKey}
                      className={`sitrep-alert-row alert-${alertClass}`}
                    >
                      <div className="alert-severity-icon">
                        <AlertTriangle size={14} />
                      </div>

                      <div className="alert-content">
                        <div className="alert-top-line">
                          <span
                            className={`status-badge-mini ${alertClass}`}
                          >
                            {String(
                              alert?.level ||
                                "WARNING"
                            ).toUpperCase()}
                          </span>

                          {alert?.location && (
                            <span className="sitrep-alert-loc">
                              <MapPin size={11} />
                              {String(
                                alert.location
                              )}
                            </span>
                          )}
                        </div>

                        <p className="sitrep-alert-desc">
                          {String(
                            alert?.message ||
                              "No additional alert details available."
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="sitrep-empty-state">
                  <div className="empty-state-icon">
                    <CheckCircle2 size={19} />
                  </div>

                  <div>
                    <strong>
                      No critical alerts currently active
                    </strong>

                    <p>
                      Regional monitoring systems report
                      no active priority warnings.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ====================================================
            FOOTER
            ==================================================== */}

        <footer className="modal-footer sitrep-footer">
          <div className="sitrep-footer-info">
            <div className="footer-security-icon">
              <ShieldCheck size={14} />
            </div>

            <div>
              <strong>
                Operational Use · Verified Telemetry
              </strong>

              <span>
                Information reflects the latest available
                monitoring data.
              </span>
            </div>
          </div>

          <div className="sitrep-footer-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isDownloading}
            >
              Close
            </button>

            <button
              type="button"
              className="btn-primary sitrep-download-btn"
              onClick={handleDownload}
              disabled={isDownloading}
              aria-busy={isDownloading}
            >
              {isDownloading ? (
                <>
                  <RefreshCw
                    size={17}
                    className="sitrep-spin"
                  />
                  Generating…
                </>
              ) : (
                <>
                  <Download size={17} />
                  Download SITREP
                  <span className="download-format">
                    .TXT
                  </span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default SituationReportModal;