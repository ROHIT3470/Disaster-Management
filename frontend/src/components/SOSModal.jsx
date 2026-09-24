import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertOctagon,
  Check,
  ChevronDown,
  Clock3,
  Info,
  MapPin,
  Radio,
  Send,
  Siren,
  ShieldAlert,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";

import {
  playEmergencySiren,
  stopEmergencySiren,
} from "../utils/audioAlert";

import { useToast } from "../context/ToastContext";

// ============================================================
// CONFIGURATION
// ============================================================

const MAX_MESSAGE_LENGTH = 320;
const SIREN_PREVIEW_DURATION = 8000;
const BROADCAST_PROCESSING_TIME = 1800;
const SUCCESS_DISPLAY_TIME = 1800;

const TARGETS = [
  {
    value: "all",
    label: "All Sectors",
    location:
      "Dehradun, Chamoli, Joshimath & Shimla",
    audience: "Citizens + field response teams",
    icon: "🚨",
  },
  {
    value: "joshimath",
    label: "Joshimath & Alaknanda Basin",
    location: "Critical-risk sectors",
    audience: "Citizens + local response teams",
    icon: "⚠️",
  },
  {
    value: "dehradun",
    label: "Dehradun Valley & Rishikesh",
    location: "Urban & river-basin sectors",
    audience: "Citizens + field response teams",
    icon: "🌧️",
  },
  {
    value: "shimla",
    label: "Shimla & Mandi Ridge",
    location: "High-slope sectors",
    audience: "Citizens + local response teams",
    icon: "🏔️",
  },
  {
    value: "sdrf",
    label: "First Responders",
    location: "NDRF / SDRF units only",
    audience: "Emergency response personnel",
    icon: "🛡️",
  },
];

const DEFAULT_ADVISORY =
  "URGENT DISASTER WARNING: Flash flood and landslide threat detected in hill sectors. Move immediately to high ground or designated shelter.";

// ============================================================
// COMPONENT
// ============================================================

function SOSModal({
  isOpen,
  onClose,
}) {
  const { addToast } = useToast();

  const [broadcasting, setBroadcasting] = useState(false);
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [customAdvisory, setCustomAdvisory] =
    useState(DEFAULT_ADVISORY);
  const [dispatched, setDispatched] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const sirenTimeoutRef = useRef(null);
  const dispatchTimeoutRef = useRef(null);
  const successTimeoutRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const closeButtonRef = useRef(null);

  // ==========================================================
  // RESET STATE WHEN MODAL CLOSES
  // ==========================================================

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      return;
    }

    setBroadcasting(false);
    setDispatched(false);
    setConfirmed(false);
    setSirenPlaying(false);
    setElapsedSeconds(0);
  }, [isOpen]);

  // ==========================================================
  // GLOBAL ESCAPE HANDLER
  // ==========================================================

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key !== "Escape" && event.keyCode !== 27) {
        return;
      }

      if (broadcasting) {
        return;
      }

      stopEmergencySiren();
      setSirenPlaying(false);
      onClose?.();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen, broadcasting, onClose]);

  // ==========================================================
  // BODY SCROLL LOCK
  // ==========================================================

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [isOpen]);

  // ==========================================================
  // COMPLETE CLEANUP ON UNMOUNT
  // ==========================================================

  useEffect(() => {
    return () => {
      stopEmergencySiren();

      if (sirenTimeoutRef.current) {
        clearTimeout(sirenTimeoutRef.current);
      }

      if (dispatchTimeoutRef.current) {
        clearTimeout(dispatchTimeoutRef.current);
      }

      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }

      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, []);

  // ==========================================================
  // TARGET INFORMATION
  // ==========================================================

  const selectedTarget = useMemo(
    () =>
      TARGETS.find(
        (target) =>
          target.value === broadcastTarget
      ) || TARGETS[0],
    [broadcastTarget]
  );

  // ==========================================================
  // MESSAGE STATISTICS
  // ==========================================================

  const messageLength = customAdvisory.length;

  const remainingCharacters =
    MAX_MESSAGE_LENGTH - messageLength;

  const messageTooLong =
    messageLength > MAX_MESSAGE_LENGTH;

  const messageEmpty =
    customAdvisory.trim().length === 0;

  // ==========================================================
  // SIREN PREVIEW
  // ==========================================================

  const stopSirenPreview = () => {
    stopEmergencySiren();

    setSirenPlaying(false);

    if (sirenTimeoutRef.current) {
      clearTimeout(sirenTimeoutRef.current);
      sirenTimeoutRef.current = null;
    }
  };

  const toggleSiren = () => {
    if (broadcasting) {
      return;
    }

    if (sirenPlaying) {
      stopSirenPreview();
      return;
    }

    try {
      playEmergencySiren(
        SIREN_PREVIEW_DURATION / 1000
      );

      setSirenPlaying(true);

      if (sirenTimeoutRef.current) {
        clearTimeout(sirenTimeoutRef.current);
      }

      sirenTimeoutRef.current =
        setTimeout(() => {
          setSirenPlaying(false);
          sirenTimeoutRef.current = null;
        }, SIREN_PREVIEW_DURATION);
    } catch (error) {
      console.error(
        "Siren preview failed:",
        error
      );

      setSirenPlaying(false);

      addToast?.({
        title: "Audio Preview Unavailable",
        message:
          "The emergency tone could not be played.",
        type: "error",
      });
    }
  };

  // ==========================================================
  // CLOSE HANDLER
  // ==========================================================

  const handleClose = () => {
    if (broadcasting) {
      return;
    }

    stopSirenPreview();
    onClose?.();
  };

  // ==========================================================
  // BACKDROP CLICK
  // ==========================================================

  const handleBackdropClick = (event) => {
    if (
      event.target === event.currentTarget &&
      !broadcasting
    ) {
      handleClose();
    }
  };

  // ==========================================================
  // DISPATCH TIMER
  // ==========================================================

  const startElapsedTimer = () => {
    setElapsedSeconds(0);

    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
    }

    const startedAt = Date.now();

    elapsedTimerRef.current =
      setInterval(() => {
        const seconds = Math.floor(
          (Date.now() - startedAt) / 1000
        );

        setElapsedSeconds(seconds);
      }, 250);
  };

  const stopElapsedTimer = () => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  };

  // ==========================================================
  // BROADCAST
  // ==========================================================

  const handleBroadcast = async (event) => {
    event.preventDefault();

    if (broadcasting || dispatched) {
      return;
    }

    if (messageEmpty) {
      addToast?.({
        title: "Message Required",
        message:
          "Enter an emergency advisory before transmitting.",
        type: "error",
      });
      return;
    }

    if (messageTooLong) {
      addToast?.({
        title: "Message Too Long",
        message: `Reduce the advisory by ${Math.abs(
          remainingCharacters
        )} characters.`,
        type: "error",
      });
      return;
    }

    if (!confirmed) {
      addToast?.({
        title: "Confirmation Required",
        message:
          "Confirm that the emergency transmission is authorized.",
        type: "error",
      });
      return;
    }

    try {
      setBroadcasting(true);
      startElapsedTimer();

      // Ensure preview audio is not left running.
      stopSirenPreview();

      // Activate emergency transmission tone.
      playEmergencySiren(5);

      dispatchTimeoutRef.current =
        setTimeout(() => {
          setBroadcasting(false);
          setDispatched(true);

          stopElapsedTimer();

          addToast?.({
            title: "🚨 SOS Broadcast Dispatched",
            message:
              "Emergency broadcast successfully transmitted to the selected response network.",
            type: "critical",
            duration: 6000,
          });

          successTimeoutRef.current =
            setTimeout(() => {
              setDispatched(false);
              setConfirmed(false);
              onClose?.();
            }, SUCCESS_DISPLAY_TIME);
        }, BROADCAST_PROCESSING_TIME);
    } catch (error) {
      console.error(
        "SOS broadcast failed:",
        error
      );

      setBroadcasting(false);
      setDispatched(false);

      stopElapsedTimer();
      stopEmergencySiren();

      addToast?.({
        title: "Broadcast Failed",
        message:
          "The emergency broadcast could not be completed. Please retry.",
        type: "error",
      });
    }
  };

  // ==========================================================
  // DISABLED STATE
  // ==========================================================

  const submitDisabled =
    broadcasting ||
    dispatched ||
    !confirmed ||
    messageEmpty ||
    messageTooLong;

  // ==========================================================
  // RENDER
  // ==========================================================

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-backdrop emergency-backdrop"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <div
        className="modal-card emergency-modal-pro"
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-modal-title"
        aria-describedby="emergency-modal-description"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* ====================================================
            TOP EMERGENCY STRIP
            ==================================================== */}

        <div className="emergency-top-strip">
          <div className="emergency-top-status">
            <span className="emergency-status-dot" />
            <span>EMERGENCY COMMAND CHANNEL</span>
          </div>

          <span className="emergency-priority">
            PRIORITY 01
          </span>
        </div>

        {/* ====================================================
            HEADER
            ==================================================== */}

        <div className="modal-header emergency-header">
          <div className="modal-title-wrap">
            <div className="emergency-icon-shell">
              <div className="modal-icon-badge danger">
                <Siren
                  size={22}
                  className="pulse-icon"
                />
              </div>

              <span className="emergency-icon-ring" />
            </div>

            <div className="emergency-title-content">
              <div className="emergency-overline">
                <span>
                  DISASTER RESPONSE SYSTEM
                </span>

                <span className="emergency-live-label">
                  <span />
                  LIVE
                </span>
              </div>

              <h3 id="emergency-modal-title">
                Emergency SOS Broadcast
              </h3>

              <p id="emergency-modal-description">
                Dispatch a high-priority emergency
                advisory to authorized field units
                and affected communities.
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="modal-close emergency-close"
            onClick={handleClose}
            disabled={broadcasting}
            aria-label="Close emergency broadcast"
            title={
              broadcasting
                ? "Broadcast in progress"
                : "Close"
            }
          >
            <X size={18} />
          </button>
        </div>

        {/* ====================================================
            DISPATCHED SUCCESS STATE
            ==================================================== */}

        {dispatched ? (
          <div className="emergency-success-state">
            <div className="success-orbit">
              <div className="success-check-icon">
                <Check size={40} />
              </div>
            </div>

            <div className="success-status-label">
              <span className="success-status-dot" />
              TRANSMISSION CONFIRMED
            </div>

            <h4>
              Emergency Broadcast Activated
            </h4>

            <p>
              Emergency advisory successfully entered
              the response distribution network.
            </p>

            <div className="dispatch-summary">
              <div className="dispatch-summary-item">
                <Radio size={15} />

                <div>
                  <span>CHANNEL</span>
                  <strong>
                    Emergency Broadcast Network
                  </strong>
                </div>
              </div>

              <div className="dispatch-summary-item">
                <Users size={15} />

                <div>
                  <span>TARGET</span>
                  <strong>
                    {selectedTarget.label}
                  </strong>
                </div>
              </div>

              <div className="dispatch-summary-item">
                <Clock3 size={15} />

                <div>
                  <span>PROCESSING</span>
                  <strong>
                    {elapsedSeconds}s
                  </strong>
                </div>
              </div>
            </div>

            <div className="success-note">
              <ShieldAlert size={14} />

              <span>
                Field response channels remain active
                while the emergency advisory propagates.
              </span>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleBroadcast}
            className="modal-form emergency-form"
          >
            {/* ==================================================
                TARGET SECTION
                ================================================== */}

            <section className="emergency-form-section">
              <div className="emergency-section-title">
                <div className="section-title-icon">
                  <MapPin size={15} />
                </div>

                <div>
                  <span>01 · DISTRIBUTION TARGET</span>
                  <strong>
                    Target Audience / Zone
                  </strong>
                </div>
              </div>

              <div className="emergency-select-wrap">
                <select
                  value={broadcastTarget}
                  onChange={(event) =>
                    setBroadcastTarget(
                      event.target.value
                    )
                  }
                  className="custom-select emergency-select"
                  disabled={broadcasting}
                  aria-label="Emergency broadcast target"
                >
                  {TARGETS.map((target) => (
                    <option
                      key={target.value}
                      value={target.value}
                    >
                      {target.icon} {target.label} —{" "}
                      {target.location}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="emergency-select-chevron"
                  aria-hidden="true"
                />
              </div>

              <div className="target-preview">
                <div className="target-preview-icon">
                  <MapPin size={15} />
                </div>

                <div>
                  <strong>
                    {selectedTarget.label}
                  </strong>

                  <span>
                    {selectedTarget.location}
                  </span>
                </div>

                <div className="target-audience">
                  <Users size={12} />
                  {selectedTarget.audience}
                </div>
              </div>
            </section>

            {/* ==================================================
                MESSAGE SECTION
                ================================================== */}

            <section className="emergency-form-section">
              <div className="emergency-section-title">
                <div className="section-title-icon">
                  <Send size={15} />
                </div>

                <div>
                  <span>02 · EMERGENCY ADVISORY</span>
                  <strong>
                    Message / Broadcast Content
                  </strong>
                </div>
              </div>

              <div
                className={`emergency-textarea-wrap ${
                  messageTooLong
                    ? "has-error"
                    : ""
                }`}
              >
                <textarea
                  value={customAdvisory}
                  onChange={(event) =>
                    setCustomAdvisory(
                      event.target.value
                    )
                  }
                  rows={5}
                  maxLength={MAX_MESSAGE_LENGTH + 50}
                  className="custom-textarea emergency-textarea"
                  placeholder="Enter the emergency advisory..."
                  disabled={broadcasting}
                  aria-describedby="message-help"
                  required
                />

                <div className="textarea-footer">
                  <span id="message-help">
                    This advisory is intended for emergency
                    SMS and voice distribution.
                  </span>

                  <span
                    className={`character-counter ${
                      messageTooLong
                        ? "error"
                        : remainingCharacters <=
                            40
                          ? "warning"
                          : ""
                    }`}
                  >
                    {messageLength}/
                    {MAX_MESSAGE_LENGTH}
                  </span>
                </div>
              </div>
            </section>

            {/* ==================================================
                AUDIO PREVIEW
                ================================================== */}

            <section className="emergency-audio-panel">
              <div className="audio-panel-left">
                <div
                  className={`audio-icon ${
                    sirenPlaying
                      ? "active"
                      : ""
                  }`}
                >
                  {sirenPlaying ? (
                    <Volume2 size={17} />
                  ) : (
                    <VolumeX size={17} />
                  )}
                </div>

                <div>
                  <strong>
                    Auditory Alert Preview
                  </strong>

                  <span>
                    Test the synthetic emergency warning
                    tone before dispatch.
                  </span>
                </div>
              </div>

              <button
                type="button"
                className={`btn-siren-toggle ${
                  sirenPlaying ? "active" : ""
                }`}
                onClick={toggleSiren}
                disabled={broadcasting}
              >
                {sirenPlaying ? (
                  <>
                    <VolumeX size={15} />
                    Stop Tone
                  </>
                ) : (
                  <>
                    <Volume2 size={15} />
                    Test Siren
                  </>
                )}
              </button>
            </section>

            {/* ==================================================
                AUTHORIZATION CONFIRMATION
                ================================================== */}

            <label
              className={`emergency-confirmation ${
                confirmed ? "confirmed" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) =>
                  setConfirmed(
                    event.target.checked
                  )
                }
                disabled={broadcasting}
              />

              <span className="custom-check">
                {confirmed && <Check size={12} />}
              </span>

              <div>
                <strong>
                  Authorize emergency transmission
                </strong>

                <span>
                  I confirm that this SOS broadcast is
                  authorized and should be transmitted to
                  the selected target.
                </span>
              </div>
            </label>

            {/* ==================================================
                WARNING
                ================================================== */}

            <div className="emergency-warning-banner">
              <AlertOctagon size={15} />

              <div>
                <strong>
                  High-priority operation
                </strong>

                <span>
                  Verify the target zone and advisory
                  before transmission. This action is
                  intended for genuine emergency response
                  situations.
                </span>
              </div>
            </div>

            {/* ==================================================
                FOOTER
                ================================================== */}

            <div className="modal-footer emergency-modal-footer">
              <div className="emergency-footer-status">
                <div className="footer-system-dot" />

                <span>
                  Response network operational
                </span>
              </div>

              <div className="emergency-footer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleClose}
                  disabled={broadcasting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-danger-glow emergency-submit"
                  disabled={submitDisabled}
                  aria-busy={broadcasting}
                >
                  {broadcasting ? (
                    <>
                      <AlertOctagon
                        size={17}
                        className="spin"
                      />

                      <span>
                        Dispatching…
                      </span>
                    </>
                  ) : (
                    <>
                      <Send size={17} />

                      <span>
                        Transmit Emergency SOS
                      </span>

                      <Zap size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ====================================================
            MODAL BOTTOM STATUS
            ==================================================== */}

        {!dispatched && (
          <div className="emergency-bottom-status">
            <Info size={12} />

            <span>
              Emergency communications are monitored
              continuously.
            </span>

            <span className="bottom-status-code">
              SOS-01
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SOSModal;