import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Cpu,
  Database,
  Gauge,
  Loader2,
  PlusCircle,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
} from "lucide-react";

import {
  createSensor,
  predictRisk,
  getSensors,
  deleteSensor,
} from "../services/api";

import { useToast } from "../context/ToastContext";

const SENSOR_TYPES = {
  Rainfall: {
    unit: "mm",
    placeholder: "e.g. 85.5",
    min: 0,
    max: 1000,
  },
  "Soil Moisture": {
    unit: "%",
    placeholder: "e.g. 72",
    min: 0,
    max: 100,
  },
  Slope: {
    unit: "%",
    placeholder: "e.g. 42.5",
    min: 0,
    max: 100,
  },
  "Water Level": {
    unit: "m",
    placeholder: "e.g. 3.2",
    min: 0,
    max: 100,
  },
  Temperature: {
    unit: "°C",
    placeholder: "e.g. 24.5",
    min: -50,
    max: 70,
  },
};

const INITIAL_SENSOR = {
  sensorId: "",
  location: "",
  type: "Rainfall",
  value: "",
  unit: "mm",
  status: "Online",
};

function AdminPanel() {
  const { addToast, success, error: toastError, warning } = useToast();

  const [sensor, setSensor] = useState(INITIAL_SENSOR);
  const [sensorList, setSensorList] = useState([]);
  const [addingSensor, setAddingSensor] = useState(false);
  const [loadingSensors, setLoadingSensors] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadSensors = useCallback(
    async (showLoader = false) => {
      try {
        if (showLoader) setRefreshing(true);
        else setLoadingSensors(true);

        const res = await getSensors();

        const sensors = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.sensors)
            ? res.data.sensors
            : [];

        setSensorList(sensors);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Sensor inventory load failed:", err);

        toastError?.("Unable to load telemetry inventory.", {
          title: "Telemetry Sync Failed",
        });
      } finally {
        setLoadingSensors(false);
        setRefreshing(false);
      }
    },
    [toastError]
  );

  useEffect(() => {
    loadSensors();

    const interval = setInterval(() => {
      loadSensors();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadSensors]);

  const handleSensorChange = useCallback((event) => {
    const { name, value } = event.target;

    if (name === "type") {
      const configuration = SENSOR_TYPES[value];

      setSensor((previous) => ({
        ...previous,
        type: value,
        unit: configuration?.unit || "",
      }));

      return;
    }

    setSensor((previous) => ({
      ...previous,
      [name]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setSensor(INITIAL_SENSOR);
  }, []);

  const validateSensor = useCallback(() => {
    const sensorId = sensor.sensorId.trim();
    const location = sensor.location.trim();
    const numericValue = Number(sensor.value);
    const configuration = SENSOR_TYPES[sensor.type];

    if (!sensorId) {
      toastError?.("A unique station ID is required.", {
        title: "Validation Error",
      });
      return false;
    }

    if (!location) {
      toastError?.("A station location is required.", {
        title: "Validation Error",
      });
      return false;
    }

    if (sensor.value === "" || !Number.isFinite(numericValue)) {
      toastError?.("Enter a valid telemetry reading.", {
        title: "Invalid Reading",
      });
      return false;
    }

    if (
      configuration &&
      (numericValue < configuration.min || numericValue > configuration.max)
    ) {
      toastError?.(
        `${sensor.type} must be between ${configuration.min} and ${configuration.max}.`,
        {
          title: "Reading Out of Range",
        }
      );
      return false;
    }

    const duplicate = sensorList.some(
      (item) =>
        item.sensorId?.trim().toLowerCase() === sensorId.toLowerCase()
    );

    if (duplicate) {
      toastError?.(`Station ID "${sensorId}" already exists.`, {
        title: "Duplicate Station",
      });
      return false;
    }

    return true;
  }, [sensor, sensorList, toastError]);

  const addSensor = async (event) => {
    event.preventDefault();

    if (!validateSensor()) return;

    setAddingSensor(true);

    const payload = {
      ...sensor,
      sensorId: sensor.sensorId.trim(),
      location: sensor.location.trim(),
      value: Number(sensor.value),
      unit: SENSOR_TYPES[sensor.type]?.unit || sensor.unit,
    };

    try {
      const response = await createSensor(payload);

      const createdSensor =
        response?.data?.sensor || response?.data || payload;

      setSensorList((previous) => {
        const alreadyExists = previous.some(
          (item) =>
            item.sensorId?.toLowerCase() ===
            createdSensor.sensorId?.toLowerCase()
        );

        return alreadyExists
          ? previous
          : [...previous, createdSensor];
      });

      success?.(
        `Station ${payload.sensorId} is now registered and available to the disaster grid.`,
        {
          title: "Telemetry Node Registered",
        }
      );

      resetForm();
      setLastUpdated(new Date());

      await loadSensors();
    } catch (err) {
      console.error("Sensor registration failed:", err);

      toastError?.(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "The telemetry node could not be registered.",
        {
          title: "Registration Failed",
        }
      );
    } finally {
      setAddingSensor(false);
    }
  };

  const handleDeleteSensor = async (sensorItem) => {
    const sensorId = sensorItem?._id || sensorItem?.sensorId;

    if (!sensorId) return;

    const confirmed = window.confirm(
      `Remove telemetry node "${sensorItem.sensorId}" from the active inventory?`
    );

    if (!confirmed) return;

    setDeletingId(sensorId);

    try {
      if (typeof deleteSensor === "function") {
        await deleteSensor(sensorId);
      } else {
        throw new Error(
          "deleteSensor is not available in ../services/api."
        );
      }

      setSensorList((previous) =>
        previous.filter(
          (item) =>
            item._id !== sensorItem._id &&
            item.sensorId !== sensorItem.sensorId
        )
      );

      if (selectedSensor?.sensorId === sensorItem.sensorId) {
        setSelectedSensor(null);
      }

      success?.(`Node ${sensorItem.sensorId} has been removed.`, {
        title: "Node Decommissioned",
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Sensor deletion failed:", err);

      toastError?.(
        err?.response?.data?.message ||
          err?.message ||
          "The telemetry node could not be removed.",
        {
          title: "Decommission Failed",
        }
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSensors = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return sensorList.filter((item) => {
      const matchesSearch =
        !query ||
        item.sensorId?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query) ||
        item.type?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        item.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [sensorList, searchTerm, statusFilter]);

  const fleetStats = useMemo(() => {
    const online = sensorList.filter(
      (item) => item.status?.toLowerCase() === "online"
    ).length;

    const warningCount = sensorList.filter(
      (item) => item.status?.toLowerCase() === "warning"
    ).length;

    const offline = sensorList.filter(
      (item) => item.status?.toLowerCase() === "offline"
    ).length;

    const readings = sensorList
      .map((item) => Number(item.value))
      .filter(Number.isFinite);

    const average =
      readings.length > 0
        ? readings.reduce((sum, value) => sum + value, 0) / readings.length
        : 0;

    return {
      total: sensorList.length,
      online,
      warning: warningCount,
      offline,
      average,
    };
  }, [sensorList]);

  const selectedConfiguration = SENSOR_TYPES[sensor.type];

  return (
    <div className="admin-page animate-fade-in">
      <div className="page-header-pro">
        <div className="header-left">
          <div className="header-icon-box gold">
            <SlidersHorizontal size={24} className="text-gold" />
          </div>

          <div>
            <div className="page-eyebrow">
              <ShieldCheck size={14} />
              ADMINISTRATOR ACCESS • COMMAND CENTER
            </div>

            <h1>Mission Control & Node Management</h1>

            <p>
              Register IoT telemetry stations, monitor fleet health, validate
              field readings and manage disaster-grid infrastructure.
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadSensors(true)}
            disabled={refreshing}
            title="Synchronize telemetry inventory"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Syncing..." : "Synchronize"}
          </button>
        </div>
      </div>

      <div className="system-diagnostics-grid">
        <div className="diag-card">
          <Database size={20} className="text-emerald" />

          <div>
            <strong>MongoDB Engine</strong>
            <small>
              <CheckCircle2 size={12} /> Database operational
            </small>
          </div>
        </div>

        <div className="diag-card">
          <Server size={20} className="text-cyan" />

          <div>
            <strong>Express API Gateway</strong>
            <small>
              <Activity size={12} /> API communication ready
            </small>
          </div>
        </div>

        <div className="diag-card">
          <Radio size={20} className="text-gold" />

          <div>
            <strong>Telemetry Fleet</strong>
            <small>
              {fleetStats.online} Online • {fleetStats.warning} Warning •{" "}
              {fleetStats.offline} Offline
            </small>
          </div>
        </div>

        <div className="diag-card">
          <Cpu size={20} className="text-purple" />

          <div>
            <strong>Risk Intelligence Engine</strong>
            <small>
              <Zap size={12} /> Prediction services ready
            </small>
          </div>
        </div>
      </div>

      <div className="fleet-overview-grid">
        <div className="overview-stat-card">
          <div className="overview-stat-icon">
            <Radio size={20} />
          </div>
          <div>
            <span>Total Nodes</span>
            <strong>{fleetStats.total}</strong>
          </div>
        </div>

        <div className="overview-stat-card">
          <div className="overview-stat-icon">
            <Wifi size={20} />
          </div>
          <div>
            <span>Online</span>
            <strong>{fleetStats.online}</strong>
          </div>
        </div>

        <div className="overview-stat-card">
          <div className="overview-stat-icon">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span>Warning</span>
            <strong>{fleetStats.warning}</strong>
          </div>
        </div>

        <div className="overview-stat-card">
          <div className="overview-stat-icon">
            <Gauge size={20} />
          </div>
          <div>
            <span>Fleet Readings</span>
            <strong>
              {fleetStats.average ? fleetStats.average.toFixed(1) : "0.0"}
            </strong>
          </div>
        </div>
      </div>

      <div className="admin-grid-pro">
        <div className="admin-card">
          <div className="admin-card-title-row">
            <div className="title-icon cyan">
              <PlusCircle size={18} />
            </div>

            <div>
              <h3>Deploy New IoT Telemetry Node</h3>
              <p>Register a field station into the active monitoring grid.</p>
            </div>
          </div>

          <form onSubmit={addSensor} className="admin-form-pro" noValidate>
            <div className="form-group">
              <label htmlFor="sensorId">
                Station Unique ID <span>*</span>
              </label>

              <input
                id="sensorId"
                name="sensorId"
                type="text"
                autoComplete="off"
                placeholder="e.g. SN-RF-202"
                value={sensor.sensorId}
                onChange={handleSensorChange}
                maxLength={64}
                required
              />

              <small>
                Use a unique identifier for this physical telemetry node.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="location">
                Himalayan Location / Station Name <span>*</span>
              </label>

              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. Kedarnath Valley Station"
                value={sensor.location}
                onChange={handleSensorChange}
                maxLength={150}
                required
              />
            </div>

            <div className="form-row-two">
              <div className="form-group">
                <label htmlFor="type">Telemetry Sensor Type</label>

                <div className="select-wrapper">
                  <select
                    id="type"
                    name="type"
                    value={sensor.type}
                    onChange={handleSensorChange}
                  >
                    {Object.keys(SENSOR_TYPES).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <ChevronDown size={16} />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="status">Operational Status</label>

                <div className="select-wrapper">
                  <select
                    id="status"
                    name="status"
                    value={sensor.status}
                    onChange={handleSensorChange}
                  >
                    <option value="Online">Online</option>
                    <option value="Warning">Warning</option>
                    <option value="Offline">Offline</option>
                  </select>

                  <ChevronDown size={16} />
                </div>
              </div>
            </div>

            <div className="form-row-two">
              <div className="form-group">
                <label htmlFor="value">
                  Current Value Reading <span>*</span>
                </label>

                <input
                  id="value"
                  name="value"
                  type="number"
                  step="any"
                  min={selectedConfiguration?.min}
                  max={selectedConfiguration?.max}
                  placeholder={selectedConfiguration?.placeholder}
                  value={sensor.value}
                  onChange={handleSensorChange}
                  required
                />

                {selectedConfiguration && (
                  <small>
                    Valid range: {selectedConfiguration.min} –{" "}
                    {selectedConfiguration.max}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="unit">Telemetry Unit</label>

                <input
                  id="unit"
                  name="unit"
                  value={sensor.unit}
                  onChange={handleSensorChange}
                  readOnly
                  aria-readonly="true"
                />
              </div>
            </div>

            <div className="sensor-preview">
              <div className="sensor-preview-icon">
                <Radio size={18} />
              </div>

              <div>
                <strong>
                  {sensor.sensorId || "UNREGISTERED NODE"}
                </strong>

                <span>
                  {sensor.location || "Location pending"} • {sensor.type} •{" "}
                  {sensor.value || "--"} {sensor.unit}
                </span>
              </div>

              <span
                className={`status-badge-mini ${sensor.status.toLowerCase()}`}
              >
                {sensor.status}
              </span>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
                disabled={addingSensor}
              >
                Reset
              </button>

              <button
                type="submit"
                className="btn-primary btn-full-width"
                disabled={addingSensor}
              >
                {addingSensor ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Registering Node...
                  </>
                ) : (
                  <>
                    <Zap size={17} />
                    Register & Broadcast Node
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="admin-card">
          <div className="admin-card-title-row">
            <div className="title-icon gold">
              <Radio size={18} />
            </div>

            <div>
              <h3>Deployed Node Inventory</h3>
              <p>
                {filteredSensors.length} of {sensorList.length} nodes displayed
              </p>
            </div>

            <span className="inventory-count">
              {sensorList.length}
            </span>
          </div>

          <div className="inventory-toolbar">
            <input
              type="search"
              placeholder="Search node, location or type..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search telemetry nodes"
            />

            <div className="select-wrapper compact">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter nodes by status"
              >
                <option value="All">All Status</option>
                <option value="Online">Online</option>
                <option value="Warning">Warning</option>
                <option value="Offline">Offline</option>
              </select>

              <ChevronDown size={14} />
            </div>
          </div>

          <div className="node-inventory-scroll">
            {loadingSensors ? (
              <div className="inventory-state">
                <Loader2 size={24} className="animate-spin" />
                <strong>Synchronizing telemetry fleet...</strong>
                <span>Retrieving current node inventory.</span>
              </div>
            ) : filteredSensors.length === 0 ? (
              <div className="inventory-state">
                <Radio size={28} />
                <strong>
                  {sensorList.length === 0
                    ? "No telemetry nodes registered"
                    : "No matching nodes"}
                </strong>
                <span>
                  {sensorList.length === 0
                    ? "Deploy your first IoT telemetry node using the registration form."
                    : "Try changing your search or status filter."}
                </span>
              </div>
            ) : (
              filteredSensors.map((item) => {
                const itemId = item._id || item.sensorId;
                const status = item.status?.toLowerCase() || "offline";

                return (
                  <div
                    key={itemId}
                    className={`node-inventory-row ${
                      selectedSensor?.sensorId === item.sensorId
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => setSelectedSensor(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setSelectedSensor(item);
                      }
                    }}
                  >
                    <div className="node-health-indicator">
                      {status === "online" ? (
                        <CheckCircle2 size={17} />
                      ) : status === "warning" ? (
                        <AlertTriangle size={17} />
                      ) : (
                        <WifiOff size={17} />
                      )}
                    </div>

                    <div className="node-info">
                      <span className="node-id-code">
                        {item.sensorId || "UNKNOWN-ID"}
                      </span>

                      <strong className="node-loc">
                        {item.location || "Unknown Location"}
                      </strong>

                      <small className="node-type">
                        {item.type || "Unknown Sensor"} •{" "}
                        {item.value ?? "--"} {item.unit || ""}
                      </small>

                      {item.updatedAt && (
                        <small className="node-updated">
                          <Clock3 size={11} />
                          Updated{" "}
                          {new Date(item.updatedAt).toLocaleString()}
                        </small>
                      )}
                    </div>

                    <div className="node-row-actions">
                      <span
                        className={`status-badge-mini ${status}`}
                      >
                        {item.status || "Offline"}
                      </span>

                      <button
                        type="button"
                        className="icon-danger-button"
                        title={`Remove ${item.sensorId}`}
                        aria-label={`Remove ${item.sensorId}`}
                        disabled={deletingId === itemId}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteSensor(item);
                        }}
                      >
                        {deletingId === itemId ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="inventory-footer">
            <span>
              <Activity size={13} />
              Live inventory synchronization enabled
            </span>

            <span>
              Last sync:{" "}
              {lastUpdated
                ? lastUpdated.toLocaleTimeString()
                : "Waiting..."}
            </span>
          </div>
        </div>
      </div>

      {selectedSensor && (
        <div className="admin-card selected-node-card">
          <div className="admin-card-title-row">
            <div className="title-icon cyan">
              <Activity size={18} />
            </div>

            <div>
              <h3>Selected Node Diagnostics</h3>
              <p>
                Detailed telemetry information for{" "}
                {selectedSensor.sensorId}
              </p>
            </div>

            <button
              type="button"
              className="icon-button"
              onClick={() => setSelectedSensor(null)}
              aria-label="Close node diagnostics"
            >
              <XCircle size={18} />
            </button>
          </div>

          <div className="node-diagnostics-grid">
            <div>
              <span>Station ID</span>
              <strong>{selectedSensor.sensorId || "--"}</strong>
            </div>

            <div>
              <span>Location</span>
              <strong>{selectedSensor.location || "--"}</strong>
            </div>

            <div>
              <span>Sensor Type</span>
              <strong>{selectedSensor.type || "--"}</strong>
            </div>

            <div>
              <span>Current Reading</span>
              <strong>
                {selectedSensor.value ?? "--"} {selectedSensor.unit || ""}
              </strong>
            </div>

            <div>
              <span>Operational Status</span>
              <strong>{selectedSensor.status || "--"}</strong>
            </div>

            <div>
              <span>Database Identifier</span>
              <strong>{selectedSensor._id || "N/A"}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;