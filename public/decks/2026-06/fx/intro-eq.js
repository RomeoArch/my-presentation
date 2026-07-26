/* =============================================================================
   GenAI-Codeforce — fx/intro-eq.js
   Self-contained add-on for the INTRO slide only. No build, no network, no libs.
   Drop-in via <script src="fx/intro-eq.js"></script>.

   ONE effect — "Synthwave equalizer footer":
   A row of ~22 vertical bars pinned to the BOTTOM edge of .slide[data-id="intro"].
   Each bar bounces (scaleY) on its own CSS keyframe with randomized duration +
   negative delay, so the row reads like a music visualizer. The footer is a
   pointer-events:none accent painted BEHIND .slide__inner, so it never covers
   the headline or panels.

   Hard rules honoured:
     • injects its OWN <style id="cf-intro-eq-css"> (no edits to styles.css)
     • rAF-polls for the intro slide; gives up after ~10s
     • motion runs ONLY while the intro slide is .active — toggled purely via CSS
       animation-play-state (no JS rAF loop)
     • respects prefers-reduced-motion (static varied-height bars, no animation)
     • non-interactive: the whole footer is pointer-events:none
     • all CSS classes prefixed .cfeq-; theme CSS vars only; guarded; idempotent
   ============================================================================= */
(function () {
  "use strict";

  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (window.__cfIntroEq) return;
  window.__cfIntroEq = true;

  var BAR_COUNT = 22;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  /* ---- inject our own CSS ------------------------------------------------- */
  function injectCSS() {
    if (document.getElementById("cf-intro-eq-css")) return;
    var css = "" +
      // footer band: full width, anchored to the bottom edge, behind content.
      ".cfeq-footer{position:absolute;left:0;right:0;bottom:0;z-index:0;" +
        "height:12%;display:flex;align-items:flex-end;justify-content:center;" +
        "gap:0.5%;padding:0 2%;pointer-events:none;overflow:hidden;" +
        "contain:layout style}" +
      // each bar: gradient secondary(bottom) -> accent(top), rounded top, glow.
      ".cfeq-bar{flex:1 1 0;min-width:0;transform-origin:bottom center;" +
        "border-radius:5px 5px 0 0;will-change:transform;" +
        "background:linear-gradient(to top,var(--secondary),var(--accent));" +
        "box-shadow:0 0 10px var(--ring),0 0 2px var(--ring);" +
        "animation-name:cfeqBounce;animation-timing-function:ease-in-out;" +
        "animation-iteration-count:infinite;animation-direction:alternate;" +
        // paused by default; running only while the slide is .active.
        "animation-play-state:paused}" +
      // alternate the palette across bars for the synthwave feel.
      ".cfeq-bar:nth-child(3n+1){background:linear-gradient(to top,var(--primary),var(--accent))}" +
      ".cfeq-bar:nth-child(3n+2){background:linear-gradient(to top,var(--secondary),var(--highlight))}" +
      ".cfeq-bar:nth-child(3n+3){background:linear-gradient(to top,var(--accent),var(--highlight))}" +
      // run the bounce only while the intro slide is active.
      ".cfeq-on .cfeq-bar{animation-play-state:running}" +
      "@keyframes cfeqBounce{from{transform:scaleY(0.18)}to{transform:scaleY(1)}}" +
      // reduced motion: no animation at all (static heights set inline).
      "@media (prefers-reduced-motion: reduce){" +
        ".cfeq-bar{animation:none!important}}";
    var style = document.createElement("style");
    style.id = "cf-intro-eq-css";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ---- build the equalizer footer once ----------------------------------- */
  function build(intro) {
    if (intro.querySelector(".cfeq-footer")) return null; // idempotent
    var footer = document.createElement("div");
    footer.className = "cfeq-footer";
    footer.setAttribute("aria-hidden", "true");

    for (var i = 0; i < BAR_COUNT; i++) {
      var bar = document.createElement("span");
      bar.className = "cfeq-bar";
      if (reduceMotion) {
        // static visualizer silhouette: varied heights, no motion.
        bar.style.transform = "scaleY(" + rnd(0.25, 1).toFixed(3) + ")";
      } else {
        bar.style.animationDuration = rnd(0.5, 1.1).toFixed(3) + "s";
        // negative delay desynchronizes phase without a startup pause.
        bar.style.animationDelay = (-rnd(0, 1.1)).toFixed(3) + "s";
        // give each bar a slightly different resting scale via height.
        bar.style.height = (rnd(55, 100)).toFixed(1) + "%";
      }
      footer.appendChild(bar);
    }

    // first child so it paints behind .slide__inner (later in the DOM).
    intro.insertBefore(footer, intro.firstChild);
    return footer;
  }

  /* ---- wiring: animate only while the intro slide is .active -------------- */
  function hook(intro) {
    injectCSS();
    var footer = build(intro);
    if (!footer) return;

    function sync() {
      if (intro.classList.contains("active")) footer.classList.add("cfeq-on");
      else footer.classList.remove("cfeq-on");
    }

    try {
      var mo = new MutationObserver(sync);
      mo.observe(intro, { attributes: true, attributeFilter: ["class"] });
    } catch (e) {}

    sync(); // initial state
  }

  /* ---- boot: rAF-poll for the intro slide -------------------------------- */
  function boot() {
    injectCSS();
    var tries = 0;
    (function wait() {
      var intro = document.querySelector('.slide[data-id="intro"]');
      if (intro) {
        try { hook(intro); } catch (e) {}
        return;
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
