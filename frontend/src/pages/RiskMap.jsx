import MapView from "../components/MapView";

function RiskMap() {
  return (
    <div className="risk-map-page">
      <div className="page-header">
        <h1>Live Risk Map</h1>

        <p>
          Real-time village and ward-level
          disaster risk monitoring.
        </p>
      </div>

      <MapView height="700px" />
    </div>
  );
}

export default RiskMap;