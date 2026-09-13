/* =============================================================================
   GenAI-Codeforce — fx/intro-tilt.js
   Self-contained add-on for the INTRO slide only. No build, no network, no libs.
   Drop-in via <script src="fx/intro-tilt.js"></script>.

   ONE effect — "Panel 3D tilt + cursor spotlight":
   For EACH of the two .panel elements inside .slide[data-id="intro"]:
     • pointermove tilts the panel toward the cursor up to ~6deg
       (perspective rotateX/rotateY), smoothed with an rAF lerp; resets flat
       on pointerleave.
     • a radial "spotlight" glow (a pointer-events:none overlay child) follows
       the cursor inside the panel and fades out on leave.

   Hard rules honoured:
     • injects its OWN <style id="cf-intro-tilt-css"> (no edits to styles.css)
     • rAF-polls for the intro slide + its two .panels; gives up after ~10s
     • active only while the intro slide is .active (listeners + transforms
       are torn down when inactive)
     • respects prefers-reduced-motion (no tilt; a static soft glow instead)
     • the glow + anything added is pointer-events:none, so buttons/flip-cards
       inside the panels stay clickable
     • all CSS classes prefixed .cftl-; theme CSS vars only; guarded; idempotent
   ============================================================================= */
(function () {
  "use strict";

  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (window.__cfIntroTilt) return;
  window.__cfIntroTilt = true;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var MAX_TILT = 6; // degrees

  /* ---- inject our own CSS ------------------------------------------------- */
  function injectCSS() {
    if (document.getElementById("cf-intro-tilt-css")) return;
    var css = "" +
      // panel becomes a 3D stage; children ride along. We DON'T set a permanent
      // transform here (the JS owns it) so the deck's own hover/layout stay put.
      ".cftl-on{transform-style:preserve-3d;will-change:transform}" +
      // the spotlight overlay: clipped to the panel's rounded corners, never
      // eats pointer events so buttons/flip-cards underneath stay clickable.
      ".cftl-glow{position:absolute;inset:0;pointer-events:none;border-radius:inherit;" +
        "overflow:hidden;opacity:0;transition:opacity .35s ease;z-index:0}" +
      // keep the glow behind real panel content (which is static/auto z-index).
      ".cftl-on > .cftl-glow{z-index:0}" +
      // reduced-motion: a gentle static glow, no movement.
      "@media (prefers-reduced-motion: reduce){" +
        ".cftl-on{transition:none}.cftl-glow{transition:none}}";
    var style = document.createElement("style");
    style.id = "cf-intro-tilt-css";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ---- per-panel controller ---------------------------------------------- */
  function makePanel(panel) {
    // ensure inset:0 overlay positions correctly without disturbing layout
    var pos = "";
    try { pos = getComputedStyle(panel).position; } catch (e) {}
    if (pos === "static" || !pos) panel.style.position = "relative";
    panel.classList.add("cftl-on");

    var glow = document.createElement("div");
    glow.className = "cftl-glow";
    glow.setAttribute("aria-hidden", "true");
    // first child so it paints under the panel's real content
    panel.insertBefore(glow, panel.firstChild);

    // target (where cursor wants us) + current (eased) tilt, normalized -1..1
    var tX = 0, tY = 0, cX = 0, cY = 0;
    var active = false, looping = false, rafId = 0, idle = 0;

    function setGlow(px, py, on) {
      // px/py are 0..100 percentages within the panel
      glow.style.background =
        "radial-gradient(220px circle at " + px.toFixed(1) + "% " + py.toFixed(1) +
        "%, var(--ring), var(--highlight) 35%, transparent 70%)";
      glow.style.opacity = on ? "0.28" : "0";
    }

    function onMove(e) {
      var r = panel.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var nx = (e.clientX - r.left) / r.width;   // 0..1
      var ny = (e.clientY - r.top) / r.height;   // 0..1
      setGlow(nx * 100, ny * 100, true);
      if (reduceMotion) return;
      tX = Math.max(-1, Math.min(1, nx * 2 - 1));
      tY = Math.max(-1, Math.min(1, ny * 2 - 1));
      active = true;
      ensureLoop();
    }
    function onLeave() {
      active = false;
      tX = 0; tY = 0;
      glow.style.opacity = "0";
      if (!reduceMotion) ensureLoop();
    }

    function apply() {
      panel.style.transform =
        "perspective(900px) rotateX(" + (-cY * MAX_TILT).toFixed(2) +
        "deg) rotateY(" + (cX * MAX_TILT).toFixed(2) + "deg)";
    }
    function clearTilt() { panel.style.transform = ""; }

    function tick() {
      if (!looping) return;
      cX += (tX - cX) * 0.12;
      cY += (tY - cY) * 0.12;
      apply();
      var settled = Math.abs(tX - cX) < 0.002 && Math.abs(tY - cY) < 0.002;
      if (settled) {
        cX = tX; cY = tY; apply();
        if (!active && Math.abs(cX) < 0.002 && Math.abs(cY) < 0.002) {
          if (++idle > 2) { clearTilt(); looping = false; rafId = 0; return; }
        } else { idle = 0; }
      } else { idle = 0; }
      rafId = window.requestAnimationFrame(tick);
    }
    function ensureLoop() {
      if (looping) return;
      looping = true; idle = 0;
      rafId = window.requestAnimationFrame(tick);
    }

    return {
      enable: function () {
        panel.addEventListener("pointermove", onMove);
        panel.addEventListener("pointerleave", onLeave);
        if (reduceMotion) {
          // a gentle, centered static glow — no movement.
          setGlow(50, 50, true);
        }
      },
      disable: function () {
        panel.removeEventListener("pointermove", onMove);
        panel.removeEventListener("pointerleave", onLeave);
        active = false; tX = 0; tY = 0;
        glow.style.opacity = "0";
        if (reduceMotion) { return; }
        ensureLoop(); // ease back to flat, then clear
      }
    };
  }

  /* ---- wiring: enable only while the intro slide is .active --------------- */
  function hook(intro, panels) {
    injectCSS();
    var ctrls = [];
    for (var i = 0; i < panels.length; i++) {
      try { ctrls.push(makePanel(panels[i])); } catch (e) {}
    }
    if (!ctrls.length) return;

    var enabled = false;
    function isActive() { return intro.classList.contains("active"); }
    function sync() {
      var want = isActive();
      if (want === enabled) return;
      enabled = want;
      for (var i = 0; i < ctrls.length; i++) {
        try { enabled ? ctrls[i].enable() : ctrls[i].disable(); } catch (e) {}
      }
    }

    try {
      var mo = new MutationObserver(sync);
      mo.observe(intro, { attributes: true, attributeFilter: ["class"] });
    } catch (e) {}

    sync(); // initial state
  }

  /* ---- boot: rAF-poll for the intro slide + its two panels --------------- */
  function boot() {
    injectCSS();
    var tries = 0;
    (function wait() {
      var intro = document.querySelector('.slide[data-id="intro"]');
      if (intro) {
        var panels = intro.querySelectorAll(".grid-2 .panel");
        if (panels && panels.length >= 2) {
          try { hook(intro, panels); } catch (e) {}
          return;
        }
      }
      if (tries++ > 600) return; // ~10s @ 60fps, then give up quietly
      window.requestAnimationFrame(wait);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
    boot(); // also poll now in case the deck is already mid-build
  } else {
    boot();
  }
})();
