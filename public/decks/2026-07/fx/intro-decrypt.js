/* =============================================================================
   GenAI-Codeforce — intro-decrypt.js  (optional FX layer, vanilla JS, no build)

   Self-contained add-on. Injects its own CSS, waits for the intro slide to
   exist, then "decrypts" the headline each time the slide goes inactive→active.

   Effect: every visible char of the <h2> rapidly cycles through random glyphs
   then locks into the real character, resolving left→right over ~900ms. The
   child <span class="grad">Generative AI</span> structure is preserved; at
   completion the h2 DOM is byte-identical to the original.

   Touches nothing the engine owns: never preventDefault()s, no nav key
   handlers, no pointer-events blocking. Idles when intro is off-screen.
   ============================================================================= */
(function () {
  "use strict";

  // Don't double-install (e.g. if the script is included twice).
  if (window.__cfIntroDecrypt) return;
  window.__cfIntroDecrypt = true;

  // Glyph set: punctuation/digits plus a few katakana + symbol chars.
  var GLYPHS = "!<>-_\\/[]{}=+*^?#0123456789アカサハラワ§¶";

  var DURATION = 900;   // total reveal time (ms)
  var TICK = 40;        // scramble frame interval (ms)

  var prefersReduced = false;
  try {
    prefersReduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  /* ---- CSS (own <style>, scoped to .cfdc-* classes) -------------------- */
  function injectCSS() {
    if (document.getElementById("cf-intro-decrypt-css")) return;
    var css =
      ".cfdc-scrambling{will-change:contents}" +
      ".cfdc-ghost{color:var(--muted,#888);opacity:.85}" +
      ".cfdc-hint{display:block;margin-top:.35rem;pointer-events:none;" +
        "font:600 .72rem/1 var(--font-mono,monospace);letter-spacing:.28em;" +
        "text-transform:uppercase;color:var(--muted);opacity:0;" +
        "transition:opacity .3s var(--ease,ease)}" +
      ".cfdc-hint.cfdc-on{opacity:.55;animation:cfdcFlicker 1.1s steps(2) infinite}" +
      "@keyframes cfdcFlicker{0%,100%{opacity:.18}50%{opacity:.55}}" +
      "@media (prefers-reduced-motion: reduce){" +
        ".cfdc-hint.cfdc-on{animation:none;opacity:.4}}";
    var style = document.createElement("style");
    style.id = "cf-intro-decrypt-css";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  var pick = function () { return GLYPHS.charAt((Math.random() * GLYPHS.length) | 0); };

  /* ---- Per-h2 scramble state ------------------------------------------- */
  // We scramble two text nodes in place: the leading text node of the <h2>
  // and the single text node inside <span class="grad">. Originals are
  // captured once so completion is byte-identical.
  var origLead = null;   // original leading text (e.g. "A monthly jam for ")
  var origGrad = null;   // original grad text (e.g. "Generative AI")
  var activeTimer = null;
  var hintEl = null;

  function leadNode(h2) {
    // First child node should be the leading text node before the span.
    var n = h2.firstChild;
    return (n && n.nodeType === 3) ? n : null;
  }

  function gradTextNode(h2) {
    var span = h2.querySelector ? h2.querySelector("span.grad") : null;
    if (!span) return null;
    var n = span.firstChild;
    return (n && n.nodeType === 3) ? n : null;
  }

  function clearTimer() {
    if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }
  }

  // Scramble a string up to `revealed` real chars; the rest are random glyphs.
  function scrambled(orig, revealed) {
    var out = "";
    for (var i = 0; i < orig.length; i++) {
      var ch = orig.charAt(i);
      if (i < revealed || ch === " ") {
        out += ch;            // locked (or keep spaces stable to read shape)
      } else {
        out += pick();
      }
    }
    return out;
  }

  function showHint(on) {
    if (!hintEl) return;
    if (on) hintEl.classList.add("cfdc-on");
    else hintEl.classList.remove("cfdc-on");
  }

  function restore(lead, grad) {
    clearTimer();
    if (lead && origLead != null) lead.nodeValue = origLead;
    if (grad && origGrad != null) grad.nodeValue = origGrad;
    showHint(false);
  }

  function run(h2) {
    var lead = leadNode(h2);
    var grad = gradTextNode(h2);
    if (!lead && !grad) return;

    // Capture originals once (first successful run).
    if (origLead == null && lead) origLead = lead.nodeValue;
    if (origGrad == null && grad) origGrad = grad.nodeValue;

    if (prefersReduced) {           // skip scramble; ensure real text shown.
      restore(lead, grad);
      return;
    }

    clearTimer();
    showHint(true);

    var total = (origLead ? origLead.length : 0) + (origGrad ? origGrad.length : 0);
    if (total <= 0) { restore(lead, grad); return; }

    var start = (typeof performance !== "undefined" && performance.now)
      ? performance.now() : Date.now();

    activeTimer = setInterval(function () {
      var now = (typeof performance !== "undefined" && performance.now)
        ? performance.now() : Date.now();
      var k = (now - start) / DURATION;
      if (k > 1) k = 1;
      // chars revealed left→right across the combined string
      var revealed = Math.floor(k * total);

      var leadLen = origLead ? origLead.length : 0;
      if (lead && origLead != null) {
        lead.nodeValue = scrambled(origLead, Math.min(revealed, leadLen));
      }
      if (grad && origGrad != null) {
        var gradReveal = revealed > leadLen ? (revealed - leadLen) : 0;
        grad.nodeValue = scrambled(origGrad, gradReveal);
      }

      if (k >= 1) restore(lead, grad);
    }, TICK);
  }

  /* ---- Active-state tracking (idle when intro off-screen) -------------- */
  function ensureHint(slide) {
    if (hintEl && hintEl.isConnected) return;
    var inner = slide.querySelector ? slide.querySelector(".slide__inner") : null;
    var h2 = slide.querySelector ? slide.querySelector("h2") : null;
    if (!inner || !h2) return;
    hintEl = document.createElement("span");
    hintEl.className = "cfdc-hint";
    hintEl.setAttribute("aria-hidden", "true");
    hintEl.textContent = "// decrypting…";
    if (h2.nextSibling) inner.insertBefore(hintEl, h2.nextSibling);
    else inner.appendChild(hintEl);
  }

  function init(slide) {
    var wasActive = slide.classList.contains("active");

    function onActivate() {
      var h2 = slide.querySelector ? slide.querySelector("h2") : null;
      if (h2) { try { ensureHint(slide); run(h2); } catch (e) {} }
    }

    // Fire once if it's already active on boot.
    if (wasActive) onActivate();

    // Watch class changes for inactive→active transitions.
    var obs = null;
    try {
      obs = new MutationObserver(function () {
        var isActive = slide.classList.contains("active");
        if (isActive && !wasActive) onActivate();
        else if (!isActive && wasActive) {
          // Idle: stop scrambling, ensure real text restored.
          var h2 = slide.querySelector ? slide.querySelector("h2") : null;
          if (h2) {
            try { restore(leadNode(h2), gradTextNode(h2)); } catch (e) {}
          }
        }
        wasActive = isActive;
      });
      obs.observe(slide, { attributes: true, attributeFilter: ["class"] });
    } catch (e) {
      // MutationObserver unavailable: fall back to a light poll.
      setInterval(function () {
        var isActive = slide.classList.contains("active");
        if (isActive && !wasActive) onActivate();
        wasActive = isActive;
      }, 200);
    }
  }

  /* =====================================================================
     BOOT — rAF-poll until the intro slide exists, then hook in.
     ===================================================================== */
  function boot() {
    injectCSS();
    var tries = 0;
    (function wait() {
      var slide = document.querySelector('.slide[data-id="intro"]');
      if (slide) { try { init(slide); } catch (e) {} return; }
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
