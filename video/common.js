/* Shared helpers for scene builders. */
(function () {
  const P = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 9.38a1 1 0 0 0-.78-.38H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    bot: '<path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/>',
    msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    eyeoff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>',
    bike: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
    spark: '<path d="M9.94 14.06 4 20M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6Z"/>',
    db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    projector: '<path d="M5 7 3 5M9 6V3M13 7l2-2"/><circle cx="9" cy="13" r="3"/><path d="M11.83 12H20a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2.17M4 20h.01"/><path d="M6.17 12H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h12"/>',
    snow: '<path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>',
    wifi: '<path d="M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.86a10 10 0 0 1 14 0M8.5 16.43a5 5 0 0 1 7 0"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  };
  const I = (name, size = 20, sw = 2) =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${P[name] || ""}</svg>`;

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  const stage = () => document.getElementById("stage");

  function sceneEl(id, cls = "") {
    const s = el(`<section class="scene ${cls}" id="${id}"></section>`);
    stage().appendChild(s);
    return s;
  }

  function browser(url, x, y, scale = 1) {
    const b = el(`<div class="browser" style="left:${x}px;top:${y}px">
      <div class="browser__bar"><div class="dots"><i></i><i></i><i></i></div>
      <div class="url">${I("lock", 13)}<span>capitolrestaurant.com</span><b class="urlpath">${url}</b></div><div style="width:52px"></div></div>
      <div class="browser__view"></div></div>`);
    if (scale !== 1) b.style.zoom = scale;
    return b;
  }

  function phone(x, y, dark = false) {
    return el(`<div class="phone" style="left:${x}px;top:${y}px"><div class="phone__screen" style="background:${dark ? "#000" : "#fff"}">
      <div class="phone__notch"></div>
      <div class="phone__status" style="color:${dark ? "#fff" : "#111"}"><span>9:41</span><span style="display:flex;gap:6px;align-items:center">
      <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5" width="3" height="7" rx="1" fill="currentColor"/><rect x="10" y="2" width="3" height="10" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>
      <svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/><rect x="23.5" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".5"/></svg></span></div>
      <div class="phone__body" style="position:absolute;left:0;right:0;top:50px;bottom:0;overflow:hidden"></div></div></div>`);
  }

  function header({ nav = ["Catering", "Function Rooms", "Delivery"], on = -1, user = null, role = "Customer", staff = false } = {}) {
    const right = user
      ? `<div class="user-badge"><span class="av">${staff ? I("shield", 15) : user[0]}</span><span><strong>${user}</strong><small>${role}</small></span></div>`
      : `<span class="signin-btn">${I("login", 15)} Sign In / Log In</span>`;
    return `<div class="app-header"><div class="brandmark"><img src="assets/brand/wordmark-beige-600.png"><small>Since 1940 · Pasay City</small></div>
      <nav class="app-nav">${nav.map((n, i) => `<a class="${i === on ? "on" : ""}">${n}</a>`).join("")}</nav>${right}</div>`;
  }

  /** Side copy block: kicker, headline (html), paragraph, chips. */
  function copy({ x, y, kicker, title, text = "", chips = [], features = [], light = false, width = 470 }) {
    return el(`<div class="copy ${light ? "copy--light" : ""}" style="left:${x}px;top:${y}px;width:${width}px">
      <div class="kicker"><i></i>${kicker}</div><h2>${title}</h2>${text ? `<p>${text}</p>` : ""}
      ${features.length ? `<div class="feature-list">${features.map((f, i) => `<div class="feature"><b>${I("check", 16, 3)}</b><span>${f}</span></div>`).join("")}</div>` : ""}
      ${chips.length ? `<div class="chips">${chips.map((c) => `<span class="chip">${c[1] ? I(c[1], 18) : ""}${c[0]}</span>`).join("")}</div>` : ""}
    </div>`);
  }

  /** Stagger-in the children of a copy block; chips/features individually at given times. */
  function copyIn(c, t, chipTimes = []) {
    const { tw } = V;
    const parts = [c.querySelector(".kicker"), c.querySelector("h2"), c.querySelector("p")].filter(Boolean);
    parts.forEach((p, i) => tw(p, t + i * 0.12, 0.8, { o: [0, 1], y: [28, 0] }));
    const items = [...c.querySelectorAll(".chip, .feature")];
    items.forEach((p, i) => {
      const at = chipTimes[i] ?? t + 0.5 + i * 0.12;
      tw(p, at, 0.55, { o: [0, 1], y: [16, 0], s: [0.92, 1] }, "back");
    });
  }

  const fadeUp = (e, t, d = 0.7, dy = 30) => V.tw(e, t, d, { o: [0, 1], y: [dy, 0] });
  const fadeOut = (e, t, d = 0.4) => V.tw(e, t, d, { o: [1, 0] }, "lin");
  const pop = (e, t, d = 0.55) => V.tw(e, t, d, { o: [0, 1], s: [0.85, 1] }, "back");
  const show = (e, t, d = 0.35) => V.tw(e, t, d, { o: [0, 1] }, "lin");
  /** Device entrance: rises with a slight 3D tilt. */
  function deviceIn(e, t, from = 1) {
    V.tw(e, t, 1.1, { o: [0, 1], y: [80, 0], rx: [10, 0], ry: [from * -8, 0], s: [0.94, 1] }, "out");
  }
  /** Modal entrance with overlay. */
  function modalIn(overlay, modal, t) {
    V.tw(overlay, t, 0.35, { o: [0, 1] }, "lin");
    V.tw(modal, t + 0.05, 0.5, { o: [0, 1], y: [30, 0], s: [0.96, 1] }, "back");
  }
  function modalOut(overlay, modal, t) {
    V.tw(overlay, t, 0.3, { o: [1, 0] }, "lin");
    V.tw(modal, t, 0.3, { o: [1, 0], s: [1, 0.97] }, "lin");
  }

  const peso = (n) => "₱" + Math.round(n).toLocaleString("en-US");
  const photoUrl = (n) => `assets/photos/${n}.jpg`;

  window.C = { I, el, stage, sceneEl, browser, phone, header, copy, copyIn, fadeUp, fadeOut, pop, show, deviceIn, modalIn, modalOut, peso, photoUrl };
})();
