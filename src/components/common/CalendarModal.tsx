/** Booking calendar modal: pick a date (live availability), a preferred time,
 * and validation-checked contact fields before the reservation is submitted.
 */
import {
  CalendarDays,
  Check,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { CateringVenue } from "../../data/reservations";
import {
  BOOKING_TIME_OPTIONS,
  FUNCTION_ROOM_A_ID,
  FUNCTION_ROOM_CHOICES,
  SlotTakenError,
} from "../../data/reservations";
import {
  fetchStoredProfile,
  getStoredContact,
  saveStoredContact,
} from "../../lib/contact";
import { BookingCalendarGrid } from "./BookingCalendarGrid";

export type BookingDetails = {
  date: string;
  time: string;
  name: string;
  contact: string;
  pax: number;
  /** Catering only: where the food is served. */
  venueType?: CateringVenue;
  /** Catering in-room only: chosen function room. */
  functionRoomId?: string;
  /** Catering delivered only: delivery address. */
  deliveryAddress?: string;
};

type CalendarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: BookingDetails) => Promise<string>;
  bookingKind: "function_room" | "catering_buffet" | "catering_packed";
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
  /** Catering only: let the customer pick in-room vs delivered. */
  showVenueSelector?: boolean;
};

/** Full-name: letters, spaces, dots, hyphens, apostrophes; 3–60 chars. */
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s.'-]{3,60}$/;
/** PH mobile: 09XXXXXXXXX or +639XXXXXXXXX (spaces/hyphens stripped). */
const CONTACT_REGEX = /^(09|\+639)\d{9}$/;

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
  showVenueSelector = false,
}: CalendarModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const effectiveName = initialName || user?.displayName || "";
  const effectiveContact = initialContact || getStoredContact(user?.id);

  const [selectedDate, setSelectedDate] = useState("");
  const [time, setTime] = useState<string>(BOOKING_TIME_OPTIONS[0]);
  const [name, setName] = useState(effectiveName);
  const [contact, setContact] = useState(effectiveContact);
  const [pax, setPax] = useState(String(initialPax ?? minPax));
  const [venueType, setVenueType] = useState<CateringVenue>("delivery");
  const [venueRoomId, setVenueRoomId] = useState<string>(FUNCTION_ROOM_A_ID);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const resetAndClose = useCallback(() => {
    setSelectedDate("");
    setTime(BOOKING_TIME_OPTIONS[0]);
    setName(effectiveName);
    setContact(effectiveContact);
    setPax(String(initialPax ?? minPax));
    setVenueType("delivery");
    setVenueRoomId(FUNCTION_ROOM_A_ID);
    setDeliveryAddress("");
    setSubmitted(false);
    setShowErrors(false);
    setBookingRef("");
    setSubmitError("");
    onClose();
  }, [effectiveContact, effectiveName, initialPax, minPax, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    setName(effectiveName);
    setContact(effectiveContact);
    setPax(String(initialPax ?? minPax));
    // Server copy wins over the offline cache once it arrives.
    // Saved delivery address prefills too, so repeat customers don't retype it.
    if (user?.id) {
      void fetchStoredProfile(user.id).then((server) => {
        if (server.phone) setContact(server.phone);
        const first = server.addresses.find((entry) => entry.address);
        if (first) setDeliveryAddress((current) => current || first.address);
      });
    }
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

  if (!isOpen) return null;

  /** Inventory pool the calendar blocks: explicit room for function bookings,
   * venue room for in-room catering, otherwise the catering kind itself. */
  const gridKind = bookingKind === "function_room" ||
    (showVenueSelector && venueType === "function_room")
    ? "function_room"
    : bookingKind;
  const gridResource =
    bookingKind === "function_room"
      ? (roomId ?? FUNCTION_ROOM_A_ID)
      : showVenueSelector && venueType === "function_room"
        ? venueRoomId
        : bookingKind;

  const nameValid = NAME_REGEX.test(name.trim());
  const contactValid = CONTACT_REGEX.test(contact.trim().replace(/[\s-]/g, ""));
  const paxNum = parseInt(pax, 10);
  const paxValid =
    !Number.isNaN(paxNum) &&
    paxNum >= minPax &&
    (maxPax === undefined || paxNum <= maxPax);

  const updateSelectedDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setSubmitError("");
  };

  const submitBooking = async () => {
    const venueAddressValid =
      !showVenueSelector ||
      venueType === "function_room" ||
      deliveryAddress.trim().length > 0;
    if (!selectedDate || !nameValid || !contactValid || !paxValid || !venueAddressValid) {
      setShowErrors(true);
      return;
    }

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
        ...(showVenueSelector
          ? venueType === "function_room"
            ? { venueType, functionRoomId: venueRoomId }
            : { venueType, deliveryAddress: deliveryAddress.trim() }
          : {}),
      });
      setBookingRef(id);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof SlotTakenError
          ? "That date was just booked. Choose another available date."
          : "Reservation could not be submitted. Please try again.",
      );
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
              {showVenueSelector && venueType === "function_room" && (
                <div className="booking-summary__row">
                  <span>Venue</span>
                  <strong>
                    {FUNCTION_ROOM_CHOICES.find((room) => room.id === venueRoomId)?.name ?? venueRoomId}
                  </strong>
                </div>
              )}
              {showVenueSelector && venueType === "delivery" && (
                <div className="booking-summary__row">
                  <span>Deliver to</span>
                  <strong>{deliveryAddress}</strong>
                </div>
              )}
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
              <BookingCalendarGrid
                inventoryKind={gridKind}
                resourceId={gridResource}
                selectedDate={selectedDate}
                onSelectDate={updateSelectedDate}
                disabled={saving}
              />

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
                    disabled={saving || !selectedDate}
                    value={time}
                    onChange={(event) => {
                      setTime(event.target.value);
                      setSubmitError("");
                    }}
                  >
                    {BOOKING_TIME_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                {showVenueSelector && (
                  <>
                    <div className="form-field">
                      <span>Where will this be served?</span>
                      <label className="venue-option">
                        <input
                          type="radio"
                          name="catering-venue"
                          checked={venueType === "function_room"}
                          disabled={saving}
                          onChange={() => {
                            setVenueType("function_room");
                            setSelectedDate("");
                            setSubmitError("");
                          }}
                        />
                        In our function room
                      </label>
                      <label className="venue-option">
                        <input
                          type="radio"
                          name="catering-venue"
                          checked={venueType === "delivery"}
                          disabled={saving}
                          onChange={() => {
                            setVenueType("delivery");
                            setSelectedDate("");
                            setSubmitError("");
                          }}
                        />
                        Deliver to my venue
                      </label>
                    </div>

                    {venueType === "function_room" ? (
                      <label className="form-field">
                        <span>Function Room</span>
                        <select
                          className="input"
                          disabled={saving}
                          value={venueRoomId}
                          onChange={(event) => {
                            setVenueRoomId(event.target.value);
                            setSelectedDate("");
                            setSubmitError("");
                          }}
                        >
                          {FUNCTION_ROOM_CHOICES.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label className="form-field">
                        <span>Delivery Address</span>
                        <textarea
                          className={
                            showErrors && !deliveryAddress.trim()
                              ? "input input--error"
                              : "input"
                          }
                          disabled={saving}
                          placeholder="Office, wedding venue, street, barangay, city"
                          rows={2}
                          value={deliveryAddress}
                          onChange={(event) => setDeliveryAddress(event.target.value)}
                        />
                        {showErrors && !deliveryAddress.trim() && (
                          <span className="field-error">
                            Delivery address is required
                          </span>
                        )}
                      </label>
                    )}
                  </>
                )}

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
                  disabled={saving}
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
