// frontend/src/pages/Prediction.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  BrainCircuit,
  CloudRain,
  Droplets,
  Gauge,
  History,
  MapPin,
  Mountain,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Timer,
  Waves,
  Zap,
} from "lucide-react";

import {
  getPredictions,
  predictRisk,
} from "../services/api.js";

import "../styles/prediction.css";

const INITIAL_FORM = {
  location: "Dehradun, Uttarakhand",
  rainfall: 42,
  soilMoisture: 51,
  slopeStability: 65,
  historicalRisk: 35,
};

function getRiskLevel(value) {
  const score = Number(value) || 0;

  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MODERATE";
  return "LOW";
}

function normalizePrediction(response) {
  const data = response?.data?.data ||
    response?.data?.prediction ||
    response?.data ||
    response ||
    {};

  return {
    ...data,
    overallRisk:
      data.overallRisk ??
      data.riskScore ??
      data.overall_risk ??
      data.risk ??
      0,

    floodRisk:
      data.floodRisk ??
      data.flood_risk ??
      0,

    landslideRisk:
      data.landslideRisk ??
      data.landslide_risk ??
      0,

    soilMoisture:
      data.soilMoisture ??
      data.soil_moisture ??
      0,

    leadTime:
      data.leadTime ??
      data.lead_time ??
      data.evacuationLeadTime ??
      null,

    modelVersion:
      data.modelVersion ??
      data.model_version ??
      "GeoNexus AI",

    location:
      data.location ||
      "Unknown location",
  };
}

function Prediction() {
  const [form, setForm] =
    useState(INITIAL_FORM);

  const [prediction, setPrediction] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadHistory = useCallback(
    async () => {
      setHistoryLoading(true);

      try {
        const response =
          await getPredictions();

        const payload =
          response?.data?.data ||
          response?.data?.predictions ||
          response?.data ||
          [];

        setHistory(
          Array.isArray(payload)
            ? payload
            : []
        );
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "location"
          ? value
          : Number(value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        location: form.location.trim(),
        rainfall: Number(form.rainfall),
        soilMoisture:
          Number(form.soilMoisture),
        slopeStability:
          Number(form.slopeStability),
        historicalRisk:
          Number(form.historicalRisk),
      };

      if (!payload.location) {
        throw new Error(
          "Location is required."
        );
      }

      const response =
        await predictRisk(payload);

      const result =
        normalizePrediction(response);

      setPrediction(result);

      setSuccess(
        "AI risk prediction generated successfully."
      );

      await loadHistory();
    } catch (requestError) {
      const message =
        requestError?.response?.data?.message ||
        requestError?.response?.data?.error ||
        requestError?.message ||
        "Unable to generate prediction.";

      setError(message);
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setPrediction(null);
    setError("");
    setSuccess("");
  };

  const overallRisk = useMemo(
    () =>
      Math.min(
        100,
        Math.max(
          0,
          Number(
            prediction?.overallRisk
          ) || 0
        )
      ),
    [prediction]
  );

  const floodRisk = useMemo(
    () =>
      Math.min(
        100,
        Math.max(
          0,
          Number(
            prediction?.floodRisk
          ) || 0
        )
      ),
    [prediction]
  );

  const landslideRisk = useMemo(
    () =>
      Math.min(
        100,
        Math.max(
          0,
          Number(
            prediction?.landslideRisk
          ) || 0
        )
      ),
    [prediction]
  );

  const riskLevel =
    getRiskLevel(overallRisk);

  return (
    <section className="prediction-page">
      <header className="prediction-header">
        <div>
          <div className="prediction-eyebrow">
            <span className="prediction-live-dot" />
            AI RISK ENGINE
          </div>

          <h1>
            Disaster Risk Prediction
          </h1>

          <p>
            Generate multi-hazard risk predictions
            using rainfall, soil moisture, slope
            stability and historical risk indicators.
          </p>
        </div>

        <div className="prediction-header-badge">
          <BrainCircuit size={20} />
          <span>GeoNexus AI</span>
        </div>
      </header>

      <div className="prediction-grid">
        <section className="prediction-card prediction-input-card">
          <div className="prediction-card-header">
            <div className="prediction-card-icon">
              <Gauge size={20} />
            </div>

            <div>
              <h2>Prediction Inputs</h2>
              <p>
                Configure the current environmental
                conditions.
              </p>
            </div>
          </div>

          <form
            className="prediction-form"
            onSubmit={handleSubmit}
          >
            <div className="prediction-field prediction-field-full">
              <label htmlFor="location">
                <MapPin size={15} />
                Location
              </label>

              <input
                id="location"
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
                placeholder="Enter location"
                autoComplete="off"
                required
              />
            </div>

            <div className="prediction-field">
              <label htmlFor="rainfall">
                <CloudRain size={15} />
                Rainfall
              </label>

              <div className="prediction-input-unit">
                <input
                  id="rainfall"
                  name="rainfall"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.1"
                  value={form.rainfall}
                  onChange={handleChange}
                  required
                />

                <span>mm</span>
              </div>
            </div>

            <div className="prediction-field">
              <label htmlFor="soilMoisture">
                <Droplets size={15} />
                Soil Moisture
              </label>

              <div className="prediction-input-unit">
                <input
                  id="soilMoisture"
                  name="soilMoisture"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.soilMoisture}
                  onChange={handleChange}
                  required
                />

                <span>%</span>
              </div>
            </div>

            <div className="prediction-field">
              <label htmlFor="slopeStability">
                <Mountain size={15} />
                Slope Stability
              </label>

              <div className="prediction-input-unit">
                <input
                  id="slopeStability"
                  name="slopeStability"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.slopeStability}
                  onChange={handleChange}
                  required
                />

                <span>%</span>
              </div>
            </div>

            <div className="prediction-field">
              <label htmlFor="historicalRisk">
                <History size={15} />
                Historical Risk
              </label>

              <div className="prediction-input-unit">
                <input
                  id="historicalRisk"
                  name="historicalRisk"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.historicalRisk}
                  onChange={handleChange}
                  required
                />

                <span>%</span>
              </div>
            </div>

            <div className="prediction-form-actions">
              <button
                type="button"
                className="prediction-reset-button"
                onClick={resetForm}
                disabled={loading}
              >
                Reset
              </button>

              <button
                type="submit"
                className="prediction-submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="prediction-spin"
                    />
                    Running AI Model...
                  </>
                ) : (
                  <>
                    <Sparkles size={17} />
                    Generate Prediction
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div
              className="prediction-message prediction-error"
              role="alert"
            >
              <Zap size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="prediction-message prediction-success">
              <ShieldCheck size={16} />
              {success}
            </div>
          )}
        </section>

        <section className="prediction-card prediction-result-card">
          <div className="prediction-card-header">
            <div className="prediction-card-icon">
              <BrainCircuit size={20} />
            </div>

            <div>
              <h2>AI Prediction Result</h2>
              <p>
                Current multi-hazard assessment.
              </p>
            </div>
          </div>

          {!prediction ? (
            <div className="prediction-empty">
              <div className="prediction-empty-icon">
                <Activity size={30} />
              </div>

              <h3>
                Awaiting prediction
              </h3>

              <p>
                Enter environmental parameters
                and run the AI model to generate
                a disaster-risk assessment.
              </p>
            </div>
          ) : (
            <div className="prediction-result">
              <div className="prediction-risk-overview">
                <div
                  className={`prediction-risk-orb risk-${riskLevel.toLowerCase()}`}
                >
                  <strong>
                    {Math.round(overallRisk)}
                  </strong>

                  <span>/ 100</span>
                </div>

                <div className="prediction-risk-summary">
                  <span className="prediction-result-label">
                    OVERALL RISK
                  </span>

                  <strong>
                    {riskLevel}
                  </strong>

                  <span>
                    {prediction.location}
                  </span>
                </div>
              </div>

              <div className="prediction-meter">
                <div
                  className="prediction-meter-fill"
                  style={{
                    width: `${overallRisk}%`,
                  }}
                />
              </div>

              <div className="prediction-metrics">
                <div className="prediction-metric">
                  <CloudRain size={18} />

                  <div>
                    <span>
                      Flood Risk
                    </span>

                    <strong>
                      {Math.round(floodRisk)}%
                    </strong>
                  </div>
                </div>

                <div className="prediction-metric">
                  <Mountain size={18} />

                  <div>
                    <span>
                      Landslide Risk
                    </span>

                    <strong>
                      {Math.round(
                        landslideRisk
                      )}
                      %
                    </strong>
                  </div>
                </div>

                <div className="prediction-metric">
                  <Droplets size={18} />

                  <div>
                    <span>
                      Soil Moisture
                    </span>

                    <strong>
                      {prediction.soilMoisture ??
                        form.soilMoisture}
                      %
                    </strong>
                  </div>
                </div>

                <div className="prediction-metric">
                  <Timer size={18} />

                  <div>
                    <span>
                      Lead Time
                    </span>

                    <strong>
                      {prediction.leadTime != null
                        ? `${prediction.leadTime} min`
                        : "N/A"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="prediction-model-info">
                <span>
                  <Waves size={14} />
                  Model
                </span>

                <strong>
                  {prediction.modelVersion}
                </strong>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="prediction-card prediction-history-card">
        <div className="prediction-card-header">
          <div className="prediction-card-icon">
            <History size={20} />
          </div>

          <div>
            <h2>Recent Predictions</h2>
            <p>
              Latest risk predictions stored by
              the GeoNexus backend.
            </p>
          </div>

          <button
            type="button"
            className="prediction-refresh-button"
            onClick={loadHistory}
            disabled={historyLoading}
            aria-label="Refresh prediction history"
          >
            <RefreshCw
              size={17}
              className={
                historyLoading
                  ? "prediction-spin"
                  : ""
              }
            />
          </button>
        </div>

        {historyLoading ? (
          <div className="prediction-history-loading">
            <RefreshCw
              size={20}
              className="prediction-spin"
            />
            Loading prediction history...
          </div>
        ) : history.length === 0 ? (
          <div className="prediction-history-empty">
            No prediction records available yet.
          </div>
        ) : (
          <div className="prediction-history-table-wrap">
            <table className="prediction-history-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Risk</th>
                  <th>Flood</th>
                  <th>Landslide</th>
                  <th>Model</th>
                </tr>
              </thead>

              <tbody>
                {history
                  .slice(0, 10)
                  .map((item, index) => {
                    const normalized =
                      normalizePrediction(item);

                    const risk =
                      Number(
                        normalized.overallRisk
                      ) || 0;

                    return (
                      <tr
                        key={
                          item._id ||
                          item.id ||
                          index
                        }
                      >
                        <td>
                          <MapPin size={14} />
                          {normalized.location ||
                            "Unknown"}
                        </td>

                        <td>
                          <span
                            className={`prediction-table-risk risk-${getRiskLevel(
                              risk
                            ).toLowerCase()}`}
                          >
                            {Math.round(risk)}%
                          </span>
                        </td>

                        <td>
                          {Math.round(
                            Number(
                              normalized.floodRisk
                            ) || 0
                          )}
                          %
                        </td>

                        <td>
                          {Math.round(
                            Number(
                              normalized.landslideRisk
                            ) || 0
                          )}
                          %
                        </td>

                        <td>
                          {normalized.modelVersion}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default Prediction;