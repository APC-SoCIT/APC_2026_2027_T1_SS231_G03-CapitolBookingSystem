import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export type BookingDetails = {
  date: string;
  time: string;
  name: string;
  contact: string;
};

type CalendarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: BookingDetails) => void;
  title?: string;
  initialName?: string;
  initialContact?: string;
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
const TIME_OPTIONS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
];

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
  title = "Reserve a Date",
  initialName = "",
  initialContact = "",
}: CalendarModalProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState("");
  const [time, setTime] = useState(TIME_OPTIONS[0]);
  const [name, setName] = useState(initialName);
  const [contact, setContact] = useState(initialContact);
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const resetAndClose = useCallback(() => {
    setSelectedDate("");
    setTime(TIME_OPTIONS[0]);
    setName(initialName);
    setContact(initialContact);
    setSubmitted(false);
    setShowErrors(false);
    onClose();
  }, [initialContact, initialName, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    setName(initialName);
    setContact(initialContact);
    document.body.classList.add("modal-open");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") resetAndClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [initialContact, initialName, isOpen, resetAndClose]);

  if (!isOpen) return null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const currentMonthKey = today.getFullYear() * 12 + today.getMonth();
  const viewedMonthKey = viewYear * 12 + viewMonth;

  const isPastDate = (day: number) => {
    const candidate = new Date(viewYear, viewMonth, day);
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    return candidate < startOfToday;
  };

  const moveMonth = (direction: -1 | 1) => {
    const next = new Date(viewYear, viewMonth + direction, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const submitBooking = () => {
    if (!selectedDate || !name.trim() || !contact.trim()) {
      setShowErrors(true);
      return;
    }

    onConfirm({
      date: selectedDate,
      time,
      name: name.trim(),
      contact: contact.trim(),
    });
    setSubmitted(true);
  };

  return createPortal(
    <div
      className="calendar-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) resetAndClose();
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
          onClick={resetAndClose}
          type="button"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="calendar-modal__success">
            <span className="calendar-modal__success-icon">
              <Check size={28} />
            </span>
            <p className="eyebrow">Request received</p>
            <h2>Reservation submitted</h2>
            <p>
              Your request for {formatSelectedDate(selectedDate)} at {time} has
              been recorded. Capitol&apos;s staff will contact you to confirm
              availability.
            </p>
            <button
              className="button button--red"
              onClick={resetAndClose}
              type="button"
            >
              Done
            </button>
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
                  <strong>
                    {MONTHS[viewMonth]} {viewYear}
                  </strong>
                  <button
                    aria-label="Next month"
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
                    const disabled = isPastDate(day);
                    const selected = selectedDate === dateKey;

                    return (
                      <button
                        aria-label={`${MONTHS[viewMonth]} ${day}, ${viewYear}`}
                        className={
                          selected
                            ? "booking-day booking-day--selected"
                            : "booking-day"
                        }
                        disabled={disabled}
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
                    onChange={(event) => setTime(event.target.value)}
                  >
                    {TIME_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Full Name</span>
                  <input
                    className={
                      showErrors && !name.trim()
                        ? "input input--error"
                        : "input"
                    }
                    placeholder="Juan dela Cruz"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span>Contact Number</span>
                  <input
                    className={
                      showErrors && !contact.trim()
                        ? "input input--error"
                        : "input"
                    }
                    placeholder="09XX XXX XXXX"
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                  />
                </label>

                {showErrors &&
                  (!selectedDate || !name.trim() || !contact.trim()) && (
                    <p className="field-error">
                      Select a date and complete the required contact details.
                    </p>
                  )}

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
