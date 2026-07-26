/* =============================================================================
   GenAI-Codeforce — intro-stamp.js  (optional FX layer, vanilla JS, no build)

   Self-contained add-on. Injects its own CSS, rAF-polls until the INTRO slide
   and its <h2> exist, then wires up ONE easter egg. Touches nothing else: it
   never alters the h2's text/innerHTML (another module animates that), never
   preventDefault()s, and all overlays are pointer-events:none.

   EFFECT — "Title rubber-stamp + confetti":
   Double-click the intro <h2> to "thunk" a rotated rubber-STAMP badge reading
   "SEE YOU THERE" over the headline (scale 1.6 -> 1 + ink-spread settle) and
   pop ~50-60 confetti particles (rAF physics: launch out/up, gravity, rotate,
   fade, remove). Double-click again resets and replays. Reduced-motion shows
   the stamp instantly with a small static sparkle (no heavy confetti).
   ============================================================================= */
(function () {
  "use strict";

  if (window.__cfIntroStamp) return;
  window.__cfIntroStamp = true;

  var prefersReduced = false;
  try {
    prefersReduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var CONFETTI_COLORS = ["--primary", "--secondary", "--accent", "--highlight"];
  var CONFETTI_EMOJI = ["🎉", "✨"];
  var MAX_PARTICLES = 60;

  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (arr) { return arr[(Math.random() * arr.length) | 0]; };
  function cssVar(name) {
    try {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(name).trim();
    } catch (e) { return ""; }
  }

  /* ---- CSS (own <style>, scoped to .cfst-* classes) --------------------- */
  function injectCSS() {
    if (document.getElementById("cf-intro-stamp-css")) return;
    var css =
      ".cfst-layer{position:fixed;inset:0;z-index:60;pointer-events:none;overflow:hidden;contain:layout style}" +
      ".cfst-p{position:fixed;top:0;left:0;width:9px;height:14px;border-radius:2px;" +
        "will-change:transform,opacity;pointer-events:none}" +
      ".cfst-e{position:fixed;top:0;left:0;line-height:1;will-change:transform,opacity;" +
        "pointer-events:none;user-select:none;-webkit-user-select:none}" +
      ".cfst-stamp{position:fixed;top:0;left:0;z-index:61;pointer-events:none;" +
        "padding:.5rem 1.1rem;border:3px double var(--accent,#fff);border-radius:8px;" +
        "font:800 1.5rem/1 var(--font-mono,monospace);letter-spacing:.12em;" +
        "text-transform:uppercase;white-space:nowrap;color:var(--primary,#fff);" +
        "background:transparent;opacity:0;transform-origin:50% 50%;" +
        "transform:translate(-50%,-50%) rotate(-11deg) scale(1.6)}" +
      ".cfst-stamp.cfst-on{animation:cfstThunk .42s cubic-bezier(.2,.9,.25,1.4) forwards}" +
      "@keyframes cfstThunk{" +
        "0%{opacity:0;transform:translate(-50%,-50%) rotate(-11deg) scale(1.6);" +
          "box-shadow:0 0 0 0 var(--ring,rgba(255,255,255,.25))}" +
        "55%{opacity:1;transform:translate(-50%,-50%) rotate(-11deg) scale(.94);" +
          "box-shadow:0 0 0 7px var(--ring,rgba(255,255,255,.18)),0 0 22px var(--ring,rgba(255,255,255,.25))}" +
        "100%{opacity:1;transform:translate(-50%,-50%) rotate(-11deg) scale(1);" +
          "box-shadow:0 0 0 0 rgba(0,0,0,0),0 4px 18px rgba(0,0,0,.3)}}" +
      ".cfst-stamp.cfst-static{opacity:1;transform:translate(-50%,-50%) rotate(-11deg) scale(1);" +
        "box-shadow:0 4px 18px rgba(0,0,0,.3)}" +
      "@media (prefers-reduced-motion: reduce){.cfst-stamp.cfst-on{animation:none;opacity:1;" +
        "transform:translate(-50%,-50%) rotate(-11deg) scale(1)}}";
    var style = document.createElement("style");
    style.id = "cf-intro-stamp-css";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ---- Shared overlay layer (pointer-events:none) ----------------------- */
  var layer = null;
  function getLayer() {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement("div");
    layer.className = "cfst-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    return layer;
  }

  /* ---- Confetti particle (rAF physics, adapted from interactive.js) ----- */
  var liveParticles = 0;

  function spawnPiece(x, y) {
    if (liveParticles >= MAX_PARTICLES) return;
    var useEmoji = Math.random() < 0.12;
    var el;
    if (useEmoji) {
      el = document.createElement("span");
      el.className = "cfst-e";
      el.textContent = pick(CONFETTI_EMOJI);
      el.style.fontSize = (rnd(20, 32) | 0) + "px";
    } else {
      el = document.createElement("i");
      el.className = "cfst-p";
      var col = cssVar(pick(CONFETTI_COLORS)) || cssVar("--text") || "#fff";
      el.style.background = col;
      el.style.width = (rnd(6, 11) | 0) + "px";
      el.style.height = (rnd(10, 18) | 0) + "px";
    }
    getLayer().appendChild(el);
    liveParticles++;

    var px = x, py = y;
    var vx = rnd(-260, 260);
    var vy = rnd(-640, -340);          // launch up/outward
    var g = rnd(1500, 1900);           // gravity px/s^2
    var rot = rnd(-180, 180);
    var vrot = rnd(-540, 540);         // deg/s
    var life = rnd(1.0, 1.6);          // seconds
    var t = 0;
    var last = performance.now();

    function frame(now) {
      var dt = (now - last) / 1000;
      if (dt > 0.05) dt = 0.05;        // clamp after tab-switch / jank
      last = now;
      t += dt;
      vy += g * dt;
      px += vx * dt;
      py += vy * dt;
      rot += vrot * dt;
      var k = t / life;
      var op = k < 0.7 ? 1 : Math.max(0, 1 - (k - 0.7) / 0.3);
      el.style.transform =
        "translate(" + px.toFixed(1) + "px," + py.toFixed(1) + "px) rotate(" +
        rot.toFixed(1) + "deg)";
      el.style.opacity = op;
      if (t < life && py < window.innerHeight + 80 && el.isConnected) {
        requestAnimationFrame(frame);
      } else {
        if (el.parentNode) el.parentNode.removeChild(el);
        liveParticles--;
      }
    }
    requestAnimationFrame(frame);
  }

  function confettiPop(x, y) {
    var n = 50 + ((Math.random() * 11) | 0);   // ~50-60
    if (n > MAX_PARTICLES) n = MAX_PARTICLES;
    for (var i = 0; i < n; i++) spawnPiece(x, y);
  }

  /* ---- The stamp badge -------------------------------------------------- */
  var stampEl = null;
  function getStamp() {
    if (stampEl && stampEl.isConnected) return stampEl;
    stampEl = document.createElement("div");
    stampEl.className = "cfst-stamp";
    stampEl.setAttribute("aria-hidden", "true");
    stampEl.textContent = "SEE YOU THERE ✦";
    getLayer().appendChild(stampEl);
    return stampEl;
  }

  function fire(h2) {
    if (!h2 || !h2.isConnected) return;
    var r = h2.getBoundingClientRect();
    if (!r.width && !r.height) return;
    var cx = r.left + r.width * 0.5;
    var cy = r.top + r.height * 0.5;

    // Stamp: reset then replay the "thunk".
    var s = getStamp();
    s.style.left = cx + "px";
    s.style.top = cy + "px";
    s.className = "cfst-stamp";        // reset to base (clears prior state)
    void s.offsetWidth;               // force reflow so the animation restarts
    if (prefersReduced) {
      s.classList.add("cfst-static");
      // Small static sparkle near the headline (no heavy confetti).
      spawnPiece(cx + rnd(-30, 30), cy - rnd(6, 24));
      return;
    }
    s.classList.add("cfst-on");
    // Confetti pops from just below the headline center.
    confettiPop(cx, cy + r.height * 0.15);
  }

  /* ---- Wiring ----------------------------------------------------------- */
  function init(slide) {
    var h2 = slide.querySelector("h2");
    if (!h2) return;
    // Attach to the h2 ONLY; read position, never mutate, never preventDefault.
    h2.addEventListener("dblclick", function () {
      if (!slide.classList.contains("active")) return;
      try { fire(h2); } catch (e) {}
    });
  }

  /* ---- Boot: rAF-poll until intro slide + its h2 exist (~10s cap) ------- */
  function boot() {
    injectCSS();
    var tries = 0;
    (function wait() {
      var slide = document.querySelector('.slide[data-id="intro"]');
      if (slide && slide.querySelector("h2")) {
        try { init(slide); } catch (e) {}
        return;
      }
      if (tries++ > 600) return;        // ~10s @ 60fps then give up quietly
      requestAnimationFrame(wait);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
