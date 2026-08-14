import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { RESERVED_DATES } from "../../constants";

export type BookingDetails = {
  date: string;
  time: string;
  name: string;
  contact: string;
  pax: number;
};

type CalendarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: BookingDetails) => void;
  title?: string;
  initialName?: string;
  initialContact?: string;
  minPax?: number;
  maxPax?: number;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* 30-minute increments 9:00 AM – 7:30 PM */
const TIME_OPTIONS = [
  "9:00 AM", "9:30 AM",
  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM",
  "7:00 PM", "7:30 PM",
];

/** Full-name: letters, spaces, dots, hyphens, apostrophes; 3–60 chars. */
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s.'\\-]{3,60}$/;
/** PH mobile: 09XXXXXXXXX or +639XXXXXXXXX (spaces/hyphens stripped). */
const CONTACT_REGEX = /^(09|\+639)\d{9}$/;

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatSelectedDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "long" }).format(
    new Date(`${dateKey}T00:00:00`),
  );
}

function generateBookingRef() {
  return `CAP-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function CalendarModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Reserve a Date",
  initialName = "",
  initialContact = "",
  minPax = 1,
  maxPax,
}: CalendarModalProps) {
  const today = useMemo(() => new Date(), []);
  const navigate = useNavigate();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState("");
  const [time, setTime] = useState(TIME_OPTIONS[0]);
  const [name, setName] = useState(initialName);
  const [contact, setContact] = useState(initialContact);
  const [pax, setPax] = useState(String(minPax));
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const resetAndClose = useCallback(() => {
    setSelectedDate("");
    setTime(TIME_OPTIONS[0]);
    setName(initialName);
    setContact(initialContact);
    setPax(String(minPax));
    setSubmitted(false);
    setShowErrors(false);
    setBookingRef("");
    onClose();
  }, [initialContact, initialName, minPax, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName);
    setContact(initialContact);
    setPax(String(minPax));
    document.body.classList.add("modal-open");
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") resetAndClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [initialContact, initialName, minPax, isOpen, resetAndClose]);

  if (!isOpen) return null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const currentMonthKey = today.getFullYear() * 12 + today.getMonth();
  const viewedMonthKey = viewYear * 12 + viewMonth;

  /** Block today + tomorrow — reservation must be ≥ 2 days ahead. */
  const isBlockedDate = (day: number) => {
    const candidate = new Date(viewYear, viewMonth, day);
    const minDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 2,
    );
    return candidate < minDate;
  };

  const isReserved = (dateKey: string) => RESERVED_DATES.includes(dateKey);

  const moveMonth = (direction: -1 | 1) => {
    const next = new Date(viewYear, viewMonth + direction, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  /* ── Validation ────────────────────────────────────────────────── */
  const nameValid = NAME_REGEX.test(name.trim());
  const contactValid = CONTACT_REGEX.test(contact.trim().replace(/[\s-]/g, ""));
  const paxNum = parseInt(pax, 10);
  const paxValid =
    !isNaN(paxNum) && paxNum >= minPax && (maxPax === undefined || paxNum <= maxPax);

  const submitBooking = () => {
    if (!selectedDate || !nameValid || !contactValid || !paxValid) {
      setShowErrors(true);
      return;
    }
    const ref = generateBookingRef();
    setBookingRef(ref);
    onConfirm({ date: selectedDate, time, name: name.trim(), contact: contact.trim(), pax: paxNum });
    setSubmitted(true);
  };

  return createPortal(
    <div
      className="calendar-modal-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) resetAndClose(); }}
    >
      <div
        aria-labelledby="calendar-modal-title"
        aria-modal="true"
        className="calendar-modal"
        role="dialog"
      >
        <button
          aria-label="Close booking calendar"
          className="calendar-modal__close"
          onClick={resetAndClose}
          type="button"
        >
          <X size={20} />
        </button>

        {/* ── SUCCESS STATE ─────────────────────────────────────────── */}
        {submitted ? (
          <div className="calendar-modal__success">
            <span className="calendar-modal__success-icon">
              <Check size={38} />
            </span>

            {/* Booking reference — hero display */}
            <div className="success-ref-block">
              <span className="success-ref-label">Booking Reference</span>
              <span className="success-ref-number">{bookingRef}</span>
              <span className="success-ref-divider" />
            </div>

            <h2>Reservation Submitted!</h2>

            <div className="booking-summary" style={{ animationDelay: "0.18s" }}>
              <div className="booking-summary__row">
                <span>Date</span>
                <strong>{formatSelectedDate(selectedDate)}</strong>
              </div>
              <div className="booking-summary__row">
                <span>Time</span>
                <strong>{time}</strong>
              </div>
              <div className="booking-summary__row">
                <span>Guests</span>
                <strong>{paxNum} guest{paxNum !== 1 ? "s" : ""}</strong>
              </div>
            </div>

            <p className="success-next-steps" style={{ animationDelay: "0.24s" }}>
              Capitol's team will contact you within <strong>24 hours</strong> to confirm
              your reservation and discuss event details.
            </p>

            <div className="success-actions" style={{ animationDelay: "0.3s" }}>
              <button
                className="button button--red"
                onClick={resetAndClose}
                type="button"
              >
                Make Another Booking
              </button>
              <button
                className="button button--red"
                onClick={() => { resetAndClose(); navigate("/"); }}
                type="button"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          /* ── BOOKING FORM ───────────────────────────────────────── */
          <>
            <div className="calendar-modal__header">
              <span className="calendar-modal__header-icon">
                <CalendarDays size={22} />
              </span>
              <div>
                <p className="eyebrow">Booking schedule</p>
                <h2 id="calendar-modal-title">{title}</h2>
              </div>
            </div>

            <div className="calendar-modal__body">
              {/* Left column — calendar */}
              <div className="booking-calendar-col">
                <div className="booking-calendar">
                  <div className="booking-calendar__toolbar">
                    <button
                      aria-label="Previous month"
                      disabled={viewedMonthKey <= currentMonthKey}
                      onClick={() => moveMonth(-1)}
                      type="button"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <strong>{MONTHS[viewMonth]} {viewYear}</strong>
                    <button aria-label="Next month" onClick={() => moveMonth(1)} type="button">
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className="booking-calendar__weekdays">
                    {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
                  </div>

                  <div className="booking-calendar__days">
                    {Array.from({ length: firstWeekday }).map((_, i) => (
                      <span aria-hidden="true" key={`blank-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, idx) => {
                      const day = idx + 1;
                      const dateKey = toDateKey(viewYear, viewMonth, day);
                      const blocked = isBlockedDate(day);
                      const reserved = isReserved(dateKey);
                      const isSelected = selectedDate === dateKey;

                      const cls = isSelected
                        ? "booking-day booking-day--selected"
                        : reserved
                        ? "booking-day booking-day--reserved"
                        : "booking-day";

                      return (
                        <button
                          aria-label={`${MONTHS[viewMonth]} ${day}, ${viewYear}${reserved ? " – unavailable" : ""}`}
                          className={cls}
                          disabled={blocked || reserved}
                          key={dateKey}
                          onClick={() => setSelectedDate(dateKey)}
                          type="button"
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Legend — only Reserved + Your Selection */}
                <div className="calendar-legend">
                  <span className="calendar-legend__item">
                    <span className="calendar-legend__swatch calendar-legend__swatch--reserved" />
                    Reserved
                  </span>
                  <span className="calendar-legend__item">
                    <span className="calendar-legend__swatch calendar-legend__swatch--selected" />
                    Your Selection
                  </span>
                </div>

                {/* 2-day policy note */}
                <p className="calendar-policy-note">
                  <AlertCircle size={13} />
                  Reservations must be made at least 2 days in advance.
                </p>
              </div>

              {/* Right column — booking fields */}
              <div className="booking-fields">
                <label className="form-field">
                  <span>Selected Date</span>
                  <div
                    className={
                      showErrors && !selectedDate
                        ? "booking-date-display booking-date-display--error"
                        : "booking-date-display"
                    }
                  >
                    {selectedDate
                      ? formatSelectedDate(selectedDate)
                      : "Choose a date from the calendar"}
                  </div>
                </label>

                <label className="form-field">
                  <span>Preferred Time</span>
                  <select
                    className="input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  >
                    {TIME_OPTIONS.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Full Name</span>
                  <input
                    className={showErrors && !nameValid ? "input input--error" : "input"}
                    placeholder="Juan dela Cruz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {showErrors && !nameValid && (
                    <span className="field-error">
                      Letters only, min. 3 characters (e.g. Juan dela Cruz)
                    </span>
                  )}
                </label>

                <label className="form-field">
                  <span>Contact Number</span>
                  <input
                    className={showErrors && !contactValid ? "input input--error" : "input"}
                    placeholder="09XX XXX XXXX"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                  {showErrors && !contactValid && (
                    <span className="field-error">
                      Enter a valid PH mobile number (e.g. 09XX XXX XXXX)
                    </span>
                  )}
                </label>

                <label className="form-field">
                  <span>
                    Number of Guests{" "}
                    {minPax > 1 && (
                      <em>
                        (min. {minPax}{maxPax ? `, max. ${maxPax}` : ""})
                      </em>
                    )}
                  </span>
                  <input
                    className={showErrors && !paxValid ? "input input--error" : "input"}
                    min={minPax}
                    max={maxPax}
                    placeholder={String(minPax)}
                    type="number"
                    value={pax}
                    onChange={(e) => setPax(e.target.value)}
                  />
                  {showErrors && !paxValid && (
                    <span className="field-error">
                      {maxPax
                        ? `Guests must be between ${minPax} and ${maxPax}`
                        : `Minimum ${minPax} guests required`}
                    </span>
                  )}
                </label>

                <button
                  className="button button--red calendar-modal__submit"
                  onClick={submitBooking}
                  type="button"
                >
                  Submit Reservation
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
