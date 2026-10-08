/* Builds every scene, wires captions, exposes seek() for the renderer and a
 * simple player (space = play/pause) for previewing in a browser. */
(async function () {
  const params = new URLSearchParams(location.search);
  const RENDER = params.has("render");
  const CAPTIONS = params.get("cc") !== "0";
  if (RENDER) document.body.classList.add("render");

  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r)))));

  for (const build of window.SCENES) build();

  // images created by scenes must be decoded before measuring/rendering
  await Promise.all([...document.images].map((i) => i.decode().catch(() => 0)));

  /* ---------- captions from word timings ---------- */
  const cues = [];
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const SCRIPT = window.SCRIPT_TEXT || {};
  for (const sc of V.TL.scenes) {
    const text = SCRIPT[sc.id];
    if (!text || !sc.words.length) continue;
    // split into sentences, then long sentences at commas
    const chunks = [];
    for (const sent of text.match(/[^.!?]+[.!?]*/g) || []) {
      const s = sent.trim(); if (!s) continue;
      const wc = s.split(/\s+/).length;
      if (wc > 13) {
        let buf = [];
        for (const part of s.split(/(?<=,)\s+/)) {
          buf.push(part);
          if (buf.join(" ").split(/\s+/).length >= 7) { chunks.push(buf.join(" ")); buf = []; }
        }
        if (buf.length) { if (buf.join(" ").split(/\s+/).length < 4 && chunks.length) chunks[chunks.length - 1] += " " + buf.join(" "); else chunks.push(buf.join(" ")); }
      } else chunks.push(s);
    }
    let wi = 0;
    const starts = [];
    for (const ch of chunks) {
      const first = norm(ch.split(/\s+/)[0]);
      let found = -1;
      for (let j = wi; j < Math.min(sc.words.length, wi + 6); j++) {
        const t = norm(sc.words[j][1]);
        if (t === first || t.startsWith(first) || first.startsWith(t)) { found = j; break; }
      }
      if (found < 0) found = Math.min(wi, sc.words.length - 1);
      starts.push(sc.vo_at + sc.words[found][0]);
      wi = found + ch.split(/\s+/).length - 1;
    }
    chunks.forEach((ch, i) => cues.push({ t0: starts[i] - 0.05, t1: i + 1 < chunks.length ? starts[i + 1] - 0.05 : sc.vo_at + sc.vo_dur + 0.25, text: ch }));
  }
  const capEl = document.querySelector("#captions span");
  let ccOn = CAPTIONS;
  V.hook((t) => {
    let txt = "";
    if (ccOn) for (const c of cues) if (t >= c.t0 && t < c.t1) txt = c.text;
    if (capEl.textContent !== txt) capEl.textContent = txt;
  });
  // watermark during product scenes
  const S = V.SCENE;
  V.tw(document.getElementById("watermark"), S.s04_signin.start + 0.5, 0.6, { o: [0, 0.0] });
  V.finalize();

  window.DURATION = V.TL.total;
  window.SFX = V.sfx;
  window.CUES = cues;
  window.seek = (t) => V.render(t);
  V.render(0);
  window.READY = true;

  if (RENDER) return;
  /* ---------- preview player ---------- */
  const stage = document.getElementById("stage");
  const fit = () => {
    const k = Math.min(innerWidth / 1920, (innerHeight - 44) / 1080);
    stage.style.transform = `scale(${k})`;
    stage.parentElement.style.placeItems = "start";
    stage.style.marginLeft = (innerWidth - 1920 * k) / 2 + "px";
  };
  fit(); addEventListener("resize", fit);
  const audio = document.getElementById("audio");
  const scrub = document.getElementById("scrub"), time = document.getElementById("time"), btn = document.getElementById("play");
  scrub.max = V.TL.total;
  let playing = false, t0 = 0, base = 0, t = +(params.get("t") || 0);
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
  const set = (v) => { t = Math.max(0, Math.min(V.TL.total, v)); V.render(t); scrub.value = t; time.textContent = fmt(t); };
  const toggle = () => {
    playing = !playing; btn.textContent = playing ? "Pause" : "Play";
    if (playing) { base = t; t0 = performance.now(); audio.currentTime = t; audio.play().catch(() => 0); requestAnimationFrame(loop); }
    else audio.pause();
  };
  const loop = () => { if (!playing) return; set(base + (performance.now() - t0) / 1000); if (t >= V.TL.total) toggle(); requestAnimationFrame(loop); };
  btn.onclick = toggle;
  scrub.oninput = () => { set(+scrub.value); if (playing) { base = t; t0 = performance.now(); audio.currentTime = t; } };
  document.getElementById("cc").onchange = (e) => { ccOn = e.target.checked; set(t); };
  addEventListener("keydown", (e) => { if (e.code === "Space") { e.preventDefault(); toggle(); } if (e.code === "ArrowRight") set(t + 2); if (e.code === "ArrowLeft") set(t - 2); });
  set(t);
})();
