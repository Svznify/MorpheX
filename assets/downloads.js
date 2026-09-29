/* ==========================================================================
   MorpheX — downloads page (Alpine.js component `dl`).
   Mirrors https://github.com/Svznify/MorpheX/releases : every release, every
   asset, direct download links, live counts. Chart.js powers the Studio tab.
   ========================================================================== */
document.addEventListener('alpine:init', () => {
  const ERA_COLOR = { morphe: '#ff2d55', rvx: '#3ea6ff', revanced: '#2ecc9a' };
  const TABS = ['videos', 'playlists', 'studio', 'microg', 'community', 'about'];

  Alpine.data('dl', () => {
    let barChart = null, doughnut = null;

    return {
      tabs: [
        { id: 'videos', t: 'Videos', i: 'fa-circle-play' },
        { id: 'playlists', t: 'Playlists', i: 'fa-layer-group' },
        { id: 'studio', t: 'Studio', i: 'fa-chart-simple' },
        { id: 'microg', t: 'MicroG', i: 'fa-puzzle-piece' },
        { id: 'community', t: 'Community', i: 'fa-users' },
        { id: 'about', t: 'About', i: 'fa-circle-info' },
      ],
      tab: 'videos',
      q: '', era: 'all', sort: 'new', view: MX.store.get('mx-view', 'grid'), show: 12, hl: '',
      eras: [
        { id: 'all', t: 'All' }, { id: 'morphe', t: 'Morphe' }, { id: 'rvx', t: 'RVX' },
        { id: 'revanced', t: 'ReVanced' }, { id: 'txt', t: 'Has settings file' },
      ],

      get filtered() {
        const q = this.q.trim().toLowerCase();
        let l = Alpine.store('rel').list.filter((r) => {
          if (this.era === 'txt' ? !r.assets.some((a) => !a.apk) : this.era !== 'all' && r.era !== this.era) return false;
          if (!q) return true;
          return [r.title, r.tag, r.ver, r.patch || '', r.eraName, ...r.assets.map((a) => a.n)].join(' ').toLowerCase().includes(q);
        });
        const by = {
          new: (a, b) => b.ts - a.ts, old: (a, b) => a.ts - b.ts,
          popular: (a, b) => b.views - a.views, size: (a, b) => b.totalSize - a.totalSize,
        }[this.sort];
        return [...l].sort(by);
      },
      get isDefault() { return !this.q && this.era === 'all' && this.sort === 'new'; },
      count(id) {
        const l = Alpine.store('rel').list;
        return id === 'all' ? l.length : id === 'txt' ? l.filter((r) => r.assets.some((a) => !a.apk)).length : l.filter((r) => r.era === id).length;
      },
      eraStats(id) {
        const l = Alpine.store('rel').list.filter((r) => r.era === id);
        return { n: l.length, views: l.reduce((n, r) => n + r.views, 0), latest: l[0], oldest: l[l.length - 1] };
      },
      get since() { const l = Alpine.store('rel').list; return l.length ? l[l.length - 1].date : null; },

      setView(v) { this.view = v; MX.store.set('mx-view', v); },
      setTab(t) {
        this.tab = t;
        if (location.hash.slice(1) !== t && TABS.includes(t)) history.replaceState(null, '', '#' + t);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (t === 'studio') this.$nextTick(() => this.buildCharts());
      },
      openEra(id) { this.era = id; this.q = ''; this.sort = 'new'; this.show = 12; this.setTab('videos'); },
      reset() { this.q = ''; this.era = 'all'; this.sort = 'new'; },

      route() {
        const h = decodeURIComponent(location.hash.slice(1));
        const params = new URLSearchParams(location.search);
        if (params.get('q')) this.q = params.get('q');
        if (TABS.includes(h)) { this.tab = h; if (h === 'studio') this.$nextTick(() => this.buildCharts()); return; }
        if (h) this.focusRelease(h);
      },
      focusRelease(tag) {
        const idx = this.filtered.findIndex((r) => r.tag === tag);
        if (idx < 0) { this.reset(); }
        this.tab = 'videos';
        const i2 = this.filtered.findIndex((r) => r.tag === tag);
        if (i2 >= this.show) this.show = i2 + 1;
        this.hl = tag;
        this.$nextTick(() => setTimeout(() => {
          const el = document.querySelector(`[data-tag="${CSS.escape(tag)}"]`);
          if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 3400); }
        }, 250));
      },

      subscribe() {
        window.open(MX.links.repo, '_blank', 'noopener');
        MX.confetti({ origin: { y: 0.35 } });
        MX.toast('Star the repo, then Watch → Custom → Releases to get notified.', 'fa-bell');
      },
      refreshing: false,
      async refresh() {
        this.refreshing = true; try { localStorage.removeItem('mx-live'); } catch (e) { /* ignore */ }
        await Alpine.store('rel').init(); this.refreshing = false;
        MX.toast(Alpine.store('rel').live ? 'Fresh from GitHub' : 'GitHub API unavailable - showing the saved snapshot', Alpine.store('rel').live ? 'fa-rotate' : 'fa-cloud-slash');
      },

      /* ---------- Studio (Chart.js) ---------- */
      buildCharts() {
        if (!window.Chart || !this.$refs.bar) return;
        const css = getComputedStyle(document.documentElement);
        const muted = css.getPropertyValue('--muted').trim(), line = css.getPropertyValue('--line').trim(), text = css.getPropertyValue('--text').trim();
        const asc = [...Alpine.store('rel').list].sort((a, b) => a.ts - b.ts);
        if (barChart) barChart.destroy(); if (doughnut) doughnut.destroy();
        Chart.defaults.font.family = 'Roboto, Arial, sans-serif';
        barChart = new Chart(this.$refs.bar, {
          type: 'bar',
          data: {
            labels: asc.map((r) => r.ver + (r.patch ? ' · p' + r.patch : '')),
            datasets: [{ label: 'APK downloads', data: asc.map((r) => r.views), backgroundColor: asc.map((r) => ERA_COLOR[r.era]), borderRadius: 4, maxBarThickness: 34 }],
          },
          options: {
            responsive: true, maintainAspectRatio: false, animation: { duration: 900 },
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { title: (i) => asc[i[0].dataIndex].title, afterTitle: (i) => MX.date(asc[i[0].dataIndex].date), label: (c) => ' ' + MX.numFull(c.parsed.y) + ' downloads' } },
            },
            onClick: (e, els) => { if (els.length) this.focusRelease(asc[els[0].index].tag); },
            scales: { x: { ticks: { color: muted, maxRotation: 70, font: { size: 10 } }, grid: { display: false } }, y: { ticks: { color: muted }, grid: { color: line } } },
          },
        });
        const ids = ['morphe', 'rvx', 'revanced'];
        doughnut = new Chart(this.$refs.pie, {
          type: 'doughnut',
          data: { labels: ['Morphe', 'RVX', 'ReVanced'], datasets: [{ data: ids.map((id) => this.eraStats(id).views), backgroundColor: ids.map((id) => ERA_COLOR[id]), borderColor: css.getPropertyValue('--bg2').trim(), borderWidth: 3 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '64%', plugins: { legend: { position: 'bottom', labels: { color: text, usePointStyle: true, padding: 16 } }, tooltip: { callbacks: { label: (c) => ' ' + MX.numFull(c.parsed) + ' downloads' } } } },
        });
      },

      /* ---------- MicroG / community / about data ---------- */
      community: [
        { t: 'Telegram', d: 'Release pings & announcements', i: 'fa-brands fa-telegram', c: '#229ed9', u: MX.links.telegram },
        { t: 'Discord', d: 'Chat with the Morphe community', i: 'fa-brands fa-discord', c: '#5865f2', u: MX.links.discord },
        { t: 'Reddit', d: 'r/MorpheApp', i: 'fa-brands fa-reddit-alien', c: '#ff4500', u: MX.links.reddit },
        { t: 'X (Twitter)', d: '@MorpheApp', i: 'fa-brands fa-x-twitter', c: '#111', u: MX.links.x },
        { t: 'Morphe website', d: 'morphe.software', i: 'fa-solid fa-globe', c: '#7a2cff', u: MX.links.site },
        { t: 'Documentation', d: 'MorpheApp/morphe-documentation', i: 'fa-solid fa-book', c: '#2d7d46', u: MX.links.docs },
        { t: 'Translations', d: 'Help translate Morphe on Crowdin', i: 'fa-solid fa-language', c: '#2e3340', u: MX.links.translate },
        { t: 'GitHub Issues', d: 'Report a bug or ask a question', i: 'fa-solid fa-bug', c: '#e11d48', u: MX.links.issues },
      ],

      init() {
        this.route();
        window.addEventListener('hashchange', () => this.route());
        window.addEventListener('mx-theme', () => { if (this.tab === 'studio') this.buildCharts(); });
        // re-render charts when live data arrives
        this.$watch('$store.rel.live', () => { if (this.tab === 'studio') this.$nextTick(() => this.buildCharts()); });
        this.$watch('$store.rel.list', () => { if (location.hash && !TABS.includes(location.hash.slice(1))) this.focusRelease(decodeURIComponent(location.hash.slice(1))); });
      },
    };
  });
});
