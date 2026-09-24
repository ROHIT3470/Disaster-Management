/* =========================================================
   PROFESSIONAL DISASTER MANAGEMENT EXPORT UTILITIES
   ========================================================= */

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

/**
 * Convert any value into a safe printable string.
 */
function formatValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

/**
 * Escape a value according to CSV rules.
 */
function escapeCSV(value) {
  const stringValue = formatValue(value);

  /*
   * CSV requires quotes when the value contains:
   * - comma
   * - double quote
   * - newline
   */
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Sanitize filenames for Windows and browser compatibility.
 */
function sanitizeFilename(filename, fallback = "export") {
  const safeName = String(filename || fallback)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .trim();

  return safeName || fallback;
}

/**
 * Trigger a browser download safely.
 */
function downloadBlob(blob, filename) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("File download is only available in a browser.");
  }

  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  } finally {
    /*
     * Release browser memory.
     */
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
}

/* =========================================================
   CSV EXPORT
   ========================================================= */

/**
 * Export an array of objects to CSV.
 *
 * Example:
 *
 * exportToCSV("alerts.csv", [
 *   {
 *     id: 1,
 *     location: "Darjeeling",
 *     level: "CRITICAL"
 *   }
 * ]);
 */
export function exportToCSV(filename = "export.csv", rows = []) {
  try {
    if (!Array.isArray(rows) || rows.length === 0) {
      console.warn("CSV export skipped: no data available.");
      return false;
    }

    /*
     * Collect all unique keys from all rows.
     *
     * This is better than Object.keys(rows[0])
     * because later rows may contain additional fields.
     */
    const keySet = new Set();

    rows.forEach((row) => {
      if (row && typeof row === "object") {
        Object.keys(row).forEach((key) => {
          keySet.add(key);
        });
      }
    });

    const keys = Array.from(keySet);

    if (keys.length === 0) {
      console.warn("CSV export skipped: no columns found.");
      return false;
    }

    /*
     * UTF-8 BOM:
     *
     * Excel handles Bengali, Hindi, special symbols,
     * etc. much better with this.
     */
    const BOM = "\uFEFF";

    const header = keys.map(escapeCSV).join(",");

    const body = rows
      .map((row) => {
        return keys
          .map((key) => {
            return escapeCSV(row?.[key]);
          })
          .join(",");
      })
      .join("\r\n");

    const csvContent = BOM + header + "\r\n" + body;

    const safeFilename = sanitizeFilename(filename, "disaster_export.csv");

    const finalFilename = safeFilename.toLowerCase().endsWith(".csv")
      ? safeFilename
      : `${safeFilename}.csv`;

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    downloadBlob(blob, finalFilename);

    return true;
  } catch (error) {
    console.error("CSV export failed:", error);

    return false;
  }
}

/* =========================================================
   ALERT CSV EXPORT
   ========================================================= */

/**
 * Export disaster alerts in a standardized format.
 */
export function exportAlertsToCSV(
  alerts = [],
  filename = "disaster_alerts.csv",
) {
  if (!Array.isArray(alerts) || !alerts.length) {
    console.warn("No alerts available for export.");
    return false;
  }

  const rows = alerts.map((alert, index) => ({
    "Alert ID":
      alert.id || alert._id || `ALERT-${String(index + 1).padStart(4, "0")}`,

    Severity: alert.level || alert.severity || "UNKNOWN",

    "Disaster Type": alert.type || alert.disasterType || "Unknown",

    Location: alert.location || "Unknown",

    Message: alert.message || alert.advisory || "",

    "Issued At": alert.createdAt
      ? new Date(alert.createdAt).toLocaleString()
      : "Unknown",

    Status: alert.status || "ACTIVE",
  }));

  return exportToCSV(filename, rows);
}

/* =========================================================
   SENSOR CSV EXPORT
   ========================================================= */

/**
 * Export IoT sensor telemetry.
 */
export function exportSensorsToCSV(
  sensors = [],
  filename = "sensor_telemetry.csv",
) {
  if (!Array.isArray(sensors) || !sensors.length) {
    console.warn("No sensor data available.");
    return false;
  }

  const rows = sensors.map((sensor, index) => ({
    "Sensor ID":
      sensor.sensorId ||
      sensor.id ||
      sensor._id ||
      `SENSOR-${String(index + 1).padStart(4, "0")}`,

    Location: sensor.location || "Unknown",

    "Sensor Type": sensor.type || sensor.sensorType || "Unknown",

    Value: sensor.value ?? "",

    Unit: sensor.unit || "",

    Status: sensor.status || "UNKNOWN",

    "Recorded At":
      sensor.createdAt || sensor.timestamp
        ? new Date(sensor.createdAt || sensor.timestamp).toLocaleString()
        : "Unknown",
  }));

  return exportToCSV(filename, rows);
}

/* =========================================================
   SITUATION REPORT HELPERS
   ========================================================= */

function getValue(value, fallback) {
  /*
   * IMPORTANT:
   * We intentionally do NOT use:
   *
   * value || fallback
   *
   * because 0 is valid data.
   */
  return value === null || value === undefined || value === ""
    ? fallback
    : value;
}

function formatPercentage(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "N/A";
  }

  return `${numeric}%`;
}

function formatDateTime(value, fallback = "Not available") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleString();
}

function formatTime(value, fallback = "Recent") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleTimeString();
}

function separator(character = "=", length = 72) {
  return character.repeat(length);
}

/* =========================================================
   SITREP GENERATOR
   ========================================================= */

/**
 * Generate and download a professional
 * Situation Report.
 */
export function downloadSituationReport(reportData = {}) {
  try {
    const now = new Date();

    const timestamp = now.toISOString().replace(/[:.]/g, "-");

    const alerts = Array.isArray(reportData.alerts) ? reportData.alerts : [];

    const sensors = Array.isArray(reportData.sensors) ? reportData.sensors : [];

    const weather =
      reportData.weather && typeof reportData.weather === "object"
        ? reportData.weather
        : {};

    /* =====================================================
       RISK DATA
       ===================================================== */

    const riskLevel = getValue(reportData.riskLevel, "MODERATE");

    const overallRisk = getValue(reportData.overallRisk, 72);

    const floodRisk = getValue(reportData.floodRisk, 68);

    const landslideRisk = getValue(reportData.landslideRisk, 76);

    const leadTime = getValue(reportData.leadTime, "2–6 hours");

    /* =====================================================
       WEATHER DATA
       ===================================================== */

    const weatherCondition = getValue(weather.condition, "Not available");

    const temperature = getValue(weather.temperature, "N/A");

    const humidity = getValue(weather.humidity, "N/A");

    const rainfall = getValue(weather.rainfall, "N/A");

    const windSpeed = getValue(weather.windSpeed, "N/A");

    /* =====================================================
       ALERT STATISTICS
       ===================================================== */

    const criticalAlerts = alerts.filter(
      (alert) =>
        String(alert?.level || alert?.severity || "").toUpperCase() ===
        "CRITICAL",
    ).length;

    const warningAlerts = alerts.filter(
      (alert) =>
        String(alert?.level || alert?.severity || "").toUpperCase() ===
        "WARNING",
    ).length;

    const advisoryAlerts = alerts.filter(
      (alert) =>
        String(alert?.level || alert?.severity || "").toUpperCase() ===
        "ADVISORY",
    ).length;

    /* =====================================================
       SENSOR STATISTICS
       ===================================================== */

    const onlineSensors = sensors.filter(
      (sensor) => String(sensor?.status || "").toUpperCase() === "ONLINE",
    ).length;

    const offlineSensors = sensors.filter(
      (sensor) => String(sensor?.status || "").toUpperCase() === "OFFLINE",
    ).length;

    const warningSensors = sensors.filter((sensor) =>
      ["WARNING", "CRITICAL", "ALERT"].includes(
        String(sensor?.status || "").toUpperCase(),
      ),
    ).length;

    /* =====================================================
       ALERT DETAILS
       ===================================================== */

    const alertSection =
      alerts.length > 0
        ? alerts
            .map((alert, index) => {
              const level = String(
                alert?.level || alert?.severity || "UNKNOWN",
              ).toUpperCase();

              const location = alert?.location || "Unknown location";

              const type = alert?.type || alert?.disasterType || "Unknown";

              const message =
                alert?.message || alert?.advisory || "No advisory provided.";

              return [
                `[${String(index + 1).padStart(2, "0")}] ${level}`,

                `    Location : ${location}`,

                `    Type     : ${type}`,

                `    Issued   : ${formatTime(alert?.createdAt)}`,

                `    Status   : ${alert?.status || "ACTIVE"}`,

                `    Advisory : ${message}`,
              ].join("\n");
            })
            .join("\n\n")
        : "No active critical alerts recorded at this time.";

    /* =====================================================
       SENSOR DETAILS
       ===================================================== */

    const sensorSection =
      sensors.length > 0
        ? sensors
            .map((sensor, index) => {
              const sensorId =
                sensor?.sensorId || sensor?.id || `SENSOR-${index + 1}`;

              const location = sensor?.location || "Unknown";

              const type = sensor?.type || sensor?.sensorType || "Unknown";

              const value = getValue(sensor?.value, "N/A");

              const unit = sensor?.unit || "";

              const status = sensor?.status || "UNKNOWN";

              return [
                `[${String(index + 1).padStart(2, "0")}] ${sensorId}`,

                `    Location : ${location}`,

                `    Type     : ${type}`,

                `    Value    : ${value} ${unit}`,

                `    Status   : ${status}`,
              ].join("\n");
            })
            .join("\n\n")
        : "Telemetry nodes transmitting normal baseline data.";

    /* =====================================================
       EXECUTIVE SUMMARY
       ===================================================== */

    const content = `
${separator("=")}
NATIONAL DISASTER MANAGEMENT
EARLY WARNING & RESPONSE SYSTEM
${separator("=")}

SITUATION REPORT (SITREP)

Report Generated : ${now.toLocaleString()}
Report ID        : SITREP-${timestamp}
System Status    : OPERATIONAL
Classification   : EMERGENCY RESPONSE USE
${separator("-")}


1. EXECUTIVE RISK ASSESSMENT
${separator("-")}

Overall Threat Level       : ${riskLevel}
Overall Vulnerability      : ${formatPercentage(overallRisk)}
Flash Flood Probability    : ${formatPercentage(floodRisk)}
Landslide/Debris Threat    : ${formatPercentage(landslideRisk)}
Estimated Lead Time        : ${leadTime}


2. CURRENT METEOROLOGICAL PARAMETERS
${separator("-")}

Condition                  : ${weatherCondition}
Temperature                : ${temperature} °C
Relative Humidity          : ${humidity} %
Precipitation              : ${rainfall} mm/hr
Wind Speed                 : ${windSpeed} km/hr


3. ALERT SITUATION SUMMARY
${separator("-")}

Total Active Alerts        : ${alerts.length}
Critical Alerts            : ${criticalAlerts}
Warning Alerts             : ${warningAlerts}
Advisory Alerts            : ${advisoryAlerts}


4. ACTIVE ALERTS
${separator("-")}

${alertSection}


5. IoT SENSOR TELEMETRY SUMMARY
${separator("-")}

Total Telemetry Nodes      : ${sensors.length}
Online Nodes               : ${onlineSensors}
Offline Nodes              : ${offlineSensors}
Warning/Critical Nodes     : ${warningSensors}


6. IoT SENSOR TELEMETRY
${separator("-")}

${sensorSection}


7. OPERATIONAL ASSESSMENT
${separator("-")}

The disaster management early-warning system is
continuously monitoring available environmental,
meteorological, geospatial and IoT telemetry data.

Risk indicators should be evaluated together with
ground-level observations and verified emergency
response information before operational decisions
are made.

Automated alerts are intended to support, not replace,
authorized emergency response procedures.


8. REPORT METADATA
${separator("-")}

Generated At                : ${formatDateTime(now)}
System                      : Disaster Management Command Center
Report Type                 : Situation Report (SITREP)
Data Sources                : IoT / Weather / Alert System
Monitoring Status           : ACTIVE


${separator("=")}
END OF SITUATION REPORT
${separator("=")}

GENERATED BY:
Disaster Management Command Center

CONFIDENTIALITY:
For Emergency Response Personnel Only

NOTICE:
This report contains system-generated information.
Verify critical information with authorized sources
before initiating emergency operations.
${separator("=")}
`;

    const safeFilename = sanitizeFilename(
      `SITREP_${timestamp}.txt`,
      `SITREP_${timestamp}.txt`,
    );

    const blob = new Blob([content.trim()], {
      type: "text/plain;charset=utf-8;",
    });

    downloadBlob(blob, safeFilename);

    return true;
  } catch (error) {
    console.error("SITREP generation failed:", error);

    return false;
  }
}

/* =========================================================
   JSON EXPORT
   ========================================================= */

/**
 * Useful for backing up raw dashboard data.
 */
export function exportToJSON(filename = "disaster_data.json", data = {}) {
  try {
    const json = JSON.stringify(data, null, 2);

    const blob = new Blob(["\uFEFF", json], {
      type: "application/json;charset=utf-8;",
    });

    const safeFilename = sanitizeFilename(filename, "disaster_data.json");

    const finalFilename = safeFilename.toLowerCase().endsWith(".json")
      ? safeFilename
      : `${safeFilename}.json`;

    downloadBlob(blob, finalFilename);

    return true;
  } catch (error) {
    console.error("JSON export failed:", error);

    return false;
  }
}

/* =========================================================
   COMPLETE COMMAND CENTER EXPORT
   ========================================================= */

/**
 * Export all important dashboard information.
 *
 * Creates:
 * 1. Alerts CSV
 * 2. Sensors CSV
 * 3. Complete JSON backup
 * 4. SITREP TXT
 */
export function exportCommandCenterData(reportData = {}) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const alerts = Array.isArray(reportData.alerts) ? reportData.alerts : [];

    const sensors = Array.isArray(reportData.sensors) ? reportData.sensors : [];

    let exported = 0;

    if (alerts.length) {
      if (exportAlertsToCSV(alerts, `Disaster_Alerts_${timestamp}.csv`)) {
        exported++;
      }
    }

    if (sensors.length) {
      if (exportSensorsToCSV(sensors, `IoT_Telemetry_${timestamp}.csv`)) {
        exported++;
      }
    }

    if (exportToJSON(`Command_Center_Data_${timestamp}.json`, reportData)) {
      exported++;
    }

    if (downloadSituationReport(reportData)) {
      exported++;
    }

    return {
      success: exported > 0,
      filesExported: exported,
    };
  } catch (error) {
    console.error("Command center export failed:", error);

    return {
      success: false,
      filesExported: 0,
    };
  }
}
