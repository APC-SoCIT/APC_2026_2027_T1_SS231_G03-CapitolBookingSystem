import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarModal,
  SignInModal,
  type BookingDetails,
} from "../components/common";
import {
  createFunctionBooking,
  FUNCTION_ROOM_A_ID,
  FUNCTION_ROOM_CHOICES,
} from "../data/reservations";
import { useAuthGate } from "../hooks/useAuthGate";
import { useAuth } from "../context/AuthContext";
import { getStoredContact, fetchStoredProfile } from "../lib/contact";
import { FUNCTION_ROOM_EVENT_TYPES as EVENT_TYPES } from "../constants";

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
  roomId: string;
};
const initialForm: FormData = {
  name: "",
  contact: "",
  email: "",
  guests: "",
  eventType: "",
  specialRequests: "",
  roomId: FUNCTION_ROOM_A_ID,
};

export function FunctionRoomReservation() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [submitted, setSubmitted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { closeSignIn, requireAuth, showSignIn } = useAuthGate();
  const { user } = useAuth();

  // Autofill name + contact + email once the session is known. Server copy
  // wins so details saved on another device show up too.
  useEffect(() => {
    if (!user) return;
    const localContact = getStoredContact(user.id);
    setForm((current) => ({
      ...current,
      name: current.name || user.displayName,
      contact: current.contact || localContact,
      email: current.email || user.email,
    }));
    void fetchStoredProfile(user.id).then((profile) => {
      if (!profile.phone) return;
      setForm((current) => ({
        ...current,
        contact: current.contact || profile.phone,
      }));
    });
  }, [user]);

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
    if (!form.guests || !Number.isInteger(Number(form.guests)) || Number(form.guests) < 10) {
      next.guests = "Minimum 10 guests required";
    } else if (Number(form.guests) > 50) {
      next.guests = "Each room holds up to 50 guests";
    }
    if (!form.eventType) next.eventType = "Please select an event type";
    setErrors(next);
    if (!Object.keys(next).length && requireAuth()) setModalOpen(true);
  };

  return (
    <div className="function-rooms-page fr-reserve-page">
      <section className="section fr-reserve-layout" aria-labelledby="fr-reserve-title">
        <Link className="back-link" to="/function-rooms">
          <ArrowLeft size={15} />
          Back
        </Link>

        <h2 className="content-heading" id="fr-reserve-title">
          Reservation Inquiry
        </h2>
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
          <label className="form-field">
            <span>Function Room</span>
            <select
              className="input"
              id="function-room-choice"
              name="roomId"
              value={form.roomId}
              onChange={(event) => update("roomId", event.target.value)}
            >
              {FUNCTION_ROOM_CHOICES.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} (up to 50 guests)
                </option>
              ))}
            </select>
          </label>
          <Field
            id="function-room-guests"
            label="Expected Guests"
            type="number"
            min={10}
            max={50}
            step={1}
            value={form.guests}
            error={errors.guests}
            placeholder="e.g. 20"
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
      </section>
      <CalendarModal
        bookingKind="function_room"
        roomId={form.roomId}
        initialContact={form.contact}
        initialName={form.name}
        initialPax={Number(form.guests)}
        minPax={10}
        maxPax={50}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={async (details: BookingDetails) => {
          if (!user) throw new Error("Authentication required");
          const id = await createFunctionBooking({
            userId: user.id,
            roomId: form.roomId,
            customer: details.name || form.name,
            phone: details.contact || form.contact,
            email: form.email,
            guests: details.pax,
            eventType: form.eventType || "Private Dining",
            date: details.date,
            time: details.time,
            specialRequests: form.specialRequests,
          });
          setSubmitted(true);
          return id;
        }}
        title="Select Your Event Date"
      />
      {showSignIn && <SignInModal onClose={closeSignIn} />}
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
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  placeholder: string;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
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
        min={min}
        max={max}
        step={step}
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
