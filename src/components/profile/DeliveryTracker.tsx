import {
  Check,
  Clock3,
  MapPin,
  Package,
  Search,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getDeliveryOrders,
  type DeliveryOrder as LocalDeliveryOrder,
} from "../../data/delivery";
import {
  fetchMyDeliveryOrders,
  subscribeDeliveryOrders,
  type SupabaseDeliveryOrder,
} from "../../data/deliveryOrders";
import { useAuth } from "../../context/AuthContext";
import { DeliveryMap } from "./DeliveryMap";

type AnyOrder = {
  reference: string;
  eta: string;
  status: string;
  placedAt: string;
  address: string;
  items: string;
  timeline: { status: string; at: string }[];
};

const TRACK_STEPS = [
  "Pending Confirmation",
  "Preparing",
  "Ready for pickup",
  "Out for delivery",
  "Delivered",
];

function toAnyOrder(order: SupabaseDeliveryOrder): AnyOrder {
  return {
    reference: order.reference,
    eta: order.eta,
    status: order.status,
    placedAt: order.placedAt,
    address: order.address,
    items: order.itemsDisplay,
    timeline: order.timeline,
  };
}

function toAnyLocal(order: LocalDeliveryOrder): AnyOrder {
  return {
    reference: order.reference,
    eta: order.eta,
    status: order.status,
    placedAt: order.placedAt,
    address: order.address,
    items: order.items,
    timeline: order.timeline ?? [{ status: order.status, at: order.placedAt }],
  };
}

export function DeliveryTracker() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const initialReference = searchParams.get("reference") ?? "";
  const [reference, setReference] = useState(initialReference);
  const [searchedReference, setSearchedReference] = useState(initialReference);
  const [remoteOrders, setRemoteOrders] = useState<SupabaseDeliveryOrder[]>([]);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) {
      setRemoteOrders([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    void fetchMyDeliveryOrders()
      .then((orders) => {
        if (active) setRemoteOrders(orders);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    const channel = subscribeDeliveryOrders(() => {
      void fetchMyDeliveryOrders()
        .then((orders) => {
          if (active) setRemoteOrders(orders);
        })
        .catch(() => {});
    });
    return () => {
      active = false;
      void channel.unsubscribe();
    };
  }, [user?.id]);

  const localOrders = useMemo(() => getDeliveryOrders(), []);

  const order: AnyOrder | undefined = useMemo(() => {
    const key = searchedReference.trim().toLowerCase();
    if (!key) return undefined;
    const remote = remoteOrders.find(
      (item) => item.reference.toLowerCase() === key,
    );
    if (remote) return toAnyOrder(remote);
    const local = localOrders.find(
      (item) => item.reference.toLowerCase() === key,
    );
    return local ? toAnyLocal(local) : undefined;
  }, [remoteOrders, localOrders, searchedReference]);

  return (
    <div className="inquiry-form profile-track">
      <h2>Track your delivery</h2>
      <p className="profile-track__intro">
        Enter your booking reference to see the latest update.
      </p>

      <div className="profile-track-search">
        <label className="form-field">
          <span>Booking reference</span>
          <input
            aria-label="Booking reference"
            className="input"
            placeholder="e.g. CAP-1050"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            onKeyDown={(event) =>
              event.key === "Enter" && setSearchedReference(reference)
            }
          />
        </label>
        <button
          className="button button--red"
          onClick={() => setSearchedReference(reference)}
          type="button"
        >
          <Search size={17} /> Track
        </button>
      </div>

      {user && (
        <div className="profile-track__mine">
          {loading ? (
            <span>Loading your orders…</span>
          ) : remoteOrders.length > 0 ? (
            <>
              <span>Your orders:</span>
              {remoteOrders.map((item) => (
                <button
                  key={item.reference}
                  onClick={() => {
                    setReference(item.reference);
                    setSearchedReference(item.reference);
                  }}
                  type="button"
                >
                  {item.reference} · {item.status}
                </button>
              ))}
            </>
          ) : (
            <span>No delivery orders yet — orders you place show up here automatically.</span>
          )}
        </div>
      )}

      {!searchedReference && !user && (
        <ReferenceHint
          onSelect={(value) => {
            setReference(value);
            setSearchedReference(value);
          }}
        />
      )}
      {searchedReference && !order && (
        <div className="empty-state">
          <Package size={28} />
          <strong>We could not find that reference.</strong>
          <span>Check the code from your order confirmation and try again.</span>
        </div>
      )}
      {order && <TrackingResult order={order} />}
    </div>
  );
}

function ReferenceHint({ onSelect }: { onSelect: (value: string) => void }) {
  return (
    <div className="reference-hint">
      <span>Try an available order:</span>
      {["CAP-1042", "CAP-1043", "CAP-1044"].map((item) => (
        <button key={item} onClick={() => onSelect(item)} type="button">
          {item}
        </button>
      ))}
    </div>
  );
}

function TrackingResult({ order }: { order: AnyOrder }) {
  const cancelled = order.status === "Cancelled";
  const activeIndex = TRACK_STEPS.indexOf(order.status);
  const delivered = order.status === "Delivered";
  return (
    <div className="tracking-result">
      <div className="order-summary">
        <div>
          <span className="order-summary__label">Booking reference</span>
          <strong>{order.reference}</strong>
        </div>
        <div>
          <span className="order-summary__label">Estimated arrival</span>
          <strong>{order.eta}</strong>
        </div>
        <span
          className={`status-pill status-pill--${order.status.toLowerCase().replaceAll(" ", "-")}`}
        >
          {order.status}
        </span>
      </div>
      {cancelled ? (
        <p className="profile-booking__notes">
          This order was cancelled. Contact us if you need anything else.
        </p>
      ) : (
        <div className="tracking-layout">
          <div className="tracking-timeline">
            <h2>Delivery progress</h2>
            {TRACK_STEPS.map((status, index) => (
              <div
                className={`timeline-step ${index <= activeIndex ? "timeline-step--active" : ""} ${index === activeIndex ? "timeline-step--current" : ""}`}
                key={status}
              >
                <span className="timeline-step__icon">
                  {index === 0 ? (
                    <Package size={16} />
                  ) : index === 1 ? (
                    <Clock3 size={16} />
                  ) : index === 2 ? (
                    <Truck size={16} />
                  ) : index === 3 ? (
                    <Truck size={16} />
                  ) : (
                    <Check size={16} />
                  )}
                </span>
                <div>
                  <strong>{status}</strong>
                  <small>
                    {status === order.status
                      ? `Updated ${order.placedAt}`
                      : index < activeIndex
                        ? "Completed"
                        : "Waiting for previous step"}
                  </small>
                </div>
              </div>
            ))}
          </div>
          <DeliveryMap address={order.address} delivered={delivered} />
        </div>
      )}
      <div className="delivery-details">
        <span>
          <MapPin size={16} /> Delivering to <strong>{order.address}</strong>
        </span>
        <span>
          <Package size={16} /> {order.items}
        </span>
      </div>
    </div>
  );
}
