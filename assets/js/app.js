/* ============================================================
   IMPULS — интерактив сайта
   ============================================================ */
(function () {
  'use strict';

  var WORK_COUNT = 21;
  var waNumber = '77051116211';

  /* ---------- утилиты ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---------- шапка, наверх, активный пункт меню ---------- */
  var header = $('#header');
  var toTop = $('#toTop');
  var navLinks = $$('.nav a[href^="#"]');
  var pageSections = $$('main > section');

  var ticking = false;
  function updateScrollUI() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-stuck', y > 8);
    if (toTop) toTop.classList.toggle('is-visible', y > 600);

    var currentId = '';
    var probe = y + 150;
    pageSections.forEach(function (section) {
      if (section.offsetTop <= probe) currentId = section.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', currentId !== '' && a.getAttribute('href') === '#' + currentId);
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }, { passive: true });
  updateScrollUI();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- мобильное меню ---------- */
  var burger = $('#burger');
  var mobileMenu = $('#mobileMenu');
  function closeMenu() {
    document.body.classList.remove('menu-open');
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Открыть меню');
    }
    document.body.style.overflow = '';
  }
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', mobileMenu).forEach(function (a) {
      a.addEventListener('click', function () {
        closeMenu();
      });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1180 && document.body.classList.contains('menu-open')) closeMenu();
    });
  }

  /* ---------- появление блоков ---------- */
  var reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 45 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- hero-слайдер ---------- */
  var track = $('#heroTrack');
  var dotsWrap = $('#heroDots');
  if (track && dotsWrap) {
    var slides = $$('.hero-slider__slide', track);
    var current = 0;
    var timer = null;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Фото ' + (i + 1));
      if (i === 0) b.classList.add('is-active');
      b.addEventListener('click', function () { go(i, true); });
      dotsWrap.appendChild(b);
    });

    function go(i, manual) {
      current = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-100 * current) + '%)';
      $$('button', dotsWrap).forEach(function (d, di) {
        d.classList.toggle('is-active', di === current);
        d.setAttribute('aria-selected', di === current ? 'true' : 'false');
      });
      if (manual) restart();
    }

    function play() {
      if (reduceMotion) return;
      stop();
      timer = window.setInterval(function () { go(current + 1); }, 5000);
    }
    function stop() { window.clearInterval(timer); }
    function restart() { stop(); play(); }

    var sliderEl = $('#heroSlider');
    sliderEl.addEventListener('mouseenter', stop);
    sliderEl.addEventListener('mouseleave', play);

    var startX = 0, dragging = false;
    sliderEl.addEventListener('touchstart', function (e) {
      dragging = true; startX = e.touches[0].clientX; stop();
    }, { passive: true });
    sliderEl.addEventListener('touchend', function (e) {
      if (!dragging) return;
      dragging = false;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) go(current + (dx < 0 ? 1 : -1), true);
      else play();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else play();
    });

    if (!reduceMotion) play();
  }

  /* ---------- галерея работ ---------- */
  var rail = $('#worksRail');
  var lightbox = $('#lightbox');
  var lbImg = $('#lbImg');
  var lbCount = $('#lbCount');
  var lbIndex = 0;
  var photos = [];
  var lbTrigger = null;

  if (rail) (function () {
    var frag = document.createDocumentFragment();
    for (var i = 1; i <= WORK_COUNT; i++) {
      photos.push('assets/works/work-' + pad(i) + '.jpg');

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'work';
      btn.dataset.index = String(i - 1);
      btn.innerHTML =
        '<img src="assets/works/thumb/work-' + pad(i) + '.jpg" alt="" width="720" height="720" loading="lazy" decoding="async">' +
        '<span class="work__cap"><span>Работа ' + pad(i) + ' · Астана</span></span>';
      frag.appendChild(btn);
    }
    rail.appendChild(frag);

    /* карусель-рулетка: активная карточка по центру */
    var cards = [].slice.call(rail.querySelectorAll('.work'));
    var counter = $('#worksCount');

    var current = 0;
    var animating = false;
    var lockUntil = 0;
    var animId = 0;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function setActive(idx) {
      current = idx;
      cards.forEach(function (c, i) { c.classList.toggle('is-active', i === idx); });
      if (counter) counter.textContent = (idx + 1) + ' / ' + cards.length;
    }

    function activeIndex() {
      var r = rail.getBoundingClientRect();
      var mid = r.left + r.width / 2, best = 0, bestD = Infinity;
      cards.forEach(function (c, i) {
        var b = c.getBoundingClientRect();
        var d = Math.abs(b.left + b.width / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    }

    function goTo(idx) {
      if (!cards.length) return;
      idx = Math.max(0, Math.min(cards.length - 1, idx));
      var r = rail.getBoundingClientRect();
      var b = cards[idx].getBoundingClientRect();
      var to = rail.scrollLeft + (b.left - r.left) - (rail.clientWidth - b.width) / 2;
      var from = rail.scrollLeft, dist = to - from;
      setActive(idx);
      var myId = ++animId;
      animating = true;
      lockUntil = 0;
      if (reduceMotion.matches || Math.abs(dist) < 2) { rail.scrollLeft = to; paint(); animating = false; lockUntil = performance.now() + 220; return; }
      var dur = Math.min(700, Math.max(260, Math.abs(dist) * 0.8));
      var t0 = 0;
      function frame(now) {
        if (myId !== animId) return;
        if (!t0) t0 = now;
        var p = Math.min(1, (now - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        rail.scrollLeft = from + dist * e;
        paint();
        if (p < 1) requestAnimationFrame(frame);
        else { animating = false; lockUntil = performance.now() + 220; setActive(idx); paint(); }
      }
      requestAnimationFrame(frame);
    }

    /* объём: карточки разворачиваются и уменьшаются к краям — «парят в воздухе» */
    function paint() {
      if (reduceMotion.matches) {
        for (var i = 0; i < cards.length; i++) cards[i].style.transform = '';
        return;
      }
      var r = rail.getBoundingClientRect();
      var mid = r.left + r.width / 2;
      var span = Math.max(1, r.width * 0.62);
      var centers = [], n = cards.length;
      for (var j = 0; j < n; j++) {
        var b = cards[j].getBoundingClientRect();
        centers.push(b.left + b.width / 2);
      }
      for (var k = 0; k < n; k++) {
        var t = (centers[k] - mid) / span;
        t = Math.max(-1.6, Math.min(1.6, t));
        var a = Math.min(1, Math.abs(t));
        var rot = (-t * 13).toFixed(2);
        var scale = (1 - a * 0.14).toFixed(3);
        var ty = (a * 14).toFixed(1);
        cards[k].style.transform = 'perspective(1400px) rotateY(' + rot + 'deg) scale(' + scale + ') translateY(' + ty + 'px)';
      }
    }

    var ticking = false;
    rail.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        paint();
        if (animating || performance.now() < lockUntil) return;
        setActive(activeIndex());
      });
    }, { passive: true });    window.addEventListener('resize', function () { setActive(activeIndex()); paint(); });
    setActive(0);
    requestAnimationFrame(paint);

    /* стрелки: одна карточка за нажатие */
    var prev = $('#railPrev'), next = $('#railNext');
    if (prev) prev.addEventListener('click', function () { goTo(current - 1); });
    if (next) next.addEventListener('click', function () { goTo(current + 1); });

    /* отдельная кнопка: открыть текущее фото крупно */
    var openBtn = $('#worksOpen');
    if (openBtn) openBtn.addEventListener('click', function () {
      if (cards.length) openLightbox(current, cards[current]);
    });

    /* перетаскивание мышью */
    var isDown = false, startX = 0, startLeft = 0, moved = 0;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      isDown = true; moved = 0;
      animId++; animating = false; lockUntil = 0;
      startX = e.clientX; startLeft = rail.scrollLeft;
      rail.style.cursor = 'grabbing';
    });
    rail.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      rail.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!isDown) return;
      isDown = false;
      rail.style.cursor = '';
    });
    rail.addEventListener('click', function (e) {
      if (moved > 8) { e.preventDefault(); e.stopPropagation(); moved = 0; return; }
      var card = e.target.closest('.work');
      if (!card) return;
      /* клик по любому фото только перелистывает рулетку — без полноэкранного просмотра */
      goTo(parseInt(card.dataset.index, 10));
    });
  })();

  /* ---------- лайтбокс ---------- */
  function renderLb() {
    if (!lightbox) return;
    lbImg.src = photos[lbIndex];
    lbImg.alt = 'Работа Impuls ' + (lbIndex + 1) + ' — реклама в Астане';
    lbCount.textContent = (lbIndex + 1) + ' / ' + photos.length;
    /* предзагрузка соседних */
    [lbIndex + 1, lbIndex - 1].forEach(function (idx) {
      if (idx >= 0 && idx < photos.length) {
        var im = new Image();
        im.src = photos[idx];
      }
    });
  }

  function openLightbox(i, trigger) {
    if (!lightbox || !photos.length) return;
    lbIndex = i;
    lbTrigger = trigger || null;
    renderLb();
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lightbox.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lbTrigger) {
      lbTrigger.focus({ preventScroll: true });
      lbTrigger = null;
    }
  }

  function stepLb(dir) {
    lbIndex = (lbIndex + dir + photos.length) % photos.length;
    renderLb();
  }

  if (lightbox) {
    $('#lbClose').addEventListener('click', closeLightbox);
    $('#lbPrev').addEventListener('click', function () { stepLb(-1); });
    $('#lbNext').addEventListener('click', function () { stepLb(1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    var lbX = 0;
    lightbox.addEventListener('touchstart', function (e) { lbX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - lbX;
      if (Math.abs(dx) > 50) stepLb(dx < 0 ? 1 : -1);
    });
  }

  /* ---------- модальное окно ---------- */
  var modal = $('#modal');
  var leadSelect = $('#leadService');
  var modalTrigger = null;

  function selectService(name) {
    if (!leadSelect || !name) return;
    for (var i = 0; i < leadSelect.options.length; i++) {
      if (leadSelect.options[i].text === name) {
        leadSelect.selectedIndex = i;
        return;
      }
    }
  }

  function openModal(trigger, service) {
    if (!modal) return;
    modalTrigger = trigger || document.activeElement;
    selectService(service);
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var first = $('#leadName');
    if (first) window.setTimeout(function () { first.focus(); }, 120);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (modalTrigger && typeof modalTrigger.focus === 'function') {
      modalTrigger.focus({ preventScroll: true });
    }
    modalTrigger = null;
  }

  $$('[data-open-modal]').forEach(function (b) {
    b.addEventListener('click', function () {
      openModal(b, b.getAttribute('data-service'));
    });
  });
  if (modal) {
    $('#modalClose').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  }

  /* ---------- клавиатура ---------- */
  function trapFocus(box, e) {
    var focusables = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', box)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  document.addEventListener('keydown', function (e) {
    if (lightbox && lightbox.classList.contains('is-open')) {
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (e.key === 'ArrowRight') { stepLb(1); return; }
      if (e.key === 'ArrowLeft') { stepLb(-1); return; }
      if (e.key === 'Tab') trapFocus(lightbox, e);
      return;
    }
    if (modal && modal.classList.contains('is-open')) {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab') trapFocus(modal, e);
      return;
    }
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu();
  });

  /* ---------- FAQ: открыт только один пункт ---------- */
  var faqItems = $$('.faq__item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------- заявка → WhatsApp ---------- */
  var form = $('#leadForm');
  if (form) {
    var nameEl = $('#leadName');
    var phoneEl = $('#leadPhone');
    var commentEl = $('#leadComment');
    var consentEl = $('#leadConsent');
    var fieldName = $('#fieldName');
    var fieldPhone = $('#fieldPhone');
    var consentWrap = $('#consentWrap');
    var errName = $('#errName');
    var errPhone = $('#errPhone');
    var errConsent = $('#errConsent');

    function setError(field, errEl, msg) {
      if (field) field.classList.add('is-invalid');
      if (errEl) { errEl.textContent = msg; errEl.classList.add('is-shown'); }
    }

    function clearErrors() {
      [fieldName, fieldPhone, consentWrap].forEach(function (el) {
        if (el) el.classList.remove('is-invalid');
      });
      [errName, errPhone, errConsent].forEach(function (el) {
        if (el) { el.textContent = ''; el.classList.remove('is-shown'); }
      });
    }

    function formatPhone(value) {
      var d = value.replace(/\D/g, '');
      if (!d) return '';
      if (d.charAt(0) === '8') d = '7' + d.slice(1);
      if (d.charAt(0) !== '7') d = '7' + d;
      d = d.slice(0, 11);
      if (d === '7') return '+7 ';
      return '+7' +
        (d.length > 1 ? ' (' + d.slice(1, 4) : '') +
        (d.length >= 5 ? ') ' + d.slice(4, 7) : '') +
        (d.length >= 8 ? '-' + d.slice(7, 9) : '') +
        (d.length >= 10 ? '-' + d.slice(9, 11) : '');
    }

    if (phoneEl) {
      phoneEl.addEventListener('input', function () {
        phoneEl.value = formatPhone(phoneEl.value);
        if (fieldPhone) fieldPhone.classList.remove('is-invalid');
        if (errPhone) errPhone.classList.remove('is-shown');
      });
    }
    if (nameEl) {
      nameEl.addEventListener('input', function () {
        if (fieldName) fieldName.classList.remove('is-invalid');
        if (errName) errName.classList.remove('is-shown');
      });
    }
    if (consentEl) {
      consentEl.addEventListener('change', function () {
        if (consentEl.checked && consentWrap) consentWrap.classList.remove('is-invalid');
        if (consentEl.checked && errConsent) errConsent.classList.remove('is-shown');
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();

      var name = nameEl ? nameEl.value.trim() : '';
      var phone = phoneEl ? phoneEl.value.trim() : '';
      var service = leadSelect ? leadSelect.value : '';
      var comment = commentEl ? commentEl.value.trim() : '';
      var consent = consentEl ? consentEl.checked : true;
      var firstInvalid = null;

      if (name.length < 2) {
        setError(fieldName, errName, 'Укажите имя — как к вам обращаться');
        firstInvalid = nameEl;
      }
      if (phone.replace(/\D/g, '').length < 11) {
        setError(fieldPhone, errPhone, 'Введите номер полностью: +7 705 111 62 11');
        if (!firstInvalid) firstInvalid = phoneEl;
      }
      if (!consent) {
        if (consentWrap) consentWrap.classList.add('is-invalid');
        if (errConsent) {
          errConsent.textContent = 'Отметьте согласие на обработку данных';
          errConsent.classList.add('is-shown');
        }
        if (!firstInvalid) firstInvalid = consentEl;
      }
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      var lines = [
        'Здравствуйте! Заявка с сайта Impuls.',
        'Имя: ' + name,
        'Телефон: ' + phone,
        'Услуга: ' + service
      ];
      if (comment) lines.push('Комментарий: ' + comment);

      var url = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(lines.join('\n'));
      window.open(url, '_blank', 'noopener');
      closeModal();
      form.reset();
    });
  }

  /* ---------- год в подвале ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
