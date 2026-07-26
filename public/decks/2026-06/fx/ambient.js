/* =============================================================================
   GenAI-Codeforce — fx/ambient.js
   Self-contained ambient effects for the COVER slide only. No build step, no
   network, no libraries. Drop-in via <script src="fx/ambient.js"></script>.

   Two effects, in one guarded IIFE:
     (A) "Token rain"  — a Matrix-style canvas of falling AI glyph columns,
                          behind the cover content (z-index 1, between .bg and
                          .deck). Colored live from --accent / --secondary.
                          Animates ONLY while the cover is .active.
     (B) "Parallax tilt" — subtle spring-y 3D parallax on the cover h1 and
                          .cover__meme that follows the cursor; resets on leave.

   Hard rules honoured here:
     • injects its OWN <style> (no edits to styles.css)
     • waits (rAF-poll) for engine.js to build .slide[data-id="cover"]
     • everything guarded; pointer-events:none so clicks/keys pass through
     • caps DPR, pauses when the cover is not active, handles resize
     • respects prefers-reduced-motion (static dim field, no tilt)
   ============================================================================= */
(function () {
  "use strict";

  // Bail safely in non-DOM / unexpected contexts.
  if (typeof document === "undefined" || typeof window === "undefined") return;
  // Run once even if included twice.
  if (window.__cfAmbient) return;
  window.__cfAmbient = true;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var isTouch = false;
  try {
    isTouch = ("ontouchstart" in window) ||
      (navigator.maxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  } catch (e) {}

  /* ---- inject our own CSS ------------------------------------------------ */
  function injectCSS() {
    if (document.getElementById("cf-ambient-css")) return;
    var css = "" +
      ".cf-tokenrain{position:absolute;inset:0;z-index:1;pointer-events:none;" +
      "opacity:.24;mix-blend-mode:screen;transition:opacity .5s ease}" +
      // the canvas only makes sense layered over the cover's own column; we
      // pin it to the cover section which is position:absolute/inset:0.
      ".cf-tokenrain canvas{position:absolute;inset:0;width:100%;height:100%;display:block}" +
      // tilt: give the parallax targets a will-change + transform origin so the
      // spring is smooth and never fights layout. We DON'T set a transform here
      // (the JS owns it) so the cover's own entrance keyframes play untouched.
      ".cf-tilt-on .cover h1,.cf-tilt-on .cover__meme{will-change:transform}";
    var style = document.createElement("style");
    style.id = "cf-ambient-css";
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

  var colors = { accent: "#FF3B4E", secondary: "#FF7A5C" };
  function refreshColors() {
    // getComputedStyle is live, but cache the object lazily; re-read values.
    rootStyle = null; // force fresh read (theme may have changed)
    colors.accent = readVar("--accent", "#FF3B4E");
    colors.secondary = readVar("--secondary", "#FF7A5C");
  }

  // Parse a CSS color into [r,g,b] so we can draw with variable alpha.
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

  /* =========================================================================
     (A) TOKEN RAIN
     ========================================================================= */
  var GLYPHS = ["$", "0", "1", "▮", "░", "◇", "⌁", "GPT", "965B", "FABLE",
                "tok", "AI", "{", "}", "λ", "∑", "0x", "GEN", "▯", "·"];

  function TokenRain(cover) {
    var wrap = document.createElement("div");
    wrap.className = "cf-tokenrain";
    wrap.setAttribute("aria-hidden", "true");
    var canvas = document.createElement("canvas");
    wrap.appendChild(canvas);
    // place it as the FIRST child so it sits behind the cover content in paint
    // order (z-index also keeps it under .deck content which is z-index 10).
    cover.insertBefore(wrap, cover.firstChild);

    var ctx = canvas.getContext("2d");
    var dpr = 1, cw = 0, ch = 0;
    var fontSize = 18, colW = 22, cols = 0, drops = [];
    var rafId = 0, running = false, lastFrame = 0;

    function pickFont() {
      // scale glyph size a touch with viewport, then cap.
      fontSize = Math.max(13, Math.min(22, Math.round((cover.clientWidth || 1280) / 70)));
      colW = Math.round(fontSize * 1.25);
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75); // cap DPR for perf
      cw = cover.clientWidth || window.innerWidth;
      ch = cover.clientHeight || window.innerHeight;
      if (cw <= 0 || ch <= 0) return;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.style.width = cw + "px";
      canvas.style.height = ch + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pickFont();
      cols = Math.max(1, Math.ceil(cw / colW));
      // (re)seed drops, keep existing where possible
      var next = new Array(cols);
      for (var i = 0; i < cols; i++) {
        next[i] = (drops[i] != null)
          ? drops[i]
          : Math.floor((Math.random() * ch) / fontSize) - (ch / fontSize);
      }
      drops = next;
      ctx.font = "600 " + fontSize + "px " + readVar("--font-mono",
        "JetBrains Mono, Consolas, monospace");
      ctx.textBaseline = "top";
    }

    function glyph() { return GLYPHS[(Math.random() * GLYPHS.length) | 0]; }

    // One animated frame: a translucent wash to fade the trail, then a glyph
    // per column with a brighter leading head.
    function drawFrame() {
      var acc = toRGB(colors.accent, [255, 59, 78]);
      var sec = toRGB(colors.secondary, [255, 122, 92]);

      ctx.globalCompositeOperation = "source-over";
      // fade previous frame (creates the trailing tail)
      ctx.fillStyle = "rgba(0,0,0,0.10)";
      ctx.fillRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = "lighter";
      ctx.font = "600 " + fontSize + "px " + readVar("--font-mono",
        "JetBrains Mono, Consolas, monospace");

      for (var i = 0; i < cols; i++) {
        var x = i * colW + (colW - fontSize) / 2;
        var y = drops[i] * fontSize;
        // body glyph (secondary, dim)
        ctx.fillStyle = "rgba(" + sec[0] + "," + sec[1] + "," + sec[2] + ",0.45)";
        ctx.fillText(glyph(), x, y);
        // leading head (accent, bright) just above
        ctx.fillStyle = "rgba(" + acc[0] + "," + acc[1] + "," + acc[2] + ",0.95)";
        ctx.fillText(glyph(), x, y - fontSize);

        if (y > ch && Math.random() > 0.975) drops[i] = -2 - (Math.random() * 12 | 0);
        else drops[i] += 1;
      }
    }

    // Reduced-motion / paused: paint one static, dim field and stop.
    function drawStatic() {
      var acc = toRGB(colors.accent, [255, 59, 78]);
      var sec = toRGB(colors.secondary, [255, 122, 92]);
      ctx.clearRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = "source-over";
      ctx.font = "600 " + fontSize + "px " + readVar("--font-mono",
        "JetBrains Mono, Consolas, monospace");
      var rowsN = Math.ceil(ch / (fontSize * 1.6));
      for (var i = 0; i < cols; i++) {
        for (var r = 0; r < rowsN; r++) {
          // sparse static field
          if (((i * 7 + r * 13) % 3) !== 0) continue;
          var bright = ((i + r) % 9) === 0;
          var c = bright ? acc : sec;
          ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," +
            (bright ? 0.5 : 0.22) + ")";
          ctx.fillText(glyph(), i * colW + (colW - fontSize) / 2,
            r * fontSize * 1.6);
        }
      }
    }

    var FRAME_MS = 1000 / 30; // throttle to ~30fps; plenty for a glyph rain
    function loop(now) {
      if (!running) return;
      rafId = window.requestAnimationFrame(loop);
      if (now - lastFrame < FRAME_MS) return;
      lastFrame = now;
      drawFrame();
    }

    return {
      start: function () {
        if (running) return;
        if (cw === 0) resize();
        if (reduceMotion) { drawStatic(); return; }
        running = true;
        lastFrame = 0;
        rafId = window.requestAnimationFrame(loop);
      },
      stop: function () {
        running = false;
        if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; }
        // clear so it never bleeds visually while paused/off-cover
        try { ctx.clearRect(0, 0, cw, ch); } catch (e) {}
      },
      resize: function () {
        resize();
        if (reduceMotion && cw > 0) drawStatic();
      },
      retheme: function () {
        // colors object already refreshed by caller; redraw static if frozen
        if (reduceMotion && cw > 0) drawStatic();
      },
      isRunning: function () { return running; }
    };
  }

  /* =========================================================================
     (B) PARALLAX TILT  (spring lerp toward cursor target; reset on leave)
     ========================================================================= */
  function ParallaxTilt(cover) {
    var title = cover.querySelector(".cover h1") || cover.querySelector("h1");
    var meme = cover.querySelector(".cover__meme");
    if (!title && !meme) return null;

    // target (where the cursor wants us) and current (eased) values.
    var tX = 0, tY = 0;          // normalized -1..1
    var cX = 0, cY = 0;
    var active = false;          // pointer is over the cover
    var rafId = 0, looping = false;
    var idleFrames = 0;

    // depths — meme moves more than the title for a layered feel. Tiny & tasteful.
    var TITLE = { tx: 8,  ty: 6,  rx: 3,  ry: 4 };
    var MEME  = { tx: 16, ty: 12, rx: 7,  ry: 9 };

    function onMove(e) {
      var r = cover.getBoundingClientRect();
      if (!r.width || !r.height) return;
      tX = ((e.clientX - r.left) / r.width) * 2 - 1;   // -1 (left) .. 1 (right)
      tY = ((e.clientY - r.top) / r.height) * 2 - 1;   // -1 (top)  .. 1 (bottom)
      tX = Math.max(-1, Math.min(1, tX));
      tY = Math.max(-1, Math.min(1, tY));
      active = true;
      ensureLoop();
    }
    function onLeave() {
      active = false;
      tX = 0; tY = 0;          // spring back to neutral
      ensureLoop();
    }

    function apply(el, d) {
      if (!el) return;
      var rotX = (-cY * d.rx).toFixed(2);
      var rotY = (cX * d.ry).toFixed(2);
      var trX = (cX * d.tx).toFixed(2);
      var trY = (cY * d.ty).toFixed(2);
      el.style.transform =
        "perspective(900px) translate3d(" + trX + "px," + trY + "px,0) " +
        "rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)";
    }
    function clearTransforms() {
      if (title) title.style.transform = "";
      if (meme) meme.style.transform = "";
    }

    function tick() {
      if (!looping) return;
      // critically-damped-ish lerp
      cX += (tX - cX) * 0.10;
      cY += (tY - cY) * 0.10;
      apply(title, TITLE);
      apply(meme, MEME);

      var settled = Math.abs(tX - cX) < 0.002 && Math.abs(tY - cY) < 0.002;
      if (settled) {
        cX = tX; cY = tY;
        apply(title, TITLE);
        apply(meme, MEME);
        // if we've settled at neutral and the pointer is gone, release the
        // inline transform so the cover's own CSS fully owns it again.
        if (!active && Math.abs(cX) < 0.002 && Math.abs(cY) < 0.002) {
          if (++idleFrames > 2) { clearTransforms(); looping = false; rafId = 0; return; }
        } else {
          idleFrames = 0;
        }
      } else {
        idleFrames = 0;
      }
      rafId = window.requestAnimationFrame(tick);
    }
    function ensureLoop() {
      if (looping) return;
      looping = true;
      idleFrames = 0;
      rafId = window.requestAnimationFrame(tick);
    }

    return {
      enable: function () {
        document.documentElement.classList.add("cf-tilt-on");
        cover.addEventListener("mousemove", onMove);
        cover.addEventListener("mouseleave", onLeave);
      },
      disable: function () {
        cover.removeEventListener("mousemove", onMove);
        cover.removeEventListener("mouseleave", onLeave);
        active = false; tX = 0; tY = 0;
        // ease back to rest, then clear.
        ensureLoop();
      }
    };
  }

  /* =========================================================================
     WIRING — wait for the deck, then hook the cover + theme + visibility.
     ========================================================================= */
  function hook(cover) {
    injectCSS();
    refreshColors();

    var rain = TokenRain(cover);
    var tilt = (!reduceMotion && !isTouch) ? ParallaxTilt(cover) : null;

    function isCoverActive() { return cover.classList.contains("active"); }

    function syncRain() {
      if (isCoverActive() && document.visibilityState !== "hidden") {
        rain.start();
      } else {
        rain.stop();
      }
    }
    function syncTilt() {
      if (!tilt) return;
      if (isCoverActive()) tilt.enable();
      else tilt.disable();
    }
    function sync() { syncRain(); syncTilt(); }

    // React to the engine toggling .active on the cover slide.
    try {
      var mo = new MutationObserver(function () { sync(); });
      mo.observe(cover, { attributes: true, attributeFilter: ["class"] });
    } catch (e) {}

    // React to theme changes on html[data-theme] (T key).
    try {
      var themeMo = new MutationObserver(function () {
        refreshColors();
        rain.retheme();
      });
      themeMo.observe(document.documentElement, {
        attributes: true, attributeFilter: ["data-theme"]
      });
    } catch (e) {}

    window.addEventListener("resize", function () {
      rain.resize();
      if (rain.isRunning()) { /* loop keeps drawing */ }
    });

    // pause the rain when the tab is hidden (saves CPU)
    document.addEventListener("visibilitychange", syncRain);

    // initial state
    sync();
  }

  function waitForCover() {
    // engine.js builds slides on DOMContentLoaded — which may be AFTER us.
    var tries = 0;
    (function poll() {
      var cover = document.querySelector('.slide[data-id="cover"]');
      if (cover) { hook(cover); return; }
      if (++tries > 600) return; // ~10s safety cap, then give up quietly
      window.requestAnimationFrame(poll);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForCover);
    // also start polling immediately in case the deck is already mid-build
    waitForCover();
  } else {
    waitForCover();
  }
})();
