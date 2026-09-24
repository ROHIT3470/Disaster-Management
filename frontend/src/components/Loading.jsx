import {
  Radio,
  ShieldAlert,
  Activity,
  Wifi,
  Database,
} from "lucide-react";

function Loading({
  message = "Synchronizing live telemetry nodes...",
}) {
  // ------------------------------------------------------------
  // SAFE MESSAGE HANDLING
  // ------------------------------------------------------------

  const safeMessage =
    typeof message === "string" && message.trim().length > 0
      ? message.trim()
      : "Synchronizing live telemetry nodes...";

  return (
    <section
      className="pro-loading-screen"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Disaster early warning command system loading"
    >
      {/* ======================================================
          BACKGROUND AMBIENT EFFECTS
          ====================================================== */}

      <div className="loading-grid" aria-hidden="true" />
      <div className="loading-scanline" aria-hidden="true" />
      <div className="loading-vignette" aria-hidden="true" />

      {/* ======================================================
          TOP SYSTEM STATUS
          ====================================================== */}

      <div className="loading-system-status">
        <div className="system-status-left">
          <span className="system-live-indicator" />
          <span>COMMAND SYSTEM ONLINE</span>
        </div>

        <div className="system-status-right">
          <Wifi size={13} aria-hidden="true" />
          <span>SECURE LINK</span>
        </div>
      </div>

      {/* ======================================================
          MAIN LOADER
          ====================================================== */}

      <div className="loading-content">
        <div className="radar-loader-box" aria-hidden="true">
          {/* Radar Rings */}
          <div className="radar-circle circle-1" />
          <div className="radar-circle circle-2" />
          <div className="radar-circle circle-3" />

          {/* Radar Crosshair */}
          <div className="radar-crosshair horizontal" />
          <div className="radar-crosshair vertical" />

          {/* Radar Sweep */}
          <div className="radar-sweep" />

          {/* Radar Points */}
          <span className="radar-blip blip-1" />
          <span className="radar-blip blip-2" />
          <span className="radar-blip blip-3" />

          {/* Center */}
          <div className="radar-center">
            <div className="radar-center-glow" />

            <div className="radar-center-icon">
              <ShieldAlert
                size={30}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* ==================================================
            COMMAND TITLE
            ================================================== */}

        <div className="loading-heading">
          <div className="loading-eyebrow">
            <Radio size={14} aria-hidden="true" />
            <span>LIVE EARLY WARNING NETWORK</span>
          </div>

          <h1 className="loading-title">
            DISASTER EARLY WARNING
            <span>COMMAND</span>
          </h1>

          <p className="loading-subtitle">
            {safeMessage}
          </p>
        </div>

        {/* ==================================================
            ACTIVE PROCESSES
            ================================================== */}

        <div className="loading-process-panel">
          <div className="loading-process-header">
            <span>SYSTEM INITIALIZATION</span>
            <span className="loading-progress-text">
              ACTIVE
            </span>
          </div>

          <div className="loading-progress-track">
            <div className="loading-progress-bar">
              <span className="loading-progress-glow" />
            </div>
          </div>

          <div className="loading-process-grid">
            <div className="loading-process-item">
              <Activity
                size={14}
                aria-hidden="true"
              />

              <span>Telemetry</span>

              <strong>SYNC</strong>
            </div>

            <div className="loading-process-item">
              <Database
                size={14}
                aria-hidden="true"
              />

              <span>Data Stream</span>

              <strong>LIVE</strong>
            </div>

            <div className="loading-process-item">
              <Wifi
                size={14}
                aria-hidden="true"
              />

              <span>Network</span>

              <strong>SECURE</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          FOOTER STATUS
          ====================================================== */}

      <div className="loading-footer">
        <div className="loading-footer-item">
          <span className="footer-pulse" />
          <span>MONITORING ACTIVE</span>
        </div>

        <span className="loading-footer-divider">•</span>

        <div className="loading-footer-item">
          <span>REAL-TIME TELEMETRY</span>
        </div>

        <span className="loading-footer-divider">•</span>

        <div className="loading-footer-item">
          <span>SECURE OPERATIONS</span>
        </div>
      </div>
    </section>
  );
}

export default Loading;