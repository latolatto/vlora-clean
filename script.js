(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = $('#menuToggle');
  const nav = $('#navigation');
  const packageMenu = $('#navPackages');
  function closeMenu(returnFocus = false) {
    nav.classList.remove('open');
    if (packageMenu) packageMenu.open = false;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Hap menynë');
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Mbyll menynë' : 'Hap menynë');
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (packageMenu?.open) { if (packageMenu) packageMenu.open = false; packageMenu.querySelector('summary').focus(); }
    else if (nav.classList.contains('open')) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav-packages')) if (packageMenu) packageMenu.open = false;
    if (!event.target.closest('.site-header')) closeMenu();
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  // Entrance animations settle by themselves; no persistent banner controls.
  const hero = $('#krye');
  if (window.matchMedia('(pointer:fine)').matches) {
    let pointerFrame = 0;
    hero.addEventListener('pointermove', event => {
      if (reduced.matches || pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        const bounds = hero.getBoundingClientRect();
        hero.style.setProperty('--pointer-x', (event.clientX - bounds.left) + 'px');
        hero.style.setProperty('--pointer-y', (event.clientY - bounds.top) + 'px');
        pointerFrame = 0;
      });
    }, { passive: true });
  }

  // Each pulse moves only while invisible; positions stay over the hero photograph.
  const twinkles = $$('.tirana-twinkles i');
  const sparkleColours = ['#81b858', '#7fa9cb', '#c9e5b1', '#bdd9e9'];
  const sparkleTimers = new Map();
  function placeTwinkle(spark, index) {
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    const x = mobile ? 14 + Math.random() * 76 : 64 + Math.random() * 31;
    const photoHeight = Math.min(280, Math.max(180, hero.clientHeight * .27));
    const y = mobile ? hero.clientHeight - photoHeight + Math.random() * (photoHeight - 35) : hero.clientHeight * (.16 + Math.random() * .66);
    spark.style.setProperty('--spark-x', x + '%');
    spark.style.setProperty('--spark-y', y + 'px');
    spark.style.setProperty('--spark-size', (mobile ? 10 + Math.random() * 7 : 12 + Math.random() * 11) + 'px');
    spark.style.setProperty('--spark-color', sparkleColours[index % sparkleColours.length]);
    spark.style.setProperty('--spark-duration', (3.2 + Math.random() * 2) + 's');
  }
  function runTwinkle(spark, index) {
    if (reduced.matches || document.hidden) return;
    placeTwinkle(spark, index);
    spark.classList.add('is-pulsing');
  }
  function scheduleTwinkle(spark, index, delay) {
    clearTimeout(sparkleTimers.get(spark));
    sparkleTimers.set(spark, setTimeout(() => runTwinkle(spark, index), delay));
  }
  twinkles.forEach((spark, index) => {
    placeTwinkle(spark, index);
    spark.addEventListener('animationend', () => {
      spark.classList.remove('is-pulsing');
      scheduleTwinkle(spark, index, 250 + Math.random() * 1400);
    });
    if (!reduced.matches) scheduleTwinkle(spark, index, index * 850);
  });
  function restartTwinkles() {
    twinkles.forEach((spark, index) => {
      clearTimeout(sparkleTimers.get(spark));
      spark.classList.remove('is-pulsing');
      if (!document.hidden && !reduced.matches) scheduleTwinkle(spark, index, 150 + index * 700);
    });
  }
  reduced.addEventListener('change', restartTwinkles);
  document.addEventListener('visibilitychange', restartTwinkles);
  window.matchMedia('(max-width: 760px)').addEventListener('change', () => {
    twinkles.forEach((spark, index) => placeTwinkle(spark, index));
  });

  const content = window.TIRANA_CONTENT || { reviews: [], videos: [], mediaIsReference: true };
  $$('[data-reference-label]').forEach(label => { label.hidden = !content.mediaIsReference; });
  const videoGrid = $('#videoGrid');
  const playIcon = '<svg viewBox="0 0 18 22" aria-hidden="true"><path d="M2 2 16 11 2 20Z" fill="currentColor"/></svg>';
  const pauseIcon = '<svg viewBox="0 0 18 22" aria-hidden="true"><path d="M5 3v16M13 3v16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const videoPlayers = new Map();
  function syncVideoPlayback(player) {
    const {video} = player;
    if (document.hidden || !player.visible || player.manuallyPaused) {
      video.pause();
      return;
    }
    video.play().then(() => {
      // A pending play request can resolve after the visitor scrolls away.
      if (document.hidden || !player.visible || player.manuallyPaused) video.pause();
    }).catch(player.update);
  }
  const videoWarmup = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      // Metadata is enough to prepare playback without downloading every clip.
      entry.target.preload = 'metadata';
      videoWarmup.unobserve(entry.target);
    });
  }, {rootMargin:'300px 0px'}) : null;
  const videoVisibility = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const player = videoPlayers.get(entry.target);
      player.visible = entry.isIntersecting && entry.intersectionRatio >= 0.1;
      syncVideoPlayback(player);
    });
  }, {threshold:[0,0.1]}) : null;
  (content.videos || []).forEach((item, index) => {
    const figure = videoGrid.querySelector('[data-video-index="' + index + '"]') || document.createElement('figure');
    figure.className = 'video-card'; figure.dataset.videoIndex = String(index);
    const frame = figure.querySelector('.video-frame') || document.createElement('div'); frame.className = 'video-frame';
    const video = frame.querySelector('video') || document.createElement('video');
    video.preload = 'none'; video.muted = true; video.defaultMuted = true; video.autoplay = false; video.loop = true; video.playsInline = true; video.controls = false;
    video.removeAttribute('autoplay');
    ['muted','loop','playsinline'].forEach(attribute => video.setAttribute(attribute,''));
    video.setAttribute('loading','lazy');
    if (video.getAttribute('src') !== item.src) video.src = item.src;
    if (item.poster) video.poster = item.poster;
    video.setAttribute('aria-label', item.title + ' — Vlora Clean');
    const play = frame.querySelector('.video-play') || document.createElement('button'); play.type = 'button'; play.className = 'video-play';
    function updatePlaybackControl() { frame.classList.toggle('playing',!video.paused); play.setAttribute('aria-label',(video.paused ? 'Luaj videon: ' : 'Ndalo videon: ') + item.title); play.innerHTML = '<span>' + (video.paused ? playIcon : pauseIcon) + '</span>'; }
    const player = {video,visible:false,manuallyPaused:false,update:updatePlaybackControl};
    videoPlayers.set(video,player);
    play.addEventListener('click',async () => {
      player.manuallyPaused = !video.paused;
      if (player.manuallyPaused) { video.pause(); return; }
      try { await video.play(); } catch { showVideoError(); }
    });
    video.addEventListener('play',updatePlaybackControl); video.addEventListener('pause',updatePlaybackControl);
    function showVideoError() { if (frame.querySelector('.video-error')) return; const error = document.createElement('a'); error.className = 'video-error'; error.href = 'https://www.instagram.com/cleaning_service_vlore/'; error.target = '_blank'; error.rel = 'noopener'; error.textContent = 'Shihni videot në Instagram ↗'; frame.append(error); }
    video.addEventListener('error',showVideoError);
    frame.append(video,play);
    const caption = figure.querySelector('figcaption') || document.createElement('figcaption');
    if (!caption.children.length) { const text = document.createElement('div'); const title = document.createElement('h3'); title.textContent = item.title; const subtitle = document.createElement('p'); subtitle.textContent = item.subtitle || ''; text.append(title,subtitle); caption.append(text); }
    figure.append(frame,caption); if (!figure.isConnected) videoGrid.append(figure);
    updatePlaybackControl();
    videoWarmup?.observe(video);
    videoVisibility?.observe(video);
    // Without observer support the play button remains available.
  });
  document.addEventListener('visibilitychange',() => videoPlayers.forEach(syncVideoPlayback));


  // Progressive enhancement: all content is visible without JavaScript.
  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(entries => {
      $('#mobileDock').classList.toggle('visible', !entries[0].isIntersecting);
    }, { threshold: 0 });
    heroObserver.observe($('#krye'));
    if (!reduced.matches) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('waiting'); observer.unobserve(entry.target); } });
      }, { threshold: 0.08 });
      $$('.reveal').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('waiting'); observer.observe(el); } });
      // Long pages remain available even if observation is interrupted.
      window.setTimeout(() => $$('.reveal.waiting').forEach(el => el.classList.remove('waiting')), 12000);
    }
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) $$('.site-nav a').forEach(link => {
          const active = link.hash === '#' + entry.target.id;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -60% 0px' });
    $$('.site-nav a').forEach(link => { const target = document.querySelector(link.hash); if (target) sectionObserver.observe(target); });
  }

  const form = $('#offerForm');
  const serviceField = $('#service');
  const result = $('#formResult');
  const status = $('#formStatus');
  $$('[data-service]').forEach(link => link.addEventListener('click', () => {
    serviceField.value = link.dataset.service;
    serviceField.dispatchEvent(new Event('change', { bubbles: true }));
    result.hidden = true;
    closeMenu();
  }));

  function phoneValid(value) {
    const digits = value.replace(/\D/g, '');
    return /^\+?[\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
  }
  const rules = {
    name: value => value.length >= 2,
    phone: phoneValid,
    service: value => [...serviceField.options].some(option => option.value === value && value),
    area: value => value.length >= 2,
  };
  function checkField(name) {
    const field = form.elements.namedItem(name);
    const valid = rules[name](field.value.trim());
    field.closest('.field').classList.toggle('has-error', !valid);
    field.setAttribute('aria-invalid', String(!valid));
    return valid;
  }
  Object.keys(rules).forEach(name => {
    const field = form.elements.namedItem(name);
    ['input', 'change'].forEach(event => field.addEventListener(event, () => {
      if (field.getAttribute('aria-invalid') === 'true') checkField(name);
      status.textContent = '';
    }));
  });
  form.addEventListener('input', () => { result.hidden = true; });
  form.addEventListener('change', () => { result.hidden = true; });
  function buildMessage() {
    const value = name => form.elements.namedItem(name).value.trim();
    const lines = [
      'Përshëndetje Vlora Clean! Dëshiroj të rezervoj një pastrim dhe të di çmimin.', '',
      'Emri: ' + value('name'), 'Telefoni: ' + value('phone'),
      'Shërbimi: ' + value('service'), 'Qyteti / zona / adresa: ' + value('area'),
    ];
    if (value('size')) lines.push('Sipërfaqja: ' + value('size') + ' m²');
    if (value('date')) { const parts = value('date').split('-'); lines.push('Data e preferuar: ' + parts.reverse().join('.')); }
    if (value('notes')) lines.push('Shënime: ' + value('notes'));
    lines.push('', 'Mund t’ju dërgoj foto ose video të ambientit në WhatsApp. Faleminderit!');
    return lines.join('\n');
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    let firstInvalid;
    Object.keys(rules).forEach(name => { if (!checkField(name) && !firstInvalid) firstInvalid = form.elements.namedItem(name); });
    if (firstInvalid) {
      result.hidden = true;
      status.textContent = 'Ju lutem kontrolloni fushat e shënuara.';
      firstInvalid.focus();
      return;
    }
    status.textContent = '';
    const message = buildMessage();
    $('#messagePreview').textContent = message;
    $('#whatsappLink').href = 'https://wa.me/355693491794?text=' + encodeURIComponent(message);
    result.hidden = false;
    result.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'nearest' });
  });
  $('#copyMessage').addEventListener('click', async () => {
    const button = $('#copyMessage');
    try {
      await navigator.clipboard.writeText($('#messagePreview').textContent);
      button.textContent = 'U kopjua';
    } catch {
      const range = document.createRange();
      range.selectNodeContents($('#messagePreview'));
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
      button.textContent = 'Përzgjidhni Kopjo';
    }
    window.setTimeout(() => { button.textContent = 'Kopjo mesazhin'; }, 3000);
  });
  $('#year').textContent = new Date().getFullYear();
})();
