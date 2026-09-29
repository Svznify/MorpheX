/* ==========================================================================
   MorpheX — home page behaviour (Alpine.js component `home`).
   Swiper drives the player + Shorts carousels; Typed.js the title; the rest is
   plain reactive state.
   ========================================================================== */
document.addEventListener('alpine:init', () => {
  const SLIDE_MS = 4000;

  Alpine.data('home', () => {
    let sw = null;        // player Swiper instance (kept out of Alpine's proxy)
    let adTimer = null;
    let chatTimer = null;

    return {
      /* ---------- chip bar / scroll-spy ---------- */
      sections: [
        { id: 'watch', t: 'All', i: 'fa-house' },
        { id: 'shorts', t: 'Shorts', i: 'fa-bolt' },
        { id: 'recs', t: 'Recommended', i: 'fa-thumbs-up' },
        { id: 'install', t: 'Install playlist', i: 'fa-list-check' },
        { id: 'settings', t: 'Settings import', i: 'fa-sliders' },
        { id: 'comments', t: 'Comments', i: 'fa-comment' },
        { id: 'credits', t: 'Credits', i: 'fa-heart' },
      ],
      active: 'watch',
      jump(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); },

      /* ---------- player ---------- */
      slides: [
        { ico: 'fa-play', t: 'YouTube, but yours.', s: 'Pre-built Morphe APKs. Download. Install. Done.' },
        { ico: 'fa-ban', t: 'Ad-free playback', s: 'The ad you just skipped? It was the last one.' },
        { ico: 'fa-palette', t: 'Material You + PiP', s: 'Dynamic colours and picture-in-picture, built in.' },
        { ico: 'fa-forward-fast', t: 'SponsorBlock inside', s: 'Skip sponsor segments without leaving the app.' },
        { ico: 'fa-shield-halved', t: 'No root required', s: 'Just add MicroG for sign-in and playback.' },
      ],
      idx: 0, progress: 0, paused: true, adActive: true, adLeft: 5, muted: false, fs: false, autoplay: true,
      get canSkip() { return this.adLeft <= 3; },
      get total() { return this.slides.length * (SLIDE_MS / 1000); },
      get cur() { return Math.floor(this.progress * this.total); },
      mmss(s) { return `0:${String(s).padStart(2, '0')}`; },

      initPlayer() {
        sw = new Swiper(this.$refs.swiper, {
          effect: 'fade', fadeEffect: { crossFade: true }, speed: 700, rewind: true,
          autoplay: { delay: SLIDE_MS, disableOnInteraction: false },
          on: {
            autoplayTimeLeft: (s, ms, p) => { this.progress = (s.activeIndex + (1 - p)) / this.slides.length; },
            slideChange: (s) => { this.idx = s.activeIndex; if (this.paused) this.progress = s.activeIndex / this.slides.length; },
          },
        });
        sw.autoplay.stop();
        // the (joke) pre-roll
        adTimer = setInterval(() => { if (--this.adLeft <= 0) this.skipAd(true); }, 1000);
        document.addEventListener('fullscreenchange', () => { this.fs = !!document.fullscreenElement; });
        if (window.Typed) new Typed(this.$refs.typed, {
          strings: ['YouTube, but yours.', 'Ad-free. Customisable. Yours.', 'Pre-built. Just install.', 'MicroG + MorpheX = done.'],
          typeSpeed: 45, backSpeed: 22, backDelay: 1800, loop: true, showCursor: true,
        });
      },
      skipAd(auto = false) {
        clearInterval(adTimer); this.adActive = false;
        if (!auto) MX.toast('Ad skipped. MorpheX has no ads - that was the only one.', 'fa-forward');
        if (this.autoplay) { this.paused = false; sw.autoplay.start(); }
      },
      togglePlay() {
        if (this.adActive) return;
        this.paused = !this.paused;
        this.paused ? sw.autoplay.stop() : sw.autoplay.start();
      },
      next() { if (!this.adActive) sw.slideNext(); },
      seek(e) {
        const r = e.currentTarget.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        sw.slideTo(Math.min(this.slides.length - 1, Math.floor(ratio * this.slides.length)));
        this.progress = ratio;
      },
      fullscreen() {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (this.$refs.player.requestFullscreen) this.$refs.player.requestFullscreen();
      },
      setAutoplay() {
        this.autoplay = !this.autoplay;
        if (this.adActive) return;
        if (this.autoplay === this.paused) this.togglePlay();
      },
      bigPlay() { MX.confetti({ origin: { y: 0.4 } }); MX.askDownload(Alpine.store('rel').latest); },

      /* ---------- mini player ---------- */
      mini: false, miniOff: false,
      watchPlayer() {
        new IntersectionObserver(([e]) => { this.mini = !e.isIntersecting && e.boundingClientRect.top < 0; }, { threshold: 0.05 }).observe(this.$refs.player);
      },

      /* ---------- scroll spy ---------- */
      spy() {
        const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) this.active = e.target.id; }), { rootMargin: '-35% 0px -60% 0px' });
        this.sections.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
      },

      /* ---------- channel row ---------- */
      subbed: MX.store.get('mx-subbed', false),
      subscribe() {
        this.subbed = !this.subbed; MX.store.set('mx-subbed', this.subbed);
        if (this.subbed) { MX.confetti({ origin: { y: 0.3 } }); MX.toast('Subscribed! On GitHub, choose Watch → Custom → Releases for real notifications.', 'fa-bell'); window.open(MX.links.repo, '_blank', 'noopener'); }
      },
      dislike() { MX.toast('Noted. Tell us what’s wrong via GitHub Issues.', 'fa-thumbs-down'); },
      async share() {
        const data = { title: 'MorpheX - YouTube Morphe APKs', url: location.href.split('#')[0] };
        if (navigator.share) { try { await navigator.share(data); return; } catch (e) { /* cancelled */ } }
        MX.copy(data.url, 'Link copied');
      },
      menu: false,

      /* ---------- description ---------- */
      descOpen: false,
      chapters: [
        { t: '0:00', l: 'About MorpheX', id: 'watch' },
        { t: '0:20', l: 'Features (Shorts)', id: 'shorts' },
        { t: '0:45', l: 'Recommended downloads', id: 'recs' },
        { t: '1:10', l: 'Install playlist', id: 'install' },
        { t: '1:40', l: 'Import my settings', id: 'settings' },
        { t: '2:05', l: 'Troubleshooting (comments)', id: 'comments' },
        { t: '2:30', l: 'Credits', id: 'credits' },
      ],

      /* ---------- live chat (replay of real project facts) ---------- */
      chat: [], chatN: 0,
      startChat() {
        const st = () => Alpine.store('rel');
        const pool = [
          () => ({ u: 'MorpheX-bot', c: 'mod', t: `Latest: ${st().latest.title} · ${st().latest.patch ? 'patches v' + st().latest.patch + ' · ' : ''}${MX.size(st().latest.primary.s)}` }),
          () => ({ u: 'MicroG-tip', c: '', t: 'Non-root? Install MicroG first - MicroG-RE 6.1.1 fixes Google sign-in issues.' }),
          () => ({ u: 'MorpheX-bot', c: 'mod', t: 'Found a bug? Open an issue on GitHub with your app version, device and Android version.' }),
          () => ({ u: 'settings-tip', c: '', t: 'Morphe Settings → Miscellaneous → Import/Export Settings → paste → Import.' }),
          () => ({ u: 'MorpheX-bot', c: 'mod', t: `${MX.numFull(st().totalViews)} total downloads across ${st().list.length} releases 🚀` }),
          () => ({ u: 'sb-tip', c: '', t: 'SponsorBlock ships with manual-skip defaults for sponsor, preview and filler segments.' }),
          () => ({ u: 'help-tip', c: '', t: 'Videos won’t play? Check your network, clear app data and retry.' }),
          () => ({ u: 'dl-tip', c: '', t: 'Need to save videos? Use Seal, NewPipe or yt-dlp.' }),
          () => ({ u: 'MorpheX-bot', c: 'mod', t: `⭐ ${MX.numFull(st().repo.stars)} stars · ${MX.numFull(st().repo.forks)} forks - star the repo to say thanks!` }),
          () => ({ u: 'MorpheX-bot', c: 'mod', t: 'Telegram has release pings: t.me/rvb27/1610' }),
        ];
        const add = () => {
          const m = pool[this.chatN++ % pool.length]();
          this.chat.push({ ...m, k: this.chatN, bg: ['#e11d48', '#7c3aed', '#0891b2', '#16a34a', '#d97706', '#db2777'][this.chatN % 6] });
          if (this.chat.length > 40) this.chat.shift();
          this.$nextTick(() => { const b = this.$refs.chat; if (b) b.scrollTop = b.scrollHeight; });
        };
        for (let i = 0; i < 4; i++) add();
        chatTimer = setInterval(() => { if (!document.hidden) add(); }, 2600);
      },

      /* ---------- up next ---------- */
      upFilter: 'all',
      get upNext() {
        let l = Alpine.store('rel').list;
        if (this.upFilter === 'morphe') l = l.filter((r) => r.era === 'morphe');
        else if (this.upFilter === 'popular') l = [...l].sort((a, b) => b.views - a.views);
        return l.slice(0, 9);
      },

      /* ---------- shorts ---------- */
      shorts: [
        { ico: 'fa-ban', t: 'Ad-free playback', d: 'No pre-roll, no mid-roll. Just the video.', g1: '#ff0033', g2: '#7a2cff', tag: 'Core' },
        { ico: 'fa-palette', t: 'Material You', d: 'Your wallpaper colours, all over the app.', g1: '#f6a800', g2: '#e11d48', tag: 'Look' },
        { ico: 'fa-clone', t: 'Picture-in-Picture', d: 'Keep watching while you do literally anything else.', g1: '#0a84ff', g2: '#3a0ca3', tag: 'Playback' },
        { ico: 'fa-forward-fast', t: 'SponsorBlock', d: 'Sponsor, preview, filler - skip them manually or automatically.', g1: '#00b894', g2: '#0b3d5c', tag: 'Playback' },
        { ico: 'fa-sliders', t: 'Advanced customisation', d: 'Hide Shorts, surveys, shelves, banners and a whole lot more.', g1: '#a855f7', g2: '#312e81', tag: 'Tweaks' },
        { ico: 'fa-hand-pointer', t: 'Swipe gestures', d: 'Swipe for brightness and volume, right in the player.', g1: '#06b6d4', g2: '#1e3a8a', tag: 'Gestures' },
        { ico: 'fa-signature', t: 'Custom branding', d: 'Pick your icon, name and header logo.', g1: '#f43f5e', g2: '#4c1d95', tag: 'Look' },
        { ico: 'fa-shield-halved', t: 'Works without root', d: 'Non-root? Install MicroG and you’re set.', g1: '#22c55e', g2: '#14532d', tag: 'Setup' },
      ],
      initShorts() {
        new Swiper(this.$refs.shorts, {
          slidesPerView: 1.7, spaceBetween: 14, grabCursor: true, freeMode: true,
          navigation: { nextEl: this.$refs.snext, prevEl: this.$refs.sprev },
          breakpoints: { 560: { slidesPerView: 2.6 }, 900: { slidesPerView: 3.6 }, 1200: { slidesPerView: 4.6 }, 1600: { slidesPerView: 6.2 } },
        });
      },

      /* ---------- recommended grid ---------- */
      recFilter: 'all', recCount: 12,
      get recs() {
        let l = Alpine.store('rel').list;
        if (['morphe', 'rvx', 'revanced'].includes(this.recFilter)) l = l.filter((r) => r.era === this.recFilter);
        else if (this.recFilter === 'popular') l = [...l].sort((a, b) => b.views - a.views);
        else if (this.recFilter === 'new') l = l.slice(0, 6);
        return l;
      },

      /* ---------- install playlist ---------- */
      steps: [
        { t: 'Download the APK from Releases', d: 'Grab the newest YouTube Morphe APK from the Downloads page.', a: { l: 'Open downloads', u: 'downloads.html' } },
        { t: 'Install MicroG (non-root users only)', d: 'MicroG-RE 6.1.1 fixes Google sign-in. Required for login and playback without root.', a: { l: 'Get MicroG 6.1.1', u: MX.microg } },
        { t: 'Install the MorpheX APK', d: 'Open the downloaded APK and allow installs from your browser or file manager when Android asks.' },
        { t: 'Sign in via MicroG', d: 'Open YouTube Morphe and sign in to your Google Account so you can view videos.' },
        { t: 'Optional: import my settings', d: 'Copy the settings text below, then import it inside the app.', a: { l: 'Jump to settings', u: '#settings' } },
      ],
      done: MX.store.get('mx-steps', []),
      toggleStep(i) {
        this.done = this.done.includes(i) ? this.done.filter((x) => x !== i) : [...this.done, i];
        MX.store.set('mx-steps', this.done);
        if (this.done.length === this.steps.length) { MX.confetti({ particleCount: 220, spread: 100 }); MX.toast('Playlist complete - enjoy YouTube Morphe!', 'fa-trophy'); }
      },
      get pct() { return Math.round((this.done.length / this.steps.length) * 100); },

      saveSettings() {
        const blob = new Blob([Alpine.store('rel').settings + '\n'], { type: 'text/plain' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'morphex-settings.txt';
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        MX.toast('Saved morphex-settings.txt', 'fa-file-arrow-down');
      },

      /* ---------- comments (FAQ) ---------- */
      newComment: '', composing: false, cSort: 'top', liked: {}, open: { 0: true },
      faqs: [
        { a: 'Every new user', c: '#e11d48', i: 'fa-user', pinned: true, ago: 'pinned', q: 'The app won’t open. Help?', r: 'Ensure <b>MicroG</b> is installed and signed in. That fixes it for most people.' },
        { a: 'Someone on non-root', c: '#0891b2', i: 'fa-mobile-screen', ago: 'FAQ', q: 'Do I need root?', r: 'Nope. It works <b>without root</b>, but non-root users need <b>MicroG</b> for login and playback to work.' },
        { a: 'Impatient viewer', c: '#7c3aed', i: 'fa-video-slash', ago: 'FAQ', q: 'Videos won’t play!', r: 'Check your network connection, then <b>clear app data</b> and retry.' },
        { a: 'Offline enthusiast', c: '#16a34a', i: 'fa-download', ago: 'FAQ', q: 'Where’s the download button on videos?', r: 'Downloads aren’t built in. Use third-party tools such as <b>Seal</b>, <b>NewPipe</b> or <b>yt-dlp</b>.' },
        { a: 'Curious lurker', c: '#d97706', i: 'fa-circle-question', ago: 'FAQ', q: 'Wait, is this official Morphe?', r: 'No - this repo is <b>not affiliated with or endorsed by Morphe</b>. It only distributes pre-built APKs made with public upstream tools. All credits belong to the original developers.' },
        { a: 'Long-time RVX fan', c: '#db2777', i: 'fa-clock-rotate-left', ago: 'FAQ', q: 'What happened to RVX?', r: 'MorpheX follows the transition from <b>RVX (ReVanced Extended)</b> after its discontinuation by inotia00, and now builds on <b>Morphe</b> for YouTube and YouTube Music.' },
        { a: 'Bug hunter', c: '#0a84ff', i: 'fa-bug', ago: 'FAQ', q: 'How do I get help?', r: 'Open an <b>issue</b> here, or ask in the official Morphe/community channels. Include your <b>app version</b>, <b>device model &amp; Android version</b>, and <b>logs</b> if you have them.' },
      ],
      get sortedFaqs() { return this.cSort === 'new' ? [...this.faqs].reverse() : this.faqs; },
      postComment() {
        const t = this.newComment.trim(); if (!t) return;
        window.open(`${MX.links.newIssue}?title=${encodeURIComponent('Question from the MorpheX site')}&body=${encodeURIComponent(t)}`, '_blank', 'noopener');
        MX.toast('Opening GitHub - comments live in Issues.', 'fa-comment-dots');
        this.newComment = ''; this.composing = false;
      },

      /* ---------- credits ---------- */
      credits: [
        { n: 'inotia00', r: 'ReVanced Extended (RVX)', c: '#0a84ff', i: 'fa-code-branch' },
        { n: 'Morphe Team', r: 'Morphe base & ecosystem', c: '#7a2cff', i: 'fa-m', u: MX.links.site },
        { n: 'ReVanced Team', r: 'Patches, tools & infrastructure', c: '#e11d48', i: 'fa-puzzle-piece' },
        { n: 'RVX-Builder', r: 'APK build tooling', c: '#16a34a', i: 'fa-hammer' },
        { n: 'Contributors', r: 'Open-source folks who file, fix & translate', c: '#d97706', i: 'fa-users' },
      ],

      /* ---------- snack ---------- */
      snack: !MX.store.get('mx-snack', false),
      closeSnack() { this.snack = false; MX.store.set('mx-snack', true); },

      init() {
        this.$nextTick(() => {
          this.initPlayer(); this.initShorts(); this.watchPlayer(); this.spy(); this.startChat();
          if (location.hash && document.querySelector(location.hash)) setTimeout(() => this.jump(location.hash.slice(1)), 300);
        });
        window.addEventListener('beforeunload', () => { clearInterval(chatTimer); clearInterval(adTimer); });
      },
    };
  });
});
