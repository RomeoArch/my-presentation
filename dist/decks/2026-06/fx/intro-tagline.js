/* =============================================================================
   GenAI-Codeforce — intro-tagline.js  (optional FX layer, vanilla JS, no build)

   Self-contained add-on. Injects its own CSS, waits for the intro slide and its
   <h2> to exist, then inserts ONE understated tagline line directly after the
   headline. The line cycles through a set of spicy one-liners every ~3s with a
   smooth vertical 3D flip / slide-up transition. Cycling runs only while the
   intro slide is .active and pauses when it isn't. Touches nothing the engine
   owns: decorative (pointer-events:none), no nav-key handlers, no preventDefault.
   ============================================================================= */
(function () {
  "use strict";

  // Don't double-install (e.g. if the script is included twice).
  if (window.__cfIntroTagline) return;
  window.__cfIntroTagline = true;

  var LINES = [
    "ship > talk",
    "loops > prompts",
    "bring code, not slides",
    "the harness beats the model",
    "pajamas encouraged",
    "demos > decks",
    "we read the hype so you don't have to"
  ];
  var CYCLE_MS = 3000;
  var FLIP_MS = 520;

  var prefersReduced = false;
  try {
    prefersReduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  /* ---- CSS (own <style>, scoped to .cftg-* classes) -------------------- */
  function injectCSS() {
    if (document.getElementById("cf-intro-tagline-css")) return;
    var css =
      ".cftg{position:relative;height:1.6em;overflow:hidden;margin:.55rem 0 .2rem;" +
        "pointer-events:none;font-family:var(--font-mono,monospace);" +
        "font-size:clamp(.85rem,1.6vw,1.05rem);font-weight:600;letter-spacing:.06em;" +
        "color:var(--secondary,#fff);perspective:600px;line-height:1.6}" +
      ".cftg-line{position:absolute;left:0;top:0;width:100%;" +
        "transform-origin:50% 0%;backface-visibility:hidden;" +
        "transform:translateY(100%) rotateX(-90deg);opacity:0;" +
        "transition:transform " + FLIP_MS + "ms var(--ease,cubic-bezier(.16,1,.3,1))," +
        "opacity " + FLIP_MS + "ms var(--ease,cubic-bezier(.16,1,.3,1))}" +
      ".cftg-line.cftg-in{transform:translateY(0) rotateX(0deg);opacity:1}" +
      ".cftg-line.cftg-out{transform:translateY(-100%) rotateX(90deg);opacity:0}" +
      ".cftg-sym{color:var(--highlight,var(--accent,#fff));font-weight:700}" +
      "@media (prefers-reduced-motion: reduce){" +
        ".cftg-line{transition:opacity 600ms var(--ease,ease)}" +
        ".cftg-line,.cftg-line.cftg-in,.cftg-line.cftg-out{" +
          "transform:none}" +
        ".cftg-line{opacity:0}.cftg-line.cftg-in{opacity:1}}";
    var style = document.createElement("style");
    style.id = "cf-intro-tagline-css";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ---- Render a line, accenting the comparator / symbol if easy -------- */
  function renderLine(text) {
    var el = document.createElement("span");
    el.className = "cftg-line";
    el.setAttribute("aria-hidden", "true");
    // Accent a leading/standalone ">" comparator (e.g. "ship > talk").
    var m = text.indexOf(" > ");
    if (m !== -1) {
      el.appendChild(document.createTextNode(text.slice(0, m + 1)));
      var sym = document.createElement("span");
      sym.className = "cftg-sym";
      sym.textContent = ">";
      el.appendChild(sym);
      el.appendChild(document.createTextNode(text.slice(m + 2)));
    } else {
      el.textContent = text;
    }
    return el;
  }

  /* ---- Tagline controller --------------------------------------------- */
  function makeTagline(box) {
    var idx = 0;
    var current = null;
    var timer = null;
    var running = false;

    function show(i, animate) {
      var next = renderLine(LINES[i]);
      box.appendChild(next);
      var prev = current;
      current = next;
      // force reflow so the entry transition runs from the start state
      void next.offsetWidth;
      next.classList.add("cftg-in");
      if (prev) {
        if (animate) {
          prev.classList.remove("cftg-in");
          prev.classList.add("cftg-out");
          setTimeout(function () {
            if (prev.parentNode) prev.parentNode.removeChild(prev);
          }, FLIP_MS + 60);
        } else if (prev.parentNode) {
          prev.parentNode.removeChild(prev);
        }
      }
    }

    function advance() {
      idx = (idx + 1) % LINES.length;
      show(idx, true);
    }

    return {
      start: function () {
        if (running) return;
        running = true;
        if (!current) show(idx, false);
        if (prefersReduced) return;           // static: one tagline, no flips
        timer = setInterval(advance, CYCLE_MS);
      },
      stop: function () {
        running = false;
        if (timer) { clearInterval(timer); timer = null; }
      }
    };
  }

  /* ---- Insert exactly once, after <h2>, before .grid-2 ----------------- */
  function ensureBox(slide) {
    var existing = slide.querySelector ? slide.querySelector(".cftg") : null;
    if (existing) return existing;
    var inner = slide.querySelector ? slide.querySelector(".slide__inner") : null;
    var h2 = slide.querySelector ? slide.querySelector("h2") : null;
    if (!inner || !h2) return null;
    var box = document.createElement("div");
    box.className = "cftg";
    box.setAttribute("aria-hidden", "true");
    if (h2.nextSibling) inner.insertBefore(box, h2.nextSibling);
    else inner.appendChild(box);
    return box;
  }

  function init(slide) {
    var box = ensureBox(slide);
    if (!box) return;
    var ctrl = makeTagline(box);
    var wasActive = slide.classList.contains("active");

    if (wasActive) try { ctrl.start(); } catch (e) {}

    try {
      var obs = new MutationObserver(function () {
        var isActive = slide.classList.contains("active");
        if (isActive && !wasActive) { try { ctrl.start(); } catch (e) {} }
        else if (!isActive && wasActive) { try { ctrl.stop(); } catch (e) {} }
        wasActive = isActive;
      });
      obs.observe(slide, { attributes: true, attributeFilter: ["class"] });
    } catch (e) {
      setInterval(function () {
        var isActive = slide.classList.contains("active");
        if (isActive && !wasActive) { try { ctrl.start(); } catch (e2) {} }
        else if (!isActive && wasActive) { try { ctrl.stop(); } catch (e2) {} }
        wasActive = isActive;
      }, 200);
    }
  }

  /* ---- BOOT — rAF-poll until the intro slide AND its <h2> exist -------- */
  function boot() {
    injectCSS();
    var tries = 0;
    (function wait() {
      var slide = document.querySelector('.slide[data-id="intro"]');
      var h2 = slide && slide.querySelector ? slide.querySelector("h2") : null;
      if (slide && h2) { try { init(slide); } catch (e) {} return; }
      if (tries++ > 600) return;       // ~10s @ 60fps then give up quietly
      requestAnimationFrame(wait);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
