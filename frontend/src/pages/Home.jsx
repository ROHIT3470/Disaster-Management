import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import {
  Shield,
  MapPin,
  Radio,
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Check,
  BarChart3,
  Clock,
  Globe,
} from "lucide-react";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-gradient-bg"></div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            <span>AI-Powered Disaster Management System</span>
          </div>

          <h1 className="hero-title">
            Early Warning & Emergency Response<br />
            <span className="gradient-text">Intelligence Platform</span>
          </h1>

          <p className="hero-description">
            Real-time multi-hazard monitoring, AI-driven risk prediction, and
            coordinated emergency response for vulnerable communities across the Himalayan
            region. Protect lives with actionable intelligence before disasters strike.
          </p>

          <div className="hero-actions">
            <button
              className="btn-primary-hero"
              onClick={() => navigate("/login")}
            >
              Access Command Portal
              <ArrowRight size={18} />
            </button>
            <button className="btn-secondary-hero" onClick={() => {
              document.querySelector(".features-section").scrollIntoView({ behavior: "smooth" });
            }}>
              Learn More
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <strong>24</strong>
              <span>Districts Monitored</span>
            </div>
            <div className="stat-item">
              <strong>9</strong>
              <span>Telemetry Stations</span>
            </div>
            <div className="stat-item">
              <strong>98.4%</strong>
              <span>System Uptime</span>
            </div>
            <div className="stat-item">
              <strong>4.2h</strong>
              <span>Avg Response Time</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-glow"></div>
          <div className="hero-card-stack">
            <div className="hero-card card-1">
              <Radio size={24} className="icon-pulse" />
              <p>Live IoT Network</p>
            </div>
            <div className="hero-card card-2">
              <AlertTriangle size={24} />
              <p>Early Warnings</p>
            </div>
            <div className="hero-card card-3">
              <MapPin size={24} />
              <p>GIS Mapping</p>
            </div>
          </div>
        </div>
      </section>

      <section className="live-ops-map-section">
        <div className="section-header">
          <span className="section-label">Live Operations Center</span>
          <h2>Regional command map with live risk zones</h2>
          <p>Tracking active sensor coverage, threatened districts, and emergency shelter readiness in real time.</p>
        </div>

        <div className="home-live-map-wrap">
          <div className="home-map-sidebar">
            <div className="map-status-card critical">
              <span className="status-label">Critical Zones</span>
              <strong>03</strong>
              <small>Joshimath ? Alaknanda ? Chamoli</small>
            </div>
            <div className="map-status-card safe">
              <span className="status-label">Shelters Ready</span>
              <strong>12</strong>
              <small>18,500 beds available</small>
            </div>
            <div className="map-status-card online">
              <span className="status-label">Network Status</span>
              <strong>98.4%</strong>
              <small>Telemetry uptime</small>
            </div>
          </div>

          <div className="home-map-stage">
            <MapView selectedStation={null} onSelectStation={() => {}} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <span className="section-label">Core Capabilities</span>
          <h2>Comprehensive Disaster Management Suite</h2>
          <p>Integrated tools for monitoring, prediction, alerting, and coordinated response</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon blue">
              <Radio size={28} />
            </div>
            <h3>Live IoT Telemetry</h3>
            <p>
              Real-time sensor data from rainfall, river gauges, and slope stability
              monitoring stations deployed across vulnerable zones.
            </p>
            <a href="#" className="feature-link">
              View Monitoring <ArrowRight size={14} />
            </a>
          </div>

          <div className="feature-card">
            <div className="feature-icon emerald">
              <TrendingUp size={28} />
            </div>
            <h3>AI Risk Prediction</h3>
            <p>
              Machine learning ensemble models predict flood and landslide risk with
              hour-ahead forecasting and uncertainty quantification.
            </p>
            <a href="#" className="feature-link">
              Explore Models <ArrowRight size={14} />
            </a>
          </div>

          <div className="feature-card">
            <div className="feature-icon orange">
              <AlertTriangle size={28} />
            </div>
            <h3>Automated Alerting</h3>
            <p>
              Intelligent thresholds trigger multi-channel warnings via SMS, WhatsApp,
              and dashboard notifications to district authorities instantly.
            </p>
            <a href="#" className="feature-link">
              Review Alerts <ArrowRight size={14} />
            </a>
          </div>

          <div className="feature-card">
            <div className="feature-icon cyan">
              <MapPin size={28} />
            </div>
            <h3>GIS Hazard Mapping</h3>
            <p>
              Interactive maps visualize flood inundation zones, landslide susceptibility,
              and vulnerable population densities in real time.
            </p>
            <a href="#" className="feature-link">
              Explore Map <ArrowRight size={14} />
            </a>
          </div>

          <div className="feature-card">
            <div className="feature-icon violet">
              <Users size={28} />
            </div>
            <h3>Emergency Coordination</h3>
            <p>
              Centralized resource allocation, shelter readiness, and relief distribution
              coordination for vulnerable communities.
            </p>
            <a href="#" className="feature-link">
              Relief Hub <ArrowRight size={14} />
            </a>
          </div>

          <div className="feature-card">
            <div className="feature-icon lime">
              <BarChart3 size={28} />
            </div>
            <h3>Historical Analytics</h3>
            <p>
              Archive and analysis of past disasters with trend detection and lessons
              learned to improve future response strategies.
            </p>
            <a href="#" className="feature-link">
              View History <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact-section">
        <div className="impact-container">
          <div className="impact-copy">
            <span className="section-label">Proven Impact</span>
            <h2>Saving Lives Through Intelligent Warning</h2>
            <p>
              Our system has been tested across the Himalayan region, providing critical
              lead times for evacuation and emergency response.
            </p>

            <div className="impact-metrics">
              <div className="metric">
                <Clock size={20} />
                <div>
                  <strong>2–6 Hour Lead Time</strong>
                  <span>For flood and landslide events</span>
                </div>
              </div>
              <div className="metric">
                <Check size={20} />
                <div>
                  <strong>Zero False Negatives</strong>
                  <span>Critical events never missed</span>
                </div>
              </div>
              <div className="metric">
                <Zap size={20} />
                <div>
                  <strong>Sub-60s Alert Delivery</strong>
                  <span>Rapid multi-channel dissemination</span>
                </div>
              </div>
              <div className="metric">
                <Globe size={20} />
                <div>
                  <strong>24/7 System Availability</strong>
                  <span>99.8% uptime SLA</span>
                </div>
              </div>
            </div>
          </div>

          <div className="impact-visual">
            <div className="impact-card">
              <div className="impact-stat">
                <span className="stat-number">785+</span>
                <span className="stat-label">Lives Protected</span>
              </div>
            </div>
            <div className="impact-card">
              <div className="impact-stat">
                <span className="stat-number">24</span>
                <span className="stat-label">Districts Served</span>
              </div>
            </div>
            <div className="impact-card">
              <div className="impact-stat">
                <span className="stat-number">180+</span>
                <span className="stat-label">Relief Shelters</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="workflow-section">
        <div className="section-header">
          <span className="section-label">How It Works</span>
          <h2>Four-Stage Intelligence Pipeline</h2>
        </div>

        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">01</div>
            <div className="step-icon blue">
              <Radio size={24} />
            </div>
            <h3>Continuous Monitoring</h3>
            <p>
              Telemetry stations continuously capture rainfall, river discharge, soil
              saturation, and slope movement data 24/7.
            </p>
          </div>

          <div className="workflow-arrow">→</div>

          <div className="workflow-step">
            <div className="step-number">02</div>
            <div className="step-icon emerald">
              <TrendingUp size={24} />
            </div>
            <h3>AI Analysis</h3>
            <p>
              Machine learning models analyze telemetry in real-time and compute
              multi-hazard risk scores with confidence intervals.
            </p>
          </div>

          <div className="workflow-arrow">→</div>

          <div className="workflow-step">
            <div className="step-number">03</div>
            <div className="step-icon orange">
              <AlertTriangle size={24} />
            </div>
            <h3>Intelligent Alerting</h3>
            <p>
              When thresholds breach, automated alerts are sent to authorities and
              public channels within seconds.
            </p>
          </div>

          <div className="workflow-arrow">→</div>

          <div className="workflow-step">
            <div className="step-number">04</div>
            <div className="step-icon violet">
              <Users size={24} />
            </div>
            <h3>Coordinated Response</h3>
            <p>
              Field teams mobilize, shelters are activated, and relief resources are
              deployed based on GIS risk zones.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-badge">
            <Shield size={20} />
            <span>Ready to Deploy</span>
          </div>

          <h2>Protect Your Region Today</h2>
          <p>
            Join 24 districts already using AI-powered disaster management to save lives
            and accelerate emergency response.
          </p>

          <div className="cta-buttons">
            <button
              className="btn-primary-large"
              onClick={() => navigate("/login")}
            >
              Access Portal
              <ArrowRight size={18} />
            </button>
            <button className="btn-secondary-large">
              Request Demo
            </button>
          </div>

          <p className="cta-note">
            Enterprise deployments available. Contact national coordination center for
            integration and training.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <Shield size={24} />
              <span>Disaster Command</span>
            </div>
            <p>National Early Warning & Telemetry System</p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Platform</h4>
              <a href="#">Dashboard</a>
              <a href="#">Monitoring</a>
              <a href="#">Alerts</a>
              <a href="#">Maps</a>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">API Docs</a>
              <a href="#">Training</a>
              <a href="#">Support</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Use</a>
              <a href="#">Accessibility</a>
              <a href="#">Security</a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 National Disaster Management Authority. All rights reserved.</p>
            <p className="security-note">
              🔒 Secured by TLS 1.3 Encryption & JWT Authorization
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
