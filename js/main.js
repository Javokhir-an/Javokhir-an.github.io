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
    document.querySelectorAll('img[data-qr]').forEach(function (el) { el.src = 'img/qr-' + next + '.svg'; });
    document.querySelectorAll('[data-i18n-list]').forEach(function (el) {
      var items = t(el.getAttribute('data-i18n-list')) || [];
      el.innerHTML = items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    });
    document.querySelectorAll('.lang button').forEach(function (b) {
      var on = b.getAttribute('data-lang') === next;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-split]').forEach(splitLetters);
    fitName();
    renderContacts();
    renderAvail();
    restartRoles();
  }

  /* Ism portret bilan toʻqnashmasligi uchun shrift oʻlchami joyga moslanadi (ayniqsa RU/EN) */
  var nameEl = document.querySelector('.name'), portraitEl = document.querySelector('.portrait');
  function fitName() {
    if (!nameEl) return;
    nameEl.style.fontSize = '';
    var widest = 0;
    nameEl.querySelectorAll('.name__first, .name__last').forEach(function (l) { widest = Math.max(widest, l.offsetWidth); });
    var avail = nameEl.clientWidth;
    if (window.innerWidth >= 860 && portraitEl && portraitEl.offsetWidth) {
      avail = Math.min(avail, portraitEl.offsetLeft - portraitEl.offsetWidth * 0.2 - nameEl.getBoundingClientRect().left - 20);
    }
    if (widest > avail && avail > 0) {
      nameEl.style.fontSize = (parseFloat(getComputedStyle(nameEl).fontSize) * avail / widest).toFixed(1) + 'px';
    }
    fitRole();
  }
  var roleBox = document.querySelector('.role'), roleMain = document.querySelector('.role__main');
  function fitRole() {
    if (!roleBox || !roleMain) return;
    roleBox.classList.remove('role--stack');
    var probe = document.createElement('span');
    probe.className = 'role__word';
    probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden';
    roleBox.appendChild(probe);
    var longest = 0;
    (t('roles') || []).forEach(function (r) { probe.textContent = r; longest = Math.max(longest, probe.offsetWidth); });
    roleBox.removeChild(probe);
    var avail = roleBox.clientWidth;
    if (window.innerWidth >= 860 && portraitEl && portraitEl.offsetWidth) {
      avail = Math.min(avail, portraitEl.offsetLeft - portraitEl.offsetWidth * 0.2 - roleBox.getBoundingClientRect().left - 20);
    }
    var gap = parseFloat(getComputedStyle(roleBox).columnGap) || 12;
    var need = 34 + gap + roleMain.offsetWidth + gap + 1 + gap + longest;
    roleBox.classList.toggle('role--stack', reduceMotion || need > avail);
  }
  window.addEventListener('resize', fitName);
  if (document.fonts) {
    if (document.fonts.ready) document.fonts.ready.then(fitName);
    // Kirill harflari shrifti keyinroq yuklanadi — yuklangach oʻlcham qayta hisoblanadi
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fitName);
  }

  /* Ismni harflarga boʻlish: har bir harf alohida uchib kiradi */
  function splitLetters(el) {
    var text = el.textContent;
    el.setAttribute('aria-label', text);
    el.innerHTML = Array.prototype.map.call(text, function (ch, i) {
      return '<span class="ch" aria-hidden="true" style="--i:' + i + '">' + (ch === ' ' ? '&nbsp;' : esc(ch)) + '</span>';
    }).join('');
    el.querySelectorAll('.ch').forEach(function (s) {
      s.addEventListener('animationend', function () { s.classList.add('is-done'); });
    });
  }

  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
  });

  /* ---------------- Kasb: soʻzlar silliq almashadi (harflar pastdan chiqadi) ---------------- */
  var roleEl = document.getElementById('typed');
  var rolesSr = document.getElementById('roles-sr');
  var roleTimer = 0, roleIdx = 0;
  function showRole(text) {
    var old = roleEl.querySelector('.role__word.is-in');
    if (old) {
      // Eski soʻz oqimdan chiqadi (absolute) — quti eni yangi soʻzga oʻzi moslanadi
      old.classList.remove('is-in');
      old.classList.add('is-out');
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 1000);
    }
    var w = document.createElement('span');
    w.className = 'role__word';
    w.innerHTML = Array.prototype.map.call(text, function (ch, i) {
      return '<span class="rl" style="--i:' + i + '">' + (ch === ' ' ? '&nbsp;' : esc(ch)) + '</span>';
    }).join('');
    roleEl.appendChild(w);
    requestAnimationFrame(function () { requestAnimationFrame(function () { w.classList.add('is-in'); }); });
  }
  var heroStarted = false;
  function scheduleRoles(firstHold) {
    clearTimeout(roleTimer);
    var roles = t('roles');
    roleTimer = setTimeout(function next() {
      showRole(roles[roleIdx % roles.length]);
      roleIdx++;
      roleTimer = setTimeout(next, 2600);
    }, firstHold);
  }
  function restartRoles() {
    clearTimeout(roleTimer);
    var roles = t('roles');
    if (rolesSr) rolesSr.textContent = roles.join(', ');
    roleEl.innerHTML = '';
    if (reduceMotion) {
      roleEl.style.height = 'auto';
      roleEl.style.clipPath = 'none';
      roleEl.style.whiteSpace = 'normal';
      roleEl.textContent = roles.join(' · ');
      return;
    }
    // Avval LinkedIn sarlavhasi bilan bir xil: «muhandis | tizim administratori»; almashish birinchi ekran ochilgach boshlanadi
    showRole(roles[0]);
    roleIdx = 1;
    if (heroStarted) scheduleRoles(3200);
  }
  window.addEventListener('hero:in', function () {
    heroStarted = true;
    if (!reduceMotion) scheduleRoles(4200);
  });

  /* ---------------- Aloqa kartalari ---------------- */
  var ICONS = {
    phone: '<path d="M6.6 3.5h2.6l1.4 4.2-2 1.4a12 12 0 0 0 6.3 6.3l1.4-2 4.2 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    telegram: '<path d="M21.5 4.5L2.8 11.6c-.9.4-.9 1.6 0 1.9l4.6 1.5 1.8 5.4c.3.8 1.3 1 1.9.4l2.6-2.5 4.8 3.5c.7.5 1.6.1 1.8-.7l3.1-14.6c.2-.9-.7-1.6-1.9-1z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    whatsapp: '<path d="M4.2 20l1.2-4.1a8.6 8.6 0 1 1 3.1 3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9.1 8.3c.3-.5.8-.5 1 0l.6 1.5c.1.3 0 .6-.2.8l-.5.5c.6 1.2 1.6 2.2 2.8 2.8l.5-.5c.2-.2.5-.3.8-.2l1.5.6c.5.2.5.7 0 1-.9.6-2 .7-3 .2-1.9-.9-3.4-2.4-4.3-4.3-.5-1-.4-2.1.3-3z" fill="currentColor"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    github: '<path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.7-.2.7-.5v-1.7c-2.7.6-3.3-1.2-3.3-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.1-.2-4.4-1.1-4.4-4.8 0-1 .4-1.9 1-2.6-.1-.3-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.2.1 2.5.6.7 1 1.6 1 2.6 0 3.7-2.3 4.6-4.4 4.8.3.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 10.5V17M8 7.2v.1M11.5 17v-6.5M11.5 13.3c0-1.7 1.1-2.8 2.5-2.8s2.3 1 2.3 2.7V17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    website: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" fill="none" stroke="currentColor" stroke-width="1.7"/>'
  };

  /* PROFILE.linkedin toʻliq havola yoki faqat nom boʻlishi mumkin: .../in/<nom>/ */
  function linkedinSlug() {
    var v = String(PROFILE.linkedin || '').trim();
    var m = v.match(/linkedin\.com\/in\/([^/?#]+)/i);
    return m ? m[1] : v.replace(/^\/+|\/+$/g, '');
  }

  function contactItems() {
    var items = [];
    if (PROFILE.phone) items.push({ k: 'phone', value: PROFILE.phone, href: 'tel:' + PROFILE.phone.replace(/[^\d+]/g, '') });
    if (PROFILE.telegram) items.push({ k: 'telegram', value: '@' + PROFILE.telegram.replace(/^@/, ''), href: 'https://t.me/' + PROFILE.telegram.replace(/^@/, '') });
    if (PROFILE.whatsapp) items.push({ k: 'whatsapp', value: PROFILE.whatsapp.replace(/^\+?998(\d{2})(\d{3})(\d{2})(\d{2})$/, '+998 $1 $2 $3 $4'), href: 'https://wa.me/' + PROFILE.whatsapp.replace(/\D/g, '') });
    if (PROFILE.email) items.push({ k: 'email', value: PROFILE.email, href: 'mailto:' + PROFILE.email });
    var li = linkedinSlug();
    if (li) items.push({ k: 'linkedin', value: PROFILE.linkedinName || 'in/' + li, href: 'https://www.linkedin.com/in/' + li + '/' });
    if (PROFILE.github) items.push({ k: 'github', value: PROFILE.github, href: 'https://github.com/' + PROFILE.github });
    if (PROFILE.instagram) items.push({ k: 'instagram', value: '@' + PROFILE.instagram.replace(/^@/, ''), href: 'https://instagram.com/' + PROFILE.instagram.replace(/^@/, '') });
    if (PROFILE.website) items.push({ k: 'website', value: PROFILE.website.replace(/^https?:\/\//, ''), href: PROFILE.website });
    return items;
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* Ish vaqti: Toshkent vaqti (UTC+5) boʻyicha hozir aloqadami yoki qachondan javob beradi */
  function renderAvail() {
    var hoursEl = document.getElementById('avail-hours'), liveEl = document.getElementById('avail-live');
    if (!hoursEl || !liveEl) return;
    var h = PROFILE.hours || [8, 20], days = PROFILE.workdays || [1, 2, 3, 4, 5, 6];
    var hh = function (n) { return (n < 10 ? '0' : '') + n + ':00'; };
    hoursEl.textContent = t('av_days') + ', ' + hh(h[0]) + '–' + hh(h[1]);
    var now = new Date(Date.now() + 5 * 3600e3), day = now.getUTCDay(), hour = now.getUTCHours() + now.getUTCMinutes() / 60;
    var isDay = function (d) { return days.indexOf(d % 7) !== -1; };
    var text, on = false;
    if (isDay(day) && hour >= h[0] && hour < h[1]) { text = t('av_now'); on = true; }
    else {
      var add = (isDay(day) && hour < h[0]) ? 0 : 1;
      while (!isDay(day + add) && add < 7) add++;
      text = t(add === 0 ? 'av_today' : add === 1 ? 'av_tomorrow' : 'av_monday').replace('{t}', hh(h[0]));
    }
    liveEl.textContent = text;
    liveEl.classList.toggle('is-on', on);
  }
  setInterval(renderAvail, 60000);

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
    if (linkedinSlug()) lines.push('URL;TYPE=LinkedIn:https://www.linkedin.com/in/' + linkedinSlug() + '/');
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

  /* QR vizitka: bosilganda katta qilib ochiladi (telefonda boshqa odamga koʻrsatish uchun) */
  var qrZoom = document.getElementById('qrzoom'), qrOpener = null, qrTimer = 0;
  function qrOpen(e) {
    qrOpener = e.currentTarget;
    clearTimeout(qrTimer);
    qrZoom.hidden = false;
    void qrZoom.offsetWidth;
    qrZoom.classList.add('is-open');
    document.documentElement.classList.add('is-locked');
    qrZoom.focus({ preventScroll: true });
  }
  function qrClose() {
    if (!qrZoom.classList.contains('is-open')) return;
    qrZoom.classList.remove('is-open');
    document.documentElement.classList.remove('is-locked');
    qrTimer = setTimeout(function () { qrZoom.hidden = true; }, 350);
    if (qrOpener) qrOpener.focus({ preventScroll: true });
  }
  if (qrZoom) {
    document.querySelectorAll('[data-qr-open]').forEach(function (b) { b.addEventListener('click', qrOpen); });
    qrZoom.addEventListener('click', qrClose);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') qrClose(); });
  }

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
  var progressEl = document.querySelector('.progress span');
  function onScroll() {
    navEl.classList.toggle('is-scrolled', window.scrollY > 24);
    if (progressEl) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progressEl.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ')';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- Paydo boʻlish animatsiyasi ---------------- */
  var reveals = Array.prototype.filter.call(document.querySelectorAll('.reveal'), function (el) { return !el.closest('.hero'); });
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
        card.style.transform = 'perspective(900px) rotateX(' + (-py * 3).toFixed(2) + 'deg) rotateY(' + (px * 4).toFixed(2) + 'deg) translateY(-3px)';
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
    var cur = document.querySelector('.cursor');
    var dot = cur && cur.querySelector('.cursor__dot'), ring = cur && cur.querySelector('.cursor__ring');
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy, rx = gx, ry = gy;
    if (cur) document.documentElement.classList.add('has-cursor');
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      glow.classList.add('is-on');
      if (cur) cur.classList.add('is-on');
    }, { passive: true });
    document.addEventListener('mouseleave', function () { if (cur) cur.classList.remove('is-on'); });
    window.addEventListener('pointerdown', function () { if (cur) cur.classList.add('is-down'); });
    window.addEventListener('pointerup', function () { if (cur) cur.classList.remove('is-down'); });
    document.addEventListener('pointerover', function (e) {
      if (cur) cur.classList.toggle('is-hover', !!(e.target.closest && e.target.closest('a, button, .card, .contact-card, .portrait, .name__first .ch')));
    });
    (function follow() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      rx += (tx - rx) * 0.2; ry += (ty - ry) * 0.2;
      glow.style.transform = 'translate(' + (gx - 300) + 'px,' + (gy - 300) + 'px)';
      if (cur) {
        dot.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
        ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      }
      requestAnimationFrame(follow);
    })();
  }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  applyLang(lang);

  /* ---------------- Kirish (intro) va birinchi ekran ---------------- */
  var root = document.documentElement;
  var heroReveals = document.querySelectorAll('.hero .reveal');
  function heroIn() {
    if (document.body.classList.contains('hero--in')) return;
    document.body.classList.add('hero--in');
    heroReveals.forEach(function (el, i) {
      el.style.transitionDelay = (reduceMotion ? 0 : 700 + i * 120) + 'ms';
      el.classList.add('is-in');
    });
    window.dispatchEvent(new Event('hero:in'));
  }
  var intro = document.getElementById('intro');
  if (intro && root.classList.contains('intro-on')) {
    try { sessionStorage.setItem('intro', '1'); } catch (e) {}
    setTimeout(function () {
      intro.classList.add('is-out');
      root.classList.remove('intro-lock');
      setTimeout(heroIn, 200);
      setTimeout(function () { intro.remove(); root.classList.remove('intro-on'); }, 1300);
    }, 1600);
  } else {
    if (intro) intro.remove();
    root.classList.remove('intro-lock');
    setTimeout(heroIn, 80);
  }
})();
