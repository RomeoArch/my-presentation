/* =============================================================================
   GenAI-Codeforce — MONTHLY CONTENT
   -----------------------------------------------------------------------------
   This is the ONLY file you need to touch each month.
   Edit the values below, save, refresh the browser. That's it.

   Quick map:
     meta      -> edition label + the big motto on the cover
     next      -> date/time of the NEXT codeforce (drives the live countdown)
     links     -> discord / meetup
     presenters-> people + their LinkedIn URLs (QR codes are auto-generated)
     memes     -> drop images in assets/memes/ and list them here
     events    -> AI Austria meetup + other community events
     agenda    -> the running order
     slido     -> embed URL + join code + the questions
     news      -> the retrospective: last time's news (the 01/02/03 cards)
     demo      -> the live-demo slot (someone else usually drives this)
   ============================================================================= */

window.CODEFORCE = {

  /* ---- Edition & motto (the cover slide) ---------------------------------- */
  meta: {
    edition: "June 2026",
    // The spicy one-liner / theme of the month shown big on the cover:
    motto: "AI in June 2026: **$965B** valuations, models that vanish in 3 days. Fabulous, or **fable-less**? 🫠",
    // Which palette loads first. Cycle live with the T key. One of:
    // "aia" (AI Austria dark) | "aialight" (AI Austria light) | "neon" | "synth" | "plasma" | "volt"
    defaultTheme: "aia",
    // Signature slogan on the closing slide. **bold** words get the neon glow.
    signoff: "Less talking, more **building**. 🛠️",
  },

  /* ---- Cover meme (the "keep up with AI news" eyes meme) ------------------
     Set `image` to a file in assets/memes/ to use a real picture on the cover.
     If `image` is omitted it falls back to the code-recreated version below
     (rows / skull / footer), which always matches the active theme. */
  coverMeme: {
    image: "assets/memes/keep_up_with_AI_news.png",
    // --- fallback (used only if `image` is removed) ---
    rows: [
      { label: "STRESS",  eyes: "👀" },
      { label: "ALCOHOL", eyes: "👀" },
      { label: "WEED",    eyes: "👁️" },
      { label: "COCAINE", eyes: "🩸" },
    ],
    skull: true,
    footer: "KEEP UP WITH AI NEWS",
  },

  /* ---- The NEXT codeforce (powers the countdown on the closing slide) ----- */
  next: {
    dateISO:   "2026-07-29T17:00:00+02:00", // ISO 8601, used for the countdown
    dateLabel: "29 July 2026",
    time:      "17:00 – 18:30",
    where:     "Virtual · Meetup",
  },

  /* ---- Links -------------------------------------------------------------- */
  links: {
    discord: "https://discord.gg/9FS68B9sQj",
    meetup:  "https://www.meetup.com/ai-austria/",
  },

  /* ---- Presenters / organizers -------------------------------------------
     Each person shows a QR with the LinkedIn mark in the centre.
       qr   -> use a ready-made QR image (drop it in assets/qrcodes/). Best
               option — it encodes the real profile exactly as you generated it.
       linkedin -> fallback: if no `qr` is given, a QR is generated from this URL.
     Optional per-person fields:
       title          -> credential shown under the name (e.g. a job title)
       hideOnDemoCall -> true keeps them off the "Show a demo?" slide while
                         still listing them on the closing "Reach the team" slide */
  presenters: [
    { name: "Philipp Besinger",   role: "Host",      qr: "assets/qrcodes/philipp.png",   linkedin: "https://www.linkedin.com/in/philipp-besinger-622218219/",   phone: "+43 680 402 16 87" },
    { name: "Sebastian Archila",  role: "Host",      qr: "assets/qrcodes/sebastian.png", linkedin: "https://www.linkedin.com/in/sebastian-archila-567565213/", phone: "+43 660 657 07 26" },
    { name: "Daniel Noszian",     role: "Security",  qr: "assets/qrcodes/Daniel.png",    linkedin: "https://www.linkedin.com/in/dnos/",    phone: "", title: "AI CyberSec Pro" },
  ],

  /* ---- Memes -------------------------------------------------------------
     Drop files into assets/memes/ and list them here. `caption` is optional.
     For websites/links, use `funSites` below (a live embed slide) — a URL makes
     a poor meme tile. (A { type:"link", url, label } meme card still works if
     you ever want one, but the grid looks best with images only.) */
  // `caption` shows on the tile; `explain` (optional) is the small blurb shown
  // under the image when a meme is clicked open — the "why it's funny" line.
  memes: [
    { src: "assets/memes/meme1.jpeg", caption: "Microslop: “I’m gonna implement AI even harder”",
      explain: "The Office “stop — I’m gonna do it even harder” format, aimed at Microsoft (“Microslop”). Everyone’s begging companies to stop bolting AI onto everything; Microsoft answers by cramming Copilot in even harder." },
    { src: "assets/memes/meme2.jpeg", caption: "Mistral releases “Le Chaton Fat” — 24T params, très lourd",
      explain: "A pun on Mistral’s real assistant “Le Chat” → “Le Chaton” (kitten) + “Fat”: a 24-trillion-parameter model drawn as an obese cat, mocking the “bigger is better” parameter race (“some models scale, some develop gravity”). Maximum French branding optional." },
    { src: "assets/memes/meme3.jpeg", caption: "Amodei paints the AI monster he warns us about",
      explain: "That’s Anthropic CEO Dario Amodei painting the AI monster himself — his drumbeat that AI is too dangerous and governments should be able to block it (he called for exactly that in June 2026). Then he panics at the monster he conjured: a jab that the doom-hype is self-serving." },
    { src: "assets/memes/meme4.jpeg", caption: "Musk runs a 6-hour task on Fable 5, sees the Anthropic bill",
      explain: "Spoof headline: Elon Musk “loses trillionaire status” after accidentally running a 6-hour task on Fable 5 — “saw the Anthropic bill and fainted.” Frontier-model compute is the punchline, landing right on this month’s motto: AI now costs more than the humans it replaces." },
  ],
  // Small credit shown under the memes title. Set to null to hide.
  memeSource: { label: "youraislopbores.me", url: "https://youraislopbores.me/" },

  /* ---- Fun AI site(s) of the month --------------------------------------
     Each entry becomes its OWN slide with a LIVE iframe embed of the site.
     Needs internet while presenting; the QR + open-link fallback always works.
     Heads-up: some sites refuse to be framed (X-Frame-Options / CSP). If the
     embed stays blank that's why — just scan the QR or open the link.
       name  -> shown big          emoji -> little accent next to the name
       blurb -> one-line pitch     url   -> what the QR encodes / link to open
       embed -> page to iframe (usually the same as url) */
  funSites: [
    {
      name:  "LLM Soccer Arena",
      emoji: "⚽",
      blurb: "LLMs manage football teams head-to-head — tactics, subs, the lot. Gloriously pointless.",
      url:   "https://www.llm-soccerarena.com/matches#match-football-data-537346",
      embed: "https://www.llm-soccerarena.com/matches#match-football-data-537346",
    },
  ],

  /* ---- Community events (AI Austria, etc.) -------------------------------- */
  events: {
    intro: "Coming together to impact the world.",
    facts: [
      "Virtual event — every single month",
      "Latest GenAI news & technological exchange",
      "Active participation, tool presentations & live demos",
      "Everyone welcome — from curious user to hardcore dev",
    ],
    goals: [
      "Technological exchange",
      "Casual exchange",
      "Active participation",
      "Discussing the news",
      "Showing code & demos",
      "Sharing challenges",
    ],
    goalLine: "Learning, helping, improving and creating value with Generative AI.",
    // Other community events to plug (e.g. the AI Austria Meetup). The FIRST
    // entry is featured on the "Community & Discord" slide.
    //   url   -> what the QR encodes / the "View on Meetup" link
    //   note  -> one-liner shown on the card
    //   embed -> OPTIONAL. Leave it OUT for the default preview card (always
    //            works, offline). meetup.com itself CANNOT be embedded (it sends
    //            X-Frame-Options, so the iframe stays blank). Only set `embed`
    //            to a URL that actually allows framing — e.g. a Luma event page,
    //            an embeddable Google Calendar, or your own site — and the card
    //            switches to a live iframe automatically.
    other: [
      { name: "AI Austria Meetup", cadence: "Every 1–2 months", url: "https://www.meetup.com/ai-austria/",
        note: "In-person keynotes + meeting genuinely interesting people." },
    ],
  },

  /* ---- Discord channels (shown on the Discord slide) ---------------------- */
  discordChannels: [
    "🏠 #welcome-and-rules",
    "📢 #announcements",
    "📚 #resources",
    "💬 #general",
    "🎭 #off-topic",
  ],

  /* ---- Agenda / running order --------------------------------------------- */
  agenda: [
    { title: "We question, you answer", note: "Community pulse via Slido" },
    { title: "Breaking News — GenAI",   note: "What moved this month" },
    { title: "Tool of the Month",       note: "Agent systems IRL — live triple feature" },
  ],

  /* ---- Slido --------------------------------------------------------------
     `embedBase` is your Slido event embed URL. Per-question you can override
     with a specific `embed` (deep-link to that poll). If the embed fails or
     wifi dies, the QR + join code fallback is always shown.
     Get the embed URL: Slido → Present/Share → "Embed" → copy the src URL. */
  slido: {
    // Participant link (what the QR encodes — attendees open this to vote):
    joinUrl:  "https://app.sli.do/event/aWbLs8vTQ61CWaLsUQXmaW",
    // Optional: paste the "#code" shown in your Slido admin to display it big.
    // Leave "" to hide it (the QR + link are enough to join).
    joinCode: "",
    // Live embed shown inside each question slide. This is Slido PRESENT mode
    // (wall.sli.do = live results/bars, NOT a "vote now" screen) — it shows
    // whatever question you've made ACTIVE in Slido. Leave "" to show QR-only.
    // (Use app.sli.do here instead if you ever want the participant/voting view.)
    embedBase: "https://wall.sli.do/event/aWbLs8vTQ61CWaLsUQXmaW",
    // Prep checklist only (NOT rendered as slides anymore): the questions you
    // create in Slido and activate one-by-one during the meetup. The single
    // live wall slide auto-follows whichever one is active.
    questions: [
      { q: "Which AI tools are you paying for / using? 🤖", kind: "poll", embed: "" },
      { q: "What's your monthly AI bill? 💸",               kind: "poll", embed: "" },
      { q: "Where does AI save you the most time? ⏱️",      kind: "open", embed: "",
        hint: "Workflow + rough hours/week — e.g. “Code reviews — 5h/week”." },
    ],
  },

  /* ---- Last time's news — the RETROSPECTIVE slide ------------------------
     This slide is the LOOK-BACK: the numbered 01/02/03 cards are the news from
     the PREVIOUS codeforce, not this month's upcoming stories. Each card:
       tag   -> small label (per-card accent colour)   title -> the headline
       blurb -> one-line recap                          url   -> optional QR */
  news: {
    lastTime: [
      { title: "Model costs: up or down?", tag: "Economics",
        blurb: "The monthly check-in on token prices and what it means for builders.",
        url: "" },
      { title: "Claude — new design language", tag: "Product",
        blurb: "Fresh UI direction across Claude's surfaces.", url: "" },
      { title: "Security news", tag: "Security",
        blurb: "This month's notable GenAI security story — presented by Daniel.", url: "" },
    ],
  },

  /* ---- Last time's TOOL of the Month — the RETROSPECTIVE -----------------
     A look-back at the PREVIOUS codeforce's Tool of the Month (a live demo —
     NOT this month's upcoming `tool` below). Same "rewind" treatment as `news`.
     The topic was building a custom on-prem AI cluster, so the recap renders
     as a platform STACK built from the ground up. `layers` go bottom → top
     (foundation first); `who` is the demoer; `url` is an optional QR. */
  toolRecap: {
    tag:    "🏗️ On-Prem AI",
    kicker: "Previously on the GenAI-Codeforce · Tool of the Month",
    title:  "Building an On-Prem AI Platform",
    blurb:  "A live demo by Wolfgang Dummer on the origins of a custom AI cluster — the whole journey from hardware to a developer-ready platform.",
    who:    "Wolfgang Dummer",
    layers: [
      { icon: "🖥️", head: "Hardware → Kubernetes",  body: "The journey from bare-metal boxes to a running k8s cluster." },
      { icon: "🧱", head: "Layering the platform",   body: "Stacking the platform services on top of k8s." },
      { icon: "🛠️", head: "Custom tooling",          body: "Why hand-built tooling is what actually moves developers." },
      { icon: "🏢", head: "Multi-tenant reality",    body: "The messy realities of sharing one cluster across many teams." },
    ],
    url:    "",
  },

  /* ---- Deep-dive spotlights ----------------------------------------------
     The three interactive "Breaking News" slides. Copy lives here so you can
     re-word it; the click-interactions are wired in engine.js. Each is built
     by its own slide (buildEmmi / buildLoop / buildHarness). Swap freely. */
  spotlight: {

    /* 1) Mistral acquires Emmi AI — the local Austrian hero -------------- */
    emmi: {
      tag: "🇦🇹 Austria",
      kicker: "Deep Dive · Deal of the month",
      title: "Mistral buys our neighbours",
      hero: "assets/news/mistral-emmi.jpg",          // real announcement image (both logos)
      logo: "assets/news/emmi-logo.svg",             // Emmi wordmark (white → shown on a dark plate)
      deal: "Paris-based Mistral AI just bought Emmi AI — a 2-year-old spin-off from JKU Linz. Reported valuation: up to €330M.",
      // Click-through timeline (each dot reveals its card):
      timeline: [
        { year: "2024",     head: "Born in Linz",          body: "Emmi AI spins out of JKU Linz. Founders: Johannes Brandstetter (ex-CERN, Higgs-boson physics), Dennis Just & Miks Mikelsons." },
        { year: "2025",     head: "Austria's biggest seed", body: "Raises €15M — the largest seed round ever for an Austrian startup. Backers: 3VC, Speedinvest, Serena, PUSH." },
        { year: "May 2026", head: "Mistral acquires",      body: "France's Mistral AI buys Emmi. 30+ researchers & engineers join Mistral's science and applied-AI divisions." },
        { year: "Now",      head: "Linz goes global",      body: "Linz becomes Mistral's 7th office — next to Paris, London, Amsterdam, Munich, San Francisco & Singapore." },
      ],
      // Before / after toggle — what Emmi actually does, in plain words:
      what: {
        before: { head: "The old way", body: "One engineering simulation — airflow over a wing, heat in a chip, stress in a part — can take hours or days on a supercomputer." },
        after:  { head: "Emmi's “Physics AI”", body: "An AI model learns the physics, then produces the same simulation in real time. Days → seconds, on a laptop-friendly model." },
      },
      uses: ["✈️ Aerospace airflow", "🚗 Crash & material stress", "🔥 Thermal analysis", "🔌 Semiconductors"],
      quote: { text: "This is a pivotal moment for industrial engineering and the broader AI4Science movement.",
               who: "Johannes Brandstetter — Emmi co-founder, now VP AI for Science at Mistral" },
      link: "https://www.emmi.ai/news/mistral-ai-acquires-emmi-ai",
    },

    /* 2) /loop — Peter Steinberger's "stop prompting" idea --------------- */
    loop: {
      tag: "🦞 Workflow",
      kicker: "Deep Dive · How people actually code now",
      title: "Stop prompting. Start looping.",
      // The viral post (recreated as a card so it works offline):
      tweet: {
        name: "Peter Steinberger", handle: "@steipete", avatar: "🦞",
        sub: "PSPDFKit founder · agentic-coding evangelist",
        date: "Jun 8, 2026", views: "6.5M",
        text: "Here's your monthly reminder that you shouldn't be prompting coding agents anymore. You should be designing loops that prompt your agents.",
      },
      // Old vs new mental model (the toggle):
      versus: {
        old: { icon: "🧑‍💻", head: "Prompting (old)", body: "You type → it answers → you read → you type again. You're holding the wheel the whole time." },
        neu: { icon: "🔁", head: "Looping (new)",   body: "You design the loop once. It finds work, does it, checks itself and repeats — while you sleep." },
      },
      // The loop the animation steps through:
      cycle: ["Prompt", "Act", "Check", "Done?"],
      cycleNote: "Each click = one step. If the check fails, it loops back. When tests go green, the loop exits.",
      // A real /loop command (this exact command exists in Claude Code):
      example: "/loop babysit all my PRs. Auto-fix build issues, and when comments come in, use a worktree agent to fix them.",
      exampleNote: "In Claude Code, /loop runs a prompt on repeat — or, with no interval, self-paces until the job is done.",
      warning: "A loop with nothing to push back is just the agent agreeing with itself on repeat.",
      note: "Feedback — tests, type-checks, review gates — is what makes a loop trustworthy instead of runaway.",
      arc: "Same guy, 6 months earlier: “Just talk to it.” The tools finally got good enough to loop.",
    },

    /* 3) Paper of the Month — the Agent Harness survey ------------------- */
    harness: {
      tag: "📄 Paper of the Month",
      kicker: "Deep Dive · Paper of the month",
      title: "The harness, not the model",
      paperTitle: "Agent Harness for LLM Agents: A Survey",
      authors: "Meng, Wang, Chen et al. · preprints.org",
      thesis: "When agents fail in the real world, it's usually not the model — it's the scaffolding around it. The paper calls that scaffolding the “harness”.",
      // The paper's own architecture figure — the H = ⟨E,T,C,S,L,V⟩ diagram.
      // Shown as a thumbnail on the slide; click it to zoom full-screen.
      // (Pulled from the paper's repo — see links.repo — into assets/news/.)
      figure: "assets/news/harness-architecture.png",
      figureCaption: "The 6-part harness, visualized — click to zoom",
      // The jaw-dropper stat (animated bar):
      stat: { from: 6.7, to: 68.3, model: "Grok Code Fast", bench: "SWE-bench",
              caption: "Same model. They changed only the harness's code-edit format.",
              // Revealed together with the jump — the SAME edit-format experiment,
              // widened out, so the Grok number doesn't read like a lucky one-off.
              // (Source: can.ac, “The harness problem”, Feb 2026.) Fills the panel
              // under the "Reveal the jump" button.
              more: {
                head: "…and it isn't just Grok.",
                src: "can.ac · “The harness problem”",
                points: [
                  "16 models · 3 edit formats — one afternoon, only the harness changed",
                  "+8% on Gemini — a bigger lift than most model upgrades, at zero training compute",
                  "Weakest models gain most — MiniMax more than doubled",
                ],
              } },
      // The 6 clickable components: H = (E, T, C, S, L, V)
      components: [
        { k: "E", name: "Execution Loop", body: "The observe → think → act cycle, with error recovery. (Yes: this is the /loop idea, formalized.)" },
        { k: "T", name: "Tool Registry",  body: "Which tools exist and how the agent picks the right one for the job." },
        { k: "C", name: "Context Manager", body: "What information actually makes it into the model's context window." },
        { k: "S", name: "State Store",    body: "Memory that survives across turns and sessions." },
        { k: "L", name: "Lifecycle Hooks", body: "Auth, logging, policy & guardrails wrapped around each step." },
        { k: "V", name: "Evaluation",     body: "How you measure success and trace what the agent actually did." },
      ],
      // Flip cards — the spicy findings:
      findings: [
        { head: "Stripe Minions", body: "1,300 PRs / week — with zero hand-written code." },
        { head: "Vercel", body: "Removing 80% of the tools helped more than upgrading the model." },
        { head: "Context kills", body: "Most agent failures aren't a dumb model — it's a context window stuffed with junk." },
      ],
      scope: ["110+ papers", "23 systems", "9 open challenges"],
      tie: "Steinberger says it on X; this paper proves it across 110 references — the scaffolding beats the model.",
      links: { paper: "https://www.preprints.org/manuscript/202604.0428", repo: "https://github.com/Gloriaameng/Awesome-Agent-Harness" },
    },
  },

  /* ---- Tool of the Month -------------------------------------------------
     TWO shapes are supported (engine.js auto-detects which to render):
       • Simple single tool  -> just set { name, blurb, url }.
       • "Triple feature"     -> set `features` (the live line-up) and, optionally,
                                 `defenses` (click-to-reveal pillars). `url` = the
                                 register/join link, shown as a QR.
     THIS month it's the whole theme: "Agent Systems in the Real World" — a live
     triple feature on building, hardening & orchestrating agents. */
  tool: {
    tag:    "🧠 Agent Systems",
    kicker: "Tool of the Month · Live triple feature",
    title:  "Agent Systems in the Real World",
    // The hook (straight from the LinkedIn write-up):
    blurb:  "Building, hardening & orchestrating agents that actively resist malicious prompt injections — an art of its own.",
    // The three live demos, in running order:
    features: [
      { icon: "🌍", topic: "Scaling the arena",
        head: "Building & scaling a global AI hackathon for autonomous agents",
        who:  "Felix Krause" },
      { icon: "🎯", topic: "Challenge design",
        head: "Designing the challenges that make agents break",
        who:  "Rinat Abdullin" },
      { icon: "🏆", topic: "Winning agent breakdown",
        head: "Layered defenses, parallel execution & constrained tool use",
        who:  "Bernhard Götzendorfer" },
    ],
    // The winning agent's playbook — click a pillar on the slide to reveal it:
    defenses: [
      { icon: "🧱", name: "Layered defenses",
        body: "Defense in depth — never one guard. Inputs get sanitised, validated and re-checked at every hop, so a single bypass isn't game over." },
      { icon: "⚡", name: "Parallel execution",
        body: "Independent sub-agents run side by side and cross-check each other — faster, and far harder for one poisoned branch to steer the whole." },
      { icon: "🔒", name: "Constrained tool use",
        body: "Least privilege for tools: a tight, allow-listed surface means an injected instruction simply has nothing dangerous left to call." },
    ],
    // No QR card on this slide — the LinkedIn post isn't linked. Set a URL here
    // to bring back the "Scan to join · free" QR card.
    url:    "",
    // (Simple-mode fallback only — ignored while `features` is set.)
    name:   "Agent Systems in the Real World",
  },

  /* ---- Live demo slot (usually someone else drives) ----------------------- */
  demo: {
    title: "Live Demo",
    presenter: "Open slot",
    blurb: "Hand over the screen — this is the hands-on bit.",
  },
};
