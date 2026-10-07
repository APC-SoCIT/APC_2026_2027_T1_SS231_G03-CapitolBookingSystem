import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  fetchCateringBookings,
  fetchFunctionBookings,
  requestBookingChange,
  subscribeReservationChanges,
  type CancellationTarget,
  type CateringBooking,
  type FunctionBooking,
} from "../../data/reservations";
import { useAuth } from "../../context/AuthContext";
import { StatusPill } from "../operations/StatusPill";

type Props = {
  userId: string;
};

export function BookingHistory({ userId }: Props) {
  const { user } = useAuth();
  const [functionBookings, setFunctionBookings] = useState<FunctionBooking[]>([]);
  const [cateringBookings, setCateringBookings] = useState<CateringBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelTarget, setCancelTarget] = useState<CancellationTarget | null>(null);
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const fetchVersion = useRef(0);

  const loadBookings = useCallback(async () => {
    const version = ++fetchVersion.current;
    try {
      const [functions, catering] = await Promise.all([
        fetchFunctionBookings(),
        fetchCateringBookings(),
      ]);
      if (version !== fetchVersion.current) return;
      setFunctionBookings(functions);
      setCateringBookings(catering);
      setError("");
    } catch {
      if (version === fetchVersion.current) {
        setError("Bookings could not be loaded. Refresh and try again.");
      }
    } finally {
      if (version === fetchVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVersion.current += 1;
    void loadBookings();
    const channel = subscribeReservationChanges(() => void loadBookings());
    return () => {
      fetchVersion.current += 1;
      void channel.unsubscribe();
    };
  }, [loadBookings, userId]);

  if (loading) {
    return <p className="profile-history__status">Loading your bookings…</p>;
  }

  if (error) {
    return (
      <p className="profile-history__status profile-history__status--error" role="alert">
        {error}
      </p>
    );
  }

  if (!functionBookings.length && !cateringBookings.length) {
    return (
      <p className="profile-history__status">
        No bookings yet — reservations you make will show up here automatically.
      </p>
    );
  }

  return (
    <div className="profile-history">
      {functionBookings.length > 0 && (
        <BookingSection label="Function room reservations">
          {functionBookings.map((booking) => (
            <FunctionCard
              booking={booking}
              key={booking.id}
              cancellationRequested={requestedIds.includes(booking.id)}
              onRequestChange={() =>
                setCancelTarget({ bookingType: "function_room", booking })
              }
            />
          ))}
        </BookingSection>
      )}
      {cateringBookings.length > 0 && (
        <BookingSection label="Catering bookings">
          {cateringBookings.map((booking) => (
            <CateringCard
              booking={booking}
              key={booking.id}
              cancellationRequested={requestedIds.includes(booking.id)}
              onRequestChange={() =>
                setCancelTarget({ bookingType: "catering", booking })
              }
            />
          ))}
        </BookingSection>
      )}
      {cancelTarget && user && (
        <CancelRequestModal
          target={cancelTarget}
          customer={user.displayName}
          email={user.email}
          userId={userId}
          onClose={() => setCancelTarget(null)}
          onSubmitted={(bookingId) => {
            setRequestedIds((current) =>
              current.includes(bookingId) ? current : [...current, bookingId],
            );
            setCancelTarget(null);
          }}
        />
      )}
    </div>
  );
}

function BookingSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="profile-history__section">
      <p className="eyebrow">{label}</p>
      <div className="profile-history__cards">{children}</div>
    </section>
  );
}

function FunctionCard({
  booking,
  cancellationRequested,
  onRequestChange,
}: {
  booking: FunctionBooking;
  cancellationRequested: boolean;
  onRequestChange: () => void;
}) {
  const changeable = booking.status === "Pending" || booking.status === "Confirmed";
  return (
    <article className="profile-booking">
      <header className="profile-booking__head">
        <strong className="profile-booking__ref">{booking.id}</strong>
        <StatusPill status={booking.status} />
      </header>
      <dl className="profile-booking__meta">
        <div>
          <dt>Room</dt>
          <dd>{booking.room}</dd>
        </div>
        <div>
          <dt>Event</dt>
          <dd>{booking.eventType}</dd>
        </div>
        <div>
          <dt>When</dt>
          <dd>
            {booking.date} · {booking.time}
          </dd>
        </div>
        <div>
          <dt>Guests</dt>
          <dd>{booking.guests}</dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd>—</dd>
        </div>
        <div>
          <dt>Placed</dt>
          <dd>{booking.placedAt}</dd>
        </div>
      </dl>
      {booking.specialRequests && (
        <p className="profile-booking__notes">{booking.specialRequests}</p>
      )}
      {changeable && !cancellationRequested && (
        <button
          className="button button--ghost profile-booking__cancel"
          onClick={onRequestChange}
          type="button"
        >
          Request cancellation
        </button>
      )}
      {cancellationRequested && (
        <p className="profile-booking__requested">
          Cancellation requested — our team will confirm shortly.
        </p>
      )}
      <StatusTimeline timeline={booking.timeline} />
    </article>
  );
}

function CateringCard({
  booking,
  cancellationRequested,
  onRequestChange,
}: {
  booking: CateringBooking;
  cancellationRequested: boolean;
  onRequestChange: () => void;
}) {
  const isBuffet = booking.kind === "catering_buffet";
  const changeable = booking.status === "Pending" || booking.status === "Confirmed";
  return (
    <article className="profile-booking">
      <header className="profile-booking__head">
        <strong className="profile-booking__ref">{booking.id}</strong>
        <StatusPill status={booking.status} />
      </header>
      <dl className="profile-booking__meta">
        <div>
          <dt>Type</dt>
          <dd>{isBuffet ? "Buffet catering" : "Packed meals"}</dd>
        </div>
        {isBuffet && booking.packageName && (
          <div>
            <dt>Package</dt>
            <dd>
              {booking.packageName}
              {booking.pax ? ` · ${booking.pax} pax` : ""}
            </dd>
          </div>
        )}
        {!isBuffet && Boolean(booking.itemsList?.length) && (
          <div>
            <dt>Items</dt>
            <dd>
              {(booking.itemsList ?? [])
                .map((item) => `${item.name} ×${item.quantity}`)
                .join(", ")}
            </dd>
          </div>
        )}
        {!isBuffet && booking.guestCount !== undefined && (
          <div>
            <dt>Packs</dt>
            <dd>{booking.guestCount}</dd>
          </div>
        )}
        <div>
          <dt>When</dt>
          <dd>
            {booking.date} · {booking.time}
          </dd>
        </div>
        {booking.venueType === "function_room" ? (
          <div>
            <dt>Venue</dt>
            <dd>{booking.functionRoomName ?? booking.functionRoomId ?? "Function room"}</dd>
          </div>
        ) : (
          booking.deliveryAddress && (
            <div>
              <dt>Deliver to</dt>
              <dd>{booking.deliveryAddress}</dd>
            </div>
          )
        )}
        <div>
          <dt>Total</dt>
          <dd>₱{(booking.total ?? 0).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Placed</dt>
          <dd>{booking.placedAt}</dd>
        </div>
      </dl>
      {booking.notes && <p className="profile-booking__notes">{booking.notes}</p>}
      {changeable && !cancellationRequested && (
        <button
          className="button button--ghost profile-booking__cancel"
          onClick={onRequestChange}
          type="button"
        >
          Request cancellation
        </button>
      )}
      {cancellationRequested && (
        <p className="profile-booking__requested">
          Cancellation requested — our team will confirm shortly.
        </p>
      )}
      <StatusTimeline timeline={booking.timeline} />
    </article>
  );
}

function CancelRequestModal({
  target,
  customer,
  email,
  userId,
  onClose,
  onSubmitted,
}: {
  target: CancellationTarget;
  customer: string;
  email: string;
  userId: string;
  onClose: () => void;
  onSubmitted: (bookingId: string) => void;
}) {
  const [action, setAction] = useState<"cancel" | "move">("cancel");
  const [reason, setReason] = useState("");
  const [newDate, setNewDate] = useState("");
  const [step, setStep] = useState<"details" | "confirm">("details");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const bookingId = target.booking.id;

  const detailsValid =
    reason.trim().length >= 3 && (action === "cancel" || newDate !== "");

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await requestBookingChange({
        userId,
        customer,
        email,
        target,
        action,
        reason: reason.trim(),
        newDate: action === "move" ? newDate : undefined,
      });
      onSubmitted(bookingId);
    } catch {
      setError("Request could not be sent. Please try again.");
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="calendar-modal-backdrop"
      onMouseDown={(event) => {
        if (!saving && event.target === event.currentTarget) onClose();
      }}
    >
      <div className="calendar-modal" role="dialog" aria-modal="true">
        {step === "details" ? (
          <>
            <div className="calendar-modal__header">
              <div>
                <p className="eyebrow">Booking {bookingId}</p>
                <h2>Request a change</h2>
              </div>
            </div>
            <div className="booking-fields">
              <div className="form-field">
                <span>What do you need?</span>
                <label className="venue-option">
                  <input
                    type="radio"
                    name="change-action"
                    checked={action === "cancel"}
                    disabled={saving}
                    onChange={() => setAction("cancel")}
                  />
                  Cancel this booking
                </label>
                <label className="venue-option">
                  <input
                    type="radio"
                    name="change-action"
                    checked={action === "move"}
                    disabled={saving}
                    onChange={() => setAction("move")}
                  />
                  Move to another date
                </label>
              </div>
              {action === "move" && (
                <label className="form-field">
                  <span>New date</span>
                  <input
                    className="input"
                    disabled={saving}
                    type="date"
                    value={newDate}
                    min={target.booking.date}
                    onChange={(event) => setNewDate(event.target.value)}
                  />
                </label>
              )}
              <label className="form-field">
                <span>Why do you want to {action === "cancel" ? "cancel" : "move it"}?</span>
                <textarea
                  className="input"
                  disabled={saving}
                  placeholder="Tell our team the reason…"
                  rows={3}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
              <div className="success-actions">
                <button
                  className="button button--ghost"
                  disabled={saving}
                  onClick={onClose}
                  type="button"
                >
                  Back
                </button>
                <button
                  className="button button--red"
                  disabled={saving || !detailsValid}
                  onClick={() => setStep("confirm")}
                  type="button"
                >
                  Confirm
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="calendar-modal__header">
              <div>
                <p className="eyebrow">Booking {bookingId}</p>
                <h2>
                  {action === "cancel"
                    ? "Are you sure you want to cancel?"
                    : "Are you sure you want to move it?"}
                </h2>
              </div>
            </div>
            <div className="booking-fields">
              <p className="success-next-steps">
                {action === "cancel"
                  ? "Our team will review your request and confirm the cancellation."
                  : `Our team will review your request and confirm the move to ${newDate}.`}
              </p>
              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
              <div className="success-actions">
                <button
                  className="button button--ghost"
                  disabled={saving}
                  onClick={() => setStep("details")}
                  type="button"
                >
                  Go back
                </button>
                <button
                  className="button button--red"
                  disabled={saving}
                  onClick={submit}
                  type="button"
                >
                  {saving ? "Sending…" : "Yes, send request"}
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

function StatusTimeline({
  timeline,
}: {
  timeline: { status: string; at: string }[];
}) {
  if (!timeline.length) return null;
  return (
    <ol className="profile-booking__timeline">
      {timeline.map((entry, index) => (
        <li
          className={
            index === timeline.length - 1 ? "profile-timeline__row profile-timeline__row--current" : "profile-timeline__row"
          }
          key={`${entry.status}-${entry.at}-${index}`}
        >
          <strong>{entry.status}</strong>
          <small>{entry.at}</small>
        </li>
      ))}
    </ol>
  );
}
