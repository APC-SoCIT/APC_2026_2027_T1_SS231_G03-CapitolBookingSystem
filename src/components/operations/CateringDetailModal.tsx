import { useEffect, useMemo, useState } from "react";
import { Printer, X } from "lucide-react";
import { CATERING_PACKAGES } from "../../constants";
import type { CateringBooking, ReservationStatus } from "../../data/reservations";
import { RESERVATION_STATUSES } from "../../data/reservations";
import type { OrderItem } from "../../data/delivery";
import { StatusPill } from "./StatusPill";
import { OrderItemsEditor } from "./OrderItemsEditor";
import { buildCateringSlipHtml, openPrintWindow } from "../../utils/print";

type Tab = "overview" | "items" | "timeline";

type Props = {
  booking: CateringBooking;
  onClose: () => void;
  onSave: (updated: CateringBooking) => void;
};

function calcTotalsPacked(items: OrderItem[]) {
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  return { subtotal, total: subtotal };
}

export function CateringDetailModal({ booking, onClose, onSave }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [draft, setDraft] = useState<CateringBooking>(booking);
  const [statusDraft, setStatusDraft] = useState<ReservationStatus>(booking.status);
  const [items, setItems] = useState<OrderItem[]>(booking.itemsList ?? []);
  const buffPackage = CATERING_PACKAGES.find((p) => p.id === (draft.packageId ?? "pkg-1"));

  useEffect(() => {
    setDraft(booking);
    setItems(booking.itemsList ?? []);
    setStatusDraft(booking.status);
    setTab("overview");
  }, [booking]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const isBuffet = draft.kind === "catering_buffet";
  const isPacked = draft.kind === "catering_packed";

  const totals = useMemo(() => {
    if (isBuffet) {
      const pax = draft.pax ?? 50;
      const price = draft.pricePerPax ?? 350;
      const subtotal = pax * price;
      return { subtotal, total: subtotal };
    }
    return calcTotalsPacked(items);
  }, [draft.pax, draft.pricePerPax, isBuffet, items]);

  const hasChanges =
    JSON.stringify(draft) !== JSON.stringify(booking) ||
    JSON.stringify(items) !== JSON.stringify(booking.itemsList ?? []) ||
    statusDraft !== booking.status;

  const handleSave = () => {
    if (!draft.customer.trim()) {
      alert("Customer required");
      return;
    }
    if (isPacked && items.length === 0) {
      // allow inquiry with 0 items? but warn
    }
    const now = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const timeline = [...(draft.timeline ?? [])];
    if (statusDraft !== booking.status) timeline.push({ status: statusDraft, at: now });
    const patch: CateringBooking = {
      ...draft,
      status: statusDraft,
      timeline,
      subtotal: totals.subtotal,
      total: totals.total,
      guestCount: isBuffet ? draft.pax ?? 50 : items.reduce((s, i) => s + i.quantity, 0) || draft.guestCount,
      itemsList: isPacked ? items : undefined,
    };
    onSave(patch);
  };

  const handlePrint = () => {
    const html = buildCateringSlipHtml({
      ...draft,
      status: statusDraft,
      subtotal: totals.subtotal,
      total: totals.total,
      guestCount: isBuffet ? draft.pax : items.reduce((s, i) => s + i.quantity, 0),
      itemsList: items,
    });
    openPrintWindow(html, `${draft.id} – Catering`);
  };

  return (
    <div className="ops-modal-backdrop" onClick={onClose}>
      <div className="ops-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="ops-modal__header">
          <div>
            <span className="ops-modal__kicker">{isBuffet ? "Buffet catering" : "Packed meals"}</span>
            <div className="ops-modal__title-row">
              <h2>{booking.id}</h2>
              <StatusPill status={statusDraft} />
            </div>
            <small className="ops-modal__subtitle">{isBuffet ? `${draft.packageName} · ${draft.pax} pax` : `${items.length} items`} · {draft.date} {draft.time}</small>
          </div>
          <button type="button" className="ops-modal__close" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="ops-modal__tabs">
          <button className={`ops-tab ${tab === "overview" ? "ops-tab--active" : ""}`} onClick={() => setTab("overview")}>Overview</button>
          <button className={`ops-tab ${tab === "items" ? "ops-tab--active" : ""}`} onClick={() => setTab("items")}>Items <span className="ops-tab__badge">{isBuffet ? 1 : items.length}</span></button>
          <button className={`ops-tab ${tab === "timeline" ? "ops-tab--active" : ""}`} onClick={() => setTab("timeline")}>Timeline</button>
          <button type="button" className="ops-tab ops-tab--print" onClick={handlePrint}><Printer size={14} /> Print slip</button>
        </div>
        <div className="ops-modal__body">
          {tab === "overview" && (
            <div className="ops-form-grid">
              <label className="ops-field"><span>Customer *</span><input className="ops-input" value={draft.customer} onChange={(e) => setDraft(d=>({...d,customer:e.target.value}))} /></label>
              <label className="ops-field"><span>Phone</span><input className="ops-input" value={draft.phone} onChange={(e)=>setDraft(d=>({...d,phone:e.target.value}))} /></label>
              <label className="ops-field ops-field--full"><span>Email</span><input className="ops-input" value={draft.email} onChange={(e)=>setDraft(d=>({...d,email:e.target.value}))} /></label>
              <label className="ops-field"><span>Date (YYYY-MM-DD)</span><input className="ops-input" value={draft.date} onChange={(e)=>setDraft(d=>({...d,date:e.target.value}))} /></label>
              <label className="ops-field"><span>Time</span><input className="ops-input" value={draft.time} onChange={(e)=>setDraft(d=>({...d,time:e.target.value}))} /></label>
              <label className="ops-field"><span>Status</span>
                <select className="ops-input" value={statusDraft} onChange={(e)=>setStatusDraft(e.target.value as ReservationStatus)}>
                  {RESERVATION_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="ops-field"><span>Kind</span>
                <select className="ops-input" value={draft.kind} onChange={(e)=>setDraft(d=>({...d,kind:e.target.value as CateringBooking["kind"]}))}>
                  <option value="catering_buffet">Buffet</option>
                  <option value="catering_packed">Packed meals</option>
                </select>
              </label>
              <label className="ops-field ops-field--full"><span>Notes</span><textarea className="ops-input ops-input--area" rows={2} value={draft.notes} onChange={(e)=>setDraft(d=>({...d,notes:e.target.value}))} /></label>
              {isBuffet && (
                <>
                  <label className="ops-field"><span>Package</span>
                    <select className="ops-input" value={draft.packageId} onChange={(e)=>{
                      const pkg = CATERING_PACKAGES.find(p=>p.id===e.target.value)!;
                      setDraft(d=>({...d,packageId:pkg.id,packageName:pkg.name,pricePerPax:pkg.pricePerPax,pax:d.pax ?? pkg.minPax}));
                    }}>
                      {CATERING_PACKAGES.map(p=><option key={p.id} value={p.id}>{p.name} — ₱{p.pricePerPax}/pax</option>)}
                    </select>
                  </label>
                  <label className="ops-field"><span>Pax</span><input type="number" min={10} step={10} className="ops-input" value={draft.pax ?? 50} onChange={(e)=>setDraft(d=>({...d,pax:Math.max(10, Number(e.target.value)||10)}))} /></label>
                  <label className="ops-field"><span>₱/pax</span><input type="number" className="ops-input" value={draft.pricePerPax ?? buffPackage?.pricePerPax ?? 350} onChange={(e)=>setDraft(d=>({...d,pricePerPax:Number(e.target.value)||0}))} /></label>
                  <div className="ops-field"><span>Total</span><strong className="ops-price">₱{totals.total.toLocaleString()}</strong></div>
                </>
              )}
              {isPacked && (
                <div className="ops-field ops-field--full"><span>Packed total</span><strong className="ops-price">₱{totals.total.toLocaleString()} · {items.reduce((s,i)=>s+i.quantity,0)} orders</strong></div>
              )}
            </div>
          )}
          {tab === "items" && (
            isBuffet ? (
              <div>
                <p className="ops-tab-intro">Buffet package details. Change package or pax; total updates without delivery fee.</p>
                <div className="ops-form-grid">
                  <label className="ops-field"><span>Package</span>
                    <select className="ops-input" value={draft.packageId} onChange={(e)=>{
                      const pkg=CATERING_PACKAGES.find(p=>p.id===e.target.value)!;
                      setDraft(d=>({...d,packageId:pkg.id,packageName:pkg.name,pricePerPax:pkg.pricePerPax}));
                    }}>
                      {CATERING_PACKAGES.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </label>
                  <label className="ops-field"><span>Pax</span><input type="number" className="ops-input" value={draft.pax ?? 50} onChange={(e)=>setDraft(d=>({...d,pax:Number(e.target.value)||50}))} /></label>
                  <label className="ops-field"><span>Price per pax</span><input type="number" className="ops-input" value={draft.pricePerPax ?? 0} onChange={(e)=>setDraft(d=>({...d,pricePerPax:Number(e.target.value)||0}))} /></label>
                  <div className="ops-totals-preview"><div className="ops-totals-preview__row ops-totals-preview__row--grand"><span>Buffet total</span><strong>₱{totals.total.toLocaleString()}</strong></div></div>
                </div>
              </div>
            ) : (
              <div>
                <p className="ops-tab-intro">Packed meals for this catering booking. Add dishes like delivery orders. No delivery fee.</p>
                <OrderItemsEditor items={items} onChange={setItems} />
                <div className="ops-totals-preview"><div className="ops-totals-preview__row"><span>Subtotal</span><strong>₱{totals.subtotal.toLocaleString()}</strong></div><div className="ops-totals-preview__row ops-totals-preview__row--grand"><span>Total</span><strong>₱{totals.total.toLocaleString()}</strong></div></div>
              </div>
            )
          )}
          {tab === "timeline" && (
            <div className="ops-timeline">
              {(draft.timeline ?? [{status:draft.status, at:draft.placedAt}]).map((ev,i)=>(
                <div key={`${ev.status}-${ev.at}-${i}`} className={`ops-timeline__row ${ev.status===statusDraft?"ops-timeline__row--current":""}`}><span className="ops-timeline__dot">○</span><div><strong>{ev.status}</strong><small>{ev.at}</small></div></div>
              ))}
            </div>
          )}
        </div>
        <footer className="ops-modal__footer">
          <button type="button" className="ops-btn ops-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="ops-btn ops-btn--primary" onClick={handleSave} disabled={!hasChanges}>Save changes</button>
        </footer>
      </div>
    </div>
  );
}
