/* =============================================================================
   GenAI-Codeforce — fx/intro-constellation.js   (self-contained, no build/libs)

   "Neural constellation" behind the INTRO slide only: ~40-70 nodes drift slowly
   with wrap-around, dots in --accent, thin --secondary links between nearby
   nodes (brighter the closer), nodes near the cursor drift gently toward it.
   Understated (low opacity) so headline/panel text stays readable.

   Injects its own <style id="cf-intro-constellation-css">; rAF-polls (~10s cap)
   for .slide[data-id="intro"]; canvas fills the slide BEHIND content with
   pointer-events:none; theme colors read live + re-read ~1s; animates only
   while intro is .active; DPR capped at 2; handles resize; prefers-reduced-
   motion draws one static frame with no loop.
   ============================================================================= */
(function () {
  "use strict";

  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (window.__cfIntroConstellation) return;
  window.__cfIntroConstellation = true;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  /* ---- inject our own CSS ------------------------------------------------ */
  function injectCSS() {
    if (document.getElementById("cf-intro-constellation-css")) return;
    var css = "" +
      ".cfcn-wrap{position:absolute;inset:0;z-index:0;pointer-events:none;" +
        "overflow:hidden;opacity:.5;transition:opacity .5s ease}" +
      ".cfcn-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block}";
    var style = document.createElement("style");
    style.id = "cf-intro-constellation-css";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ---- live theme color reader ------------------------------------------ */
  var rootStyle = null;
  function readVar(name, fallback) {
    try {
      if (!rootStyle) rootStyle = getComputedStyle(document.documentElement);
      var v = rootStyle.getPropertyValue(name);
      v = v && v.trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  function toRGB(col, fallback) {
    fallback = fallback || [255, 90, 74];
    if (!col) return fallback;
    col = col.trim();
    try {
      if (col.charAt(0) === "#") {
        var h = col.slice(1);
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        if (h.length >= 6) {
          return [parseInt(h.slice(0, 2), 16),
                  parseInt(h.slice(2, 4), 16),
                  parseInt(h.slice(4, 6), 16)];
        }
      }
      var m = col.match(/rg?b?a?\(([^)]+)\)/i);
      if (m) {
        var p = m[1].split(",");
        return [parseInt(p[0], 10) || 0, parseInt(p[1], 10) || 0, parseInt(p[2], 10) || 0];
      }
    } catch (e) {}
    return fallback;
  }

  var colors = { accent: [255, 59, 78], secondary: [255, 122, 92] };
  function refreshColors() {
    rootStyle = null; // force fresh read (theme may have changed)
    colors.accent = toRGB(readVar("--accent", "#FF3B4E"), [255, 59, 78]);
    colors.secondary = toRGB(readVar("--secondary", "#FF7A5C"), [255, 122, 92]);
  }

  /* ---- the constellation on a slide -------------------------------------- */
  function Constellation(slide) {
    var wrap = document.createElement("div");
    wrap.className = "cfcn-wrap";
    wrap.setAttribute("aria-hidden", "true");
    var canvas = document.createElement("canvas");
    wrap.appendChild(canvas);
    // first child => behind the .slide__inner content in paint order.
    slide.insertBefore(wrap, slide.firstChild);

    var ctx = canvas.getContext("2d");
    var dpr = 1, cw = 0, ch = 0;
    var nodes = [], LINK = 140, MOUSE_R = 130;
    var mx = -1e4, my = -1e4, hasMouse = false;
    var rafId = 0, running = false, lastTheme = 0;

    function seed() {
      var area = cw * ch;
      var n = Math.max(40, Math.min(70, Math.round(area / 22000)));
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * cw,
          y: Math.random() * ch,
          vx: (Math.random() - 0.5) * 14, // px/s
          vy: (Math.random() - 0.5) * 14
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR at 2
      cw = slide.clientWidth || window.innerWidth;
      ch = slide.clientHeight || window.innerHeight;
      if (cw <= 0 || ch <= 0) return;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.style.width = cw + "px";
      canvas.style.height = ch + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!nodes.length) seed();
    }

    function step(dt) {
      for (var i = 0; i < nodes.length; i++) {
        var p = nodes[i];
        // gentle drift toward the cursor when within radius
        if (hasMouse) {
          var ddx = mx - p.x, ddy = my - p.y;
          var d2 = ddx * ddx + ddy * ddy;
          if (d2 < MOUSE_R * MOUSE_R && d2 > 1) {
            var d = Math.sqrt(d2);
            var pull = (1 - d / MOUSE_R) * 26; // px/s, stronger up close
            p.vx += (ddx / d) * pull * dt;
            p.vy += (ddy / d) * pull * dt;
          }
        }
        // mild speed cap so cursor pull stays understated
        var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (sp > 34) { p.vx = (p.vx / sp) * 34; p.vy = (p.vy / sp) * 34; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // wrap-around at edges
        if (p.x < 0) p.x += cw; else if (p.x > cw) p.x -= cw;
        if (p.y < 0) p.y += ch; else if (p.y > ch) p.y -= ch;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, cw, ch);
      var s = colors.secondary, a = colors.accent;
      var srgb = s[0] + "," + s[1] + "," + s[2];
      // lines between nearby nodes (closer = brighter)
      for (var i = 0; i < nodes.length; i++) {
        var pi = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var pj = nodes[j];
          var dx = pi.x - pj.x, dy = pi.y - pj.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK) {
            var op = (1 - dist / LINK) * 0.6;
            ctx.strokeStyle = "rgba(" + srgb + "," + op.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.stroke();
          }
        }
      }
      // node dots
      ctx.fillStyle = "rgba(" + a[0] + "," + a[1] + "," + a[2] + ",0.9)";
      for (var k = 0; k < nodes.length; k++) {
        var p = nodes[k];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    var last = 0;
    function loop(now) {
      if (!running) return;
      rafId = window.requestAnimationFrame(loop);
      var dt = last ? (now - last) / 1000 : 0;
      last = now;
      if (dt > 0.05) dt = 0.05; // clamp after tab-switch / jank
      if (now - lastTheme > 1000) { refreshColors(); lastTheme = now; }
      step(dt);
      draw();
    }

    function onMove(e) {
      var r = slide.getBoundingClientRect();
      if (!r.width || !r.height) return;
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      hasMouse = true;
    }
    function onLeave() { hasMouse = false; mx = my = -1e4; }

    return {
      start: function () {
        if (running) return;
        if (cw === 0) resize();
        slide.addEventListener("mousemove", onMove);
        slide.addEventListener("mouseleave", onLeave);
        if (reduceMotion) { refreshColors(); draw(); return; }
        running = true;
        last = 0;
        lastTheme = 0;
        rafId = window.requestAnimationFrame(loop);
      },
      stop: function () {
        running = false;
        if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; }
        slide.removeEventListener("mousemove", onMove);
        slide.removeEventListener("mouseleave", onLeave);
        hasMouse = false;
        try { ctx.clearRect(0, 0, cw, ch); } catch (e) {}
      },
      resize: function () {
        resize();
        if (reduceMotion && cw > 0) { refreshColors(); draw(); }
      },
      isRunning: function () { return running; }
    };
  }

  /* ---- wiring ------------------------------------------------------------ */
  function hook(slide) {
    // Idempotent: the boot block can start two pollers (immediate + on
    // DOMContentLoaded), and the deck may re-render — never insert twice.
    if (slide.querySelector(".cfcn-wrap")) return;
    injectCSS();
    refreshColors();
    var net = Constellation(slide);

    function isActive() { return slide.classList.contains("active"); }
    function sync() {
      if (isActive() && document.visibilityState !== "hidden") net.start();
      else net.stop();
    }

    try {
      var mo = new MutationObserver(sync);
      mo.observe(slide, { attributes: true, attributeFilter: ["class"] });
    } catch (e) {}

    window.addEventListener("resize", function () { net.resize(); });
    document.addEventListener("visibilitychange", sync);

    sync();
  }

  function waitForIntro() {
    var tries = 0;
    (function poll() {
      var slide = document.querySelector('.slide[data-id="intro"]');
      if (slide) { hook(slide); return; }
      if (++tries > 600) return; // ~10s safety cap, then give up quietly
      window.requestAnimationFrame(poll);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForIntro);
    waitForIntro(); // also poll now in case the deck is mid-build
  } else {
    waitForIntro();
  }
})();
