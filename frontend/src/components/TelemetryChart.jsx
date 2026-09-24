import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CloudRain,
  Droplets,
  Gauge,
  Radio,
  TrendingUp,
  Wifi,
} from "lucide-react";

import { useTheme } from "../context/ThemeContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ============================================================
// CONFIGURATION
// ============================================================

const TELEMETRY_POINTS = [
  { time: "00:00", precipitation: 12, saturation: 45 },
  { time: "03:00", precipitation: 18, saturation: 48 },
  { time: "06:00", precipitation: 35, saturation: 52 },
  { time: "09:00", precipitation: 42, saturation: 58 },
  { time: "12:00", precipitation: 68, saturation: 64 },
  { time: "15:00", precipitation: 75, saturation: 70 },
  { time: "18:00", precipitation: 82, saturation: 75 },
  { time: "21:00", precipitation: 88, saturation: 77 },
];

// ============================================================
// HELPERS
// ============================================================

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const getRiskState = (precipitation, saturation) => {
  const score =
    precipitation * 0.55 +
    saturation * 0.45;

  if (score >= 80) {
    return {
      level: "CRITICAL",
      className: "critical",
    };
  }

  if (score >= 65) {
    return {
      level: "HIGH",
      className: "high",
    };
  }

  if (score >= 45) {
    return {
      level: "MODERATE",
      className: "moderate",
    };
  }

  return {
    level: "LOW",
    className: "low",
  };
};

// ============================================================
// COMPONENT
// ============================================================

function TelemetryChart({
  telemetry = TELEMETRY_POINTS,
  precipitationThreshold = 80,
  saturationThreshold = 80,
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [lastUpdated, setLastUpdated] =
    useState(new Date());

  // ==========================================================
  // LIVE UPDATE CLOCK
  // ==========================================================

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLastUpdated(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  // ==========================================================
  // SAFE TELEMETRY DATA
  // ==========================================================

  const safeTelemetry = useMemo(() => {
    if (!Array.isArray(telemetry) || telemetry.length === 0) {
      return [
        {
          time: "--",
          precipitation: 0,
          saturation: 0,
        },
      ];
    }

    return telemetry.map((point, index) => ({
      time:
        point?.time ||
        point?.timestamp ||
        `P${index + 1}`,

      precipitation: clamp(
        Number(point?.precipitation ?? point?.rainfall ?? 0) ||
          0,
        0,
        150
      ),

      saturation: clamp(
        Number(point?.saturation ?? point?.soilSaturation ?? 0) ||
          0,
        0,
        100
      ),
    }));
  }, [telemetry]);

  // ==========================================================
  // CURRENT VALUES
  // ==========================================================

  const currentPoint =
    safeTelemetry[safeTelemetry.length - 1];

  const previousPoint =
    safeTelemetry.length > 1
      ? safeTelemetry[safeTelemetry.length - 2]
      : currentPoint;

  const precipitation = currentPoint.precipitation;
  const saturation = currentPoint.saturation;

  const precipitationDelta =
    precipitation - previousPoint.precipitation;

  const saturationDelta =
    saturation - previousPoint.saturation;

  const riskState = getRiskState(
    precipitation,
    saturation
  );

  // ==========================================================
  // CHART COLORS
  // ==========================================================

  const chartText = isDark
    ? "#94a3b8"
    : "#64748b";

  const chartGrid = isDark
    ? "rgba(148, 163, 184, 0.08)"
    : "rgba(15, 23, 42, 0.07)";

  const tooltipBackground = isDark
    ? "#0f172a"
    : "#ffffff";

  const tooltipTitle = isDark
    ? "#f8fafc"
    : "#0f172a";

  const tooltipBody = isDark
    ? "#cbd5e1"
    : "#334155";

  const tooltipBorder = isDark
    ? "rgba(148, 163, 184, 0.18)"
    : "rgba(15, 23, 42, 0.1)";

  // ==========================================================
  // GRADIENT PLUGINS
  // ==========================================================

  const data = useMemo(
    () => ({
      labels: safeTelemetry.map(
        (point) => point.time
      ),

      datasets: [
        {
          label: "Precipitation",

          data: safeTelemetry.map(
            (point) => point.precipitation
          ),

          borderColor: "#38bdf8",

          backgroundColor: isDark
            ? "rgba(56, 189, 248, 0.09)"
            : "rgba(56, 189, 248, 0.08)",

          borderWidth: 2.5,

          fill: true,

          tension: 0.38,

          cubicInterpolationMode: "monotone",

          pointRadius: 2.5,
          pointHoverRadius: 6,

          pointBackgroundColor: "#38bdf8",
          pointBorderColor: isDark
            ? "#0f172a"
            : "#ffffff",

          pointBorderWidth: 2,

          yAxisID: "y",

          spanGaps: true,
        },

        {
          label: "Soil Saturation",

          data: safeTelemetry.map(
            (point) => point.saturation
          ),

          borderColor: "#f59e0b",

          backgroundColor: isDark
            ? "rgba(245, 158, 11, 0.06)"
            : "rgba(245, 158, 11, 0.05)",

          borderWidth: 2.5,

          fill: true,

          tension: 0.38,

          cubicInterpolationMode: "monotone",

          pointRadius: 2.5,
          pointHoverRadius: 6,

          pointBackgroundColor: "#f59e0b",
          pointBorderColor: isDark
            ? "#0f172a"
            : "#ffffff",

          pointBorderWidth: 2,

          yAxisID: "y1",

          spanGaps: true,
        },
      ],
    }),
    [safeTelemetry, isDark]
  );

  // ==========================================================
  // CHART OPTIONS
  // ==========================================================

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,

      animation: {
        duration: 600,
        easing: "easeOutQuart",
      },

      interaction: {
        mode: "index",
        intersect: false,
      },

      normalized: true,

      plugins: {
        legend: {
          display: true,

          position: "top",

          align: "start",

          labels: {
            color: isDark
              ? "#cbd5e1"
              : "#475569",

            font: {
              family:
                "Inter, ui-sans-serif, system-ui, sans-serif",

              size: 11,

              weight: "600",
            },

            usePointStyle: true,

            pointStyle: "circle",

            boxWidth: 7,

            boxHeight: 7,

            padding: 18,
          },
        },

        title: {
          display: false,
        },

        tooltip: {
          enabled: true,

          backgroundColor:
            tooltipBackground,

          titleColor: tooltipTitle,

          bodyColor: tooltipBody,

          borderColor:
            tooltipBorder,

          borderWidth: 1,

          padding: 11,

          displayColors: true,

          usePointStyle: true,

          boxPadding: 5,

          titleFont: {
            family:
              "Inter, ui-sans-serif, system-ui, sans-serif",

            size: 11,

            weight: "700",
          },

          bodyFont: {
            family:
              "Inter, ui-sans-serif, system-ui, sans-serif",

            size: 11,

            weight: "500",
          },

          callbacks: {
            title: (items) => {
              if (!items.length) {
                return "";
              }

              return `Telemetry · ${items[0].label}`;
            },

            label: (context) => {
              const value = context.parsed.y;

              if (context.datasetIndex === 0) {
                return `  Precipitation: ${value.toFixed(
                  1
                )} mm/h`;
              }

              return `  Soil Saturation: ${value.toFixed(
                1
              )}%`;
            },

            afterBody: (items) => {
              if (!items.length) {
                return "";
              }

              const index = items[0].dataIndex;

              const point =
                safeTelemetry[index];

              const state = getRiskState(
                point.precipitation,
                point.saturation
              );

              return [
                "",
                `Risk Assessment: ${state.level}`,
              ];
            },
          },
        },
      },

      scales: {
        x: {
          border: {
            display: false,
          },

          grid: {
            display: false,
          },

          ticks: {
            color: chartText,

            font: {
              family:
                "Inter, ui-sans-serif, system-ui, sans-serif",

              size: 10,

              weight: "500",
            },

            maxRotation: 0,

            autoSkip: true,

            padding: 7,
          },
        },

        y: {
          type: "linear",

          position: "left",

          min: 0,

          max: 100,

          border: {
            display: false,
          },

          grid: {
            color: chartGrid,

            drawTicks: false,
          },

          ticks: {
            color: chartText,

            padding: 9,

            font: {
              family:
                "Inter, ui-sans-serif, system-ui, sans-serif",

              size: 10,

              weight: "500",
            },

            callback: (value) =>
              `${value} mm`,
          },

          title: {
            display: true,

            text: "Rainfall",

            color: chartText,

            font: {
              size: 10,

              weight: "700",
            },

            padding: {
              bottom: 4,
            },
          },
        },

        y1: {
          type: "linear",

          position: "right",

          min: 0,

          max: 100,

          border: {
            display: false,
          },

          grid: {
            drawOnChartArea: false,

            drawTicks: false,
          },

          ticks: {
            color: chartText,

            padding: 9,

            font: {
              family:
                "Inter, ui-sans-serif, system-ui, sans-serif",

              size: 10,

              weight: "500",
            },

            callback: (value) =>
              `${value}%`,
          },

          title: {
            display: true,

            text: "Saturation",

            color: chartText,

            font: {
              size: 10,

              weight: "700",
            },

            padding: {
              bottom: 4,
            },
          },
        },
      },

      elements: {
        line: {
          capBezierPoints: true,
        },

        point: {
          hitRadius: 12,

          hoverBorderWidth: 2,
        },
      },
    }),
    [
      chartGrid,
      chartText,
      isDark,
      safeTelemetry,
      tooltipBackground,
      tooltipBody,
      tooltipBorder,
      tooltipTitle,
    ]
  );

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <section className="telemetry-chart-shell">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="telemetry-chart-header">
        <div className="telemetry-heading-wrap">
          <div className="telemetry-heading-icon">
            <Activity size={18} />
          </div>

          <div>
            <div className="telemetry-title-row">
              <h3>Environmental Telemetry</h3>

              <span className="telemetry-live-badge">
                <span />
                LIVE
              </span>
            </div>

            <p>
              Precipitation & soil saturation trend
              monitoring
            </p>
          </div>
        </div>

        <div className="telemetry-sync">
          <Wifi size={13} />

          <span>
            Updated{" "}
            {lastUpdated.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* ======================================================
          LIVE METRICS
          ====================================================== */}

      <div className="telemetry-summary-grid">
        <div className="telemetry-summary-card precipitation">
          <div className="summary-card-top">
            <div className="summary-icon">
              <CloudRain size={15} />
            </div>

            <span>PRECIPITATION</span>
          </div>

          <div className="summary-value-row">
            <strong>
              {precipitation.toFixed(1)}
            </strong>

            <small>mm/h</small>
          </div>

          <div className="summary-trend">
            <TrendingUp size={11} />

            <span>
              {precipitationDelta >= 0 ? "+" : ""}
              {precipitationDelta.toFixed(1)}
              {" vs previous"}
            </span>
          </div>
        </div>

        <div className="telemetry-summary-card saturation">
          <div className="summary-card-top">
            <div className="summary-icon">
              <Droplets size={15} />
            </div>

            <span>SOIL SATURATION</span>
          </div>

          <div className="summary-value-row">
            <strong>
              {saturation.toFixed(1)}
            </strong>

            <small>%</small>
          </div>

          <div className="summary-trend">
            <TrendingUp size={11} />

            <span>
              {saturationDelta >= 0 ? "+" : ""}
              {saturationDelta.toFixed(1)}
              {" vs previous"}
            </span>
          </div>
        </div>

        <div className="telemetry-summary-card risk">
          <div className="summary-card-top">
            <div className="summary-icon">
              <Gauge size={15} />
            </div>

            <span>RISK STATUS</span>
          </div>

          <div className="summary-value-row risk-value-row">
            <strong className={riskState.className}>
              {riskState.level}
            </strong>
          </div>

          <div
            className={`summary-risk-indicator ${riskState.className}`}
          >
            <span />

            <small>
              Live composite telemetry state
            </small>
          </div>
        </div>

        <div className="telemetry-summary-card network">
          <div className="summary-card-top">
            <div className="summary-icon">
              <Radio size={15} />
            </div>

            <span>TELEMETRY STREAM</span>
          </div>

          <div className="summary-value-row">
            <strong>ACTIVE</strong>
          </div>

          <div className="summary-trend network-status">
            <span className="network-pulse" />

            <span>
              Sensor feed operational
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          CHART
          ====================================================== */}

      <div className="telemetry-chart-main">
        <div className="telemetry-chart-canvas">
          <Line
            data={data}
            options={options}
          />
        </div>

        {/* Threshold indicators */}
        <div className="telemetry-threshold-info">
          <div>
            <span className="threshold-dot rain" />
            <span>
              Rain threshold:{" "}
              <strong>
                {precipitationThreshold} mm/h
              </strong>
            </span>
          </div>

          <div>
            <span className="threshold-dot soil" />
            <span>
              Saturation threshold:{" "}
              <strong>
                {saturationThreshold}%
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          FOOTER
          ====================================================== */}

      <div className="telemetry-chart-footer">
        <div className="chart-footer-status">
          <span className="footer-live-dot" />

          <span>
            Streaming environmental telemetry
          </span>
        </div>

        <div className="chart-footer-note">
          <span>Auto-refresh enabled</span>
          <span className="footer-divider" />
          <span>
            {safeTelemetry.length} data points
          </span>
        </div>
      </div>
    </section>
  );
}

export default TelemetryChart;