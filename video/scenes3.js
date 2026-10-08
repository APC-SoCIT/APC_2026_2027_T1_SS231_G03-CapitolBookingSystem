/* Act 3: AI agent, staff tools, rider, analytics, platform, close, credits. */
window.SCENES = window.SCENES || [];

const STAFF_NAV = { nav: ["Operations", "Delivery", "Menu Items"], user: "Andrea Cruz", role: "Staff", staff: true };
const ADMIN_NAV = { nav: ["Delivery Orders", "Operations", "Dashboard", "Inquiries"], user: "Paolo Reyes", role: "Admin", staff: true };
const MANAGER_NAV = { nav: ["Operations", "Menu Items", "Dashboard"], user: "Liza Gomez", role: "Manager", staff: true };

/* ---------------- S11 · AI assistant on Messenger ---------------- */
SCENES.push(function s11() {
  const { tw, w, cls, swap } = V; const { el, sceneEl, I, phone, copy, copyIn, fadeUp, pop, show } = C;
  const id = "s11_messenger";
  const root = sceneEl(id, "bg-red");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern"></div>`));
  const cp = copy({ x: 800, y: 120, width: 980, light: true, kicker: "AI assistant on Messenger", title: "Answers in seconds. <em>Day and night.</em>" });
  root.appendChild(cp);
  copyIn(cp, S.start + 0.4);

  const ph = phone(250, 140);
  root.appendChild(ph);
  tw(ph, S.start + 0.1, 1.0, { o: [0, 1], y: [60, 0], r: [-4, -2] }, "out");
  const body = ph.querySelector(".phone__body");
  body.appendChild(el(`<div class="abs" style="left:0;right:0;top:0;height:64px;display:flex;align-items:center;gap:10px;padding:0 16px;border-bottom:1px solid #eee;background:#fff;z-index:3">
    <span style="color:#7b5cff;font:700 22px Inter">‹</span><span style="width:40px;height:40px;border-radius:50%;background:#640000;display:grid;place-items:center;overflow:hidden"><img src="assets/brand/logo-mark-300.png" style="width:36px"></span>
    <div><div style="font:700 15.5px Inter;color:#111">Capitol Restaurant</div><div style="font:500 12px Inter;color:#1f9d55">● Typically replies instantly</div></div></div>`));
  const thread = el(`<div class="abs" style="left:0;right:0;top:64px;padding:14px 14px;display:grid;gap:10px;align-content:start"></div>`);
  body.appendChild(thread);
  const bubble = (who, text, label = "") => el(`<div style="display:flex;${who === "me" ? "justify-content:flex-end" : "gap:8px;align-items:flex-end"}">
    ${who === "me" ? "" : `<span style="width:28px;height:28px;border-radius:50%;background:#640000;flex:none;display:grid;place-items:center;overflow:hidden"><img src="assets/brand/logo-mark-300.png" style="width:26px"></span>`}
    <div style="max-width:265px;padding:10px 13px;border-radius:18px;font:500 14.5px/1.4 Inter;${who === "me" ? "background:linear-gradient(135deg,#0a84ff,#7b5cff);color:#fff;border-bottom-right-radius:6px" : "background:#f0f0f2;color:#111;border-bottom-left-radius:6px"}">
    ${label ? `<div style="font:700 11px Inter;color:#7b5cff;margin-bottom:3px;display:flex;align-items:center;gap:4px">${I("spark", 12)} ${label}</div>` : ""}${text}</div></div>`);
  const typing = () => el(`<div style="display:flex;gap:8px;align-items:flex-end"><span style="width:28px;height:28px;border-radius:50%;background:#640000;flex:none"></span><div style="padding:12px 16px;border-radius:18px;background:#f0f0f2;display:flex;gap:5px">${[0, 1, 2].map((i) => `<i data-dot style="width:8px;height:8px;border-radius:50%;background:#999;display:block"></i>`).join("")}</div></div>`);
  const seq = [
    ["me", "Hi po! Available pa po ba yung function room sa Dec 20? Wedding po, mga 45 guests.", w(id, "Not") - 0.2],
    ["typing", "", w(id, "website") - 0.2, w(id, "answers") - 0.2],
    ["bot", "Magandang araw po, at salamat sa pagmemensahe sa Capitol Restaurant! Maaari po bang malaman ang preferred na oras at contact number ninyo? Ipapasa po namin sa staff ang pag-confirm ng availability.", w(id, "answers") - 0.2, "Capitol AI Assistant"],
    ["me", "6 PM po. 0917 555 0123. How much po for 45 pax?", w(id, "English") - 0.1],
    ["typing", "", w(id, "Filipino") + 0.1, w(id, "inquiry") - 0.1],
    ["bot", "Thank you po! Pricing is handled by our staff, who will review your request and reply here with the details as soon as possible.", w(id, "inquiry") - 0.1, "Capitol AI Assistant"],
  ];
  seq.forEach(([who, text, t0, extra]) => {
    if (who === "typing") {
      const tp = typing(); thread.appendChild(tp);
      const t1 = extra;
      V.hook((t) => { tp.style.display = t >= t0 && t < t1 ? "flex" : "none"; tp.querySelectorAll("[data-dot]").forEach((d, i) => (d.style.opacity = String(0.35 + 0.65 * Math.max(0, Math.sin((t * 6) - i))))); });
      return;
    }
    const bb = bubble(who, text, who === "bot" ? extra : "");
    thread.appendChild(bb);
    V.hook((t) => { bb.style.display = t >= t0 ? "flex" : "none"; });
    tw(bb, t0, 0.4, { o: [0, 1], y: [14, 0], s: [0.96, 1] }, "back");
    V.cue(t0, who === "me" ? "send" : "pop");
  });
  // analysis panel
  const panel = el(`<div class="abs" style="left:800px;top:330px;width:980px;height:600px;border-radius:22px;background:#fffaf0;box-shadow:0 40px 90px rgba(0,0,0,.4);overflow:hidden">
    <div style="display:flex;align-items:center;gap:12px;padding:20px 26px;background:#3a0000;color:#ffefc1"><span style="width:40px;height:40px;border-radius:12px;background:#ffefc1;color:#640000;display:grid;place-items:center">${I("bot", 22)}</span>
      <div><div style="font:700 20px Georgia">Live inquiry analysis</div><div style="font:500 13px Inter;opacity:.7">Every Messenger conversation, structured for staff</div></div><span class="badge-live" style="margin-left:auto;background:rgba(255,239,193,.15);color:#ffefc1">Live</span></div>
    <div style="display:grid;grid-template-columns:1.15fr 1fr;gap:26px;padding:22px 26px">
      <div><div style="font:800 12px Inter;letter-spacing:.14em;color:#8a5a5a;text-transform:uppercase;margin-bottom:10px">Details collected</div>
        <div style="display:grid;gap:9px">${[["Inquiry type", "Function Room", "type"], ["Language", "Filipino · English", "lang"], ["Event", "Wedding reception", "f0"], ["Date", "December 20, 2026", "f1"], ["Guests", "45", "f2"], ["Preferred time", "6:00 PM", "f3"], ["Contact", "0917 555 0123", "f4"]].map(([k, v, key]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-radius:10px;background:#fff;border:1px solid #f0e3d2"><span style="color:#8a5a5a;font-size:14.5px">${k}</span><b data-v="${key}" style="font-size:15.5px;color:#3a0000">${v}</b></div>`).join("")}</div></div>
      <div><div style="font:800 12px Inter;letter-spacing:.14em;color:#8a5a5a;text-transform:uppercase;margin-bottom:10px">Confidence</div>
        <div style="height:12px;border-radius:6px;background:#f0e3d2;overflow:hidden"><div data-conf style="height:100%;width:96%;background:linear-gradient(90deg,#b70100,#e9b23c);transform-origin:0 50%"></div></div><div style="font:800 26px Inter;color:#3a0000;margin-top:6px" data-confv>0%</div>
        <div data-hand style="margin-top:16px;padding:14px 16px;border-radius:12px;background:#fff3d6;border:1px solid #f4d48a"><div style="font:800 13px Inter;color:#9a6400;display:flex;gap:8px;align-items:center">${I("users", 16)} HANDOVER TO STAFF</div><div style="font-size:14.5px;color:#5a3a3a;margin-top:4px">Guest asked for a price — staff will reply.</div></div>
        <div style="font:800 12px Inter;letter-spacing:.14em;color:#8a5a5a;text-transform:uppercase;margin:18px 0 10px">Guardrails</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">${[["No price quotes", "shield"], ["No date promises", "cal"], ["Never asks for card or OTP", "lock"]].map(([g, ic], i) => `<span class="chip" data-g="${i}" style="font-size:14px;padding:8px 12px">${I(ic, 15)} ${g}</span>`).join("")}</div>
      </div></div>
    <div style="position:absolute;left:26px;bottom:16px;font:600 12.5px Inter;color:#a58a77;display:flex;gap:6px;align-items:center">${I("spark", 14)} Powered by Google Gemini · staff review every draft</div></div>`);
  root.appendChild(panel);
  tw(panel, w(id, "assistant") - 0.3, 0.8, { o: [0, 1], y: [40, 0] }, "out");
  const val = (k) => panel.querySelector(`[data-v="${k}"]`);
  const reveal = (k, t) => { const e = val(k); V.hook((tt) => { e.style.opacity = tt >= t ? "1" : "0"; }); tw(e, t, 0.4, { x: [12, 0] }); };
  reveal("lang", w(id, "Filipino"));
  reveal("type", w(id, "sorts"));
  ["f0", "f1", "f2", "f3", "f4"].forEach((k, i) => reveal(k, w(id, "gathers") + i * 0.22));
  const conf = panel.querySelector("[data-conf]");
  tw(conf, w(id, "sorts"), 0.9, { sx: [0, 1] });
  V.count(panel.querySelector("[data-confv]"), w(id, "sorts"), 0.9, 0, 96, (v) => (v < 0.5 ? "Analyzing…" : `${Math.round(v)}% · function_room`));
  tw(panel.querySelector("[data-hand]"), w(id, "never") - 0.1, 0.5, { o: [0, 1], s: [0.95, 1] }, "back");
  [w(id, "price"), w(id, "date"), w(id, "keep")].forEach((t, i) => pop(panel.querySelector(`[data-g="${i}"]`), t - 0.15));
});

/* ---------------- S12 · Inquiry Bot inbox ---------------- */
SCENES.push(function s12() {
  const { tw, w, cls, swap, type } = V; const { el, sceneEl, I, browser, header, deviceIn, modalIn, modalOut, fadeUp, pop, show, fadeOut } = C;
  const id = "s12_inbox";
  const root = sceneEl(id, "bg-cream");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern pattern--dark"></div>`));
  const b = browser("/inquiry-bot", 320, 140);
  root.appendChild(b);
  deviceIn(b, S.start + 0.05);
  const view = b.querySelector(".browser__view");
  const rows = [
    ["Ana Dizon", "Function Room", "Hi po! Available pa po ba yung function room sa Dec 20? Wedding po…", "new", "New", "2m"],
    ["Paolo Lim", "Catering", "Buffet for 80 guests on Nov 28 — what packages do you have?", "new", "New", "18m"],
    ["Mark Villanueva", "Unanswered Question", "Do you have parking for around 20 cars?", "new", "New", "41m"],
    ["Grace Tan", "Delivery", "Order CAP-1047 — can the rider call when outside?", "progress", "In progress", "1h"],
    ["Jessa Cruz", "General", "Thank you po sa food! Sobrang sarap ng crispy pata.", "resolved", "Resolved", "3h"],
  ];
  const page = el(`<div class="page app">${header({ ...ADMIN_NAV, on: 3 })}
    <div style="padding:22px 30px">
      <div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:16px"><div><div class="eyebrow">Capitol Restaurant · Messenger</div><div style="font:700 32px Georgia;color:#3a0000;margin-top:6px">Inquiry Bot</div><small style="color:#8a5a5a">Replies you send here go straight to the guest’s Messenger.</small></div>
        <span class="btn btn--ghost" style="padding:10px 16px">${I("refresh", 15)} Refresh</span></div>
      <div class="card" style="overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px"><div><div class="eyebrow">From Messenger</div><div style="font:700 21px Georgia;color:#3a0000;margin-top:4px;display:flex;gap:8px;align-items:center">${I("bot", 20)} <span data-need>3 inquiries need a reply</span></div></div>
          <div class="search" style="width:300px">${I("search")} Search message, type, reply…</div></div>
        <div style="display:flex;gap:8px;padding:0 20px 14px;align-items:center">${[["Needs reply", 3], ["Requests", 4], ["Resolved", 18], ["All", 25]].map(([f, n], i) => `<span class="tab" data-f="${i}">${f} <b style="opacity:.6;margin-left:4px">${n}</b></span>`).join("")}<span style="width:1px;height:26px;background:#ead9c4;margin:0 6px"></span><span class="tab">All types ▾</span></div>
        <div class="table-head" style="grid-template-columns:200px 170px 1fr 130px 70px">${["Guest", "Type", "Message", "Status", "Recv."].map((h) => `<span>${h}</span>`).join("")}</div>
        <div data-rows style="position:relative;height:345px">${rows.map(([n, ty, msg, pc, pl, ago], i) => `
          <div class="row" data-r="${i}" style="position:absolute;left:0;right:0;top:${i * 69}px;grid-template-columns:200px 170px 1fr 130px 70px">
            <div style="display:flex;gap:10px;align-items:center"><span style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#0a84ff,#7b5cff);color:#fff;display:grid;place-items:center;font:700 13px Inter">${n[0]}</span><strong>${n}</strong></div>
            <span><span class="pill" style="background:#f6ecdf;color:#640000">${ty}</span></span>
            <span style="color:#5a3a3a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:16px">${msg}</span>
            <span data-pill><span class="pill pill--${pc}">${pl}</span></span><span style="color:#a58a77">${ago}</span></div>`).join("")}</div></div></div></div>`);
  view.appendChild(page);
  const R = (i) => page.querySelector(`[data-r="${i}"]`);
  rows.forEach((_, i) => tw(R(i), w(id, "lands") + i * 0.12, 0.45, { o: [0, 1], x: [24, 0] }));
  const cur = V.cursor(view);
  const tF = w(id, "filter") - 0.1;
  cur.to(S.start, 800, 400).click(tF, '[data-f="0"]');
  V.hook((t) => page.querySelectorAll("[data-f]").forEach((e, i) => e.classList.toggle("on", t >= tF ? i === 0 : i === 3)));
  tw(R(3), tF + 0.1, 0.3, { o: [1, 0] }, "lin"); tw(R(4), tF + 0.1, 0.3, { o: [1, 0] }, "lin");
  V.cue(tF, "tick");
  const tRow = w(id, "read") - 0.35;
  cur.click(tRow, R(0), { fx: 0.4 });
  V.hook((t) => R(0).classList.toggle("hl", t >= tRow - 0.6));
  const m = el(`<div class="fill"><div class="overlay" data-ov></div><div class="modal" data-m style="left:150px;top:30px;width:980px;height:690px">
    <div class="modal__head"><div class="modal__icon" style="background:#eef0ff;color:#5b5bd6">${I("msg")}</div><div><div class="eyebrow">Reply on Messenger</div><h3>Ana Dizon</h3></div><span class="pill pill--new" style="margin-left:auto" data-st>New</span></div>
    <div style="display:grid;grid-template-columns:1fr 340px;gap:22px;padding:18px 24px">
      <div><div style="font:800 12px Inter;letter-spacing:.14em;color:#8a5a5a;text-transform:uppercase;margin-bottom:10px">Conversation</div>
        <div style="display:grid;gap:9px;background:#faf7f2;border-radius:14px;padding:14px;height:300px">
          <div style="justify-self:end;max-width:80%;padding:9px 13px;border-radius:16px;background:linear-gradient(135deg,#0a84ff,#7b5cff);color:#fff;font-size:14px;line-height:1.4">Hi po! Available pa po ba yung function room sa Dec 20? Wedding po, mga 45 guests.</div>
          <div style="max-width:80%;padding:9px 13px;border-radius:16px;background:#ececf0;font-size:14px;line-height:1.4"><b style="color:#7b5cff;font-size:11px">AI ASSISTANT</b><br>Magandang araw po! Maaari po bang malaman ang preferred na oras at contact number ninyo?</div>
          <div style="justify-self:end;max-width:80%;padding:9px 13px;border-radius:16px;background:linear-gradient(135deg,#0a84ff,#7b5cff);color:#fff;font-size:14px;line-height:1.4">6 PM po. 0917 555 0123. How much po for 45 pax?</div>
          <div data-mine style="justify-self:end;max-width:86%;padding:9px 13px;border-radius:16px;background:#640000;color:#ffefc1;font-size:14px;line-height:1.4"><b style="font-size:11px;opacity:.7">YOU · CAPITOL STAFF</b><br>Hi Ana! Function Room A is open on Dec 20 at 6 PM. Reserve it at capitolrestaurant.com and we’ll send our wedding packages.</div></div>
        <label class="field" style="margin-top:12px"><span>Your reply</span><div class="input input--area focus" style="height:96px" data-ta><span data-reply></span></div></label></div>
      <div style="display:grid;gap:9px;align-content:start"><div style="font:800 12px Inter;letter-spacing:.14em;color:#8a5a5a;text-transform:uppercase">Collected by the AI</div>
        ${[["Type", "Function Room"], ["Event", "Wedding"], ["Date", "Dec 20, 2026"], ["Guests", "45"], ["Time", "6:00 PM"], ["Contact", "0917 555 0123"]].map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:9px 12px;border-radius:9px;border:1px solid #f0e3d2;font-size:14px"><span style="color:#8a5a5a">${k}</span><b style="color:#3a0000">${v}</b></div>`).join("")}
        <div class="btn btn--red btn--block" data-send style="margin-top:10px">${I("send", 16)} Send reply</div>
        <div class="btn btn--ghost btn--block">${I("check", 16)} Mark resolved</div></div></div></div></div>`);
  view.appendChild(m);
  view.appendChild(cur.el);
  modalIn(m.querySelector("[data-ov]"), m.querySelector("[data-m]"), tRow + 0.2);
  V.cue(tRow + 0.2, "whoosh");
  const reply = "Hi Ana! Function Room A is open on Dec 20 at 6 PM. Reserve it at capitolrestaurant.com and we’ll send our wedding packages.";
  const tType = w(id, "answer") - 0.6;
  type(m.querySelector("[data-reply]"), tType, reply, 75);
  const tSend = w(id, "leaving") - 0.1;
  cur.click(tSend, "[data-send]");
  const mine = m.querySelector("[data-mine]");
  V.hook((t) => { mine.style.display = t >= tSend + 0.1 ? "block" : "none"; });
  tw(mine, tSend + 0.1, 0.4, { o: [0, 1], y: [10, 0] }, "back");
  V.hook((t) => { if (t >= tSend + 0.1) m.querySelector("[data-reply]").textContent = ""; });
  swap(m.querySelector("[data-st]"), [[0, "New"], [tSend + 0.2, "Replied"]]);
  V.hook((t) => { m.querySelector("[data-st]").className = t >= tSend + 0.2 ? "pill pill--resolved" : "pill pill--new"; });
  const toast = el(`<div class="toast" style="left:470px;top:665px">${I("check")} Reply sent on Messenger</div>`);
  view.appendChild(toast);
  tw(toast, tSend + 0.25, 0.4, { o: [0, 1], y: [14, 0] }, "back");
  V.cue(tSend + 0.15, "send");
  const call = (x, y, icon, title, sub, t) => { const c = el(`<div class="callout" style="left:${x}px;top:${y}px;width:290px"><b>${I(icon)}</b><div>${title}<small>${sub}</small></div></div>`); root.appendChild(c); tw(c, t, 0.6, { o: [0, 1], y: [20, 0], s: [0.9, 1] }, "back"); };
  call(26, 320, "bot", "Every chat, one inbox", "Messenger inquiries saved automatically", w(id, "Inquiry") - 0.2);
  call(1604, 320, "sliders", "Smart filters", "Needs reply · Requests · Resolved", w(id, "filter"));
  call(1604, 500, "send", "Reply without switching apps", "Sent straight to Messenger", w(id, "answer"));
});

/* ---------------- S13 · Operations board + print ---------------- */
SCENES.push(function s13() {
  const { tw, w, cls, swap, count } = V; const { el, sceneEl, I, browser, header, deviceIn, modalIn, modalOut, fadeUp, pop, show, fadeOut } = C;
  const id = "s13_operations";
  const root = sceneEl(id, "bg-cream");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern pattern--dark"></div>`));
  const b = browser("/operations", 150, 140);
  root.appendChild(b);
  deviceIn(b, S.start + 0.05);
  const view = b.querySelector(".browser__view");
  const stats = [["truck", "Active deliveries", 7, "Not delivered", "Active"], ["building", "Function pending", 3, "12 total bookings", "pending", true], ["utensils", "Catering pending", 4, "9 total", "catering", true], ["clipboard", "Open inquiries", 3, "Need reply", "open", true], ["clipboard", "Total orders", 42, "₱38,450 total", "Click"]];
  const fr = [["BK-4C2E91", "Ana Dizon", "0917 555 0188", "Wedding Reception · 50 guests", "Room A", "Dec 12 · 6:00 PM", "pending", "Pending"], ["BK-9A1D07", "Ramon Uy", "0918 222 4410", "Corporate Event · 35 guests", "Room B", "Nov 6 · 2:00 PM", "confirmed", "Confirmed"], ["BK-2B6F55", "Celine Ong", "0927 880 1203", "Debut / 18th Birthday · 48 guests", "Room A", "Nov 21 · 5:30 PM", "pending", "Pending"]];
  const ct = [["BK-7F3A21", "Maria Santos", "Packed meals · 50 packs", "Oct 24 · 11:00 AM", "pending", "Pending"], ["BK-5E0C88", "Dela Cruz family", "Buffet · Package B", "Oct 31 · 12:00 PM", "confirmed", "Confirmed"]];
  const page = el(`<div class="page app">${header({ ...STAFF_NAV, on: 0 })}
    <div style="padding:18px 28px">
      <div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:14px"><div><div class="eyebrow">Capitol Restaurant</div><div style="font:700 30px Georgia;color:#3a0000;margin-top:4px">Today’s overview</div><small style="color:#8a5a5a">Tip: click a row to change package or booking info · Print via modal · 1 sheet A4 portrait</small></div>
        <span class="btn btn--ghost" style="padding:10px 16px">${I("refresh", 15)} Refresh data</span></div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px">${stats.map(([ic, l, v, h, , acc], i) => `<div class="card stat ${acc ? "accent" : ""}" data-s="${i}"><small>${I(ic)} ${l}</small><strong data-v>0</strong><em>${h}</em></div>`).join("")}</div>
      <div class="card" style="overflow:hidden;margin-bottom:14px"><div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px"><div style="font:700 20px Georgia;color:#3a0000">Function room bookings</div><div class="search" style="width:280px">${I("search")} Search name, event, ref…</div></div>
        <div class="table-head" style="grid-template-columns:220px 1fr 190px 130px 90px"><span>Booking</span><span>Guest / Event</span><span>When</span><span>Status</span><span>Action</span></div>
        ${fr.map(([id_, n, p, ev, room, when, pc, pl], i) => `<div class="row" data-fr="${i}" style="grid-template-columns:220px 1fr 190px 130px 90px"><div><strong>${id_}</strong><small>${n} · ${p}</small></div><div>${ev}<small>Function ${room}</small></div><span>${when}</span><span data-pill><span class="pill pill--${pc}">${pl}</span></span><span style="color:#b70100;font-weight:700">View →</span></div>`).join("")}</div>
      <div class="card" style="overflow:hidden"><div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px"><div style="font:700 20px Georgia;color:#3a0000">Catering bookings</div><div style="display:flex;gap:8px"><span class="tab on">All kinds</span><span class="tab">Buffet</span><span class="tab">Packed</span></div></div>
        ${ct.map(([id_, n, k, when, pc, pl]) => `<div class="row" style="grid-template-columns:220px 1fr 190px 130px 90px"><div><strong>${id_}</strong><small>${n}</small></div><div>${k}</div><span>${when}</span><span><span class="pill pill--${pc}">${pl}</span></span><span style="color:#b70100;font-weight:700">View →</span></div>`).join("")}</div>
    </div></div>`);
  view.appendChild(page);
  const statT = [w(id, "Active"), w(id, "pending"), w(id, "catering"), w(id, "open"), w(id, "glance") - 0.3];
  stats.forEach(([, , v], i) => {
    const c = page.querySelector(`[data-s="${i}"]`);
    count(c.querySelector("[data-v]"), statT[i], 0.8, 0, v);
    tw(c, statT[i] - 0.1, 0.5, { s: [0.92, 1], o: [0.4, 1] }, "back");
    V.cue(statT[i], "tick");
  });
  // detail modal
  const cur = V.cursor(view);
  const tRow = w(id, "Click") - 0.1;
  cur.to(S.start, 700, 300).click(tRow, '[data-fr="0"]', { fx: 0.3 });
  V.hook((t) => page.querySelector('[data-fr="0"]').classList.toggle("hl", t >= tRow - 0.5));
  const m = el(`<div class="fill"><div class="overlay" data-ov></div><div class="modal" data-m style="left:190px;top:34px;width:900px;height:680px">
    <div class="modal__head"><div class="modal__icon">${I("building")}</div><div><div class="eyebrow">Function room booking</div><h3>BK-4C2E91 · Ana Dizon</h3></div><span style="margin-left:auto" data-pill2><span class="pill pill--pending">Pending</span></span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;padding:20px 26px">
      ${[["Customer", "Ana Dizon"], ["Phone", "0917 555 0188"], ["Email", "ana.dizon@gmail.com"], ["Event type", "Wedding Reception"], ["Guests", "50"], ["Function Room", "Function Room A"], ["Date", "Saturday, Dec 12, 2026"], ["Time", "6:00 PM"]].map(([k, v]) => `<label class="field"><span>${k}</span><div class="input ${["Event type", "Function Room", "Time"].includes(k) ? "select" : ""}">${v}</div></label>`).join("")}
      <label class="field"><span>Status</span><div class="input select" data-status><span data-stv>Pending</span></div></label>
      <label class="field" style="grid-column:1/-1"><span>Special requests</span><div class="input input--area">Round tables with floral centerpieces, 2 high chairs, and a small stage for the program.</div></label></div>
    <div style="display:flex;justify-content:flex-end;gap:12px;padding:6px 26px"><span class="btn btn--ghost" data-print>${I("printer", 16)} Print</span><span class="btn btn--red" data-save>${I("check", 16)} Save changes</span></div></div></div>`);
  view.appendChild(m);
  view.appendChild(cur.el);
  modalIn(m.querySelector("[data-ov]"), m.querySelector("[data-m]"), tRow + 0.2);
  const tSt = w(id, "update") - 0.1;
  cur.click(tSt, "[data-status]");
  const dd = el(`<div class="abs card" style="left:0;top:0;width:260px;padding:6px;z-index:20">${["Pending", "Confirmed", "Completed", "Cancelled"].map((s, i) => `<div data-opt="${i}" style="padding:10px 12px;border-radius:8px;font-size:14.5px">${s}</div>`).join("")}</div>`);
  view.appendChild(dd);
  view.appendChild(cur.el);
  const sp = V.center(view, m.querySelector("[data-status]"));
  dd.style.left = sp.x - 125 + "px"; dd.style.top = sp.y + 26 + "px";
  const tConf = w(id, "confirm") - 0.15;
  show(dd, tSt + 0.1, 0.15); fadeOut(dd, tConf + 0.1, 0.15);
  cur.click(tConf, dd.querySelector('[data-opt="1"]'));
  V.hook((t) => { dd.querySelector('[data-opt="1"]').style.background = t >= tConf - 0.4 ? "#fdecea" : "transparent"; });
  swap(m.querySelector("[data-stv]"), [[0, "Pending"], [tConf + 0.05, "Confirmed"]]);
  V.hook((t) => { m.querySelector("[data-pill2]").innerHTML = t >= tConf + 0.05 ? '<span class="pill pill--confirmed">Confirmed</span>' : '<span class="pill pill--pending">Pending</span>'; });
  const tSave = tConf + 0.45;
  cur.click(tSave, "[data-save]");
  const toast = el(`<div class="toast" style="left:430px;top:660px">${I("check")} BK-4C2E91 confirmed · guest notified</div>`);
  view.appendChild(toast);
  tw(toast, tSave + 0.15, 0.4, { o: [0, 1], y: [14, 0] }, "back"); fadeOut(toast, w(id, "print") + 0.2);
  V.cue(tSave + 0.15, "ding");
  const tPr = w(id, "print") - 0.25;
  cur.click(tPr, "[data-print]");
  // A4 print sheet
  const sheet = el(`<div class="abs" style="left:1280px;top:110px;width:600px;height:850px;background:#fff;border-radius:4px;box-shadow:0 40px 90px rgba(40,0,0,.35);padding:46px 50px;font-family:Inter;color:#1a0a0a;transform-origin:50% 50%">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #640000;padding-bottom:16px"><img src="assets/brand/wordmark-red-600.png" style="width:170px"><div style="text-align:right;font-size:12px;color:#6b4646">Event Sheet · A4<br>Printed Oct 8, 2026</div></div>
    <div style="font:700 26px Georgia;color:#3a0000;margin:22px 0 4px">Function Room Event Sheet</div><div style="color:#8a5a5a;font-size:14px">Ref. BK-4C2E91 · <b style="color:#1f7a4d">CONFIRMED</b></div>
    <table style="width:100%;border-collapse:collapse;margin-top:18px;font-size:14px">${[["Guest", "Ana Dizon · 0917 555 0188"], ["Event", "Wedding Reception"], ["Date &amp; time", "Saturday, Dec 12, 2026 · 6:00 PM"], ["Venue", "Function Room A"], ["Guests", "50"], ["Package", "Buffet · Package C"]].map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#8a5a5a;width:150px">${k}</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600">${v}</td></tr>`).join("")}</table>
    <div style="font:800 12px Inter;letter-spacing:.14em;color:#8a5a5a;margin:22px 0 8px">KITCHEN &amp; SETUP NOTES</div>
    <div style="border:1px solid #eee;border-radius:6px;padding:12px 14px;font-size:14px;line-height:1.55;height:110px">Round tables with floral centerpieces, 2 high chairs, small stage for the program. Serve buffet at 6:30 PM.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:60px;font-size:12.5px;color:#8a5a5a"><div style="border-top:1px solid #999;padding-top:6px">Prepared by: Andrea Cruz</div><div style="border-top:1px solid #999;padding-top:6px">Kitchen lead</div></div></div>`);
  root.appendChild(sheet);
  tw(sheet, tPr + 0.3, 0.9, { o: [0, 1], x: [300, 0], y: [60, 0], r: [10, 3] }, "out");
  V.cue(tPr + 0.3, "paper");
});

/* ---------------- S14 · Delivery queue + menu manager ---------------- */
SCENES.push(function s14() {
  const { tw, w, cls, swap, type } = V; const { el, sceneEl, I, browser, header, copy, copyIn, deviceIn, modalIn, modalOut, fadeUp, pop, show, fadeOut, photoUrl } = C;
  const id = "s14_fleet";
  const root = sceneEl(id, "bg-cream");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern pattern--dark"></div>`));
  const cp = copy({ x: 1395, y: 150, width: 470, kicker: "Delivery &amp; menu", title: "Assign. Update. <em>Done.</em>",
    features: ["One queue for every order", "Assign riders in a click", "Add dishes with photos", "Hide categories anytime"] });
  root.appendChild(cp);
  copyIn(cp, S.start + 0.3, [w(id, "queue"), w(id, "assign"), w(id, "upload"), w(id, "hide")]);
  const b = browser("/delivery/staff", 70, 140);
  root.appendChild(b);
  deviceIn(b, S.start + 0.05, -1);
  const view = b.querySelector(".browser__view");
  const riders = [["Jun Reyes", "On delivery · CAP-1048"], ["Carlo Mendoza", "No active delivery"], ["Rico Santos", "On delivery · CAP-1049"]];
  const orders = [["CAP-1050", "Maria Santos", "Crispy Pata, Lumpiang Shanghai +2", "Today · 5:04 PM", "Unassigned", "ready", "Ready for pickup"], ["CAP-1049", "Leo Bautista", "Pancit Canton, Sisig", "Today · 4:41 PM", "Rico Santos", "out", "Out for delivery"], ["CAP-1048", "Joy Manalo", "Canton Bilao (Large)", "Today · 4:12 PM", "Jun Reyes", "out", "Out for delivery"], ["CAP-1047", "Grace Tan", "Fried Chicken (Whole), Yangchow Rice", "Today · 3:30 PM", "Carlo Mendoza", "delivered", "Delivered"]];
  const p1 = el(`<div class="page app">${header({ ...STAFF_NAV, on: 1 })}
    <div style="padding:18px 28px"><div class="eyebrow">Capitol Restaurant</div><div style="font:700 30px Georgia;color:#3a0000;margin:4px 0 14px">Delivery</div>
      <div class="card" style="padding:16px 20px;margin-bottom:14px"><div class="eyebrow">Fleet</div><div style="font:700 20px Georgia;color:#3a0000;margin:4px 0 12px">Delivery riders</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${riders.map(([n, s], i) => `<div data-rc="${i}" style="display:flex;gap:12px;align-items:center;padding:12px;border:1px solid #f0e3d2;border-radius:12px"><span style="width:42px;height:42px;border-radius:50%;background:#fdecea;color:#b70100;display:grid;place-items:center">${I("bike", 20)}</span><div><b style="color:#3a0000">${n}</b><div style="font-size:12.5px;color:#8a5a5a" data-rs>${s}</div></div></div>`).join("")}</div></div>
      <div class="card" style="overflow:hidden"><div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px"><div><div class="eyebrow">Order management</div><div style="font:700 20px Georgia;color:#3a0000;margin-top:4px">Delivery orders</div></div><div class="search" style="width:300px">${I("search")} Search name, address, reference…</div></div>
        <div class="table-head" style="grid-template-columns:170px 1fr 150px 190px 150px"><span>Order</span><span>Items</span><span>When</span><span>Rider</span><span>Status</span></div>
        ${orders.map(([r, n, it, wh, rd, pc, pl], i) => `<div class="row" data-o="${i}" style="grid-template-columns:170px 1fr 150px 190px 150px"><div><strong>${r}</strong><small>${n}</small></div><span style="color:#5a3a3a">${it}</span><span>${wh}</span><span><span class="input select" data-rsel style="height:36px;font-size:13.5px;width:170px">${rd}</span></span><span><span class="pill pill--${pc}">${pl}</span></span></div>`).join("")}</div></div></div>`);
  view.appendChild(p1);
  const cur = V.cursor(view);
  const sel = p1.querySelector('[data-o="0"] [data-rsel]');
  const tOpen = w(id, "assign") - 0.3;
  cur.to(S.start, 700, 300).click(tOpen, sel);
  V.hook((t) => p1.querySelector('[data-o="0"]').classList.toggle("hl", t >= w(id, "queue") - 0.3 && t < w(id, "And") ));
  const dd = el(`<div class="abs card" style="width:220px;padding:6px;z-index:20">${["Unassigned", "Jun Reyes · busy", "Carlo Mendoza · available", "Rico Santos · busy"].map((s, i) => `<div data-opt="${i}" style="padding:9px 12px;border-radius:8px;font-size:14px;${i === 2 ? "font-weight:700" : ""}">${s}</div>`).join("")}</div>`);
  view.appendChild(dd); view.appendChild(cur.el);
  const sp = V.center(view, sel);
  dd.style.left = sp.x - 85 + "px"; dd.style.top = sp.y + 20 + "px";
  const tPick = w(id, "rider") - 0.05;
  show(dd, tOpen + 0.1, 0.15); fadeOut(dd, tPick + 0.1, 0.15);
  cur.click(tPick, dd.querySelector('[data-opt="2"]'));
  V.hook((t) => { dd.querySelector('[data-opt="2"]').style.background = t >= tPick - 0.4 ? "#fdecea" : "transparent"; });
  swap(sel, [[0, "Unassigned"], [tPick + 0.05, "Carlo Mendoza"]]);
  swap(p1.querySelector('[data-rc="1"] [data-rs]'), [[0, "No active delivery"], [tPick + 0.1, "On delivery · CAP-1050"]]);
  tw(p1.querySelector('[data-rc="1"]'), tPick + 0.1, 0.5, { s: [1.06, 1] }, "back");
  V.cue(tPick, "tick");

  // menu manager
  const items = [["Crispy Pata", "Deep-fried pork knuckle, crackling skin.", "Best Sellers", "₱680", "crispy_pata"], ["Lumpiang Shanghai", "Crisp pork spring rolls.", "Pork", "₱280", "lumpia2"], ["Sisig", "Sizzling chopped pork with egg.", "Pork", "₱290", "sisig"], ["Pancit Canton", "Egg noodles with pork and shrimp.", "Pancit / Noodles", "₱170", "pancit_canton"], ["Fried Chicken (Half)", "Capitol’s classic crispy chicken.", "Chicken", "₱210", "fried_chicken"], ["Yangchow Rice", "Fried rice with egg, ham, shrimp.", "Rice", "₱240", "yangchow"]];
  const rowH = (n, d, c, p, img, extra = "") => `<div class="row" style="grid-template-columns:90px 1fr 200px 110px 100px;min-height:62px;${extra}"><div class="photo" style="width:62px;height:46px;border-radius:8px"><img src="${photoUrl(img)}"></div><div><strong>${n}</strong><small>${d}</small></div><span><span class="pill" style="background:#f6ecdf;color:#640000">${c}</span></span><b style="color:#b70100">${p}</b><span style="display:flex;gap:10px;color:#8a5a5a">${I("edit", 17)}${I("x", 17)}</span></div>`;
  const p2 = el(`<div class="page app">${header({ ...STAFF_NAV, on: 2 })}
    <div style="padding:18px 28px"><div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:14px"><div><div class="eyebrow">Item management</div><div style="font:700 30px Georgia;color:#3a0000;margin-top:4px">Delivery menu items</div></div>
      <div style="display:flex;gap:10px"><span class="btn btn--ghost" data-cats>${I("layers", 16)} Manage Categories</span><span class="btn btn--red" data-addbtn>${I("plus", 16, 2.5)} Add item</span></div></div>
      <div class="card" style="overflow:hidden"><div style="padding:12px 20px"><div class="search">${I("search")} Search by name, description, or category…</div></div>
        <div class="table-head" style="grid-template-columns:90px 1fr 200px 110px 100px"><span>Photo</span><span>Item</span><span>Categories</span><span>Price</span><span>Actions</span></div>
        <div data-new style="height:0;overflow:hidden">${rowH("Pancit Palabok", "Rice noodles in shrimp sauce, topped with egg.", "Pancit / Noodles", "₱200", "palabok", "background:#fff8ec;box-shadow:inset 4px 0 0 #b70100")}</div>
        ${items.map((x) => rowH(...x)).join("")}</div></div></div>`);
  view.appendChild(p2);
  const tM = w(id, "menu") - 0.4;
  tw(p2, tM, 0.5, { o: [0, 1], x: [60, 0] });
  swap(b.querySelector(".urlpath"), [[0, "/delivery/staff"], [tM, "/delivery/items"]]);
  V.cue(tM, "whoosh");
  view.appendChild(cur.el);
  const tAdd = w(id, "add") - 0.3;
  cur.click(tAdd, p2.querySelector("[data-addbtn]"));
  const am = el(`<div class="fill"><div class="overlay" data-ov></div><div class="modal" data-m style="left:240px;top:30px;width:800px;height:690px">
    <div class="modal__head"><div class="modal__icon">${I("plus")}</div><div><div class="eyebrow">Item management</div><h3>Add menu item</h3></div></div>
    <div style="display:grid;grid-template-columns:1fr 280px;gap:22px;padding:20px 26px">
      <div style="display:grid;gap:13px;align-content:start"><label class="field"><span>Item Name</span><div class="input focus" data-nm><span data-name></span></div></label>
        <label class="field"><span>Price (₱)</span><div class="input" data-pr><span data-price></span></div></label>
        <div class="field"><span>Categories</span><div style="display:flex;flex-wrap:wrap;gap:8px">${["Pancit / Noodles", "Pancit sa Bilao", "Best Sellers", "Seafood"].map((c, i) => `<span class="tab" data-cat="${i}">${c}</span>`).join("")}</div></div>
        <label class="field"><span>Description</span><div class="input input--area"><span data-desc></span></div></label></div>
      <div class="field"><span>Dish photo</span><div data-drop style="position:relative;height:250px;border:2px dashed #e2cfb6;border-radius:14px;display:grid;place-items:center;text-align:center;color:#a58a77;overflow:hidden">
        <div>${I("upload", 30)}<div style="font:700 14px Inter;margin-top:8px">Upload dish photo</div><div style="font-size:12px">JPG or PNG</div></div>
        <img data-img class="abs" src="${photoUrl("palabok")}" style="inset:0;width:100%;height:100%;object-fit:cover"></div></div></div>
    <div style="display:flex;justify-content:flex-end;padding:4px 26px"><span class="btn btn--red" data-saveitem>${I("check", 16)} Save item</span></div></div></div>`);
  view.appendChild(am); view.appendChild(cur.el);
  modalIn(am.querySelector("[data-ov]"), am.querySelector("[data-m]"), tAdd + 0.2);
  type(am.querySelector("[data-name]"), tAdd + 0.5, "Pancit Palabok", 22);
  type(am.querySelector("[data-desc]"), tAdd + 0.9, "Rice noodles in shrimp sauce, topped with egg.", 45, false);
  const tCat = tAdd + 0.85;
  V.hook((t) => { am.querySelector('[data-cat="0"]').classList.toggle("on", t >= tCat); am.querySelector('[data-cat="2"]').classList.toggle("on", t >= tCat + 0.35); });
  const tUp = w(id, "upload") - 0.2;
  cur.click(tUp, am.querySelector("[data-drop]"));
  tw(am.querySelector("[data-img]"), tUp + 0.3, 0.6, { o: [0, 1], s: [1.1, 1] });
  V.cue(tUp + 0.3, "pop");
  const tPrice = w(id, "prices") - 0.4;
  cur.click(tPrice, am.querySelector("[data-pr]"));
  cls(am.querySelector("[data-pr]"), tPrice, "focus");
  type(am.querySelector("[data-price]"), tPrice + 0.15, "200", 10);
  const tSave = w(id, "prices") + 0.35;
  cur.click(tSave, am.querySelector("[data-saveitem]"));
  modalOut(am.querySelector("[data-ov]"), am.querySelector("[data-m]"), tSave + 0.2);
  const nw = p2.querySelector("[data-new]");
  V.hook((t) => { const k = Math.max(0, Math.min(1, (t - tSave - 0.3) / 0.4)); nw.style.height = 62 * k + "px"; });
  V.cue(tSave + 0.3, "ding");
  // categories
  const tCats = w(id, "hide") - 0.3;
  cur.click(tCats, p2.querySelector("[data-cats]"));
  const cats = ["Pancit / Noodles", "Pancit sa Bilao", "Chicken", "Kabayo", "Vegetables", "Rice", "Pork", "Best Sellers", "Seafood", "Soup"];
  const cm = el(`<div class="fill"><div class="overlay" data-ov></div><div class="modal" data-m style="left:340px;top:40px;width:600px;height:660px">
    <div class="modal__head"><div class="modal__icon">${I("layers")}</div><div><div class="eyebrow">Category Management</div><h3>Manage Categories</h3></div></div>
    <div style="padding:10px 24px">${cats.map((c, i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #f5ebdf"><b style="color:#3a0000;font-size:15px">${c}</b><span style="display:flex;align-items:center;gap:10px;font-size:12.5px;color:#8a5a5a"><span data-lbl="${i}">Visible</span><span data-sw="${i}" style="width:44px;height:24px;border-radius:12px;background:#1f7a4d;position:relative;display:block"><i style="position:absolute;top:3px;left:23px;width:18px;height:18px;border-radius:50%;background:#fff;display:block"></i></span></span></div>`).join("")}</div></div></div>`);
  view.appendChild(cm); view.appendChild(cur.el);
  modalIn(cm.querySelector("[data-ov]"), cm.querySelector("[data-m]"), tCats + 0.2);
  const sw = cm.querySelector('[data-sw="3"]');
  const tTog = w(id, "categories") + 0.05;
  cur.click(tTog, sw);
  V.hook((t) => { const off = t >= tTog; sw.style.background = off ? "#c9b5a3" : "#1f7a4d"; sw.firstElementChild.style.left = off ? "3px" : "23px"; cm.querySelector('[data-lbl="3"]').innerHTML = off ? `${I("eyeoff", 13)} Hidden` : "Visible"; });
  modalOut(cm.querySelector("[data-ov]"), cm.querySelector("[data-m]"), w(id, "customer") - 0.2);
  // live customer menu inset
  tw(cp, w(id, "customer") - 0.4, 0.4, { o: [1, 0.0] }, "lin");
  const inset = el(`<div class="abs card" style="left:1395px;top:250px;width:450px;padding:0;overflow:hidden;border-radius:18px;box-shadow:0 30px 70px rgba(60,0,0,.25)">
    <div style="background:#640000;color:#ffefc1;padding:14px 18px;display:flex;justify-content:space-between;align-items:center"><b style="font:700 16px Georgia">Customer menu</b><span class="badge-live" style="background:rgba(255,239,193,.15);color:#ffefc1">Updated live</span></div>
    <div style="padding:16px"><div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap"><span class="tab on" style="font-size:12.5px;padding:7px 11px">Pancit / Noodles</span><span class="tab" style="font-size:12.5px;padding:7px 11px">Chicken</span><span class="tab" style="font-size:12.5px;padding:7px 11px;text-decoration:line-through;opacity:.45">Kabayo</span></div>
      ${dishCard("Pancit Palabok", "₱200", "palabok", "Rice noodles in shrimp sauce, topped with egg.", '<span class="pill" style="position:absolute;left:10px;top:10px;background:#b70100;color:#fff">NEW</span>')}</div></div>`);
  root.appendChild(inset);
  tw(inset, w(id, "customer") - 0.1, 0.7, { o: [0, 1], y: [40, 0], s: [0.94, 1] }, "back");
  V.cue(w(id, "customer") - 0.1, "pop");
});

/* ---------------- S15 · Rider app ---------------- */
SCENES.push(function s15() {
  const { tw, w, cls, swap } = V; const { el, sceneEl, I, phone, copy, copyIn, fadeUp, pop, show } = C;
  const id = "s15_rider";
  const root = sceneEl(id, "bg-cream");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern pattern--dark"></div>`));
  const cp = copy({ x: 90, y: 300, kicker: "Rider app", title: "Every stop. <em>One tap.</em>", text: "A mobile workspace for riders — and real-time updates for every guest." });
  root.appendChild(cp);
  copyIn(cp, S.start + 0.3);
  const ph = phone(640, 130);
  root.appendChild(ph);
  tw(ph, S.start + 0.1, 0.9, { o: [0, 1], y: [60, 0] }, "out");
  const body = ph.querySelector(".phone__body");
  body.appendChild(el(`<div class="fill app" style="background:#fdf6e3">
    <div style="background:linear-gradient(135deg,#3a0000,#640000);padding:14px 18px 18px;color:#ffefc1"><div style="font:700 11px Inter;letter-spacing:.16em;opacity:.7">DELIVERY RIDER</div><div style="font:700 26px Georgia;margin-top:4px">My deliveries</div><div style="font-size:12.5px;opacity:.7;margin-top:2px">Carlo Mendoza · Today</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px">${[["Active", "2"], ["Out", "1"], ["Done", "5"]].map(([k, v], i) => `<div style="background:rgba(255,239,193,.12);border-radius:10px;padding:8px 10px"><div style="font:800 22px Inter" data-k="${i}">${v}</div><div style="font-size:11px;opacity:.75">${k}</div></div>`).join("")}</div></div>
    <div style="padding:14px 14px 0"><div class="eyebrow">Assignments</div><div style="font:700 19px Georgia;color:#3a0000;margin:4px 0 10px">Today’s route</div>
      <div class="card" data-c1 style="padding:14px"><div style="display:flex;justify-content:space-between;align-items:center"><b style="color:#3a0000;font-size:16px">CAP-1050</b><span data-p1><span class="pill pill--out">Out for delivery</span></span></div>
        <div data-cust style="margin-top:8px;font-size:13.5px;color:#5a3a3a;line-height:1.5;border-radius:8px;padding:4px 6px;margin-left:-6px"><b>Maria Santos</b> · 0917 555 0123<br>${I("pin", 13)} 1520 F.B. Harrison St., Pasay City</div>
        <div style="font-size:12.5px;color:#8a5a5a;margin-top:6px">4 items · ₱2,220 · <b style="color:#1f7a4d">Paid via QR Ph</b></div>
        <div class="btn btn--red btn--block" data-mark style="margin-top:12px;padding:12px">${I("check", 16)} Mark delivered</div></div>
      <div class="card" style="padding:14px;margin-top:10px;opacity:.8"><div style="display:flex;justify-content:space-between"><b style="color:#3a0000">CAP-1052</b><span class="pill pill--ready">Ready for pickup</span></div><div style="font-size:13px;color:#8a5a5a;margin-top:6px">Leo Bautista · Malibay, Pasay City</div></div></div></div>`));
  const cust = body.querySelector("[data-cust]");
  V.hook((t) => { cust.style.background = t >= w(id, "customer") - 0.1 && t < w(id, "customer") + 1.4 ? "#ffe9a8" : "transparent"; });
  const tTap = w(id, "one-tap") - 0.1;
  const tap = el(`<div class="tap"></div>`); body.appendChild(tap);
  const pp = V.center(body, body.querySelector("[data-mark]"));
  tap.style.left = pp.x - 27 + "px"; tap.style.top = pp.y - 27 + "px";
  tw(tap, tTap - 0.3, 0.3, { o: [0, 1], s: [1.4, 1] }); tw(tap, tTap + 0.15, 0.3, { o: [1, 0], s: [1, 1.6] });
  V.cue(tTap, "click");
  V.hook((t) => {
    const done = t >= tTap;
    body.querySelector("[data-p1]").innerHTML = done ? '<span class="pill pill--delivered">Delivered</span>' : '<span class="pill pill--out">Out for delivery</span>';
    const mk = body.querySelector("[data-mark]");
    mk.className = done ? "btn btn--ghost btn--block" : "btn btn--red btn--block";
    mk.innerHTML = done ? `${I("check", 16)} Delivered at 6:41 PM` : `${I("check", 16)} Mark delivered`;
    body.querySelector('[data-k="2"]').textContent = done ? "6" : "5";
    body.querySelector('[data-k="1"]').textContent = done ? "0" : "1";
  });
  // beam + customer phone
  const beam = el(`<div class="abs" style="left:1050px;top:540px;width:180px;height:4px;border-radius:2px;background:linear-gradient(90deg,#b70100,#1f7a4d);transform-origin:0 50%"></div>`);
  const beamLab = el(`<div class="abs" style="left:1050px;top:500px;width:180px;text-align:center"><span class="badge-live" style="background:#fff">Instant update</span></div>`);
  root.append(beam, beamLab);
  tw(beam, tTap + 0.2, 0.5, { sx: [0, 1], o: [0, 1] }); pop(beamLab, tTap + 0.4);
  const ph2 = phone(1240, 130);
  root.appendChild(ph2);
  tw(ph2, S.start + 0.4, 0.9, { o: [0, 1], y: [60, 0] }, "out");
  const b2 = ph2.querySelector(".phone__body");
  const steps = ["Preparing", "Ready for pickup", "Out for delivery", "Delivered"];
  b2.appendChild(el(`<div class="fill app" style="background:#fdf6e3"><div style="background:#640000;padding:12px 18px;display:flex;justify-content:space-between;align-items:center"><img src="assets/brand/wordmark-beige-600.png" style="width:100px"><span style="width:30px;height:30px;border-radius:50%;background:#ffefc1;color:#640000;display:grid;place-items:center;font:700 12px Inter">M</span></div>
    <div style="padding:18px"><div style="font:700 22px Georgia;color:#3a0000">Track your delivery</div><div class="input" style="margin-top:10px">CAP-1050</div>
    <div style="display:flex;justify-content:space-between;margin:14px 0;font-size:13px;color:#8a5a5a"><span>Estimated arrival</span><b style="color:#3a0000" data-eta>6:45 PM</b></div>
    <div style="display:grid;gap:0">${steps.map((s, i) => `<div style="display:flex;gap:12px;align-items:flex-start;min-height:62px"><div style="display:grid;justify-items:center"><span data-sd="${i}" style="width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:${i < 3 ? "#1f7a4d" : "#fff"};border:3px solid ${i < 3 ? "#1f7a4d" : "#efe2d1"};color:#fff">${I("check", 14, 3)}</span>${i < 3 ? `<i style="width:3px;height:30px;background:${i < 2 ? "#1f7a4d" : "#efe2d1"};display:block" data-ln="${i}"></i>` : ""}</div><div><b style="color:#3a0000;font-size:15px">${s}</b><div style="font-size:12px;color:#a58a77" data-st="${i}">${["5:10 PM", "5:42 PM", "5:58 PM", "Waiting for previous step"][i]}</div></div></div>`).join("")}</div></div>
    <div data-notif class="abs" style="left:10px;right:10px;top:8px;background:rgba(255,255,255,.96);border-radius:18px;padding:12px 14px;box-shadow:0 14px 30px rgba(0,0,0,.2);display:flex;gap:10px;align-items:center"><span style="width:38px;height:38px;border-radius:10px;background:#640000;display:grid;place-items:center;flex:none"><img src="assets/brand/logo-mark-300.png" style="width:34px"></span><div style="font-size:13px;line-height:1.35;color:#111"><b>Capitol Restaurant</b><br>Your order CAP-1050 has been delivered. Enjoy your meal!</div></div></div>`));
  const tSee = w(id, "see") - 0.4;
  V.hook((t) => {
    const done = t >= tSee;
    const d = b2.querySelector('[data-sd="3"]'); d.style.background = done ? "#1f7a4d" : "#fff"; d.style.borderColor = done ? "#1f7a4d" : "#efe2d1";
    b2.querySelector('[data-ln="2"]').style.background = done ? "#1f7a4d" : "#efe2d1";
    b2.querySelector('[data-st="3"]').textContent = done ? "6:41 PM" : "Waiting for previous step";
    b2.querySelector("[data-eta]").textContent = done ? "Delivered" : "6:45 PM";
  });
  tw(b2.querySelector('[data-sd="3"]'), tSee, 0.5, { s: [1.5, 1] }, "back");
  tw(b2.querySelector("[data-notif]"), tSee + 0.2, 0.5, { o: [0, 1], y: [-40, 0] }, "back");
  V.cue(tSee + 0.2, "ding");
  const l1 = el(`<div class="abs" style="left:640px;top:968px;width:400px;text-align:center;font:700 15px Inter;letter-spacing:.14em;color:#8a5a5a">RIDER</div>`);
  const l2 = el(`<div class="abs" style="left:1240px;top:968px;width:400px;text-align:center;font:700 15px Inter;letter-spacing:.14em;color:#8a5a5a">GUEST</div>`);
  root.append(l1, l2); show(l1, S.start + 0.8); show(l2, S.start + 1.0);
});

/* ---------------- S16 · Analytics dashboard ---------------- */
SCENES.push(function s16() {
  const { tw, w, cls, count } = V; const { el, sceneEl, I, browser, header, deviceIn, pop } = C;
  const id = "s16_dashboard";
  const root = sceneEl(id, "bg-cream");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern pattern--dark"></div>`));
  const b = browser("/dashboard", 320, 140);
  root.appendChild(b);
  deviceIn(b, S.start + 0.05);
  const view = b.querySelector(".browser__view");
  const COL = { fb: "#640000", web: "#d0453b", other: "#e9b23c" };
  const kpi = [["Total orders", 335, "+18% vs last month"], ["Website", 200, "60% of orders"], ["Facebook", 120, "36% of orders"], ["Inquiries", 20, "12 new · 8 resolved"]];
  // donut
  const tot = 335, segs = [["Facebook", 120, COL.fb], ["Website", 200, COL.web], ["Other", 15, COL.other]];
  const R = 70, Cc = 2 * Math.PI * R;
  let acc = 0;
  const donut = `<svg viewBox="0 0 200 200" width="170" height="170"><circle cx="100" cy="100" r="${R}" fill="none" stroke="#f3e8da" stroke-width="30"/>${segs.map(([n, v, c], i) => { const len = (v / tot) * Cc; const s = `<circle data-seg="${i}" data-len="${len}" data-off="${acc}" cx="100" cy="100" r="${R}" fill="none" stroke="${c}" stroke-width="30" stroke-dasharray="0 ${Cc}" stroke-dashoffset="${-acc}" transform="rotate(-90 100 100)"/>`; acc += len; return s; }).join("")}<text x="100" y="98" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="30" fill="#3a0000">335</text><text x="100" y="120" text-anchor="middle" font-family="Inter" font-size="12" fill="#8a5a5a">orders</text></svg>`;
  const bars = [["Function Room", 30, 50], ["Delivery", 20, 90], ["Catering", 70, 60]];
  const maxB = 140, H = 150;
  const barSVG = `<svg viewBox="0 0 360 190" width="100%" height="190">${[0, 50, 100, 150].map((v) => `<line x1="40" x2="350" y1="${170 - (v / maxB) * H * 0.93}" y2="${170 - (v / maxB) * H * 0.93}" stroke="#f1e5d6"/><text x="32" y="${174 - (v / maxB) * H * 0.93}" text-anchor="end" font-size="11" font-family="Inter" fill="#a58a77">${v}</text>`).join("")}
    ${bars.map(([n, fb, web], i) => { const x = 70 + i * 100, hf = (fb / maxB) * H * 0.93, hw = (web / maxB) * H * 0.93; return `<g data-bar="${i}" style="transform-origin:${x + 25}px 170px"><rect x="${x}" y="${170 - hf}" width="50" height="${hf}" fill="${COL.fb}" rx="2"/><rect x="${x}" y="${170 - hf - hw}" width="50" height="${hw}" fill="${COL.web}" rx="4"/></g><text x="${x + 25}" y="186" text-anchor="middle" font-size="11.5" font-family="Inter" fill="#6b4646">${n}</text>`; }).join("")}</svg>`;
  const pts = [8, 10, 9, 13, 12, 16, 15, 19, 18, 22, 24, 27];
  const pX = (i) => 40 + i * 28, pY = (v) => 160 - v * 5;
  const path = pts.map((v, i) => `${i ? "L" : "M"}${pX(i)} ${pY(v)}`).join(" ");
  const lineSVG = `<svg viewBox="0 0 360 190" width="100%" height="190">${[0, 10, 20, 30].map((v) => `<line x1="40" x2="350" y1="${pY(v)}" y2="${pY(v)}" stroke="#f1e5d6"/><text x="32" y="${pY(v) + 4}" text-anchor="end" font-size="11" font-family="Inter" fill="#a58a77">${v}</text>`).join("")}
    <path data-area d="${path} L${pX(11)} 160 L40 160 Z" fill="rgba(183,1,0,.08)"/><path data-line d="${path}" fill="none" stroke="#b70100" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="600" stroke-dashoffset="600"/>
    ${["Oct 1", "Oct 8", "Oct 15", "Oct 22", "Oct 29"].map((d, i) => `<text x="${40 + i * 77}" y="182" font-size="11" font-family="Inter" fill="#a58a77" text-anchor="middle">${d}</text>`).join("")}<circle data-dot cx="${pX(11)}" cy="${pY(27)}" r="6" fill="#b70100" stroke="#fff" stroke-width="3"/></svg>`;
  const inq = [["New", 12, "#b70100"], ["Resolved", 8, "#1f7a4d"]];
  const page = el(`<div class="page app">${header({ ...MANAGER_NAV, on: 2 })}
    <div style="padding:16px 26px"><div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:12px"><div><div class="eyebrow">Capitol Restaurant</div><div style="font:700 28px Georgia;color:#3a0000;margin-top:4px">Analytics dashboard</div></div><span class="tab on">${"Last 30 days"}</span></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px">${kpi.map(([l, v, h], i) => `<div class="card stat" data-k="${i}" style="padding:13px 18px"><small>${l}</small><strong data-v style="font-size:32px;margin:8px 0 4px">0</strong><em>${h}</em></div>`).join("")}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="card" style="padding:14px 18px;height:236px"><div style="font:700 17px Georgia;color:#640000">Orders by source</div><div style="display:flex;align-items:center;gap:26px;margin-top:6px">${donut}<div style="display:grid;gap:10px">${segs.map(([n, v, c]) => `<div style="display:flex;gap:10px;align-items:center;font-size:14px"><i style="width:14px;height:14px;border-radius:4px;background:${c}"></i><span style="color:#6b4646;width:80px">${n}</span><b style="color:#3a0000">${v}</b></div>`).join("")}</div></div></div>
        <div class="card" style="padding:14px 18px;height:236px"><div style="display:flex;justify-content:space-between"><div style="font:700 17px Georgia;color:#640000">Order types by source</div><div style="display:flex;gap:12px;font-size:12px;color:#6b4646"><span><i style="display:inline-block;width:10px;height:10px;background:${COL.fb};border-radius:2px"></i> Facebook</span><span><i style="display:inline-block;width:10px;height:10px;background:${COL.web};border-radius:2px"></i> Website</span></div></div>${barSVG}</div>
        <div class="card" style="padding:14px 18px;height:236px"><div style="font:700 17px Georgia;color:#640000">Total orders · daily</div>${lineSVG}</div>
        <div class="card" style="padding:14px 18px;height:236px"><div style="font:700 17px Georgia;color:#640000">Inquiries</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:14px">${[...inq, ["Response rate", 94, "#640000"]].map(([l, v, c], i) => `<div style="background:#fdf6e3;border-radius:12px;padding:14px"><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8a5a5a">${l}</div><div style="font:700 34px Georgia;color:${c};margin-top:6px" data-iq="${i}">0</div></div>`).join("")}</div>
          <div style="margin-top:14px;height:12px;border-radius:6px;background:#f0e3d2;overflow:hidden;display:flex"><i data-ib1 style="width:60%;background:#b70100;display:block;transform-origin:0 50%"></i><i data-ib2 style="width:40%;background:#1f7a4d;display:block;transform-origin:0 50%"></i></div><div style="font-size:12.5px;color:#8a5a5a;margin-top:6px">AI assistant answered 61% of Messenger questions instantly</div></div>
      </div></div></div>`);
  view.appendChild(page);
  const tK = w(id, "turns") - 0.2;
  kpi.forEach(([, v], i) => { const c = page.querySelector(`[data-k="${i}"]`); count(c.querySelector("[data-v]"), tK + i * 0.15, 1.0, 0, v); tw(c, tK + i * 0.15, 0.5, { o: [0.3, 1], y: [10, 0] }); });
  const tD = w(id, "Where") - 0.2;
  V.hook((t) => page.querySelectorAll("[data-seg]").forEach((s, i) => { const k = Math.max(0, Math.min(1, (t - tD - i * 0.25) / 0.7)); const e = 1 - Math.pow(1 - k, 3); s.setAttribute("stroke-dasharray", `${+s.dataset.len * e} ${Cc}`); }));
  const tB = w(id, "services") - 0.3;
  bars.forEach((_, i) => tw(page.querySelector(`[data-bar="${i}"]`), tB + i * 0.15, 0.7, { sy: [0, 1] }, "out"));
  const tL = w(id, "demand") - 0.4;
  V.hook((t) => { const k = Math.max(0, Math.min(1, (t - tL) / 1.3)); page.querySelector("[data-line]").setAttribute("stroke-dashoffset", String(600 * (1 - k))); page.querySelector("[data-dot]").style.opacity = k >= 1 ? "1" : "0"; page.querySelector("[data-area]").style.opacity = String(k); });
  const tI = w(id, "inquiry") - 0.2;
  [12, 8, 94].forEach((v, i) => count(page.querySelector(`[data-iq="${i}"]`), tI + i * 0.15, 0.9, 0, v, (x) => Math.round(x) + (i === 2 ? "%" : "")));
  tw(page.querySelector("[data-ib1]"), tI, 0.8, { sx: [0, 1] }); tw(page.querySelector("[data-ib2]"), tI + 0.3, 0.8, { sx: [0, 1] });
  [tK, tD, tB, tL].forEach((t) => V.cue(t, "tick"));
  const call = (x, y, icon, title, sub, t) => { const c = el(`<div class="callout" style="left:${x}px;top:${y}px;width:290px"><b>${I(icon)}</b><div>${title}<small>${sub}</small></div></div>`); root.appendChild(c); tw(c, t, 0.6, { o: [0, 1], y: [20, 0], s: [0.9, 1] }, "back"); };
  call(26, 420, "globe", "Where guests come from", "Website vs Facebook", tD);
  call(1604, 420, "chart", "What they book", "Rooms, catering, delivery", tB);
  call(1604, 600, "zap", "Demand trends", "Daily orders at a glance", tL);
});

/* ---------------- S17 · Roles & platform ---------------- */
SCENES.push(function s17() {
  const { tw, w } = V; const { el, sceneEl, I, fadeUp, pop } = C;
  const id = "s17_platform";
  const root = sceneEl(id, "bg-red");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern"></div>`));
  const head = el(`<div class="abs" style="left:0;right:0;top:100px;text-align:center;color:#fff4d6;font:700 60px/1.1 'Playfair Display'">Everyone sees <em style="color:#ffefc1;font-weight:400">exactly what they need.</em></div>`);
  root.appendChild(head); fadeUp(head, S.start + 0.3, 0.8, 20);
  const roles = [["Customer", "user", ["Book catering &amp; rooms", "Order &amp; pay by QR", "Track orders &amp; bookings"], "Customers"], ["Staff", "clipboard", ["Operations board", "Delivery orders &amp; riders", "Menu items"], "staff"], ["Manager", "chart", ["Analytics dashboard", "Menu management", "Operations report"], "managers"], ["Rider", "bike", ["Today’s route", "Customer details", "One-tap status updates"], "riders"], ["Admin", "shield", ["Every module", "Inquiry Bot inbox", "Full system control"], "admins"]];
  roles.forEach(([n, ic, list, word], i) => {
    const c = el(`<div class="abs" style="left:${122 + i * 340}px;top:250px;width:316px;height:300px;border-radius:20px;background:rgba(255,239,193,.07);border:1px solid rgba(255,239,193,.22);padding:26px">
      <div style="width:58px;height:58px;border-radius:16px;background:#ffefc1;color:#640000;display:grid;place-items:center">${I(ic, 28)}</div>
      <div style="font:700 30px Georgia;color:#fff4d6;margin:16px 0 12px">${n}</div>
      ${list.map((x) => `<div style="display:flex;gap:10px;align-items:center;color:rgba(253,246,227,.85);font:500 17px/1.3 Inter;margin-bottom:9px"><span style="color:#ffefc1">${I("check", 16, 3)}</span>${x}</div>`).join("")}</div>`);
    root.appendChild(c);
    const t = w(id, word) - 0.2;
    tw(c, t, 0.7, { o: [0, 1], y: [50, 0], s: [0.94, 1] }, "back");
    V.cue(t, "pop");
  });
  const rbac = el(`<div class="abs" style="left:122px;top:574px;width:1676px;height:54px;border-radius:14px;background:#ffefc1;color:#640000;display:flex;align-items:center;justify-content:center;gap:12px;font:800 20px Inter;letter-spacing:.06em">${I("lock", 22)} ROLE-BASED ACCESS CONTROL</div>`);
  root.appendChild(rbac);
  tw(rbac, w(id, "role-based") - 0.2, 0.7, { o: [0, 1], sx: [0.3, 1] }, "out");
  const tech = [["db", "Supabase", "PostgreSQL · Auth · Row-level security", "Supabase"], ["zap", "Real-time sync", "Live calendars and order status", "real-time"], ["spark", "Google Gemini", "AI agent for Messenger inquiries", "Gemini"], ["layers", "React + TypeScript", "Fast, responsive web app", "secured"]];
  tech.forEach(([ic, n, sub, word], i) => {
    const c = el(`<div class="abs" style="left:${122 + i * 427}px;top:680px;width:395px;height:140px;border-radius:18px;background:#fffaf0;box-shadow:0 24px 50px rgba(0,0,0,.3);padding:24px;display:flex;gap:18px;align-items:center">
      <div style="width:64px;height:64px;border-radius:18px;background:#640000;color:#ffefc1;display:grid;place-items:center;flex:none">${I(ic, 30)}</div>
      <div><div style="font:700 25px Georgia;color:#3a0000">${n}</div><div style="font:500 15.5px/1.4 Inter;color:#8a5a5a;margin-top:4px">${sub}</div></div></div>`);
    root.appendChild(c);
    const t = w(id, word) - (word === "Gemini" ? 0.7 : 0.2);
    tw(c, t, 0.7, { o: [0, 1], y: [40, 0] }, "back");
    V.cue(t, "pop");
  });
});

/* ---------------- S18 · Close ---------------- */
SCENES.push(function s18() {
  const { tw, w } = V; const { el, sceneEl, I, photoUrl, fadeUp, pop } = C;
  const id = "s18_close";
  const root = sceneEl(id, "bg-dark");
  const S = V.scene(id, root);
  const bg = el(`<div class="fill"><img class="cover" src="${photoUrl("dining")}"></div>`);
  root.appendChild(bg);
  tw(bg, S.start, S.length + 1, { s: [1.12, 1.0], blur: [6, 3] }, "lin");
  root.appendChild(el(`<div class="fill" style="background:radial-gradient(circle at 50% 42%, rgba(100,0,0,.72), rgba(20,0,0,.92))"></div>`));
  root.appendChild(el(`<div class="vignette"></div>`));
  const logo = el(`<img class="abs" src="assets/brand/logo-official-1200.png" style="left:600px;top:190px;width:720px;filter:drop-shadow(0 20px 40px rgba(0,0,0,.6))">`);
  const sub = el(`<div class="abs" style="left:0;right:0;top:470px;text-align:center;color:#ffefc1;font:700 30px/1 Inter;letter-spacing:.55em;text-indent:.55em">BOOKING SYSTEM</div>`);
  const sweepWrap = el(`<div class="abs" style="left:600px;top:190px;width:720px;height:249px;overflow:hidden;-webkit-mask:url(assets/brand/logo-official-1200.png) center/contain no-repeat;mask:url(assets/brand/logo-official-1200.png) center/contain no-repeat"><div data-s class="abs" style="top:0;bottom:0;left:-200px;width:160px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.8),transparent)"></div></div>`);
  root.append(logo, sweepWrap, sub);
  const t0 = w(id, "Capitol") - 0.4;
  tw(logo, t0, 1.2, { o: [0, 1], s: [1.1, 1], blur: [14, 0] });
  tw(sweepWrap.querySelector("[data-s]"), t0 + 0.9, 1.2, { x: [0, 1100] }, "io");
  fadeUp(sub, w(id, "Booking") - 0.1, 0.9, 12);
  V.cue(t0, "boom");
  const tag = el(`<div class="abs" style="left:0;right:0;top:560px;text-align:center;color:#fff4d6;font:italic 400 54px/1.2 'Playfair Display'"><span data-a>86 years of hospitality.</span> <span data-b style="color:#ffefc1">Now one click away.</span></div>`);
  root.appendChild(tag);
  tw(tag.querySelector("[data-a]"), w(id, "Eighty-six") - 0.1, 0.8, { o: [0, 1] }, "lin");
  tw(tag.querySelector("[data-b]"), w(id, "now") - 0.1, 0.8, { o: [0, 1] }, "lin");
  const cta = el(`<div class="abs" style="left:0;right:0;top:690px;text-align:center"><span style="display:inline-flex;align-items:center;gap:14px;padding:22px 40px;border-radius:999px;background:#ffefc1;color:#640000;font:800 26px Inter;box-shadow:0 20px 50px rgba(0,0,0,.4)">Book your next celebration today ${I("arrow", 26, 2.6)}</span></div>`);
  const info = el(`<div class="abs" style="left:0;right:0;top:820px;text-align:center;color:rgba(255,239,193,.8);font:500 22px Inter;letter-spacing:.04em">capitolrestaurant.com &nbsp;·&nbsp; 8556-1313 &nbsp;·&nbsp; 319 Antonio S. Arnaiz Ave, Pasay City</div>`);
  root.append(cta, info);
  tw(cta, w(id, "Book") - 0.2, 0.8, { o: [0, 1], y: [30, 0], s: [0.9, 1] }, "back");
  fadeUp(info, w(id, "celebration"), 0.8, 10);
  V.cue(w(id, "Book") - 0.2, "rise");
});

/* ---------------- S19 · Credits ---------------- */
SCENES.push(function s19() {
  const { tw } = V; const { el, sceneEl, fadeUp } = C;
  const id = "s19_credits";
  const root = sceneEl(id, "bg-dark");
  const S = V.scene(id, root);
  const box = el(`<div class="fill" style="display:grid;place-items:center;text-align:center">
    <div><img src="assets/brand/logo-mark-600.png" style="width:200px;margin:0 auto 26px">
      <div style="color:#fff4d6;font:700 46px 'Playfair Display'">Capitol Booking System</div>
      <div style="color:rgba(255,239,193,.7);font:600 18px Inter;letter-spacing:.3em;margin-top:14px">A VECTOR FOUR PROJECT · SS231</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 70px;margin:40px auto 0;width:820px;color:#fdf6e3;font:500 25px Inter">
        <span>Christian Luis Esguerra</span><span>Moises James Q. Sy</span><span>Suzanne Marie Rosco</span><span>Maria Sophea Balidio</span></div>
      <div style="color:rgba(253,246,227,.55);font:500 18px Inter;margin-top:40px">Asia Pacific College · School of Computing and Information Technologies</div>
      <div style="color:rgba(253,246,227,.4);font:400 14.5px/1.6 Inter;margin-top:34px;max-width:1100px">Food and venue photography from Wikimedia Commons contributors, used under CC BY, CC BY-SA and CC0 licenses (see video/CREDITS.md).<br>Narration is an AI-generated voice. Names, orders and bookings shown are fictional demo data.</div></div></div>`);
  root.appendChild(box);
  fadeUp(box, S.start + 0.4, 1.2, 20);
  const black = el(`<div class="fill" style="background:#000"></div>`);
  root.appendChild(black);
  tw(black, S.start + S.length - 1.2, 1.2, { o: [0, 1] }, "lin");
});
