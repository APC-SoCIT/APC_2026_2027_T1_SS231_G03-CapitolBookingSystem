import {
  Bike,
  CalendarDays,
  CheckCheck,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StatusPill } from "../components/operations/StatusPill";
import { useAuth } from "../context/AuthContext";
import {
  DELIVERY_STATUSES,
  getDeliveryOrders,
  getDeliveryRiders,
  saveDeliveryOrders,
  updateOrderWithHistory,
  type DeliveryOrder,
  type DeliveryStatus,
} from "../data/delivery";

type StatusFilter = DeliveryStatus | "All";

// ponytail: placeholder match to first fleet rider; link auth user to rider record when delivery moves to Supabase
function resolveRiderId(displayName: string | undefined): string | null {
  const riders = getDeliveryRiders();
  if (!riders.length) return null;
  const match = displayName
    ? riders.find((rider) => rider.name.toLowerCase() === displayName.toLowerCase())
    : undefined;
  return (match ?? riders[0]).id;
}

const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  "Ready for pickup": "Out for delivery",
  "Out for delivery": "Delivered",
};

const NEXT_ACTION: Partial<Record<DeliveryStatus, string>> = {
  "Ready for pickup": "Start delivery",
  "Out for delivery": "Mark delivered",
};

export function DeliveryRider() {
  const { user } = useAuth();
  const [riderId] = useState(() => resolveRiderId(user?.displayName));
  const [orders, setOrders] = useState<DeliveryOrder[]>(getDeliveryOrders);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const rider = getDeliveryRiders().find((entry) => entry.id === riderId) ?? null;
  const myOrders = useMemo(
    () => (riderId ? orders.filter((order) => order.riderId === riderId) : []),
    [orders, riderId],
  );
  const filtered = useMemo(
    () => (statusFilter === "All" ? myOrders : myOrders.filter((order) => order.status === statusFilter)),
    [myOrders, statusFilter],
  );

  const activeCount = myOrders.filter((order) => order.status !== "Delivered").length;
  const outCount = myOrders.filter((order) => order.status === "Out for delivery").length;
  const doneCount = myOrders.filter((order) => order.status === "Delivered").length;

  const refresh = () => setOrders(getDeliveryOrders());

  const advance = (order: DeliveryOrder) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const updated = updateOrderWithHistory(order, {}, next);
    const list = orders.map((entry) => (entry.reference === order.reference ? updated : entry));
    setOrders(list);
    saveDeliveryOrders(list);
  };

  return (
    <div>
      <section className="section dashboard-section">
        <div className="dashboard-toolbar">
          <div>
            <p className="eyebrow">Delivery Rider</p>
            <h2>My deliveries</h2>
            <small className="ops-toolbar-hint">
              {rider ? (
                <>
                  {rider.name}
                  {rider.phone ? ` · ${rider.phone}` : null} · Status changes save instantly
                </>
              ) : (
                "No rider record assigned yet"
              )}
            </small>
          </div>
          <button className="reset-button" onClick={refresh} type="button">
            <RefreshCw size={15} />
            Refresh data
          </button>
        </div>

        <div className="dashboard-stats">
          <StatCard icon={<Truck size={20} />} label="Active deliveries" value={activeCount} hint="Not delivered yet" />
          <StatCard icon={<Bike size={20} />} label="Out for delivery" value={outCount} hint="On the road" />
          <StatCard icon={<PackageCheck size={20} />} label="Delivered" value={doneCount} hint="Completed drops" />
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <p className="eyebrow">Assignments</p>
              <h2>Today&apos;s route</h2>
            </div>
            <span className="dashboard-count">{filtered.length} of {myOrders.length} shown</span>
          </div>

          <div className="ops-filter-row">
            <button
              className={`ops-filter-chip ${statusFilter === "All" ? "ops-filter-chip--active" : ""}`}
              onClick={() => setStatusFilter("All")}
              type="button"
            >
              All <span>{myOrders.length}</span>
            </button>
            {DELIVERY_STATUSES.map((status) => {
              const count = myOrders.filter((order) => order.status === status).length;
              return (
                <button
                  key={status}
                  className={`ops-filter-chip ops-filter-chip--${status.toLowerCase().replaceAll(" ", "-")} ${statusFilter === status ? "ops-filter-chip--active" : ""}`}
                  onClick={() => setStatusFilter(status)}
                  type="button"
                >
                  {status} <span>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="dashboard-orders">
            {filtered.length > 0 ? (
              filtered.map((order) => (
                <RiderOrderCard key={order.reference} order={order} onAdvance={advance} />
              ))
            ) : (
              <p className="dashboard-empty">
                {myOrders.length === 0
                  ? "No deliveries assigned yet. New assignments from the team will appear here."
                  : "No deliveries match this filter."}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number; hint?: string }) {
  return (
    <div className="dashboard-stat">
      <span className="dashboard-stat__icon">{icon}</span>
      <span><strong>{value}</strong><small>{label}</small>{hint && <em className="dashboard-stat__hint">{hint}</em>}</span>
    </div>
  );
}

function RiderOrderCard({ order, onAdvance }: { order: DeliveryOrder; onAdvance: (order: DeliveryOrder) => void }) {
  const action = NEXT_ACTION[order.status];
  return (
    <article className="ops-order-row">
      <div className="ops-order-row__id">
        <strong>{order.reference}</strong>
        <span>{order.customer}</span>
        {order.phone && <small><Phone size={10} /> {order.phone}</small>}
      </div>
      <div className="ops-order-row__items">
        <span>{order.items}</span>
        <small><MapPin size={10} /> {order.address}</small>
        {order.total !== undefined && <small className="ops-order-row__price">₱{order.total.toLocaleString()}</small>}
      </div>
      <div className="ops-order-row__when">
        <span><CalendarDays size={12} /> {order.eta}</span>
        <small>Placed {order.placedAt}</small>
        {order.paymentMethod && <small>{order.paymentMethod}</small>}
      </div>
      <div className="ops-order-row__rider">
        {order.timeline && order.timeline.length > 0 ? (
          <small className="rider-card__order">
            <CheckCheck size={10} /> {order.timeline[order.timeline.length - 1].status} · {order.timeline[order.timeline.length - 1].at}
          </small>
        ) : (
          <small className="rider-card__order">No updates yet</small>
        )}
      </div>
      <div className="ops-order-row__status">
        <span className="ops-order-row__pill"><StatusPill status={order.status} /></span>
      </div>
      <div className="ops-order-row__action">
        {action ? (
          <button className="button button--red" onClick={() => onAdvance(order)} type="button">
            <CheckCheck size={14} /> {action}
          </button>
        ) : (
          <small className="dashboard-count">
            {order.status === "Delivered" ? "Completed" : "Waiting for kitchen"}
          </small>
        )}
      </div>
    </article>
  );
}
