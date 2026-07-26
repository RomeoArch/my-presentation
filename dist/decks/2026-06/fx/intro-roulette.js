/* =============================================================================
   GenAI-Codeforce — intro-roulette.js  (optional FX layer, vanilla JS, no build)

   Self-contained add-on. Injects its own CSS, waits for the INTRO slide and its
   goal chips to exist, then adds a small "🎰 Pick tonight's focus" button to the
   "What we're here for" panel. Clicking runs a slot-machine animation that
   sweeps a highlight across the goal chips (fast → slow, ease-out, ~1.4s) and
   settles on one random chip, then prints "Tonight's focus → <chip>".

   Touches nothing the engine owns: no nav-key handlers, no preventDefault, and
   the highlight uses ONLY outline / box-shadow / color / background / filter —
   never inline transform (another module animates chip transforms).
   ============================================================================= */
(function () {
  "use strict";

  if (window.__cfIntroRoulette) return;
  window.__cfIntroRoulette = true;

  var prefersReduced = false;
  try {
    prefersReduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  /* ---- CSS (own <style>, scoped to .cfrl-* classes) --------------------- */
  function injectCSS() {
    if (document.getElementById("cf-intro-roulette-css")) return;
    var css =
      ".cfrl-btn{display:inline-flex;align-items:center;gap:.5rem;cursor:pointer;" +
        "margin-top:1rem;font-family:var(--font-mono);font-size:.8rem;" +
        "color:var(--text);background:var(--chip-bg);border:1px solid var(--ring);" +
        "border-radius:999px;padding:.45rem .95rem;transition:.2s var(--ease)}" +
      ".cfrl-btn:hover{color:#fff;background:linear-gradient(100deg,var(--primary),var(--accent));" +
        "border-color:var(--accent);box-shadow:0 6px 18px var(--ring)}" +
      ".cfrl-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}" +
      ".cfrl-btn[disabled]{opacity:.6;cursor:default}" +
      ".cfrl-result{margin-top:.7rem;min-height:1.4em;font-family:var(--font-mono);" +
        "font-size:.85rem;color:var(--muted);opacity:0;transition:opacity .3s var(--ease)}" +
      ".cfrl-result.cfrl-on{opacity:1}" +
      ".cfrl-result b{color:var(--highlight)}" +
      /* highlight: NO transform — outline/box-shadow/color/background/filter only */
      ".cfrl-hot{outline:2px solid var(--accent);outline-offset:2px;" +
        "color:#fff;background:linear-gradient(100deg,var(--primary),var(--accent));" +
        "box-shadow:0 0 0 4px var(--ring),0 8px 26px rgba(0,0,0,.45);filter:brightness(1.15)}" +
      ".cfrl-win{outline:2px solid var(--highlight);outline-offset:2px;" +
        "color:#fff;background:linear-gradient(100deg,var(--accent),var(--highlight));" +
        "box-shadow:0 0 0 5px var(--ring),0 10px 30px rgba(0,0,0,.5);filter:brightness(1.2)}";
    var style = document.createElement("style");
    style.id = "cf-intro-roulette-css";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ---- state ------------------------------------------------------------ */
  var rafId = 0;
  var settleTimer = 0;
  var spinning = false;

  function clearHighlights(chips) {
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.remove("cfrl-hot");
      chips[i].classList.remove("cfrl-win");
    }
  }

  function stopSpin() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (settleTimer) { clearTimeout(settleTimer); settleTimer = 0; }
    spinning = false;
  }

  function settle(chips, idx, btn, result) {
    clearHighlights(chips);
    var win = chips[idx];
    if (win) {
      win.classList.add("cfrl-win");
      var label = (win.textContent || "").replace(/\s+/g, " ").trim();
      result.innerHTML = "Tonight's focus &rarr; <b></b>";
      var b = result.querySelector("b");
      if (b) b.textContent = label;
      result.classList.add("cfrl-on");
    }
    if (btn) btn.disabled = false;
    spinning = false;
  }

  function spin(chips, btn, result) {
    if (!chips || !chips.length) return;
    stopSpin();
    clearHighlights(chips);
    result.classList.remove("cfrl-on");

    var winner = (Math.random() * chips.length) | 0;

    if (prefersReduced) {
      // No rapid cycling — pick instantly.
      settle(chips, winner, btn, result);
      return;
    }

    spinning = true;
    if (btn) btn.disabled = true;

    var DURATION = 1400;       // ms
    var MIN_STEP = 55;         // fastest gap between hops (ms)
    var MAX_STEP = 320;        // slowest gap as it eases out
    var start = performance.now();
    var cur = -1;
    var nextHopAt = 0;

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); } // cubic ease-out

    function frame(now) {
      if (!btn || !btn.isConnected) { stopSpin(); return; }
      var elapsed = now - start;
      var p = elapsed / DURATION;
      if (p > 1) p = 1;

      if (now >= nextHopAt) {
        if (cur >= 0 && chips[cur]) chips[cur].classList.remove("cfrl-hot");
        // Advance so the sweep lands exactly on the winner at the end.
        cur = (cur + 1) % chips.length;
        if (chips[cur]) chips[cur].classList.add("cfrl-hot");
        var step = MIN_STEP + (MAX_STEP - MIN_STEP) * easeOut(p);
        nextHopAt = now + step;
      }

      if (p < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        rafId = 0;
        settleTimer = setTimeout(function () {
          settleTimer = 0;
          settle(chips, winner, btn, result);
        }, 120);
      }
    }
    rafId = requestAnimationFrame(frame);
  }

  /* ---- wiring ----------------------------------------------------------- */
  function init(slide) {
    // Second .panel = the "What we're here for" panel (chips + lead).
    var panels = slide.querySelectorAll(".panel");
    var panel = panels && panels.length >= 2 ? panels[1] : null;
    if (!panel) return false;

    var row = panel.querySelector(".row");
    if (!row) return false;
    var chips = row.querySelectorAll(".chip");
    if (!chips || !chips.length) return false;

    // Idempotent: never inject twice.
    if (panel.querySelector(".cfrl-btn")) return true;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cfrl-btn";
    btn.textContent = "🎰 Pick tonight's focus";

    var result = document.createElement("div");
    result.className = "cfrl-result";
    result.setAttribute("aria-live", "polite");

    // Place after the .row (the .lead, if any, then follows).
    var lead = panel.querySelector(".lead");
    if (lead && lead.parentNode === panel) {
      panel.insertBefore(btn, lead);
      panel.insertBefore(result, lead);
    } else {
      panel.appendChild(btn);
      panel.appendChild(result);
    }

    btn.addEventListener("click", function () {
      if (!slide.classList.contains("active")) return; // idle when not shown
      spin(chips, btn, result);
    });

    return true;
  }

  /* =====================================================================
     BOOT — rAF-poll until the intro slide AND its goal chips exist.
     ===================================================================== */
  function boot() {
    injectCSS();
    var tries = 0;
    (function wait() {
      var slide = document.querySelector('.slide[data-id="intro"]');
      if (slide) {
        var chips = slide.querySelectorAll(".panel .row .chip");
        if (chips && chips.length) {
          try { init(slide); } catch (e) {}
          return;
        }
      }
      if (tries++ > 600) return; // ~10s @ 60fps, then give up quietly
      requestAnimationFrame(wait);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
