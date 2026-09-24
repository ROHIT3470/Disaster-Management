import { useNavigate } from "react-router-dom";
import {
  FileText,
  Shield,
  Lock,
  Eye,
  AlertCircle,
  Check,
} from "lucide-react";

function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="legal-page privacy-page">
      <div className="legal-header">
        <Shield size={40} />
        <h1>Privacy Policy</h1>
        <p>Last updated: 2026-08-30</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>1. Introduction</h2>
          <p>
            The Disaster Management System ("we," "our," or "us") is committed
            to protecting your privacy. This Privacy Policy explains how we
            collect, use, disclose, and otherwise handle your information when
            you use our website and services.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <div className="info-box">
            <h3>Personal Information</h3>
            <ul>
              <li>Name and contact information (email, phone)</li>
              <li>Account credentials (username, password)</li>
              <li>Profile information and preferences</li>
              <li>Disaster alert subscriptions and notification settings</li>
            </ul>
          </div>

          <div className="info-box">
            <h3>Technical Information</h3>
            <ul>
              <li>IP address and device information</li>
              <li>Browser type and operating system</li>
              <li>Pages visited and time spent</li>
              <li>Referral source</li>
            </ul>
          </div>

          <div className="info-box">
            <h3>Location Information</h3>
            <ul>
              <li>Geographic location (if permitted)</li>
              <li>
                Proximity to disaster zones (for alert customization)
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>✓ To deliver early warning alerts and notifications</li>
            <li>✓ To provide and improve our services</li>
            <li>✓ To send you system updates and important announcements</li>
            <li>✓ To analyze usage patterns and optimize performance</li>
            <li>✓ To comply with legal obligations</li>
            <li>✓ To prevent fraud and enhance security</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <div className="security-info">
            <Lock size={20} />
            <div>
              <h3>We protect your data through:</h3>
              <ul>
                <li>TLS 1.3 encryption for all data in transit</li>
                <li>AES-256 encryption for sensitive data at rest</li>
                <li>Regular security audits and penetration testing</li>
                <li>Industry-standard authentication (JWT)</li>
                <li>Role-based access control (RBAC)</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2>5. Data Retention</h2>
          <p>
            We retain personal information for as long as necessary to provide
            services and fulfill legal obligations. Alert history is retained
            for 2 years for analysis and trend detection.
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <ul>
            <li>
              <strong>Right to Access:</strong> You can request a copy of your
              data
            </li>
            <li>
              <strong>Right to Correction:</strong> Update inaccurate
              information
            </li>
            <li>
              <strong>Right to Deletion:</strong> Request removal of your data
            </li>
            <li>
              <strong>Right to Opt-Out:</strong> Unsubscribe from non-critical
              alerts
            </li>
            <li>
              <strong>Right to Data Portability:</strong> Export your data in
              standard formats
            </li>
          </ul>
        </section>

        <section>
          <h2>7. Third-Party Services</h2>
          <p>
            We may share your information with trusted partners for emergency
            response coordination, including NDRF, district authorities, and
            weather services. We do not sell your data.
          </p>
        </section>

        <section>
          <h2>8. Cookies</h2>
          <p>
            We use session cookies for authentication and analytics cookies to
            understand usage patterns. You can control cookie preferences in
            your browser settings.
          </p>
        </section>

        <section>
          <h2>9. Children's Privacy</h2>
          <p>
            Our service is not intended for children under 13. We do not
            knowingly collect personal information from children.
          </p>
        </section>

        <section>
          <h2>10. Contact Us</h2>
          <p>
            For privacy inquiries, please contact:
            <br />
            <strong>Email:</strong> privacy@disaster-management.org
            <br />
            <strong>Phone:</strong> +91-XXXX-XXXX-XX
          </p>
        </section>
      </div>

      <div className="legal-footer">
        <button className="btn-back" onClick={() => navigate("/home")}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default PrivacyPage;
