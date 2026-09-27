import {
  Check,
  Clock3,
  MapPin,
  Package,
  Search,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getDeliveryOrders,
  type DeliveryOrder,
  DELIVERY_STATUSES,
} from "../../data/delivery";

export function DeliveryTracker() {
  const [searchParams] = useSearchParams();
  const initialReference = searchParams.get("reference") ?? "";
  const [reference, setReference] = useState(initialReference);
  const [searchedReference, setSearchedReference] = useState(initialReference);
  const orders = getDeliveryOrders();
  const order = useMemo(
    () =>
      orders.find(
        (item) =>
          item.reference.toLowerCase() ===
          searchedReference.trim().toLowerCase(),
      ),
    [orders, searchedReference],
  );

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
            placeholder="e.g. CAP-1042"
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

      {!searchedReference && (
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
          <span>
            Try one of the available references: CAP-1042, CAP-1043, or
            CAP-1044.
          </span>
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

function TrackingResult({ order }: { order: DeliveryOrder }) {
  const activeIndex = DELIVERY_STATUSES.indexOf(order.status);
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
      <div className="tracking-layout">
        <div className="tracking-timeline">
          <h2>Delivery progress</h2>
          {DELIVERY_STATUSES.map((status, index) => (
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
        <DeliveryMap order={order} />
      </div>
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

function DeliveryMap({ order }: { order: DeliveryOrder }) {
  const delivered = order.status === "Delivered";
  return (
    <div className="delivery-map">
      <div className="delivery-map__grid" />
      <span className="delivery-map__road delivery-map__road--one" />
      <span className="delivery-map__road delivery-map__road--two" />
      <div className="map-marker map-marker--restaurant">
        <Package size={16} />
      </div>
      <div
        className={`map-marker map-marker--home ${delivered ? "map-marker--delivered" : ""}`}
      >
        <MapPin size={17} />
      </div>
      <span className="delivery-map__label">
        {delivered ? "Delivered" : "Delivery route"}
      </span>
    </div>
  );
}
