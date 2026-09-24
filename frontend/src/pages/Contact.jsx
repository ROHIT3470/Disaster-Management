import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Globe,
  Headphones,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { submitContactMessage } from "../services/api";

const INITIAL_FORM = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const CONTACT_METHODS = [
  {
    title: "Emergency Support",
    value: "112",
    description: "For immediate emergency assistance",
    meta: "National emergency response",
    icon: Phone,
    className: "danger",
  },
  {
    title: "Support Email",
    value: "support@disaster-management.org",
    description: "Technical and platform assistance",
    meta: "Response within 2 hours",
    icon: Mail,
    className: "cyan",
  },
  {
    title: "Command Office",
    value: "National Disaster Management Authority",
    description: "Central disaster-management coordination",
    meta: "New Delhi, India",
    icon: MapPin,
    className: "gold",
  },
  {
    title: "Main Portal",
    value: "disaster-management.org",
    description: "Access public information and resources",
    meta: "Online information portal",
    icon: Globe,
    className: "purple",
  },
];

function ContactPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const MAX_MESSAGE_LENGTH = 1000;

  const isFormValid = useMemo(() => {
    return (
      formData.name.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) &&
      formData.subject.trim().length >= 3 &&
      formData.message.trim().length >= 10
    );
  }, [formData]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;

    if (name === "message" && value.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "message") {
      setCharCount(value.length);
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM);
    setCharCount(0);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isFormValid) {
      toastError?.(
        "Please complete all fields correctly before sending your message.",
        {
          title: "Invalid Contact Form",
        }
      );
      return;
    }

    setSubmitting(true);

    try {
      await submitContactMessage(formData);

      setSubmitted(true);

      success?.(
        "Your message has been received by the support team.",
        {
          title: "Message Sent Successfully",
        }
      );
    } catch (err) {
      console.error("Contact form submission failed:", err);

      toastError?.(
        "We could not send your message. Please try again.",
        {
          title: "Message Delivery Failed",
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendAnother = () => {
    resetForm();
    setSubmitted(false);
  };

  useEffect(() => {
    if (!submitted) return undefined;

    const timer = setTimeout(() => {
      resetForm();
      setSubmitted(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [submitted, resetForm]);

  return (
    <div className="contact-page animate-fade-in">
      <section className="contact-hero">
        <div className="contact-hero-badge">
          <MessageSquare size={14} />
          COMMAND CENTER SUPPORT
        </div>

        <h1>Get in Touch</h1>

        <p>
          Have a question about the Disaster Management System, telemetry
          network or platform operations? Our support team is ready to help.
        </p>

        <div className="contact-hero-status">
          <span className="live-dot" />
          Support network operational
        </div>
      </section>

      <section className="contact-overview">
        <div className="contact-overview-card">
          <ShieldCheck size={21} />

          <div>
            <strong>Secure Communication</strong>
            <span>Your message is handled through the platform support channel.</span>
          </div>
        </div>

        <div className="contact-overview-card">
          <Headphones size={21} />

          <div>
            <strong>Technical Assistance</strong>
            <span>Platform and operational support is available for registered users.</span>
          </div>
        </div>

        <div className="contact-overview-card">
          <Clock3 size={21} />

          <div>
            <strong>Fast Response</strong>
            <span>Support enquiries are reviewed as quickly as possible.</span>
          </div>
        </div>
      </section>

      <div className="contact-grid">
        <section className="contact-info-section">
          <div className="section-heading">
            <span className="section-kicker">SUPPORT CHANNELS</span>
            <h2>Contact Information</h2>
            <p>
              Choose the appropriate channel depending on the nature of your
              enquiry.
            </p>
          </div>

          <div className="contact-methods">
            {CONTACT_METHODS.map((method) => {
              const Icon = method.icon;

              return (
                <div
                  className={`contact-method ${method.className}`}
                  key={method.title}
                >
                  <div className="contact-icon">
                    <Icon size={22} />
                  </div>

                  <div className="contact-method-content">
                    <div className="contact-method-header">
                      <h3>{method.title}</h3>
                      <CheckCircle2 size={15} />
                    </div>

                    <p>{method.value}</p>

                    <span>{method.description}</span>

                    <small>{method.meta}</small>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="contact-emergency-note">
            <div className="emergency-note-icon">
              <Phone size={18} />
            </div>

            <div>
              <strong>For immediate emergencies</strong>
              <p>
                Do not use this contact form for urgent life-safety situations.
                Contact the appropriate emergency services immediately.
              </p>
            </div>
          </div>
        </section>

        <section className="contact-form-section">
          {!submitted ? (
            <>
              <div className="section-heading">
                <span className="section-kicker">SEND AN ENQUIRY</span>
                <h2>How Can We Help?</h2>
                <p>
                  Provide the details below and our support team will review
                  your request.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="contact-form"
                noValidate
              >
                <div className="form-row-two">
                  <div className="form-group">
                    <label htmlFor="name">
                      Full Name <span>*</span>
                    </label>

                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      maxLength={80}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      Email Address <span>*</span>
                    </label>

                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      autoComplete="email"
                      maxLength={120}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">
                    Subject <span>*</span>
                  </label>

                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Briefly describe your enquiry"
                    maxLength={150}
                    required
                  />
                </div>

                <div className="form-group">
                  <div className="label-with-counter">
                    <label htmlFor="message">
                      Message <span>*</span>
                    </label>

                    <span>
                      {charCount}/{MAX_MESSAGE_LENGTH}
                    </span>
                  </div>

                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can assist you..."
                    rows={7}
                    maxLength={MAX_MESSAGE_LENGTH}
                    required
                  />
                </div>

                <div className="contact-form-security">
                  <ShieldCheck size={15} />

                  <span>
                    Please do not include passwords, authentication codes,
                    payment details or other sensitive credentials.
                  </span>
                </div>

                <div className="contact-form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    Clear Form
                  </button>

                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={submitting || !isFormValid}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send size={17} />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="contact-success-state">
              <div className="success-icon">
                <CheckCircle2 size={48} />
              </div>

              <span className="success-kicker">
                <Sparkles size={14} />
                DELIVERY CONFIRMED
              </span>

              <h2>Message Sent Successfully!</h2>

              <p>
                Thank you, {formData.name || "there"}. Your enquiry has been
                received and will be reviewed by the support team.
              </p>

              <div className="success-details">
                <div>
                  <Mail size={16} />
                  <span>{formData.email}</span>
                </div>

                <div>
                  <MessageSquare size={16} />
                  <span>{formData.subject}</span>
                </div>
              </div>

              <div className="success-actions">
                <button
                  type="button"
                  className="btn-submit"
                  onClick={handleSendAnother}
                >
                  <Send size={16} />
                  Send Another Message
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate("/home")}
                >
                  Return to Home
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="contact-footer">
        <button
          type="button"
          className="btn-back"
          onClick={() => navigate("/home")}
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>

        <div className="contact-footer-status">
          <CheckCircle2 size={14} />
          Disaster Management Support Network
        </div>
      </footer>
    </div>
  );
}

export default ContactPage;