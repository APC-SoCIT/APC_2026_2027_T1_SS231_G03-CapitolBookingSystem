import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
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
  const [sent, setSent] = useState(false);

  const updateForm = (key: keyof InquiryForm, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
  };

  const submitInquiry = () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.type ||
      !form.message.trim()
    ) {
      return;
    }

    const inquiry: Inquiry = {
      ...form,
      id: `INQ-${String(getInquiries().length + 1).padStart(3, "0")}`,
      status: "New",
      submittedAt: "Just now",
    };

    saveInquiries([...getInquiries(), inquiry]);
    setForm(EMPTY_FORM);
    setSent(true);
  };

  return (
    <div>
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

        <div className="inquiry-form">
          <h2>Send an inquiry</h2>

          <label className="form-field">
            <span>Full Name</span>
            <input
              className="input"
              placeholder="Juan dela Cruz"
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
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Inquiry Type</span>
            <select
              className="input"
              value={form.type}
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
              value={form.message}
              onChange={(event) => updateForm("message", event.target.value)}
            />
          </label>

          <button
            className="button button--red"
            onClick={submitInquiry}
            type="button"
          >
            Send Inquiry →
          </button>

          {sent && (
            <div className="success-message">
              <strong>Thank you for your inquiry.</strong>
              <span>
                Your submission has been recorded and is now visible in the
                staff dashboard.
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
