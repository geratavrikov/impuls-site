/* Первый экран: «рулетка» из карточек работ. Центр — главная карточка, соседние уменьшаются.
   Листается стрелками, свайпом, мышью, клавишами ← →, по клику на карточку; автопрокрутка. */
(function () {
  var stage = document.getElementById('rouletteStage');
  if (!stage) return;
  var cards = Array.prototype.slice.call(stage.querySelectorAll('.rcard'));
  var n = cards.length;
  var countEl = document.getElementById('rouletteCount');
  var cur = 0, timer = null, prevD = [];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SCALE = [1, 0.86, 0.74, 0.64];
  var OPAC = [1, 0.95, 0.7, 0.35];

  function rel(i) {
    var d = i - cur;
    if (d > n / 2) d -= n;
    if (d <= -n / 2) d += n;
    return d;
  }

  function render() {
    var cw = cards[0].offsetWidth;
    var step = cw * 0.74;
    cards.forEach(function (c, i) {
      var d = rel(i), a = Math.abs(d);
      var jump = prevD[i] !== undefined && Math.abs(d - prevD[i]) > 1;
      if (jump) c.style.transition = 'none';
      var vis = a <= 3;
      var s = vis ? SCALE[a] : 0.6;
      var x = d * step + (d === 0 ? 0 : (d > 0 ? 1 : -1) * (cw * (1 - s)) * 0.0);
      c.style.transform = 'translateX(' + x + 'px) scale(' + s + ')';
      c.style.opacity = vis ? OPAC[a] : 0;
      c.style.zIndex = 10 - a;
      c.style.pointerEvents = vis ? 'auto' : 'none';
      c.classList.toggle('is-center', d === 0);
      c.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
      prevD[i] = d;
      if (jump) { void c.offsetWidth; c.style.transition = ''; }
    });
    if (countEl) countEl.textContent = (cur + 1 < 10 ? '0' : '') + (cur + 1) + ' / ' + (n < 10 ? '0' : '') + n;
  }

  function go(i, manual) {
    cur = ((i % n) + n) % n;
    render();
    if (manual) restart();
  }
  function play() { if (reduce) return; stop(); timer = window.setInterval(function () { go(cur + 1); }, 3800); }
  function stop() { window.clearInterval(timer); }
  function restart() { stop(); play(); }

  var prev = document.getElementById('roulettePrev');
  var next = document.getElementById('rouletteNext');
  if (prev) prev.addEventListener('click', function () { go(cur - 1, true); });
  if (next) next.addEventListener('click', function () { go(cur + 1, true); });

  /* drag / swipe */
  var sx = 0, dragging = false, moved = false;
  stage.addEventListener('pointerdown', function (e) {
    dragging = true; moved = false; sx = e.clientX; stop();
  });
  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    if (Math.abs(e.clientX - sx) > 8) { moved = true; stage.classList.add('is-drag'); }
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false; stage.classList.remove('is-drag');
    var dx = e.clientX - sx;
    if (moved && Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1), true); else play();
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', function () { dragging = false; stage.classList.remove('is-drag'); play(); });

  /* click on side card centers it */
  cards.forEach(function (c, i) {
    c.addEventListener('click', function () { if (moved) { moved = false; return; } if (i !== cur) go(i, true); });
  });

  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { go(cur - 1, true); e.preventDefault(); }
    if (e.key === 'ArrowRight') { go(cur + 1, true); e.preventDefault(); }
  });
  stage.addEventListener('mouseenter', stop);
  stage.addEventListener('mouseleave', play);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else play(); });
  window.addEventListener('resize', render);

  render();
  play();
})();
