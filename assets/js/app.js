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

  /* ---------- шапка ---------- */
  var header = $('#header');
  var toTop = $('#toTop');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-stuck', y > 8);
    if (toTop) toTop.classList.toggle('is-visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- мобильное меню ---------- */
  var burger = $('#burger');
  var mobileMenu = $('#mobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', mobileMenu).forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
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

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) play();
  }

  /* ---------- галерея работ ---------- */
  var rail = $('#worksRail');
  var lightbox = $('#lightbox');
  var lbImg = $('#lbImg');
  var lbCount = $('#lbCount');
  var lbIndex = 0;
  var photos = [];

  if (rail) {
    var frag = document.createDocumentFragment();
    for (var i = 1; i <= WORK_COUNT; i++) {
      var src = 'assets/works/work-' + pad(i) + '.jpg';
      photos.push(src);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'work';
      btn.setAttribute('aria-label', 'Impuls · Астана — открыть фото ' + i);
      btn.dataset.index = String(i - 1);
      btn.innerHTML =
        '<img src="assets/works/thumb/work-' + pad(i) + '.jpg" alt="Работа Impuls ' + i + ' — вывеска в Астане" width="720" height="720" loading="lazy" decoding="async">' +
        '<span class="work__cap"><span>Impuls · Астана</span>' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/></svg></span>';
      frag.appendChild(btn);
    }
    rail.appendChild(frag);

    /* стрелки */
    var step = function () {
      return Math.max(rail.clientWidth * 0.8, 280);
    };
    var prev = $('#railPrev'), next = $('#railNext');
    if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); });

    /* перетаскивание мышью */
    var isDown = false, startX = 0, startLeft = 0, moved = 0;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      isDown = true; moved = 0;
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
      if (card) openLightbox(parseInt(card.dataset.index, 10));
    });
  }

  /* ---------- лайтбокс ---------- */
  function renderLb() {
    if (!lightbox) return;
    lbImg.src = photos[lbIndex];
    lbImg.alt = 'Работа Impuls ' + (lbIndex + 1);
    lbCount.textContent = (lbIndex + 1) + ' / ' + photos.length;
    /* предзагрузка соседних */
    [lbIndex + 1, lbIndex - 1].forEach(function (idx) {
      if (idx >= 0 && idx < photos.length) {
        var im = new Image();
        im.src = photos[idx];
      }
    });
  }

  function openLightbox(i) {
    if (!lightbox || !photos.length) return;
    lbIndex = i;
    renderLb();
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
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

  document.addEventListener('keydown', function (e) {
    if (lightbox && lightbox.classList.contains('is-open')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') stepLb(1);
      if (e.key === 'ArrowLeft') stepLb(-1);
    }
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) closeModal();
  });

  /* ---------- модальное окно ---------- */
  var modal = $('#modal');
  function openModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var first = $('#leadName');
    if (first) window.setTimeout(function () { first.focus(); }, 120);
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  $$('[data-open-modal]').forEach(function (b) { b.addEventListener('click', openModal); });
  if (modal) {
    $('#modalClose').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  }

  /* ---------- заявка → WhatsApp ---------- */
  var form = $('#leadForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = ($('#leadName').value || '').trim();
      var phone = ($('#leadPhone').value || '').trim();
      var service = $('#leadService').value;
      var comment = ($('#leadComment').value || '').trim();

      if (!name) { $('#leadName').focus(); return; }
      if (phone.replace(/\D/g, '').length < 10) { $('#leadPhone').focus(); return; }

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
