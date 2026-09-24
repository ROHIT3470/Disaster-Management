import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock, ShieldAlert } from "lucide-react";

import { resetUserPassword } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const initialToken = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const cleanToken = token.trim();
    const cleanPassword = password.trim();

    if (!cleanToken) {
      setMessage("A valid reset token is required.");
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    if (cleanPassword !== confirmPassword) {
      setMessage("Passwords do not match. Please confirm the new password.");
      return;
    }

    setLoading(true);

    try {
      const response = await resetUserPassword({ token: cleanToken, password: cleanPassword });
      const successMessage = response?.data?.message || "Your password has been updated successfully.";

      setMessage(successMessage);
      addToast({
        title: "Password Updated",
        message: successMessage,
        type: "success",
      });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (error) {
      const serverMessage = error?.response?.data?.message || "Unable to reset your password.";
      setMessage(serverMessage);
      addToast({
        title: "Password Reset Failed",
        message: serverMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page-pro" aria-labelledby="reset-title">
      <div className="login-bg-glow" aria-hidden="true" />

      <div className="login-container-pro">
        <header className="login-brand-header">
          <div className="login-logo-badge">
            <ShieldAlert size={36} className="text-cyan pulse" aria-hidden="true" />
          </div>

          <h1 id="reset-title">SET NEW PASSWORD</h1>

          <p>Create a strong password for your command account</p>
        </header>

        <section className="login-card-glass" aria-label="Password reset form">
          {message && (
            <div className="login-error-banner" role="alert" aria-live="polite">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form-fields" noValidate>
            <div className="input-group-pro">
              <Lock size={18} className="field-icon" aria-hidden="true" />

              <input
                type="text"
                placeholder="Reset token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                autoComplete="off"
                disabled={loading}
                required
              />
            </div>

            <div className="input-group-pro">
              <Lock size={18} className="field-icon" aria-hidden="true" />

              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                disabled={loading}
                minLength={6}
                required
              />
            </div>

            <div className="input-group-pro">
              <Lock size={18} className="field-icon" aria-hidden="true" />

              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                disabled={loading}
                minLength={6}
                required
              />
            </div>

            <button type="submit" className="btn-auth-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner-small" aria-hidden="true" />
                  Updating password...
                </>
              ) : (
                <>
                  Reset password
                  <CheckCircle2 size={16} />
                </>
              )}
            </button>
          </form>

          <div className="login-helpers-row">
            <Link to="/login" className="inline-action-link">
              <ArrowLeft size={14} style={{ marginRight: 6 }} />
              Return to sign in
            </Link>
          </div>
        </section>

        <footer className="login-security-notice">
          <ShieldAlert size={14} className="text-emerald" aria-hidden="true" />
          <span>Protected by secure token validation and encrypted sessions</span>
        </footer>
      </div>
    </main>
  );
}

export default ResetPassword;
