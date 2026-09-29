/* ==========================================================================
   MorpheX — shared shell + release helpers.
   Loaded (deferred) before Alpine so the shell exists when Alpine boots.
   Libraries used: Alpine.js, Tippy.js, Toastify, SweetAlert2, canvas-confetti,
   CountUp.js. Release data: window.MORPHEX_SNAPSHOT, refreshed live from the
   GitHub API (falls back silently to the snapshot).
   ========================================================================== */
(function () {
  'use strict';

  const REPO = 'Svznify/MorpheX';
  const MX = (window.MX = {});
  MX.repo = REPO;
  MX.avatar = 'https://avatars.githubusercontent.com/u/89574788?v=4';
  MX.heroImg = 'https://github.com/user-attachments/assets/d75dfcd7-d7cd-4438-a462-edd273705666';
  MX.microg = 'https://github.com/MorpheApp/MicroG-RE/releases/download/6.1.1/microg-6.1.1.apk';
  MX.links = {
    repo: `https://github.com/${REPO}`,
    releases: `https://github.com/${REPO}/releases`,
    issues: `https://github.com/${REPO}/issues`,
    newIssue: `https://github.com/${REPO}/issues/new`,
    site: 'https://morphe.software/',
    docs: 'https://github.com/MorpheApp/morphe-documentation#readme',
    discord: 'https://discord.gg/yMnc3EywRZ',
    reddit: 'https://www.reddit.com/r/MorpheApp',
    x: 'https://x.com/MorpheApp',
    translate: 'https://morphe.software/translate',
    telegram: 'https://t.me/rvb27/1610',
    microgReleases: 'https://github.com/MorpheApp/MicroG-RE/releases',
    stars: 'https://www.star-history.com/#Svznify/MorpheX&type=date&legend=top-left',
  };

  /* ---------- tiny safe storage ---------- */
  MX.store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };

  /* ---------- formatting ---------- */
  const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
  const full = new Intl.NumberFormat('en');
  MX.num = (n) => compact.format(n || 0);
  MX.numFull = (n) => full.format(n || 0);
  MX.size = (b) => (b >= 1048576 ? (b / 1048576).toFixed(b >= 104857600 ? 0 : 1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
  MX.date = (d) => new Date(d).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
  MX.ago = (d) => {
    const s = (new Date(d) - Date.now()) / 1000;
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const steps = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [u, sec] of steps) if (Math.abs(s) >= sec) return rtf.format(Math.round(s / sec), u);
    return 'just now';
  };

  /* ---------- release model ---------- */
  const PAL = {
    morphe: [['#ff0033', '#7a2cff'], ['#ff512f', '#dd2476'], ['#f5576c', '#5b21b6'], ['#ff4d6d', '#3a0ca3']],
    rvx: [['#0a84ff', '#0d2a6b'], ['#00c6ff', '#0b3d91'], ['#396afc', '#1b1f6b']],
    revanced: [['#0f9b8e', '#0b3d5c'], ['#24c6dc', '#514a9d']],
  };
  const ERA_NAME = { morphe: 'Morphe', rvx: 'RVX', revanced: 'ReVanced' };
  const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

  MX.enrich = (r) => {
    const assets = r.assets.map((a) => ({
      ...a,
      apk: /\.apk$/i.test(a.n),
      url: a.url || `https://github.com/${REPO}/releases/download/${encodeURIComponent(r.tag)}/${encodeURIComponent(a.n)}`,
    }));
    const apks = assets.filter((a) => a.apk);
    const names = assets.map((a) => a.n).join(' ');
    const era = /morphe/i.test(names) ? 'morphe' : /^v(\.1beta|18\.)/i.test(r.tag) ? 'revanced' : 'rvx';
    const ver = (r.tag.match(/(\d+\.\d+\.\d+)/) || [])[1] || r.tag.replace(/^v\.?/i, '');
    const p = apks[0] ? apks[0].n : '';
    const patch =
      (p.match(/-p(?:v)?(\d+\.\d+\.\d+)/i) || [])[1] ||
      (p.match(/Morphe_v(\d+\.\d+\.\d+)/i) || [])[1] ||
      (r.tag.match(/^v?\d+\.\d+\.\d+-(\d+\.\d+\.\d+(?:-dev(?:\.\d+)?)?)$/i) || [])[1] ||
      null;
    const pal = PAL[era][hash(r.tag) % PAL[era].length];
    return {
      ...r,
      assets, apks, era, ver, patch,
      eraName: ERA_NAME[era],
      primary: apks[0] || assets[0],
      views: apks.reduce((n, a) => n + a.d, 0),
      totalSize: apks.reduce((n, a) => n + a.s, 0),
      title: era === 'revanced' ? `ReVanced YouTube v${ver}` : `YouTube ${ERA_NAME[era]} v${ver}`,
      page: r.url || `https://github.com/${REPO}/releases/tag/${encodeURIComponent(r.tag)}`,
      style: `--g1:${pal[0]};--g2:${pal[1]}`,
      ts: new Date(r.date).getTime(),
    };
  };

  MX.normalizeApi = (arr) =>
    arr.filter((r) => !r.draft).map((r) => ({
      tag: r.tag_name, name: r.name, date: r.published_at, url: r.html_url, pre: r.prerelease,
      assets: r.assets.map((a) => ({ n: a.name, s: a.size, d: a.download_count, url: a.browser_download_url })),
    }));

  /* ---------- toasts / clipboard / dialogs ---------- */
  MX.toast = (msg, icon = 'fa-circle-check') => {
    if (!window.Toastify) return;
    Toastify({
      text: `<i class="fa-solid ${icon}" style="margin-right:10px"></i>${msg}`, escapeMarkup: false,
      duration: 3200, gravity: 'bottom', position: 'left', stopOnFocus: true,
      style: { background: '#323232', borderRadius: '8px', fontSize: '14px', boxShadow: '0 8px 30px rgba(0,0,0,.5)', bottom: '72px' },
    }).showToast();
  };

  MX.copy = async (text, msg = 'Copied to clipboard') => {
    try { await navigator.clipboard.writeText(text); MX.toast(msg); return true; }
    catch (e) {
      const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); MX.toast(msg); } catch (_) { MX.toast('Copy failed - select the text manually', 'fa-triangle-exclamation'); }
      t.remove();
    }
  };

  MX.confetti = (opts = {}) => {
    if (!window.confetti || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    confetti({ particleCount: 110, spread: 75, origin: { y: 0.7 }, colors: ['#ff0033', '#ffffff', '#7a2cff', '#0a84ff', '#ffb000'], ...opts });
  };

  MX.go = (url) => { location.href = url; };

  MX.startDownload = (url) => {
    const a = document.createElement('a');
    a.href = url; a.rel = 'noopener'; a.download = '';
    document.body.appendChild(a); a.click(); a.remove();
    MX.confetti();
    MX.toast('Download started - check your notifications', 'fa-download');
  };

  /* Pre-download check: non-root users need MicroG. Skippable for good. */
  MX.askDownload = async (rel, asset) => {
    const a = asset || rel.primary;
    if (MX.store.get('mx-skip-microg', false) || !/\.apk$/i.test(a.n)) return MX.startDownload(a.url);
    const res = await Swal.fire({
      icon: 'info', iconColor: '#3ea6ff',
      title: `Download ${rel.title}?`,
      html: `<div style="text-align:left;font-size:14px;line-height:1.6">
        <p><b>${a.n}</b><br><span style="opacity:.7">${MX.size(a.s)} · ${MX.numFull(a.d)} downloads</span></p>
        <p style="margin-top:10px"><i class="fa-solid fa-triangle-exclamation" style="color:#ffb000"></i>
        <b>Non-root users need MicroG</b> installed first, otherwise login and playback won't work.</p></div>`,
      input: 'checkbox', inputPlaceholder: "I've got MicroG - don't ask again",
      showDenyButton: true, showCancelButton: true,
      confirmButtonText: '<i class="fa-solid fa-download"></i>&nbsp; Download APK',
      denyButtonText: 'Get MicroG first', cancelButtonText: 'Cancel',
    });
    if (res.isConfirmed) { if (res.value) MX.store.set('mx-skip-microg', true); MX.startDownload(a.url); }
    else if (res.isDenied) MX.startDownload(MX.microg);
  };

  MX.legal = () => Swal.fire({
    icon: 'warning', iconColor: '#ffb000', title: 'Unofficial distribution notice',
    html: `<div style="text-align:left;font-size:14px;line-height:1.65">
      <p>This repository is <b>not affiliated with or endorsed by Morphe</b>. All credits belong to their respective developers.</p>
      <p style="margin-top:8px">It exists <b>solely to distribute pre-built APKs</b> generated using publicly available, upstream tools. This project does not host proprietary content.</p></div>`,
    confirmButtonText: 'Got it',
  });

  MX.shortcuts = () => Swal.fire({
    title: 'Keyboard shortcuts',
    html: `<div style="text-align:left;font-size:14px;line-height:2.1">
      <div><span class="kbd">/</span>&nbsp; Focus search</div>
      <div><span class="kbd">h</span>&nbsp; Home</div>
      <div><span class="kbd">d</span>&nbsp; Downloads</div>
      <div><span class="kbd">t</span>&nbsp; Toggle dark / light theme</div>
      <div><span class="kbd">m</span>&nbsp; Collapse / expand the sidebar</div>
      <div><span class="kbd">?</span>&nbsp; This dialog</div></div>`,
    confirmButtonText: 'Close',
  });

  /* ---------- theme ---------- */
  MX.setTheme = (t) => {
    document.documentElement.dataset.theme = t;
    MX.store.set('mx-theme', t);
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#0f0f0f' : '#ffffff';
  };

  /* ---------- layout: 'site' = landing-page nav/footer, default = app shell ---------- */
  const SITE = document.body.dataset.layout === 'site';

  /* ---------- sidebar mode ---------- */
  const mobile = () => matchMedia('(max-width: 1023px)').matches;
  MX.sb = {
    init() { document.documentElement.dataset.sb = SITE || mobile() ? 'hidden' : MX.store.get('mx-sb', 'full'); },
    toggle() {
      if (SITE) return;
      const d = document.documentElement.dataset;
      if (mobile()) d.sb = d.sb === 'full' ? 'hidden' : 'full';
      else { d.sb = d.sb === 'full' ? 'mini' : 'full'; MX.store.set('mx-sb', d.sb); }
    },
    close() { if (mobile()) document.documentElement.dataset.sb = 'hidden'; },
  };
  MX.sb.init();

  /* ---------- shell markup ---------- */
  const page = () => document.body.dataset.page || 'home';
  const nav = (href, ico, label, key, extra = '') =>
    `<a href="${href}" class="sb-item ${page() === key ? 'active' : ''}" @click="$store.ui.sbClose()"><i class="ico ${ico}"></i><span>${label}</span>${extra}</a>`;
  const chan = (href, bg, ico, label, extra = '') =>
    `<a href="${href}" target="_blank" rel="noopener" class="sb-item sb-full-only"><span class="ch-avatar" style="background:${bg}"><i class="${ico}"></i></span><span>${label}</span>${extra}</a>`;

  const shell = () => `
  <header id="topbar" class="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-2 px-2 sm:px-4" x-data="topbar()" @keydown.escape.window="close()" @click.outside="close()">
    <div class="flex items-center gap-1 sm:gap-3 flex-none" :class="mobileSearch && 'hidden'">
      <button class="icon-btn" data-tip="Guide (m)" aria-label="Toggle sidebar" @click="MX.sb.toggle()"><i class="fa-solid fa-bars text-lg"></i></button>
      <a href="index.html" class="flex items-center gap-1.5" aria-label="MorpheX home">
        <span class="logo-mark"><i class="fa-solid fa-play"></i></span>
        <span class="logo-word">Morphe<b>X</b></span>
        <sup class="text-[10px] text-yt-muted ml-0.5 hidden sm:inline">GB</sup>
      </a>
    </div>

    <form class="search-shell relative mx-auto" :class="!mobileSearch && 'hidden sm:flex'" @submit.prevent="submit()" role="search">
      <button type="button" class="icon-btn sm:hidden mr-1" @click="mobileSearch=false" aria-label="Back"><i class="fa-solid fa-arrow-left"></i></button>
      <input id="q" type="search" x-model="q" placeholder="Search releases, features, guides…" autocomplete="off"
             @focus="focus=true" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" aria-label="Search">
      <button class="go" type="submit" data-tip="Search" aria-label="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
      <button type="button" class="icon-btn ml-2 bg-yt-surface" :class="listening && '!bg-yt-red text-white animate__animated animate__pulse animate__infinite'" data-tip="Search with your voice" @click="voice()" aria-label="Voice search"><i class="fa-solid fa-microphone"></i></button>
      <div class="suggest" x-show="focus && suggestions.length" x-cloak x-transition.opacity>
        <template x-for="(s,i) in suggestions" :key="s.t">
          <a :href="s.u" :class="i===idx && 'active'" @mouseenter="idx=i"><i class="fa-solid w-5 text-center text-yt-muted" :class="s.i"></i><span x-text="s.t"></span><i class="fa-solid fa-arrow-up-left ml-auto text-yt-muted text-xs"></i></a>
        </template>
      </div>
    </form>

    <div class="flex items-center gap-1 sm:gap-2 flex-none" :class="mobileSearch && 'hidden'">
      <button class="icon-btn sm:hidden" @click="mobileSearch=true; $nextTick(()=>document.getElementById('q').focus())" aria-label="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
      <a href="downloads.html" class="pill-btn hidden md:inline-flex" data-tip="Download the latest APK"><i class="fa-solid fa-plus"></i> Get APK</a>
      <button class="icon-btn" :data-tip="$store.ui.theme==='dark' ? 'Switch to light theme (t)' : 'Switch to dark theme (t)'" @click="$store.ui.toggleTheme()" aria-label="Toggle theme">
        <i class="fa-solid" :class="$store.ui.theme==='dark' ? 'fa-sun' : 'fa-moon'"></i>
      </button>
      <div class="relative">
        <button class="icon-btn" data-tip="Notifications" @click.stop="notif=!notif; avatarMenu=false; seen()" aria-label="Notifications">
          <i class="fa-regular fa-bell text-lg"></i>
          <span class="badge" x-show="unseen>0" x-text="unseen" x-cloak></span>
        </button>
        <div class="dropdown" x-show="notif" x-cloak x-transition @click.outside="notif=false">
          <div class="flex items-center justify-between px-4 py-3 border-b border-yt-line"><b class="text-base">Notifications</b><a href="downloads.html" class="text-yt-blue text-sm">All releases</a></div>
          <div class="max-h-[60vh] overflow-y-auto">
            <template x-for="r in $store.rel.list.slice(0,6)" :key="r.tag">
              <a :href="'downloads.html#'+r.tag" class="flex gap-3 p-3 hover:bg-yt-hover items-center">
                <span class="w-2 h-2 rounded-full bg-yt-blue flex-none"></span>
                <span class="thumb block w-[86px] flex-none !rounded-md flex items-center justify-center" :style="r.style"><span class="ver text-white text-[13px]" x-text="r.ver"></span></span>
                <span class="text-sm leading-snug"><b x-text="r.title"></b> was uploaded<br><span class="text-yt-muted text-xs" x-text="MX.ago(r.date)+' · '+MX.num(r.views)+' downloads'"></span></span>
              </a>
            </template>
          </div>
        </div>
      </div>
      <div class="relative">
        <button class="icon-btn !w-9 !h-9" data-tip="Svznify" @click.stop="avatarMenu=!avatarMenu; notif=false" aria-label="Account menu">
          <img src="${MX.avatar}" alt="" class="w-8 h-8 rounded-full" referrerpolicy="no-referrer">
        </button>
        <div class="dropdown !w-[300px]" x-show="avatarMenu" x-cloak x-transition @click.outside="avatarMenu=false">
          <div class="flex gap-3 p-4 border-b border-yt-line items-center">
            <img src="${MX.avatar}" class="w-10 h-10 rounded-full" alt="" referrerpolicy="no-referrer">
            <div><b>Svznify</b> <i class="fa-solid fa-circle-check text-yt-muted text-xs"></i><div class="text-sm text-yt-muted">@Svznify · MorpheX maintainer</div></div>
          </div>
          <div class="py-2 text-sm">
            <a class="sb-item" href="${MX.links.repo}" target="_blank" rel="noopener"><i class="ico fa-brands fa-github"></i>Your channel (GitHub repo)</a>
            <a class="sb-item" href="${MX.links.issues}" target="_blank" rel="noopener"><i class="ico fa-regular fa-comment-dots"></i>Send feedback</a>
            <button class="sb-item w-full text-left" @click="MX.legal()"><i class="ico fa-solid fa-scale-balanced"></i>Legal notice</button>
            <button class="sb-item w-full text-left" @click="MX.shortcuts()"><i class="ico fa-regular fa-keyboard"></i>Keyboard shortcuts</button>
            <button class="sb-item w-full text-left" @click="$store.ui.toggleTheme()"><i class="ico fa-solid fa-circle-half-stroke"></i>Appearance: <span x-text="$store.ui.theme==='dark' ? 'Dark' : 'Light'" class="ml-auto text-yt-muted"></span></button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <div id="sb-backdrop" x-data @click="MX.sb.close()"></div>
  <aside id="sidebar" aria-label="Guide" x-data>
    ${nav('index.html', 'fa-solid fa-house', 'Home', 'home')}
    ${nav('index.html#shorts', 'fa-solid fa-bolt', 'Shorts', 'shorts')}
    ${nav('downloads.html', 'fa-solid fa-circle-play', 'Downloads', 'downloads', '<span class="badge-new sb-full-only ml-auto">APK</span>')}
    ${nav('downloads.html#microg', 'fa-solid fa-layer-group', 'MicroG', 'microg')}
    <div class="sb-sep sb-full-only"></div>
    <div class="sb-h sb-full-only">You <i class="fa-solid fa-chevron-right text-xs"></i></div>
    <a href="index.html#install" class="sb-item sb-full-only"><i class="ico fa-solid fa-list-check"></i>Install playlist</a>
    <a href="index.html#settings" class="sb-item sb-full-only"><i class="ico fa-solid fa-sliders"></i>Import settings</a>
    <a href="index.html#comments" class="sb-item sb-full-only"><i class="ico fa-regular fa-comment"></i>Troubleshooting</a>
    <a href="index.html#credits" class="sb-item sb-full-only"><i class="ico fa-solid fa-heart"></i>Credits</a>
    <div class="sb-sep sb-full-only"></div>
    <div class="sb-h sb-full-only">Subscriptions</div>
    ${chan(MX.links.site, 'linear-gradient(135deg,#ff0033,#7a2cff)', 'fa-solid fa-m', 'Morphe')}
    ${chan(MX.links.docs, '#2d7d46', 'fa-solid fa-book', 'Morphe Docs')}
    ${chan(MX.links.microgReleases, '#0a84ff', 'fa-solid fa-g', 'MicroG-RE')}
    ${chan(MX.links.telegram, '#229ed9', 'fa-brands fa-telegram', 'MorpheX Telegram', '<span class="live-dot"></span>')}
    ${chan(MX.links.discord, '#5865f2', 'fa-brands fa-discord', 'Morphe Discord')}
    ${chan(MX.links.reddit, '#ff4500', 'fa-brands fa-reddit-alien', 'r/MorpheApp')}
    ${chan(MX.links.x, '#000', 'fa-brands fa-x-twitter', '@MorpheApp')}
    <div class="sb-sep sb-full-only"></div>
    <div class="sb-h sb-full-only">Explore</div>
    <a href="${MX.links.releases}" target="_blank" rel="noopener" class="sb-item sb-full-only"><i class="ico fa-solid fa-tag"></i>All releases</a>
    <a href="${MX.links.repo}" target="_blank" rel="noopener" class="sb-item sb-full-only"><i class="ico fa-brands fa-github"></i>Source</a>
    <a href="${MX.links.issues}" target="_blank" rel="noopener" class="sb-item sb-full-only"><i class="ico fa-solid fa-bug"></i>Report an issue</a>
    <a href="${MX.links.translate}" target="_blank" rel="noopener" class="sb-item sb-full-only"><i class="ico fa-solid fa-language"></i>Translations</a>
    <div class="sb-sep sb-full-only"></div>
    <p class="sb-full-only px-3 text-xs text-yt-muted leading-relaxed">
      Unofficial. Not affiliated with or endorsed by Morphe.<br>
      <button class="underline mt-1" onclick="MX.legal()">Legal notice</button><br><br>© <span id="yr"></span> MorpheX community
    </p>
  </aside>`;

  const footer = () => `
  <footer class="px-6 py-10 mt-10 border-t border-yt-line text-sm text-yt-muted">
    <div class="flex flex-wrap gap-x-6 gap-y-2 font-medium text-yt-text">
      <a href="${MX.links.repo}#readme" target="_blank" rel="noopener">About</a>
      <a href="${MX.links.releases}" target="_blank" rel="noopener">Releases</a>
      <a href="${MX.links.issues}" target="_blank" rel="noopener">Support</a>
      <a href="${MX.links.site}" target="_blank" rel="noopener">Morphe</a>
      <a href="${MX.links.docs}" target="_blank" rel="noopener">Documentation</a>
      <a href="${MX.links.telegram}" target="_blank" rel="noopener">Telegram</a>
      <button onclick="MX.legal()">Legal</button>
      <button onclick="MX.shortcuts()">Shortcuts</button>
    </div>
    <p class="mt-4 max-w-3xl leading-relaxed">MorpheX is a community distribution of pre-built APKs made with public upstream tools. It is <b>not affiliated with or endorsed by Morphe</b>, and this page is not affiliated with YouTube - it just borrows the vibe. This project does not host proprietary content.</p>
    <p class="mt-2">Download counts, sizes and dates come straight from the <a class="underline" href="${MX.links.releases}" target="_blank" rel="noopener">GitHub releases</a> of this repository.</p>
  </footer>`;


  const siteNav = () => `
  <header id="sitenav" x-data="sitenav()" @scroll.window="scrolled = window.scrollY > 12" :class="scrolled && 'scrolled'" @keydown.escape.window="open=false">
    <div class="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center gap-4">
      <a href="index.html" class="flex items-center gap-1.5 flex-none" aria-label="MorpheX home">
        <span class="logo-mark"><i class="fa-solid fa-play"></i></span>
        <span class="logo-word">Morphe<b>X</b></span>
      </a>
      <nav class="hidden lg:flex items-center gap-1 ml-6" aria-label="Main">
        <a class="navlink" href="index.html#features">Features</a>
        <a class="navlink" href="index.html#customize">Customize</a>
        <a class="navlink" href="index.html#install">Install</a>
        <a class="navlink" href="index.html#story">Story</a>
        <a class="navlink" href="index.html#faq">FAQ</a>
        <a class="navlink ${page() === 'downloads' ? 'active' : ''}" href="downloads.html">Downloads</a>
      </nav>
      <div class="ml-auto flex items-center gap-2">
        <a href="${MX.links.repo}" target="_blank" rel="noopener" class="pill-btn hidden sm:inline-flex" data-tip="Star MorpheX on GitHub"><i class="fa-brands fa-github"></i> <span x-text="MX.num($store.rel.repo.stars)"></span> <i class="fa-solid fa-star text-yellow-400 text-xs"></i></a>
        <button class="icon-btn" :data-tip="$store.ui.theme==='dark' ? 'Light theme (t)' : 'Dark theme (t)'" @click="$store.ui.toggleTheme()" aria-label="Toggle theme"><i class="fa-solid" :class="$store.ui.theme==='dark' ? 'fa-sun' : 'fa-moon'"></i></button>
        <a href="downloads.html" class="pill-btn red hidden sm:inline-flex"><i class="fa-solid fa-download"></i> Download</a>
        <button class="icon-btn lg:hidden" @click="open=!open" aria-label="Menu" :aria-expanded="open"><i class="fa-solid" :class="open ? 'fa-xmark' : 'fa-bars'"></i></button>
      </div>
    </div>
    <div class="lg:hidden mnav" x-show="open" x-cloak x-transition @click="open=false">
      <a href="index.html#features">Features</a><a href="index.html#customize">Customize</a><a href="index.html#install">Install</a>
      <a href="index.html#story">Story</a><a href="index.html#faq">FAQ</a><a href="downloads.html">Downloads</a>
      <a href="downloads.html" class="pill-btn red justify-center mt-2"><i class="fa-solid fa-download"></i> Download the APK</a>
    </div>
  </header>`;

  const siteFooter = () => `
  <footer class="border-t border-yt-line mt-24 bg-yt-bg2">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <a href="index.html" class="flex items-center gap-1.5"><span class="logo-mark"><i class="fa-solid fa-play"></i></span><span class="logo-word">Morphe<b>X</b></span></a>
        <p class="text-sm text-yt-muted mt-4 max-w-xs leading-relaxed">Pre-built YouTube Morphe APKs - the community continuation of RVX (ReVanced Extended).</p>
        <div class="flex gap-2 mt-5">
          <a class="icon-btn bg-yt-surface" href="${MX.links.repo}" target="_blank" rel="noopener" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>
          <a class="icon-btn bg-yt-surface" href="${MX.links.telegram}" target="_blank" rel="noopener" aria-label="Telegram"><i class="fa-brands fa-telegram"></i></a>
          <a class="icon-btn bg-yt-surface" href="${MX.links.discord}" target="_blank" rel="noopener" aria-label="Discord"><i class="fa-brands fa-discord"></i></a>
          <a class="icon-btn bg-yt-surface" href="${MX.links.reddit}" target="_blank" rel="noopener" aria-label="Reddit"><i class="fa-brands fa-reddit-alien"></i></a>
          <a class="icon-btn bg-yt-surface" href="${MX.links.x}" target="_blank" rel="noopener" aria-label="X"><i class="fa-brands fa-x-twitter"></i></a>
        </div>
      </div>
      <div class="text-sm"><b class="block mb-3">Product</b><div class="flex flex-col gap-2 text-yt-muted">
        <a href="index.html#features">Features</a><a href="index.html#customize">Customize</a><a href="index.html#install">Install guide</a><a href="downloads.html">Downloads</a></div></div>
      <div class="text-sm"><b class="block mb-3">Project</b><div class="flex flex-col gap-2 text-yt-muted">
        <a href="index.html#story">Story</a><a href="index.html#faq">FAQ</a><a href="${MX.links.releases}" target="_blank" rel="noopener">GitHub releases</a><a href="${MX.links.issues}" target="_blank" rel="noopener">Report an issue</a></div></div>
      <div class="text-sm"><b class="block mb-3">Upstream</b><div class="flex flex-col gap-2 text-yt-muted">
        <a href="${MX.links.site}" target="_blank" rel="noopener">Morphe</a><a href="${MX.links.docs}" target="_blank" rel="noopener">Documentation</a><a href="${MX.links.microgReleases}" target="_blank" rel="noopener">MicroG-RE</a><a href="${MX.links.translate}" target="_blank" rel="noopener">Translations</a></div></div>
    </div>
    <div class="border-t border-yt-line">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs text-yt-muted leading-relaxed">
        <b class="text-yt-text">Unofficial distribution.</b> MorpheX is not affiliated with or endorsed by Morphe, and is not affiliated with YouTube or Google. All credits belong to their respective developers.
        This project distributes pre-built APKs made with publicly available upstream tools and does not host proprietary content.
        <button class="underline ml-1" onclick="MX.legal()">Legal notice</button>
        <div class="mt-2">© <span id="yr"></span> MorpheX community · Release data mirrored from GitHub.</div>
      </div>
    </div>
  </footer>`;

  const mount = () => {
    document.body.insertAdjacentHTML('afterbegin', SITE ? siteNav() : shell());
    const slot = document.getElementById('footer-slot');
    if (slot) slot.outerHTML = SITE ? siteFooter() : footer();
    const yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  };
  // Scripts are `defer`red so the DOM is already parsed here.
  mount();

  /* ---------- Alpine wiring ---------- */
  document.addEventListener('alpine:init', () => {
    const snap = window.MORPHEX_SNAPSHOT;

    Alpine.store('ui', {
      theme: document.documentElement.dataset.theme || 'dark',
      toggleTheme() { this.theme = this.theme === 'dark' ? 'light' : 'dark'; MX.setTheme(this.theme); window.dispatchEvent(new CustomEvent('mx-theme')); },
      sbClose() { MX.sb.close(); },
    });

    Alpine.store('rel', {
      list: snap.releases.map(MX.enrich).sort((a, b) => b.ts - a.ts),
      repo: { ...snap.repo },
      settings: snap.settings,
      live: false,
      state: 'snapshot', // snapshot -> loading -> live | offline
      get latest() { return this.list.find((r) => !r.pre) || this.list[0]; },
      get totalViews() { return this.list.reduce((n, r) => n + r.views, 0); },
      get totalAssets() { return this.list.reduce((n, r) => n + r.assets.length, 0); },
      get morphe() { return this.list.filter((r) => r.era === 'morphe'); },
      byTag(t) { return this.list.find((r) => r.tag === t); },
      async init() {
        const cached = MX.store.get('mx-live', null);
        if (cached && Date.now() - cached.t < 10 * 60 * 1000) { this.apply(cached); return; }
        this.state = 'loading';
        try {
          const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 8000);
          const [rr, rp] = await Promise.all([
            fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, { signal: ctl.signal, headers: { Accept: 'application/vnd.github+json' } }),
            fetch(`https://api.github.com/repos/${REPO}`, { signal: ctl.signal, headers: { Accept: 'application/vnd.github+json' } }),
          ]);
          clearTimeout(to);
          if (!rr.ok || !rp.ok) throw new Error('GitHub API ' + rr.status + '/' + rp.status);
          const rels = MX.normalizeApi(await rr.json()); const rep = await rp.json();
          const payload = { t: Date.now(), releases: rels, repo: { stars: rep.stargazers_count, forks: rep.forks_count, issues: rep.open_issues_count } };
          MX.store.set('mx-live', payload);
          this.apply(payload);
        } catch (e) { this.state = 'offline'; }
      },
      apply(p) {
        if (p.releases && p.releases.length) this.list = p.releases.map(MX.enrich).sort((a, b) => b.ts - a.ts);
        if (p.repo) this.repo = p.repo;
        this.live = true; this.state = 'live';
      },
    });

    Alpine.data('sitenav', () => ({ scrolled: false, open: false }));

    Alpine.data('topbar', () => ({
      q: '', focus: false, idx: -1, notif: false, avatarMenu: false, listening: false, mobileSearch: false,
      lastSeen: MX.store.get('mx-seen', null),
      get unseen() {
        const list = Alpine.store('rel').list;
        if (this.lastSeen === null) return Math.min(3, list.length);
        return list.filter((r) => r.ts > this.lastSeen).length;
      },
      seen() { const l = Alpine.store('rel').list; if (l[0]) { this.lastSeen = l[0].ts; MX.store.set('mx-seen', l[0].ts); } },
      get suggestions() {
        const rel = Alpine.store('rel').list;
        const base = [
          { t: 'download latest MorpheX APK', u: 'downloads.html', i: 'fa-download' },
          { t: 'MicroG for non-root users', u: 'downloads.html#microg', i: 'fa-layer-group' },
          { t: 'install guide', u: 'index.html#install', i: 'fa-list-check' },
          { t: 'import settings for the best experience', u: 'index.html#settings', i: 'fa-sliders' },
          { t: 'SponsorBlock', u: 'index.html#shorts', i: 'fa-forward-fast' },
          { t: 'picture-in-picture', u: 'index.html#shorts', i: 'fa-clone' },
          { t: 'material you', u: 'index.html#shorts', i: 'fa-palette' },
          { t: 'app won’t open / troubleshooting', u: 'index.html#comments', i: 'fa-life-ring' },
          { t: 'credits', u: 'index.html#credits', i: 'fa-heart' },
          ...rel.slice(0, 12).map((r) => ({ t: `${r.title}`, u: `downloads.html#${r.tag}`, i: 'fa-clock-rotate-left' })),
        ];
        const q = this.q.trim().toLowerCase();
        return (q ? base.filter((s) => s.t.toLowerCase().includes(q)) : base.slice(0, 6)).slice(0, 8);
      },
      move(d) { const n = this.suggestions.length; if (!n) return; this.idx = (this.idx + d + n + 1) % (n + 1) - 1; if (this.idx >= 0) this.q = this.suggestions[this.idx].t; },
      submit() {
        const q = this.q.trim(); if (!q) return;
        const hit = this.suggestions.find((s) => s.t.toLowerCase() === q.toLowerCase());
        location.href = hit ? hit.u : 'downloads.html?q=' + encodeURIComponent(q);
      },
      close() { this.focus = false; this.notif = false; this.avatarMenu = false; },
      voice() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return MX.toast('Voice search isn’t supported in this browser', 'fa-microphone-slash');
        const r = new SR(); r.lang = 'en-US'; this.listening = true;
        r.onresult = (e) => { this.q = e.results[0][0].transcript; this.submit(); };
        r.onend = r.onerror = () => { this.listening = false; };
        try { r.start(); } catch (e) { this.listening = false; }
      },
    }));

    /* x-countup="number" — animated counters via CountUp.js */
    Alpine.directive('countup', (el, { expression }, { evaluate, effect }) => {
      effect(() => {
        const v = Number(evaluate(expression)) || 0;
        if (!window.countUp) { el.textContent = MX.numFull(v); return; }
        if (el._cu) el._cu.update(v);
        else { el._cu = new countUp.CountUp(el, v, { duration: 1.8, separator: ',' }); el._cu.start(); }
      });
    });
  });

  /* ---------- tooltips, keyboard, first-run snack ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    if (window.tippy) tippy.delegate(document.body, { target: '[data-tip]', content: (el) => el.dataset.tip, theme: 'yt', delay: [400, 0], animation: 'scale', touch: false });
  });

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const el = document.activeElement; if (el && /^(input|textarea|select)$/i.test(el.tagName)) return;
    const k = e.key;
    if (k === '/') { e.preventDefault(); const q = document.getElementById('q'); if (q) { q.focus(); q.select(); } }
    else if (k === 't') Alpine.store('ui').toggleTheme();
    else if (k === 'm') MX.sb.toggle();
    else if (k === 'h') MX.go('index.html');
    else if (k === 'd') MX.go('downloads.html');
    else if (k === '?') MX.shortcuts();
  });

  window.addEventListener('resize', () => {
    if (SITE) return;
    const d = document.documentElement.dataset;
    if (mobile() && d.sb === 'mini') d.sb = 'hidden';
    if (!mobile() && d.sb === 'hidden') d.sb = MX.store.get('mx-sb', 'full');
  });
})();
