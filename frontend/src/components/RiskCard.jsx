import { motion } from "motion/react";
import {
  ShieldAlert,
  Droplets,
  Mountain,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Radio,
} from "lucide-react";

/**
 * Professional Risk Card
 *
 * Motion-enhanced version
 *
 * Props:
 * - title: string
 * - value: number | string
 * - level: "Low" | "Moderate" | "High" | "Critical" | "Warning"
 * - trend: string
 * - subtitle: string
 */

function RiskCard({
  title = "Risk",
  value = 0,
  level = "Low",
  trend,
  subtitle,
}) {
  /* =========================================================
     SAFE INPUT NORMALIZATION
     ========================================================= */

  const safeTitle = typeof title === "string" ? title : "Risk";
  const safeLevel = typeof level === "string" ? level : "Low";

  const normalizedTitle = safeTitle.toLowerCase();
  const normalizedLevel = safeLevel.toLowerCase();

  const isNumericValue =
    typeof value === "number" && Number.isFinite(value);

  // Prevent broken gauges from invalid values.
  const numericValue = isNumericValue
    ? Math.min(100, Math.max(0, value))
    : 0;

  /* =========================================================
     ICON SELECTION
     ========================================================= */

  let Icon = Activity;

  if (
    normalizedTitle.includes("overall") ||
    normalizedTitle.includes("risk")
  ) {
    Icon = ShieldAlert;
  } else if (normalizedTitle.includes("flood")) {
    Icon = Droplets;
  } else if (
    normalizedTitle.includes("landslide") ||
    normalizedTitle.includes("slide")
  ) {
    Icon = Mountain;
  } else if (
    normalizedTitle.includes("lead") ||
    normalizedTitle.includes("time") ||
    normalizedTitle.includes("window")
  ) {
    Icon = Clock;
  }

  /* =========================================================
     LEVEL CLASSIFICATION
     ========================================================= */

  const getLevelClass = () => {
    if (
      normalizedLevel.includes("critical") ||
      normalizedLevel.includes("extreme")
    ) {
      return "critical";
    }

    if (
      normalizedLevel.includes("high") ||
      normalizedLevel.includes("warning") ||
      normalizedLevel.includes("danger")
    ) {
      return "high";
    }

    if (
      normalizedLevel.includes("moderate") ||
      normalizedLevel.includes("medium")
    ) {
      return "moderate";
    }

    return "low";
  };

  const levelClass = getLevelClass();

  /* =========================================================
     GAUGE CALCULATION
     ========================================================= */

  const radius = 32;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset =
    circumference -
    (numericValue / 100) * circumference;

  /* =========================================================
     RISK STATUS
     ========================================================= */

  const getMetricStatus = () => {
    if (numericValue >= 85) return "Critical Threat";
    if (numericValue >= 75) return "Severe Threat";
    if (numericValue >= 55) return "Elevated Risk";
    if (numericValue >= 30) return "Moderate Watch";

    return "Safe Range";
  };

  const getStatusIcon = () => {
    if (numericValue >= 75) {
      return AlertTriangle;
    }

    if (numericValue >= 30) {
      return Radio;
    }

    return CheckCircle2;
  };

  const StatusIcon = getStatusIcon();

  /* =========================================================
     TREND ICON
     ========================================================= */

  const getTrendIcon = () => {
    if (!trend) return null;

    const trendText = String(trend).toLowerCase();

    if (
      trendText.includes("increas") ||
      trendText.includes("rising") ||
      trendText.includes("up")
    ) {
      return TrendingUp;
    }

    if (
      trendText.includes("decreas") ||
      trendText.includes("fall") ||
      trendText.includes("down")
    ) {
      return TrendingDown;
    }

    return Minus;
  };

  const TrendIcon = getTrendIcon();

  /* =========================================================
     FOOTER STATUS
     ========================================================= */

  const getFooterStatus = () => {
    if (trend) {
      return trend;
    }

    if (levelClass === "critical") {
      return "Evacuation Recommended";
    }

    if (levelClass === "high") {
      return "Early Warning Active";
    }

    if (levelClass === "moderate") {
      return "Enhanced Monitoring";
    }

    return "Telemetry Normal";
  };

  /* =========================================================
     LEVEL DISPLAY
     ========================================================= */

  const displayLevel =
    safeLevel.charAt(0).toUpperCase() +
    safeLevel.slice(1);

  /* =========================================================
     MOTION VARIANTS
     ========================================================= */

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 24,
      scale: 0.97,
    },

    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.article
      className={`risk-gauge-card card-${levelClass}`}
      data-risk-level={levelClass}
      aria-label={`${safeTitle} ${displayLevel}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        y: -5,
        scale: 1.015,
        transition: {
          duration: 0.2,
          ease: "easeOut",
        },
      }}
      whileTap={{
        scale: 0.99,
      }}
    >
      {/* =====================================================
          TOP SECTION
          ===================================================== */}

      <div className="risk-card-top">
        <div className="risk-title-wrap">
          <motion.div
            className={`risk-icon-pill ${levelClass}`}
            aria-hidden="true"
            initial={{
              opacity: 0,
              scale: 0.7,
              rotate: -10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            transition={{
              duration: 0.35,
              delay: 0.15,
              ease: "easeOut",
            }}
          >
            <Icon size={19} strokeWidth={2.2} />
          </motion.div>

          <div className="risk-heading-content">
            <span className="risk-card-title">
              {safeTitle}
            </span>

            {subtitle && (
              <small className="risk-card-subtitle">
                {subtitle}
              </small>
            )}
          </div>
        </div>

        <motion.span
          className={`risk-badge-tag ${levelClass}`}
          aria-label={`Risk level: ${displayLevel}`}
          initial={{
            opacity: 0,
            x: 10,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.35,
            delay: 0.2,
          }}
        >
          <span className="risk-badge-dot" />
          {displayLevel}
        </motion.span>
      </div>

      {/* =====================================================
          BODY
          ===================================================== */}

      <div className="risk-card-body">
        {isNumericValue ? (
          <div className="radial-metric-row">
            {/* Metric */}

            <motion.div
              className="radial-metric-val"
              initial={{
                opacity: 0,
                x: -12,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.4,
                delay: 0.15,
              }}
            >
              <div className="metric-number-row">
                <motion.h2
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.2,
                    ease: "backOut",
                  }}
                >
                  {Math.round(numericValue)}
                </motion.h2>

                <span className="metric-percent">
                  %
                </span>
              </div>

              <div
                className={`metric-status-text ${levelClass}`}
              >
                <StatusIcon
                  size={14}
                  strokeWidth={2.4}
                  aria-hidden="true"
                />

                <span>{getMetricStatus()}</span>
              </div>
            </motion.div>

            {/* Circular Gauge */}

            <motion.div
              className="radial-svg-wrap"
              aria-label={`Risk score ${Math.round(
                numericValue
              )} percent`}
              role="img"
              initial={{
                opacity: 0,
                scale: 0.75,
                rotate: -20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: 0,
              }}
              transition={{
                duration: 0.55,
                delay: 0.2,
                ease: "easeOut",
              }}
            >
              <svg
                className="radial-gauge-svg"
                width="82"
                height="82"
                viewBox="0 0 82 82"
                aria-hidden="true"
              >
                <defs>
                  <filter
                    id={`risk-glow-${levelClass}`}
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feGaussianBlur
                      stdDeviation="2.5"
                      result="blur"
                    />

                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Background circle */}

                <circle
                  className="gauge-bg"
                  cx="41"
                  cy="41"
                  r={radius}
                  fill="none"
                  strokeWidth="7"
                />

                {/* Progress circle */}

                <motion.circle
                  className={`gauge-progress ${levelClass}`}
                  cx="41"
                  cy="41"
                  r={radius}
                  fill="none"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 41 41)"
                  filter={`url(#risk-glow-${levelClass})`}
                  initial={{
                    strokeDashoffset: circumference,
                  }}
                  animate={{
                    strokeDashoffset,
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.25,
                    ease: "easeOut",
                  }}
                />
              </svg>

              <motion.div
                className="gauge-center-label"
                initial={{
                  opacity: 0,
                  scale: 0.5,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration: 0.35,
                  delay: 0.7,
                }}
              >
                <Activity
                  size={13}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </motion.div>
            </motion.div>
          </div>
        ) : (
          <motion.div
            className="lead-time-display"
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.4,
              delay: 0.15,
            }}
          >
            <div className="lead-time-value-row">
              <h2>{value || "N/A"}</h2>

              <Clock
                size={19}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>

            <span className="lead-time-desc">
              Estimated Evacuation Window
            </span>
          </motion.div>
        )}
      </div>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div className="risk-card-footer">
        <div className="risk-footer-indicator">
          <motion.span
            className={`pulse-indicator ${levelClass}`}
            aria-hidden="true"
            animate={{
              opacity: [0.45, 1, 0.45],
              scale: [1, 1.12, 1],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <span className="footer-status-label">
            {TrendIcon && (
              <TrendIcon
                size={13}
                strokeWidth={2.4}
                aria-hidden="true"
              />
            )}

            <span>{getFooterStatus()}</span>
          </span>
        </div>

        {/* Live indicator */}

        <motion.div
          className="risk-live-status"
          animate={{
            opacity: [0.65, 1, 0.65],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span className="live-dot" />
          <span>LIVE</span>
        </motion.div>
      </div>
    </motion.article>
  );
}

export default RiskCard;