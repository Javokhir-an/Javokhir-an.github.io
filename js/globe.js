/* =========================================================================
   3D zarrachali globus: nuqtalar sferasi, uchib yuruvchi "maʼlumot yoylari",
   orbita halqasi va yulduzlar. Tashqi kutubxonasiz, oddiy Canvas 2D.
   ========================================================================= */
(function () {
  'use strict';
  var canvas = document.getElementById('globe');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 0, H = 0, DPR = 1, R = 100, CX = 0, CY = 0, FOV = 300;
  var mobile = false;

  /* --- Sfera nuqtalari (Fibonachchi taqsimoti) --- */
  var N = 1300;
  var PTS = new Float32Array(N * 3);
  var golden = Math.PI * (3 - Math.sqrt(5));
  for (var i = 0; i < N; i++) {
    var y = 1 - (i / (N - 1)) * 2;
    var r = Math.sqrt(1 - y * y);
    var th = golden * i;
    PTS[i * 3] = Math.cos(th) * r;
    PTS[i * 3 + 1] = y;
    PTS[i * 3 + 2] = Math.sin(th) * r;
  }

  /* --- Ranglar: moviy -> binafsha -> pushti --- */
  var C1 = [34, 211, 238], C2 = [167, 139, 250], C3 = [244, 114, 182];
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function grad(t) { return t < 0.5 ? mix(C1, C2, t * 2) : mix(C2, C3, (t - 0.5) * 2); }

  /* --- Maʼlumot yoylari (sfera ustidan uchadigan nur) --- */
  function randUnit() {
    var u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    return [s * Math.cos(t), u, s * Math.sin(t)];
  }
  function slerp(a, b, t) {
    var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    d = Math.max(-1, Math.min(1, d));
    var om = Math.acos(d);
    if (om < 1e-4) return a.slice();
    var so = Math.sin(om), k1 = Math.sin((1 - t) * om) / so, k2 = Math.sin(t * om) / so;
    return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
  }
  var SEG = 56;
  function makeArc(startRandom) {
    var a = randUnit(), b = randUnit(), tries = 0;
    while (tries++ < 30) {
      var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      if (d < 0.55 && d > -0.4) break;
      b = randUnit();
    }
    var path = [];
    for (var k = 0; k <= SEG; k++) {
      var t = k / SEG, p = slerp(a, b, t), lift = 1 + 0.28 * Math.sin(Math.PI * t);
      path.push([p[0] * lift, p[1] * lift, p[2] * lift]);
    }
    return {
      path: path,
      head: startRandom ? Math.random() * 1.6 : -Math.random() * 0.8,
      speed: 0.0045 + Math.random() * 0.0045,
      color: grad(Math.random())
    };
  }
  var ARCS = [];
  for (var a = 0; a < 16; a++) ARCS.push(makeArc(true));

  /* --- Orbita halqasi va yoʻldoshlar --- */
  var RING_N = 220, RING_R = 1.42, RING_TILT = 0.42;

  /* --- Yulduzlar --- */
  var STARS = [];
  for (var s = 0; s < 220; s++) {
    STARS.push({ x: Math.random(), y: Math.random(), z: Math.random() * 0.8 + 0.2, tw: Math.random() * Math.PI * 2 });
  }

  var rotY = 0.6, rotX = -0.32, offX = 0, offY = 0, mx = 0, my = 0, time = 0;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.max(1, Math.round(W * DPR));
    canvas.height = Math.max(1, Math.round(H * DPR));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    mobile = W < 860;
    if (mobile) {
      R = Math.min(W * 0.4, H * 0.24);
      CX = W * 0.62; CY = H * 0.2;
    } else {
      R = Math.min(W * 0.24, H * 0.36);
      CX = W * 0.72; CY = H * 0.5;
    }
    FOV = R * 3.4;
  }

  var cY, sY, cX, sX;
  var out = [0, 0, 0, 0];
  function project(x, y, z) {
    var x1 = x * cY - z * sY;
    var z1 = x * sY + z * cY;
    var y2 = y * cX - z1 * sX;
    var z2 = y * sX + z1 * cX;
    var k = FOV / (FOV + z2 * R);
    out[0] = CX + x1 * R * k;
    out[1] = CY + y2 * R * k;
    out[2] = z2;
    out[3] = k;
    return out;
  }

  function drawStars() {
    for (var i = 0; i < STARS.length; i++) {
      var st = STARS[i];
      var px = st.x * W - mx * 18 * st.z;
      var py = st.y * H - my * 12 * st.z;
      var al = 0.25 + 0.45 * st.z * (0.6 + 0.4 * Math.sin(time * 0.02 + st.tw));
      var sz = st.z * 1.3;
      ctx.fillStyle = 'rgba(200,215,255,' + al.toFixed(3) + ')';
      ctx.fillRect(px, py, sz, sz);
    }
  }

  function drawHalo() {
    var g = ctx.createRadialGradient(CX, CY, R * 0.2, CX, CY, R * 1.9);
    g.addColorStop(0, 'rgba(56,189,248,0.16)');
    g.addColorStop(0.45, 'rgba(139,92,246,0.08)');
    g.addColorStop(1, 'rgba(5,6,10,0)');
    ctx.fillStyle = g;
    ctx.fillRect(CX - R * 2, CY - R * 2, R * 4, R * 4);
  }

  function drawSphere() {
    for (var i = 0; i < N; i++) {
      var y = PTS[i * 3 + 1];
      var p = project(PTS[i * 3], y, PTS[i * 3 + 2]);
      var front = (1 - p[2]) * 0.5;               // 1 = oldinda, 0 = orqada
      var al = 0.06 + 0.8 * front * front;
      var sz = (0.55 + 1.55 * front) * p[3];
      var c = grad((1 - y) * 0.5);
      ctx.fillStyle = 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + al.toFixed(3) + ')';
      ctx.fillRect(p[0] - sz * 0.5, p[1] - sz * 0.5, sz, sz);
    }
  }

  function drawRing() {
    var ct = Math.cos(RING_TILT), st = Math.sin(RING_TILT);
    var spin = time * 0.0025;
    for (var i = 0; i < RING_N; i++) {
      var ang = (i / RING_N) * Math.PI * 2 + spin;
      var x = Math.cos(ang) * RING_R, z = Math.sin(ang) * RING_R;
      var y = -x * st, x2 = x * ct;            // halqani Z oʻqi atrofida qiyshaytirish
      var p = project(x2, y, z);
      var front = (1 - p[2] / RING_R) * 0.5;
      var al = 0.05 + 0.35 * front;
      ctx.fillStyle = 'rgba(167,139,250,' + al.toFixed(3) + ')';
      ctx.fillRect(p[0] - 0.6, p[1] - 0.6, 1.2, 1.2);
    }
    for (var m = 0; m < 3; m++) {
      var a2 = spin * 2.2 + m * (Math.PI * 2 / 3);
      var sx = Math.cos(a2) * RING_R, sz = Math.sin(a2) * RING_R;
      var q = project(sx * ct, -sx * st, sz);
      var fr = (1 - q[2] / RING_R) * 0.5;
      var rad = (2 + 2.2 * fr) * q[3];
      var g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], rad * 5);
      var col = m === 1 ? C3 : (m === 2 ? C2 : C1);
      g.addColorStop(0, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + (0.35 + 0.6 * fr).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(q[0], q[1], rad * 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * fr).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(q[0], q[1], rad * 0.7, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawArcs(step) {
    var TAIL = 0.35;
    ctx.lineCap = 'round';
    for (var i = 0; i < ARCS.length; i++) {
      var arc = ARCS[i];
      arc.head += arc.speed * step;
      if (arc.head - TAIL > 1) { ARCS[i] = makeArc(false); continue; }
      var hi = Math.min(SEG, Math.floor(arc.head * SEG));
      var lo = Math.max(0, Math.floor((arc.head - TAIL) * SEG));
      if (hi <= 0 || hi <= lo) continue;
      var prev = null;
      for (var k = lo; k <= hi; k++) {
        var pt = arc.path[k];
        var p = project(pt[0], pt[1], pt[2]);
        var cur = [p[0], p[1], p[2]];
        if (prev) {
          var tt = (k - lo) / Math.max(1, hi - lo);
          var front = (1 - (prev[2] + cur[2]) * 0.4) * 0.5;
          var al = tt * tt * (0.15 + 0.85 * Math.max(0, front));
          ctx.strokeStyle = 'rgba(' + (arc.color[0] | 0) + ',' + (arc.color[1] | 0) + ',' + (arc.color[2] | 0) + ',' + al.toFixed(3) + ')';
          ctx.lineWidth = 0.6 + 1.4 * tt;
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke();
        }
        prev = cur;
      }
      if (arc.head <= 1 && prev) {
        var g = ctx.createRadialGradient(prev[0], prev[1], 0, prev[0], prev[1], 9);
        g.addColorStop(0, 'rgba(255,255,255,0.9)');
        g.addColorStop(0.3, 'rgba(' + (arc.color[0] | 0) + ',' + (arc.color[1] | 0) + ',' + (arc.color[2] | 0) + ',0.55)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(prev[0], prev[1], 9, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  var last = 0;
  function render(now) {
    var step = last ? Math.min(3, (now - last) / 16.67) : 1;
    last = now;
    time += step;
    if (!reduceMotion) rotY += 0.0016 * step;
    offY += (mx * 0.45 - offY) * 0.04 * step;
    offX += (my * 0.22 - offX) * 0.04 * step;
    var ry = rotY + offY, rx = rotX + offX;
    cY = Math.cos(ry); sY = Math.sin(ry); cX = Math.cos(rx); sX = Math.sin(rx);

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    drawStars();
    drawHalo();
    ctx.globalCompositeOperation = 'lighter';
    drawRing();
    drawSphere();
    drawArcs(reduceMotion ? 0 : step);
    ctx.globalCompositeOperation = 'source-over';
  }

  var running = false, visible = true, rafId = 0;
  function loop(now) {
    if (!running) return;
    render(now);
    rafId = requestAnimationFrame(loop);
  }
  function start() {
    if (running || reduceMotion) return;
    running = true; last = 0;
    rafId = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(rafId); }
  function sync() { (visible && !document.hidden) ? start() : stop(); }

  window.addEventListener('pointermove', function (e) {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  window.addEventListener('resize', function () { resize(); if (reduceMotion) render(0); });
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }).observe(canvas);
  }

  resize();
  if (reduceMotion) render(0); else start();
})();
