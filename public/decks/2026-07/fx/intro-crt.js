/* =============================================================================
   GenAI-Codeforce — intro-crt.js  (optional FX layer, vanilla JS, no build)

   Self-contained add-on. Injects its own CSS, waits (rAF-poll, ~10s cap) for
   engine.js to build .slide[data-id="intro"], then wires up ONE effect.
   Touches nothing the engine owns: no nav-key handlers, never preventDefault.

   ONE effect — "Retro CRT mode toggle":
     • A small pill button "📺 CRT" pinned bottom-left of the intro slide
       (pointer-events:auto) toggles a full-slide CRT overlay.
     • Overlay = scanlines + vignette + faint moving flicker + RGB edge glow.
       It is pointer-events:none and only VISIBLE while intro is .active AND
       the toggle is ON. A brief "power-on" flash plays when enabling.
     • State persists in localStorage "cf-intro-crt"; restored on load.
     • prefers-reduced-motion: static scanlines + vignette, no flicker anim.
   ============================================================================= */
(function () {
  "use strict";

  if (window.__cfIntroCrt) return;
  window.__cfIntroCrt = true;

  var LS_KEY = "cf-intro-crt";

  var prefersReduced = false;
  try {
    prefersReduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  function readState() {
    try { return localStorage.getItem(LS_KEY) === "1"; } catch (e) { return false; }
  }
  function writeState(on) {
    try { localStorage.setItem(LS_KEY, on ? "1" : "0"); } catch (e) {}
  }

  /* ---- CSS (own <style>, scoped to .cfcr-* classes) -------------------- */
  function injectCSS() {
    if (document.getElementById("cf-intro-crt-css")) return;
    var css =
      /* full-slide overlay — never blocks clicks */
      ".cfcr-overlay{position:absolute;inset:0;z-index:6;pointer-events:none;" +
        "overflow:hidden;opacity:0;visibility:hidden;contain:layout style;" +
        "transition:opacity .25s ease,visibility .25s ease}" +
      ".cfcr-overlay.cfcr-show{opacity:1;visibility:visible}" +
      /* scanlines */
      ".cfcr-scan{position:absolute;inset:0;" +
        "background:repeating-linear-gradient(to bottom," +
          "rgba(0,0,0,.18) 0 1px,rgba(0,0,0,0) 1px 3px)}" +
      /* vignette — darken edges */
      ".cfcr-vig{position:absolute;inset:0;" +
        "background:radial-gradient(120% 120% at 50% 50%," +
          "rgba(0,0,0,0) 55%,rgba(0,0,0,.45) 100%)}" +
      /* RGB / chroma edge glow via theme vars */
      ".cfcr-fringe{position:absolute;inset:0;" +
        "box-shadow:inset 0 0 60px var(--ring,rgba(255,255,255,.25))," +
          "inset 0 0 2px var(--secondary,rgba(255,255,255,.4))," +
          "inset 0 0 110px rgba(0,0,0,.35);" +
        "border:1px solid var(--accent,rgba(255,255,255,.2));" +
        "opacity:.5}" +
      /* flicker — low-opacity animated brightness sheet */
      ".cfcr-flick{position:absolute;inset:0;" +
        "background:rgba(255,255,255,.03);" +
        "animation:cfcrFlicker 3.2s steps(2,end) infinite}" +
      "@keyframes cfcrFlicker{" +
        "0%{opacity:.10}25%{opacity:.03}50%{opacity:.14}" +
        "62%{opacity:.05}75%{opacity:.12}100%{opacity:.04}}" +
      /* power-on flash — bright line that expands then fades */
      ".cfcr-flash{position:absolute;left:0;right:0;top:50%;height:2px;" +
        "transform:translateY(-50%) scaleY(1);transform-origin:center;" +
        "background:var(--highlight,#fff);" +
        "box-shadow:0 0 24px var(--highlight,#fff);pointer-events:none}" +
      ".cfcr-flash.cfcr-go{animation:cfcrPowerOn .42s ease-out forwards}" +
      "@keyframes cfcrPowerOn{" +
        "0%{opacity:1;height:2px}" +
        "35%{opacity:1;height:2px}" +
        "100%{opacity:0;height:100%}}" +
      /* toggle pill — bottom-left, the ONLY interactive element */
      ".cfcr-btn{position:absolute;left:1.4rem;bottom:1.4rem;z-index:7;" +
        "pointer-events:auto;cursor:pointer;" +
        "padding:.4rem .8rem;border-radius:999px;" +
        "font:700 .8rem/1 var(--font-mono,monospace);letter-spacing:.06em;" +
        "color:var(--text,#fff);background:rgba(0,0,0,.45);" +
        "border:1px solid var(--ring,rgba(255,255,255,.35));" +
        "box-shadow:0 4px 18px rgba(0,0,0,.35);" +
        "backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);" +
        "transition:border-color .2s ease,box-shadow .2s ease,color .2s ease}" +
      ".cfcr-btn:hover{border-color:var(--secondary,rgba(255,255,255,.6))}" +
      ".cfcr-btn.cfcr-on{color:var(--highlight,#fff);" +
        "border-color:var(--accent,#fff);" +
        "box-shadow:0 0 14px var(--ring,rgba(255,255,255,.5))," +
          "0 4px 18px rgba(0,0,0,.35)}" +
      "@media (prefers-reduced-motion: reduce){" +
        ".cfcr-flick{animation:none;opacity:.06}" +
        ".cfcr-flash.cfcr-go{animation:none;opacity:0}}";
    var style = document.createElement("style");
    style.id = "cf-intro-crt-css";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ---- module state ----------------------------------------------------- */
  var slide = null;     // .slide[data-id="intro"]
  var overlay = null;   // full-slide CRT layer (pointer-events:none)
  var btn = null;       // toggle pill (pointer-events:auto)
  var enabled = false;  // toggle on/off

  /* Overlay is only VISIBLE while intro is .active AND toggle is ON. */
  function refresh() {
    if (!overlay || !slide) return;
    var visible = enabled && slide.classList.contains("active");
    if (visible) overlay.classList.add("cfcr-show");
    else overlay.classList.remove("cfcr-show");
  }

  function powerOnFlash() {
    if (prefersReduced || !overlay) return;
    var flash = document.createElement("div");
    flash.className = "cfcr-flash";
    overlay.appendChild(flash);
    // force reflow so the animation runs from the start
    void flash.offsetWidth;
    flash.classList.add("cfcr-go");
    setTimeout(function () {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 600);
  }

  function setEnabled(on, animate) {
    enabled = !!on;
    writeState(enabled);
    if (btn) {
      if (enabled) btn.classList.add("cfcr-on");
      else btn.classList.remove("cfcr-on");
      btn.setAttribute("aria-pressed", enabled ? "true" : "false");
    }
    var wasVisible = overlay && overlay.classList.contains("cfcr-show");
    refresh();
    // Play power-on flash only when turning ON and now actually visible.
    if (animate && enabled && !wasVisible &&
        overlay && overlay.classList.contains("cfcr-show")) {
      powerOnFlash();
    }
  }

  function build(introSlide) {
    slide = introSlide;
    if (slide.querySelector(".cfcr-btn")) return; // idempotent

    overlay = document.createElement("div");
    overlay.className = "cfcr-overlay";
    overlay.setAttribute("aria-hidden", "true");
    var vig = document.createElement("div"); vig.className = "cfcr-vig";
    var scan = document.createElement("div"); scan.className = "cfcr-scan";
    var fringe = document.createElement("div"); fringe.className = "cfcr-fringe";
    var flick = document.createElement("div"); flick.className = "cfcr-flick";
    overlay.appendChild(vig);
    overlay.appendChild(scan);
    overlay.appendChild(fringe);
    overlay.appendChild(flick);
    slide.appendChild(overlay);

    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cfcr-btn";
    btn.textContent = "📺 CRT";
    btn.setAttribute("aria-label", "Toggle retro CRT mode");
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", function () { setEnabled(!enabled, true); });
    slide.appendChild(btn);

    // Restore persisted state (overlay only shows while intro is active).
    setEnabled(readState(), false);

    // Re-evaluate visibility when the slide's active class changes.
    try {
      var mo = new MutationObserver(refresh);
      mo.observe(slide, { attributes: true, attributeFilter: ["class"] });
    } catch (e) {}
  }

  /* ---- boot — rAF-poll until the intro slide exists --------------------- */
  function boot() {
    injectCSS();
    var tries = 0;
    (function wait() {
      var introSlide = document.querySelector('.slide[data-id="intro"]');
      if (introSlide) { try { build(introSlide); } catch (e) {} return; }
      if (tries++ > 600) return; // ~10s @ 60fps then give up quietly
      requestAnimationFrame(wait);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
