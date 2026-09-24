import { useState, useEffect } from "react";
import {
  Cpu,
  Sliders,
  Play,
  RotateCcw,
  ShieldAlert,
  Droplets,
  Mountain,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { predictRisk } from "../services/api";
import { useToast } from "../context/ToastContext";

function SimulationLab() {
  const { addToast } = useToast();

  const [rainfall, setRainfall] = useState(85);
  const [soilMoisture, setSoilMoisture] = useState(78);
  const [slopeStability, setSlopeStability] = useState(35);
  const [historicalRisk, setHistoricalRisk] = useState(70);
  const [location, setLocation] = useState("Chamoli & Joshimath Region");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  // Preset scenarios
  const applyPreset = (presetName) => {
    if (presetName === "cloudburst") {
      setRainfall(135);
      setSoilMoisture(92);
      setSlopeStability(20);
      setHistoricalRisk(85);
      setLocation("Kedarnath Valley Sector");
    } else if (presetName === "flood") {
      setRainfall(110);
      setSoilMoisture(96);
      setSlopeStability(30);
      setHistoricalRisk(75);
      setLocation("Alaknanda River Catchment");
    } else if (presetName === "moderate") {
      setRainfall(50);
      setSoilMoisture(55);
      setSlopeStability(70);
      setHistoricalRisk(35);
      setLocation("Dehradun Valley");
    } else if (presetName === "dry") {
      setRainfall(10);
      setSoilMoisture(25);
      setSlopeStability(90);
      setHistoricalRisk(15);
      setLocation("Shimla Ridge Station");
    }
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await predictRisk({
        location,
        rainfall: Number(rainfall),
        soilMoisture: Number(soilMoisture),
        slopeStability: Number(slopeStability),
        historicalRisk: Number(historicalRisk),
      });
      setPrediction(response.data);
      addToast({
        title: "Simulation Model Executed",
        message: `Threat assessment computed: ${response.data.riskLevel} (${response.data.overallRisk}%)`,
        type: response.data.riskLevel === "Critical" ? "critical" : "success",
      });
    } catch (error) {
      console.error(error);
      // Fallback local calculation
      const rainRisk = Math.min(100, (rainfall / 150) * 100);
      const instability = 100 - slopeStability;
      const floodRisk = Math.round(0.55 * rainRisk + 0.25 * soilMoisture + 0.2 * historicalRisk);
      const landslideRisk = Math.round(0.4 * rainRisk + 0.35 * instability + 0.15 * soilMoisture + 0.1 * historicalRisk);
      const overallRisk = Math.round(0.5 * floodRisk + 0.5 * landslideRisk);

      let riskLevel = "Low";
      if (overallRisk >= 75) riskLevel = "Critical";
      else if (overallRisk >= 55) riskLevel = "High";
      else if (overallRisk >= 30) riskLevel = "Moderate";

      let leadTime = "24+ hours";
      if (overallRisk >= 75) leadTime = "0–2 hours";
      else if (overallRisk >= 55) leadTime = "2–6 hours";
      else if (overallRisk >= 30) leadTime = "6–24 hours";

      setPrediction({
        rainfall,
        soilMoisture,
        slopeStability,
        floodRisk,
        landslideRisk,
        overallRisk,
        riskLevel,
        leadTime,
      });
    } finally {
      setLoading(false);
    }
  };

  // Run initial simulation
  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="simulation-page animate-fade-in">
      <div className="page-header-pro">
        <div className="header-left">
          <div className="header-icon-box cyan">
            <Cpu size={24} className="text-cyan" />
          </div>
          <div>
            <h1>AI Disaster Simulation & What-If Engine</h1>
            <p>Simulate extreme hydrological & geotechnical conditions to forecast catastrophe lead-times</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={runSimulation}
            disabled={loading}
          >
            <Play size={16} /> Run Simulation
          </button>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="scenario-presets-bar">
        <span className="presets-label">
          <Sparkles size={15} className="text-gold" /> Drill Presets:
        </span>
        <button
          className="preset-pill"
          onClick={() => applyPreset("cloudburst")}
        >
          ⛈️ Extreme Cloudburst
        </button>
        <button className="preset-pill" onClick={() => applyPreset("flood")}>
          🌊 Glacial Lake Flood Surge
        </button>
        <button
          className="preset-pill"
          onClick={() => applyPreset("moderate")}
        >
          🌧️ Monsoon Showers
        </button>
        <button className="preset-pill" onClick={() => applyPreset("dry")}>
          ☀️ Dry Baseline
        </button>
      </div>

      <div className="simulation-layout-grid">
        {/* Sliders Input Panel */}
        <div className="sim-panel sim-controls-card">
          <h3>
            <Sliders size={18} className="text-cyan" /> Environmental Stress Parameters
          </h3>

          <div className="sim-control-group">
            <div className="control-label-row">
              <label>Simulated Catchment Zone</label>
            </div>
            <input
              type="text"
              className="custom-input-pro"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Target Valley or Station..."
            />
          </div>

          <div className="sim-control-group">
            <div className="control-label-row">
              <label>
                <Droplets size={15} className="text-cyan" /> Hourly Precipitation (mm/h)
              </label>
              <strong>{rainfall} mm/h</strong>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              value={rainfall}
              onChange={(e) => setRainfall(Number(e.target.value))}
              className="custom-range"
            />
            <div className="range-bounds">
              <span>0 (Dry)</span>
              <span>75 mm (Heavy)</span>
              <span>150 mm (Cloudburst)</span>
            </div>
          </div>

          <div className="sim-control-group">
            <div className="control-label-row">
              <label>
                <Droplets size={15} className="text-emerald" /> Soil Saturation Index (%)
              </label>
              <strong>{soilMoisture}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={soilMoisture}
              onChange={(e) => setSoilMoisture(Number(e.target.value))}
              className="custom-range"
            />
            <div className="range-bounds">
              <span>0% (Permeable)</span>
              <span>50%</span>
              <span>100% (Fully Saturated)</span>
            </div>
          </div>

          <div className="sim-control-group">
            <div className="control-label-row">
              <label>
                <Mountain size={15} className="text-gold" /> Slope Geotechnical Stability (%)
              </label>
              <strong>{slopeStability}% ({100 - slopeStability}% Shear Stress)</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={slopeStability}
              onChange={(e) => setSlopeStability(Number(e.target.value))}
              className="custom-range"
            />
            <div className="range-bounds">
              <span>0% (Imminent Failure)</span>
              <span>50%</span>
              <span>100% (Solid Bedrock)</span>
            </div>
          </div>

          <div className="sim-control-group">
            <div className="control-label-row">
              <label>
                <ShieldAlert size={15} className="text-purple" /> Historic Catastrophe Weight (%)
              </label>
              <strong>{historicalRisk}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={historicalRisk}
              onChange={(e) => setHistoricalRisk(Number(e.target.value))}
              className="custom-range"
            />
          </div>

          <button
            type="button"
            className="btn-primary btn-full-width"
            onClick={runSimulation}
            disabled={loading}
          >
            {loading ? "Computing Non-linear Physics Engine..." : "Recalculate Disaster Index"}
          </button>
        </div>

        {/* Prediction Output & Recommendations */}
        <div className="sim-panel sim-results-card">
          <h3>
            <Zap size={18} className="text-gold" /> Simulation Output & Threat Diagnostics
          </h3>

          {prediction ? (
            <div className="sim-results-body">
              <div className={`sim-hero-badge ${prediction.riskLevel?.toLowerCase()}`}>
                <div className="sim-hero-title">
                  <span className="sim-tag">COMPUTED THREAT LEVEL</span>
                  <h2>{prediction.riskLevel?.toUpperCase()} RISK</h2>
                </div>
                <div className="sim-hero-score">
                  <span>{prediction.overallRisk}%</span>
                  <small>Vulnerability Score</small>
                </div>
              </div>

              <div className="sim-metrics-trio">
                <div className="sim-metric-box">
                  <span className="box-label">Flash Flood Probability</span>
                  <strong className="box-val text-cyan">{prediction.floodRisk}%</strong>
                  <div className="mini-progress-bar">
                    <div
                      className="bar-fill cyan"
                      style={{ width: `${prediction.floodRisk}%` }}
                    ></div>
                  </div>
                </div>

                <div className="sim-metric-box">
                  <span className="box-label">Landslide / Debris Flow</span>
                  <strong className="box-val text-gold">{prediction.landslideRisk}%</strong>
                  <div className="mini-progress-bar">
                    <div
                      className="bar-fill gold"
                      style={{ width: `${prediction.landslideRisk}%` }}
                    ></div>
                  </div>
                </div>

                <div className="sim-metric-box">
                  <span className="box-label">Estimated Lead Time</span>
                  <strong className="box-val text-red">{prediction.leadTime}</strong>
                  <small className="lead-tag">Evacuation Window</small>
                </div>
              </div>

              <div className="recommended-action-plan">
                <h4>Recommended Disaster Protocol</h4>
                {prediction.overallRisk >= 75 ? (
                  <div className="protocol-card critical">
                    <strong>🚨 STAGE 3: MANDATORY MASS EVACUATION</strong>
                    <p>
                      Debris flow threshold imminent. Immediately trigger siren towers, deploy NDRF 8th Battalion teams, and route population to designated high-elevation shelters.
                    </p>
                  </div>
                ) : prediction.overallRisk >= 55 ? (
                  <div className="protocol-card warning">
                    <strong>⚠️ STAGE 2: PRE-EMPTIVE ALERT & STAGING</strong>
                    <p>
                      Close low-lying riverbank roads (NH-7). Issue cell-broadcast warning to vulnerable villages. Put medical relief response units on 15-minute standby.
                    </p>
                  </div>
                ) : (
                  <div className="protocol-card normal">
                    <strong>✅ STAGE 1: ROUTINE HYDROLOGICAL SURVEILLANCE</strong>
                    <p>
                      All slope shear parameters and drainage discharge rates remain within tolerable thresholds. Continue 5-minute automated telemetry polling.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p>Run simulation to view computed results.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimulationLab;
