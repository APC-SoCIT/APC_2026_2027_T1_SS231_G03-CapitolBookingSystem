import { useEffect, useMemo, useState } from "react";
import { Printer, X } from "lucide-react";
import type { DeliveryOrder, DeliveryStatus, OrderItem } from "../../data/delivery";
import { DELIVERY_STATUSES, calculateOrderTotals, updateOrderWithHistory } from "../../data/delivery";
import { OrderItemsEditor } from "./OrderItemsEditor";
import { StatusPill } from "./StatusPill";
import { buildDeliverySlipHtml, openPrintWindow } from "../../utils/print";

type Tab = "overview" | "items" | "timeline";

type Props = {
  order: DeliveryOrder;
  onClose: () => void;
  onSave: (updated: DeliveryOrder) => void;
};

export function OrderDetailModal({ order, onClose, onSave }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [draft, setDraft] = useState<DeliveryOrder>(order);
  const [items, setItems] = useState<OrderItem[]>(order.itemsList ?? []);
  const [deliveryFeeDraft, setDeliveryFeeDraft] = useState<number>(order.deliveryFee ?? 60);
  const [statusDraft, setStatusDraft] = useState<DeliveryStatus>(order.status);

  // reset when order changes
  useEffect(() => {
    setDraft(order);
    setItems(order.itemsList ?? []);
    setDeliveryFeeDraft(order.deliveryFee ?? 60);
    setStatusDraft(order.status);
    setTab("overview");
  }, [order]);

  // lock scroll + Esc
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const totals = useMemo(() => calculateOrderTotals(items, deliveryFeeDraft), [items, deliveryFeeDraft]);

  const hasChanges =
    JSON.stringify(draft) !== JSON.stringify(order) ||
    JSON.stringify(items) !== JSON.stringify(order.itemsList ?? []) ||
    deliveryFeeDraft !== (order.deliveryFee ?? 60) ||
    statusDraft !== order.status;

  const handleSave = () => {
    if (items.length === 0) {
      alert("Add at least one package or packed meal before saving.");
      return;
    }
    if (!draft.customer.trim() || !draft.address.trim()) {
      alert("Customer name and delivery address are required.");
      return;
    }
    const patched: Partial<DeliveryOrder> = {
      customer: draft.customer,
      phone: draft.phone,
      address: draft.address,
      eta: draft.eta,
      paymentMethod: draft.paymentMethod,
      notes: draft.notes,
      itemsList: items,
      deliveryFee: totals.deliveryFee,
    };
    const updated = updateOrderWithHistory(draft, patched, statusDraft !== order.status ? statusDraft : undefined);
    // ensure totals are from calc
    updated.subtotal = totals.subtotal;
    updated.total = totals.total;
    updated.deliveryFee = totals.deliveryFee;
    onSave(updated);
  };

  const handlePrint = () => {
    const html = buildDeliverySlipHtml(
      { reference: draft.reference, customer: draft.customer, phone: draft.phone, address: draft.address, eta: draft.eta, status: statusDraft, paymentMethod: draft.paymentMethod, placedAt: draft.placedAt, notes: draft.notes },
      items,
      totals,
    );
    openPrintWindow(html, `${draft.reference} – Delivery`);
  };

  return (
    <div className="ops-modal-backdrop" onClick={onClose} role="presentation">
      <div className="ops-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Order ${order.reference}`}>
        <header className="ops-modal__header">
          <div className="ops-modal__header-left">
            <span className="ops-modal__kicker">Delivery order</span>
            <div className="ops-modal__title-row">
              <h2>{order.reference}</h2>
              <StatusPill status={statusDraft} />
            </div>
            <small className="ops-modal__subtitle">
              Placed {order.placedAt} · {order.customer}
            </small>
          </div>
          <button type="button" className="ops-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="ops-modal__tabs" role="tablist">
          <button role="tab" aria-selected={tab === "overview"} className={`ops-tab ${tab === "overview" ? "ops-tab--active" : ""}`} onClick={() => setTab("overview")}>
            Overview
          </button>
          <button role="tab" aria-selected={tab === "items"} className={`ops-tab ${tab === "items" ? "ops-tab--active" : ""}`} onClick={() => setTab("items")}>
            Items <span className="ops-tab__badge">{items.length}</span>
          </button>
          <button role="tab" aria-selected={tab === "timeline"} className={`ops-tab ${tab === "timeline" ? "ops-tab--active" : ""}`} onClick={() => setTab("timeline")}>
            Timeline
          </button>
          <button type="button" className="ops-tab ops-tab--print" onClick={handlePrint}>
            <Printer size={14} /> Print slip
          </button>
        </div>

        <div className="ops-modal__body">
          {tab === "overview" && (
            <div className="ops-overview">
              <div className="ops-form-grid">
                <label className="ops-field">
                  <span>Customer name *</span>
                  <input className="ops-input" value={draft.customer} onChange={(e) => setDraft((d) => ({ ...d, customer: e.target.value }))} />
                </label>
                <label className="ops-field">
                  <span>Contact number</span>
                  <input className="ops-input" placeholder="09XX XXX XXXX" value={draft.phone ?? ""} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
                </label>
                <label className="ops-field ops-field--full">
                  <span>Delivery address *</span>
                  <textarea className="ops-input ops-input--area" rows={2} value={draft.address} onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))} />
                </label>
                <label className="ops-field">
                  <span>ETA</span>
                  <input className="ops-input" placeholder="Today, 6:30 PM" value={draft.eta} onChange={(e) => setDraft((d) => ({ ...d, eta: e.target.value }))} />
                </label>
                <label className="ops-field">
                  <span>Status</span>
                  <select className="ops-input" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value as DeliveryStatus)}>
                    {DELIVERY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ops-field">
                  <span>Payment method</span>
                  <select className="ops-input" value={draft.paymentMethod ?? "Cash on delivery"} onChange={(e) => setDraft((d) => ({ ...d, paymentMethod: e.target.value }))}>
                    <option>Cash on delivery</option>
                    <option>GCash</option>
                    <option>Card</option>
                    <option>Bank transfer</option>
                  </select>
                </label>
                <label className="ops-field">
                  <span>Placed</span>
                  <input className="ops-input" value={draft.placedAt} readOnly />
                </label>
                <label className="ops-field ops-field--full">
                  <span>Notes (delivery instructions)</span>
                  <textarea className="ops-input ops-input--area" rows={2} placeholder="e.g. Leave at lobby, call on arrival" value={draft.notes ?? ""} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
                </label>
              </div>

              <div className="ops-totals-preview">
                <div className="ops-totals-preview__row">
                  <span>Subtotal</span>
                  <strong>₱{totals.subtotal.toLocaleString()}</strong>
                </div>
                <div className="ops-totals-preview__row">
                  <span>Delivery fee</span>
                  <strong>₱{totals.deliveryFee.toLocaleString()}</strong>
                </div>
                <div className="ops-totals-preview__row ops-totals-preview__row--grand">
                  <span>Total</span>
                  <strong>₱{totals.total.toLocaleString()}</strong>
                </div>
                <small className="ops-hint">Edit items to update totals automatically.</small>
              </div>
            </div>
          )}

          {tab === "items" && (
            <div className="ops-items-tab">
              <p className="ops-tab-intro">Change packages or packed meals when customer changes mind. Totals update instantly.</p>
              <OrderItemsEditor items={items} onChange={setItems} />
              <div className="ops-delivery-fee-row">
                <label className="ops-field ops-field--inline">
                  <span>Delivery fee (₱)</span>
                  <input type="number" min={0} className="ops-input ops-input--sm" value={deliveryFeeDraft} onChange={(e) => setDeliveryFeeDraft(Number(e.target.value) || 0)} />
                </label>
                <div className="ops-totals-compact">
                  <span>Subtotal ₱{totals.subtotal.toLocaleString()}</span>
                  <span>·</span>
                  <span>Fee ₱{totals.deliveryFee.toLocaleString()}</span>
                  <strong>Total ₱{totals.total.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          )}

          {tab === "timeline" && (
            <div className="ops-timeline">
              {(draft.timeline ?? [{ status: draft.status, at: draft.placedAt }]).map((ev, i, arr) => {
                const activeIdx = DELIVERY_STATUSES.indexOf(statusDraft);
                const evIdx = DELIVERY_STATUSES.indexOf(ev.status);
                const isCurrent = ev.status === statusDraft && i === arr.length - 1;
                const done = evIdx <= activeIdx;
                return (
                  <div key={`${ev.status}-${ev.at}-${i}`} className={`ops-timeline__row ${done ? "ops-timeline__row--done" : ""} ${isCurrent ? "ops-timeline__row--current" : ""}`}>
                    <span className="ops-timeline__dot">
                      {ev.status === "Delivered" ? "✓" : evIdx === 0 ? "◇" : "○"}
                    </span>
                    <div>
                      <strong>{ev.status}</strong>
                      <small>{ev.at}</small>
                    </div>
                  </div>
                );
              })}
              <p className="ops-hint">Timeline records every status change. Useful for audit and customer follow-up.</p>
            </div>
          )}
        </div>

        <footer className="ops-modal__footer">
          <button type="button" className="ops-btn ops-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="ops-btn ops-btn--primary" onClick={handleSave} disabled={!hasChanges}>
            Save changes
          </button>
        </footer>

        {/* Print-only slip (hidden on screen) */}
        <div className="ops-print-slip" aria-hidden="true">
          <div className="ops-print-slip__header">
            <div>
              <strong>Capitol Restaurant</strong>
              <span>Since 1940 · Pasay City</span>
            </div>
            <div className="ops-print-slip__ref">
              <span>Delivery slip</span>
              <strong>{draft.reference}</strong>
            </div>
          </div>
          <div className="ops-print-slip__grid">
            <div>
              <small>Deliver to</small>
              <strong>{draft.customer}</strong>
              <span>{draft.phone}</span>
              <span>{draft.address}</span>
            </div>
            <div>
              <small>Details</small>
              <span>ETA: {draft.eta}</span>
              <span>Status: {statusDraft}</span>
              <span>Payment: {draft.paymentMethod}</span>
              <span>Placed: {draft.placedAt}</span>
            </div>
          </div>
          <table className="ops-print-slip__table">
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: "right" }}>Qty / Pax</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "right" }}>Line total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>
                    {it.name} {it.type === "package" ? "(Package)" : `· ${it.category ?? ""}`}
                  </td>
                  <td style={{ textAlign: "right" }}>{it.type === "package" ? `${it.quantity} × ${it.pax} pax` : `${it.quantity}`}</td>
                  <td style={{ textAlign: "right" }}>₱{it.price.toLocaleString()}</td>
                  <td style={{ textAlign: "right" }}>
                    ₱{(it.type === "package" ? it.price * (it.pax ?? 50) * it.quantity : it.price * it.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: "right" }}>
                  Subtotal
                </td>
                <td style={{ textAlign: "right" }}>₱{totals.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ textAlign: "right" }}>
                  Delivery fee
                </td>
                <td style={{ textAlign: "right" }}>₱{totals.deliveryFee.toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ textAlign: "right" }}>
                  <strong>Total</strong>
                </td>
                <td style={{ textAlign: "right" }}>
                  <strong>₱{totals.total.toLocaleString()}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
          {draft.notes && (
            <p className="ops-print-slip__notes">
              <small>Notes:</small> {draft.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
