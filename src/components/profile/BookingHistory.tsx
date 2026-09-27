import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchCateringBookings,
  fetchFunctionBookings,
  subscribeReservationChanges,
  type CateringBooking,
  type FunctionBooking,
} from "../../data/reservations";
import { StatusPill } from "../operations/StatusPill";

type Props = {
  userId: string;
};

export function BookingHistory({ userId }: Props) {
  const [functionBookings, setFunctionBookings] = useState<FunctionBooking[]>([]);
  const [cateringBookings, setCateringBookings] = useState<CateringBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
            <FunctionCard booking={booking} key={booking.id} />
          ))}
        </BookingSection>
      )}
      {cateringBookings.length > 0 && (
        <BookingSection label="Catering bookings">
          {cateringBookings.map((booking) => (
            <CateringCard booking={booking} key={booking.id} />
          ))}
        </BookingSection>
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

function FunctionCard({ booking }: { booking: FunctionBooking }) {
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
      <StatusTimeline timeline={booking.timeline} />
    </article>
  );
}

function CateringCard({ booking }: { booking: CateringBooking }) {
  const isBuffet = booking.kind === "catering_buffet";
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
      <StatusTimeline timeline={booking.timeline} />
    </article>
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
