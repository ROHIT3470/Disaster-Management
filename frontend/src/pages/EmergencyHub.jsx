import { useEffect, useState } from "react";
import {
  PhoneCall,
  LifeBuoy,
  Building2,
  CheckSquare,
  Square,
  Shield,
  Radio,
  ExternalLink,
  MapPin,
  Ambulance,
  Plane,
  HeartPulse,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { getLocations } from "../services/api";

const CONTACTS = [
  {
    agency: "National Disaster Response Force (NDRF)",
    phone: "011-24363260",
    alt: "9711077372",
    role: "National Tactical Search & Rescue Operations",
    badge: "24/7 National Command",
    icon: Shield,
    color: "#2563eb",
  },
  {
    agency: "State Disaster Response Force (SDRF)",
    phone: "1070",
    alt: "0135-2710334",
    role: "Uttarakhand & Himalayan Rapid Mountain Rescue",
    badge: "Immediate Response",
    icon: LifeBuoy,
    color: "#0891b2",
  },
  {
    agency: "Emergency Medical & Ambulance",
    phone: "108",
    alt: "112",
    role: "Paramedic Air & Ground Trauma Dispatch",
    badge: "Priority Toll-Free",
    icon: Ambulance,
    color: "#dc2626",
  },
  {
    agency: "Air Force SAR / Heli-Rescue Cell",
    phone: "011-23010231",
    alt: "0135-2661200",
    role: "Flood Inaccessible Area Aerial Evacuation",
    badge: "Aviation Rescue",
    icon: Plane,
    color: "#7c3aed",
  },
  {
    agency: "District Emergency Operations Center (DEOC)",
    phone: "1077",
    alt: "01372-251437",
    role: "Chamoli & Joshimath Ground Coordination",
    badge: "Local Command",
    icon: Radio,
    color: "#ea580c",
  },
];

const CHECKLIST = [
  "Pack waterproof Emergency Go-Bag with 3 days of non-perishable rations.",
  "Secure 3 liters of potable drinking water per person per day.",
  "Keep portable battery-powered radio tuned to Early Warning FM (102.4 MHz).",
  "Pack high-power LED flashlight with extra lithium batteries.",
  "Store vital identification papers, deeds & medical prescriptions in sealed polybags.",
  "Prepare Comprehensive First Aid Kit (antiseptic, bandages, trauma wraps, rehydration salts).",
  "Switch off main household electrical breaker and LPG gas valve before evacuating.",
  "Proceed only along designated high-elevation evacuation corridors (avoid culverts & stream beds).",
];

function EmergencyHub() {
  const { addToast } = useToast();
  const [checkedItems, setCheckedItems] = useState({});
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadLocations() {
      try {
        const response = await getLocations();
        if (mounted) {
          setLocations(Array.isArray(response.data) ? response.data : []);
          setLocationsError(false);
        }
      } catch (error) {
        console.error("Emergency locations load failed:", error);
        if (mounted) setLocationsError(true);
      } finally {
        if (mounted) setLocationsLoading(false);
      }
    }

    loadLocations();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleCheck = (index) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCopyPhone = (phone, agency) => {
    navigator.clipboard?.writeText(phone);
    addToast({
      title: "Contact Copied",
      message: `${agency} helpline (${phone}) copied to clipboard.`,
      type: "success",
    });
  };

  return (
    <div className="emergency-hub-page animate-fade-in">
      <div className="page-header-pro">
        <div className="header-left">
          <div className="header-icon-box danger">
            <LifeBuoy size={24} className="text-red" />
          </div>
          <div>
            <h1>Emergency Response Hub & Relief Directory</h1>
            <p>Direct hotlines, active relief shelters & survival evacuation protocols</p>
          </div>
        </div>
      </div>

      {/* Helplines Grid */}
      <div className="hub-section">
        <h3 className="section-title">
          <PhoneCall size={18} className="text-cyan" /> 24/7 Disaster Response Helplines
        </h3>
        <div className="contacts-grid-pro">
          {CONTACTS.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="contact-card-pro">
                <div className="contact-card-top">
                  <div
                    className="contact-icon-box"
                    style={{ backgroundColor: `${c.color}20`, color: c.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="contact-badge" style={{ borderColor: c.color, color: c.color }}>
                    {c.badge}
                  </span>
                </div>

                <h4>{c.agency}</h4>
                <p className="contact-role">{c.role}</p>

                <div className="contact-numbers">
                  <div className="phone-row">
                    <span className="phone-label">Primary Hotline:</span>
                    <strong
                      className="phone-val"
                      onClick={() => handleCopyPhone(c.phone, c.agency)}
                      title="Click to copy"
                    >
                      {c.phone}
                    </strong>
                  </div>
                  {c.alt && (
                    <div className="phone-row">
                      <span className="phone-label">Alternate:</span>
                      <span
                        className="phone-val-alt"
                        onClick={() => handleCopyPhone(c.alt, c.agency)}
                        title="Click to copy"
                      >
                        {c.alt}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-call-action"
                  onClick={() => handleCopyPhone(c.phone, c.agency)}
                >
                  <PhoneCall size={14} /> Copy Emergency Number
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Relief Shelters & Evacuation Checklist Split */}
      <div className="hub-two-col-grid">
        {/* Active Relief Shelters */}
        <div className="shelters-panel">
          <h3 className="section-title">
            <Building2 size={18} className="text-emerald" /> Verified Emergency Locations
          </h3>

          <div className="shelters-stack">
            {locationsLoading ? (
              <div className="empty-state-full">
                <p>Loading verified locations...</p>
              </div>
            ) : locationsError ? (
              <div className="empty-state-full">
                <p>Verified location data is temporarily unavailable.</p>
              </div>
            ) : locations.length === 0 ? (
              <div className="empty-state-full">
                <p>No verified shelter or relief location is currently published.</p>
                <small>Do not treat unverified locations as active evacuation sites.</small>
              </div>
            ) : locations.map((location) => (
              <div key={location._id || location.name} className="shelter-card-pro">
                <div className="shelter-header">
                  <div>
                    <h4>{location.name}</h4>
                    <span className="shelter-loc">
                      <MapPin size={13} /> {location.district || location.state}
                    </span>
                  </div>
                  <span className="shelter-status-tag">
                    {location.riskLevel || "Unclassified"} risk zone
                  </span>
                </div>

                <div className="shelter-specs-grid">
                  <div className="shelter-spec">
                    <label>Population</label>
                    <strong>{Number(location.population || 0).toLocaleString()}</strong>
                  </div>
                  <div className="shelter-spec">
                    <label>Coordinates</label>
                    <strong>{location.latitude}, {location.longitude}</strong>
                  </div>
                  <div className="shelter-spec">
                    <label>Data status</label>
                    <span>Backend verified location</span>
                  </div>
                  <div className="shelter-spec">
                    <label>Safety note</label>
                    <span>Confirm local access before travel</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evacuation Protocol Checklist */}
        <div className="checklist-panel">
          <h3 className="section-title">
            <CheckSquare size={18} className="text-gold" /> Citizen Evacuation Readiness Checklist
          </h3>

          <div className="checklist-card">
            <p className="checklist-subtitle">
              Interactive readiness verification checklist for families in red & orange hazard zones:
            </p>

            <div className="checklist-items-stack">
              {CHECKLIST.map((item, idx) => {
                const isChecked = !!checkedItems[idx];
                return (
                  <div
                    key={idx}
                    className={`checklist-item ${isChecked ? "completed" : ""}`}
                    onClick={() => toggleCheck(idx)}
                  >
                    <div className="check-box-icon">
                      {isChecked ? (
                        <CheckSquare size={18} className="text-emerald" />
                      ) : (
                        <Square size={18} className="text-muted" />
                      )}
                    </div>
                    <span className="check-text">{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmergencyHub;
