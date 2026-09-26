import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import { getDisasters } from "../services/api";
import { exportToCSV } from "../utils/exportUtils";
import {
  History,
  Download,
  Search,
  Calendar,
  MapPin,
} from "lucide-react";
import { useToast } from "../context/ToastContext";

function HistoricalData() {
  const { addToast } = useToast();
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");

  useEffect(() => {
    loadDisasters();
  }, []);

  const loadDisasters = async () => {
    try {
      const response = await getDisasters();
      setDisasters(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!disasters.length) {
      addToast({
        title: "No Data Available",
        message: "There are no historical disaster records to export.",
        type: "warning",
      });
      return;
    }

    const formatted = disasters.map((d) => ({
      "Record ID": d._id || "",
      Location: d.location || "N/A",
      "Hazard Type": d.type || "N/A",
      Severity: d.severity || "N/A",
      "Incident Date": d.date
        ? new Date(d.date).toLocaleDateString("en-IN")
        : "N/A",
      Description: d.description || "N/A",
    }));

    exportToCSV(
      `GeoNexus_Historical_Disaster_Overall_Report_${Date.now()}.csv`,
      formatted
    );

    addToast({
      title: "Overall Report Exported",
      message: `Successfully exported all ${formatted.length} historical disaster records.`,
      type: "success",
    });
  };

  if (loading) {
    return (
      <Loading message="Loading Historical Catastrophe Datasets..." />
    );
  }

  const filteredDisasters = disasters.filter((d) => {
    const location = d.location?.toLowerCase() || "";
    const description = d.description?.toLowerCase() || "";
    const type = d.type?.toLowerCase() || "";
    const severity = d.severity?.toLowerCase() || "";

    const matchesSearch =
      location.includes(searchTerm.toLowerCase()) ||
      description.includes(searchTerm.toLowerCase()) ||
      type.includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === "all" ||
      type.includes(selectedType.toLowerCase());

    const matchesSeverity =
      selectedSeverity === "all" ||
      severity === selectedSeverity.toLowerCase();

    return matchesSearch && matchesType && matchesSeverity;
  });

  return (
    <div className="historical-page animate-fade-in">
      <div className="page-header-pro">
        <div className="header-left">
          <div className="header-icon-box purple">
            <History size={24} className="text-purple" />
          </div>

          <div>
            <h1>Historical Incident Archive & Analytics</h1>
            <p>
              Past floods, cloudbursts, and geological slope failures in the
              Garhwal & Himachal sectors
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-primary" onClick={handleExportCSV}>
            <Download size={16} /> Export Overall Report (.CSV)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="sensor-filter-controls">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />

          <input
            type="text"
            placeholder="Search by Location (Chamoli, Kedarnath, Malpa, Kullu) or Keywords..."
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
            <option value="all">All Hazard Types</option>
            <option value="flash flood">🌊 Flash Flood</option>
            <option value="cloudburst">⛈️ Cloudburst</option>
            <option value="landslide">⛰️ Landslide</option>
            <option value="flood">💧 General Flood</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Severities</option>
            <option value="critical">🔴 Critical Catastrophe</option>
            <option value="high">🟠 High Impact</option>
            <option value="moderate">🟡 Moderate Severity</option>
          </select>
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="table-wrapper-pro">
        {filteredDisasters.length === 0 ? (
          <div className="empty-state-full">
            <History size={40} className="text-muted" />
            <h3>No Records Match Query</h3>
            <p>Try refining your search keyword or reset filters.</p>
          </div>
        ) : (
          <table className="data-table-pro">
            <thead>
              <tr>
                <th>Location / Sector</th>
                <th>Hazard Classification</th>
                <th>Severity Level</th>
                <th>Date of Incident</th>
                <th>Incident Synopsis & Impact Details</th>
              </tr>
            </thead>

            <tbody>
              {filteredDisasters.map((disaster) => (
                <tr key={disaster._id || Math.random()}>
                  <td className="font-semibold text-primary-theme">
                    <div className="table-loc-row">
                      <MapPin size={14} className="text-cyan" />
                      <span>{disaster.location || "N/A"}</span>
                    </div>
                  </td>

                  <td>
                    <span className="hazard-type-pill">
                      {disaster.type || "N/A"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`severity-badge-pro ${
                        disaster.severity?.toLowerCase() || ""
                      }`}
                    >
                      {disaster.severity || "N/A"}
                    </span>
                  </td>

                  <td className="text-muted-theme whitespace-nowrap">
                    <div className="table-date-row">
                      <Calendar size={13} />

                      <span>
                        {disaster.date
                          ? new Date(disaster.date).toLocaleDateString(
                              "en-IN",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "N/A"}
                      </span>
                    </div>
                  </td>

                  <td className="text-secondary-theme desc-cell">
                    {disaster.description || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default HistoricalData;