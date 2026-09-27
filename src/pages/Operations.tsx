import {
  Building2,
  CalendarDays,
  ClipboardList,
  Eye,
  Inbox,
  Pencil,
  RefreshCw,
  Search,
  Truck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  getDeliveryOrders,
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
import {
  getCateringBookings,
  getFunctionBookings,
  RESERVATION_STATUSES,
  saveCateringBookings,
  saveFunctionBookings,
  type CateringBooking,
  type FunctionBooking,
  type ReservationStatus,
} from "../data/reservations";
import { OrderDetailModal } from "../components/operations/OrderDetailModal";
import { FunctionDetailModal } from "../components/operations/FunctionDetailModal";
import { CateringDetailModal } from "../components/operations/CateringDetailModal";
import { StatusPill } from "../components/operations/StatusPill";

type ResFilter = ReservationStatus | "All";

export function Operations() {
  const [functionBookings, setFunctionBookings] = useState<FunctionBooking[]>(getFunctionBookings);
  const [cateringBookings, setCateringBookings] = useState<CateringBooking[]>(getCateringBookings);
  const [inquiries, setInquiries] = useState<Inquiry[]>(getInquiries);
  // Orders are read-only here — status/assignment work lives in the Delivery tab.
  const [orders, setOrders] = useState<DeliveryOrder[]>(getDeliveryOrders);
  const [functionSearch, setFunctionSearch] = useState("");
  const [cateringSearch, setCateringSearch] = useState("");
  const [functionFilter, setFunctionFilter] = useState<ResFilter>("All");
  const [cateringFilter, setCateringFilter] = useState<ResFilter>("All");
  const [cateringKindFilter, setCateringKindFilter] = useState<"All" | "Buffet" | "Packed">("All");
  const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null);
  const [selectedCateringId, setSelectedCateringId] = useState<string | null>(null);

  const refreshDashboard = () => {
    setOrders(getDeliveryOrders());
    setFunctionBookings(getFunctionBookings());
    setCateringBookings(getCateringBookings());
    setInquiries(getInquiries());
  };

  const updateFunctionStatus = (id: string, status: ReservationStatus) => {
    const now = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const next = functionBookings.map((b) =>
      b.id === id ? { ...b, status, timeline: [...(b.timeline ?? []), { status, at: now }] } : b,
    );
    setFunctionBookings(next);
    saveFunctionBookings(next);
  };
  const updateCateringStatus = (id: string, status: ReservationStatus) => {
    const now = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const next = cateringBookings.map((b) =>
      b.id === id ? { ...b, status, timeline: [...(b.timeline ?? []), { status, at: now }] } : b,
    );
    setCateringBookings(next);
    saveCateringBookings(next);
  };
  const handleFunctionSave = (updated: FunctionBooking) => {
    const next = functionBookings.map((b) => (b.id === updated.id ? updated : b));
    setFunctionBookings(next);
    saveFunctionBookings(next);
    setSelectedFunctionId(null);
  };
  const handleCateringSave = (updated: CateringBooking) => {
    const next = cateringBookings.map((b) => (b.id === updated.id ? updated : b));
    setCateringBookings(next);
    saveCateringBookings(next);
    setSelectedCateringId(null);
  };

  const updateInquiryStatus = (id: string, status: InquiryStatus) => {
    const updatedInquiries = inquiries.map((inquiry) =>
      inquiry.id === id ? { ...inquiry, status } : inquiry,
    );
    setInquiries(updatedInquiries);
    saveInquiries(updatedInquiries);
  };

  const filteredFunction = useMemo(() => {
    let list = functionBookings;
    if (functionFilter !== "All") list = list.filter((b) => b.status === functionFilter);
    const q = functionSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => [b.id, b.customer, b.email, b.phone, b.eventType, b.status].join(" ").toLowerCase().includes(q));
  }, [functionBookings, functionFilter, functionSearch]);

  const filteredCatering = useMemo(() => {
    let list = cateringBookings;
    if (cateringFilter !== "All") list = list.filter((b) => b.status === cateringFilter);
    if (cateringKindFilter !== "All") {
      const kind = cateringKindFilter === "Buffet" ? "catering_buffet" : "catering_packed";
      list = list.filter((b) => b.kind === kind);
    }
    const q = cateringSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => [b.id, b.customer, b.phone, b.email, b.packageName ?? "", b.status].join(" ").toLowerCase().includes(q));
  }, [cateringBookings, cateringFilter, cateringKindFilter, cateringSearch]);

  const selectedFunction = useMemo(
    () => (selectedFunctionId ? functionBookings.find((b) => b.id === selectedFunctionId) ?? null : null),
    [functionBookings, selectedFunctionId],
  );
  const selectedCatering = useMemo(
    () => (selectedCateringId ? cateringBookings.find((b) => b.id === selectedCateringId) ?? null : null),
    [cateringBookings, selectedCateringId],
  );

  const newInquiryCount = inquiries.filter((inquiry) => inquiry.status === "New").length;
  const activeDeliveryCount = orders.filter((order) => order.status !== "Delivered").length;
  const revenueToday = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const functionPending = functionBookings.filter((b) => b.status === "Pending").length;
  const cateringPending = cateringBookings.filter((b) => b.status === "Pending").length;

  return (
    <div>
      <section className="section dashboard-section">
        <div className="dashboard-toolbar">
          <div>
            <p className="eyebrow">Capitol Restaurant</p>
            <h2>Today&apos;s overview</h2>
            <small className="ops-toolbar-hint">Tip: click a row to change package or booking info · Print via modal · 1 sheet A4 portrait</small>
          </div>
          <button className="reset-button" onClick={refreshDashboard} type="button">
            <RefreshCw size={15} />
            Refresh data
          </button>
        </div>

        <div className="dashboard-stats dashboard-stats--5">
          <StatCard icon={<Truck size={20} />} label="Active deliveries" value={activeDeliveryCount} hint="Not delivered" />
          <StatCard icon={<Building2 size={20} />} label="Function pending" value={functionPending} hint={`${functionBookings.length} total bookings`} accent={functionPending>0} />
          <StatCard icon={<UtensilsCrossed size={20} />} label="Catering pending" value={cateringPending} hint={`${cateringBookings.length} total`} accent={cateringPending>0} />
          <StatCard icon={<Inbox size={20} />} label="New inquiries" value={newInquiryCount} hint="Need reply" accent={newInquiryCount > 0} />
          <StatCard icon={<ClipboardList size={20} />} label="Total orders" value={orders.length} hint={revenueToday ? `₱${revenueToday.toLocaleString()} total` : undefined} />
        </div>

        {/* Function room reservations — stacked */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <p className="eyebrow">Reservations · Private Dining Room</p>
              <h2>Function room bookings</h2>
            </div>
            <label className="dashboard-search">
              <Search size={16} />
              <input aria-label="Search function bookings" placeholder="Search name, event, ref..." value={functionSearch} onChange={(e) => setFunctionSearch(e.target.value)} />
            </label>
          </div>
          <div className="ops-filter-row">
            <button className={`ops-filter-chip ${functionFilter === "All" ? "ops-filter-chip--active" : ""}`} onClick={() => setFunctionFilter("All")} type="button">All <span>{functionBookings.length}</span></button>
            {RESERVATION_STATUSES.map((s) => {
              const count = functionBookings.filter((b) => b.status === s).length;
              return <button key={s} className={`ops-filter-chip ops-filter-chip--${s.toLowerCase()} ${functionFilter===s?"ops-filter-chip--active":""}`} onClick={()=>setFunctionFilter(s)} type="button">{s} <span>{count}</span></button>
            })}
          </div>
          <div className="ops-table-head ops-table-head--booking">
            <span>Booking</span><span>Guest / Event</span><span>When</span><span>Status</span><span className="ops-table-head__action">Action</span>
          </div>
          <div className="dashboard-orders">
            {filteredFunction.length ? filteredFunction.map((b)=> (
              <FunctionRow key={b.id} booking={b} onOpen={()=>setSelectedFunctionId(b.id)} onStatusChange={updateFunctionStatus} />
            )) : <EmptyDashboardState message="No function bookings match your filters." />}
          </div>
        </div>

        {/* Catering reservations — stacked */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <p className="eyebrow">Reservations · Catering</p>
              <h2>Catering bookings</h2>
            </div>
            <label className="dashboard-search">
              <Search size={16} />
              <input aria-label="Search catering bookings" placeholder="Search name, package, ref..." value={cateringSearch} onChange={(e)=>setCateringSearch(e.target.value)} />
            </label>
          </div>
          <div className="ops-filter-row">
            <button className={`ops-filter-chip ${cateringFilter === "All" ? "ops-filter-chip--active" : ""}`} onClick={() => setCateringFilter("All")} type="button">All <span>{cateringBookings.length}</span></button>
            {RESERVATION_STATUSES.map((s) => {
              const count = cateringBookings.filter((b) => b.status === s).length;
              return <button key={s} className={`ops-filter-chip ops-filter-chip--${s.toLowerCase()} ${cateringFilter===s?"ops-filter-chip--active":""}`} onClick={()=>setCateringFilter(s)} type="button">{s} <span>{count}</span></button>
            })}
            <span className="ops-filter-sep" />
            <button className={`ops-filter-chip ${cateringKindFilter==="All"?"ops-filter-chip--active":""}`} onClick={()=>setCateringKindFilter("All")} type="button">All kinds</button>
            <button className={`ops-filter-chip ${cateringKindFilter==="Buffet"?"ops-filter-chip--active":""}`} onClick={()=>setCateringKindFilter("Buffet")} type="button">Buffet</button>
            <button className={`ops-filter-chip ${cateringKindFilter==="Packed"?"ops-filter-chip--active":""}`} onClick={()=>setCateringKindFilter("Packed")} type="button">Packed</button>
          </div>
          <div className="ops-table-head ops-table-head--booking">
            <span>Booking</span><span>Package / Items</span><span>When</span><span>Status</span><span className="ops-table-head__action">Action</span>
          </div>
          <div className="dashboard-orders">
            {filteredCatering.length ? filteredCatering.map((b)=> (
              <CateringRow key={b.id} booking={b} onOpen={()=>setSelectedCateringId(b.id)} onStatusChange={updateCateringStatus} />
            )) : <EmptyDashboardState message="No catering bookings match your filters." />}
          </div>
        </div>

        {/* Inquiries */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <p className="eyebrow">Customer communication</p>
              <h2>Inquiries</h2>
            </div>
            <span className="dashboard-count">{inquiries.length} total</span>
          </div>
          <div className="dashboard-inquiries">
            {inquiries.length > 0 ? inquiries.map((inquiry) => (
              <InquiryRow inquiry={inquiry} key={inquiry.id} onStatusChange={updateInquiryStatus} />
            )) : <EmptyDashboardState message="No inquiries have been submitted yet." />}
          </div>
        </div>
      </section>

      {selectedFunction && <FunctionDetailModal booking={selectedFunction} onClose={()=>setSelectedFunctionId(null)} onSave={handleFunctionSave} />}
      {selectedCatering && <CateringDetailModal booking={selectedCatering} onClose={()=>setSelectedCateringId(null)} onSave={handleCateringSave} />}
    </div>
  );
}

function StatCard({ icon, label, value, hint, accent }: { icon: React.ReactNode; label: string; value: number; hint?: string; accent?: boolean }) {
  return (
    <div className={`dashboard-stat ${accent ? "dashboard-stat--accent" : ""}`}>
      <span className="dashboard-stat__icon">{icon}</span>
      <span><strong>{value}</strong><small>{label}</small>{hint && <em className="dashboard-stat__hint">{hint}</em>}</span>
    </div>
  );
}

function FunctionRow({ booking, onOpen, onStatusChange }: { booking: FunctionBooking; onOpen: () => void; onStatusChange: (id: string, s: ReservationStatus) => void }) {
  return (
    <article className="ops-order-row" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e)=>e.key==="Enter" && onOpen()}>
      <div className="ops-order-row__id"><strong>{booking.id}</strong><span>{booking.customer}</span><small>{booking.phone}</small></div>
      <div className="ops-order-row__items"><span>{booking.eventType} · {booking.guests} guests</span><small><Building2 size={10}/> {booking.room}</small><small style={{color:"#af0100"}}><Users size={10}/> {booking.email}</small></div>
      <div className="ops-order-row__when"><span><CalendarDays size={12}/> {booking.date} {booking.time}</span><small>Placed {booking.placedAt}</small></div>
      <div className="ops-order-row__status" onClick={(e)=>e.stopPropagation()}>
        <select className={`ops-status-select ops-status-select--${booking.status.toLowerCase()}`} value={booking.status} onChange={(e)=>onStatusChange(booking.id, e.target.value as ReservationStatus)}>
          {RESERVATION_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <span className="ops-order-row__pill"><StatusPill status={booking.status as unknown as DeliveryStatus} /></span>
      </div>
      <div className="ops-order-row__action"><span className="ops-row-action"><Eye size={14}/> View</span><span className="ops-row-action ops-row-action--edit"><Pencil size={12}/> Edit</span></div>
    </article>
  );
}

function CateringRow({ booking, onOpen, onStatusChange }: { booking: CateringBooking; onOpen: () => void; onStatusChange: (id: string, s: ReservationStatus) => void }) {
  const kindLabel = booking.kind === "catering_buffet" ? `Buffet · ${booking.packageName} · ${booking.pax} pax` : `Packed · ${booking.itemsList?.length ?? 0} items · ${booking.guestCount ?? 0} guests`;
  const price = booking.total ? `₱${booking.total.toLocaleString()}` : "—";
  return (
    <article className="ops-order-row" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e)=>e.key==="Enter"&&onOpen()}>
      <div className="ops-order-row__id"><strong>{booking.id}</strong><span>{booking.customer}</span><small>{booking.phone}</small></div>
      <div className="ops-order-row__items"><span>{kindLabel}</span><small><UtensilsCrossed size={10}/> {booking.kind === "catering_buffet" ? `₱${booking.pricePerPax}/pax` : `${booking.itemsList?.map(i=>i.name).join(", ") || "Inquiry"}`}</small><small className="ops-order-row__price">{price}</small></div>
      <div className="ops-order-row__when"><span><CalendarDays size={12}/> {booking.date} {booking.time}</span><small>Placed {booking.placedAt}</small></div>
      <div className="ops-order-row__status" onClick={(e)=>e.stopPropagation()}>
        <select className={`ops-status-select ops-status-select--${booking.status.toLowerCase()}`} value={booking.status} onChange={(e)=>onStatusChange(booking.id, e.target.value as ReservationStatus)}>
          {RESERVATION_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <span className="ops-order-row__pill"><StatusPill status={booking.status as unknown as DeliveryStatus} /></span>
      </div>
      <div className="ops-order-row__action"><span className="ops-row-action"><Eye size={14}/> View</span><span className="ops-row-action ops-row-action--edit"><Pencil size={12}/> Edit</span></div>
    </article>
  );
}

function InquiryRow({ inquiry, onStatusChange }: { inquiry: Inquiry; onStatusChange: (id: string, status: InquiryStatus) => void }) {
  return (
    <article className="dashboard-inquiry-row">
      <div className="dashboard-row__identity"><strong>{inquiry.name}</strong><span>{inquiry.email}</span></div>
      <div className="dashboard-row__details"><span>{inquiry.type}</span><small>{inquiry.message}</small></div>
      <select className={`dashboard-status dashboard-status--${inquiry.status.toLowerCase().replaceAll(" ", "-")}`} value={inquiry.status} onChange={(event) => onStatusChange(inquiry.id, event.target.value as InquiryStatus)}>
        {INQUIRY_STATUSES.map((status) => <option key={status}>{status}</option>)}
      </select>
    </article>
  );
}

function EmptyDashboardState({ message }: { message: string }) {
  return <p className="dashboard-empty">{message}</p>;
}
