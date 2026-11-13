(function () {
  'use strict';
  var I18N = window.I18N, PROFILE = window.PROFILE || {}, STACK = window.STACK || [];
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
    return null;
  }

  /* ---------------- Til ---------------- */
  var lang = store('lang');
  if (!I18N[lang]) lang = 'uz';

  function t(key) { return (I18N[lang] && I18N[lang][key] != null) ? I18N[lang][key] : (I18N.uz[key] || ''); }

  function applyLang(next) {
    lang = next;
    store('lang', next);
    document.documentElement.lang = next;
    document.title = t('meta_title');
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', t('meta_desc'));
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) { el.alt = t(el.getAttribute('data-i18n-alt')); });
    document.querySelectorAll('.lang button').forEach(function (b) {
      var on = b.getAttribute('data-lang') === next;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    renderContacts();
    restartTyping();
  }

  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
  });

  /* ---------------- Yozilib chiqadigan kasb ---------------- */
  var typedEl = document.getElementById('typed');
  var typeTimer = 0, roleIdx = 0;
  function restartTyping() {
    clearTimeout(typeTimer);
    var roles = t('roles');
    roleIdx = 0;
    if (reduceMotion) { typedEl.textContent = roles.join(' · '); return; }
    var text = '', deleting = false;
    function tick() {
      var full = roles[roleIdx % roles.length];
      if (!deleting) {
        text = full.slice(0, text.length + 1);
        typedEl.textContent = text;
        if (text === full) { deleting = true; typeTimer = setTimeout(tick, 1800); return; }
        typeTimer = setTimeout(tick, 55 + Math.random() * 45);
      } else {
        text = full.slice(0, text.length - 1);
        typedEl.textContent = text;
        if (!text) { deleting = false; roleIdx++; typeTimer = setTimeout(tick, 350); return; }
        typeTimer = setTimeout(tick, 28);
      }
    }
    tick();
  }

  /* ---------------- Aloqa kartalari ---------------- */
  var ICONS = {
    phone: '<path d="M6.6 3.5h2.6l1.4 4.2-2 1.4a12 12 0 0 0 6.3 6.3l1.4-2 4.2 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    telegram: '<path d="M21.5 4.5L2.8 11.6c-.9.4-.9 1.6 0 1.9l4.6 1.5 1.8 5.4c.3.8 1.3 1 1.9.4l2.6-2.5 4.8 3.5c.7.5 1.6.1 1.8-.7l3.1-14.6c.2-.9-.7-1.6-1.9-1z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    whatsapp: '<path d="M4.2 20l1.2-4.1a8.6 8.6 0 1 1 3.1 3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9.1 8.3c.3-.5.8-.5 1 0l.6 1.5c.1.3 0 .6-.2.8l-.5.5c.6 1.2 1.6 2.2 2.8 2.8l.5-.5c.2-.2.5-.3.8-.2l1.5.6c.5.2.5.7 0 1-.9.6-2 .7-3 .2-1.9-.9-3.4-2.4-4.3-4.3-.5-1-.4-2.1.3-3z" fill="currentColor"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    github: '<path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.7-.2.7-.5v-1.7c-2.7.6-3.3-1.2-3.3-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.1-.2-4.4-1.1-4.4-4.8 0-1 .4-1.9 1-2.6-.1-.3-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.2.1 2.5.6.7 1 1.6 1 2.6 0 3.7-2.3 4.6-4.4 4.8.3.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/>',
    website: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" fill="none" stroke="currentColor" stroke-width="1.7"/>'
  };

  function contactItems() {
    var items = [];
    if (PROFILE.phone) items.push({ k: 'phone', value: PROFILE.phone, href: 'tel:' + PROFILE.phone.replace(/[^\d+]/g, '') });
    if (PROFILE.telegram) items.push({ k: 'telegram', value: '@' + PROFILE.telegram.replace(/^@/, ''), href: 'https://t.me/' + PROFILE.telegram.replace(/^@/, '') });
    if (PROFILE.whatsapp) items.push({ k: 'whatsapp', value: PROFILE.whatsapp.replace(/^\+?998(\d{2})(\d{3})(\d{2})(\d{2})$/, '+998 $1 $2 $3 $4'), href: 'https://wa.me/' + PROFILE.whatsapp.replace(/\D/g, '') });
    if (PROFILE.email) items.push({ k: 'email', value: PROFILE.email, href: 'mailto:' + PROFILE.email });
    if (PROFILE.github) items.push({ k: 'github', value: PROFILE.github, href: 'https://github.com/' + PROFILE.github });
    if (PROFILE.instagram) items.push({ k: 'instagram', value: '@' + PROFILE.instagram.replace(/^@/, ''), href: 'https://instagram.com/' + PROFILE.instagram.replace(/^@/, '') });
    if (PROFILE.website) items.push({ k: 'website', value: PROFILE.website.replace(/^https?:\/\//, ''), href: PROFILE.website });
    return items;
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function renderContacts() {
    var box = document.getElementById('contacts');
    if (!box) return;
    box.innerHTML = contactItems().map(function (it) {
      var ext = /^https?:/.test(it.href) ? ' target="_blank" rel="noopener"' : '';
      return '<a class="contact-card spot" href="' + esc(it.href) + '"' + ext + '>' +
        '<span class="contact-card__icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[it.k] + '</svg></span>' +
        '<span class="contact-card__text"><span class="contact-card__label">' + esc(t('c_' + it.k)) + '</span>' +
        '<span class="contact-card__value">' + esc(it.value) + '</span></span>' +
        '<svg class="contact-card__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</a>';
    }).join('');
    bindSpotlight(box.querySelectorAll('.spot'));
  }

  /* ---------------- vCard: telefonga kontakt saqlash ---------------- */
  // Kontaktga rasm ham qoʻshilishi uchun kichik avatar oldindan yuklab qoʻyiladi
  var avatarB64 = '';
  if (window.fetch && window.FileReader && /^https?:/.test(location.protocol)) {
    fetch('img/avatar-256.jpg').then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) {
      if (!b) return;
      var fr = new FileReader();
      fr.onload = function () { avatarB64 = String(fr.result).split(',')[1] || ''; };
      fr.readAsDataURL(b);
    }).catch(function () {});
  }
  function vcardFold(line) {
    var out = [];
    for (var i = 0; i < line.length; i += 74) out.push((i ? ' ' : '') + line.slice(i, i + 74));
    return out.join('\r\n');
  }
  function vcardEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1'); }
  function saveContact() {
    var L = I18N[lang];
    var lines = [
      'BEGIN:VCARD', 'VERSION:3.0',
      'N:' + vcardEscape(L.last) + ';' + vcardEscape(L.first) + ';;;',
      'FN:' + vcardEscape(L.first + ' ' + L.last),
      'TITLE:' + vcardEscape(t('vcard_title'))
    ];
    if (PROFILE.phone) lines.push('TEL;TYPE=CELL:' + PROFILE.phone.replace(/[^\d+]/g, ''));
    if (PROFILE.email) lines.push('EMAIL;TYPE=INTERNET:' + PROFILE.email);
    if (PROFILE.telegram) lines.push('URL;TYPE=Telegram:https://t.me/' + PROFILE.telegram.replace(/^@/, ''));
    if (PROFILE.whatsapp) lines.push('URL;TYPE=WhatsApp:https://wa.me/' + PROFILE.whatsapp.replace(/\D/g, ''));
    if (PROFILE.instagram) lines.push('URL;TYPE=Instagram:https://instagram.com/' + PROFILE.instagram.replace(/^@/, ''));
    if (PROFILE.github) lines.push('URL;TYPE=GitHub:https://github.com/' + PROFILE.github);
    if (PROFILE.website) lines.push('URL:' + PROFILE.website);
    else if (/^https?:/.test(location.href)) lines.push('URL:' + location.origin + location.pathname);
    lines.push('ADR;TYPE=WORK:;;;' + vcardEscape(t('eyebrow').split(',')[0]) + ';;;' + vcardEscape((t('eyebrow').split(',')[1] || '').trim()));
    if (avatarB64) lines.push(vcardFold('PHOTO;ENCODING=b;TYPE=JPEG:' + avatarB64));
    lines.push('END:VCARD');
    var blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/vcard;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (I18N.en.first + '-' + I18N.en.last).toLowerCase() + '.vcf';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
    toast(t('toast_saved'));
  }
  document.querySelectorAll('[data-save-contact]').forEach(function (b) { b.addEventListener('click', saveContact); });

  var toastEl = document.getElementById('toast'), toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
  }

  /* ---------------- Texnologiyalar lentasi ---------------- */
  (function () {
    var half = Math.ceil(STACK.length / 2);
    var rows = { a: STACK.slice(0, half), b: STACK.slice(half) };
    Object.keys(rows).forEach(function (key) {
      var track = document.querySelector('[data-marquee="' + key + '"]');
      if (!track) return;
      var chips = rows[key].map(function (s) { return '<span class="chip">' + esc(s) + '</span>'; }).join('');
      track.innerHTML = chips + chips + chips + chips;
    });
    var sr = document.getElementById('stack-list');
    if (sr) sr.textContent = STACK.join(', ');
  })();

  /* ---------------- Navigatsiya ---------------- */
  var navEl = document.getElementById('nav');
  function onScroll() { navEl.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- Paydo boʻlish animatsiyasi ---------------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) {
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(sib, 6) * 70 + 'ms';
      io.observe(el);
    });
    // Havola (#aloqa kabi) orqali sakrab kelinganda ekrandagi elementlar darrov koʻrinsin
    var revealInView = function () {
      reveals.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    };
    window.addEventListener('load', function () { setTimeout(revealInView, 120); });
    window.addEventListener('hashchange', function () { setTimeout(revealInView, 700); });
  }

  /* ---------------- Kartalar: 3D egilish va yorugʻlik dogʻi ---------------- */
  function bindSpotlight(list) {
    list.forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }
  bindSpotlight(document.querySelectorAll('.card, .fact'));

  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateX(' + (-py * 8).toFixed(2) + 'deg) rotateY(' + (px * 10).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });

    document.querySelectorAll('.magnetic').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (dx * 0.18).toFixed(1) + 'px,' + (dy * 0.25).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });

    var glow = document.querySelector('.cursor-glow');
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy;
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; glow.classList.add('is-on'); }, { passive: true });
    (function follow() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = 'translate(' + (gx - 300) + 'px,' + (gy - 300) + 'px)';
      requestAnimationFrame(follow);
    })();
  }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  applyLang(lang);
})();
