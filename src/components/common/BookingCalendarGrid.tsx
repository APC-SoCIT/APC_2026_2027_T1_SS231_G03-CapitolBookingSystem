/** Month calendar grid driven by live booking availability.
 *
 * Shared by the booking modal (Check Availability) and the customer
 * change-request modal so blocked dates behave identically everywhere.
 */
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchMonthAvailability,
  subscribeAvailability,
  type BookingAvailability,
  type BookingInventoryKind,
  type MonthAvailability,
} from "../../data/reservations";

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

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type Props = {
  inventoryKind: BookingInventoryKind;
  resourceId: string;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  disabled?: boolean;
  /** Minimum days between today and a bookable date. */
  minDaysAhead?: number;
};

export function BookingCalendarGrid({
  inventoryKind,
  resourceId,
  selectedDate,
  onSelectDate,
  disabled = false,
  minDaysAhead = 2,
}: Props) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [availability, setAvailability] = useState<MonthAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);

  const refreshAvailability = useCallback(async () => {
    const version = ++request.current;
    setLoading(true);
    setError("");
    try {
      const next = await fetchMonthAvailability(viewYear, viewMonth);
      if (request.current === version) setAvailability(next);
    } catch {
      if (request.current === version) {
        setError("Availability could not be loaded. Please try again.");
      }
    } finally {
      if (request.current === version) setLoading(false);
    }
  }, [viewMonth, viewYear]);

  useEffect(() => {
    void refreshAvailability();
    const channel = subscribeAvailability(() => void refreshAvailability());
    return () => {
      request.current += 1;
      void channel.unsubscribe();
    };
  }, [refreshAvailability]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const currentMonthKey = today.getFullYear() * 12 + today.getMonth();
  const viewedMonthKey = viewYear * 12 + viewMonth;
  const ready = availability !== null && !loading && !error;

  /** Block the next minDaysAhead days — reservations/orders need lead time. */
  const isBlockedDate = (day: number) => {
    const candidate = new Date(viewYear, viewMonth, day);
    const minDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + minDaysAhead,
    );
    return candidate < minDate;
  };

  /** Whole-date rule: any active booking blocks the date for this inventory pool. */
  const isDateUnavailable = (dateKey: string) =>
    (availability?.bookedSlots ?? []).some(
      (booked: BookingAvailability) =>
        booked.kind === inventoryKind &&
        booked.resourceId === resourceId &&
        booked.date === dateKey,
    );
  const isReserved = (dateKey: string) =>
    (availability?.reservedDates ?? []).includes(dateKey) ||
    isDateUnavailable(dateKey);

  const moveMonth = (direction: -1 | 1) => {
    const next = new Date(viewYear, viewMonth + direction, 1);
    onSelectDate("");
    setAvailability(null);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  return (
    <div className="booking-calendar-col">
      <div className="booking-calendar">
        <div className="booking-calendar__toolbar">
          <button
            aria-label="Previous month"
            disabled={disabled || viewedMonthKey <= currentMonthKey}
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
            disabled={disabled}
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
                disabled={disabled || blocked || reserved || !ready}
                key={dateKey}
                onClick={() => onSelectDate(dateKey)}
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
        {minDaysAhead >= 2
          ? "Reservations must be made at least 2 days in advance."
          : `Dates must be at least ${minDaysAhead} day${minDaysAhead === 1 ? "" : "s"} ahead.`}
      </p>
      {loading && <p className="calendar-policy-note">Checking live availability…</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
