/* =============================================================================
   GenAI-Codeforce — fx/personality.js
   Two cover-only flourishes, fully self-contained & offline:
     (A) "AI HYPE" meter  — a semicircular gauge whose needle wobbles near
         "PEAK BUBBLE" (a nod to the $965B valuations).
     (B) "Snarky AI orb"  — a glowing floating mascot that pops sarcastic
         speech bubbles on a timer.

   Design rules honoured:
     - vanilla JS, no build, no network, no libs/fonts/CDNs.
     - injects its OWN <style>; uses ONLY theme CSS vars (no hardcoded colors).
     - rAF-polls until .slide[data-id="cover"] exists before hooking.
     - everything guarded; cover-scoped (only runs/shows while cover is .active).
     - overlays are pointer-events:none so they never block deck navigation.
     - respects prefers-reduced-motion; pauses work when the cover is hidden.
     - cleans up its own timers.
   This file does NOT touch any existing file or global; the include is wired
   externally by the orchestrator.
   ============================================================================= */
(function () {
  "use strict";

  // Hard guards: bail quietly if something is missing or we ran already.
  if (typeof document === "undefined" || !document.querySelector) return;
  if (window.__cfPersonality) return;
  window.__cfPersonality = true;

  var reduceMotion = false;
  try {
    reduceMotion = !!(window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch (e) { reduceMotion = false; }

  /* ---- 1) Own stylesheet (theme-var driven only) ----------------------- */
  function injectCSS() {
    if (document.getElementById("cf-personality-css")) return;
    var css =
    "" +
    /* shared wrapper — pinned inside .cover__main, never blocks clicks */
    ".cf-pfx{position:absolute;pointer-events:none;z-index:5}" +
    ".cf-pfx,.cf-pfx *{box-sizing:border-box}" +

    /* ---------- (A) AI HYPE meter ---------- */
    ".cf-hype{top:50%;right:7vw;width:160px;transform:translateY(-50%);user-select:none}" +
    ".cf-hype__card{position:relative;padding:.5rem .6rem .4rem;border-radius:16px;" +
      "background:var(--panel);border:1px solid var(--border);" +
      "backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);" +
      "box-shadow:0 18px 44px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.05)}" +
    ".cf-hype svg{display:block;width:100%;height:auto;overflow:visible}" +
    ".cf-hype__lab{font-family:var(--font-mono);font-size:.62rem;letter-spacing:.22em;" +
      "text-transform:uppercase;color:var(--muted);text-align:center;margin-top:.1rem}" +
    ".cf-hype__zone{font-family:var(--font-mono);font-size:.72rem;font-weight:500;" +
      "letter-spacing:.06em;text-transform:uppercase;text-align:center;" +
      "color:var(--primary);text-shadow:0 0 10px var(--ring);margin-top:.05rem}" +
    ".cf-hype__needle{transform-box:fill-box;transform-origin:50% 100%}" +
    ".cf-hype__glow{filter:drop-shadow(0 0 5px var(--ring))}" +
    /* readable scale row under the gauge (never overlaps the arc/ticks) */
    ".cf-hype__scale{display:flex;justify-content:space-between;align-items:center;" +
      "margin:.15rem .1rem 0;font-family:var(--font-mono);font-size:.66rem;" +
      "font-weight:700;letter-spacing:.04em}" +
    ".cf-hype__lo{color:var(--muted)}" +
    ".cf-hype__hi{color:var(--primary);text-shadow:0 0 8px var(--ring)}" +

    /* ---------- (B) Snarky orb ---------- */
    ".cf-orb{left:7vw;bottom:3.6rem;width:auto}" +
    ".cf-orb__ball{position:relative;width:46px;height:46px;border-radius:50%;" +
      "background:var(--grad);" +
      "box-shadow:0 0 0 1px var(--border), 0 0 22px 5px var(--ring), " +
        "inset 0 2px 6px rgba(255,255,255,.45), inset 0 -6px 12px rgba(0,0,0,.30);" +
      "animation:cfOrbBob 3.6s var(--ease) infinite}" +
    ".cf-orb__ball::before{content:'';position:absolute;top:18%;left:24%;width:30%;height:24%;" +
      "border-radius:50%;background:rgba(255,255,255,.7);filter:blur(1px)}" +
    /* two little eyes so it reads as a mascot */
    ".cf-orb__eyes{position:absolute;inset:0;display:flex;align-items:center;" +
      "justify-content:center;gap:7px}" +
    ".cf-orb__eyes i{width:5px;height:5px;border-radius:50%;background:rgba(0,0,0,.55);" +
      "animation:cfOrbBlink 5.2s var(--ease) infinite}" +
    "@keyframes cfOrbBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}" +
    "@keyframes cfOrbBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}" +

    /* speech bubble — themed panel, fades in/holds/out via .is-on */
    ".cf-orb__bubble{position:absolute;left:54px;bottom:30px;width:max-content;max-width:240px;" +
      "padding:.6rem .8rem;border-radius:14px 14px 14px 4px;" +
      "background:var(--panel);border:1px solid var(--border);" +
      "backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);" +
      "box-shadow:0 14px 36px rgba(0,0,0,.34);" +
      "font-family:var(--font-display);font-size:.86rem;line-height:1.32;color:var(--text);" +
      "opacity:0;transform:translateY(6px) scale(.96);transform-origin:0% 100%;" +
      "transition:opacity .45s var(--ease),transform .45s var(--ease)}" +
    ".cf-orb__bubble.is-on{opacity:1;transform:none}" +
    /* little tail pointing back at the orb */
    ".cf-orb__bubble::after{content:'';position:absolute;left:-6px;bottom:8px;width:12px;height:12px;" +
      "background:var(--panel);border-left:1px solid var(--border);border-bottom:1px solid var(--border);" +
      "transform:rotate(45deg)}" +

    /* reduced-motion: settle, don't animate */
    "@media (prefers-reduced-motion:reduce){" +
      ".cf-orb__ball{animation:none}.cf-orb__eyes i{animation:none}" +
      ".cf-orb__bubble{transition:opacity .2s linear}}" +

    /* small covers: tuck the meter up a touch so it clears the chips row */
    "@media (max-width:980px){.cf-hype{width:144px;top:5rem;right:.9rem;transform:none}.cf-orb{display:none}}";

    var st = document.createElement("style");
    st.id = "cf-personality-css";
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }

  /* ---- helpers --------------------------------------------------------- */
  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  var SVGNS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  // point on the gauge arc for a given fraction t in [0,1]
  function arcPoint(cx, cy, r, t) {
    var a = Math.PI * (1 - t); // t=0 -> left (180deg), t=1 -> right (0deg)
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  }

  /* ---- (A) Build the AI HYPE meter ------------------------------------- */
  function buildHype(host) {
    var wrap = el("div", "cf-pfx cf-hype");
    wrap.setAttribute("aria-hidden", "true");
    var card = el("div", "cf-hype__card");

    // geometry (viewBox units)
    var W = 150, H = 90, cx = 75, cy = 78, R = 60;

    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });

    // gradient defs from theme --grad (we recolor the arc stops to theme colors)
    var defs = svg("defs");
    var grad = svg("linearGradient", { id: "cfHypeGrad", x1: "0", y1: "0", x2: "1", y2: "0" });
    var g1 = svg("stop", { offset: "0%", "stop-color": "var(--secondary)" });
    var g2 = svg("stop", { offset: "55%", "stop-color": "var(--primary)" });
    var g3 = svg("stop", { offset: "100%", "stop-color": "var(--accent)" });
    grad.appendChild(g1); grad.appendChild(g2); grad.appendChild(g3);
    defs.appendChild(grad);
    s.appendChild(defs);

    // background track (muted)
    var track = svg("path", {
      d: arcPath(cx, cy, R, 0, 1),
      fill: "none", stroke: "var(--border)", "stroke-width": "9",
      "stroke-linecap": "round"
    });
    s.appendChild(track);

    // colored hype arc on top (the --grad)
    var arc = svg("path", {
      d: arcPath(cx, cy, R, 0, 1),
      fill: "none", stroke: "url(#cfHypeGrad)", "stroke-width": "9",
      "stroke-linecap": "round"
    });
    arc.setAttribute("class", "cf-hype__glow");
    s.appendChild(arc);

    // ticks (muted)
    var i, n = 9;
    for (i = 0; i <= n; i++) {
      var t = i / n;
      var p1 = arcPoint(cx, cy, R - 7, t);
      var p2 = arcPoint(cx, cy, R + 1, t);
      s.appendChild(svg("line", {
        x1: p1.x.toFixed(2), y1: p1.y.toFixed(2),
        x2: p2.x.toFixed(2), y2: p2.y.toFixed(2),
        stroke: "var(--muted)", "stroke-width": (i % 9 === 0 ? "2" : "1"),
        opacity: (i === 0 || i === n) ? "0.9" : "0.5"
      }));
    }

    // (end labels "sane"/"PEAK" used to live here in the SVG, but they collided
    // with the arc + ticks. They're now a clean HTML row UNDER the gauge — see
    // the .cf-hype__scale block below — so they never overlap the scale.)

    // needle (accent) — rotates around the hub via group transform
    var hub = { x: cx, y: cy };
    var needleG = svg("g", {});
    needleG.setAttribute("class", "cf-hype__glow");
    var needle = svg("line", {
      x1: hub.x, y1: hub.y, x2: hub.x, y2: (cy - R + 6),
      stroke: "var(--accent)", "stroke-width": "2.4", "stroke-linecap": "round"
    });
    needleG.appendChild(needle);
    var counter = svg("line", { // small tail on the other side for balance
      x1: hub.x, y1: hub.y, x2: hub.x, y2: (cy + 8),
      stroke: "var(--accent)", "stroke-width": "2.4", "stroke-linecap": "round",
      opacity: "0.5"
    });
    needleG.appendChild(counter);
    s.appendChild(needleG);

    // hub cap
    s.appendChild(svg("circle", { cx: hub.x, cy: hub.y, r: "4.5",
      fill: "var(--bg-2)", stroke: "var(--accent)", "stroke-width": "2" }));
    s.appendChild(svg("circle", { cx: hub.x, cy: hub.y, r: "1.6", fill: "var(--accent)" }));

    card.appendChild(s);
    // readable scale row UNDER the gauge: low (sane) ↔ high (PEAK). Kept out of
    // the SVG so it never collides with the arc/ticks. PEAK uses --primary so it
    // reads on dark themes too.
    var scale = el("div", "cf-hype__scale");
    var lo = el("span", "cf-hype__lo"); lo.textContent = "sane";
    var hi = el("span", "cf-hype__hi"); hi.textContent = "PEAK";
    scale.appendChild(lo); scale.appendChild(hi);
    card.appendChild(scale);
    var zone = el("div", "cf-hype__zone");
    zone.textContent = "PEAK BUBBLE";
    card.appendChild(zone);
    var lab = el("div", "cf-hype__lab");
    lab.textContent = "AI HYPE";
    card.appendChild(lab);
    wrap.appendChild(card);
    host.appendChild(wrap);

    return { wrap: wrap, needleG: needleG, hub: hub, cy: cy, R: R };
  }

  // SVG arc path from fraction t0 to t1 across the top semicircle
  function arcPath(cx, cy, r, t0, t1) {
    var a = arcPoint(cx, cy, r, t0), b = arcPoint(cx, cy, r, t1);
    var large = (t1 - t0) > 0.5 ? 1 : 0;
    // sweep=1 draws the upper arc left->right
    return "M " + a.x.toFixed(2) + " " + a.y.toFixed(2) +
           " A " + r + " " + r + " 0 " + large + " 1 " +
           b.x.toFixed(2) + " " + b.y.toFixed(2);
  }

  /* ---- (B) Build the snarky orb ---------------------------------------- */
  var LINES = [
    // Kept tight: only lines that riff on *this* season's AI news — the $965B
    // bubble, 72h model lifespans, Fable, Mistral, and the GPU/compute spend.
    "Powered by 40,000 GPUs and pure vibes.",
    "$965B and I still can't open that PDF.",
    "Fabulous, or fable-less? Yes.",
    "I peaked. The bubble agrees.",
    "My context window outlasts this bubble market.",
    "Live for 72 hours. Ask me anything.",
    "I cost more than your salary now 💸",
    "Export-controlled, baby. 😎",
    "Your move, Mistral. 🐱",
    // straight from this month's headlines:
    "Mistral bought my neighbours. Bonjour, Linz. 🥐",
    "Stop prompting. Start looping. 🔁",
    "Six-hour task, one bankrupt billionaire. 💸"
  ];

  function buildOrb(host) {
    var wrap = el("div", "cf-pfx cf-orb");
    wrap.setAttribute("aria-hidden", "true");
    var ball = el("div", "cf-orb__ball");
    var eyes = el("div", "cf-orb__eyes");
    eyes.appendChild(el("i"));
    eyes.appendChild(el("i"));
    ball.appendChild(eyes);
    var bubble = el("div", "cf-orb__bubble");
    wrap.appendChild(bubble);
    wrap.appendChild(ball);
    host.appendChild(wrap);
    return { wrap: wrap, bubble: bubble };
  }

  /* ---- Orchestration once the cover exists ----------------------------- */
  function start(cover) {
    // host: the cover SECTION (position:absolute) so the widgets sit in the
    // empty top/bottom bands of the whole slide, not on the text column.
    var host = cover;
    if (getComputedStyle(host).position === "static") {
      host.style.position = "relative";
    }

    injectCSS();
    var hype = buildHype(host);
    var orb = buildOrb(host);

    var raf = 0, timer = 0, holdTimer = 0, running = false;

    /* --- (A) needle animation: eased noise hovering near max ----------- */
    // target fraction creeps high & wobbles; rendered fraction eases toward it.
    var frac = 0.5;        // current rendered needle fraction
    var seed = Math.random() * 1000;
    var t0 = (window.performance && performance.now) ? performance.now() : Date.now();

    function maxAngleDeg(t) {
      // map fraction t in [0,1] to needle rotation: -82deg (left) .. +82deg (right)
      return (t - 0.5) * 164;
    }
    function renderNeedle() {
      hype.needleG.setAttribute(
        "transform",
        "rotate(" + maxAngleDeg(frac).toFixed(2) + " " + hype.hub.x + " " + hype.hub.y + ")"
      );
    }

    function frame(now) {
      if (!running) return;
      var el2 = (now - t0) / 1000;
      // layered sines => smooth pseudo-noise; biased high (creeps toward bubble)
      var n =
        0.62 * Math.sin(el2 * 1.7 + seed) +
        0.26 * Math.sin(el2 * 3.9 + seed * 1.7) +
        0.12 * Math.sin(el2 * 7.3 + seed * 0.6);
      // base near the top end (0.86) + jitter, clamped so it never pins flat
      var target = 0.86 + 0.11 * n;            // ~0.74 .. ~0.98, lively near max
      if (target > 0.985) target = 0.985;
      if (target < 0.62) target = 0.62;
      frac += (target - frac) * 0.12;          // critically-ish damped easing
      renderNeedle();
      raf = requestAnimationFrame(frame);
    }

    function settleStatic() {
      // reduced-motion / paused: park near max, no animation.
      frac = 0.94;
      renderNeedle();
    }

    /* --- (B) bubble cycling -------------------------------------------- */
    var order = LINES.slice();
    var ptr = 0;
    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      }
      return a;
    }
    shuffle(order);

    function popBubble() {
      if (!running) return;
      orb.bubble.textContent = order[ptr % order.length];
      ptr++;
      // force reflow so the transition runs even on the very first show
      void orb.bubble.offsetWidth;
      orb.bubble.classList.add("is-on");
      holdTimer = setTimeout(function () {
        orb.bubble.classList.remove("is-on");
      }, 4000); // hold ~4s, then fade out
      // next pop in 7–10s
      var gap = 7000 + Math.floor(Math.random() * 3000);
      timer = setTimeout(popBubble, gap);
    }

    function clearTimers() {
      if (timer) { clearTimeout(timer); timer = 0; }
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = 0; }
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    function play() {
      if (running) return;
      running = true;
      if (reduceMotion) {
        settleStatic();
        // still show ONE static line (no timed cycling) so the orb has a voice
        orb.bubble.textContent = order[0];
        orb.bubble.classList.add("is-on");
      } else {
        t0 = (window.performance && performance.now) ? performance.now() : Date.now();
        raf = requestAnimationFrame(frame);
        // first quip shortly after the cover settles
        timer = setTimeout(popBubble, 2200);
      }
    }

    function pause() {
      if (!running && !reduceMotion) { /* allow first settle */ }
      running = false;
      clearTimers();
      orb.bubble.classList.remove("is-on");
      if (reduceMotion) settleStatic();
    }

    /* --- place the hype meter just to the RIGHT of the cover meme, centred on
       its vertical middle ("next to the meme"). Measured live so it tracks the
       meme across window sizes + once the meme image loads. Falls back to a safe
       right-edge spot before the meme is laid out, and hands back to the
       stylesheet on small screens. The 160px clamp keeps it fully on-screen and
       matches placeClock() in fx/hud.js so the two stay left-aligned. -------- */
    function placeHype() {
      if (!hype || !hype.wrap) return;
      var st = hype.wrap.style;
      var meme = cover.querySelector(".cover__meme") || cover.querySelector(".eyememe");
      if (window.innerWidth <= 980 || !meme) {        // defer to the stylesheet
        st.left = st.right = st.top = st.transform = "";
        return;
      }
      var cr = cover.getBoundingClientRect(), mr = meme.getBoundingClientRect();
      if (!mr.width || mr.height < 40) {              // meme not laid out yet
        st.left = "auto"; st.right = "7vw"; st.top = "50%"; st.transform = "translateY(-50%)";
        return;
      }
      var left = mr.right - cr.left + 52, maxLeft = cr.width - 184;
      if (left > maxLeft) left = maxLeft;
      st.right = "auto";
      st.left = left.toFixed(0) + "px";                       // just right of the meme
      st.top = (mr.top - cr.top + mr.height / 2).toFixed(0) + "px"; // its vertical middle
      st.transform = "translateY(-50%)";
    }

    /* --- visibility: only run while the cover is .active --------------- */
    function sync() {
      var active = cover.classList.contains("active") &&
                   document.visibilityState !== "hidden";
      var shown = active;
      hype.wrap.style.display = shown ? "" : "none";
      orb.wrap.style.display = shown ? "" : "none";
      if (active) { placeHype(); play(); } else pause();
    }

    // watch the cover's class (slide activation toggles .active)
    var mo;
    try {
      mo = new MutationObserver(sync);
      mo.observe(cover, { attributes: true, attributeFilter: ["class"] });
    } catch (e) { mo = null; }

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pagehide", pause);
    window.addEventListener("beforeunload", clearTimers);

    // keep the meter glued to the meme as layout changes / the image loads
    window.addEventListener("resize", placeHype);
    window.addEventListener("load", placeHype);
    var memeImg = cover.querySelector(".cover__meme img");
    if (memeImg) memeImg.addEventListener("load", placeHype);

    // react if the user flips reduced-motion at runtime
    try {
      var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      var onMq = function () {
        reduceMotion = mq.matches;
        if (running) { pause(); play(); }
      };
      if (mq.addEventListener) mq.addEventListener("change", onMq);
      else if (mq.addListener) mq.addListener(onMq);
    } catch (e) {}

    // initial paint + state
    renderNeedle();
    sync();
  }

  /* ---- rAF-poll until the cover slide is built ------------------------- */
  function waitForCover() {
    var tries = 0, MAX = 1800; // ~30s @60fps, then give up quietly
    (function poll() {
      var cover = document.querySelector('.slide[data-id="cover"]');
      if (cover) { try { start(cover); } catch (e) { /* never break the deck */ } return; }
      if (++tries > MAX) return;
      requestAnimationFrame(poll);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForCover);
  } else {
    waitForCover();
  }
})();
