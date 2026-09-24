import {
  AlertTriangle,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudSun,
  Compass,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  Radio,
  Sun,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function WeatherCard({ weather = {} }) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // ============================================================
  // LIVE CLOCK
  // ============================================================

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  // ============================================================
  // SAFE VALUES
  // ============================================================

  const temperature = Number(weather?.temperature);
  const rainfall = Number(
    weather?.rainfall ?? weather?.precipitation
  );
  const humidity = Number(weather?.humidity);
  const windSpeed = Number(
    weather?.windSpeed ?? weather?.wind_velocity
  );
  const pressure = Number(
    weather?.pressure ?? weather?.airPressure
  );
  const visibility = Number(
    weather?.visibility
  );

  const hasTemperature = Number.isFinite(
    temperature
  );

  const hasRainfall = Number.isFinite(rainfall);

  const hasHumidity = Number.isFinite(humidity);

  const hasWindSpeed = Number.isFinite(windSpeed);

  const hasPressure = Number.isFinite(pressure);

  const hasVisibility = Number.isFinite(
    visibility
  );

  // ============================================================
  // WEATHER CONDITION
  // ============================================================

  const condition = String(
    weather?.condition || "Monitoring"
  );

  // ============================================================
  // WEATHER ICON
  // ============================================================

  const WeatherIcon = useMemo(() => {
    const value = condition.toLowerCase();

    if (
      value.includes("storm") ||
      value.includes("thunder")
    ) {
      return CloudRain;
    }

    if (
      value.includes("heavy rain") ||
      value.includes("rain")
    ) {
      return CloudRain;
    }

    if (
      value.includes("drizzle") ||
      value.includes("light rain")
    ) {
      return CloudDrizzle;
    }

    if (
      value.includes("cloud") ||
      value.includes("overcast")
    ) {
      return Cloud;
    }

    if (
      value.includes("partly") ||
      value.includes("partly cloudy")
    ) {
      return CloudSun;
    }

    if (
      value.includes("sun") ||
      value.includes("clear")
    ) {
      return Sun;
    }

    return CloudSun;
  }, [condition]);

  // ============================================================
  // WIND DIRECTION
  // ============================================================

  const windDirection = String(
    weather?.windDirection ||
      weather?.windHeading ||
      "NNW"
  );

  const windDegrees = Number(
    weather?.windDegrees ??
      weather?.windDirectionDegrees
  );

  const hasWindDegrees = Number.isFinite(
    windDegrees
  );

  // ============================================================
  // FRESHNESS
  // ============================================================

  const freshness = useMemo(() => {
    const sourceTimestamp =
      weather?.updatedAt ||
      weather?.lastUpdated ||
      weather?.timestamp ||
      weather?.observedAt;

    if (!sourceTimestamp) {
      return {
        label: "LIVE",
        detail: "Realtime station feed",
        className: "live",
      };
    }

    const timestamp = new Date(
      sourceTimestamp
    ).getTime();

    if (Number.isNaN(timestamp)) {
      return {
        label: "LIVE",
        detail: "Realtime station feed",
        className: "live",
      };
    }

    const diffSeconds = Math.max(
      0,
      Math.floor(
        (currentTime - timestamp) / 1000
      )
    );

    if (diffSeconds <= 15) {
      return {
        label: "LIVE",
        detail: "Updated just now",
        className: "live",
      };
    }

    if (diffSeconds < 60) {
      return {
        label: `${diffSeconds}s`,
        detail: "Recently updated",
        className: "fresh",
      };
    }

    const minutes = Math.floor(
      diffSeconds / 60
    );

    if (minutes < 60) {
      return {
        label: `${minutes}m`,
        detail: "Recent station reading",
        className: minutes <= 10
          ? "fresh"
          : "stale",
      };
    }

    const hours = Math.floor(minutes / 60);

    return {
      label: `${hours}h`,
      detail: "Station data may be stale",
      className: "stale",
    };
  }, [
    currentTime,
    weather?.updatedAt,
    weather?.lastUpdated,
    weather?.timestamp,
    weather?.observedAt,
  ]);

  // ============================================================
  // WEATHER RISK
  // ============================================================

  const weatherRisk = useMemo(() => {
    const rainfallValue = hasRainfall
      ? rainfall
      : 0;

    const humidityValue = hasHumidity
      ? humidity
      : 0;

    const score =
      rainfallValue * 0.7 +
      humidityValue * 0.3;

    if (score >= 80 || rainfallValue >= 80) {
      return {
        level: "CRITICAL",
        className: "critical",
        description:
          "Severe precipitation indicators",
      };
    }

    if (score >= 60 || rainfallValue >= 50) {
      return {
        level: "HIGH",
        className: "high",
        description:
          "Elevated rainfall conditions",
      };
    }

    if (score >= 40 || rainfallValue >= 25) {
      return {
        level: "MODERATE",
        className: "moderate",
        description:
          "Enhanced monitoring recommended",
      };
    }

    return {
      level: "LOW",
      className: "low",
      description:
        "Environmental conditions currently stable",
    };
  }, [
    hasHumidity,
    hasRainfall,
    humidity,
    rainfall,
  ]);

  // ============================================================
  // DISPLAY HELPERS
  // ============================================================

  const formatNumber = (
    value,
    digits = 1
  ) => {
    if (!Number.isFinite(value)) {
      return "--";
    }

    return value.toFixed(digits);
  };

  const source = String(
    weather?.source || "Live Station"
  );

  const location = String(
    weather?.location ||
      "Dehradun — Garhwal Region"
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <article
      className={`weather-card-pro weather-risk-${weatherRisk.className}`}
    >
      {/* ======================================================
          TOP ACCENT
          ====================================================== */}

      <div className="weather-card-accent" />

      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="weather-header">
        <div className="weather-loc">
          <div className="weather-location-icon">
            <MapPin size={16} />
          </div>

          <div className="weather-location-copy">
            <div className="weather-title-row">
              <h4>Himalayan Micro-Climate</h4>

              <span
                className={`weather-live-badge ${freshness.className}`}
              >
                <span />
                {freshness.label}
              </span>
            </div>

            <small>{location}</small>
          </div>
        </div>

        <div className="weather-source-wrap">
          <Radio size={12} />

          <span>{source}</span>
        </div>
      </header>

      {/* ======================================================
          PRIMARY WEATHER
          ====================================================== */}

      <section className="weather-main-row">
        <div className="weather-temp-hero">
          <div
            className={`weather-hero-icon weather-icon-${weatherRisk.className}`}
          >
            <WeatherIcon
              size={37}
              strokeWidth={1.8}
            />

            <span className="weather-icon-orbit" />
          </div>

          <div className="weather-temp-content">
            <div className="weather-temp-line">
              <h2 className="temp-val">
                {hasTemperature
                  ? formatNumber(
                      temperature,
                      1
                    )
                  : "--"}
              </h2>

              <span className="temp-unit">
                °C
              </span>
            </div>

            <span className="weather-desc">
              {condition}
            </span>

            <div className="weather-stability">
              <span
                className={`weather-risk-dot ${weatherRisk.className}`}
              />

              <span>
                {weatherRisk.level} weather risk
              </span>
            </div>
          </div>
        </div>

        {/* Precipitation */}
        <div className="precip-pill">
          <div className="precip-icon">
            <Droplets size={17} />
          </div>

          <div>
            <span>PRECIPITATION</span>

            <strong>
              {hasRainfall
                ? formatNumber(rainfall)
                : "--"}{" "}
              <small>mm/h</small>
            </strong>
          </div>
        </div>
      </section>

      {/* ======================================================
          CORE METRICS
          ====================================================== */}

      <section className="weather-metrics-grid">
        {/* Humidity */}
        <div className="weather-metric-item">
          <div className="metric-icon humidity">
            <Droplets size={16} />
          </div>

          <div className="metric-info">
            <span className="m-label">
              Humidity
            </span>

            <strong className="m-val">
              {hasHumidity
                ? `${formatNumber(humidity, 0)}%`
                : "--"}
            </strong>
          </div>

          {hasHumidity && (
            <div
              className="metric-mini-bar"
              aria-hidden="true"
            >
              <span
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      humidity
                    )
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Wind */}
        <div className="weather-metric-item">
          <div className="metric-icon wind">
            <Wind size={16} />
          </div>

          <div className="metric-info">
            <span className="m-label">
              Wind Velocity
            </span>

            <strong className="m-val">
              {hasWindSpeed
                ? `${formatNumber(
                    windSpeed
                  )} km/h`
                : "--"}
            </strong>
          </div>
        </div>

        {/* Pressure */}
        <div className="weather-metric-item">
          <div className="metric-icon pressure">
            <Gauge size={16} />
          </div>

          <div className="metric-info">
            <span className="m-label">
              Pressure
            </span>

            <strong className="m-val">
              {hasPressure
                ? `${formatNumber(
                    pressure,
                    0
                  )} hPa`
                : "--"}
            </strong>
          </div>
        </div>

        {/* Wind Heading */}
        <div className="weather-metric-item">
          <div className="metric-icon direction">
            <Compass size={16} />
          </div>

          <div className="metric-info">
            <span className="m-label">
              Wind Heading
            </span>

            <strong className="m-val">
              {windDirection}
              {hasWindDegrees
                ? ` (${Math.round(
                    windDegrees
                  )}°)`
                : ""}
            </strong>
          </div>
        </div>

        {/* Visibility */}
        <div className="weather-metric-item">
          <div className="metric-icon visibility">
            <Eye size={16} />
          </div>

          <div className="metric-info">
            <span className="m-label">
              Visibility
            </span>

            <strong className="m-val">
              {hasVisibility
                ? `${formatNumber(
                    visibility,
                    1
                  )} km`
                : "--"}
            </strong>
          </div>
        </div>

        {/* Thermal */}
        <div className="weather-metric-item">
          <div className="metric-icon thermal">
            <Thermometer size={16} />
          </div>

          <div className="metric-info">
            <span className="m-label">
              Thermal State
            </span>

            <strong className="m-val">
              {hasTemperature
                ? temperature >= 35
                  ? "HOT"
                  : temperature <= 5
                    ? "COLD"
                    : "NORMAL"
                : "--"}
            </strong>
          </div>
        </div>
      </section>

      {/* ======================================================
          ENVIRONMENTAL STATUS
          ====================================================== */}

      <section className="weather-status-panel">
        <div className="weather-status-left">
          <div className="status-panel-icon">
            <Zap size={15} />
          </div>

          <div>
            <span>MICRO-CLIMATE STATUS</span>

            <strong>
              {weatherRisk.description}
            </strong>
          </div>
        </div>

        <div
          className={`weather-risk-chip ${weatherRisk.className}`}
        >
          {weatherRisk.level}
        </div>
      </section>

      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer className="weather-footer">
        <div className="weather-footer-status">
          <span
            className={`weather-footer-dot ${freshness.className}`}
          />

          <span>
            {freshness.detail}
          </span>
        </div>

        <div className="weather-footer-time">
          <Radio size={11} />

          <span>
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      </footer>
    </article>
  );
}

export default WeatherCard;