/* Act 1: open, problem, reveal, sign in. */
window.SCENES = window.SCENES || [];

/* ---------------- S01 · Cinematic open ---------------- */
SCENES.push(function s01() {
  const { tw, w } = V; const { el, sceneEl, photoUrl, fadeUp, fadeOut } = C;
  const id = "s01_open";
  const root = sceneEl(id, "bg-dark");
  const S = V.scene(id, root, { fade: false });
  const shots = [
    ["dining", S.start, w(id, "Capitol") - 0.2, 1.0, 1.12, 0, -20],
    ["banquet", w(id, "birthdays") - 0.25, w(id, "weddings") + 0.1, 1.12, 1.02, 30, 0],
    ["banquet2", w(id, "weddings") - 0.15, w(id, "reunions") + 0.1, 1.04, 1.14, -20, 10],
    ["lumpia", w(id, "reunions") - 0.15, w(id, "pancit") + 0.1, 1.14, 1.04, 0, 20],
    ["pancit_bilao", w(id, "pancit") - 0.2, w(id, "people") + 0.1, 1.02, 1.15, 0, 0],
    ["dining2", w(id, "people") - 0.2, S.end + 0.7, 1.1, 1.0, 20, 0],
  ];
  shots.forEach(([n, a, b, s0, s1, x0, y0]) => {
    const p = el(`<div class="fill"><img class="cover" src="${photoUrl(n)}"></div>`);
    root.appendChild(p);
    tw(p, a, 0.55, { o: [0, 1] }, "lin");
    tw(p, a, b - a + 0.6, { s: [s0, s1], x: [x0, 0], y: [y0, 0] }, "lin");
  });
  root.appendChild(el(`<div class="fill" style="background:linear-gradient(180deg,rgba(10,2,2,.55) 0%,rgba(10,2,2,.15) 40%,rgba(10,2,2,.75) 100%)"></div>`));
  root.appendChild(el(`<div class="vignette"></div>`));
  // letterbox
  const lb1 = el(`<div class="abs" style="left:0;right:0;top:0;height:70px;background:#000;z-index:5"></div>`);
  const lb2 = el(`<div class="abs" style="left:0;right:0;bottom:0;height:70px;background:#000;z-index:5"></div>`);
  root.append(lb1, lb2);

  const since = el(`<div class="abs" style="left:0;right:0;top:400px;text-align:center;color:#ffefc1;font:600 22px/1 Inter;letter-spacing:.6em;text-indent:.6em">SINCE 1940</div>`);
  const city = el(`<div class="abs" style="left:0;right:0;top:450px;text-align:center;color:#fff6dd;font:italic 400 76px/1.1 'Playfair Display';text-shadow:0 6px 30px rgba(0,0,0,.6)">Pasay City’s oldest table.</div>`);
  root.append(since, city);
  fadeUp(since, w(id, "Since") - 0.1, 1.0, 14);
  fadeUp(city, w(id, "Pasay") - 0.1, 1.1, 20);
  fadeOut(since, w(id, "Capitol") - 0.4, 0.4); fadeOut(city, w(id, "Capitol") - 0.4, 0.4);

  // logo moment
  const dim = el(`<div class="fill" style="background:radial-gradient(circle at center, rgba(60,0,0,.75), rgba(0,0,0,.85))"></div>`);
  const logo = el(`<img class="abs" src="assets/brand/logo-official-1200.png" style="left:560px;top:345px;width:800px;filter:drop-shadow(0 20px 40px rgba(0,0,0,.6))">`);
  const sweep = el(`<div class="abs" style="left:560px;top:345px;width:800px;height:277px;overflow:hidden;-webkit-mask:url(assets/brand/logo-official-1200.png) center/contain no-repeat;mask:url(assets/brand/logo-official-1200.png) center/contain no-repeat"><div class="abs" style="top:0;bottom:0;left:-200px;width:160px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);transform:skewX(-20deg)" data-s></div></div>`);
  root.append(dim, logo, sweep);
  const tc = w(id, "Capitol");
  tw(dim, tc - 0.3, 0.4, { o: [0, 1] }, "lin"); tw(dim, w(id, "birthdays") - 0.45, 0.4, { o: [1, 0] }, "lin");
  tw(logo, tc - 0.25, 1.0, { o: [0, 1], s: [1.12, 1], blur: [12, 0] }, "out");
  tw(logo, w(id, "birthdays") - 0.45, 0.4, { o: [1, 0], s: [1, 0.96] }, "lin");
  tw(sweep.querySelector("[data-s]"), tc + 0.35, 1.1, { x: [0, 1250] }, "io");
  tw(sweep, w(id, "birthdays") - 0.45, 0.3, { o: [1, 0] }, "lin");
  V.cue(tc - 0.25, "boom");

  // word beats
  const beat = (word, label, side = "left") => {
    const b = el(`<div class="abs" style="${side}:140px;bottom:150px;color:#fff6dd;font:italic 400 68px/1 'Playfair Display';text-shadow:0 4px 24px rgba(0,0,0,.7)">${label}</div>`);
    root.appendChild(b);
    const t = w(id, word);
    tw(b, t - 0.1, 0.6, { o: [0, 1], x: [side === "left" ? -30 : 30, 0] });
    tw(b, t + 0.75, 0.3, { o: [1, 0] }, "lin");
  };
  beat("birthdays", "Birthdays.");
  beat("weddings", "Weddings.", "right");
  beat("reunions", "Reunions.");
  const last = el(`<div class="abs" style="left:0;right:0;bottom:150px;text-align:center;color:#fff6dd;font:italic 400 60px/1.15 'Playfair Display';text-shadow:0 4px 24px rgba(0,0,0,.7)">…shared with the people who matter most.</div>`);
  root.appendChild(last);
  fadeUp(last, w(id, "shared") - 0.1, 0.9, 16);
  fadeOut(last, S.end - 0.2, 0.5);
  tw(lb1, S.end - 0.3, 0.6, { y: [0, -80] }, "in"); tw(lb2, S.end - 0.3, 0.6, { y: [0, 80] }, "in");
});

/* ---------------- S02 · The old way ---------------- */
SCENES.push(function s02() {
  const { tw, w, cls } = V; const { el, sceneEl, I, fadeUp, pop } = C;
  const id = "s02_problem";
  const root = sceneEl(id, "bg-dark grain");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="glow" style="left:600px;top:200px;width:700px;height:500px;background:rgba(140,20,10,.35)"></div>`));

  const h1 = el(`<div class="abs" style="left:0;right:0;top:120px;text-align:center;color:#f4e6cf;font:400 54px/1.15 'Playfair Display'">Behind every celebration… <em style="color:#ff8b7a" data-m>a mountain of work.</em></div>`);
  root.appendChild(h1);
  fadeUp(h1, S.start + 0.4, 0.9, 20);
  tw(h1.querySelector("[data-m]"), w(id, "mountain") - 0.2, 0.6, { o: [0, 1] }, "lin");
  tw(h1, w(id, "dreaded") - 0.3, 0.5, { o: [1, 0], y: [0, -20] });

  // 1. phone ringing
  const call = el(`<div class="abs card" style="left:170px;top:330px;width:400px;padding:30px;border-radius:26px;background:#1f1212;border-color:#3a2222;color:#f6e7d2">
    <div style="display:flex;align-items:center;gap:16px"><div style="width:64px;height:64px;border-radius:50%;background:#2f8a4e;display:grid;place-items:center;color:#fff">${I("phone", 30)}</div>
    <div><div style="font:700 24px/1.2 Inter">Incoming call…</div><div style="opacity:.6;font-size:17px;margin-top:4px">8556-1313 · Capitol line</div></div></div>
    <div style="margin-top:22px;display:flex;justify-content:space-between;align-items:center"><span style="font:600 16px Inter;color:#ff9c8c">12 missed calls today</span><span style="background:#b70100;color:#fff;border-radius:999px;padding:6px 12px;font:800 15px Inter" data-n>12</span></div></div>`);
  root.appendChild(call);
  const tCall = w(id, "Phone");
  pop(call, tCall - 0.2);
  for (let i = 0; i < 6; i++) tw(call, tCall + 0.3 + i * 0.18, 0.18, { r: [i % 2 ? 3 : -3, i % 2 ? -3 : 3] }, "io");
  tw(call, tCall + 1.4, 0.2, { r: [3, 0] });
  V.cue(tCall, "ring");

  // 2. messenger pile
  const msgs = [
    ["Hi po, available pa ba ang function room sa Dec 12?", "11:48 PM"],
    ["How much po buffet for 80 pax?", "12:15 AM"],
    ["Pa-reserve po for debut, 45 guests", "12:52 AM"],
    ["Do you deliver to Makati?", "1:20 AM"],
    ["Hello?? Still waiting for a reply po", "7:03 AM"],
  ];
  const stack = el(`<div class="abs" style="left:700px;top:300px;width:520px"></div>`);
  msgs.forEach(([m, t], i) => {
    const n = el(`<div class="card" style="position:absolute;left:${i * 6}px;top:${i * 74}px;width:500px;padding:14px 18px;border-radius:16px;background:rgba(255,255,255,.96);display:flex;gap:14px;align-items:center">
      <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#7b5cff,#e64ba0);display:grid;place-items:center;color:#fff;flex:none">${I("msg", 22)}</div>
      <div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;font:700 14px Inter;color:#4a2a2a"><span>Messenger</span><span style="opacity:.55;font-weight:500">${t}</span></div>
      <div style="font:500 16px/1.3 Inter;color:#2d1717;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m}</div></div></div>`);
    stack.appendChild(n);
    const t0 = w(id, "Messenger") - 0.2 + i * 0.32;
    tw(n, t0, 0.5, { o: [0, 1], y: [-30, 0], s: [0.95, 1] }, "back");
    V.cue(t0, "pop");
  });
  const unread = el(`<div class="abs" style="left:1160px;top:276px;background:#b70100;color:#fff;border-radius:999px;padding:8px 14px;font:800 18px Inter;box-shadow:0 6px 18px rgba(183,1,0,.5)">37 unread</div>`);
  root.append(stack, unread);
  pop(unread, w(id, "overnight"));

  // 3. logbook
  const lines = [
    ["Oct 3", "Dela Cruz – baptism – 30 pax", false],
    ["Oct 10", "Lim – corp. lunch – 60 packs", true],
    ["Dec 12", "Santos – wedding – 50 pax", false, "a"],
    ["Nov 2", "Reyes – reunion – 25 pax", false],
    ["Dec 12", "Garcia – debut – 45 pax", false, "b"],
    ["Nov 14", "Tan – 2 bilao pancit", false],
  ];
  const book = el(`<div class="abs" style="left:1300px;top:290px;width:470px;height:470px;border-radius:8px;background:#f8f1dc;box-shadow:0 30px 60px rgba(0,0,0,.5);padding:34px 30px 0 70px;transform-origin:50% 50%;
      background-image:linear-gradient(90deg,transparent 52px,#e8a0a0 52px,#e8a0a0 54px,transparent 54px),repeating-linear-gradient(180deg,transparent 0 47px,#bcd0e6 47px 48px);background-position:0 0,0 30px">
      <div style="font:700 34px/1 Caveat;color:#2d3a6b;margin:-10px 0 18px -30px">Reservations 2026</div>
      ${lines.map(([d, t, x, k]) => `<div ${k ? `data-${k}` : ""} style="position:relative;height:48px;font:500 30px/48px Caveat;color:#24305e;white-space:nowrap;${x ? "text-decoration:line-through;opacity:.6" : ""}"><b style="font-weight:700;margin-right:10px">${d}</b>${t}</div>`).join("")}
    </div>`);
  root.appendChild(book);
  const tBook = w(id, "Handwritten");
  tw(book, tBook - 0.3, 0.7, { o: [0, 1], y: [40, 0], r: [6, 2] }, "back");
  // zoom on double booking
  const tD = w(id, "dreaded");
  tw(call, tD - 0.2, 0.6, { o: [1, 0.15], blur: [0, 3] }, "lin");
  tw(stack, tD - 0.2, 0.6, { o: [1, 0.15], blur: [0, 3] }, "lin");
  tw(unread, tD - 0.2, 0.6, { o: [1, 0] }, "lin");
  tw(book, tD, 1.0, { x: [0, -575], y: [0, -30], s: [1, 1.38], r: [2, 0] }, "io");
  ["a", "b"].forEach((k, i) => {
    const row = book.querySelector(`[data-${k}]`);
    const ring = el(`<div class="abs" style="left:-14px;top:2px;width:390px;height:46px;border:3px solid #d0201a;border-radius:50%"></div>`);
    row.appendChild(ring);
    tw(ring, w(id, "booked") + i * 0.35, 0.45, { o: [0, 1], s: [1.25, 1] }, "out");
  });
  const stamp = el(`<div class="abs" style="left:770px;top:690px;padding:12px 26px;border:6px solid #e0261d;border-radius:12px;color:#e0261d;font:900 56px/1 Inter;letter-spacing:.06em;transform-origin:center">DOUBLE BOOKED</div>`);
  root.appendChild(stamp);
  const tS = w(id, "same");
  tw(stamp, tS - 0.05, 0.35, { o: [0, 1], s: [2.2, 1], r: [-14, -8] }, "in");
  V.cue(tS + 0.3, "stamp");
  const flash = el(`<div class="fill" style="background:#b70100"></div>`);
  root.appendChild(flash);
  tw(flash, tS + 0.28, 0.5, { o: [0.28, 0] }, "lin");
});

/* ---------------- S03 · Reveal ---------------- */
SCENES.push(function s03() {
  const { tw, w } = V; const { el, sceneEl, I, photoUrl, fadeUp, pop } = C;
  const id = "s03_reveal";
  const root = sceneEl(id, "bg-red");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern"></div>`));
  const rays = el(`<div class="abs" style="left:460px;top:-460px;width:1000px;height:1000px;border-radius:50%;background:radial-gradient(circle,rgba(255,239,193,.18),transparent 65%)"></div>`);
  root.appendChild(rays);
  tw(rays, S.start, 6, { s: [0.6, 1.3], o: [0, 1] }, "out");

  const today = el(`<div class="abs" style="left:0;right:0;top:470px;text-align:center;color:#ffefc1;font:italic 400 58px/1.1 'Playfair Display'">Today, Capitol takes its legacy online.</div>`);
  root.appendChild(today);
  fadeUp(today, w(id, "Today") - 0.1, 0.8, 18);
  tw(today, w(id, "Introducing") - 0.45, 0.4, { o: [1, 0], y: [0, -20] });

  const mark = el(`<img class="abs" src="assets/brand/logo-mark-600.png" style="left:810px;top:150px;width:300px;filter:drop-shadow(0 18px 30px rgba(0,0,0,.45))">`);
  const intro = el(`<div class="abs" style="left:0;right:0;top:390px;text-align:center;color:rgba(255,239,193,.8);font:700 20px/1 Inter;letter-spacing:.5em;text-indent:.5em">INTRODUCING</div>`);
  const title = el(`<div class="abs" style="left:0;right:0;top:430px;text-align:center;color:#fff4d6;font:700 104px/1.05 'Playfair Display';text-shadow:0 10px 40px rgba(0,0,0,.35)">Capitol Booking System</div>`);
  const rule = el(`<div class="abs" style="left:760px;top:570px;width:400px;height:2px;background:linear-gradient(90deg,transparent,#ffefc1,transparent)"></div>`);
  root.append(mark, intro, title, rule);
  const tI = w(id, "Introducing");
  tw(mark, tI - 0.3, 1.0, { o: [0, 1], s: [0.6, 1], y: [30, 0] }, "back");
  fadeUp(intro, tI, 0.7, 10);
  tw(title, w(id, "Capitol", 1) - 0.1, 1.0, { o: [0, 1], s: [1.08, 1], blur: [10, 0] });
  tw(rule, w(id, "System"), 0.8, { o: [0, 1], sx: [0, 1] });
  V.cue(tI - 0.3, "rise");
  // move title block up for pillars
  const tC = w(id, "Catering") - 0.5;
  tw(mark, tC, 0.6, { y: [0, -120], o: [1, 0] }, "io");
  tw(intro, tC, 0.8, { y: [0, -250], o: [1, 0] }, "io");
  tw(title, tC, 0.8, { y: [0, -300], s: [1, 0.74] }, "io");
  tw(rule, tC, 0.8, { y: [0, -360], o: [1, 0.6] }, "io");

  const pillars = [
    ["Catering", "lumpia", "Buffet & packed meals", "utensils"],
    ["Function Rooms", "banquet", "Rooms A & B · up to 50 guests", "building"],
    ["Food Delivery", "pancit_canton", "Full menu to your door", "truck"],
  ];
  const words = [["Catering", 0], ["function", 0], ["delivery", 0]];
  pillars.forEach(([name, img, sub, ic], i) => {
    const c = el(`<div class="abs" style="left:${250 + i * 485}px;top:330px;width:450px;height:390px;border-radius:20px;overflow:hidden;background:#2a0000;box-shadow:0 30px 60px rgba(0,0,0,.4);border:1px solid rgba(255,239,193,.25)">
      <div class="photo" style="height:270px"><img src="${photoUrl(img)}"></div>
      <div style="padding:20px 24px;display:flex;gap:16px;align-items:center"><div style="width:52px;height:52px;border-radius:14px;background:#ffefc1;color:#640000;display:grid;place-items:center">${I(ic, 26)}</div>
      <div><div style="color:#fff4d6;font:700 28px/1.1 'Playfair Display'">${name}</div><div style="color:rgba(255,239,193,.7);font:500 16px/1.4 Inter;margin-top:4px">${sub}</div></div></div></div>`);
    root.appendChild(c);
    const t = w(id, words[i][0], words[i][1]) - 0.15;
    tw(c, t, 0.8, { o: [0, 1], y: [80, 0], ry: [i === 0 ? 14 : i === 2 ? -14 : 0, 0] }, "out");
    tw(c.querySelector("img"), t, 6, { s: [1.15, 1] }, "out");
    V.cue(t, "whoosh");
  });
  // unify line
  const uni = el(`<div class="abs" style="left:250px;top:752px;width:1420px;height:3px;border-radius:2px;background:#ffefc1;transform-origin:50% 50%"></div>`);
  const uniLabel = el(`<div class="abs" style="left:0;right:0;top:738px;text-align:center"><span style="background:#7a0400;padding:6px 18px;border-radius:999px;color:#ffefc1;font:700 15px/1 Inter;letter-spacing:.3em;border:1px solid rgba(255,239,193,.4)">ONE PLATFORM</span></div>`);
  root.append(uni, uniLabel);
  tw(uni, w(id, "unified") - 0.1, 0.9, { sx: [0, 1], o: [0, 1] }, "io");
  pop(uniLabel, w(id, "platform") - 0.2);
  const b1 = el(`<div class="abs chip" style="left:520px;top:820px;font-size:22px;padding:16px 26px;background:#ffefc1;color:#640000;border:none">${I("zap", 24)} Real-time availability</div>`);
  const b2 = el(`<div class="abs chip" style="left:990px;top:820px;font-size:22px;padding:16px 26px;background:#ffefc1;color:#640000;border:none">${I("shield", 24)} Automatic conflict detection</div>`);
  root.append(b1, b2);
  pop(b1, w(id, "real-time") - 0.1); pop(b2, w(id, "automatic") - 0.1);
  V.cue(w(id, "real-time") - 0.1, "pop"); V.cue(w(id, "automatic") - 0.1, "pop");
});

/* ---------------- S04 · Sign in & profile ---------------- */
SCENES.push(function s04() {
  const { tw, w, type, cls, swap } = V; const C_ = C; const { el, sceneEl, I, browser, header, copy, copyIn, deviceIn, modalIn, modalOut, fadeUp, pop, show, fadeOut } = C_;
  const id = "s04_signin";
  const root = sceneEl(id, "bg-cream");
  const S = V.scene(id, root);
  root.appendChild(el(`<div class="pattern pattern--dark"></div>`));
  const cp = copy({ x: 90, y: 250, kicker: "Your account", title: "Sign in <em>your way.</em>",
    text: "One secure Capitol account for every booking, order, and delivery.",
    chips: [["Magic link", "link"], ["Google", "globe"], ["Password", "key"], ["One-time profile", "user"]] });
  root.appendChild(cp);
  copyIn(cp, S.start + 0.3, [w(id, "magic"), w(id, "Google"), w(id, "password"), w(id, "profile")]);

  const b = browser("/", 580, 140);
  root.appendChild(b);
  deviceIn(b, S.start + 0.1);
  const view = b.querySelector(".browser__view");
  const page = el(`<div class="page app">${header({})}
    <div style="height:684px;position:relative;overflow:hidden;background:linear-gradient(155deg,#640000 0%,#3a0000 55%,#b70100 100%);display:grid;place-items:center;text-align:center">
      <div class="abs" style="top:-80px;right:-80px;width:320px;height:320px;border-radius:50%;background:rgba(255,239,193,.04)"></div>
      <div class="abs" style="bottom:-60px;left:-60px;width:240px;height:240px;border-radius:50%;background:rgba(255,239,193,.04)"></div>
      <div><img src="assets/brand/logo-official-1200.png" style="width:520px;margin:0 auto 34px;filter:drop-shadow(0 8px 18px rgba(0,0,0,.24))">
      <div style="color:#ffefc1;margin-bottom:30px">◆</div>
      <p style="max-width:520px;margin:0 auto;color:rgba(253,246,227,.75);line-height:1.8;font-size:17px">For over eight decades, Capitol has been at the heart of Pasay City — bringing families, friends, and communities together through the warmth of authentic Filipino cuisine.</p></div>
    </div></div>`);
  view.appendChild(page);

  // sign-in modal
  const ov = el(`<div class="overlay"></div>`);
  const m = el(`<div class="modal" style="left:400px;top:80px;width:480px;height:540px">
    <div style="padding:30px 34px 0;text-align:center"><img src="assets/brand/logo-mark-300.png" style="width:110px;margin:0 auto 10px">
      <h3 style="margin:0;font:700 28px/1.1 Georgia;color:#3a0000">Welcome to Capitol</h3>
      <p style="margin:8px 0 18px;color:#8a5a5a;font-size:15px">Book, order, and track with one account.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;background:#f6ecdf;border-radius:10px;padding:4px;font:700 14px Inter;color:#8a5a5a">
        <div data-t1 style="padding:10px;border-radius:8px;background:#fff;color:#640000;box-shadow:0 2px 6px rgba(0,0,0,.08)">Sign In</div><div data-t2 style="padding:10px;border-radius:8px">Log In</div></div></div>
    <div data-a class="abs" style="left:34px;right:34px;top:266px;display:grid;gap:14px">
      <label class="field"><span>Email address</span><div class="input" data-em><span data-e1></span></div></label>
      <div class="btn btn--red btn--block" data-magic>${I("mail", 17)} Email me a magic link</div>
      <div style="display:flex;align-items:center;gap:12px;color:#b8a08c;font-size:13px"><i style="flex:1;height:1px;background:#eadbc8"></i>or<i style="flex:1;height:1px;background:#eadbc8"></i></div>
      <div class="btn btn--ghost btn--block" data-g><b style="font:800 18px Arial;background:conic-gradient(from -45deg,#ea4335 0 25%,#fbbc05 0 50%,#34a853 0 75%,#4285f4 0);-webkit-background-clip:text;color:transparent">G</b> Continue with Google</div>
    </div>
    <div data-b class="abs" style="left:34px;right:34px;top:266px;display:grid;gap:14px">
      <label class="field"><span>Email address</span><div class="input">maria.santos@gmail.com</div></label>
      <label class="field"><span>Password</span><div class="input focus" style="letter-spacing:.2em" data-pw></div></label>
      <div class="btn btn--red btn--block">${I("login", 17)} Log In</div>
    </div></div>`);
  view.append(ov, m);
  const cur = V.cursor(view);
  const tOpen = w(id, "Sign") - 0.5;
  cur.to(S.start, 900, 560).click(tOpen, ".signin-btn");
  modalIn(ov, m, tOpen + 0.15);
  V.cue(tOpen + 0.15, "whoosh");
  const tEm = tOpen + 0.55;
  cls(m.querySelector("[data-em]"), tEm, "focus", w(id, "Google") - 0.3);
  type(m.querySelector("[data-e1]"), tEm, "maria.santos@gmail.com", 30);
  cur.click(w(id, "link") - 0.05, "[data-magic]");
  const toast1 = el(`<div class="toast" style="left:430px;top:650px">${I("mail")} Magic link sent — check your inbox</div>`);
  view.appendChild(toast1);
  tw(toast1, w(id, "link") + 0.2, 0.4, { o: [0, 1], y: [16, 0] }, "back");
  fadeOut(toast1, w(id, "password") - 0.2);
  cur.on(w(id, "Google") - 0.05, "[data-g]");
  cls(m.querySelector("[data-g]"), w(id, "Google") - 0.05, "focus-ring", w(id, "account") + 0.6);
  tw(m.querySelector("[data-g]"), w(id, "Google") - 0.05, 0.35, { s: [1, 1.04] }, "back");
  tw(m.querySelector("[data-g]"), w(id, "account") + 0.3, 0.3, { s: [1.04, 1] });
  // switch to Log In tab
  const tLog = w(id, "password") - 0.35;
  cur.click(tLog, "[data-t2]");
  const t1 = m.querySelector("[data-t1]"), t2 = m.querySelector("[data-t2]");
  hookTab(t1, t2, tLog);
  tw(m.querySelector("[data-a]"), tLog, 0.25, { o: [1, 0] }, "lin");
  tw(m.querySelector("[data-b]"), tLog + 0.1, 0.3, { o: [0, 1], y: [10, 0] });
  type(m.querySelector("[data-pw]"), tLog + 0.35, "••••••••••", 18);

  // profile setup
  const tP = w(id, "New") - 0.3;
  modalOut(ov, m, tP);
  const m2 = el(`<div class="modal" style="left:360px;top:90px;width:560px;height:500px">
    <div class="modal__head"><div class="modal__icon">${I("user")}</div><div><div class="eyebrow">Welcome to Capitol</div><h3>Complete your profile</h3></div></div>
    <div style="padding:20px 26px;display:grid;gap:16px">
      <p style="margin:0;color:#8a5a5a;font-size:14.5px">We’ll use these details to fill in your bookings and deliveries automatically.</p>
      <label class="field"><span>Full name</span><div class="input" data-f1><span data-n></span></div></label>
      <label class="field"><span>Phone number</span><div class="input" data-f2><span data-p></span></div></label>
      <div style="display:grid;grid-template-columns:140px 1fr;gap:12px">
        <label class="field"><span>Label</span><div class="input"><span data-l></span></div></label>
        <label class="field"><span>Saved address</span><div class="input" data-f3><span data-ad></span></div></label></div>
      <div class="btn btn--red btn--block" data-save style="margin-top:6px">${I("check", 17)} Save and continue</div>
    </div></div>`);
  const ov2 = el(`<div class="overlay"></div>`);
  view.append(ov2, m2);
  view.appendChild(cur.el); // keep cursor on top
  modalIn(ov2, m2, tP + 0.15);
  cls(m2.querySelector("[data-f1]"), w(id, "guests"), "focus", w(id, "names") + 0.6);
  type(m2.querySelector("[data-n]"), w(id, "guests"), "Maria Santos", 18);
  cls(m2.querySelector("[data-f2]"), w(id, "numbers") - 0.6, "focus", w(id, "saved"));
  type(m2.querySelector("[data-p]"), w(id, "numbers") - 0.6, "0917 555 0123", 22);
  type(m2.querySelector("[data-l]"), w(id, "saved") - 0.3, "Home", 16, false);
  cls(m2.querySelector("[data-f3]"), w(id, "saved"), "focus", w(id, "every"));
  type(m2.querySelector("[data-ad]"), w(id, "saved"), "1520 F.B. Harrison St., Pasay City", 34);
  const tSave = w(id, "every") - 0.1;
  cur.click(tSave, "[data-save]", { dy: 0 });
  modalOut(ov2, m2, tSave + 0.3);
  // header badge swap
  const signBtn = page.querySelector(".signin-btn");
  const badge = el(`<div class="user-badge abs" style="right:40px;top:15px"><span class="av">M</span><span><strong>Maria Santos</strong><small>Customer</small></span></div>`);
  page.appendChild(badge);
  tw(signBtn, tSave + 0.35, 0.2, { o: [1, 0] }, "lin");
  pop(badge, tSave + 0.45);
  const toast2 = el(`<div class="toast" style="left:500px;top:660px">${I("check")} Profile saved.</div>`);
  view.appendChild(toast2);
  tw(toast2, tSave + 0.4, 0.4, { o: [0, 1], y: [16, 0] }, "back");
  V.cue(tSave + 0.4, "ding");

  function hookTab(a, b, t) {
    V.hook((tt) => {
      const on = tt >= t;
      a.style.background = on ? "transparent" : "#fff"; a.style.color = on ? "#8a5a5a" : "#640000"; a.style.boxShadow = on ? "none" : "0 2px 6px rgba(0,0,0,.08)";
      b.style.background = on ? "#fff" : "transparent"; b.style.color = on ? "#640000" : "#8a5a5a"; b.style.boxShadow = on ? "0 2px 6px rgba(0,0,0,.08)" : "none";
    });
  }
});
