/* Act 2: the customer journey — catering, calendar, rooms, delivery, QR payment, tracking. */
window.SCENES = window.SCENES || [];

/* ---------- shared builders ---------- */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** Month grid like BookingCalendarGrid. opts: {y, m, past:[], res:[], sel} */
function calHTML(o) {
  const first = new Date(o.y, o.m, 1).getDay();
  const days = new Date(o.y, o.m + 1, 0).getDate();
  let cells = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => `<div class="cal__dow">${d}</div>`).join("");
  for (let i = 0; i < first; i++) cells += "<div></div>";
  for (let d = 1; d <= days; d++) {
    const c = (o.past || []).includes(d) ? "past" : (o.res || []).includes(d) ? "res" : "";
    cells += `<div class="day ${c}" data-d="${d}">${d}</div>`;
  }
  return `<div class="cal"><div class="cal__head"><b>‹</b><span>${MONTHS[o.m]} ${o.y}</span><b>›</b></div><div class="cal__grid">${cells}</div>
    <div class="legend"><span><i style="background:repeating-linear-gradient(135deg,#f3e5e2,#f3e5e2 3px,#ead2cd 3px,#ead2cd 6px)"></i>Unavailable</span><span><i style="background:#b70100"></i>Selected</span><span><i style="background:#faf5ee;border:1px solid #eadbc8"></i>Needs 2 days’ notice</span></div></div>`;
}
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function dishCard(name, price, img, desc, extra = "") {
  return `<div class="card dish" style="overflow:hidden;border-radius:14px">
    <div class="photo" style="height:128px"><img src="${C.photoUrl(img)}">${extra}</div>
    <div style="padding:12px 14px 14px"><div style="font:700 17px/1.2 Georgia;color:#3a0000">${name}</div>
    <div style="color:#8a5a5a;font-size:12.5px;line-height:1.35;margin:4px 0 10px;height:34px;overflow:hidden">${desc}</div>
    <div style="display:flex;align-items:center;justify-content:space-between"><span class="price">${price}</span><span class="btn btn--dark" data-add style="padding:9px 14px;font-size:13px">${C.I("plus", 15, 2.5)} Add</span></div></div></div>`;
}

function packedPage() {
  const { header, I, photoUrl } = C;
  const dishes = [
    ["Adobong Manok", "₱120", "adobo", "Classic chicken adobo in garlic, soy, and vinegar."],
    ["Lechon Kawali", "₱145", "lechon_kawali", "Crispy deep-fried pork belly with liver sauce."],
    ["Pork Sinigang", "₱135", "sinigang", "Tamarind-based pork soup with fresh vegetables."],
    ["Beef Kaldereta", "₱165", "kaldereta", "Tender beef stewed in rich tomato sauce."],
    ["Chicken Tinola", "₱115", "tinola", "Ginger chicken soup with green papaya."],
    ["Pancit Bihon", "₱110", "pancit_bilao", "Rice noodles with vegetables and pork."],
  ];
  return `<div class="page app">${header({ on: 0, user: "Maria Santos" })}
    <div class="breadcrumb">Home › Catering › <span>Individually Packed Meals</span></div>
    <div class="hero hero--sm" style="padding:22px 40px"><h1 style="font-size:32px;margin:0 0 4px">Individually Packed Meals</h1><p style="font-size:15px">Ideal for crew meals, events, office parties, and meetings.</p></div>
    <div style="display:grid;grid-template-columns:1fr 330px;gap:22px;padding:20px 30px">
      <div><div class="tabs" style="margin-bottom:14px"><span class="tab on">All</span><span class="tab">Chicken</span><span class="tab">Pork</span><span class="tab">Beef</span><span class="tab">Vegetables</span><span class="tab">Noodles</span><span class="tab">Dessert</span></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${dishes.map((d) => dishCard(...d)).join("")}</div></div>
      <div class="card" style="padding:18px;align-self:start" data-cart><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0;font:700 22px Georgia;color:#3a0000">Your order</h2><span class="pill pill--pending" data-packs>0 packs</span></div>
        <div data-rows style="position:relative;height:150px;margin-top:12px"></div>
        <div style="border-top:1px dashed #e2cfb6;padding-top:12px;display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:700;color:#5a3a3a">Total</span><span style="font:800 28px Inter;color:#b70100" data-total>₱0</span></div>
        <div data-min style="margin-top:10px;font-size:12.5px;color:#8a5a5a;background:#fdf6e3;border-radius:8px;padding:8px 10px">Minimum order: 10 packs per kind · advance order required</div>
        <div class="btn btn--red btn--block" style="margin-top:12px" data-proceed>${I("cal", 16)} Choose reservation date</div></div>
    </div></div>`;
}

/* ---------------- S05 · Catering ---------------- */
SCENES.push(function s05() {
  const { tw, w, cls, swap } = V; const { el, sceneEl, I, browser, header, copy, copyIn, deviceIn, fadeUp, pop, show, fadeOut, photoUrl, peso } = C;
  const id = "s05_catering";
  const root = sceneEl(id, "bg-cream");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern pattern--dark"></div>`));
  const cp = copy({ x: 1395, y: 250, width: 460, kicker: "Catering", title: "Buffet or <em>packed.</em> Your call.",
    features: ["Packages A, B &amp; C for 10–12 guests", "Capitol classics in every set", "Live totals as you build your order"] });
  root.appendChild(cp);
  copyIn(cp, S.start + 0.4, [w(id, "Packages"), w(id, "classics"), w(id, "total") - 0.3]);

  const b = browser("/catering", 70, 140);
  root.appendChild(b);
  deviceIn(b, S.start + 0.05, -1);
  const view = b.querySelector(".browser__view");
  const url = b.querySelector(".urlpath");

  // P1 choice
  const p1 = el(`<div class="page app">${header({ on: 0, user: "Maria Santos" })}
    <div class="hero" style="padding:40px"><div class="eyebrow">Capitol Restaurant</div><h1 style="font-size:46px">Catering Services</h1><p>Let Capitol bring our legacy to your celebration. Choose the catering style that suits your event.</p></div>
    <div style="padding:26px 0;text-align:center;font:italic 500 20px Georgia;color:#8a5a5a">How would you like your catering?</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;padding:0 150px">
      ${[["Buffet Style", "Guests serve themselves from a spread of Capitol signature dishes.", "crispy_pata", "utensils", ""], ["Individually Packed Meals", "Each guest receives a neatly packed Capitol meal.", "packed", "clipboard", "Popular"]].map(([t, d, img, ic, badge], i) => `
      <div class="card" data-choice="${i}" style="overflow:hidden;border-radius:16px;${i ? "border-color:#d8a39b" : ""}"><div class="photo" style="height:150px"><img src="${photoUrl(img)}">${badge ? `<span class="pill" style="position:absolute;right:12px;top:12px;background:#b70100;color:#fff">★ ${badge}</span>` : ""}</div>
        <div style="padding:18px 22px"><div style="display:flex;align-items:center;gap:10px;color:#b70100">${I(ic, 22)}<span style="font:700 22px Georgia;color:#3a0000">${t}</span></div>
        <p style="margin:8px 0 14px;color:#8a5a5a;font-size:14.5px;line-height:1.5">${d}</p><span class="btn btn--gold" style="padding:10px 18px;font-size:13.5px;background:#640000;color:#ffefc1">Select ${I("arrow", 15)}</span></div></div>`).join("")}
    </div></div>`);
  view.appendChild(p1);

  // P2 buffet packages
  const pk = [
    ["Package A", 2850, "lumpia2", ["Capitol Chicken", "Lumpiang Shanghai", "Chopsuey", "Sweet &amp; Sour Fish Fillet", "Pancit of choice"]],
    ["Package B", 3150, "crispy_pata", ["Buttered Chicken", "Beef Broccoli", "Crispy Pata", "Sweet and Sour Fish", "Pancit of choice"]],
    ["Package C", 3450, "sweet_sour", ["Buttered Chicken", "Beef Broccoli", "Sinigang Hipon / Baboy", "Crispy Ulo", "Pancit of choice"]],
  ];
  const p2 = el(`<div class="page app" style="background:#fdf6e3">${header({ on: 0, user: "Maria Santos" })}
    <div class="breadcrumb">Home › Catering › <span>Buffet Style</span></div>
    <div class="hero hero--sm" style="padding:22px 40px"><h1 style="font-size:32px;margin:0 0 4px">Buffet Style Catering</h1><p style="font-size:15px">Select a package, then proceed to choose your reservation date.</p></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:22px 34px">
    ${pk.map(([n, p, img, inc], i) => `<div class="card" data-pkg="${i}" style="overflow:hidden;border-radius:16px">
      <div class="photo" style="height:150px"><img src="${photoUrl(img)}"></div>
      <div style="padding:16px 20px 18px"><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font:700 23px Georgia;color:#3a0000">${n}</span><span class="price" style="font-size:22px">${peso(p)}</span></div>
      <div style="color:#8a5a5a;font-size:13px;margin:4px 0 10px">${I("users", 14)} Good for 10 to 12 persons</div>
      <ul style="margin:0;padding:0;list-style:none;display:grid;gap:5px;font-size:14px;color:#4a2a2a">${inc.map((x) => `<li data-inc="${x.replace(/&amp;/g, "&")}" style="display:flex;gap:8px;align-items:center;border-radius:6px;padding:1px 4px"><span style="color:#b70100">${I("check", 14, 3)}</span>${x}</li>`).join("")}<li style="color:#a58a77;padding-left:4px">+ Nido Soup, rice platters &amp; soft drinks</li></ul>
      <div class="btn btn--ghost btn--block" data-pick style="margin-top:14px;padding:11px">Select ${n}</div></div></div>`).join("")}
    </div></div>`);
  view.appendChild(p2);

  // P3 packed meals
  const p3 = el(packedPage());
  view.appendChild(p3);

  const cur = V.cursor(view);
  const tBuf = w(id, "Buffet") - 0.45;
  cur.to(S.start, 700, 600).click(tBuf, '[data-choice="0"] .btn');
  tw(p2, tBuf + 0.15, 0.6, { o: [0, 1], x: [80, 0] });
  swap(url, [[S.start, "/catering"], [tBuf + 0.15, "/catering/buffet"], [w(id, "individually") - 0.3, "/catering/packed"]]);
  V.cue(tBuf + 0.15, "whoosh");
  const cards = p2.querySelectorAll("[data-pkg]");
  ["A", "B", "C"].forEach((L, i) => {
    const t = w(id, L) - 0.1;
    tw(cards[i], tBuf + 0.35 + i * 0.12, 0.6, { o: [0, 1], y: [40, 0] }, "out");
    tw(cards[i], t, 0.25, { s: [1, 1.045] }, "out"); tw(cards[i], t + 0.3, 0.45, { s: [1.045, 1] }, "out");
    V.hook((tt) => { cards[i].style.boxShadow = tt >= t && tt < t + 0.9 ? "0 0 0 3px rgba(183,1,0,.35), 0 18px 34px rgba(100,0,0,.18)" : ""; });
    V.cue(t, "pop");
  });
  const hl = (sel, t) => { const e = p2.querySelector(sel); V.hook((tt) => { const on = tt >= t && tt < t + 1.6; e.style.background = on ? "#ffe9a8" : "transparent"; e.style.fontWeight = on ? "700" : "400"; }); };
  hl('[data-pkg="0"] [data-inc="Lumpiang Shanghai"]', w(id, "Lumpiang") - 0.1);
  hl('[data-pkg="1"] [data-inc="Crispy Pata"]', w(id, "Crispy") - 0.1);
  cur.on(w(id, "Lumpiang") - 0.1, '[data-pkg="0"] [data-inc="Lumpiang Shanghai"]', { fx: 0.85 });
  cur.on(w(id, "Crispy") - 0.1, '[data-pkg="1"] [data-inc="Crispy Pata"]', { fx: 0.7 });
  const tPick = w(id, "Pata") + 0.45;
  cur.click(tPick, '[data-pkg="1"] [data-pick]');
  const pickB = p2.querySelector('[data-pkg="1"]');
  V.hook((t) => { const on = t >= tPick; pickB.style.borderColor = on ? "#b70100" : ""; pickB.style.boxShadow = on ? "0 0 0 3px rgba(183,1,0,.25), 0 16px 30px rgba(100,0,0,.15)" : ""; const bt = pickB.querySelector("[data-pick]"); bt.className = on ? "btn btn--red btn--block" : "btn btn--ghost btn--block"; bt.textContent = on ? "✓ Package B selected" : "Select Package B"; });

  // packed
  const tP = w(id, "individually") - 0.3;
  tw(p3, tP, 0.6, { o: [0, 1], x: [80, 0] });
  V.cue(tP, "whoosh");
  const rows = p3.querySelector("[data-rows]");
  const mkRow = (name, img, price, y) => {
    const r = el(`<div class="abs" style="left:0;right:0;top:${y}px;display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f1e5d6">
      <div class="photo" style="width:46px;height:46px;border-radius:10px;flex:none"><img src="${photoUrl(img)}"></div>
      <div style="flex:1"><div style="font:700 14.5px Inter;color:#3a0000">${name}</div><div style="font-size:12px;color:#8a5a5a">${peso(price)} / pack</div></div>
      <span class="qty"><b>−</b><span data-q>10</span><b data-plus>+</b></span></div>`);
    rows.appendChild(r);
    return r;
  };
  const r1 = mkRow("Lechon Kawali", "lechon_kawali", 145, 0);
  const r2 = mkRow("Adobong Manok", "adobo", 120, 70);
  const cards3 = p3.querySelectorAll(".dish");
  const tA1 = w(id, "dishes") - 0.15, tA2 = w(id, "set") - 0.25;
  const tq1 = w(id, "quantities") - 0.1, tq2 = tq1 + 0.55, tq3 = w(id, "watch") - 0.1;
  cur.click(tA1, cards3[1].querySelector("[data-add]"));
  cur.click(tA2, cards3[0].querySelector("[data-add]"));
  cur.click(tq1, r1.querySelector("[data-plus]"), { dy: 0 });
  cur.click(tq2, r1.querySelector("[data-plus]"));
  cur.click(tq3, r2.querySelector("[data-plus]"));
  tw(r1, tA1 + 0.1, 0.4, { o: [0, 1], x: [20, 0] });
  tw(r2, tA2 + 0.1, 0.4, { o: [0, 1], x: [20, 0] });
  swap(r1.querySelector("[data-q]"), [[0, "10"], [tq1 + 0.05, "20"], [tq2 + 0.05, "30"]]);
  swap(r2.querySelector("[data-q]"), [[0, "10"], [tq3 + 0.05, "20"]]);
  const steps = [[tA1, 1450], [tA2, 2650], [tq1, 4100], [tq2, 5550], [tq3, 6750]];
  const packs = [[tA1, 10], [tA2, 20], [tq1, 30], [tq2, 40], [tq3, 50]];
  const totEl = p3.querySelector("[data-total]"), packEl = p3.querySelector("[data-packs]");
  V.hook((t) => {
    let prev = 0, v = 0;
    for (const [ts, val] of steps) { if (t >= ts) { const k = Math.min(1, (t - ts) / 0.45); v = prev + (val - prev) * (1 - Math.pow(1 - k, 3)); prev = val; } }
    totEl.textContent = peso(v);
    let p = 0; for (const [ts, val] of packs) if (t >= ts) p = val;
    packEl.textContent = `${p} packs`;
  });
  steps.forEach(([ts]) => V.cue(ts, "tick"));
  tw(totEl, w(id, "total") - 0.05, 0.25, { s: [1, 1.15] }, "out"); tw(totEl, w(id, "total") + 0.3, 0.4, { s: [1.15, 1] }, "out");
  cls(p3.querySelector("[data-min]"), tA1 + 0.2, "min-hl", tA1 + 1.6);
});

/* ---------------- S06 · Live calendar ---------------- */
SCENES.push(function s06() {
  const { tw, w, cls, swap, type } = V; const { el, sceneEl, I, browser, copy, copyIn, modalIn, fadeUp, pop, show, fadeOut } = C;
  const id = "s06_calendar";
  const root = sceneEl(id, "bg-cream");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern pattern--dark"></div>`));
  const cp = copy({ x: 1395, y: 230, width: 460, kicker: "Live calendar", title: "Pick a date. <em>No clashes.</em>",
    features: ["Booked dates blocked instantly", "Two-day minimum lead time", "Function room or delivered to your venue", "Booking reference on submit"] });
  root.appendChild(cp);
  copyIn(cp, S.start + 0.3, [w(id, "Days"), w(id, "two"), w(id, "Serve"), w(id, "reference")]);

  const b = browser("/catering/packed", 70, 140);
  root.appendChild(b);
  const view = b.querySelector(".browser__view");
  const bg = el(packedPage());
  view.appendChild(bg);
  const ov = el(`<div class="overlay"></div>`);
  const m = el(`<div class="modal" style="left:110px;top:28px;width:1060px;height:700px">
    <div class="modal__head"><div class="modal__icon">${I("cal")}</div><div><div class="eyebrow">Booking schedule</div><h3>Reserve Packed Meals Catering</h3></div><span style="margin-left:auto" class="badge-live">Live availability</span></div>
    <div data-form style="display:grid;grid-template-columns:470px 1fr;gap:30px;padding:20px 28px">
      <div data-cal>${calHTML({ y: 2026, m: 9, past: range(1, 9), res: [17, 18, 25, 31] })}</div>
      <div style="display:grid;gap:13px;align-content:start">
        <label class="field"><span>Selected date</span><div class="input" data-date><span class="ph">Choose a date from the calendar</span></div></label>
        <label class="field"><span>Preferred Time</span><div class="input select" data-time>9:00 AM</div></label>
        <div class="field"><span>Where will this be served?</span><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="radio" data-r1><i></i>In our function room</div><div class="radio" data-r2><i></i>Deliver to my venue</div></div></div>
        <div style="position:relative;height:72px">
          <label class="field abs" data-room style="left:0;right:0;top:0"><span>Function Room</span><div class="input select">Function Room A · up to 50 guests</div></label>
          <label class="field abs" data-addr style="left:0;right:0;top:0"><span>Venue address</span><div class="input focus"><span data-addrtxt></span></div></label></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label class="field"><span>Full name</span><div class="input">Maria Santos</div></label><label class="field"><span>Number of packs</span><div class="input">50</div></label></div>
        <div class="btn btn--red btn--block" data-submit style="margin-top:4px">${I("check", 17)} Submit Reservation</div>
      </div></div>
    <div data-ok class="abs" style="left:0;right:0;top:92px;bottom:0;background:#fff;display:grid;justify-items:center;align-content:start;padding-top:34px;text-align:center">
      <div style="width:84px;height:84px;border-radius:50%;background:#e3f4ea;color:#1f7a4d;display:grid;place-items:center" data-okic>${I("check", 44, 3)}</div>
      <div style="margin-top:18px;font:700 12px Inter;letter-spacing:.2em;color:#8a5a5a">BOOKING REFERENCE</div>
      <div style="font:800 46px/1.1 Inter;letter-spacing:.04em;color:#b70100;margin:6px 0 4px" data-ref>BK-7F3A21</div>
      <div style="width:120px;height:2px;background:#ead9c4;margin:8px 0 14px"></div>
      <h3 style="margin:0;font:700 30px Georgia;color:#3a0000">Reservation Submitted!</h3>
      <div style="margin-top:18px;width:520px;border:1px solid #f0e3d2;border-radius:12px;text-align:left;font-size:15px">
        ${[["Date", "Saturday, October 24, 2026"], ["Time", "11:00 AM"], ["Deliver to", "Unit 5, World Trade Center, Pasay City"], ["Number of packs", "50 packs"]].map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:11px 16px;border-top:1px solid #f5ebdf"><span style="color:#8a5a5a">${k}</span><strong style="color:#3a0000">${v}</strong></div>`).join("")}</div>
      <p style="max-width:520px;color:#8a5a5a;font-size:14.5px;line-height:1.55">Capitol’s team will contact you within <b>24 hours</b> to confirm your reservation and discuss event details.</p>
    </div></div>`);
  view.append(ov, m);
  modalIn(ov, m, S.start + 0.15);
  V.cue(S.start + 0.15, "whoosh");
  const day = (d) => m.querySelector(`[data-cal] [data-d="${d}"]`);
  const cur = V.cursor(view);
  cur.to(S.start, 900, 600);
  // reserved days pulse
  [17, 18, 25, 31].forEach((d, i) => { const t = w(id, "taken") + i * 0.12; tw(day(d), t, 0.5, { s: [1.18, 1] }, "back"); cls(day(d), t, "flash", t + 0.8); });
  const tip = (d, text, t, t1) => {
    const e = el(`<div class="abs" style="background:#2d1717;color:#fff;font:600 13px Inter;padding:8px 12px;border-radius:8px;white-space:nowrap;box-shadow:0 8px 20px rgba(0,0,0,.25);z-index:30">${text}</div>`);
    view.appendChild(e);
    const p = V.center(view, day(d));
    e.style.left = p.x - 20 + "px"; e.style.top = p.y - 58 + "px";
    tw(e, t, 0.3, { o: [0, 1], y: [6, 0] }); fadeOut(e, t1, 0.25);
  };
  cur.on(w(id, "blocked") - 0.2, day(18));
  cls(day(18), w(id, "blocked") - 0.2, "hov", w(id, "every"));
  tip(18, "Unavailable — already booked", w(id, "blocked"), w(id, "every") - 0.2);
  cur.on(w(id, "least") - 0.2, day(9));
  tip(9, "Bookings need 2 days’ notice", w(id, "least"), w(id, "Serve") - 0.3);
  const tSel = w(id, "Serve") - 0.35;
  cur.click(tSel, day(24));
  cls(day(24), tSel, "sel");
  V.cue(tSel, "tick");
  const dateEl = m.querySelector("[data-date]");
  V.hook((t) => { dateEl.innerHTML = t >= tSel ? "<b style='color:#3a0000'>Saturday, October 24, 2026</b>" : '<span class="ph">Choose a date from the calendar</span>'; });
  swap(m.querySelector("[data-time]"), [[0, "9:00 AM"], [tSel + 0.5, "11:00 AM"]]);
  const tRoom = w(id, "function") - 0.2, tDel = w(id, "deliver") - 0.25;
  cur.click(tRoom, "[data-r1]");
  cls(m.querySelector("[data-r1]"), tRoom, "on", tDel);
  tw(m.querySelector("[data-room]"), tRoom + 0.1, 0.3, { o: [0, 1] }, "lin"); fadeOut(m.querySelector("[data-room]"), tDel, 0.2);
  cur.click(tDel, "[data-r2]");
  cls(m.querySelector("[data-r2]"), tDel, "on");
  show(m.querySelector("[data-addr]"), tDel + 0.15);
  type(m.querySelector("[data-addrtxt]"), tDel + 0.3, "Unit 5, World Trade Center, Pasay City", 40);
  const tSub = w(id, "Submit") - 0.15;
  cur.click(tSub, "[data-submit]");
  const ok = m.querySelector("[data-ok]");
  show(ok, tSub + 0.3, 0.3);
  tw(m.querySelector("[data-okic]"), tSub + 0.35, 0.6, { s: [0.3, 1], o: [0, 1] }, "back");
  tw(m.querySelector("[data-ref]"), w(id, "reference") - 0.1, 0.6, { o: [0, 1], s: [0.85, 1], blur: [6, 0] }, "back");
  V.cue(tSub + 0.35, "ding");
  tw(cur.el, tSub + 0.6, 0.3, { o: [1, 0] }, "lin");
});

/* ---------------- S07 · Function rooms + real-time conflict ---------------- */
SCENES.push(function s07() {
  const { tw, w, cls, swap } = V; const { el, sceneEl, I, browser, header, copy, copyIn, deviceIn, modalIn, fadeUp, pop, show, fadeOut, photoUrl } = C;
  const id = "s07_rooms";
  const root = sceneEl(id, "bg-cream");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern pattern--dark"></div>`));
  const cp = copy({ x: 90, y: 230, kicker: "Function rooms", title: "Celebrate <em>at Capitol.</em>",
    text: "Two private rooms for birthdays, debuts, weddings, reunions, and corporate events.",
    chips: [["Up to 50 guests", "users"], ["Sound system", "music"], ["Projector", "projector"], ["Air-conditioned", "snow"], ["Event coordination", "star"]] });
  root.appendChild(cp);
  copyIn(cp, S.start + 0.3, [w(id, "fifty"), w(id, "sound"), w(id, "projector"), w(id, "air"), w(id, "coordination")]);

  const b = browser("/function-rooms", 570, 140);
  b.style.transformOrigin = "0 0";
  root.appendChild(b);
  deviceIn(b, S.start + 0.05);
  const view = b.querySelector(".browser__view");
  const amen = [["Tables &amp; Chairs", "users"], ["Air Conditioning", "snow"], ["Sound System", "music"], ["Projector &amp; Screen", "projector"], ["Event Coordination", "star"], ["Parking Space", "car"]];
  const page = el(`<div class="page app">${header({ on: 1, user: "Maria Santos" })}
    <section style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;padding:50px 50px;height:560px;background:linear-gradient(135deg,#fdf6e3,#f6e6cc)">
      <div><div class="eyebrow">Private events at Capitol</div><h1 style="margin:14px 0;font:700 56px/1.05 Georgia;color:#3a0000">Celebrate at Capitol.</h1>
      <p style="color:#6b4646;font-size:17px;line-height:1.65;margin:0 0 24px">Birthdays, debuts, weddings, reunions, and corporate events — hosted by Pasay City’s oldest restaurant.</p>
      <span class="btn btn--red">${I("cal", 17)} Reserve a room</span></div>
      <div class="photo" style="height:420px;border-radius:22px;box-shadow:0 30px 60px rgba(60,0,0,.25)"><img src="${photoUrl("banquet")}"></div></section>
    <section style="padding:40px 50px;height:560px"><h2 class="sec-title" style="font-size:34px">Inside our rooms.</h2><p class="sec-sub">Take a look around before you book.</p>
      <div class="photo" data-gal style="height:380px;border-radius:18px">
        ${["banquet2", "dining", "dining2"].map((p, i) => `<img class="abs" data-g="${i}" src="${photoUrl(p)}" style="inset:0;width:100%;height:100%;object-fit:cover">`).join("")}
        <span class="abs" style="left:16px;top:50%;width:44px;height:44px;margin-top:-22px;border-radius:50%;background:rgba(255,255,255,.9);display:grid;place-items:center;color:#640000;font:700 22px Inter">‹</span>
        <span class="abs" style="right:16px;top:50%;width:44px;height:44px;margin-top:-22px;border-radius:50%;background:rgba(255,255,255,.9);display:grid;place-items:center;color:#640000;font:700 22px Inter">›</span></div></section>
    <section style="padding:30px 50px;height:470px"><h2 class="sec-title" style="font-size:34px">Our function rooms</h2><p class="sec-sub">Both rooms seat up to 50 guests.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">${[["Function Room A", "A spacious hall for up to 50 guests. Perfect for birthdays, debuts, weddings, corporate events, and family celebrations.", "banquet"], ["Function Room B", "A versatile hall for up to 50 guests. Ideal for seminars, conferences, Christmas parties, reunions, and private dinners.", "dining"]].map(([t, d, p], i) => `
        <div class="card" data-room="${i}" style="overflow:hidden;border-radius:16px;display:grid;grid-template-columns:200px 1fr"><div class="photo" style="height:100%"><img src="${photoUrl(p)}"></div>
        <div style="padding:20px"><div style="font:700 23px Georgia;color:#3a0000">${t}</div><p style="color:#6b4646;font-size:14.5px;line-height:1.55;margin:8px 0 12px">${d}</p><span class="pill pill--confirmed">Up to 50 guests</span></div></div>`).join("")}</div></section>
    <section style="padding:10px 50px 40px"><h3 style="font:700 24px Georgia;color:#3a0000;margin:0 0 16px">Included Amenities</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${amen.map(([a, ic], i) => `<div class="card" data-am="${i}" style="display:flex;gap:12px;align-items:center;padding:16px 18px"><span style="width:42px;height:42px;border-radius:12px;background:#fdecea;color:#b70100;display:grid;place-items:center">${I(ic, 21)}</span><b style="font-size:16px;color:#3a0000">${a}</b></div>`).join("")}</div></section>
  </div>`);
  view.appendChild(page);
  const tTour = w(id, "Tour") - 0.3;
  tw(page, tTour, 1.0, { y: [0, -560] }, "io");
  const gal = page.querySelectorAll("[data-g]");
  tw(gal[1], tTour + 1.3, 0.6, { o: [0, 1], x: [60, 0] }); tw(gal[2], tTour + 2.2, 0.6, { o: [0, 1], x: [60, 0] });
  const tRooms = w(id, "A", 1) - 0.3;
  tw(page, tRooms, 0.9, { y: [-560, -1120] }, "io");
  [0, 1].forEach((i) => tw(page.querySelector(`[data-room="${i}"]`), (i ? w(id, "B") : w(id, "A", 1)) - 0.1, 0.5, { s: [0.96, 1], o: [0.4, 1] }, "back"));
  const tAm = w(id, "with") - 0.4;
  tw(page, tAm, 0.9, { y: [-1120, -1590] }, "io");
  const amT = [w(id, "sound"), w(id, "projector"), w(id, "air"), w(id, "coordination"), w(id, "with") + 0.2, w(id, "with") + 0.3];
  [2, 3, 1, 4, 0, 5].forEach((k, i) => tw(page.querySelector(`[data-am="${k}"]`), amT[i] - 0.1, 0.5, { o: [0.25, 1], s: [0.9, 1] }, "back"));
  swap(b.querySelector(".urlpath"), [[0, "/function-rooms"], [w(id, "And", 2) - 0.3, "/function-rooms/reserve"]]);

  // --- real-time conflict ---
  const tSplit = w(id, "And", 2) - 0.6;
  tw(cp, tSplit - 0.2, 0.4, { o: [1, 0], x: [0, -40] });
  const calModal = (who) => `<div class="overlay" data-ov></div><div class="modal" data-m style="left:200px;top:24px;width:880px;height:700px">
    <div class="modal__head"><div class="modal__icon">${I("cal")}</div><div><div class="eyebrow">Booking schedule</div><h3>Select Your Event Date</h3></div><span style="margin-left:auto" class="badge-live">Live</span></div>
    <div style="display:grid;grid-template-columns:470px 1fr;gap:28px;padding:20px 28px"><div data-cal>${calHTML({ y: 2026, m: 11, res: [5, 19, 26] })}</div>
    <div style="display:grid;gap:13px;align-content:start"><label class="field"><span>Event type</span><div class="input select">Wedding Reception</div></label>
    <label class="field"><span>Guests</span><div class="input">${who ? 48 : 50}</div></label><label class="field"><span>Function Room</span><div class="input select">Function Room A</div></label>
    <div class="btn btn--red btn--block" data-submit>${I("check", 17)} Submit Reservation</div></div></div></div>`;
  // our modal
  const ours = el(`<div class="fill">${calModal(0)}</div>`);
  view.appendChild(ours);
  modalIn(ours.querySelector("[data-ov]"), ours.querySelector("[data-m]"), tSplit);
  // other guest's browser
  const b2 = browser("/function-rooms/reserve", 60, 330);
  b2.style.transformOrigin = "0 0";
  root.appendChild(b2);
  const v2 = b2.querySelector(".browser__view");
  v2.appendChild(el(`<div class="page app">${header({ on: 1, user: "Paolo Lim" })}<div style="height:684px;background:linear-gradient(135deg,#fdf6e3,#f6e6cc)"></div></div>`));
  const theirs = el(`<div class="fill">${calModal(1)}</div>`);
  v2.appendChild(theirs);
  const sc = 0.66;
  tw(b, tSplit, 1.0, { x: [0, 445], y: [0, 190], s: [1, sc] }, "io");
  tw(b2, tSplit + 0.2, 0.9, { o: [0, 1], x: [-80, 0], s: [sc, sc] }, "out");
  const lab1 = el(`<div class="abs" style="left:60px;top:278px;font:700 22px Inter;color:#3a0000;display:flex;gap:10px;align-items:center"><span style="width:34px;height:34px;border-radius:50%;background:#1d5fa8;color:#fff;display:grid;place-items:center">${I("user", 18)}</span>Another guest · Quezon City</div>`);
  const lab2 = el(`<div class="abs" style="left:1016px;top:278px;font:700 22px Inter;color:#3a0000;display:flex;gap:10px;align-items:center"><span style="width:34px;height:34px;border-radius:50%;background:#b70100;color:#fff;display:grid;place-items:center">${I("user", 18)}</span>Maria · Pasay City</div>`);
  const head = el(`<div class="abs" style="left:0;right:0;top:120px;text-align:center;font:700 54px/1.1 'Playfair Display';color:#3a0000">Two guests. <em style="color:#b70100">One date.</em></div>`);
  root.append(lab1, lab2, head);
  fadeUp(lab1, tSplit + 0.6, 0.6, 12); fadeUp(lab2, tSplit + 0.7, 0.6, 12); fadeUp(head, tSplit + 0.4, 0.7, 16);
  // their actions
  const d2 = (d) => theirs.querySelector(`[data-cal] [data-d="${d}"]`);
  const d1 = (d) => ours.querySelector(`[data-cal] [data-d="${d}"]`);
  const c2 = V.cursor(v2);
  const tBooks = w(id, "books") - 0.2;
  c2.to(tSplit, 700, 500).click(tBooks, d2(12)).click(w(id, "first") - 0.05, "[data-submit]");
  cls(d2(12), tBooks, "sel");
  const ok2 = el(`<div class="toast" style="left:430px;top:640px">${I("check")} Reservation submitted</div>`);
  v2.appendChild(ok2);
  tw(ok2, w(id, "first") + 0.2, 0.4, { o: [0, 1], y: [14, 0] }, "back");
  // our cursor hovering 12 then flipped
  const c1 = V.cursor(view);
  c1.to(tSplit, 900, 600).on(tSplit + 1.4, d1(11)).on(w(id, "calendar") - 0.4, d1(12), { dy: 4 });
  const tFlip = w(id, "calendar") - 0.05;
  cls(d1(12), tFlip, "res");
  cls(d1(12), tFlip, "flash", tFlip + 1.2);
  tw(d1(12), tFlip, 0.6, { s: [1.35, 1] }, "back");
  // beam
  const beam = el(`<div class="abs" style="left:908px;top:594px;width:104px;height:4px;background:linear-gradient(90deg,#1d5fa8,#b70100);border-radius:2px;transform-origin:0 50%"></div>`);
  const beamLab = el(`<div class="abs" style="left:875px;top:548px;width:170px;text-align:center"><span class="badge-live" style="background:#fff;box-shadow:0 6px 16px rgba(0,0,0,.12)">Synced live</span></div>`);
  root.append(beam, beamLab);
  tw(beam, w(id, "first") + 0.3, 0.5, { sx: [0, 1], o: [0, 1] }, "out");
  pop(beamLab, w(id, "calendar") - 0.2);
  V.cue(tFlip, "pop");
  const tClick = w(id, "real") - 0.1;
  c1.click(tClick, d1(12), { dy: 4 });
  const warn = el(`<div class="toast toast--warn" style="left:280px;top:640px;font-size:17px">${I("alert")} That date was just booked. Choose another available date.</div>`);
  view.appendChild(warn);
  tw(warn, tClick + 0.15, 0.4, { o: [0, 1], y: [14, 0] }, "back");
  const stamp = el(`<div class="abs" style="left:0;right:0;top:900px;text-align:center"><span class="chip" style="font-size:24px;padding:16px 28px;background:#1f7a4d;color:#fff;border:none">${I("shield", 26)} Double booking prevented</span></div>`);
  root.appendChild(stamp);
  tw(stamp, w(id, "double") - 0.1, 0.5, { o: [0, 1], s: [0.8, 1] }, "back");
  V.cue(w(id, "double") - 0.1, "ding");
});

/* ---------------- S08 · Delivery menu ---------------- */
SCENES.push(function s08() {
  const { tw, w, cls, swap } = V; const { el, sceneEl, I, browser, header, deviceIn, modalIn, modalOut, fadeUp, pop, show, fadeOut, photoUrl, peso } = C;
  const id = "s08_delivery";
  const root = sceneEl(id, "bg-cream");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern pattern--dark"></div>`));
  const b = browser("/delivery/order", 320, 140);
  root.appendChild(b);
  deviceIn(b, S.start + 0.05);
  const view = b.querySelector(".browser__view");
  const tabs = ["Best Sellers", "Pancit / Noodles", "Pancit sa Bilao", "Chicken", "Pork", "Seafood", "Vegetables", "Soup"];
  const grids = {
    all: [["Crispy Pata", "₱680", "crispy_pata", "Deep-fried pork knuckle, crackling skin."], ["Lumpiang Shanghai", "₱280", "lumpia2", "Crisp pork spring rolls with sweet chili."], ["Sisig", "₱290", "sisig", "Sizzling chopped pork with egg and calamansi."], ["Pancit Canton", "₱170", "pancit_canton", "Egg noodles with pork, shrimp, and vegetables."], ["Sweet &amp; Sour Fish Fillet", "₱290", "sweet_sour", "Golden fish fillet in sweet and sour sauce."], ["Yangchow Rice", "₱240", "yangchow", "Fried rice with egg, ham, and shrimp."]],
    chicken: [["Fried Chicken", "₱210 – ₱420", "fried_chicken", "Capitol’s classic crispy fried chicken.", "Half · Whole"], ["Buttered Chicken", "₱200 – ₱400", "adobo", "Tender chicken glazed in butter sauce.", "Half · Whole"], ["Sizzling Chicken", "₱420", "sisig", "Served hot on a sizzling plate."], ["Lutong Bahay", "₱420", "kaldereta", "Home-style chicken in savory sauce."], ["Garlic Fried Chicken", "₱420", "fried_chicken", "Crispy chicken with toasted garlic."], ["Capitol Chicken", "₱200 – ₱400", "adobo", "The house specialty since 1940.", "Half · Whole"]],
    bilao: [["Canton Bilao", "₱430 – ₱950", "pancit_bilao", "Party-size pancit canton on a bilao.", "4 sizes"], ["Palabok Bilao", "₱530 – ₱1,050", "palabok", "Rice noodles with shrimp sauce and egg.", "4 sizes"], ["Bihon Bilao", "₱430 – ₱950", "pancit_canton", "Party-size bihon for the whole family.", "4 sizes"], ["Chopsuey Noodles Bilao", "₱530 – ₱1,050", "chopsuey", "Noodles topped with Capitol chopsuey.", "4 sizes"], ["Sotanghon Bilao", "₱430 – ₱950", "pancit_bilao", "Glass noodles with chicken and veggies.", "4 sizes"], ["Pancit Sisig Bilao", "₱530 – ₱1,050", "sisig", "Our sizzling sisig over pancit.", "4 sizes"]],
  };
  const gridHTML = (k) => `<div class="abs" data-grid="${k}" style="left:0;right:0;top:0;display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${grids[k].map(([n, p, img, d, badge]) => dishCard(n, p, img, d, badge ? `<span class="pill" style="position:absolute;left:10px;top:10px;background:rgba(255,255,255,.92);color:#640000">${badge}</span>` : "")).join("")}</div>`;
  const page = el(`<div class="page app">${header({ on: 2, user: "Maria Santos" })}
    <div class="hero hero--sm" style="padding:20px 40px"><h1 style="font-size:32px;margin:0 0 4px">Order Delivery</h1><p style="font-size:15px">Enjoy Capitol favorites at home. Build your order below.</p></div>
    <div style="display:grid;grid-template-columns:1fr 330px;gap:22px;padding:18px 28px">
      <div><div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:12px"><div><div class="eyebrow">Packed meals</div><div style="font:700 24px Georgia;color:#3a0000;margin-top:4px">Choose your dishes</div></div>
        <div class="search" style="width:260px">${I("search")} Search the menu…</div></div>
        <div class="tabs" style="margin-bottom:14px;overflow:hidden">${tabs.map((t, i) => `<span class="tab" data-tab="${i}">${t}</span>`).join("")}</div>
        <div data-grids style="position:relative;height:520px">${gridHTML("all")}${gridHTML("chicken")}${gridHTML("bilao")}</div></div>
      <div class="card" style="padding:18px;align-self:start"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0;font:700 22px Georgia;color:#3a0000">Your order</h2><span class="pill pill--pending" data-n>0 items</span></div>
        <div data-rows style="position:relative;height:258px;margin-top:10px"></div>
        <div style="border-top:1px dashed #e2cfb6;padding-top:10px;display:grid;gap:7px;font-size:14.5px">
          <div style="display:flex;justify-content:space-between;color:#6b4646"><span>Subtotal</span><b data-sub>₱0</b></div>
          <div style="display:flex;justify-content:space-between;color:#6b4646;border-radius:6px;padding:2px 4px;margin:0 -4px" data-feerow><span>Delivery fee</span><b>₱60</b></div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:4px"><span style="font-weight:800;color:#3a0000">Total</span><span style="font:800 28px Inter;color:#b70100" data-total>₱60</span></div></div>
        <div class="btn btn--red btn--block" style="margin-top:12px">${I("truck", 17)} Proceed to checkout</div></div>
    </div></div>`);
  view.appendChild(page);
  const G = (k) => page.querySelector(`[data-grid="${k}"]`);
  const cur = V.cursor(view);
  const tab = (i) => page.querySelector(`[data-tab="${i}"]`);
  const tChicken = w(id, "category") + 0.05, tBilaoTab = w(id, "pancit") - 0.15;
  // tab states
  V.hook((t) => { const on = t >= tBilaoTab ? 2 : t >= tChicken ? 3 : 0; page.querySelectorAll("[data-tab]").forEach((e, i) => e.classList.toggle("on", i === on)); });
  tw(G("chicken"), tChicken + 0.1, 0.4, { o: [0, 1], y: [16, 0] }); fadeOut(G("chicken"), tBilaoTab + 0.05, 0.2);
  tw(G("all"), tChicken + 0.05, 0.2, { o: [1, 0] }, "lin");
  tw(G("bilao"), tBilaoTab + 0.1, 0.4, { o: [0, 1], y: [16, 0] });

  // cart rows
  const rows = page.querySelector("[data-rows]");
  const items = [];
  const addRow = (name, img, price, t) => {
    const y = items.length * 64;
    const r = el(`<div class="abs" style="left:0;right:0;top:${y}px;display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f1e5d6">
      <div class="photo" style="width:46px;height:46px;border-radius:10px;flex:none"><img src="${photoUrl(img)}"></div>
      <div style="flex:1;min-width:0"><div style="font:700 14px Inter;color:#3a0000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div><div style="font-size:12px;color:#8a5a5a">Qty 1</div></div><b style="color:#3a0000">${peso(price)}</b></div>`);
    rows.appendChild(r);
    tw(r, t, 0.45, { o: [0, 1], x: [24, 0] }, "back");
    V.cue(t, "tick");
    items.push([t, price]);
  };
  const cardsAll = G("all").querySelectorAll(".dish");
  const tCP = w(id, "board") - 0.2, tLS = w(id, "tap") - 0.05;
  cur.to(S.start, 600, 500).click(tCP, cardsAll[0].querySelector("[data-add]")).click(tLS, cardsAll[1].querySelector("[data-add]"));
  addRow("Crispy Pata", "crispy_pata", 680, tCP + 0.1);
  addRow("Lumpiang Shanghai", "lumpia2", 280, tLS + 0.1);
  cur.click(tChicken, tab(3));
  // variant modal: fried chicken
  const tFC = w(id, "choose") - 0.45;
  cur.click(tFC, G("chicken").querySelectorAll(".dish")[0].querySelector("[data-add]"));
  const vm = (title, img, opts) => el(`<div class="fill"><div class="overlay" data-ov></div><div class="modal" data-m style="left:390px;top:70px;width:500px">
    <div class="photo" style="height:170px"><img src="${photoUrl(img)}"></div>
    <div style="padding:18px 24px 22px"><div class="eyebrow">Choose an option</div><div style="font:700 26px Georgia;color:#3a0000;margin:6px 0 14px">${title}</div>
    <div style="display:grid;gap:9px">${opts.map(([l, p], i) => `<div class="radio" data-o="${i}" style="justify-content:flex-start"><i></i><span style="flex:1">${l}</span><b style="color:#b70100">${p}</b></div>`).join("")}</div>
    <div class="btn btn--red btn--block" data-addto style="margin-top:14px">${I("plus", 16, 2.5)} Add to order</div></div></div></div>`);
  const m1 = vm("Fried Chicken", "fried_chicken", [["Half", "₱210"], ["Whole", "₱420"]]);
  view.appendChild(m1);
  modalIn(m1.querySelector("[data-ov]"), m1.querySelector("[data-m]"), tFC + 0.2);
  const tHalf = w(id, "half") - 0.2, tWhole = w(id, "whole") - 0.3;
  cur.on(tHalf, m1.querySelector('[data-o="0"]'));
  cls(m1.querySelector('[data-o="0"]'), tHalf, "on", tWhole);
  cur.click(tWhole, m1.querySelector('[data-o="1"]'));
  cls(m1.querySelector('[data-o="1"]'), tWhole, "on");
  const tAdd1 = tWhole + 0.4;
  cur.click(tAdd1, m1.querySelector("[data-addto]"));
  modalOut(m1.querySelector("[data-ov]"), m1.querySelector("[data-m]"), tAdd1 + 0.15);
  addRow("Fried Chicken (Whole)", "fried_chicken", 420, tAdd1 + 0.25);
  // bilao
  cur.click(tBilaoTab, tab(2));
  const tBC = w(id, "bilao") + 0.05;
  cur.click(tBC, G("bilao").querySelectorAll(".dish")[0].querySelector("[data-add]"));
  const m2 = vm("Canton Bilao", "pancit_bilao", [["XS (3–5 pax)", "₱430"], ["Small (8–10 pax)", "₱580"], ["Med (12–15 pax)", "₱780"], ["Large (18–20 pax)", "₱950"]]);
  view.appendChild(m2);
  view.appendChild(cur.el);
  modalIn(m2.querySelector("[data-ov]"), m2.querySelector("[data-m]"), tBC + 0.2);
  const o = (i) => m2.querySelector(`[data-o="${i}"]`);
  const t3 = w(id, "three") - 0.1, t20 = w(id, "twenty") - 0.05, tMed = w(id, "guests") + 0.1;
  cur.on(t3, o(0)).on(t20, o(3)).click(tMed, o(2));
  cls(o(0), t3, "hov-row", t20); cls(o(3), t20, "hov-row", tMed);
  cls(o(2), tMed, "on");
  const tAdd2 = tMed + 0.5;
  cur.click(tAdd2, m2.querySelector("[data-addto]"));
  modalOut(m2.querySelector("[data-ov]"), m2.querySelector("[data-m]"), tAdd2 + 0.15);
  addRow("Canton Bilao (Med)", "pancit_bilao", 780, tAdd2 + 0.25);
  // totals
  const sub = page.querySelector("[data-sub]"), tot = page.querySelector("[data-total]"), nEl = page.querySelector("[data-n]");
  V.hook((t) => {
    let prev = 0, v = 0, n = 0;
    for (const [ts, p] of items) if (t >= ts) { const k = Math.min(1, (t - ts) / 0.45); v = prev + p * (1 - Math.pow(1 - k, 3)); prev += p; n++; }
    sub.textContent = peso(v); tot.textContent = peso(v + 60); nEl.textContent = `${n} item${n === 1 ? "" : "s"}`;
  });
  tw(tot, w(id, "totals") - 0.1, 0.25, { s: [1, 1.15] }); tw(tot, w(id, "totals") + 0.3, 0.4, { s: [1.15, 1] });
  const fee = page.querySelector("[data-feerow]");
  V.hook((t) => { fee.style.background = t >= w(id, "sixty") - 0.2 ? "#ffe9a8" : "transparent"; });
  // callouts
  const call = (x, y, icon, title, sub, t) => {
    const c = el(`<div class="callout" style="left:${x}px;top:${y}px;width:290px"><b>${I(icon)}</b><div>${title}<small>${sub}</small></div></div>`);
    root.appendChild(c); tw(c, t, 0.6, { o: [0, 1], y: [20, 0], s: [0.9, 1] }, "back"); V.cue(t, "pop");
  };
  call(26, 300, "layers", "10 menu categories", "Noodles, bilao, chicken, pork, seafood…", w(id, "Browse"));
  call(26, 470, "sliders", "Half or Whole", "Variant picker on every dish", w(id, "half") - 0.2);
  call(1604, 300, "users", "Bilao for 3–20 guests", "XS, Small, Medium, Large", w(id, "bilao") + 0.1);
  call(1604, 470, "truck", "Flat ₱60 delivery fee", "Totals calculated live", w(id, "sixty") - 0.2);
});

/* ---------------- S09 · QR payment ---------------- */
SCENES.push(function s09() {
  const { tw, w, cls, swap } = V; const { el, sceneEl, I, browser, header, phone, modalIn, fadeUp, pop, show, fadeOut, photoUrl } = C;
  const id = "s09_payment";
  const root = sceneEl(id, "bg-cream");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern pattern--dark"></div>`));
  const b = browser("/delivery/order", 70, 140);
  root.appendChild(b);
  const view = b.querySelector(".browser__view");
  view.appendChild(el(`<div class="page app">${header({ on: 2, user: "Maria Santos" })}<div class="hero hero--sm" style="padding:20px 40px"><h1 style="font-size:32px;margin:0 0 4px">Order Delivery</h1><p style="font-size:15px">Enjoy Capitol favorites at home.</p></div><div style="height:600px"></div></div>`));
  const ov = el(`<div class="overlay"></div>`);
  const m = el(`<div class="modal" style="left:110px;top:24px;width:1060px;height:706px">
    <div class="modal__head"><div class="modal__icon">${I("truck")}</div><div><div class="eyebrow">Capitol Restaurant</div><h3>Delivery details</h3></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;padding:20px 28px">
      <div style="display:grid;gap:12px;align-content:start">
        <div style="font:800 12px Inter;letter-spacing:.12em;color:#8a5a5a;text-transform:uppercase">Contact information</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label class="field"><span>Full name</span><div class="input">Maria Santos</div></label><label class="field"><span>Phone</span><div class="input">0917 555 0123</div></label></div>
        <div style="font:800 12px Inter;letter-spacing:.12em;color:#8a5a5a;text-transform:uppercase;margin-top:6px">Delivery</div>
        <label class="field"><span>Saved addresses</span><div class="input select">${I("home", 16)}&nbsp; Home — 1520 F.B. Harrison St., Pasay City</div></label>
        <label class="field"><span>Notes</span><div class="input input--area">Please call when you arrive at the gate.</div></label>
        <div class="card" style="padding:14px 16px;box-shadow:none;background:#fdf9f1"><div style="display:flex;justify-content:space-between;font-size:14px;color:#6b4646"><span>4 items · subtotal</span><b>₱2,160</b></div><div style="display:flex;justify-content:space-between;font-size:14px;color:#6b4646;margin-top:6px"><span>Delivery fee</span><b>₱60</b></div><div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px"><b style="color:#3a0000">Total</b><span style="font:800 26px Inter;color:#b70100">₱2,220</span></div></div>
      </div>
      <div style="display:grid;gap:12px;align-content:start">
        <div style="font:800 12px Inter;letter-spacing:.12em;color:#8a5a5a;text-transform:uppercase">Payment method</div>
        ${[["qr", "QR Ph", "Scan with GCash, Maya, or any bank app", "qr", "Instant"], ["card", "Credit / Debit Card", "Visa, Mastercard", "card", ""], ["cod", "Cash on delivery", "Pay the rider at your door", "cash", ""]].map(([k, t, s, ic, tag]) => `
        <div class="radio" data-pay="${k}" style="padding:16px 16px;align-items:center"><i></i><span style="width:42px;height:42px;border-radius:10px;background:#fdf0e6;color:#640000;display:grid;place-items:center">${I(ic, 22)}</span><span style="flex:1"><b style="display:block;font-size:16px;color:#3a0000">${t}</b><small style="font-weight:500;color:#8a5a5a;font-size:13px">${s}</small></span>${tag ? `<span class="pill pill--confirmed">${tag}</span>` : ""}</div>`).join("")}
        <div class="btn btn--red btn--block" data-paybtn style="margin-top:8px;padding:16px;font-size:16px">${I("lock", 17)} Pay ₱2,220 securely</div>
        <div style="text-align:center;font-size:12.5px;color:#a58a77">${I("shield", 13)} Payments are encrypted and verified automatically.</div>
      </div></div>
    <div data-qr class="abs" style="left:0;right:0;top:92px;bottom:0;background:#fff;display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:26px 40px">
      <div style="display:grid;justify-items:center;align-content:start">
        <div style="font:800 13px Inter;letter-spacing:.18em;color:#8a5a5a">SCAN TO PAY</div>
        <div style="position:relative;margin-top:14px;padding:22px;border-radius:20px;border:2px solid #f0e3d2;background:#fff;box-shadow:0 14px 30px rgba(100,0,0,.08)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><b style="font:900 18px Inter;color:#0b3a8c;letter-spacing:.02em">QR<span style="color:#d0201a">Ph</span></b><span style="font:600 12px Inter;color:#8a5a5a">Capitol Restaurant</span></div>
          <div style="position:relative;width:300px;height:300px"><img src="assets/qr.svg" style="width:300px;height:300px">
            <div class="abs" style="left:115px;top:115px;width:70px;height:70px;border-radius:14px;background:#fff;display:grid;place-items:center;box-shadow:0 0 0 4px #fff"><img src="assets/brand/logo-mark-300.png" style="width:62px"></div>
            <div data-paid class="abs" style="inset:-8px;border-radius:12px;background:rgba(255,255,255,.94);display:grid;place-items:center;align-content:center;text-align:center"><div style="width:96px;height:96px;border-radius:50%;background:#1f7a4d;color:#fff;display:grid;place-items:center;margin:0 auto" data-paidic>${I("check", 54, 3)}</div><div style="font:800 24px Inter;color:#1f7a4d;margin-top:14px">Payment received</div></div></div></div>
        <div style="margin-top:14px;font-size:14px;color:#8a5a5a" data-exp>Code expires in 09:59</div></div>
      <div style="align-self:center">
        <div style="font-size:14px;color:#8a5a5a">Amount due</div><div style="font:800 54px/1.1 Inter;color:#3a0000">₱2,220.00</div>
        <div style="margin:6px 0 20px;color:#6b4646;font-size:15px">Order <b>CAP-1050</b> · Capitol Restaurant</div>
        <div style="font:800 12px Inter;letter-spacing:.12em;color:#8a5a5a;text-transform:uppercase;margin-bottom:10px">Works with</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px">${["GCash", "Maya", "BPI", "BDO", "UnionBank", "Any QR Ph app"].map((x, i) => `<span class="chip" data-w="${i}" style="box-shadow:none">${x}</span>`).join("")}</div>
        <div data-status style="margin-top:22px;display:flex;align-items:center;gap:10px;font:600 15px Inter;color:#6b4646"><span style="width:12px;height:12px;border-radius:50%;background:#e9b23c;box-shadow:0 0 0 5px rgba(233,178,60,.2)" data-dot></span><span data-st>Waiting for payment…</span></div>
      </div></div></div>`);
  view.append(ov, m);
  modalIn(ov, m, S.start + 0.1);
  const cur = V.cursor(view);
  const tQR = w(id, "QR") - 0.3;
  cur.to(S.start, 900, 500).click(tQR, '[data-pay="qr"]');
  cls(m.querySelector('[data-pay="qr"]'), tQR, "on");
  const tPay = w(id, "Ph") + 0.15;
  cur.click(tPay, "[data-paybtn]");
  const qr = m.querySelector("[data-qr]");
  tw(qr, tPay + 0.25, 0.45, { o: [0, 1], x: [30, 0] });
  V.cue(tPay + 0.25, "whoosh");
  tw(cur.el, tPay + 0.5, 0.3, { o: [1, 0] }, "lin");
  // countdown
  const exp = m.querySelector("[data-exp]");
  V.hook((t) => { const s = Math.max(0, 599 - Math.floor(Math.max(0, t - tPay))); exp.textContent = `Code expires in ${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; });
  const chipOn = (i, t, t1) => { const c = m.querySelector(`[data-w="${i}"]`); V.hook((tt) => { const on = tt >= t && tt < t1; c.style.background = on ? "#640000" : "#fff"; c.style.color = on ? "#ffefc1" : "#640000"; }); };
  chipOn(0, w(id, "GCash") - 0.1, w(id, "Maya") - 0.1);
  chipOn(1, w(id, "Maya") - 0.1, w(id, "any") - 0.1);
  chipOn(5, w(id, "any") - 0.1, w(id, "verified"));
  // phone
  const ph = phone(1450, 130);
  root.appendChild(ph);
  const tPh = w(id, "scan") - 0.4;
  tw(ph, tPh, 0.9, { o: [0, 1], x: [120, 0], r: [8, -4] }, "out");
  const body = ph.querySelector(".phone__body");
  const scr1 = el(`<div class="fill" style="background:#111">
    <div class="abs" style="left:0;right:0;top:16px;text-align:center;color:#fff;font:700 17px Inter">Scan QR Ph</div>
    <div class="abs" style="left:46px;top:140px;width:280px;height:280px;border-radius:20px;overflow:hidden;background:#fff;opacity:.95"><img src="assets/qr.svg" style="width:240px;height:240px;margin:20px"></div>
    <div class="abs" style="left:36px;top:130px;width:300px;height:300px;border-radius:24px;box-shadow:0 0 0 2000px rgba(0,0,0,.55);border:4px solid #fff"></div>
    <div class="abs" data-line style="left:50px;top:140px;width:272px;height:3px;background:#4fd1a5;box-shadow:0 0 14px #4fd1a5"></div>
    <div class="abs" style="left:0;right:0;top:470px;text-align:center;color:rgba(255,255,255,.8);font:500 15px Inter">Align the QR code within the frame</div></div>`);
  const scr2 = el(`<div class="fill" style="background:#f4f6fb">
    <div style="background:#1652c4;color:#fff;padding:22px 22px 70px"><div style="font:700 15px Inter;opacity:.85">Send payment</div><div style="font:800 15px Inter;margin-top:16px;opacity:.85">To</div><div style="font:800 22px Inter">Capitol Restaurant</div><div style="font:500 13px Inter;opacity:.8">QR Ph · Pasay City</div></div>
    <div style="margin:-50px 18px 0;background:#fff;border-radius:18px;padding:22px;box-shadow:0 10px 30px rgba(0,0,0,.1)"><div style="color:#667;font:600 13px Inter">Amount</div><div style="font:800 40px Inter;color:#111">₱2,220.00</div>
      <div style="display:flex;justify-content:space-between;margin-top:14px;font-size:14px;color:#556"><span>Reference</span><b>CAP-1050</b></div><div style="display:flex;justify-content:space-between;margin-top:8px;font-size:14px;color:#556"><span>Fee</span><b>Free</b></div></div>
    <div data-paynow class="abs" style="left:18px;right:18px;bottom:60px;height:56px;border-radius:14px;background:#1652c4;color:#fff;display:grid;place-items:center;font:800 18px Inter">Pay ₱2,220.00</div></div>`);
  const scr3 = el(`<div class="fill" style="background:#fff;display:grid;place-items:center;align-content:center;text-align:center">
    <div data-okc style="width:110px;height:110px;border-radius:50%;background:#1f9d55;color:#fff;display:grid;place-items:center;margin:0 auto">${I("check", 60, 3)}</div>
    <div style="font:800 26px Inter;color:#111;margin-top:22px">Payment successful</div><div style="color:#667;margin-top:6px;font-size:15px">₱2,220.00 sent to Capitol Restaurant</div>
    <div style="margin-top:26px;padding:10px 16px;border-radius:10px;background:#f1f5f9;color:#445;font:600 13px Inter">Ref. CAP-1050 · ${"Oct 8, 2026 · 5:04 PM"}</div></div>`);
  body.append(scr1, scr2, scr3);
  tw(scr1.querySelector("[data-line]"), tPh + 0.4, 1.6, { y: [0, 270] }, "io");
  tw(scr1.querySelector("[data-line]"), tPh + 2.0, 1.6, { y: [270, 0] }, "io");
  const tConf = w(id, "banking") - 0.1;
  tw(scr2, tConf, 0.45, { o: [0, 1], x: [60, 0] });
  const tTap = w(id, "payment") - 0.15;
  const tap = el(`<div class="tap"></div>`); body.appendChild(tap);
  const pp = V.center(body, scr2.querySelector("[data-paynow]"));
  tap.style.left = pp.x - 27 + "px"; tap.style.top = pp.y - 27 + "px";
  tw(tap, tTap - 0.3, 0.3, { o: [0, 1], s: [1.4, 1] }); tw(tap, tTap + 0.15, 0.3, { o: [1, 0], s: [1, 1.6] });
  V.cue(tTap, "click");
  tw(scr3, tTap + 0.35, 0.4, { o: [0, 1] }, "lin");
  tw(scr3.querySelector("[data-okc]"), tTap + 0.4, 0.6, { s: [0.3, 1] }, "back");
  const tVer = w(id, "verified") - 0.1;
  const paid = m.querySelector("[data-paid]");
  tw(paid, tVer, 0.35, { o: [0, 1] }, "lin");
  tw(m.querySelector("[data-paidic]"), tVer, 0.6, { s: [0.3, 1] }, "back");
  V.cue(tVer, "ding");
  swap(m.querySelector("[data-st]"), [[0, "Waiting for payment…"], [tVer, "Payment verified · order sent to the kitchen"]]);
  const dot = m.querySelector("[data-dot]");
  V.hook((t) => { dot.style.background = t >= tVer ? "#1f7a4d" : "#e9b23c"; });
  // cash on delivery callout
  const cod = el(`<div class="callout" style="left:500px;top:880px;width:520px"><b style="background:#640000">${I("cash")}</b><div>Prefer cash? Choose Cash on delivery<small>Pay the rider when your food arrives</small></div></div>`);
  root.appendChild(cod);
  tw(cod, w(id, "Prefer") - 0.1, 0.6, { o: [0, 1], y: [24, 0] }, "back");
  V.cue(w(id, "Prefer") - 0.1, "pop");
  const mockTag = el(`<div class="abs" style="left:1460px;top:70px;font:700 14px Inter;letter-spacing:.14em;color:#8a5a5a;text-transform:uppercase">Your banking app</div>`);
  root.appendChild(mockTag); show(mockTag, tPh + 0.4);
});

/* ---------------- S10 · Tracking & bookings ---------------- */
SCENES.push(function s10() {
  const { tw, w, cls, swap, type } = V; const { el, sceneEl, I, browser, header, copy, copyIn, deviceIn, modalIn, modalOut, fadeUp, pop, show, fadeOut, photoUrl } = C;
  const id = "s10_tracking";
  const root = sceneEl(id, "bg-cream");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern pattern--dark"></div>`));
  const cp = copy({ x: 90, y: 240, kicker: "Track &amp; manage", title: "Know exactly <em>where it is.</em>",
    features: ["A reference for every order", "Live status from kitchen to door", "Route map to your address", "Cancel or move bookings online"] });
  root.appendChild(cp);
  copyIn(cp, S.start + 0.3, [w(id, "reference"), w(id, "preparing"), w(id, "map"), w(id, "cancel")]);
  const b = browser("/delivery/order", 570, 140);
  root.appendChild(b);
  const view = b.querySelector(".browser__view");
  // confirmation page
  const p1 = el(`<div class="page app">${header({ on: 2, user: "Maria Santos" })}
    <div style="height:684px;display:grid;place-items:center;background:linear-gradient(135deg,#fdf6e3,#f6e6cc)"><div class="card" style="width:620px;padding:40px;text-align:center;border-radius:20px">
      <div style="width:76px;height:76px;border-radius:50%;background:#e3f4ea;color:#1f7a4d;display:grid;place-items:center;margin:0 auto">${I("check", 40, 3)}</div>
      <div class="eyebrow" style="margin-top:18px">Order confirmed</div><h1 style="margin:10px 0 6px;font:700 40px Georgia;color:#3a0000">Thank you, Maria.</h1>
      <p style="color:#8a5a5a;margin:0 0 22px">Your Capitol delivery request has been added to the order queue.</p>
      <div style="border:2px dashed #e2cfb6;border-radius:14px;padding:16px"><div class="eyebrow" style="color:#8a5a5a">Your tracking reference</div><div style="font:800 44px Inter;color:#b70100;letter-spacing:.04em;margin-top:6px" data-ref>CAP-1050</div></div>
      <div class="btn btn--red" data-track style="margin-top:20px">${I("pin", 17)} Track this order</div></div></div></div>`);
  view.appendChild(p1);
  tw(p1.querySelector("[data-ref]"), w(id, "reference") - 0.1, 0.6, { s: [0.8, 1], o: [0, 1] }, "back");
  // profile page
  const steps = [["Preparing", "5:10 PM"], ["Ready for pickup", "5:42 PM"], ["Out for delivery", "5:58 PM"], ["Delivered", "Waiting for previous step"]];
  const p2 = el(`<div class="page app">${header({ user: "Maria Santos" })}
    <div style="display:grid;grid-template-columns:370px 1fr;gap:20px;padding:20px 26px">
      <div style="display:grid;gap:16px;align-content:start">
        <div class="card" style="padding:18px 20px"><div class="eyebrow">Account</div><div style="font:700 24px Georgia;color:#3a0000;margin:6px 0 10px">Maria Santos</div>
          <div style="display:grid;grid-template-columns:70px 1fr;gap:6px;font-size:14px;color:#6b4646"><span style="color:#a58a77">Email</span><span>maria.santos@gmail.com</span><span style="color:#a58a77">Phone</span><span>0917 555 0123</span></div></div>
        <div class="card" data-bk style="padding:16px 18px"><div style="font:700 20px Georgia;color:#3a0000;margin-bottom:10px">My bookings</div>
          ${[["Function room reservation", "Wedding Reception · Room A", "Dec 12, 2026 · 6:00 PM · 50 guests", "confirmed", "Confirmed", "banquet"], ["Catering booking", "Packed meals · 50 packs", "Oct 24, 2026 · 11:00 AM · Delivery", "pending", "Pending", "lechon_kawali"]].map(([k, t, d, pc, pl, img], i) => `
          <div data-b="${i}" style="display:flex;gap:12px;padding:10px 0;border-top:1px solid #f1e5d6"><div class="photo" style="width:56px;height:56px;border-radius:10px;flex:none"><img src="${photoUrl(img)}"></div>
          <div style="flex:1"><div style="font-size:11px;font-weight:800;letter-spacing:.1em;color:#a58a77;text-transform:uppercase">${k}</div><div style="font:700 14.5px Inter;color:#3a0000">${t}</div><div style="font-size:12.5px;color:#8a5a5a">${d}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><span class="pill pill--${pc}">${pl}</span><span data-chg style="font:700 12.5px Inter;color:#b70100">Request a change →</span></div></div></div>`).join("")}</div></div>
      <div class="card" style="padding:18px 22px;align-self:start">
        <div style="font:700 22px Georgia;color:#3a0000">Track your delivery</div>
        <div style="display:flex;gap:10px;margin-top:12px"><label class="field" style="flex:1"><div class="input focus" data-in><span data-code></span></div></label><span class="btn btn--red" data-go>${I("search", 16)} Track</span></div>
        <div data-res>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px"><div style="background:#fdf6e3;border-radius:10px;padding:10px 14px"><div style="font-size:12px;color:#8a5a5a">Booking reference</div><b style="font-size:18px;color:#3a0000">CAP-1050</b></div><div style="background:#fdf6e3;border-radius:10px;padding:10px 14px"><div style="font-size:12px;color:#8a5a5a">Estimated arrival</div><b style="font-size:18px;color:#3a0000">6:45 PM</b></div></div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px;position:relative">
            <div class="abs" style="left:12%;right:12%;top:17px;height:4px;background:#efe2d1;border-radius:2px"></div><div class="abs" data-prog style="left:12%;width:76%;top:17px;height:4px;background:#b70100;border-radius:2px;transform-origin:0 50%"></div>
            ${steps.map(([s, at], i) => `<div data-st="${i}" style="position:relative;text-align:center"><div data-dot style="width:38px;height:38px;border-radius:50%;margin:0 auto;display:grid;place-items:center;background:#fff;border:3px solid #efe2d1;color:#c9ad8f">${I(["utensils", "check", "bike", "home"][i], 17)}</div><div style="font:700 13px Inter;color:#3a0000;margin-top:6px">${s}</div><div style="font-size:11.5px;color:#a58a77">${at}</div></div>`).join("")}</div>
          <div data-map style="margin-top:14px;height:300px;border-radius:14px;overflow:hidden;position:relative;background:#eef0e4">${mapSVG()}</div>
        </div></div></div></div>`);
  view.appendChild(p2);
  const cur = V.cursor(view);
  const tTr = w(id, "Track") - 0.35;
  cur.to(S.start, 700, 500).click(tTr, "[data-track]");
  tw(p2, tTr + 0.2, 0.5, { o: [0, 1], x: [60, 0] });
  swap(b.querySelector(".urlpath"), [[0, "/delivery/order"], [tTr + 0.2, "/profile"]]);
  type(p2.querySelector("[data-code]"), tTr + 0.45, "CAP-1050", 26);
  const tGo = tTr + 0.9;
  cur.click(tGo, "[data-go]");
  const res = p2.querySelector("[data-res]");
  tw(res, tGo + 0.15, 0.4, { o: [0, 1], y: [10, 0] });
  const prog = p2.querySelector("[data-prog]");
  const stT = [w(id, "preparing"), w(id, "ready"), w(id, "out")];
  V.hook((t) => {
    let k = 0;
    stT.forEach((ts, i) => { if (t >= ts) k = i; });
    const frac = t < stT[0] ? 0 : (k / 3) + Math.min(1, (t - stT[k]) / 0.5) * 0;
    prog.style.transform = `scaleX(${t < stT[0] ? 0 : k / 3})`;
    p2.querySelectorAll("[data-st]").forEach((e, i) => {
      const d = e.querySelector("[data-dot]");
      const done = i < 3 && t >= stT[i];
      const active = i === 2 && t >= stT[2];
      d.style.background = done ? (active ? "#b70100" : "#1f7a4d") : "#fff";
      d.style.borderColor = done ? (active ? "#b70100" : "#1f7a4d") : "#efe2d1";
      d.style.color = done ? "#fff" : "#c9ad8f";
      d.style.boxShadow = active ? `0 0 0 ${6 + 4 * Math.abs(Math.sin(t * 3))}px rgba(183,1,0,.18)` : "none";
    });
  });
  stT.forEach((t) => V.cue(t, "tick"));
  // map animation
  const route = p2.querySelector("[data-route]"), rider = p2.querySelector("[data-rider]");
  const L = 900;
  const tMap = w(id, "live") - 0.2;
  tw(p2.querySelector("[data-map]"), tMap - 0.2, 0.5, { s: [0.97, 1], o: [0.4, 1] });
  V.hook((t) => {
    const k = Math.max(0, Math.min(1, (t - tMap) / 1.2));
    route.style.strokeDashoffset = String(L * (1 - k));
    const len = route.getTotalLength();
    const r = Math.max(0, Math.min(1, (t - tMap - 1.0) / 6)) * 0.62;
    const p = route.getPointAtLength(len * r);
    rider.setAttribute("transform", `translate(${p.x},${p.y})`);
  });
  // bookings + change request
  const tBk = w(id, "bookings") - 0.2;
  const bk = p2.querySelector("[data-bk]");
  tw(bk, tBk, 0.4, { s: [1, 1.03] }, "out"); tw(bk, tBk + 0.6, 0.4, { s: [1.03, 1] });
  V.hook((t) => { bk.style.boxShadow = t >= tBk && t < tBk + 2.5 ? "0 0 0 3px rgba(183,1,0,.3), 0 10px 30px rgba(100,0,0,.12)" : ""; });
  const tChg = w(id, "request") - 0.25;
  cur.click(tChg, p2.querySelector('[data-b="1"] [data-chg]'));
  const cm = el(`<div class="fill"><div class="overlay" data-ov></div><div class="modal" data-m style="left:330px;top:40px;width:620px;height:660px">
    <div class="modal__head"><div class="modal__icon">${I("edit")}</div><div><div class="eyebrow">Booking BK-7F3A21</div><h3>Request a change</h3></div></div>
    <div style="padding:18px 24px;display:grid;gap:12px">
      <div class="field"><span>What do you need?</span><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="radio" data-c1><i></i>Cancel this booking</div><div class="radio" data-c2><i></i>Move to another date</div></div></div>
      <div data-mv style="zoom:.86">${calHTML({ y: 2026, m: 9, past: range(1, 9), res: [17, 18, 25, 31] })}</div>
      <div class="btn btn--red btn--block" data-send>${I("send", 16)} Send request</div></div></div></div>`);
  view.appendChild(cm);
  view.appendChild(cur.el);
  modalIn(cm.querySelector("[data-ov]"), cm.querySelector("[data-m]"), tChg + 0.2);
  const tCan = w(id, "cancel") - 0.15, tMove = w(id, "move") - 0.1;
  cur.on(tCan, "[data-c1]");
  cls(cm.querySelector("[data-c1]"), tCan, "on", tMove);
  cur.click(tMove, "[data-c2]");
  cls(cm.querySelector("[data-c2]"), tMove, "on");
  const mv = cm.querySelector("[data-mv]");
  tw(mv, tMove + 0.1, 0.4, { o: [0.35, 1] });
  const nd = mv.querySelector('[data-d="30"]');
  const tNew = w(id, "date") - 0.1;
  cur.click(tNew, nd);
  cls(nd, tNew, "sel");
  const tSend = w(id, "clicks") - 0.05;
  cur.click(tSend, "[data-send]");
  modalOut(cm.querySelector("[data-ov]"), cm.querySelector("[data-m]"), tSend + 0.25);
  const toast = el(`<div class="toast" style="left:420px;top:650px">${I("check")} Change request sent to Capitol’s team</div>`);
  view.appendChild(toast);
  tw(toast, tSend + 0.35, 0.4, { o: [0, 1], y: [14, 0] }, "back");
  V.cue(tSend + 0.35, "ding");
});

/** Stylised Pasay street map with route from Capitol to the customer. */
function mapSVG() {
  const roads = [
    ["M-20 70 L860 40", 16, "Gil Puyat Ave"], ["M-20 250 L860 230", 14, "EDSA"], ["M120 -20 L160 320", 13, "Roxas Blvd"],
    ["M420 -20 L440 320", 13, "Taft Ave"], ["M640 -20 L610 320", 11, "F.B. Harrison St"], ["M-20 160 L860 140", 9, ""], ["M280 -20 L300 320", 8, ""], ["M760 -20 L760 320", 8, ""],
  ];
  return `<svg viewBox="0 0 800 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display:block">
    <rect width="800" height="300" fill="#ecefe2"/>
    ${Array.from({ length: 40 }, (_, i) => `<rect x="${(i % 10) * 82 + 6}" y="${Math.floor(i / 10) * 78 + 8}" width="68" height="56" rx="6" fill="${i % 7 === 0 ? "#d9ead0" : "#e2e5d6"}"/>`).join("")}
    <path d="M-10 290 C120 260 200 300 330 285 S600 300 820 270" stroke="#b9d7ea" stroke-width="22" fill="none"/>
    ${roads.map(([d, wdt]) => `<path d="${d}" stroke="#fff" stroke-width="${wdt}" fill="none" stroke-linecap="round"/>`).join("")}
    ${roads.filter((r) => r[2]).map(([d, , n], i) => { const m = d.match(/-?\d+/g).map(Number); const x = (m[0] + m[2]) / 2, y = (m[1] + m[3]) / 2; const vert = Math.abs(m[2] - m[0]) < 100; return `<text x="${vert ? x + 10 : x - 40}" y="${vert ? 110 + i * 9 : y - 12}" font-family="Inter" font-size="12" font-weight="600" fill="#7c8270" ${vert ? `transform="rotate(84 ${x + 10} ${110 + i * 9})"` : ""}>${n}</text>`; }).join("")}
    <path data-route d="M150 205 L290 196 L298 150 L432 142 L438 60 L612 48 L622 150 L700 148" stroke="#b70100" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="900" stroke-dashoffset="900"/>
    <g transform="translate(150,205)"><circle r="16" fill="#640000"/><text y="5" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="15" fill="#ffefc1">C</text></g>
    <g transform="translate(700,148)"><path d="M0 -30 C-14 -30 -18 -18 -18 -12 C-18 2 0 14 0 14 C0 14 18 2 18 -12 C18 -18 14 -30 0 -30Z" fill="#1d5fa8"/><circle cy="-13" r="6" fill="#fff"/></g>
    <g data-rider transform="translate(150,205)"><circle r="15" fill="#fff" stroke="#b70100" stroke-width="3"/><g transform="translate(-9,-9) scale(.75)" stroke="#b70100" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></g></g>
    <g font-family="Inter" font-size="12" font-weight="700"><rect x="92" y="226" width="118" height="24" rx="12" fill="#fff"/><text x="151" y="242" text-anchor="middle" fill="#640000">Capitol · Pasay</text>
    <rect x="652" y="160" width="96" height="24" rx="12" fill="#fff"/><text x="700" y="176" text-anchor="middle" fill="#1d5fa8">Home</text></g>
    <g transform="translate(16,16)"><rect width="150" height="30" rx="15" fill="#fff"/><circle cx="18" cy="15" r="5" fill="#1f7a4d"/><text x="32" y="20" font-family="Inter" font-size="12.5" font-weight="700" fill="#1f7a4d">LIVE · rider en route</text></g>
  </svg>`;
}
