import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  BOOKING_TIME_OPTIONS,
  FUNCTION_ROOM_ID,
  SlotTakenError,
  bookingTimeToSql,
  fetchMonthAvailability,
  subscribeAvailability,
  type BookingAvailability,
  type BookingInventoryKind,
  type MonthAvailability,
} from "../../data/reservations";
import { getStoredContact, saveStoredContact } from "../../lib/contact";

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
  onConfirm: (details: BookingDetails) => Promise<string>;
  bookingKind: BookingInventoryKind;
  roomId?: string;
  title?: string;
  initialName?: string;
  initialContact?: string;
  initialPax?: number;
  minPax?: number;
  maxPax?: number;
  countLabel?: string;
  countUnit?: string;
  showCount?: boolean;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Full-name: letters, spaces, dots, hyphens, apostrophes; 3–60 chars. */
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s.'-]{3,60}$/;
/** PH mobile: 09XXXXXXXXX or +639XXXXXXXXX (spaces/hyphens stripped). */
const CONTACT_REGEX = /^(09|\+639)\d{9}$/;

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatSelectedDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
  }).format(new Date(`${dateKey}T00:00:00`));
}

export function CalendarModal({
  isOpen,
  onClose,
  onConfirm,
  bookingKind,
  roomId,
  title = "Reserve a Date",
  initialName = "",
  initialContact = "",
  initialPax,
  minPax = 1,
  maxPax,
  countLabel = "Number of Guests",
  countUnit = "guest",
  showCount = true,
}: CalendarModalProps) {
  const today = useMemo(() => new Date(), []);
  const navigate = useNavigate();
  const { user } = useAuth();

  const effectiveName = initialName || user?.displayName || "";
  const effectiveContact = initialContact || getStoredContact(user?.id);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState("");
  const [time, setTime] = useState<string>(BOOKING_TIME_OPTIONS[0]);
  const [name, setName] = useState(effectiveName);
  const [contact, setContact] = useState(effectiveContact);
  const [pax, setPax] = useState(String(initialPax ?? minPax));
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [availability, setAvailability] = useState<MonthAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const availabilityRequest = useRef(0);

  const refreshAvailability = useCallback(async () => {
    const request = ++availabilityRequest.current;
    setAvailabilityLoading(true);
    setAvailabilityError("");
    try {
      const next = await fetchMonthAvailability(viewYear, viewMonth);
      if (availabilityRequest.current === request) setAvailability(next);
    } catch {
      if (availabilityRequest.current === request) {
        setAvailabilityError("Availability could not be loaded. Please try again.");
      }
    } finally {
      if (availabilityRequest.current === request) setAvailabilityLoading(false);
    }
  }, [availabilityRequest, viewMonth, viewYear]);
  const refreshAvailabilityRef = useRef(refreshAvailability);
  refreshAvailabilityRef.current = refreshAvailability;

  const resetAndClose = useCallback(() => {
    setSelectedDate("");
    setTime(BOOKING_TIME_OPTIONS[0]);
    setName(effectiveName);
    setContact(effectiveContact);
    setPax(String(initialPax ?? minPax));
    setSubmitted(false);
    setShowErrors(false);
    setBookingRef("");
    setSubmitError("");
    setAvailability(null);
    setAvailabilityLoading(false);
    setAvailabilityError("");
    onClose();
  }, [effectiveContact, effectiveName, initialPax, minPax, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    setName(effectiveName);
    setContact(effectiveContact);
    setPax(String(initialPax ?? minPax));
    document.body.classList.add("modal-open");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) resetAndClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [effectiveContact, effectiveName, initialPax, minPax, isOpen, resetAndClose, saving]);

  useEffect(() => {
    if (!isOpen) {
      availabilityRequest.current += 1;
      return;
    }
    const channel = subscribeAvailability(() => {
      void refreshAvailabilityRef.current();
    });
    return () => {
      availabilityRequest.current += 1;
      void channel.unsubscribe();
    };
  }, [availabilityRequest, isOpen]);

  useEffect(() => {
    if (isOpen) void refreshAvailability();
  }, [isOpen, refreshAvailability]);

  if (!isOpen) return null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const currentMonthKey = today.getFullYear() * 12 + today.getMonth();
  const viewedMonthKey = viewYear * 12 + viewMonth;
  const availabilityReady = availability !== null && !availabilityLoading && !availabilityError;

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

  const inventoryKind = bookingKind;
  const inventoryResource =
    bookingKind === "function_room" ? roomId ?? FUNCTION_ROOM_ID : bookingKind;
  const isTimeUnavailable = (dateKey: string, timeLabel: string) => {
    const slot = bookingTimeToSql(timeLabel).slice(0, 5);
    return (availability?.bookedSlots ?? []).some(
      (booked: BookingAvailability) =>
        booked.kind === inventoryKind &&
        booked.resourceId === inventoryResource &&
        booked.date === dateKey &&
        booked.time.slice(0, 5) === slot,
    );
  };
  const isReserved = (dateKey: string) =>
    (availability?.reservedDates ?? []).includes(dateKey) ||
    BOOKING_TIME_OPTIONS.every((option) => isTimeUnavailable(dateKey, option));

  const moveMonth = (direction: -1 | 1) => {
    const next = new Date(viewYear, viewMonth + direction, 1);
    setSelectedDate("");
    setSubmitError("");
    setAvailability(null);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const nameValid = NAME_REGEX.test(name.trim());
  const contactValid = CONTACT_REGEX.test(contact.trim().replace(/[\s-]/g, ""));
  const paxNum = parseInt(pax, 10);
  const paxValid =
    !Number.isNaN(paxNum) &&
    paxNum >= minPax &&
    (maxPax === undefined || paxNum <= maxPax);

  const submitBooking = async () => {
    if (
      !availabilityLoading &&
      !availabilityError &&
      selectedDate &&
      isTimeUnavailable(selectedDate, time)
    ) {
      setSubmitError("That time was just booked. Choose another available time.");
      return;
    }
    if (!selectedDate || !nameValid || !contactValid || !paxValid) {
      setShowErrors(true);
      return;
    }
    if (availabilityLoading || availabilityError) return;

    if (user?.id) {
      saveStoredContact(user.id, contact.trim());
    }

    setSaving(true);
    setSubmitError("");
    try {
      const id = await onConfirm({
        date: selectedDate,
        time,
        name: name.trim(),
        contact: contact.trim(),
        pax: paxNum,
      });
      setBookingRef(id);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof SlotTakenError
          ? "That time was just booked. Choose another available time."
          : "Reservation could not be submitted. Please try again.",
      );
      void refreshAvailability();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="calendar-modal-backdrop"
      onMouseDown={(event) => {
        if (!saving && event.target === event.currentTarget) resetAndClose();
      }}
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
          disabled={saving}
          onClick={resetAndClose}
          type="button"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="calendar-modal__success">
            <span className="calendar-modal__success-icon">
              <Check size={38} />
            </span>

            <div className="success-ref-block">
              <span className="success-ref-label">Booking Reference</span>
              <span className="success-ref-number">{bookingRef}</span>
              <span className="success-ref-divider" />
            </div>

            <h2>Reservation Submitted!</h2>

            <div className="booking-summary">
              <div className="booking-summary__row">
                <span>Date</span>
                <strong>{formatSelectedDate(selectedDate)}</strong>
              </div>
              <div className="booking-summary__row">
                <span>Time</span>
                <strong>{time}</strong>
              </div>
              {showCount && (
                <div className="booking-summary__row">
                  <span>{countLabel}</span>
                  <strong>
                    {paxNum} {countUnit}{paxNum !== 1 ? "s" : ""}
                  </strong>
                </div>
              )}
            </div>

            <p className="success-next-steps">
              Capitol&apos;s team will contact you within <strong>24 hours</strong> to
              confirm your reservation and discuss event details.
            </p>

            <div className="success-actions">
              <button
                className="button button--red"
                onClick={resetAndClose}
                type="button"
              >
                Make Another Booking
              </button>
              <button
                className="button button--red"
                onClick={() => {
                  resetAndClose();
                  navigate("/");
                }}
                type="button"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
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
              <div className="booking-calendar-col">
                <div className="booking-calendar">
                <div className="booking-calendar__toolbar">
                  <button
                    aria-label="Previous month"
                    disabled={saving || viewedMonthKey <= currentMonthKey}
                    onClick={() => moveMonth(-1)}
                    type="button"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <strong>
                    {MONTHS[viewMonth]} {viewYear}
                  </strong>
                  <button
                    aria-label="Next month"
                    disabled={saving}
                    onClick={() => moveMonth(1)}
                    type="button"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="booking-calendar__weekdays">
                  {WEEKDAYS.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>

                <div className="booking-calendar__days">
                  {Array.from({ length: firstWeekday }).map((_, index) => (
                    <span aria-hidden="true" key={`blank-${index}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, index) => {
                    const day = index + 1;
                    const dateKey = toDateKey(viewYear, viewMonth, day);
                    const blocked = isBlockedDate(day);
                    const reserved = isReserved(dateKey);
                    const selected = selectedDate === dateKey;

                    return (
                      <button
                        aria-label={`${MONTHS[viewMonth]} ${day}, ${viewYear}${reserved ? " – unavailable" : ""}`}
                        className={
                          selected
                            ? "booking-day booking-day--selected"
                            : reserved
                              ? "booking-day booking-day--reserved"
                            : "booking-day"
                        }
                        disabled={saving || blocked || reserved || !availabilityReady}
                        key={dateKey}
                        onClick={() => {
                          setSelectedDate(dateKey);
                          setSubmitError("");
                          const firstAvailable = BOOKING_TIME_OPTIONS.find(
                            (option) => !isTimeUnavailable(dateKey, option),
                          );
                          if (firstAvailable) setTime(firstAvailable);
                        }}
                        type="button"
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                </div>

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

                <p className="calendar-policy-note">
                  <AlertCircle size={13} />
                  Reservations must be made at least 2 days in advance.
                </p>
                {availabilityLoading && (
                  <p className="calendar-policy-note">Checking live availability…</p>
                )}
                {availabilityError && (
                  <p className="field-error" role="alert">
                    {availabilityError}
                  </p>
                )}
              </div>

              <div className="booking-fields">
                {submitError && <p className="field-error" role="alert">{submitError}</p>}
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
                    disabled={saving || !selectedDate || !availabilityReady}
                    value={time}
                    onChange={(event) => {
                      setTime(event.target.value);
                      setSubmitError("");
                    }}
                  >
                    {BOOKING_TIME_OPTIONS.map((option) => {
                      const unavailable =
                        Boolean(selectedDate) && isTimeUnavailable(selectedDate, option);
                      return (
                        <option disabled={unavailable} key={option} value={option}>
                          {option}{unavailable ? " — Reserved" : ""}
                        </option>
                      );
                    })}
                  </select>
                  {selectedDate &&
                    availabilityReady &&
                    isTimeUnavailable(selectedDate, time) && (
                      <span className="field-error" role="alert">
                        This time was just booked. Choose another.
                      </span>
                    )}
                </label>

                <label className="form-field">
                  <span>Full Name</span>
                  <input
                    className={showErrors && !nameValid ? "input input--error" : "input"}
                    disabled={saving}
                    placeholder="Juan dela Cruz"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
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
                    disabled={saving}
                    placeholder="09XX XXX XXXX"
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                  />
                  {showErrors && !contactValid && (
                    <span className="field-error">
                      Enter a valid PH mobile number (e.g. 09XX XXX XXXX)
                    </span>
                  )}
                </label>

                {showCount && (
                  <label className="form-field">
                    <span>
                      {countLabel}{" "}
                      {minPax > 1 && (
                        <em>
                          (min. {minPax}{maxPax ? `, max. ${maxPax}` : ""})
                        </em>
                      )}
                    </span>
                    <input
                      className={showErrors && !paxValid ? "input input--error" : "input"}
                      disabled={saving}
                      min={minPax}
                      max={maxPax}
                      placeholder={String(minPax)}
                      type="number"
                      value={pax}
                      onChange={(event) => setPax(event.target.value)}
                    />
                    {showErrors && !paxValid && (
                      <span className="field-error">
                        {maxPax
                          ? `${countLabel} must be between ${minPax} and ${maxPax}`
                          : `Minimum ${minPax} ${countUnit}s required`}
                      </span>
                    )}
                  </label>
                )}

                <button
                  className="button button--red calendar-modal__submit"
                  disabled={saving || !availabilityReady}
                  onClick={submitBooking}
                  type="button"
                >
                  {saving ? "Submitting…" : "Submit Reservation"}
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
