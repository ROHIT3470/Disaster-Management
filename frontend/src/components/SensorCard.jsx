import {
  Battery,
  BatteryCharging,
  CloudRain,
  Clock3,
  Layers,
  MapPin,
  Mountain,
  Radio,
  Signal,
  Thermometer,
  Waves,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function SensorCard({ sensor = {} }) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // ============================================================
  // LIVE CLOCK
  // ============================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ============================================================
  // SAFE SENSOR VALUES
  // ============================================================

  const sensorType = String(sensor.type || "Unknown Sensor");
  const sensorId = String(sensor.sensorId || "N/A");
  const sensorLocation = String(sensor.location || "Location unavailable");
  const sensorStatus = String(sensor.status || "online").toLowerCase();

  // ============================================================
  // SENSOR ICON
  // ============================================================

  const SensorIcon = useMemo(() => {
    const type = sensorType.toLowerCase();

    if (type.includes("rain") || type.includes("precip")) {
      return CloudRain;
    }

    if (
      type.includes("soil") ||
      type.includes("moisture") ||
      type.includes("humidity")
    ) {
      return Layers;
    }

    if (
      type.includes("slope") ||
      type.includes("landslide") ||
      type.includes("tilt") ||
      type.includes("angle")
    ) {
      return Mountain;
    }

    if (
      type.includes("water") ||
      type.includes("river") ||
      type.includes("level") ||
      type.includes("flood")
    ) {
      return Waves;
    }

    if (
      type.includes("temp") ||
      type.includes("thermal") ||
      type.includes("heat")
    ) {
      return Thermometer;
    }

    return Radio;
  }, [sensorType]);

  // ============================================================
  // STATUS
  // ============================================================

  const statusInfo = useMemo(() => {
    const status = sensorStatus;

    if (
      status.includes("critical") ||
      status.includes("danger") ||
      status.includes("alert")
    ) {
      return {
        className: "critical",
        label: "CRITICAL",
        description: "Immediate attention required",
      };
    }

    if (
      status.includes("warn") ||
      status.includes("unstable") ||
      status.includes("degraded")
    ) {
      return {
        className: "warning",
        label: "WARNING",
        description: "Sensor requires attention",
      };
    }

    if (
      status.includes("off") ||
      status.includes("offline") ||
      status.includes("error") ||
      status.includes("fault")
    ) {
      return {
        className: "offline",
        label: "OFFLINE",
        description: "Connection unavailable",
      };
    }

    if (status.includes("maintenance")) {
      return {
        className: "maintenance",
        label: "MAINTENANCE",
        description: "Maintenance mode active",
      };
    }

    return {
      className: "online",
      label: "ONLINE",
      description: "Sensor operating normally",
    };
  }, [sensorStatus]);

  // ============================================================
  // BATTERY
  // ============================================================

  const batteryPct = useMemo(() => {
    const value = Number(sensor.battery);

    if (Number.isFinite(value)) {
      return Math.min(100, Math.max(0, value));
    }

    // Safe deterministic fallback for mock/demo data.
    const seed =
      sensorId !== "N/A"
        ? sensorId.charCodeAt(sensorId.length - 1) || 75
        : 75;

    return 70 + (seed % 31);
  }, [sensor.battery, sensorId]);

  const BatteryIcon = batteryPct <= 20 ? Battery : BatteryCharging;

  const batteryClass =
    batteryPct <= 20
      ? "danger"
      : batteryPct <= 40
        ? "warning"
        : "healthy";

  // ============================================================
  // SIGNAL / RSSI
  // ============================================================

  const signalDbm = useMemo(() => {
    const value = Number(sensor.rssi ?? sensor.signalStrength);

    if (Number.isFinite(value)) {
      return Math.round(value);
    }

    // Safe deterministic fallback.
    const seed =
      sensorId !== "N/A" ? sensorId.charCodeAt(0) || 70 : 70;

    return -45 - (seed % 36);
  }, [sensor.rssi, sensor.signalStrength, sensorId]);

  const signalClass =
    signalDbm >= -60
      ? "excellent"
      : signalDbm >= -70
        ? "good"
        : signalDbm >= -80
          ? "fair"
          : "poor";

  // ============================================================
  // LAST SEEN / FRESHNESS
  // ============================================================

  const lastSeenInfo = useMemo(() => {
    if (!sensor.lastSeen) {
      return {
        text: "Just now",
        freshness: "live",
      };
    }

    const timestamp = new Date(sensor.lastSeen).getTime();

    if (Number.isNaN(timestamp)) {
      return {
        text: "Unknown",
        freshness: "unknown",
      };
    }

    const diffSeconds = Math.max(
      0,
      Math.floor((currentTime - timestamp) / 1000)
    );

    if (diffSeconds <= 10) {
      return {
        text: "Live",
        freshness: "live",
      };
    }

    if (diffSeconds <= 60) {
      return {
        text: `${diffSeconds}s ago`,
        freshness: "fresh",
      };
    }

    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffMinutes < 60) {
      return {
        text: `${diffMinutes}m ago`,
        freshness: "recent",
      };
    }

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) {
      return {
        text: `${diffHours}h ago`,
        freshness: "stale",
      };
    }

    const diffDays = Math.floor(diffHours / 24);

    return {
      text: `${diffDays}d ago`,
      freshness: "stale",
    };
  }, [sensor.lastSeen, currentTime]);

  // ============================================================
  // VALUE FORMATTING
  // ============================================================

  const formattedValue = useMemo(() => {
    if (
      sensor.value === null ||
      sensor.value === undefined ||
      sensor.value === ""
    ) {
      return "--";
    }

    if (typeof sensor.value === "number") {
      return Number.isInteger(sensor.value)
        ? sensor.value
        : sensor.value.toFixed(2);
    }

    return String(sensor.value);
  }, [sensor.value]);

  // ============================================================
  // ACCESSIBILITY LABEL
  // ============================================================

  const ariaLabel = `${sensorType} sensor ${sensorId}, status ${statusInfo.label}, value ${formattedValue}`;

  return (
    <article
      className={`sensor-card-pro status-${statusInfo.className}`}
      aria-label={ariaLabel}
    >
      {/* ======================================================
          TOP ACCENT
      ====================================================== */}

      <div className="sensor-card-top-line" />

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="sensor-card-header">
        <div className="sensor-type-wrap">
          <div
            className={`sensor-icon-box ${statusInfo.className}`}
            aria-hidden="true"
          >
            <SensorIcon size={19} strokeWidth={2.2} />
            <span className="sensor-icon-glow" />
          </div>

          <div className="sensor-heading-content">
            <div className="sensor-title-row">
              <span className="sensor-type-name">{sensorType}</span>

              <span className="sensor-live-indicator">
                <span className="live-dot" />
                LIVE
              </span>
            </div>

            <span className="sensor-id-code">
              ID: {sensorId}
            </span>
          </div>
        </div>

        <div
          className={`sensor-status-chip ${statusInfo.className}`}
          title={statusInfo.description}
        >
          <span className="status-pulse-dot" />
          <span>{statusInfo.label}</span>
        </div>
      </div>

      {/* ======================================================
          VALUE
      ====================================================== */}

      <div className="sensor-value-block">
        <div className="sensor-value-label">
          <span>Current Reading</span>

          {statusInfo.className === "online" && (
            <span className="reading-active">
              <Zap size={12} />
              ACTIVE
            </span>
          )}
        </div>

        <div className="value-display">
          <span className="sensor-main-number">{formattedValue}</span>

          {sensor.unit && (
            <span className="sensor-unit">
              {String(sensor.unit)}
            </span>
          )}
        </div>

        <div className="sensor-loc-row">
          <MapPin size={13} className="loc-pin-mini" />
          <span title={sensorLocation}>{sensorLocation}</span>
        </div>
      </div>

      {/* ======================================================
          TELEMETRY
      ====================================================== */}

      <div className="sensor-telemetry-meta">
        {/* Battery */}
        <div className={`telemetry-pill battery-${batteryClass}`}>
          <BatteryIcon size={14} />

          <span className="telemetry-label">BAT</span>

          <strong>{batteryPct}%</strong>

          <div className="mini-progress">
            <span
              style={{
                width: `${batteryPct}%`,
              }}
            />
          </div>
        </div>

        {/* Signal */}
        <div className={`telemetry-pill signal-${signalClass}`}>
          {signalDbm >= -80 ? (
            <Signal size={14} />
          ) : (
            <WifiOff size={14} />
          )}

          <span className="telemetry-label">RSSI</span>
          <strong>{signalDbm} dBm</strong>
        </div>

        {/* Last Seen */}
        <div
          className={`telemetry-pill freshness-${lastSeenInfo.freshness}`}
        >
          <Clock3 size={14} />

          <span className="telemetry-label">SYNC</span>

          <strong>{lastSeenInfo.text}</strong>
        </div>
      </div>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div className="sensor-card-footer">
        <div className="connection-state">
          <Wifi size={13} />

          <span>
            {statusInfo.className === "offline"
              ? "Connection lost"
              : "Telemetry connection stable"}
          </span>
        </div>

        <div className="sensor-data-stream">
          <span className="stream-bar bar-1" />
          <span className="stream-bar bar-2" />
          <span className="stream-bar bar-3" />
          <span className="stream-bar bar-4" />
          <span className="stream-bar bar-5" />
        </div>
      </div>
    </article>
  );
}

export default SensorCard;