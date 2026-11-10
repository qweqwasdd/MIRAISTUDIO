/* Отскок. Концепт MIRAI. Без библиотек и без сети: ничего не отправляется и не сохраняется. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var OPEN = 7, CLOSE = 23;
  var rub = function (n) { return n.toLocaleString('ru-RU') + ' ₽'; };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ---------- Статус «открыто» ---------- */
  function openStatus() {
    var node = $('openNow'); if (!node) return;
    var h = new Date().getHours();
    var open = h >= OPEN && h < CLOSE;
    node.textContent = open ? 'Сейчас открыто, до 23:00' : 'Сейчас закрыто. Откроемся в 7:00';
    node.classList.toggle('is-open', open);
  }

  /* ---------- Текст, который проявляется по словам ---------- */
  function sayWords() {
    var p = $('say'); if (!p) return;
    var words = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    words.forEach(function (w, i) {
      var s = el('span', 'w', w);
      s.style.setProperty('--i', i);
      p.appendChild(s);
      if (i < words.length - 1) p.appendChild(document.createTextNode(' '));
    });
  }

  /* ---------- Розыгрыш на первом экране ---------- */
  function rally(cv) {
    var ctx = cv.getContext && cv.getContext('2d'); if (!ctx) return;
    var root = getComputedStyle(document.documentElement);
    var BALL = '#f0e23c', LINE = 'rgba(250,251,255,.92)', SOFT = 'rgba(250,251,255,.5)';
    var cssBall = root.getPropertyValue('--ball').trim();
    var W = 0, H = 0, S = 1, ox = 0, oy = 0, land = false, dpr = 1;
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    var P = [
      { x: 2.8, y: 3.4, hx: 2.8, hy: 3.4, s: 0 }, { x: 7.2, y: 5.8, hx: 7.2, hy: 5.8, s: 0 },
      { x: 2.8, y: 14.2, hx: 2.8, hy: 14.2, s: 1 }, { x: 7.2, y: 16.6, hx: 7.2, hy: 16.6, s: 1 }
    ];
    var B = { x: 5, y: 10, vx: 0, vy: 0, last: -1, walls: 0, alive: false };
    var trail = [], fx = [], wait = 0.4, R = 0.22;

    function hit(p) {
      var far = p.s === 0;
      var tx = rnd(1.2, 8.8), ty = far ? rnd(13.5, 22.5) : rnd(-2.5, 6.5);
      if (Math.random() < 0.3) tx = Math.random() < 0.5 ? -rnd(1, 4) : 10 + rnd(1, 4);
      var dx = tx - B.x, dy = ty - B.y, d = Math.hypot(dx, dy) || 1, v = rnd(9.5, 13);
      B.vx = dx / d * v; B.vy = dy / d * v; B.last = p.s; B.walls = 0;
      fx.push({ t: 0, k: 'ring', x: p.x, y: p.y });
    }
    function serve() {
      var p = P[(Math.random() < 0.5 ? 0 : 2) + (Math.random() < 0.5 ? 0 : 1)];
      B.x = p.x; B.y = p.y; B.alive = true; trail.length = 0; hit(p);
    }
    function wall(horizontal) {
      B.walls++; B.vx *= 0.84; B.vy *= 0.84;
      fx.push({ t: 0, k: 'wall', x: B.x, y: B.y, h: horizontal });
    }
    function step(dt) {
      var i, p;
      for (i = fx.length - 1; i >= 0; i--) { fx[i].t += dt; if (fx[i].t > 0.55) fx.splice(i, 1); }
      if (!B.alive) {
        wait -= dt;
        for (i = 0; i < 4; i++) move(P[i], P[i].hx, P[i].hy, 3.5, dt);
        if (wait <= 0) serve();
        return;
      }
      B.x += B.vx * dt; B.y += B.vy * dt;
      if (B.x < R) { B.x = R; B.vx = -B.vx; wall(false); }
      if (B.x > 10 - R) { B.x = 10 - R; B.vx = -B.vx; wall(false); }
      if (B.y < R) { B.y = R; B.vy = -B.vy; wall(true); }
      if (B.y > 20 - R) { B.y = 20 - R; B.vy = -B.vy; wall(true); }
      var side = B.y < 10 ? 0 : 1, a = P[side * 2], b = P[side * 2 + 1];
      var chaser = B.last !== side ? (Math.abs(a.x - B.x) <= Math.abs(b.x - B.x) ? a : b) : null;
      for (i = 0; i < 4; i++) {
        p = P[i];
        if (p === chaser) move(p, B.x, Math.min(Math.max(B.y, side ? 10.9 : 0.9), side ? 19.1 : 9.1), 7.5, dt);
        else move(p, p.hx, p.hy, 3.5, dt);
      }
      if (chaser && Math.hypot(chaser.x - B.x, chaser.y - B.y) < 0.85) hit(chaser);
      trail.push(B.x, B.y); if (trail.length > 92) trail.splice(0, 2);
      if (B.walls >= 3 || Math.hypot(B.vx, B.vy) < 2.4) { B.alive = false; wait = 0.9; }
    }
    function move(p, tx, ty, sp, dt) {
      var dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      if (d < 0.01) return;
      var m = Math.min(d, sp * dt); p.x += dx / d * m; p.y += dy / d * m;
    }
    function X(x, y) { return land ? ox + y * S : ox + x * S; }
    function Y(x, y) { return land ? oy + x * S : oy + y * S; }
    function seg(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(X(x1, y1), Y(x1, y1)); ctx.lineTo(X(x2, y2), Y(x2, y2)); ctx.stroke(); }
    function draw() {
      var i, n, f, k;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'butt';
      ctx.strokeStyle = LINE; ctx.lineWidth = 3;
      ctx.strokeRect(X(0, 0), Y(0, 0), (land ? 20 : 10) * S, (land ? 10 : 20) * S);
      ctx.lineWidth = 2; ctx.strokeStyle = SOFT;
      seg(0, 3.05, 10, 3.05); seg(0, 16.95, 10, 16.95); seg(5, 3.05, 5, 16.95);
      ctx.strokeStyle = LINE; ctx.lineWidth = 5; seg(0, 10, 10, 10);

      ctx.strokeStyle = BALL; if (cssBall) ctx.strokeStyle = cssBall;
      ctx.lineCap = 'round';
      n = trail.length / 2;
      for (i = 1; i < n; i++) {
        ctx.globalAlpha = (i / n) * 0.85; ctx.lineWidth = 1 + (i / n) * 2.5;
        seg(trail[i * 2 - 2], trail[i * 2 - 1], trail[i * 2], trail[i * 2 + 1]);
      }
      for (i = 0; i < fx.length; i++) {
        f = fx[i]; k = f.t / 0.55; ctx.globalAlpha = 1 - k;
        if (f.k === 'wall') {
          ctx.lineWidth = 6;
          if (f.h) seg(f.x - 1.1 - k, f.y, f.x + 1.1 + k, f.y); else seg(f.x, f.y - 1.1 - k, f.x, f.y + 1.1 + k);
        } else {
          ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(f.x, f.y), Y(f.x, f.y), (0.4 + k * 0.9) * S, 0, 6.2832); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = LINE;
      for (i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(X(P[i].x, P[i].y), Y(P[i].x, P[i].y), Math.max(5, 0.33 * S), 0, 6.2832); ctx.fill(); }
      if (B.alive) {
        ctx.fillStyle = BALL; if (cssBall) ctx.fillStyle = cssBall;
        ctx.beginPath(); ctx.arc(X(B.x, B.y), Y(B.x, B.y), Math.max(4.5, 0.24 * S), 0, 6.2832); ctx.fill();
      }
    }
    function size() {
      var r = cv.parentNode.getBoundingClientRect();
      W = r.width; H = r.height; if (!W || !H) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      land = W > H * 1.05;
      var m = Math.max(18, Math.min(W, H) * 0.09);
      S = land ? Math.min((W - 2 * m) / 20, (H - 2 * m) / 10) : Math.min((W - 2 * m) / 10, (H - 2 * m) / 20);
      ox = (W - (land ? 20 : 10) * S) / 2; oy = (H - (land ? 10 : 20) * S) / 2;
      draw();
    }
    var on = false, seen = true, prev = 0;
    function frame(t) {
      if (!on) return;
      var dt = Math.min(0.034, (t - prev) / 1000 || 0.016); prev = t;
      step(dt); draw(); requestAnimationFrame(frame);
    }
    function sync() {
      var should = seen && !document.hidden && !reduce;
      if (should && !on) { on = true; prev = performance.now(); requestAnimationFrame(frame); }
      else if (!should) on = false;
    }
    if (reduce) { for (var q = 0; q < 150; q++) step(0.016); }
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(cv.parentNode); else window.addEventListener('resize', size);
    size();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { seen = e[0].isIntersecting; sync(); }).observe(cv);
    document.addEventListener('visibilitychange', sync);
    sync();
  }

  /* ---------- Бронь ---------- */
  var COURTS = [
    { n: 'Корт 1', k: 'панорамный', m: 1 },
    { n: 'Корт 2', k: 'панорамный', m: 1 },
    { n: 'Корт 3', k: 'классический', m: 1 },
    { n: 'Корт 4', k: 'сингл', m: 0.7 }
  ];
  var WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  var MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var HINT = 'Нажмите на свободное время. Можно взять от одного до трёх часов подряд на одном корте.';
  var st = { date: null, court: -1, hours: [], rackets: 0, balls: false, coach: false, tab: 0, total: 0, done: false };

  var isWe = function (d) { var w = d.getDay(); return w === 0 || w === 6; };
  var zone = function (d, h) { return isWe(d) ? 3 : h < 12 ? 1 : h < 17 ? 2 : 3; };
  var price = function (d, c, h) { var z = zone(d, h); return Math.round((z === 1 ? 1800 : z === 2 ? 2200 : 3000) * COURTS[c].m / 10) * 10; };
  var key = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  function taken(d, c, h) {
    var s = key(d) + '|' + c + '|' + h, x = 2166136261, i;
    for (i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
    var u = ((x >>> 0) % 1000) / 1000, z = zone(d, h);
    return u < (z === 3 ? 0.48 : z === 2 ? 0.22 : 0.12);
  }
  function sameDay(a, b) { return key(a) === key(b); }

  function booking() {
    var box = $('bk'); if (!box) return;
    box.hidden = false;
    var dates = $('bkDates'), tabs = $('bkTabs'), grid = $('bkGrid'), hint = $('bkHint');
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var first = new Date(today);
    if (new Date().getHours() >= CLOSE - 1) first.setDate(first.getDate() + 1);
    st.date = first;

    for (var i = 0; i < 14; i++) {
      var d = new Date(first); d.setDate(first.getDate() + i);
      var b = el('button', 'd' + (isWe(d) ? ' we' : ''));
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
      b.setAttribute('aria-label', WD[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()]);
      b.dataset.t = d.getTime();
      b.appendChild(el('small', '', sameDay(d, today) ? 'сегодня' : WD[d.getDay()]));
      b.appendChild(el('b', '', d.getDate()));
      dates.appendChild(b);
    }
    dates.addEventListener('click', function (e) {
      var t = e.target.closest('.d'); if (!t) return;
      [].forEach.call(dates.children, function (n) { n.setAttribute('aria-checked', n === t ? 'true' : 'false'); });
      st.date = new Date(+t.dataset.t); st.court = -1; st.hours = [];
      render(); summary(); say(HINT);
    });

    COURTS.forEach(function (c, i) {
      var t = el('button', 'tab', c.n);
      t.type = 'button'; t.setAttribute('role', 'tab'); t.dataset.c = i;
      tabs.appendChild(t);
    });
    tabs.addEventListener('click', function (e) {
      var t = e.target.closest('.tab'); if (!t) return;
      setTab(+t.dataset.c);
    });

    grid.addEventListener('click', function (e) {
      var c = e.target.closest('.c'); if (!c || c.disabled) return;
      pick(+c.dataset.c, +c.dataset.h);
    });

    function say(text, warn) { hint.textContent = text; hint.classList.toggle('warn', !!warn); }

    function setTab(i) {
      st.tab = i;
      [].forEach.call(tabs.children, function (n, k) { n.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      [].forEach.call(grid.children, function (n, k) { n.classList.toggle('on', k === i); });
    }
    booking.setTab = setTab;

    function render() {
      var now = new Date(), isToday = sameDay(st.date, now), n = 0;
      grid.textContent = '';
      COURTS.forEach(function (c, ci) {
        var row = el('div', 'row' + (ci === st.tab ? ' on' : ''));
        row.setAttribute('role', 'group'); row.setAttribute('aria-label', c.n + ', ' + c.k);
        var l = el('div', 'row-l', c.n); l.appendChild(el('small', '', c.k)); row.appendChild(l);
        for (var h = OPEN; h < CLOSE; h++) {
          var past = isToday && h <= now.getHours();
          var off = past || taken(st.date, ci, h);
          var b = el('button', 'c z' + zone(st.date, h));
          b.type = 'button'; b.dataset.c = ci; b.dataset.h = h; b.disabled = off;
          b.setAttribute('aria-pressed', 'false');
          b.setAttribute('aria-label', c.n + ', ' + h + ':00, ' + (off ? (past ? 'время прошло' : 'занято') : price(st.date, ci, h) + ' рублей'));
          b.style.setProperty('--n', n++ % 16 + ci * 2);
          var s = el('span', '', h); s.appendChild(el('small', '', ':00')); b.appendChild(s);
          row.appendChild(b);
        }
        grid.appendChild(row);
      });
      grid.classList.remove('swap'); void grid.offsetWidth; grid.classList.add('swap');
    }

    function pick(c, h) {
      var hs = st.hours, lo = hs[0], hi = hs[hs.length - 1];
      say(HINT);
      if (st.court !== c || !hs.length) { st.court = c; st.hours = [h]; }
      else if (hs.length === 1 && h === lo) { st.court = -1; st.hours = []; }
      else if (h === lo) hs.shift();
      else if (h === hi) hs.pop();
      else if (h === lo - 1 || h === hi + 1) {
        if (hs.length >= 3) say('Онлайн можно взять не больше трёх часов подряд. Для длинной игры или турнира позвоните администратору.', true);
        else if (h < lo) hs.unshift(h); else hs.push(h);
      } else { st.hours = [h]; }
      paint(); summary();
    }

    function paint() {
      [].forEach.call(grid.querySelectorAll('.c'), function (b) {
        var onNow = +b.dataset.c === st.court && st.hours.indexOf(+b.dataset.h) > -1;
        b.setAttribute('aria-pressed', onNow ? 'true' : 'false');
      });
    }

    /* Сводка */
    var rows = $('tkRows'), empty = $('tkEmpty'), totalRow = $('tkTotalRow'), totalEl = $('tkTotal');
    var bar = $('bar'), barWhat = $('barWhat'), barSum = $('barSum'), sideSeen = false;
    function line(a, b) { var d = el('div'); d.appendChild(el('dt', '', a)); d.appendChild(el('dd', '', b)); rows.appendChild(d); }
    function when() { return st.hours[0] + ':00-' + (st.hours[st.hours.length - 1] + 1) + ':00'; }
    function dayText() { return WD[st.date.getDay()] + ', ' + st.date.getDate() + ' ' + MON[st.date.getMonth()]; }
    function tween(to) {
      var from = st.total; st.total = to;
      if (reduce || from === to) { totalEl.textContent = rub(to); return; }
      var t0 = performance.now();
      (function f(t) {
        var k = Math.min(1, (t - t0) / 380), e = 1 - Math.pow(1 - k, 4);
        totalEl.textContent = rub(Math.round((from + (to - from) * e) / 10) * 10);
        if (k < 1 && st.total === to) requestAnimationFrame(f);
      })(t0);
    }
    function summary() {
      var has = st.hours.length > 0, sum = 0;
      rows.textContent = '';
      empty.hidden = has; rows.hidden = !has; totalRow.hidden = !has;
      if (has) {
        var court = st.hours.reduce(function (s, h) { return s + price(st.date, st.court, h); }, 0);
        sum = court;
        line('Дата', dayText());
        line('Корт', COURTS[st.court].n + ', ' + COURTS[st.court].k);
        line('Время', when());
        line('Аренда корта', rub(court));
        if (st.rackets) { line('Ракетки, ' + st.rackets + ' шт.', rub(st.rackets * 300)); sum += st.rackets * 300; }
        if (st.balls) { line('Банка мячей', rub(600)); sum += 600; }
        if (st.coach) { line('Тренер, первый час', rub(2500)); sum += 2500; }
        barWhat.textContent = COURTS[st.court].n + ', ' + when();
        barSum.textContent = rub(sum);
        $('eSlot').hidden = true;
      }
      tween(sum);
      syncBar();
    }
    function syncBar() { bar.hidden = !(st.hours.length && !sideSeen && !st.done); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { sideSeen = e[0].isIntersecting; syncBar(); }, { threshold: 0.15 }).observe($('bkSide'));
    }

    /* Допы */
    var rkCount = $('rkCount'), rkMinus = $('rkMinus'), rkPlus = $('rkPlus');
    function rk(n) {
      st.rackets = Math.max(0, Math.min(4, n));
      rkCount.textContent = st.rackets; rkMinus.disabled = st.rackets === 0; rkPlus.disabled = st.rackets === 4;
      summary();
    }
    rkMinus.addEventListener('click', function () { rk(st.rackets - 1); });
    rkPlus.addEventListener('click', function () { rk(st.rackets + 1); });
    $('exBalls').addEventListener('change', function (e) { st.balls = e.target.checked; summary(); });
    $('exCoach').addEventListener('change', function (e) { st.coach = e.target.checked; summary(); });
    [].forEach.call(document.querySelectorAll('[data-coach]'), function (a) {
      a.addEventListener('click', function () { $('exCoach').checked = true; st.coach = true; summary(); });
    });

    /* Форма: проверка и имитация отправки */
    var form = $('bkForm'), fName = $('fName'), fPhone = $('fPhone'), fAgree = $('fAgree'), submit = $('bkSubmit'), done = $('bkDone');
    function fail(input, errId, msg) {
      var e = $(errId); e.textContent = msg || ''; e.hidden = !msg;
      if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (errId === 'ePhone') $('hPhone').hidden = !!msg; /* ошибка занимает место подсказки, вёрстка не прыгает под пальцем */
      return !msg;
    }
    function digits() { var v = fPhone.value.replace(/\D/g, ''); if (v[0] === '8') v = '7' + v.slice(1); if (v[0] === '9') v = '7' + v; return v.slice(0, 11); }
    fPhone.addEventListener('input', function () {
      var v = digits(); if (!v) { fPhone.value = ''; return; }
      var o = '+7'; v = v.slice(1);
      if (v.length) o += ' (' + v.slice(0, 3);
      if (v.length >= 3) o += ') ' + v.slice(3, 6);
      if (v.length > 6) o += '-' + v.slice(6, 8);
      if (v.length > 8) o += '-' + v.slice(8, 10);
      fPhone.value = o;
      if (digits().length === 11) fail(fPhone, 'ePhone', '');
    });
    fName.addEventListener('input', function () { if (fName.getAttribute('aria-invalid') === 'true') fail(fName, 'eName', ''); });
    fPhone.addEventListener('blur', function () { if (fPhone.value && digits().length < 11) fail(fPhone, 'ePhone', 'Нужен полный номер: 10 цифр после +7.'); else fail(fPhone, 'ePhone', ''); });
    fAgree.addEventListener('change', function () { if (fAgree.checked) fail(null, 'eAgree', ''); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submit.getAttribute('aria-busy') === 'true') return;
      var name = fName.value.trim(), bad = null;
      var okSlot = fail(null, 'eSlot', st.hours.length ? '' : 'Сначала выберите время в таблице.');
      var okName = fail(fName, 'eName', /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё \-]{1,39}$/.test(name) ? '' : 'Напишите имя буквами, минимум две.');
      var okPhone = fail(fPhone, 'ePhone', digits().length === 11 ? '' : 'Нужен полный номер: 10 цифр после +7.');
      var okAgree = fail(null, 'eAgree', fAgree.checked ? '' : 'Без согласия бронь оформить нельзя.');
      if (!okName) bad = fName; else if (!okPhone) bad = fPhone; else if (!okAgree) bad = fAgree;
      if (!okSlot && !bad) { $('bkGrid').scrollIntoView({ block: 'center' }); return; }
      if (bad) { bad.focus(); return; }
      submit.setAttribute('aria-busy', 'true');
      submit.firstElementChild.textContent = 'Проверяем время…';
      window.setTimeout(function () {
        $('doneName').textContent = name;
        $('doneSum').textContent = COURTS[st.court].n + ', ' + dayText() + ', ' + when() + '. Итого ' + rub(st.total) + '. Код брони: ОТ-' + (1000 + Math.floor(Math.random() * 9000)) + '.';
        form.reset(); form.hidden = true; done.hidden = false; st.done = true; syncBar();
        submit.removeAttribute('aria-busy'); submit.firstElementChild.textContent = 'Забронировать корт';
        done.focus({ preventScroll: true });
        done.scrollIntoView({ block: 'nearest' });
      }, reduce ? 300 : 1150);
    });
    $('bkAgain').addEventListener('click', function () {
      st.court = -1; st.hours = []; st.done = false; $('exBalls').checked = false; $('exCoach').checked = false; st.balls = st.coach = false;
      done.hidden = true; form.hidden = false; rk(0); paint(); say(HINT);
      $('bkGrid').scrollIntoView({ block: 'center' });
    });

    setTab(0); render(); rk(0);
  }

  /* ---------- Схема зала ---------- */
  var INFO = [
    { n: 'Корт 1', k: 'Панорамный', t: 'Виден из кафе, поэтому здесь проходят турниры и игры со зрителями.', s: '20 × 10 м', f: 'Двое на двое', p: '3 000 ₽ в час' },
    { n: 'Корт 2', k: 'Панорамный', t: 'Самый тихий корт в глубине зала. Его выбирают для длинных игр своей компанией.', s: '20 × 10 м', f: 'Двое на двое', p: '3 000 ₽ в час' },
    { n: 'Корт 3', k: 'Классический', t: 'Корт для тренировок: рядом стоит пушка, которая подаёт мячи в одну точку.', s: '20 × 10 м', f: 'Двое на двое', p: '3 000 ₽ в час' },
    { n: 'Корт 4', k: 'Сингл', t: 'Узкий корт для игры один на один и занятий с тренером.', s: '20 × 6 м', f: 'Один на один', p: '2 100 ₽ в час' }
  ];
  function plan() {
    var list = document.querySelectorAll('.pc'), info = $('planInfo'), cur = 0; if (!list.length) return;
    function show(i) {
      cur = i;
      [].forEach.call(list, function (g, k) { g.classList.toggle('on', k === i); g.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      var d = INFO[i];
      $('pcName').textContent = d.n; $('pcKind').textContent = d.k; $('pcText').textContent = d.t;
      $('pcSize').textContent = d.s; $('pcFormat').textContent = d.f; $('pcPrice').textContent = d.p;
      info.classList.remove('swap'); void info.offsetWidth; info.classList.add('swap');
    }
    [].forEach.call(list, function (g, i) {
      g.addEventListener('click', function () { show(i); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); } });
    });
    $('pcBook').addEventListener('click', function () { if (booking.setTab) booking.setTab(cur); });
  }

  /* ---------- Шкала цен ---------- */
  function prices() {
    var tl = $('tl'); if (!tl) return;
    var work = $('segWork'), week = $('segWeek'), now = $('tlNow'), txt = $('prNow');
    function mode(we) {
      tl.classList.toggle('week', we);
      work.classList.toggle('on', !we); week.classList.toggle('on', we);
      work.setAttribute('aria-pressed', String(!we)); week.setAttribute('aria-pressed', String(we));
      $('tlP1').textContent = rub(we ? 3000 : 1800); $('tlP2').textContent = rub(we ? 3000 : 2200); $('tlP3').textContent = rub(3000);
    }
    work.addEventListener('click', function () { mode(false); });
    week.addEventListener('click', function () { mode(true); });
    function tick() {
      var d = new Date(), h = d.getHours() + d.getMinutes() / 60, open = h >= OPEN && h < CLOSE;
      now.hidden = !open;
      if (!open) { txt.textContent = 'Сейчас клуб закрыт. Откроемся в 7:00.'; return; }
      now.style.left = ((h - OPEN) / (CLOSE - OPEN) * 100).toFixed(2) + '%';
      var z = zone(d, d.getHours());
      txt.textContent = 'Сейчас ' + d.getHours() + ':' + pad(d.getMinutes()) + ', ' + (isWe(d) ? 'выходной' : 'будний день') + ': ' +
        (z === 1 ? 'утренний' : z === 2 ? 'дневной' : 'вечерний') + ' тариф, ' + rub(z === 1 ? 1800 : z === 2 ? 2200 : 3000) + ' в час.';
    }
    mode(isWe(new Date())); tick(); window.setInterval(function () { tick(); openStatus(); }, 60000);
  }

  /* ---------- Карта: проявляется, когда доходит до экрана ---------- */
  function cityMap() {
    var m = $('map'); if (!m) return;
    [].forEach.call(m.querySelectorAll('.mb'), function (r, i) { r.style.setProperty('--n', i); });
    if (reduce || !('IntersectionObserver' in window)) { m.classList.add('in'); return; }
    var io = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { m.classList.add('in'); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(m);
  }

  openStatus(); sayWords(); booking(); plan(); prices(); cityMap();
  var cv = $('rally'); if (cv) rally(cv);
})();
