/* =============================================================================
   GenAI-Codeforce — intro-counter.js  (optional FX layer, vanilla JS, no build)

   Self-contained add-on. Injects its own CSS, rAF-polls until the INTRO slide
   exists, then pins a decorative "live stat" badge inside .slide__inner. Touches
   nothing the engine owns: no nav-key handlers, never preventDefault, and the
   badge is pointer-events:none so it never intercepts clicks/navigation.

   Effect — "Live builders counter + sparkline":
     • a monospace tabular-nums odometer that ticks UP (+1..+7, occasionally -1)
       every ~1.2s, thousands-separated, with a quick roll/fade on change;
     • a pulsing "●" dot + "builders shipping right now" label;
     • a scrolling random-walk sparkline canvas stroked in var(--highlight).
   Increments ONLY while the intro slide is .active. Reduced-motion → static.
   ============================================================================= */
(function () {
  "use strict";

  if (window.__cfIntroCounter) return;
  window.__cfIntroCounter = true;

  var prefersReduced = false;
  try {
    prefersReduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var TICK_MS = 1200;
  var SPARK_W = 130, SPARK_H = 30, SPARK_N = 44;
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v) { return v < 0.08 ? 0.08 : (v > 0.92 ? 0.92 : v); };
  var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); };

  /* ---- CSS (own <style>, classes scoped to .cfct-*) --------------------- */
  function injectCSS() {
    if (document.getElementById("cf-intro-counter-css")) return;
    var css =
      ".cfct-badge{position:absolute;top:0;right:0;z-index:6;pointer-events:none;" +
        "display:flex;flex-direction:column;gap:.32rem;padding:.6rem .7rem;" +
        "border-radius:14px;border:1px solid var(--ring);" +
        "background:linear-gradient(180deg,var(--panel),var(--chip-bg));" +
        "box-shadow:0 8px 28px rgba(0,0,0,.32);" +
        "backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);" +
        "opacity:0;transform:translateY(-6px);transition:opacity .4s ease,transform .4s ease}" +
      ".cfct-badge.cfct-on{opacity:1;transform:translateY(0)}" +
      ".cfct-num{font-family:var(--font-mono);font-weight:700;letter-spacing:.02em;" +
        "font-size:1.5rem;line-height:1;color:var(--text);" +
        "font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1}" +
      ".cfct-num.cfct-roll{animation:cfctRoll .34s ease}" +
      "@keyframes cfctRoll{0%{opacity:.15;transform:translateY(-42%)}" +
        "55%{opacity:1}100%{opacity:1;transform:translateY(0)}}" +
      ".cfct-meta{display:flex;align-items:center;gap:.4rem;" +
        "font-family:var(--font-mono);font-size:.62rem;letter-spacing:.03em;color:var(--muted)}" +
      ".cfct-dot{width:.5rem;height:.5rem;border-radius:50%;flex:none;" +
        "background:var(--highlight);box-shadow:0 0 0 0 var(--highlight);" +
        "animation:cfctPulse 1.6s ease-out infinite}" +
      "@keyframes cfctPulse{0%{box-shadow:0 0 0 0 var(--ring)}" +
        "70%{box-shadow:0 0 0 7px rgba(0,0,0,0)}100%{box-shadow:0 0 0 0 rgba(0,0,0,0)}}" +
      ".cfct-spark{display:block;width:" + SPARK_W + "px;height:" + SPARK_H + "px;opacity:.95}" +
      "@media (prefers-reduced-motion: reduce){" +
        ".cfct-num.cfct-roll{animation:none}.cfct-dot{animation:none}" +
        ".cfct-badge{transition:none;opacity:1;transform:none}}";
    var style = document.createElement("style");
    style.id = "cf-intro-counter-css";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ---- module state ----------------------------------------------------- */
  var slide = null;       // .slide[data-id="intro"]
  var badge = null;       // the mini-panel
  var numEl = null;       // odometer number
  var canvas = null, ctx = null, dpr = 1;
  var count = 1180 + ((Math.random() * 60) | 0);
  var points = [];        // sparkline samples (0..1)
  var timer = null;
  var running = false;

  function buildBadge(inner) {
    badge = document.createElement("div");
    badge.className = "cfct-badge";
    badge.setAttribute("aria-hidden", "true");

    numEl = document.createElement("div");
    numEl.className = "cfct-num";
    numEl.textContent = fmt(count);

    var meta = document.createElement("div");
    meta.className = "cfct-meta";
    var dot = document.createElement("span");
    dot.className = "cfct-dot";
    var label = document.createElement("span");
    label.textContent = "builders shipping right now";
    meta.appendChild(dot);
    meta.appendChild(label);

    canvas = document.createElement("canvas");
    canvas.className = "cfct-spark";
    dpr = Math.min(2, (window.devicePixelRatio || 1));
    canvas.width = Math.round(SPARK_W * dpr);
    canvas.height = Math.round(SPARK_H * dpr);
    try { ctx = canvas.getContext("2d"); } catch (e) { ctx = null; }

    badge.appendChild(numEl);
    badge.appendChild(meta);
    badge.appendChild(canvas);

    // Anchor the absolutely-positioned badge to .slide__inner.
    try {
      var pos = getComputedStyle(inner).position;
      if (pos === "static" || !pos) inner.style.position = "relative";
    } catch (e) {}
    inner.appendChild(badge);

    // Seed the sparkline so it isn't empty on first paint.
    var v = 0.5;
    for (var i = 0; i < SPARK_N; i++) {
      v = clamp(v + (prefersReduced ? rnd(-0.02, 0.02) : rnd(-0.16, 0.16)));
      points.push(v);
    }
    drawSpark();
  }

  function drawSpark() {
    if (!ctx) return;
    var hi = (getComputedStyle(document.documentElement)
      .getPropertyValue("--highlight").trim()) || "#fff";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    var n = points.length, pad = 2;
    var step = (SPARK_W - pad * 2) / (n - 1);
    var yOf = function (val) { return pad + (1 - val) * (SPARK_H - pad * 2); };

    // faint fill under the line
    ctx.beginPath();
    ctx.moveTo(pad, SPARK_H - pad);
    for (var i = 0; i < n; i++) ctx.lineTo(pad + i * step, yOf(points[i]));
    ctx.lineTo(pad + (n - 1) * step, SPARK_H - pad);
    ctx.closePath();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = hi;
    ctx.fill();

    // the stroked line
    ctx.globalAlpha = 1;
    ctx.beginPath();
    for (var j = 0; j < n; j++) {
      var x = pad + j * step, y = yOf(points[j]);
      if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.strokeStyle = hi;
    ctx.stroke();
    ctx.restore();
  }

  function tick() {
    // odometer
    var delta;
    if (Math.random() < 0.12) delta = -1;
    else delta = 1 + ((Math.random() * 7) | 0);   // +1..+7
    count += delta;
    if (numEl) {
      numEl.textContent = fmt(count);
      if (!prefersReduced) {
        numEl.classList.remove("cfct-roll");
        void numEl.offsetWidth;                    // restart the animation
        numEl.classList.add("cfct-roll");
      }
    }
    // sparkline: push a new sample, scroll left
    var last = points.length ? points[points.length - 1] : 0.5;
    points.push(clamp(last + rnd(-0.18, 0.18)));
    if (points.length > SPARK_N) points.shift();
    drawSpark();
  }

  function start() {
    if (running || prefersReduced) return;
    running = true;
    timer = setInterval(tick, TICK_MS);
  }
  function stop() {
    running = false;
    if (timer) { clearInterval(timer); timer = null; }
  }

  // Watch .active on the intro slide; run only while active & visible.
  function watch() {
    function sync() {
      if (!slide || !slide.isConnected) { stop(); return; }
      var active = slide.classList.contains("active");
      if (badge) badge.classList.toggle("cfct-on", active);
      if (active) start(); else stop();
    }
    sync();
    try {
      var mo = new MutationObserver(sync);
      mo.observe(slide, { attributes: true, attributeFilter: ["class"] });
    } catch (e) {}
    try {
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop();
        else if (slide && slide.classList.contains("active")) start();
      });
    } catch (e) {}
  }

  /* ---- BOOT — rAF-poll for the intro slide, give up after ~10s ---------- */
  function boot() {
    injectCSS();
    var tries = 0;
    (function wait() {
      slide = document.querySelector('.slide[data-id="intro"]');
      var inner = slide && slide.querySelector(".slide__inner");
      if (slide && inner) {
        try { buildBadge(inner); watch(); } catch (e) {}
        return;
      }
      if (tries++ > 600) return;       // ~10s @ 60fps, then give up quietly
      requestAnimationFrame(wait);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
