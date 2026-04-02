import { Hono } from 'hono'
import { raw } from 'hono/html'
import type { Bindings } from '../types'
import { getActiveMembers } from '../data'
import { CANADA_VIEWBOX, CANADA_OUTLINE_PATH, CANADA_REGION_PATHS, projectToSvg } from '../lib/canada-map'
import { MOUNTAINS_SVG, STARS_SVG, CN_TOWER_SVG, TREELINE_SVG, BEAVER_SVG, MOOSE_SVG, HOCKEY_SVG, SYRUP_SVG, TIMBITS_SVG } from '../lib/splash/assets'
import Layout from '../templates/Layout'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  c.header('Cache-Control', 'public, max-age=300')
  const active = await getActiveMembers(c.env.WEBRING)

  return c.html(
    <Layout fullHeight hideChrome>
      {raw(`<style>
        /* ── Splash hero ── */
        .splash {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: #0a0a2e;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .splash-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .splash-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .splash-title {
          position: relative;
          z-index: 3;
          text-align: center;
          color: #fff;
        }
        .splash-title h1 {
          font-size: 4.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #fff;
        }
        .splash-title p {
          font-size: 1.1rem;
          font-weight: 400;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.05em;
          margin-bottom: 0;
        }
        .splash-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(255,255,255,0.4);
          margin-bottom: 1rem;
        }
        .splash-flag {
          height: 1.8rem;
          width: auto;
          margin-bottom: 1.5rem;
          animation: flag-wave 3s ease-in-out infinite;
        }
        @keyframes flag-wave {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        .splash-scroll {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
          color: rgba(255,255,255,0.3);
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          animation: scroll-hint 2s ease-in-out infinite;
        }
        @keyframes scroll-hint {
          0%, 100% { opacity: 0.3; transform: translateX(-50%) translateY(0); }
          50% { opacity: 0.6; transform: translateX(-50%) translateY(6px); }
        }
        .splash-fallback-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0a0a2e, #061a12, #0a2818, #1a0a3e);
          background-size: 400% 400%;
          animation: aurora-fallback 12s ease infinite;
          z-index: 0;
        }
        @keyframes aurora-fallback {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .landing-wrap {
          position: relative;
          min-height: 100vh;
          z-index: 1;
          background: var(--bg);
        }
        @media (max-width: 767px) {
          .splash-title h1 { font-size: 2.8rem; }
          .splash-title p { font-size: 0.95rem; }
          .splash-flag { height: 1.4rem; }
        }

        .landing {
          display: flex;
          flex: 1;
          min-height: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
        }

        /* ── Left column — flexbox ── */
        .landing-left {
          flex: 0 0 47%;
          display: flex;
          flex-direction: column;
          position: relative;
          border-left: 2px solid var(--border-strong);
          border-right: 2px solid var(--border-strong);
          padding-bottom: 3.5rem;
        }

        /* ── Site title ── */
        .landing-title {
          font-size: 3.5rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          padding: 1.5rem 2rem;
          line-height: 1.1;
          color: var(--fg);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .landing-title-flag {
          height: 1.2em;
          width: auto;
          display: inline-block;
          flex-shrink: 0;
        }
        .landing-intro {
          font-size: 1.2rem;
          font-weight: 400;
          line-height: 1.55;
          color: var(--fg);
          padding: 0 2rem 1.2rem;
          max-width: 42ch;
        }
        .member-count {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--fg-muted);
          padding: 0.8rem 2rem 0.4rem;
          border-top: 2px solid var(--border-strong);
        }
        .member-list-wrap {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }


        /* ── Members list ── */
        .member-list { list-style: none; padding: 0 2rem; }
        .member-list li {
          padding: 0.6rem 0;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .member-list li:first-child { border-top: 1px solid var(--border); }
        .member-list-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--fg);
          text-decoration: none;
        }
        .member-list-name:hover { color: var(--accent); }
        .member-list-meta {
          font-size: 0.8rem;
          font-weight: 400;
          color: var(--fg-muted);
        }


        /* ── Widget (matches embed look) ── */
        .landing-widget {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 0.85rem 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
        }
        .landing-widget-inner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 0.8rem;
        }
        .landing-widget a {
          color: var(--accent);
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .landing-widget a:visited { color: var(--accent); }
        .landing-widget a:hover { opacity: 0.7; }

        /* ── Right column — map ── */
        .landing-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          position: relative;
        }

        /* ── Tab bar ── */
        .tab-bar {
          display: flex;
          gap: 0;
          border-bottom: 1.5px solid var(--border);
          margin-bottom: 0;
          padding: 0;
        }
        .tab-btn {
          background: none;
          border: none;
          padding: 0.6rem 1.2rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--fg-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1.5px;
          transition: color 0.15s;
        }
        .tab-btn:hover { color: var(--fg); }
        .tab-btn.is-active {
          color: var(--fg);
          border-bottom-color: var(--border-strong);
        }
        .tab-panel { display: none; }
        .tab-panel.is-active { display: flex; align-items: center; justify-content: center; flex: 1; }

        /* ── Discover view ── */
        .discover-view {
          text-align: center;
          padding: 2rem;
        }
        .discover-name {
          font-size: 1.8rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--fg);
          margin-bottom: 0.3rem;
        }
        .discover-meta {
          font-size: 0.9rem;
          color: var(--fg-muted);
          margin-bottom: 1.8rem;
        }
        .discover-visit {
          display: inline-block;
          padding: 0.6rem 1.8rem;
          border: 1.5px solid var(--border-strong);
          border-radius: 4px;
          font-family: 'Space Mono', monospace;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--fg);
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .discover-visit:hover { opacity: 0.6; }
        .discover-visit:visited { color: var(--fg); }
        .discover-shuffle {
          display: block;
          margin: 1rem auto 0;
          background: none;
          border: none;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          color: var(--fg-muted);
          cursor: pointer;
          padding: 0.4rem 1rem;
          transition: color 0.15s;
        }
        .discover-shuffle:hover { color: var(--fg); }
        .discover-fade {
          transition: opacity 0.2s ease;
        }
        .landing-map-stage {
          width: min(100%, 640px);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          isolation: isolate;
        }
        .landing-map-stage::before {
          content: '';
          position: absolute;
          inset: 10% 6% 14%;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 45%,
              color-mix(in srgb, var(--accent) 11%, transparent) 0%,
              color-mix(in srgb, var(--accent) 6%, transparent) 28%,
              transparent 68%);
          opacity: 0.7;
          filter: blur(28px);
          z-index: 0;
          pointer-events: none;
        }
        .canada-map {
          width: 100%;
          height: auto;
          position: relative;
          z-index: 1;
        }
        .canada-silhouette {
          fill: color-mix(in srgb, var(--fg) 5%, var(--bg));
          opacity: 0.96;
        }
        .canada-shadow {
          fill: none;
          stroke: color-mix(in srgb, var(--fg) 8%, transparent);
          stroke-width: 7;
          stroke-linejoin: round;
          opacity: 0.28;
          filter: blur(10px);
        }
        .canada-outline {
          fill: none;
          stroke: color-mix(in srgb, var(--fg) 34%, var(--bg));
          stroke-width: 1.25;
          stroke-linejoin: round;
          vector-effect: non-scaling-stroke;
        }
        .canada-region {
          fill: none;
          stroke: color-mix(in srgb, var(--fg) 14%, var(--bg));
          stroke-width: 0.75;
          vector-effect: non-scaling-stroke;
          opacity: 0.9;
        }
        .canada-dot {
          fill: var(--accent);
          stroke: var(--bg);
          stroke-width: 3;
          filter: drop-shadow(0 4px 10px color-mix(in srgb, var(--accent) 24%, transparent));
          opacity: 0.95;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .canada-dot.is-highlighted {
          opacity: 1;
          transform: scale(1.22);
        }

        /* ── Landing theme toggle ── */
        .landing-theme-toggle {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: none;
          border: 1.5px solid var(--border-strong);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--fg);
          transition: opacity 0.2s;
          z-index: 10;
        }
        .landing-theme-toggle:hover { opacity: 0.6; }

        /* ── Responsive ── */
        @media (max-width: 767px) {
          .landing { flex-direction: column; height: auto; }
          .landing-left {
            border-left: none;
            border-right: none;
            border-bottom: 2px solid var(--border-strong);
          }
          .landing-title { font-size: 2.2rem; padding: 1.2rem 1.5rem; }
          .landing-intro { padding: 0 1.5rem 1rem; font-size: 0.95rem; }
          .member-count { padding: 0.6rem 1.5rem 0.3rem; }
          .member-list { padding: 0 1.5rem; }
          .member-list li { padding: 0.5rem 0; }
          .member-list-meta-type { display: none; }
          .landing-right { flex: none; min-height: 40vh; padding: 1.5rem; }
          .landing-map-stage { width: 100%; padding: 1.25rem 0.25rem 1.75rem; }
          .landing-theme-toggle { top: 1.2rem; right: 1rem; width: 30px; height: 30px; }
          .landing-theme-toggle svg { width: 14px; height: 14px; }
          .tab-bar { padding: 0; }
          .tab-btn { font-size: 0.72rem; padding: 0.5rem 0.8rem; }
          .discover-name { font-size: 1.4rem; }
          .discover-visit { font-size: 0.8rem; padding: 0.5rem 1.4rem; }
        }
      </style>`)}
      <section class="splash" id="splash">
        <div class="splash-fallback-bg"></div>
        <canvas class="splash-canvas" id="aurora-canvas"></canvas>
        <div class="splash-layer" id="splash-layer-1" data-depth="0.01">
          {raw(STARS_SVG)}
          {raw(MOUNTAINS_SVG)}
        </div>
        <div class="splash-layer" id="splash-layer-2" data-depth="0.02">
          {raw(CN_TOWER_SVG)}
          {raw(TREELINE_SVG)}
        </div>
        <div class="splash-title" data-depth="0.03">
          <img src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Flag_of_Canada_%28Pantone%29.svg" alt="Flag of Canada" class="splash-flag" />
          <div class="splash-label">A Canadian Webring</div>
          <h1>webring.ca</h1>
          <p>Builders. Designers. Creators.</p>
        </div>
        <div class="splash-layer" id="splash-layer-4" data-depth="0.05">
          {raw(BEAVER_SVG)}
          {raw(MOOSE_SVG)}
          {raw(HOCKEY_SVG)}
          {raw(SYRUP_SVG)}
          {raw(TIMBITS_SVG)}
        </div>
        <canvas class="splash-canvas" id="particle-canvas" style="z-index:5;"></canvas>
        <div class="splash-scroll">{raw('&darr;')}</div>
      </section>
      <div class="landing-wrap">
      <div class="landing">
        {raw(`<button class="landing-theme-toggle" onclick="__toggleTheme()" aria-label="Toggle theme"><svg class="theme-icon-moon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><svg class="theme-icon-sun" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg></button>`)}
        <div class="landing-left" id="landing-left">
          <a href="/" class="landing-title">webring.ca <img src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Flag_of_Canada_%28Pantone%29.svg" alt="Flag of Canada" class="landing-title-flag" /></a>

          <p class="landing-intro">A curated community of Canadian builders, designers, and creators sharing their work on the open web.</p>

          <div class="member-count">{active.length} Member{active.length !== 1 ? 's' : ''}</div>

          <div class="member-list-wrap">
            {active.length === 0 ? (
              <p class="landing-intro">No members yet.</p>
            ) : (
              <ul class="member-list">
                {active.map((m) => (
                  <li data-member-slug={m.slug}>
                    <a href={m.url} target="_blank" rel="noopener noreferrer" class="member-list-name">{m.name}</a>
                    <span class="member-list-meta">{m.city ?? ''}{m.city ? ' \u00b7 ' : ''}<span class="member-list-meta-type">{m.type}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div class="landing-widget">
            <div class="landing-widget-inner">
              <a href="/random">{raw('&larr;')}</a>
              <a href="/">{raw('&#x1F341;')} webring.ca</a>
              <a href="/random">{raw('&rarr;')}</a>
              <a href="/join">join</a>
            </div>
          </div>
        </div>

        <div class="landing-right">
          <div class="tab-bar" role="tablist">
            <button class="tab-btn is-active" role="tab" aria-selected="true" data-tab="map" aria-controls="tab-panel-map">Map</button>
            <button class="tab-btn" role="tab" aria-selected="false" data-tab="discover" aria-controls="tab-panel-discover">Discover</button>
          </div>

          <div class="tab-panel is-active" id="tab-panel-map" role="tabpanel">
            <div class="landing-map-stage">
              <svg
                class="canada-map"
                viewBox={CANADA_VIEWBOX}
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label={`Map of Canada showing ${active.filter(m => m.lat != null).length} member locations`}
              >
                <path d={CANADA_OUTLINE_PATH} class="canada-shadow" />
                <path d={CANADA_OUTLINE_PATH} class="canada-silhouette" />
                {CANADA_REGION_PATHS.map((region) => (
                  <path d={region.d} class="canada-region" data-region={region.id}>
                    <title>{region.name}</title>
                  </path>
                ))}
                <path d={CANADA_OUTLINE_PATH} class="canada-outline" />
                {active.map((m) => {
                  if (m.lat == null || m.lng == null) return null
                  const { x, y } = projectToSvg(m.lat, m.lng)
                  return (
                    <circle
                      cx={x}
                      cy={y}
                      r="9"
                      class="canada-dot"
                      data-slug={m.slug}
                    >
                      <title>{m.name}{m.city ? ` — ${m.city}` : ''}</title>
                    </circle>
                  )
                })}
              </svg>
            </div>
          </div>

          <div class="tab-panel" id="tab-panel-discover" role="tabpanel">
            <div class="discover-view">
              <div class="discover-fade" id="discover-card">
                <div class="discover-name" id="discover-name"></div>
                <div class="discover-meta" id="discover-meta"></div>
                <a class="discover-visit" id="discover-visit" href="#" target="_blank" rel="noopener noreferrer">Visit site {raw('&rarr;')}</a>
              </div>
              <button class="discover-shuffle" id="discover-shuffle">{raw('&#x1F500;')} shuffle</button>
            </div>
          </div>
        </div>
      </div>
      </div>
      {raw(`<script>var __discoverMembers = ${JSON.stringify(active.map(m => ({ slug: m.slug, name: m.name, url: m.url, city: m.city ?? '', type: m.type })))};</script>`)}
      {raw(`<script>
(function() {
  // Cross-panel hover: member list ↔ map dots
  var memberItems = document.querySelectorAll('[data-member-slug]');
  var mapDots = document.querySelectorAll('.canada-dot');

  memberItems.forEach(function(li) {
    var slug = li.getAttribute('data-member-slug');
    li.addEventListener('mouseenter', function() {
      mapDots.forEach(function(dot) {
        if (dot.getAttribute('data-slug') === slug) {
          dot.classList.add('is-highlighted');
        }
      });
    });
    li.addEventListener('mouseleave', function() {
      mapDots.forEach(function(dot) {
        dot.classList.remove('is-highlighted');
      });
    });
  });

  // Tab switching
  var tabs = document.querySelectorAll('.tab-btn');
  var panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(function(p) { p.classList.remove('is-active'); });

      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      var panelId = 'tab-panel-' + tab.getAttribute('data-tab');
      document.getElementById(panelId).classList.add('is-active');
    });
  });

  // Discover — random member
  var discoverRecent = [];
  var discoverCard = document.getElementById('discover-card');
  var discoverName = document.getElementById('discover-name');
  var discoverMeta = document.getElementById('discover-meta');
  var discoverVisit = document.getElementById('discover-visit');

  function showRandomMember() {
    var available = __discoverMembers.filter(function(m) {
      return discoverRecent.indexOf(m.slug) === -1;
    });
    if (available.length === 0) {
      discoverRecent = [];
      available = __discoverMembers;
    }
    var member = available[Math.floor(Math.random() * available.length)];
    discoverRecent.push(member.slug);
    if (discoverRecent.length > Math.max(1, Math.floor(__discoverMembers.length / 2))) {
      discoverRecent.shift();
    }

    discoverCard.style.opacity = '0';
    setTimeout(function() {
      discoverName.textContent = member.name;
      discoverMeta.textContent = (member.city || '') + (member.city ? ' \u00b7 ' : '') + member.type;
      discoverVisit.href = member.url;
      discoverCard.style.opacity = '1';
    }, 150);
  }

  document.getElementById('discover-shuffle').addEventListener('click', showRandomMember);

  // Show first member when Discover tab is first opened
  var discoverInitialized = false;
  tabs.forEach(function(tab) {
    if (tab.getAttribute('data-tab') === 'discover') {
      tab.addEventListener('click', function() {
        if (!discoverInitialized) {
          discoverInitialized = true;
          showRandomMember();
        }
      });
    }
  });
})();
</script>`)}
      {raw(`<script>
(function() {
  var splash = document.getElementById('splash');
  if (!splash) return;

  // ── Parallax ──
  var layers = splash.querySelectorAll('[data-depth]');
  var tX = window.innerWidth / 2, tY = window.innerHeight / 2;
  var cX = tX, cY = tY;

  window.addEventListener('mousemove', function(e) { tX = e.clientX; tY = e.clientY; });

  function updateParallax() {
    cX += (tX - cX) * 0.08;
    cY += (tY - cY) * 0.08;
    var w = splash.clientWidth, h = splash.clientHeight;
    layers.forEach(function(l) {
      var d = parseFloat(l.getAttribute('data-depth') || '0');
      var ox = (cX - w / 2) * d;
      var oy = (cY - h / 2) * d;
      l.style.transform = 'translate(' + ox + 'px,' + oy + 'px)';
    });
    requestAnimationFrame(updateParallax);
  }
  requestAnimationFrame(updateParallax);

  // ── Particles ──
  var pc = document.getElementById('particle-canvas');
  if (pc) {
    var ctx = pc.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio, 2);
    var pw = pc.clientWidth, ph = pc.clientHeight;
    pc.width = pw * dpr; pc.height = ph * dpr;
    ctx.scale(dpr, dpr);

    var mobile = window.innerWidth <= 767;
    var particles = [];

    for (var i = 0; i < (mobile ? 15 : 30); i++) {
      particles.push({ type: 'leaf', x: Math.random()*pw, y: Math.random()*ph,
        size: 3+Math.random()*5, sx: (Math.random()-0.5)*0.3, sy: 0.2+Math.random()*0.4,
        rot: Math.random()*Math.PI*2, rSpeed: (Math.random()-0.5)*0.02,
        opacity: 0.15+Math.random()*0.25 });
    }
    for (var j = 0; j < (mobile ? 50 : 120); j++) {
      particles.push({ type: 'snow', x: Math.random()*pw, y: Math.random()*ph,
        size: 0.5+Math.random()*1.5, sx: (Math.random()-0.5)*0.2, sy: 0.1+Math.random()*0.3,
        rot: 0, rSpeed: 0, opacity: 0.2+Math.random()*0.4 });
    }

    function animateParticles() {
      ctx.clearRect(0, 0, pw, ph);
      particles.forEach(function(p) {
        p.x += p.sx; p.y += p.sy; p.rot += p.rSpeed;
        if (p.y > ph + p.size) { p.y = -p.size; p.x = Math.random() * pw; }
        if (p.x < -p.size) p.x = pw + p.size;
        if (p.x > pw + p.size) p.x = -p.size;

        if (p.type === 'leaf') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.globalAlpha = p.opacity; ctx.fillStyle = '#c22';
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.quadraticCurveTo(p.size*0.8, -p.size*0.3, p.size*0.4, p.size*0.5);
          ctx.lineTo(0, p.size*0.3);
          ctx.lineTo(-p.size*0.4, p.size*0.5);
          ctx.quadraticCurveTo(-p.size*0.8, -p.size*0.3, 0, -p.size);
          ctx.fill(); ctx.restore();
        } else {
          ctx.globalAlpha = p.opacity; ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        }
      });
      requestAnimationFrame(animateParticles);
    }
    requestAnimationFrame(animateParticles);
  }

  // ── Aurora (three.js) ──
  function tryAurora() {
    if (!window.THREE) { setTimeout(tryAurora, 100); return; }
    var ac = document.getElementById('aurora-canvas');
    if (!ac) return;
    var T = window.THREE;
    var renderer = new T.WebGLRenderer({ canvas: ac, alpha: false, antialias: false });
    renderer.setSize(ac.clientWidth, ac.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    var scene = new T.Scene();
    var camera = new T.OrthographicCamera(-1,1,1,-1,0,1);

    var vert = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}';
    var frag = 'precision mediump float;uniform float uTime;uniform vec2 uRes;varying vec2 vUv;'
      + 'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}'
      + 'vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}'
      + 'vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}'
      + 'float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1;i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);}'
      + 'void main(){vec2 uv=vUv;float t=uTime*0.15;'
      + 'float n1=snoise(vec2(uv.x*2.0+t,uv.y*0.5+t*0.3));'
      + 'float n2=snoise(vec2(uv.x*1.5-t*0.7,uv.y*0.8+t*0.2));'
      + 'float n3=snoise(vec2(uv.x*3.0+t*0.5,uv.y*0.3-t*0.1));'
      + 'float band=smoothstep(0.15,0.45,uv.y)*smoothstep(0.85,0.55,uv.y);'
      + 'vec3 green=vec3(0.1,0.8,0.4);vec3 purple=vec3(0.5,0.2,0.8);vec3 cyan=vec3(0.1,0.6,0.8);'
      + 'float m1=smoothstep(-0.3,0.5,n1);float m2=smoothstep(-0.2,0.6,n2);float m3=smoothstep(-0.1,0.4,n3);'
      + 'vec3 aurora=green*m1*0.4+purple*m2*0.3+cyan*m3*0.2;aurora*=band;'
      + 'vec3 skyT=vec3(0.04,0.04,0.18);vec3 skyB=vec3(0.02,0.06,0.04);'
      + 'vec3 sky=mix(skyB,skyT,uv.y);gl_FragColor=vec4(sky+aurora,1.0);}';

    var mat = new T.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: { uTime:{value:0.0}, uRes:{value:new T.Vector2(ac.clientWidth,ac.clientHeight)} }
    });
    scene.add(new T.Mesh(new T.PlaneGeometry(2,2), mat));
    var t0 = performance.now();
    function anim() { mat.uniforms.uTime.value=(performance.now()-t0)/1000; renderer.render(scene,camera); requestAnimationFrame(anim); }
    requestAnimationFrame(anim);

    window.addEventListener('resize', function() { renderer.setSize(ac.clientWidth, ac.clientHeight); mat.uniforms.uRes.value.set(ac.clientWidth, ac.clientHeight); });
  }
  var testCanvas = document.createElement('canvas');
  if (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')) {
    tryAurora();
  }

  // ── Scroll fade ──
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      splash.style.opacity = Math.max(entry.intersectionRatio, 0);
    });
  }, { threshold: Array.from({length:20}, function(_,i){ return i/20; }) });
  obs.observe(splash);
})();
</script>`)}
    </Layout>
  )
})

export default app
