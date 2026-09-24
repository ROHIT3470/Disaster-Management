import { useEffect, useState } from "react";
import SensorCard from "../components/SensorCard";
import Loading from "../components/Loading";
import { getSensors } from "../services/api";
import {
  Radio,
  Search,
  Filter,
  Zap,
  ZapOff,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "../context/ToastContext";

function LiveMonitoring() {
  const { addToast } = useToast();
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isSimulating, setIsSimulating] = useState(true);

  useEffect(() => {
    loadSensors();
    const interval = setInterval(loadSensors, 6000);
    return () => clearInterval(interval);
  }, []);

  // Live IoT telemetry simulation effect
  useEffect(() => {
    if (!isSimulating) return;

    const simInterval = setInterval(() => {
      setSensors((prevSensors) =>
        prevSensors.map((sensor) => {
          // Slight realistic telemetry jitter
          const delta = (Math.random() - 0.48) * (sensor.type === "Rainfall" ? 1.5 : 0.8);
          const rawVal = Math.max(0, Math.round((Number(sensor.value) + delta) * 10) / 10);
          return {
            ...sensor,
            value: rawVal,
            lastSeen: new Date(),
          };
        })
      );
    }, 3500);

    return () => clearInterval(simInterval);
  }, [isSimulating]);

  const loadSensors = async () => {
    try {
      const response = await getSensors();
      if (response.data && response.data.length > 0) {
        setSensors(response.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
    addToast({
      title: isSimulating ? "Live Telemetry Simulator Paused" : "Live Telemetry Simulator Active",
      message: isSimulating
        ? "Switched to standard polling mode."
        : "Injecting simulated real-time IoT packet stream.",
      type: isSimulating ? "info" : "success",
    });
  };

  if (loading) return <Loading message="Querying Himalayan IoT Telemetry Gateways..." />;

  const filteredSensors = sensors.filter((sensor) => {
    const matchesSearch =
      sensor.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.sensorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === "all" ||
      sensor.type.toLowerCase().includes(selectedType.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" ||
      sensor.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  const onlineCount = sensors.filter((s) => s.status === "Online").length;
  const warningCount = sensors.filter((s) => s.status === "Warning").length;

  return (
    <div className="live-monitoring-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header-pro">
        <div className="header-left">
          <div className="header-icon-box">
            <Radio size={24} className="radar-sweep-icon text-cyan" />
          </div>
          <div>
            <h1>IoT Sensor Fleet & Telemetry</h1>
            <p>Real-time environmental telemetry stream across Himalayan hazard zones</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className={`btn-stream-toggle ${isSimulating ? "sim-active" : ""}`}
            onClick={toggleSimulation}
          >
            {isSimulating ? (
              <>
                <Zap size={16} className="text-gold pulse-fast" />
                <span>Live Stream: SIMULATING</span>
              </>
            ) : (
              <>
                <ZapOff size={16} />
                <span>Stream: STATIC</span>
              </>
            )}
          </button>

          <button className="btn-secondary" onClick={loadSensors} title="Refresh Telemetry">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Fleet Stats Summary Bar */}
      <div className="fleet-stats-bar">
        <div className="fleet-stat-card">
          <Activity size={20} className="text-cyan" />
          <div>
            <strong>{sensors.length} Nodes</strong>
            <small>Active Deployment</small>
          </div>
        </div>

        <div className="fleet-stat-card">
          <CheckCircle2 size={20} className="text-emerald" />
          <div>
            <strong>{onlineCount} Stations</strong>
            <small>Nominal Status</small>
          </div>
        </div>

        <div className="fleet-stat-card">
          <AlertTriangle size={20} className="text-gold" />
          <div>
            <strong>{warningCount} Threshold Warnings</strong>
            <small>Surge Alert Level</small>
          </div>
        </div>

        <div className="fleet-stat-card">
          <span className="rssi-icon">📶</span>
          <div>
            <strong>-64 dBm Avg</strong>
            <small>LoRaWAN / 4G Signal</small>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="sensor-filter-controls">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Station Name, Sensor ID, or District..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-dropdowns">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Sensor Types</option>
            <option value="rainfall">🌧️ Rainfall</option>
            <option value="soil">🌱 Soil Moisture</option>
            <option value="slope">⛰️ Slope Stability</option>
            <option value="water">🌊 Water Level</option>
            <option value="temperature">🌡️ Temperature</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="online">🟢 Online</option>
            <option value="warning">🟡 Warning Threshold</option>
            <option value="offline">🔴 Offline</option>
          </select>
        </div>
      </div>

      {/* Sensor Grid */}
      <div className="sensor-grid-pro">
        {filteredSensors.length === 0 ? (
          <div className="empty-state-full">
            <Radio size={40} className="text-muted" />
            <h3>No Sensor Nodes Matched</h3>
            <p>Try clearing your filters or search keywords.</p>
          </div>
        ) : (
          filteredSensors.map((sensor) => (
            <SensorCard key={sensor._id || sensor.sensorId} sensor={sensor} />
          ))
        )}
      </div>
    </div>
  );
}

export default LiveMonitoring;
