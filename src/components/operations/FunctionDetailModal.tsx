import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";
import type { FunctionBooking, ReservationStatus } from "../../data/reservations";
import { RESERVATION_STATUSES } from "../../data/reservations";
import { StatusPill } from "./StatusPill";
import { buildFunctionSlipHtml, openPrintWindow } from "../../utils/print";

type Tab = "overview" | "timeline";

type Props = {
  booking: FunctionBooking;
  onClose: () => void;
  onSave: (updated: FunctionBooking) => void;
};

export function FunctionDetailModal({ booking, onClose, onSave }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [draft, setDraft] = useState<FunctionBooking>(booking);
  const [statusDraft, setStatusDraft] = useState<ReservationStatus>(booking.status);

  useEffect(() => {
    setDraft(booking);
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

  const hasChanges =
    JSON.stringify(draft) !== JSON.stringify(booking) || statusDraft !== booking.status;

  const handleSave = () => {
    if (!draft.customer.trim() || !draft.email.trim()) {
      alert("Customer name and email required.");
      return;
    }
    if (!draft.guests || draft.guests < 1) {
      alert("Guests must be at least 1.");
      return;
    }
    const now = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const timeline = [...(draft.timeline ?? [])];
    if (statusDraft !== booking.status) timeline.push({ status: statusDraft, at: now });
    onSave({ ...draft, status: statusDraft, timeline });
  };

  const handlePrint = () => {
    const html = buildFunctionSlipHtml({ ...draft, status: statusDraft });
    openPrintWindow(html, `${draft.id} – Function Room`);
  };

  return (
    <div className="ops-modal-backdrop" onClick={onClose}>
      <div className="ops-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="ops-modal__header">
          <div>
            <span className="ops-modal__kicker">Function room</span>
            <div className="ops-modal__title-row">
              <h2>{booking.id}</h2>
              <StatusPill status={statusDraft} />
            </div>
            <small className="ops-modal__subtitle">
              {draft.room} · {draft.eventType} · {draft.guests} guests
            </small>
          </div>
          <button type="button" className="ops-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="ops-modal__tabs">
          <button className={`ops-tab ${tab === "overview" ? "ops-tab--active" : ""}`} onClick={() => setTab("overview")}>Overview</button>
          <button className={`ops-tab ${tab === "timeline" ? "ops-tab--active" : ""}`} onClick={() => setTab("timeline")}>Timeline</button>
          <button type="button" className="ops-tab ops-tab--print" onClick={handlePrint}><Printer size={14} /> Print slip</button>
        </div>
        <div className="ops-modal__body">
          {tab === "overview" && (
            <div className="ops-form-grid">
              <label className="ops-field"><span>Customer *</span><input className="ops-input" value={draft.customer} onChange={(e) => setDraft(d => ({ ...d, customer: e.target.value }))} /></label>
              <label className="ops-field"><span>Phone</span><input className="ops-input" value={draft.phone} onChange={(e) => setDraft(d => ({ ...d, phone: e.target.value }))} /></label>
              <label className="ops-field"><span>Email *</span><input className="ops-input" value={draft.email} onChange={(e) => setDraft(d => ({ ...d, email: e.target.value }))} /></label>
              <label className="ops-field"><span>Guests *</span><input type="number" min={1} className="ops-input" value={draft.guests} onChange={(e) => setDraft(d => ({ ...d, guests: Math.max(1, Number(e.target.value) || 1) }))} /></label>
              <label className="ops-field"><span>Event type</span>
                <select className="ops-input" value={draft.eventType} onChange={(e) => setDraft(d => ({ ...d, eventType: e.target.value }))}>
                  <option>Birthday Celebration</option>
                  <option>Debut / 18th Birthday</option>
                  <option>Wedding Reception</option>
                  <option>Corporate Event</option>
                  <option>Family Reunion</option>
                  <option>Christmas Party</option>
                  <option>Seminar / Conference</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="ops-field"><span>Room</span><input className="ops-input" value={draft.room} readOnly /></label>
              <label className="ops-field"><span>Date (YYYY-MM-DD)</span><input className="ops-input" value={draft.date} onChange={(e) => setDraft(d => ({ ...d, date: e.target.value }))} /></label>
              <label className="ops-field"><span>Time</span><input className="ops-input" value={draft.time} onChange={(e) => setDraft(d => ({ ...d, time: e.target.value }))} /></label>
              <label className="ops-field"><span>Status</span>
                <select className="ops-input" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value as ReservationStatus)}>
                  {RESERVATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="ops-field"><span>Placed</span><input className="ops-input" value={draft.placedAt} readOnly /></label>
              <label className="ops-field ops-field--full"><span>Special requests</span><textarea className="ops-input ops-input--area" rows={2} value={draft.specialRequests} onChange={(e) => setDraft(d => ({ ...d, specialRequests: e.target.value }))} /></label>
            </div>
          )}
          {tab === "timeline" && (
            <div className="ops-timeline">
              {(draft.timeline ?? [{ status: draft.status, at: draft.placedAt }]).map((ev, i) => (
                <div key={`${ev.status}-${ev.at}-${i}`} className={`ops-timeline__row ${ev.status === statusDraft ? "ops-timeline__row--current" : ""}`}>
                  <span className="ops-timeline__dot">{ev.status === "Completed" ? "✓" : "○"}</span>
                  <div><strong>{ev.status}</strong><small>{ev.at}</small></div>
                </div>
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
