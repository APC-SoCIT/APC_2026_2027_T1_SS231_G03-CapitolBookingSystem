import { ChevronRight, RefreshCw, Truck } from "lucide-react";
import { useState } from "react";
import {
  DELIVERY_STATUSES,
  getDeliveryOrders,
  resetDeliveryOrders,
  saveDeliveryOrders,
  type DeliveryOrder,
  type DeliveryStatus,
} from "../data/delivery";

export function DeliveryStaff() {
  const [orders, setOrders] = useState(getDeliveryOrders);
  const [selected, setSelected] = useState<DeliveryOrder | null>(null);
  const updateStatus = (reference: string, status: DeliveryStatus) => {
    const next = orders.map((order) =>
      order.reference === reference ? { ...order, status } : order,
    );
    setOrders(next);
    saveDeliveryOrders(next);
    setSelected(next.find((order) => order.reference === reference) ?? null);
  };
  const reset = () => {
    resetDeliveryOrders();
    setOrders(getDeliveryOrders());
    setSelected(null);
  };
  return (
    <div>
      <section className="page-hero">
        <p className="eyebrow">Staff workspace</p>
        <h1>Delivery Operations</h1>
        <p>Review active orders and update their delivery status.</p>
      </section>
      <section className="section staff-section">
        <div className="staff-toolbar">
          <div>
            <p className="eyebrow">Staff dashboard</p>
            <h2>Active deliveries</h2>
          </div>
          <button className="reset-button" onClick={reset} type="button">
            <RefreshCw size={15} /> Reset order data
          </button>
        </div>
        <div className="staff-table">
          {orders.map((order) => (
            <button
              className={`staff-order ${selected?.reference === order.reference ? "staff-order--selected" : ""}`}
              key={order.reference}
              onClick={() => setSelected(order)}
              type="button"
            >
              <span className="staff-order__icon">
                <Truck size={18} />
              </span>
              <span className="staff-order__main">
                <strong>{order.reference}</strong>
                <small>
                  {order.customer} · {order.items}
                </small>
              </span>
              <span
                className={`status-pill status-pill--${order.status.toLowerCase().replaceAll(" ", "-")}`}
              >
                {order.status}
              </span>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
        {selected && (
          <div className="status-editor">
            <p className="eyebrow">Update order</p>
            <h2>
              {selected.reference} · {selected.customer}
            </h2>
            <p>
              Choose a new status. The customer tracking page will show the
              updated order progress.
            </p>
            <div className="status-options">
              {DELIVERY_STATUSES.map((status) => (
                <button
                  className={
                    selected.status === status
                      ? "status-option status-option--active"
                      : "status-option"
                  }
                  key={status}
                  onClick={() => updateStatus(selected.reference, status)}
                  type="button"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
