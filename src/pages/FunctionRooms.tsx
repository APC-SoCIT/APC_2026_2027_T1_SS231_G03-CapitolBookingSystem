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

const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s.'-]{3,60}$/;
const CONTACT_REGEX = /^(09|\+639)\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
  const update = (key: keyof FormData, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };
  const validate = () => {
    const next: typeof errors = {};
    if (!NAME_REGEX.test(form.name.trim())) {
      next.name = "Letters only, min. 3 characters (e.g. Juan dela Cruz)";
    }
    if (!CONTACT_REGEX.test(form.contact.trim().replace(/[\s-]/g, ""))) {
      next.contact =
        "Enter a valid PH mobile number (e.g. 09XX XXX XXXX)";
    }
    if (!EMAIL_REGEX.test(form.email.trim())) {
      next.email = "Enter a valid email address (e.g. juan@example.com)";
    }
    if (!form.guests || Number(form.guests) < 1)
      next.guests = "Please enter expected guest count";
    if (!form.eventType) next.eventType = "Please select an event type";
    setErrors(next);
    if (!Object.keys(next).length) setModalOpen(true);
  };
  return (
    <div className="function-rooms-page">
      <section className="page-hero">
        <div className="function-rooms-page__hero-content">
          <p className="eyebrow">Capitol Restaurant</p>
          <h1>Function Rooms</h1>
          <p>
            Host your most cherished events in Capitol&apos;s elegant function
            rooms. Fill out the form below to inquire about availability.
          </p>
        </div>
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
              id="function-room-name"
              label="Full Name"
              value={form.name}
              error={errors.name}
              placeholder="Juan dela Cruz"
              onChange={(value) => update("name", value)}
            />
            <Field
              id="function-room-contact"
              label="Contact Number"
              type="tel"
              value={form.contact}
              error={errors.contact}
              placeholder="09XX XXX XXXX"
              onChange={(value) => update("contact", value)}
            />
            <Field
              id="function-room-email"
              label="Email Address"
              type="email"
              value={form.email}
              error={errors.email}
              placeholder="juan@example.com"
              onChange={(value) => update("email", value)}
            />
            <Field
              id="function-room-guests"
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
                aria-describedby={errors.eventType ? "function-room-event-type-error" : undefined}
                aria-invalid={Boolean(errors.eventType)}
                className={errors.eventType ? "input input--error" : "input"}
                id="function-room-event-type"
                name="eventType"
                value={form.eventType}
                onChange={(event) => update("eventType", event.target.value)}
              >
                <option value="">Select event type...</option>
                {EVENT_TYPES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              {errors.eventType && (
                  <small className="field-error" id="function-room-event-type-error">
                    {errors.eventType}
                  </small>
              )}
            </label>
            <label className="form-field">
              <span>
                Special Requests <em>(optional)</em>
              </span>
              <textarea
                id="function-room-special-requests"
                name="specialRequests"
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
        initialPax={Number(form.guests)}
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
  id,
  label,
  value,
  error,
  placeholder,
  type = "text",
  onChange,
}: {
  id: string;
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
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={error ? "input input--error" : "input"}
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <small className="field-error" id={`${id}-error`}>
          {error}
        </small>
      )}
    </label>
  );
}
