/* =============================================================================
   GenAI-Codeforce — interactive.js  (optional FX layer, vanilla JS, no build)

   Self-contained add-on. Injects its own CSS, waits for the deck to exist,
   then wires up two effects. Touches nothing the engine owns: it never
   preventDefault()s navigation keys and never blocks pointer events.

   (A) Emoji eruption — click anywhere on the COVER slide to erupt a burst of
       emoji particles (rAF physics: launch up, gravity, rotate, fade, remove).
   (B) Konami RAVE MODE — type  ↑ ↑ ↓ ↓ ← → ← →  B  A  for a ~4s rave:
       rapid theme cycling, emoji/confetti shower, screen-shake, then a clean
       restore of the theme that was active before.
   ============================================================================= */
(function () {
  "use strict";

  // Don't double-install (e.g. if the script is included twice).
  if (window.__cfInteractive) return;
  window.__cfInteractive = true;

  var THEMES = ["aia", "aialight", "neon", "synth", "plasma", "volt"];
  // On-theme burst: AI hype + the $965B bubble + 72h-vanish gag. 🫧 (bubble),
  // 🪦 (deprecated/vanished model) and ⏳ (72h lifespan) all reference the deck.
  var ERUPT_EMOJI = ["🫠", "💸", "💀", "🔥", "📈", "🤯", "🤖", "🧠", "🚀", "📉",
                     "🫧", "🎈", "💥", "🪙", "🤑", "👀", "✨", "🧨", "🪦", "⏳",
                     "⚡", "💰"];
  var RAVE_EMOJI = ["🎉", "🎊", "✨", "🫠", "🔥", "💜", "💚", "💸", "🤯", "🌈",
                    "🪩", "🤖", "🚀", "🫧", "🥳", "💥"];

  var prefersReduced = false;
  try {
    prefersReduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  /* ---- CSS (own <style>, scoped to .cf-fx-* classes) -------------------- */
  function injectCSS() {
    if (document.getElementById("cf-fx-style")) return;
    var css =
      ".cf-fx-layer{position:fixed;inset:0;z-index:55;pointer-events:none;overflow:hidden;contain:layout style}" +
      ".cf-fx-p{position:fixed;top:0;left:0;will-change:transform,opacity;pointer-events:none;" +
        "font-size:26px;line-height:1;user-select:none;-webkit-user-select:none}" +
      ".cf-fx-confetti{position:fixed;top:0;left:0;width:9px;height:14px;border-radius:2px;" +
        "will-change:transform,opacity;pointer-events:none}" +
      ".cf-fx-shake{animation:cfFxShake .42s linear infinite}" +
      "@keyframes cfFxShake{" +
        "0%{transform:translate(0,0)}" +
        "20%{transform:translate(-7px,4px) rotate(-.4deg)}" +
        "40%{transform:translate(6px,-5px) rotate(.5deg)}" +
        "60%{transform:translate(-5px,-3px) rotate(-.3deg)}" +
        "80%{transform:translate(6px,5px) rotate(.4deg)}" +
        "100%{transform:translate(0,0)}}" +
      ".cf-fx-toast{position:fixed;left:50%;bottom:6.5%;transform:translateX(-50%) translateY(20px);" +
        "z-index:80;pointer-events:none;opacity:0;" +
        "padding:.6rem 1.1rem;border-radius:999px;" +
        "font:700 .95rem/1 var(--font-mono,monospace);letter-spacing:.04em;" +
        "color:var(--text,#fff);background:rgba(0,0,0,.55);" +
        "border:1px solid var(--ring,rgba(255,255,255,.35));" +
        "box-shadow:0 8px 30px rgba(0,0,0,.45);" +
        "backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);" +
        "transition:opacity .25s ease,transform .25s ease}" +
      ".cf-fx-toast.cf-on{opacity:1;transform:translateX(-50%) translateY(0)}" +
      "@media (prefers-reduced-motion: reduce){.cf-fx-shake{animation:none}}";
    var style = document.createElement("style");
    style.id = "cf-fx-style";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ---- A shared overlay layer for all particles (pointer-events:none) ---- */
  var layer = null;
  function getLayer() {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement("div");
    layer.className = "cf-fx-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    return layer;
  }

  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (arr) { return arr[(Math.random() * arr.length) | 0]; };

  /* =====================================================================
     (A) EMOJI ERUPTION
     ===================================================================== */
  var ERUPT_THROTTLE_MS = 140;     // min gap between bursts
  var MAX_PARTICLES = 220;         // global safety cap
  var liveParticles = 0;
  var lastErupt = 0;

  function spawnParticle(x, y, emoji) {
    if (liveParticles >= MAX_PARTICLES) return;
    var el = document.createElement("span");
    el.className = "cf-fx-p";
    el.textContent = emoji;
    el.style.fontSize = (rnd(20, 38) | 0) + "px";
    getLayer().appendChild(el);
    liveParticles++;

    // physics state (px, px/s)
    var vx = rnd(-220, 220);
    var vy = rnd(-720, -420);          // launch upward
    var g = rnd(1500, 1900);           // gravity px/s^2
    var rot = rnd(-180, 180);
    var vrot = rnd(-540, 540);         // deg/s
    var life = rnd(1.1, 1.7);          // seconds
    var t = 0;
    var last = performance.now();
    var px = x, py = y;

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

  function erupt(x, y) {
    if (prefersReduced) return;
    var now = performance.now();
    if (now - lastErupt < ERUPT_THROTTLE_MS) return;
    lastErupt = now;
    var n = 12 + ((Math.random() * 9) | 0);   // ~12–20
    for (var i = 0; i < n; i++) {
      spawnParticle(x, y, pick(ERUPT_EMOJI));
    }
  }

  function initErupt(cover) {
    // Listen on the cover element itself; particles are pointer-events:none so
    // they never intercept the click, and the engine's own handlers still run.
    cover.addEventListener("click", function (e) {
      // Only react when the cover slide is actually active/visible.
      if (!cover.classList.contains("active")) return;
      erupt(e.clientX, e.clientY);
    });
  }

  /* =====================================================================
     (B) KONAMI RAVE MODE
     ===================================================================== */
  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
                "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
                "KeyB", "KeyA"];
  var progress = 0;
  var raveActive = false;

  function getDeck() {
    return document.querySelector("main.deck") || document.getElementById("deck");
  }

  function showToast(text, ms) {
    var t = document.createElement("div");
    t.className = "cf-fx-toast";
    t.textContent = text;
    document.body.appendChild(t);
    // force reflow so the transition runs
    void t.offsetWidth;
    t.classList.add("cf-on");
    var hide = setTimeout(function () {
      t.classList.remove("cf-on");
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
    }, ms || 2600);
    t.__hide = hide;
  }

  function confettiPiece() {
    if (liveParticles >= MAX_PARTICLES) return;
    var useEmoji = Math.random() < 0.5;
    var el = document.createElement(useEmoji ? "span" : "i");
    if (useEmoji) {
      el.className = "cf-fx-p";
      el.textContent = pick(RAVE_EMOJI);
      el.style.fontSize = (rnd(18, 34) | 0) + "px";
    } else {
      el.className = "cf-fx-confetti";
      // pull from theme vars so confetti matches the active palette
      var vars = ["--primary", "--secondary", "--accent", "--highlight"];
      var col = getComputedStyle(document.documentElement)
        .getPropertyValue(pick(vars)).trim() || "#fff";
      el.style.background = col;
      el.style.width = (rnd(6, 11) | 0) + "px";
      el.style.height = (rnd(10, 18) | 0) + "px";
    }
    getLayer().appendChild(el);
    liveParticles++;

    var x = rnd(0, window.innerWidth);
    var y = -30;
    var vx = rnd(-60, 60);
    var vy = rnd(120, 320);
    var g = rnd(180, 360);
    var rot = rnd(0, 360);
    var vrot = rnd(-360, 360);
    var sway = rnd(20, 70);
    var swayPhase = rnd(0, Math.PI * 2);
    var t = 0;
    var last = performance.now();

    function frame(now) {
      var dt = (now - last) / 1000;
      if (dt > 0.05) dt = 0.05;
      last = now;
      t += dt;
      vy += g * dt;
      x += vx * dt;
      y += vy * dt;
      rot += vrot * dt;
      var sx = Math.sin(t * 3 + swayPhase) * sway * dt;
      x += sx;
      el.style.transform =
        "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" +
        rot.toFixed(1) + "deg)";
      el.style.opacity = y > window.innerHeight * 0.7
        ? Math.max(0, 1 - (y - window.innerHeight * 0.7) / (window.innerHeight * 0.4))
        : 1;
      if (y < window.innerHeight + 60 && el.isConnected) {
        requestAnimationFrame(frame);
      } else {
        if (el.parentNode) el.parentNode.removeChild(el);
        liveParticles--;
      }
    }
    requestAnimationFrame(frame);
  }

  function startRave() {
    if (raveActive) return;
    raveActive = true;

    var DURATION = 4000;
    var THEME_EVERY = 250;
    var CONFETTI_EVERY = 90;

    // Save the theme to restore later (read it FIRST).
    var savedTheme = document.documentElement.getAttribute("data-theme");

    var deck = getDeck();
    if (deck && !prefersReduced) deck.classList.add("cf-fx-shake");

    showToast("🎉 RAVE MODE", 2600);

    var timers = [];
    var stopped = false;

    // rapid theme cycling
    var ti = 0;
    if (!prefersReduced) {
      var themeTimer = setInterval(function () {
        ti = (ti + 1) % THEMES.length;
        document.documentElement.setAttribute("data-theme", THEMES[ti]);
      }, THEME_EVERY);
      timers.push(themeTimer);
    }

    // confetti shower
    var confettiTimer = setInterval(function () {
      var burst = prefersReduced ? 0 : 2 + ((Math.random() * 3) | 0);
      for (var i = 0; i < burst; i++) confettiPiece();
    }, CONFETTI_EVERY);
    timers.push(confettiTimer);

    function cleanup() {
      if (stopped) return;
      stopped = true;
      for (var i = 0; i < timers.length; i++) clearInterval(timers[i]);
      if (deck) deck.classList.remove("cf-fx-shake");
      // Restore the exact theme that was active before the rave.
      if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
      else document.documentElement.removeAttribute("data-theme");
      raveActive = false;
    }

    timers.push(setTimeout(cleanup, DURATION));
    // Safety net: also pin a guaranteed cleanup slightly later.
    window.__cfRaveCleanup = cleanup;
  }

  function initKonami() {
    document.addEventListener("keydown", function (e) {
      // Use e.code so it's layout-independent and matches KeyB/KeyA cleanly.
      // NEVER preventDefault — arrows must keep navigating the deck.
      var code = e.code;
      if (code === KONAMI[progress]) {
        progress++;
        if (progress === KONAMI.length) {
          progress = 0;
          startRave();
        }
      } else {
        // Allow a wrong key that happens to be the start of the sequence to
        // re-seed progress (e.g. mashing ArrowUp).
        progress = (code === KONAMI[0]) ? 1 : 0;
      }
    });
  }

  /* =====================================================================
     BOOT — rAF-poll until the cover slide exists, then hook in.
     ===================================================================== */
  function boot() {
    injectCSS();
    var tries = 0;
    (function wait() {
      var cover = document.querySelector('.slide[data-id="cover"]');
      if (cover) {
        try { initErupt(cover); } catch (e) {}
        try { initKonami(); } catch (e) {}
        return;
      }
      if (tries++ > 600) {            // ~10s @ 60fps then give up quietly
        // Konami can still work without the cover; wire it up anyway.
        try { initKonami(); } catch (e) {}
        return;
      }
      requestAnimationFrame(wait);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
