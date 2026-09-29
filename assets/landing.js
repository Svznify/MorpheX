/* ==========================================================================
   MorpheX — landing page behaviour (Alpine.js component `landing`).
   Copy is taken from the project README and release notes.
   ========================================================================== */
document.addEventListener('alpine:init', () => {
  Alpine.data('landing', () => ({
    /* ---------- features ---------- */
    features: [
      { i: 'fa-ban', t: 'Ad-free playback', d: 'Watch without pre-rolls, mid-rolls or banners. Just the video you came for.', g1: '#ff0033', g2: '#a1122f', glow: 'rgba(255,0,51,.2)' },
      { i: 'fa-palette', t: 'Material You', d: 'Dynamic colours that follow your wallpaper, so the app feels native to your phone.', g1: '#f6a800', g2: '#e11d48', glow: 'rgba(246,168,0,.2)' },
      { i: 'fa-clone', t: 'Picture-in-Picture', d: 'Keep the video floating while you reply to messages, browse or do literally anything else.', g1: '#0a84ff', g2: '#3a0ca3', glow: 'rgba(10,132,255,.2)' },
      { i: 'fa-forward-fast', t: 'SponsorBlock', d: 'Integrated segment skipping for sponsors, previews and filler - manual or automatic.', g1: '#00b894', g2: '#0b5d4a', glow: 'rgba(0,184,148,.2)' },
      { i: 'fa-sliders', t: 'Deep customisation', d: 'Hide Shorts, surveys, shelves, banners and dozens more interface elements. All in-app.', g1: '#a855f7', g2: '#4c1d95', glow: 'rgba(168,85,247,.22)' },
      { i: 'fa-shield-halved', t: 'No root required', d: 'Works on stock Android. Non-root users just add MicroG for sign-in and playback.', g1: '#22c55e', g2: '#14532d', glow: 'rgba(34,197,94,.2)' },
      { i: 'fa-hand-pointer', t: 'Swipe gestures', d: 'Slide along the player to change brightness and volume without opening any menus.', g1: '#06b6d4', g2: '#1e3a8a', glow: 'rgba(6,182,212,.2)' },
      { i: 'fa-music', t: 'YouTube Music too', d: 'Morphe’s patches cover both YouTube and YouTube Music, and MorpheX follows along.', g1: '#f43f5e', g2: '#4c1d95', glow: 'rgba(244,63,94,.2)' },
    ],
    marquee: ['Ad-free playback', 'Material You', 'Picture-in-Picture', 'SponsorBlock', 'Custom branding', 'Swipe gestures', 'No root needed', 'YouTube Music', 'Hide Shorts', 'Open source tooling'],

    /* ---------- interactive customise preview (illustration) ---------- */
    mode: 'morphex', // 'morphex' | 'stock'
    opts: [
      { k: 'hide_shorts_button', t: 'Hide Shorts button', d: 'Removes the Shorts tab from the bottom bar.', on: true },
      { k: 'hide_chips_shelf', t: 'Hide chips shelf', d: 'Clears the row of topic chips above your feed.', on: false },
      { k: 'hide_cast_button', t: 'Hide cast button', d: 'Tidies the top bar if you never cast.', on: false },
      { k: 'swap_create_with_notifications_button', t: 'Swap Create with Notifications', d: 'Puts the bell where the “+” button was.', on: false },
      { k: 'header_logo', t: 'Premium header logo', d: 'Choose the header logo style.', on: true, alt: '"premium"' },
      { k: 'swipe_brightness', t: 'Swipe for brightness', d: 'Drag on the player to adjust brightness.', on: true },
    ],
    get o() { return Object.fromEntries(this.opts.map((x) => [x.k, x.on])); },
    resetOpts() { this.opts.forEach((x) => { x.on = ['hide_shorts_button', 'header_logo', 'swipe_brightness'].includes(x.k); }); },
    allOn() { this.opts.forEach((x) => { x.on = true; }); },

    /* ---------- install steps ---------- */
    steps: [
      { i: 'fa-download', t: 'Download', d: 'Grab the latest YouTube Morphe APK from the downloads page.', cta: { l: 'Get the APK', u: 'downloads.html' } },
      { i: 'fa-puzzle-piece', t: 'Add MicroG', d: 'Non-root only. MicroG-RE 6.1.1 fixes Google sign-in issues.', cta: { l: 'MicroG 6.1.1', u: MX.microg } },
      { i: 'fa-mobile-screen-button', t: 'Install', d: 'Open the APK and allow installs from your browser or file manager when Android asks.' },
      { i: 'fa-right-to-bracket', t: 'Sign in', d: 'Open YouTube Morphe and sign in with your Google Account via MicroG. Done.' },
    ],

    /* ---------- story timeline (dates come from real releases) ---------- */
    eraInfo: [
      { id: 'revanced', t: 'ReVanced', d: 'The first builds: ReVanced CLI patches applied to YouTube and YouTube Music.' },
      { id: 'rvx', t: 'RVX - ReVanced Extended', d: 'Builds from inotia00’s ReVanced Extended, until its discontinuation.' },
      { id: 'morphe', t: 'Morphe', d: 'The community continuation: Morphe as the base, with community-supported patches and tooling.' },
    ],
    eraFirst(id) { const l = Alpine.store('rel').list.filter((r) => r.era === id); return l.length ? l[l.length - 1].date : null; },
    eraCount(id) { return Alpine.store('rel').list.filter((r) => r.era === id).length; },

    /* ---------- FAQ ---------- */
    openFaq: 0,
    faqs: [
      { q: 'Is MorpheX official?', a: 'No. This project is <b>not affiliated with or endorsed by Morphe</b> (or by YouTube/Google). It only distributes pre-built APKs generated with publicly available, upstream tools. All credits belong to their respective developers.' },
      { q: 'Do I need root?', a: 'No. MorpheX works without root, but non-root users need <b>MicroG</b> installed for sign-in and playback to work.' },
      { q: 'What happened to RVX?', a: 'MorpheX follows the transition from <b>RVX (ReVanced Extended)</b> after its discontinuation by inotia00. It now builds on <b>Morphe</b>, continuing with community-supported patches and tooling for YouTube and YouTube Music.' },
      { q: 'The app won’t open. What do I do?', a: 'Make sure <b>MicroG is installed and signed in</b>. That resolves it for most people.' },
      { q: 'Videos won’t play.', a: 'Check your network connection, then <b>clear the app’s data</b> and try again.' },
      { q: 'Where is the download button for videos?', a: 'Video downloading isn’t built in. Use third-party tools such as <b>Seal</b>, <b>NewPipe</b> or <b>yt-dlp</b>.' },
      { q: 'How do I get help or report a bug?', a: 'Open an <b>issue</b> on GitHub or ask in the official Morphe / community channels. Include your <b>app version</b>, <b>device model &amp; Android version</b>, and <b>logs</b> if you have them.' },
    ],

    /* ---------- settings import ---------- */
    copySettings() { MX.copy(Alpine.store('rel').settings, 'Settings copied - paste them in the app'); MX.confetti({ particleCount: 60, origin: { y: 0.8 } }); },
    settingsOpen: false,

    init() {
      if (window.Typed) new Typed(this.$refs.typed, {
        strings: ['ad-free.', 'yours.', 'customisable.', 'picture-in-picture.', 'Material You.'],
        typeSpeed: 70, backSpeed: 35, backDelay: 1700, loop: true, showCursor: true,
      });
      this.$nextTick(() => { if (location.hash && document.querySelector(location.hash)) setTimeout(() => document.querySelector(location.hash).scrollIntoView(), 200); });
    },
  }));
});
