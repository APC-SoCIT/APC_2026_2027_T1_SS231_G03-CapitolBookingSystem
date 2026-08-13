import { ClipboardList, Inbox, RefreshCw, Search, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  DELIVERY_STATUSES,
  getDeliveryOrders,
  saveDeliveryOrders,
  type DeliveryOrder,
  type DeliveryStatus,
} from "../data/delivery";
import {
  getInquiries,
  INQUIRY_STATUSES,
  saveInquiries,
  type Inquiry,
  type InquiryStatus,
} from "../data/inquiries";

export function Operations() {
  const [orders, setOrders] = useState<DeliveryOrder[]>(getDeliveryOrders);
  const [inquiries, setInquiries] = useState<Inquiry[]>(getInquiries);
  const [search, setSearch] = useState("");

  const refreshDashboard = () => {
    setOrders(getDeliveryOrders());
    setInquiries(getInquiries());
  };

  const updateOrderStatus = (reference: string, status: DeliveryStatus) => {
    const updatedOrders = orders.map((order) =>
      order.reference === reference ? { ...order, status } : order,
    );

    setOrders(updatedOrders);
    saveDeliveryOrders(updatedOrders);
  };

  const updateInquiryStatus = (id: string, status: InquiryStatus) => {
    const updatedInquiries = inquiries.map((inquiry) =>
      inquiry.id === id ? { ...inquiry, status } : inquiry,
    );

    setInquiries(updatedInquiries);
    saveInquiries(updatedInquiries);
  };

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;

    return orders.filter((order) =>
      [order.reference, order.customer, order.address, order.status]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [orders, search]);

  const newInquiryCount = inquiries.filter(
    (inquiry) => inquiry.status === "New",
  ).length;
  const activeDeliveryCount = orders.filter(
    (order) => order.status !== "Delivered",
  ).length;

  return (
    <div>
      <section className="page-hero dashboard-hero">
        <p className="eyebrow">Staff workspace</p>
        <h1>Operations</h1>
        <p>Review delivery orders and respond to customer inquiries.</p>
      </section>

      <section className="section dashboard-section">
        <div className="dashboard-toolbar">
          <div>
            <p className="eyebrow">Capitol Restaurant</p>
            <h2>Today&apos;s overview</h2>
          </div>
          <button
            className="reset-button"
            onClick={refreshDashboard}
            type="button"
          >
            <RefreshCw size={15} />
            Refresh data
          </button>
        </div>

        <div className="dashboard-stats">
          <StatCard
            icon={<Truck size={20} />}
            label="Active deliveries"
            value={activeDeliveryCount}
          />
          <StatCard
            icon={<Inbox size={20} />}
            label="New inquiries"
            value={newInquiryCount}
          />
          <StatCard
            icon={<ClipboardList size={20} />}
            label="Total orders"
            value={orders.length}
          />
        </div>

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
                placeholder="Search orders"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="dashboard-orders">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <DeliveryRow
                  key={order.reference}
                  order={order}
                  onStatusChange={updateOrderStatus}
                />
              ))
            ) : (
              <EmptyDashboardState message="No delivery orders match your search." />
            )}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <p className="eyebrow">Customer communication</p>
              <h2>Inquiries</h2>
            </div>
            <span className="dashboard-count">{inquiries.length} total</span>
          </div>

          <div className="dashboard-inquiries">
            {inquiries.length > 0 ? (
              inquiries.map((inquiry) => (
                <InquiryRow
                  inquiry={inquiry}
                  key={inquiry.id}
                  onStatusChange={updateInquiryStatus}
                />
              ))
            ) : (
              <EmptyDashboardState message="No inquiries have been submitted yet." />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="dashboard-stat">
      <span className="dashboard-stat__icon">{icon}</span>
      <span>
        <strong>{value}</strong>
        <small>{label}</small>
      </span>
    </div>
  );
}

function DeliveryRow({
  order,
  onStatusChange,
}: {
  order: DeliveryOrder;
  onStatusChange: (reference: string, status: DeliveryStatus) => void;
}) {
  return (
    <article className="dashboard-order-row">
      <div className="dashboard-row__identity">
        <strong>{order.reference}</strong>
        <span>{order.customer}</span>
      </div>
      <div className="dashboard-row__details">
        <span>{order.items}</span>
        <small>{order.address}</small>
      </div>
      <select
        className={`dashboard-status dashboard-status--${order.status
          .toLowerCase()
          .replaceAll(" ", "-")}`}
        value={order.status}
        onChange={(event) =>
          onStatusChange(order.reference, event.target.value as DeliveryStatus)
        }
      >
        {DELIVERY_STATUSES.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
    </article>
  );
}

function InquiryRow({
  inquiry,
  onStatusChange,
}: {
  inquiry: Inquiry;
  onStatusChange: (id: string, status: InquiryStatus) => void;
}) {
  return (
    <article className="dashboard-inquiry-row">
      <div className="dashboard-row__identity">
        <strong>{inquiry.name}</strong>
        <span>{inquiry.email}</span>
      </div>
      <div className="dashboard-row__details">
        <span>{inquiry.type}</span>
        <small>{inquiry.message}</small>
      </div>
      <select
        className={`dashboard-status dashboard-status--${inquiry.status
          .toLowerCase()
          .replaceAll(" ", "-")}`}
        value={inquiry.status}
        onChange={(event) =>
          onStatusChange(inquiry.id, event.target.value as InquiryStatus)
        }
      >
        {INQUIRY_STATUSES.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
    </article>
  );
}

function EmptyDashboardState({ message }: { message: string }) {
  return <p className="dashboard-empty">{message}</p>;
}
