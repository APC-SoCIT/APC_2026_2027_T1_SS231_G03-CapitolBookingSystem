import { Mail, MapPin, Phone } from "lucide-react";
import { useState, type FormEvent } from "react";
import { saveInquiries, getInquiries, type Inquiry } from "../data/inquiries";

const inquiryTypes = [
  "General Question",
  "Catering",
  "Function Room",
  "Delivery",
  "Feedback",
];

type InquiryForm = Omit<Inquiry, "id" | "status" | "submittedAt">;

const EMPTY_FORM: InquiryForm = {
  name: "",
  email: "",
  type: "",
  message: "",
};

export function Inquiries() {
  const [form, setForm] = useState<InquiryForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    title: string;
    detail: string;
    error?: boolean;
  } | null>(null);

  const updateForm = (key: keyof InquiryForm, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
  };

  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const webhookUrl = (import.meta.env.VITE_WEBHOOK_URL || window.location.origin)
      .replace(/\/+$/, "");

    setSubmitting(true);
    try {
      const response = await fetch(`${webhookUrl}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as {
        inquiryId?: string;
        status?: string;
        reply?: string;
        notificationSent?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "We could not send your inquiry. Please try again.");
      }

      const manualResponse = result.status === "manual-response-required";
      const inquiry: Inquiry = {
        ...form,
        id: result.inquiryId || `INQ-${String(getInquiries().length + 1).padStart(3, "0")}`,
        status: manualResponse ? "New" : "Resolved",
        submittedAt: "Just now",
      };
      saveInquiries([...getInquiries(), inquiry]);
      setForm(EMPTY_FORM);
      setFeedback({
        title: manualResponse
          ? "Your request was sent to our staff."
          : "Thank you for your inquiry.",
        detail: manualResponse
          ? result.notificationSent
            ? "A staff member will review your order request and contact you directly."
            : "Your request was recorded, but the staff alert could not be delivered. Please call us to follow up."
          : result.reply || "Your message has been recorded and our team is here to help.",
      });
    } catch (error) {
      setFeedback({
        title: "We couldn't send your inquiry.",
        detail: error instanceof Error ? error.message : "Please try again or contact us by phone.",
        error: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="inquiries-page">
      <section className="page-hero">
        <p className="eyebrow">Capitol Restaurant</p>
        <h1>Inquiries</h1>
        <p>
          Have a question about our services? Send us a message and our team
          will be happy to help.
        </p>
      </section>

      <section className="section inquiries-grid">
        <div className="inquiry-info">
          <p className="eyebrow">Get in touch</p>
          <h2>Let&apos;s plan something memorable</h2>
          <p>
            Whether you are planning a family gathering, corporate event, or
            simply want to learn more about Capitol, we would love to hear from
            you.
          </p>

          <div className="contact-list">
            <a href="mailto:reservations@capitolrestaurant.com">
              <Mail size={18} />
              <span>
                <small>Email us</small>
                reservations@capitolrestaurant.com
              </span>
            </a>
            <a href="tel:8556-1313">
              <Phone size={18} />
              <span>
                <small>Call us</small>
                8556-1313
              </span>
            </a>
            <div>
              <MapPin size={18} />
              <span>
                <small>Visit us</small>
                Pasay City, Metro Manila, Philippines
              </span>
            </div>
          </div>
        </div>

        <form className="inquiry-form" onSubmit={submitInquiry}>
          <h2>Send an inquiry</h2>

          <label className="form-field">
            <span>Full Name</span>
            <input
              className="input"
              placeholder="Juan dela Cruz"
              required
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Email Address</span>
            <input
              className="input"
              placeholder="juan@example.com"
              type="email"
              required
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Inquiry Type</span>
            <select
              className="input"
              value={form.type}
              required
              onChange={(event) => updateForm("type", event.target.value)}
            >
              <option value="">Select inquiry type...</option>
              {inquiryTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Message</span>
            <textarea
              className="input"
              placeholder="How can we help?"
              rows={5}
              required
              value={form.message}
              onChange={(event) => updateForm("message", event.target.value)}
            />
          </label>

          <button
            className="button button--red"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Sending…" : "Send Inquiry →"}
          </button>

          {feedback && (
            <div className={`success-message${feedback.error ? " success-message--error" : ""}`} role="status" aria-live="polite">
              <strong>{feedback.title}</strong>
              <span>{feedback.detail}</span>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
