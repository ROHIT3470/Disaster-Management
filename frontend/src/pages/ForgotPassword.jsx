import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, Mail, ShieldAlert } from "lucide-react";

import { requestPasswordReset } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";

function ForgotPassword() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setResetUrl("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await requestPasswordReset({ email: cleanEmail });
      const nextMessage = response?.data?.message || "If an account exists, password reset instructions have been sent.";

      setMessage(nextMessage);

      if (response?.data?.resetUrl) {
        setResetUrl(response.data.resetUrl);
      }

      addToast({
        title: "Reset Link Requested",
        message: nextMessage,
        type: "success",
      });
    } catch (error) {
      const serverMessage = error?.response?.data?.message || "Unable to process password reset request.";
      setMessage(serverMessage);
      addToast({
        title: "Reset Request Failed",
        message: serverMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page-pro" aria-labelledby="forgot-title">
      <div className="login-bg-glow" aria-hidden="true" />

      <div className="login-container-pro">
        <header className="login-brand-header">
          <div className="login-logo-badge">
            <ShieldAlert size={36} className="text-cyan pulse" aria-hidden="true" />
          </div>

          <h1 id="forgot-title">RESET PASSWORD</h1>

          <p>Recover secure access to your command account</p>
        </header>

        <section className="login-card-glass" aria-label="Password reset request form">
          {message && (
            <div
              className={`login-error-banner ${resetUrl ? "login-success-banner" : ""}`}
              role="alert"
              aria-live="polite"
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form-fields" noValidate>
            <div className="input-group-pro">
              <Mail size={18} className="field-icon" aria-hidden="true" />

              <input
                type="email"
                placeholder="Official Email Address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="btn-auth-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner-small" aria-hidden="true" />
                  Sending reset link...
                </>
              ) : (
                <>
                  Send reset link
                  <Lock size={16} />
                </>
              )}
            </button>
          </form>

          {resetUrl && (
            <div className="login-helpers-row" style={{ marginTop: "1rem" }}>
              <a href={resetUrl} className="inline-action-link">
                Open reset page
              </a>
            </div>
          )}

          <div className="login-helpers-row">
            <Link to="/login" className="inline-action-link">
              <ArrowLeft size={14} style={{ marginRight: 6 }} />
              Back to sign in
            </Link>
          </div>
        </section>

        <footer className="login-security-notice">
          <ShieldAlert size={14} className="text-amber" aria-hidden="true" />
          <span>Secure single-use reset tokens protect your account</span>
        </footer>
      </div>
    </main>
  );
}

export default ForgotPassword;
