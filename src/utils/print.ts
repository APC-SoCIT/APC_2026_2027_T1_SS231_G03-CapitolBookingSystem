export function openPrintWindow(innerHtml: string, title = "Print") {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) {
    // popup blocked fallback to in-page print
    window.print();
    return;
  }
  const styles = `
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin:0; padding:0; font-family: Inter, ui-sans-serif, system-ui, sans-serif; color:#1a0a0a; background:#fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .ps-header { display:flex; justify-content:space-between; gap:1rem; padding-bottom:0.6rem; border-bottom:2px solid #640000; margin-bottom:0.75rem; }
    .ps-header strong { color:#640000; font-family: Georgia, serif; font-size:1.1rem; display:block; }
    .ps-header span, .ps-header small { display:block; color:#6a4a4a; font-size:0.7rem; }
    .ps-ref { text-align:right; }
    .ps-ref strong { font-size:1rem; }
    .ps-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:0.75rem; }
    .ps-grid small { display:block; color:#8a5a5a; font-size:0.65rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:0.2rem; }
    .ps-grid strong { display:block; color:#1a0a0a; font-size:0.85rem; }
    .ps-grid span { display:block; color:#3a0000; font-size:0.78rem; }
    table { width:100%; border-collapse:collapse; font-size:0.78rem; }
    th { text-align:left; padding:0.4rem 0.3rem; border-bottom:1.5px solid #640000; color:#640000; font-size:0.68rem; text-transform:uppercase; letter-spacing:0.06em; }
    td { padding:0.38rem 0.3rem; border-bottom:1px solid rgba(100,0,0,0.12); }
    tfoot td { border-top:1.5px solid #640000; font-weight:700; }
    .ps-notes { margin-top:0.6rem; padding:0.5rem 0.6rem; background: rgba(100,0,0,0.04); border-radius:6px; font-size:0.78rem; }
    .ps-footer { margin-top:0.8rem; text-align:center; color:#8a5a5a; font-size:0.68rem; border-top:1px solid rgba(100,0,0,0.1); padding-top:0.6rem; }
    .ps-kicker { color:#af0100; font-size:0.65rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; }
  `;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${styles}</style></head><body>${innerHtml}</body></html>`);
  w.document.close();
  w.focus();
  // wait for render
  setTimeout(() => {
    w.print();
    w.close();
  }, 300);
}

export function buildDeliverySlipHtml(draft: {
  reference: string;
  customer: string;
  phone?: string;
  address: string;
  eta: string;
  status: string;
  paymentMethod?: string;
  placedAt: string;
  notes?: string;
}, items: { name: string; type: string; category?: string; quantity: number; pax?: number; price: number }[], totals: { subtotal: number; deliveryFee: number; total: number }): string {
  const rows = items
    .map(
      (it) =>
        `<tr><td>${it.name} ${it.type === "package" ? "(Package)" : `· ${it.category ?? ""}`}</td><td style="text-align:right">${it.type === "package" ? `${it.quantity} × ${it.pax} pax` : `${it.quantity}`}</td><td style="text-align:right">₱${it.price.toLocaleString()}</td><td style="text-align:right">₱${(it.type === "package" ? it.price * (it.pax ?? 50) * it.quantity : it.price * it.quantity).toLocaleString()}</td></tr>`,
    )
    .join("");
  return `
    <div class="ps-header">
      <div><strong>Capitol Restaurant</strong><span>Since 1940 · Pasay City</span><small class="ps-kicker">Delivery slip</small></div>
      <div class="ps-ref"><small>Ref</small><strong>${draft.reference}</strong><span>${draft.status}</span></div>
    </div>
    <div class="ps-grid">
      <div><small>Deliver to</small><strong>${draft.customer}</strong><span>${draft.phone ?? ""}</span><span>${draft.address}</span></div>
      <div><small>Details</small><span>ETA: ${draft.eta}</span><span>Payment: ${draft.paymentMethod ?? "-"}</span><span>Placed: ${draft.placedAt}</span></div>
    </div>
    <table><thead><tr><th>Item</th><th style="text-align:right">Qty / Pax</th><th style="text-align:right">Price</th><th style="text-align:right">Line total</th></tr></thead><tbody>${rows || `<tr><td colspan="4" style="text-align:center;color:#8a5a5a">No items</td></tr>`}</tbody><tfoot><tr><td colspan="3" style="text-align:right">Subtotal</td><td style="text-align:right">₱${totals.subtotal.toLocaleString()}</td></tr><tr><td colspan="3" style="text-align:right">Delivery fee</td><td style="text-align:right">₱${totals.deliveryFee.toLocaleString()}</td></tr><tr><td colspan="3" style="text-align:right"><strong>Total</strong></td><td style="text-align:right"><strong>₱${totals.total.toLocaleString()}</strong></td></tr></tfoot></table>
    ${draft.notes ? `<div class="ps-notes"><small><strong>Notes:</strong> ${draft.notes}</small></div>` : ""}
    <div class="ps-footer">Capitol Restaurant · Pasay City · Thank you for your order</div>
  `;
}

export function buildFunctionSlipHtml(b: {
  id: string;
  customer: string;
  phone: string;
  email: string;
  room: string;
  guests: number;
  eventType: string;
  date: string;
  time: string;
  status: string;
  specialRequests: string;
  placedAt: string;
}): string {
  return `
    <div class="ps-header">
      <div><strong>Capitol Restaurant</strong><span>Since 1940 · Pasay City</span><small class="ps-kicker">Function room slip</small></div>
      <div class="ps-ref"><small>Ref</small><strong>${b.id}</strong><span>${b.status}</span></div>
    </div>
    <div class="ps-grid">
      <div><small>Client</small><strong>${b.customer}</strong><span>${b.phone}</span><span>${b.email}</span></div>
      <div><small>Reservation</small><span>${b.room}</span><span>${b.eventType} · ${b.guests} guests</span><span>Date: ${b.date} ${b.time}</span><span>Placed: ${b.placedAt}</span></div>
    </div>
    ${b.specialRequests ? `<div class="ps-notes"><small><strong>Special requests:</strong> ${b.specialRequests}</small></div>` : ""}
    <div class="ps-footer">Capitol Restaurant · Private Dining Room</div>
  `;
}

export function buildCateringSlipHtml(b: {
  id: string;
  kind: string;
  customer: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  status: string;
  placedAt: string;
  packageName?: string;
  pax?: number;
  pricePerPax?: number;
  guestCount?: number;
  subtotal?: number;
  total?: number;
  notes: string;
  itemsList?: { name: string; quantity: number; price: number; category?: string; type: string; pax?: number }[];
}): string {
  const isBuffet = b.kind === "catering_buffet";
  const itemsRows = isBuffet
    ? `<tr><td>${b.packageName ?? "-"} ${b.pax ? `· ${b.pax} pax` : ""}</td><td style="text-align:right">${b.guestCount ?? b.pax ?? "-"}</td><td style="text-align:right">₱${(b.pricePerPax ?? 0).toLocaleString()}/pax</td><td style="text-align:right">₱${(b.total ?? 0).toLocaleString()}</td></tr>`
    : (b.itemsList ?? [])
        .map(
          (it) => `<tr><td>${it.name} · ${it.category ?? ""}</td><td style="text-align:right">${it.quantity}</td><td style="text-align:right">₱${it.price.toLocaleString()}</td><td style="text-align:right">₱${(it.price * it.quantity).toLocaleString()}</td></tr>`,
        )
        .join("") || `<tr><td colspan="4" style="text-align:center;color:#8a5a5a">No items — inquiry only</td></tr>`;
  return `
    <div class="ps-header">
      <div><strong>Capitol Restaurant</strong><span>Since 1940 · Pasay City</span><small class="ps-kicker">${isBuffet ? "Buffet catering slip" : "Packed meals slip"}</small></div>
      <div class="ps-ref"><small>Ref</small><strong>${b.id}</strong><span>${b.status}</span></div>
    </div>
    <div class="ps-grid">
      <div><small>Client</small><strong>${b.customer}</strong><span>${b.phone}</span><span>${b.email}</span></div>
      <div><small>Event</small><span>Date: ${b.date} ${b.time}</span><span>${isBuffet ? `${b.packageName} · ${b.pax} pax · ₱${b.pricePerPax}/pax` : `${b.guestCount} guests`}</span><span>Placed: ${b.placedAt}</span></div>
    </div>
    <table><thead><tr><th>Item</th><th style="text-align:right">Qty / Pax</th><th style="text-align:right">Price</th><th style="text-align:right">Line total</th></tr></thead><tbody>${itemsRows}</tbody><tfoot><tr><td colspan="3" style="text-align:right">Subtotal</td><td style="text-align:right">₱${(b.subtotal ?? b.total ?? 0).toLocaleString()}</td></tr><tr><td colspan="3" style="text-align:right"><strong>Total</strong></td><td style="text-align:right"><strong>₱${(b.total ?? 0).toLocaleString()}</strong></td></tr></tfoot></table>
    ${b.notes ? `<div class="ps-notes"><small><strong>Notes:</strong> ${b.notes}</small></div>` : ""}
    <div class="ps-footer">Capitol Restaurant · Catering Services</div>
  `;
}
