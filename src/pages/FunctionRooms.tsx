import { Check } from "lucide-react";
import { useState } from "react";
import { CalendarModal, type BookingDetails } from "../components/common";
import { addFunctionBooking, nextFunctionId } from "../data/reservations";

const EVENT_TYPES = [
  "Birthday Celebration",
  "Debut / 18th Birthday",
  "Wedding Reception",
  "Corporate Event",
  "Family Reunion",
  "Christmas Party",
  "Seminar / Conference",
  "Other",
];
const rooms = [
  {
    title: "Private Dining Room",
    detail:
      "An intimate space for up to 30 guests. Perfect for board meetings, small family celebrations, birthdays, baptisms, or private dinners."
  }
];
const amenities = [
  "Tables & Chairs",
  "Air Conditioning",
  "Sound System",
  "Projector & Screen",
  "Event Coordination",
  "Parking Space",
];

type FormData = {
  name: string;
  contact: string;
  email: string;
  guests: string;
  eventType: string;
  specialRequests: string;
};
const initialForm: FormData = {
  name: "",
  contact: "",
  email: "",
  guests: "",
  eventType: "",
  specialRequests: "",
};

export function FunctionRooms() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [submitted, setSubmitted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const update = (key: keyof FormData, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.contact.trim()) next.contact = "Contact number is required";
    if (!form.email.trim()) next.email = "Email is required";
    if (!form.guests || Number(form.guests) < 1)
      next.guests = "Please enter expected guest count";
    if (!form.eventType) next.eventType = "Please select an event type";
    setErrors(next);
    if (!Object.keys(next).length) setModalOpen(true);
  };
  return (
    <div>
      <section className="page-hero">
        <p className="eyebrow">Capitol Restaurant</p>
        <h1>Function Rooms</h1>
        <p>
          Host your most cherished events in Capitol&apos;s elegant function
          rooms. Fill out the form below to inquire about availability.
        </p>
      </section>
      <section className="section function-rooms-grid">
        <div>
          <h2 className="content-heading">About Our Rooms</h2>
          {rooms.map((room) => (
            <article className="room-card" key={room.title}>
              <h3>{room.title}</h3>
              <p>{room.detail}</p>
            </article>
          ))}
          <div className="amenities-card">
            <h3>Included Amenities</h3>
            <ul>
              {amenities.map((item) => (
                <li key={item}>
                  <Check size={15} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h2 className="content-heading">Reservation Inquiry</h2>
          <div className="reservation-form">
            <Field
              label="Full Name"
              value={form.name}
              error={errors.name}
              placeholder="Juan dela Cruz"
              onChange={(value) => update("name", value)}
            />
            <Field
              label="Contact Number"
              value={form.contact}
              error={errors.contact}
              placeholder="09XX XXX XXXX"
              onChange={(value) => update("contact", value)}
            />
            <Field
              label="Email Address"
              type="email"
              value={form.email}
              error={errors.email}
              placeholder="juan@example.com"
              onChange={(value) => update("email", value)}
            />
            <Field
              label="Expected Guests"
              type="number"
              value={form.guests}
              error={errors.guests}
              placeholder="e.g. 80"
              onChange={(value) => update("guests", value)}
            />
            <label className="form-field">
              <span>Event Type</span>
              <select
                className={errors.eventType ? "input input--error" : "input"}
                value={form.eventType}
                onChange={(event) => update("eventType", event.target.value)}
              >
                <option value="">Select event type...</option>
                {EVENT_TYPES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              {errors.eventType && (
                <small className="field-error">{errors.eventType}</small>
              )}
            </label>
            <label className="form-field">
              <span>
                Special Requests <em>(optional)</em>
              </span>
              <textarea
                className="input"
                rows={4}
                placeholder="Any special setup, dietary requirements, or notes..."
                value={form.specialRequests}
                onChange={(event) =>
                  update("specialRequests", event.target.value)
                }
              />
            </label>
            <button
              className="button button--red reservation-submit"
              onClick={validate}
              type="button"
            >
              Check Availability →
            </button>
            {submitted && (
              <div className="success-message">
                <strong>Reservation request received.</strong>
                <span>
                  Our team would confirm availability for your{" "}
                  {form.eventType.toLowerCase()} request.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
      <CalendarModal
        initialContact={form.contact}
        initialName={form.name}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={(details: BookingDetails) => {
          const now = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
          addFunctionBooking({
            id: nextFunctionId(),
            kind: "function_room",
            room: "Private Dining Room",
            customer: details.name || form.name,
            phone: details.contact || form.contact,
            email: form.email,
            guests: Number(form.guests) || 30,
            eventType: form.eventType || "Private Dining",
            date: details.date,
            time: details.time,
            status: "Pending",
            specialRequests: form.specialRequests,
            placedAt: now,
            timeline: [{ status: "Pending", at: now }],
          });
          setSubmitted(true);
        }}
        title="Select Your Event Date"
      />
    </div>
  );
}

function Field({
  label,
  value,
  error,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        className={error ? "input input--error" : "input"}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
