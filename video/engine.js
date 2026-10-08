/* Deterministic timeline engine.
 * Every visual is a pure function of time t (seconds), so the renderer can
 * seek to any frame and capture it exactly. Scenes register tweens, hooks
 * and cursor paths; render(t) applies them. */
(function () {
  const TL = window.TIMELINE;
  const SCENE = {};
  TL.scenes.forEach((s) => (SCENE[s.id] = s));

  const tweens = new Map(); // el -> [{t0, dur, props, ease}]
  const hooks = [];         // fn(t)
  const sceneEls = [];      // {el, start, end}
  const sfx = [];           // {t, kind}
  const XF = 0.6;           // scene crossfade

  const EASE = {
    lin: (k) => k,
    out: (k) => 1 - Math.pow(1 - k, 3),
    in: (k) => k * k * k,
    io: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    back: (k) => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
    expo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  };
  const DEF = { o: 1, x: 0, y: 0, s: 1, sx: 1, sy: 1, r: 0, rx: 0, ry: 0, blur: 0, cr: 0, cl: 0, cb: 0, ct: 0, br: 1, sat: 1 };

  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  /** Absolute time of the nth spoken word matching `word` in scene `id`. */
  function w(id, word, nth = 0) {
    const sc = SCENE[id];
    const n = norm(word);
    let seen = 0;
    for (const [off, text] of sc.words) {
      if (norm(text) === n || (n.length > 3 && norm(text).startsWith(n))) {
        if (seen++ === nth) return sc.vo_at + off;
      }
    }
    console.warn("word not found", id, word, nth);
    return sc.start + 1;
  }

  function tw(el, t0, dur, props, ease = "out") {
    if (!el) { console.warn("tw: missing element at", t0); return; }
    if (!tweens.has(el)) tweens.set(el, []);
    tweens.get(el).push({ t0, dur: Math.max(dur, 0.0001), props, ease: EASE[ease] || EASE.out });
  }
  const hook = (fn) => hooks.push(fn);
  const cue = (t, kind) => sfx.push({ t: +t.toFixed(3), kind });

  /** Toggle a class on el while t0 <= t < t1. */
  function cls(el, t0, name, t1 = Infinity) {
    hook((t) => el && el.classList.toggle(name, t >= t0 && t < t1));
  }
  /** Typewriter: reveals text from t0 at cps characters per second. */
  function type(el, t0, text, cps = 22, caret = true) {
    hook((t) => {
      const n = Math.max(0, Math.min(text.length, Math.floor((t - t0) * cps)));
      el.textContent = t < t0 ? "" : text.slice(0, n);
      if (caret) el.classList.toggle("typing", t >= t0 - 0.4 && t < t0 + text.length / cps + 0.4);
    });
    return t0 + text.length / cps;
  }
  /** Number counter. */
  function count(el, t0, dur, a, b, fmt = (v) => Math.round(v).toLocaleString("en-US")) {
    hook((t) => {
      const k = Math.max(0, Math.min(1, (t - t0) / dur));
      el.textContent = fmt(a + (b - a) * EASE.out(k));
    });
  }
  /** Swap text at given times: steps = [[t, text], ...] */
  function swap(el, steps) {
    hook((t) => {
      let v = steps[0][1];
      for (const [ts, txt] of steps) if (t >= ts) v = txt;
      if (el.textContent !== v) el.textContent = v;
    });
  }

  /** Registers a scene element; it is visible from start to end + crossfade. */
  function scene(id, el, opts = {}) {
    const sc = SCENE[id];
    const end = sc.start + sc.length;
    sceneEls.push({ el, start: sc.start, end: end + XF });
    if (opts.fade !== false) tw(el, sc.start, XF, { o: [0, 1] }, "lin");
    return { ...sc, end };
  }

  /* ---------- cursor ---------- */
  function cursor(container, dark = false) {
    const c = document.createElement("div");
    c.className = "cursor" + (dark ? " cursor--dark" : "");
    c.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M4 2 L4 20 L9 15.5 L12.5 22.5 L15.6 21 L12.2 14.2 L19 14 Z" fill="#fff" stroke="#1a0a0a" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    container.appendChild(ring);
    container.appendChild(c);
    const pts = []; // {t, x, y, click, move}
    const api = {
      el: c,
      /** Move to (x,y) in container coords arriving at t; optional click. */
      to(t, x, y, opt = {}) { pts.push({ t, x, y, click: !!opt.click, move: opt.move ?? 0.75 }); return api; },
      on(t, target, opt = {}) {
        const p = center(container, target, opt);
        return api.to(t, p.x, p.y, opt);
      },
      click(t, target, opt = {}) { return api.on(t, target, { ...opt, click: true }); },
    };
    hook((t) => {
      if (!pts.length) return;
      pts.sort((a, b) => a.t - b.t);
      let x = pts[0].x, y = pts[0].y;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (t >= p.t) { x = p.x; y = p.y; continue; }
        const prev = pts[i - 1];
        if (prev) {
          const k = Math.max(0, Math.min(1, (t - (p.t - p.move)) / p.move));
          const e = EASE.io(k);
          x = prev.x + (p.x - prev.x) * e;
          y = prev.y + (p.y - prev.y) * e;
        }
        break;
      }
      let press = 1, ringK = -1, rx = x, ry = y;
      for (const p of pts) {
        if (!p.click) continue;
        const d = t - p.t;
        if (d >= -0.08 && d < 0.12) press = 0.82;
        if (d >= 0 && d < 0.5) { ringK = d / 0.5; rx = p.x; ry = p.y; }
      }
      c.style.transform = `translate(${x - 4}px, ${y - 2}px) scale(${press})`;
      if (ringK >= 0) {
        ring.style.opacity = String(0.55 * (1 - ringK));
        ring.style.transform = `translate(${rx - 22}px, ${ry - 22}px) scale(${0.3 + ringK * 1.2})`;
      } else ring.style.opacity = "0";
    });
    // register click sounds once the path is final
    api._sfx = () => pts.forEach((p) => p.click && cue(p.t, "click"));
    cursors.push(api);
    return api;
  }
  const cursors = [];

  /** Center of target relative to container, in unscaled container px. */
  function center(container, target, opt = {}) {
    const el = typeof target === "string" ? container.querySelector(target) : target;
    if (!el) { console.warn("center: missing", target); return { x: 0, y: 0 }; }
    const cr = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const k = container.offsetWidth / cr.width;
    return {
      x: (r.left - cr.left + r.width * (opt.fx ?? 0.5)) * k + (opt.dx || 0),
      y: (r.top - cr.top + r.height * (opt.fy ?? 0.5)) * k + (opt.dy || 0),
    };
  }

  /* ---------- render ---------- */
  function lerp(a, b, k) { return a + (b - a) * k; }
  function apply(el, list, t) {
    const st = {};
    const seen = new Set();
    // starting values: first tween that mentions each prop
    for (const tw of list) for (const p in tw.props) if (!seen.has(p)) { seen.add(p); st[p] = tw.props[p][0]; }
    for (const tw of list) {
      if (t < tw.t0) continue;
      const k = tw.ease(Math.min(1, (t - tw.t0) / tw.dur));
      for (const p in tw.props) st[p] = lerp(tw.props[p][0], tw.props[p][1], k);
    }
    const v = (p) => (p in st ? st[p] : DEF[p]);
    let tf = "";
    if ("x" in st || "y" in st) tf += `translate(${v("x")}px, ${v("y")}px) `;
    if ("rx" in st || "ry" in st) tf += `perspective(1800px) rotateX(${v("rx")}deg) rotateY(${v("ry")}deg) `;
    if ("r" in st) tf += `rotate(${v("r")}deg) `;
    if ("s" in st) tf += `scale(${v("s")}) `;
    if ("sx" in st) tf += `scaleX(${v("sx")}) `;
    if ("sy" in st) tf += `scaleY(${v("sy")}) `;
    if (tf) el.style.transform = tf;
    if ("o" in st) el.style.opacity = String(Math.max(0, Math.min(1, v("o"))));
    let f = "";
    if ("blur" in st && v("blur") > 0.05) f += `blur(${v("blur")}px) `;
    if ("br" in st) f += `brightness(${v("br")}) `;
    if ("sat" in st) f += `saturate(${v("sat")}) `;
    if (f || el.style.filter) el.style.filter = f;
    if ("cr" in st || "cl" in st || "cb" in st || "ct" in st)
      el.style.clipPath = `inset(${v("ct")}% ${v("cr")}% ${v("cb")}% ${v("cl")}%)`;
  }

  let sorted = false;
  function render(t) {
    if (!sorted) { tweens.forEach((l) => l.sort((a, b) => a.t0 - b.t0)); sorted = true; }
    for (const s of sceneEls) {
      const on = t >= s.start - 0.001 && t < s.end;
      s.el.style.visibility = on ? "visible" : "hidden";
    }
    tweens.forEach((list, el) => apply(el, list, t));
    for (const h of hooks) h(t);
  }

  window.V = { TL, SCENE, w, tw, hook, cls, type, count, swap, scene, cursor, center, cue, render, sfx, XF,
    finalize() { cursors.forEach((c) => c._sfx()); sfx.sort((a, b) => a.t - b.t); } };
})();
