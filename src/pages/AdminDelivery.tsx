import {
  AlertCircle,
  Bike,
  Building2,
  CalendarDays,
  Eye,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  DELIVERY_STATUSES,
  getDeliveryOrders,
  getDeliveryRiders,
  resetDeliveryOrders,
  saveDeliveryOrders,
  saveDeliveryRiders,
  type DeliveryOrder,
  type DeliveryRider,
  type DeliveryStatus,
} from "../data/delivery";
import { OrderDetailModal } from "../components/operations/OrderDetailModal";
import { StatusPill } from "../components/operations/StatusPill";

type OrderFilter = DeliveryStatus | "All";
type RiderFilter = string; // "all" | "unassigned" | rider id

export function AdminDelivery() {
  const [orders, setOrders] = useState<DeliveryOrder[]>(getDeliveryOrders);
  const [riders, setRiders] = useState<DeliveryRider[]>(getDeliveryRiders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderFilter>("All");
  const [riderFilter, setRiderFilter] = useState<RiderFilter>("all");
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [newRiderName, setNewRiderName] = useState("");
  const [newRiderPhone, setNewRiderPhone] = useState("");
  const [riderError, setRiderError] = useState("");

  const refresh = () => {
    setOrders(getDeliveryOrders());
    setRiders(getDeliveryRiders());
  };

  const resetOrders = () => {
    resetDeliveryOrders();
    setOrders(getDeliveryOrders());
    setSelectedRef(null);
  };

  const updateOrderStatus = (reference: string, status: DeliveryStatus) => {
    const next = orders.map((order) =>
      order.reference === reference ? { ...order, status } : order,
    );
    setOrders(next);
    saveDeliveryOrders(next);
  };

  const assignRider = (reference: string, riderId: string | null) => {
    const next = orders.map((order) =>
      order.reference === reference
        ? { ...order, riderId: riderId ?? undefined }
        : order,
    );
    setOrders(next);
    saveDeliveryOrders(next);
  };

  const handleOrderSave = (updated: DeliveryOrder) => {
    const next = orders.map((o) => (o.reference === updated.reference ? updated : o));
    setOrders(next);
    saveDeliveryOrders(next);
    setSelectedRef(null);
  };

  const removeRider = (id: string) => {
    const nextRiders = riders.filter((rider) => rider.id !== id);
    setRiders(nextRiders);
    saveDeliveryRiders(nextRiders);
    // Unassign the rider from any orders still pointing at them.
    const nextOrders = orders.map((order) =>
      order.riderId === id ? { ...order, riderId: undefined } : order,
    );
    setOrders(nextOrders);
    saveDeliveryOrders(nextOrders);
  };

  const addRider = () => {
    const name = newRiderName.trim();
    if (!name) {
      setRiderError("Rider name is required");
      return;
    }
    if (riders.some((rider) => rider.name.toLowerCase() === name.toLowerCase())) {
      setRiderError("A rider with this name already exists");
      return;
    }
    const rider: DeliveryRider = {
      id: `rider-${Date.now()}`,
      name,
      phone: newRiderPhone.trim() || undefined,
    };
    const nextRiders = [...riders, rider];
    setRiders(nextRiders);
    saveDeliveryRiders(nextRiders);
    setNewRiderName("");
    setNewRiderPhone("");
    setRiderError("");
  };

  const riderById = useMemo(() => {
    const map = new Map<string, DeliveryRider>();
    riders.forEach((rider) => map.set(rider.id, rider));
    return map;
  }, [riders]);

  /** A rider is busy while any of their orders has not been delivered yet. */
  const activeCountByRider = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((order) => {
      if (order.riderId && order.status !== "Delivered") {
        counts.set(order.riderId, (counts.get(order.riderId) ?? 0) + 1);
      }
    });
    return counts;
  }, [orders, riders]);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (statusFilter !== "All") list = list.filter((o) => o.status === statusFilter);
    if (riderFilter === "unassigned") {
      list = list.filter((o) => !o.riderId);
    } else if (riderFilter !== "all") {
      list = list.filter((o) => o.riderId === riderFilter);
    }
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter((order) =>
      [
        order.reference,
        order.customer,
        order.address,
        order.status,
        order.phone ?? "",
        order.items,
        order.riderId ? riderById.get(order.riderId)?.name ?? "" : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [orders, search, statusFilter, riderFilter, riderById]);

  const selectedOrder = useMemo(
    () => (selectedRef ? orders.find((o) => o.reference === selectedRef) ?? null : null),
    [orders, selectedRef],
  );

  const availableRiders = riders.filter(
    (rider) => !(activeCountByRider.get(rider.id) ?? 0),
  ).length;

  return (
    <div>
      <section className="section dashboard-section">
        <div className="dashboard-toolbar">
          <div>
            <p className="eyebrow">Capitol Restaurant</p>
            <h2>Delivery</h2>
            <small className="ops-toolbar-hint">Riders and their delivery orders · Assign a rider per order · Status changes save instantly</small>
          </div>
          <div className="dashboard-toolbar__actions">
            <button className="reset-button" onClick={resetOrders} type="button">
              <RefreshCw size={15} />
              Reset order data
            </button>
            <button className="reset-button" onClick={refresh} type="button">
              <RefreshCw size={15} />
              Refresh data
            </button>
          </div>
        </div>

        {/* Riders */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <p className="eyebrow">Fleet</p>
              <h2>Delivery riders</h2>
            </div>
            <span className="dashboard-count">
              {availableRiders} of {riders.length} available
            </span>
          </div>

          <div className="riders-grid">
            {riders.map((rider) => {
              const active = activeCountByRider.get(rider.id) ?? 0;
              const assignedOrder = orders.find(
                (order) => order.riderId === rider.id && order.status !== "Delivered",
              );
              return (
                <article className="rider-card" key={rider.id}>
                  <span className="rider-card__avatar">
                    <Bike size={18} />
                  </span>
                  <div className="rider-card__info">
                    <strong>{rider.name}</strong>
                    {rider.phone && <small>{rider.phone}</small>}
                    {assignedOrder ? (
                      <small className="rider-card__order">
                        <Building2 size={10} /> {assignedOrder.reference} · {assignedOrder.customer}
                      </small>
                    ) : (
                      <small className="rider-card__order">No active delivery</small>
                    )}
                  </div>
                  <span className={`ops-rider-pill ${active ? "ops-rider-pill--busy" : "ops-rider-pill--available"}`}>
                    {active ? `Busy · ${active} order${active === 1 ? "" : "s"}` : "Available"}
                  </span>
                  <button
                    aria-label={`Remove rider ${rider.name}`}
                    className="rider-card__remove"
                    onClick={() => removeRider(rider.id)}
                    title="Remove rider (unassigns their orders)"
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </article>
              );
            })}
            {riders.length === 0 && (
              <p className="dashboard-empty">No riders yet. Add one below.</p>
            )}
          </div>

          <div className="ops-panel-footer rider-add-row">
            <input
              aria-label="Rider name"
              className="input"
              placeholder="Rider name"
              value={newRiderName}
              onChange={(event) => {
                setNewRiderName(event.target.value);
                setRiderError("");
              }}
            />
            <input
              aria-label="Rider contact number"
              className="input"
              placeholder="Contact number"
              value={newRiderPhone}
              onChange={(event) => {
                setNewRiderPhone(event.target.value);
                setRiderError("");
              }}
            />
            <button className="button button--red rider-add-row__add" onClick={addRider} type="button">
              <Plus size={14} /> Add rider
            </button>
          </div>
          {riderError && <p className="field-error">{riderError}</p>}
        </div>

        {/* Delivery orders */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <p className="eyebrow">Order management</p>
              <h2>Delivery orders</h2>
            </div>
            <label className="dashboard-search">
              <Search size={16} />
              <input
                aria-label="Search delivery orders"
                placeholder="Search name, address, reference..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="ops-rider-filter">
              <select
                aria-label="Filter by rider"
                className="input"
                value={riderFilter}
                onChange={(event) => setRiderFilter(event.target.value)}
              >
                <option value="all">All riders</option>
                <option value="unassigned">Unassigned</option>
                {riders.map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {rider.name}
                  </option>
                ))}
              </select>
            </label>
            <Link className="ops-manage-menu-link" to="/delivery/items">
              <Settings size={14} /> Manage menu items
            </Link>
          </div>

          <div className="ops-filter-row">
            <button className={`ops-filter-chip ${statusFilter === "All" ? "ops-filter-chip--active" : ""}`} onClick={() => setStatusFilter("All")} type="button">All <span>{orders.length}</span></button>
            {DELIVERY_STATUSES.map((s) => {
              const count = orders.filter((o) => o.status === s).length;
              return (
                <button key={s} className={`ops-filter-chip ops-filter-chip--${s.toLowerCase().replaceAll(" ", "-")} ${statusFilter === s ? "ops-filter-chip--active" : ""}`} onClick={() => setStatusFilter(s)} type="button">{s} <span>{count}</span></button>
              );
            })}
          </div>

          <div className="ops-table-head">
            <span>Order</span><span>Items</span><span>When</span><span>Rider</span><span>Status</span><span className="ops-table-head__action">Action</span>
          </div>

          <div className="dashboard-orders">
            {filteredOrders.length > 0 ? filteredOrders.map((order) => (
              <DeliveryRow
                key={order.reference}
                order={order}
                riders={riders}
                onOpen={() => setSelectedRef(order.reference)}
                onStatusChange={updateOrderStatus}
                onAssignRider={assignRider}
              />
            )) : <EmptyState message="No delivery orders match your filters." />}
          </div>
          <div className="ops-panel-footer"><span><AlertCircle size={12} /> Click any row to edit packages, quantities, and totals. Changes save instantly with history.</span></div>
        </div>
      </section>

      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedRef(null)} onSave={handleOrderSave} />}
    </div>
  );
}

function DeliveryRow({
  order,
  riders,
  onOpen,
  onStatusChange,
  onAssignRider,
}: {
  order: DeliveryOrder;
  riders: DeliveryRider[];
  onOpen: () => void;
  onStatusChange: (reference: string, status: DeliveryStatus) => void;
  onAssignRider: (reference: string, riderId: string | null) => void;
}) {
  return (
    <article className="ops-order-row" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen()}>
      <div className="ops-order-row__id"><strong>{order.reference}</strong><span>{order.customer}</span>{order.phone && <small>{order.phone}</small>}</div>
      <div className="ops-order-row__items"><span>{order.items}</span><small><MapPin size={10} /> {order.address}</small>{order.total !== undefined && <small className="ops-order-row__price">₱{order.total.toLocaleString()}</small>}</div>
      <div className="ops-order-row__when"><span><CalendarDays size={12} /> {order.eta}</span><small>Placed {order.placedAt}</small></div>
      <div className="ops-order-row__rider" onClick={(e) => e.stopPropagation()}>
        <select
          className="input ops-rider-select"
          value={order.riderId ?? ""}
          onChange={(event) => onAssignRider(order.reference, event.target.value || null)}
          aria-label={`Assign rider for ${order.reference}`}
        >
          <option value="">Unassigned</option>
          {riders.map((rider) => (
            <option key={rider.id} value={rider.id}>{rider.name}</option>
          ))}
        </select>
      </div>
      <div className="ops-order-row__status" onClick={(e) => e.stopPropagation()}>
        <select className={`ops-status-select ops-status-select--${order.status.toLowerCase().replaceAll(" ", "-")}`} value={order.status} onChange={(event) => onStatusChange(order.reference, event.target.value as DeliveryStatus)} aria-label={`Change status for ${order.reference}`}>
          {DELIVERY_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <span className="ops-order-row__pill"><StatusPill status={order.status} /></span>
      </div>
      <div className="ops-order-row__action"><span className="ops-row-action"><Eye size={14} /> View</span><span className="ops-row-action ops-row-action--edit"><Pencil size={12} /> Edit</span></div>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="dashboard-empty">{message}</p>;
}
