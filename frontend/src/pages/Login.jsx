import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  Lock,
  Mail,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";

import {
  loginUser,
  registerUser,
} from "../services/api";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useToast,
} from "../context/ToastContext";

function Login() {
  const navigate =
    useNavigate();

  const {
    user,
    login,
  } = useAuth();

  const {
    addToast,
  } = useToast();

  const [
    isRegister,
    setIsRegister,
  ] = useState(false);

  const [
    name,
    setName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  // ==========================================================
  // ALREADY AUTHENTICATED
  // ==========================================================

  useEffect(() => {
    if (user) {
      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    }
  }, [
    user,
    navigate,
  ]);

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {
    const cleanEmail =
      email.trim();

    if (!cleanEmail) {
      return "Please enter your email address.";
    }

    if (!cleanEmail.includes("@")) {
      return "Please enter a valid email address.";
    }

    if (!password) {
      return "Please enter your password.";
    }

    if (password.length < 6) {
      return "Password must contain at least 6 characters.";
    }

    if (
      isRegister &&
      !name.trim()
    ) {
      return "Please enter your full name.";
    }

    return null;
  };

  // ==========================================================
  // LOGIN / REGISTER
  // ==========================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      return;
    }

    setLoading(true);

    try {
      let response;

      if (isRegister) {
        response =
          await registerUser({
            name: name.trim(),
            email: email.trim(),
            password,
          });
      } else {
        response =
          await loginUser({
            email: email.trim(),
            password,
          });
      }

      const userData =
        response?.data?.user;

      const authToken =
        response?.data?.token;

      if (
        !userData ||
        !authToken
      ) {
        throw new Error(
          "Authentication response is incomplete."
        );
      }

      login(
        userData,
        authToken
      );

      addToast({
        title: isRegister
          ? "Account Created"
          : "Authentication Successful",

        message: isRegister
          ? `Welcome, ${
              userData.name ||
              "Operator"
            }. Command access granted.`
          : `Welcome back, ${
              userData.name ||
              "Operator"
            }. Command portal access granted.`,

        type: "success",

        duration: 4500,
      });

      // ======================================================
      // IMPORTANT:
      // SEND AUTHENTICATED USER TO DASHBOARD
      // ======================================================

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error(
        "Authentication error:",
        err
      );

      const serverMessage =
        err?.response?.data?.message;

      const fallbackMessage =
        isRegister
          ? "Registration failed. Please check your information and try again."
          : "Login failed. Please verify your email and password.";

      setError(
        serverMessage ||
          err?.message ||
          fallbackMessage
      );

      addToast({
        title: "Authentication Failed",
        message:
          serverMessage ||
          fallbackMessage,
        type: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // DEMO LOGIN
  // ==========================================================

  const handleQuickLogin =
    async (
      demoEmail,
      demoPassword,
      roleTitle
    ) => {
      setError("");
      setLoading(true);

      try {
        const response =
          await loginUser({
            email: demoEmail,
            password: demoPassword,
          });

        const userData =
          response?.data?.user;

        const authToken =
          response?.data?.token;

        if (
          !userData ||
          !authToken
        ) {
          throw new Error(
            "Demo authentication response is incomplete."
          );
        }

        login(
          userData,
          authToken
        );

        addToast({
          title:
            "Command Access Granted",

          message: `Authenticated as ${roleTitle}. Welcome ${
            userData.name ||
            "Operator"
          }.`,
          
          type: "success",

          duration: 4500,
        });

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );
      } catch (err) {
        console.error(
          "Demo login error:",
          err
        );

        const message =
          err?.response?.data?.message ||
          "Demo login failed. Make sure the backend and demo account are available.";

        setError(message);

        addToast({
          title:
            "Demo Login Failed",
          message,
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // MODE SWITCH
  // ==========================================================

  const switchMode = (
    registerMode
  ) => {
    setIsRegister(
      registerMode
    );

    setError("");

    setPassword("");

    if (!registerMode) {
      setName("");
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main
      className="login-page-pro"
      aria-labelledby="login-title"
    >
      <div
        className="login-bg-glow"
        aria-hidden="true"
      />

      <div className="login-container-pro">
        {/* ====================================================
            BRAND
           ==================================================== */}

        <header className="login-brand-header">
          <div className="login-logo-badge">
            <ShieldAlert
              size={36}
              className="text-cyan pulse"
              aria-hidden="true"
            />
          </div>

          <h1 id="login-title">
            DISASTER EARLY WARNING
          </h1>

          <p>
            National Command &amp;
            Multi-Hazard Telemetry Portal
          </p>
        </header>

        {/* ====================================================
            LOGIN CARD
           ==================================================== */}

        <section
          className="login-card-glass"
          aria-label="Secure command authentication"
        >
          {/* TABS */}

          <div
            className="login-tabs-pro"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={
                !isRegister
              }
              className={`login-tab-pro ${
                !isRegister
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                switchMode(false)
              }
              disabled={loading}
            >
              Command Sign In
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={
                isRegister
              }
              className={`login-tab-pro ${
                isRegister
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                switchMode(true)
              }
              disabled={loading}
            >
              Create Account
            </button>
          </div>

          {/* ERROR */}

          {error && (
            <div
              className="login-error-banner"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          {/* ==================================================
              FORM
             ================================================== */}

          <form
            onSubmit={
              handleSubmit
            }
            className="login-form-fields"
            noValidate
          >
            {isRegister && (
              <div className="input-group-pro">
                <User
                  size={18}
                  className="field-icon"
                  aria-hidden="true"
                />

                <input
                  type="text"
                  placeholder="Officer / Responder Full Name"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  autoComplete="name"
                  disabled={loading}
                  required
                />
              </div>
            )}

            <div className="input-group-pro">
              <Mail
                size={18}
                className="field-icon"
                aria-hidden="true"
              />

              <input
                type="email"
                placeholder="Official Email Address"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>

            <div className="input-group-pro">
              <Lock
                size={18}
                className="field-icon"
                aria-hidden="true"
              />

              <input
                type="password"
                placeholder="Secure Password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete={
                  isRegister
                    ? "new-password"
                    : "current-password"
                }
                disabled={loading}
                minLength={6}
                required
              />
            </div>

            {!isRegister && (
              <div className="login-helpers-row">
                <Link to="/forgot-password" className="inline-action-link">
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="loading-spinner-small"
                    aria-hidden="true"
                  />

                  Authenticating...
                </>
              ) : isRegister ? (
                <>
                  Register Officer Account

                  <ArrowRight
                    size={16}
                  />
                </>
              ) : (
                <>
                  Access Command Portal

                  <ArrowRight
                    size={16}
                  />
                </>
              )}
            </button>
          </form>

          {/* ==================================================
              DEMO ACCESS
             ================================================== */}

          <div className="quick-demo-section-pro">
            <div className="demo-divider">
              <span>
                <Zap
                  size={14}
                  aria-hidden="true"
                />

                1-CLICK DEMO ACCESS
              </span>
            </div>

            <div className="demo-btn-grid">
              <button
                type="button"
                className="demo-card-btn admin"
                onClick={() =>
                  handleQuickLogin(
                    "admin@disaster.org",
                    "admin123",
                    "Administrator"
                  )
                }
                disabled={loading}
              >
                <ShieldCheck
                  size={18}
                  className="text-cyan"
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    Command Administrator
                  </strong>

                  <small>
                    Full System Access
                  </small>
                </div>
              </button>

              <button
                type="button"
                className="demo-card-btn operator"
                onClick={() =>
                  handleQuickLogin(
                    "user@disaster.org",
                    "user123",
                    "Emergency Operator"
                  )
                }
                disabled={loading}
              >
                <Radio
                  size={18}
                  className="text-emerald"
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    Emergency Operator
                  </strong>

                  <small>
                    Telemetry Surveillance
                  </small>
                </div>
              </button>
            </div>

            <div className="demo-credentials-footer">
              <span>
                Demo Access:
                {" "}
                <code>
                  admin@disaster.org
                </code>
                {" / "}
                <code>
                  admin123
                </code>
              </span>
            </div>
          </div>
        </section>

        {/* ====================================================
            SECURITY
           ==================================================== */}

        <footer className="login-security-notice">
          <ShieldCheck
            size={14}
            className="text-emerald"
            aria-hidden="true"
          />

          <span>
            Secure authentication and
            encrypted session handling
          </span>

          <Sparkles
            size={13}
            aria-hidden="true"
          />
        </footer>
      </div>
    </main>
  );
}

export default Login;