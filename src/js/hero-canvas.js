"use strict";

(function () {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let W;
  let H;
  let dpr;

  const word = "thussenthan";
  let cellH;
  let charW;
  let fontSize;
  let cols;
  let rows;
  let gridW;
  let gridH;
  let textRows = [];

  let buf1;
  let buf2;
  let smoothBuf;
  const damping = 0.963;
  const aboutPage = document.querySelector('[data-page="about"]');

  let prevGx = -1;
  let prevGy = -1;
  let prevMx = -1;
  let prevMy = -1;
  let prevTime = 0;
  let dropletGx = -1;
  let dropletGy = -1;
  let isMouseDown = false;
  let rafId = null;

  function startFrame() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(frame);
  }

  function stopFrame() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const probeSize = 13;
    ctx.font = `400 ${probeSize}px TWKLausanne, Poppins, sans-serif`;
    const avgW = ctx.measureText(word).width / word.length;
    charW = Math.ceil(avgW * 1.06);
    cellH = charW;
    fontSize = probeSize;
    ctx.font = `400 ${fontSize}px TWKLausanne, Poppins, sans-serif`;

    cols = Math.ceil(W / charW) + 2;
    rows = Math.ceil(H / cellH) + 2;
    gridW = cols;
    gridH = rows;

    textRows = [];
    for (let r = 0; r < rows; r++) {
      let line = "";
      while (line.length < cols) line += word;
      textRows.push(line.substring(0, cols));
    }

    buf1 = new Float32Array(gridW * gridH);
    buf2 = new Float32Array(gridW * gridH);
    smoothBuf = new Float32Array(gridW * gridH);
  }

  function drop(cx, cy, radius, strength) {
    const r2 = radius * radius;
    const x0 = Math.max(0, cx - radius);
    const x1 = Math.min(gridW, cx + radius);
    const y0 = Math.max(0, cy - radius);
    const y1 = Math.min(gridH, cy + radius);

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 < r2) {
          buf1[y * gridW + x] += strength * (1 - d2 / r2);
        }
      }
    }
  }

  function stepWater() {
    for (let x = 0; x < gridW; x++) {
      buf1[x] = buf1[gridW + x];
      buf1[(gridH - 1) * gridW + x] = buf1[(gridH - 2) * gridW + x];
    }
    for (let y = 0; y < gridH; y++) {
      buf1[y * gridW] = buf1[y * gridW + 1];
      buf1[y * gridW + gridW - 1] = buf1[y * gridW + gridW - 2];
    }
    for (let y = 1; y < gridH - 1; y++) {
      for (let x = 1; x < gridW - 1; x++) {
        const i = y * gridW + x;
        buf2[i] =
          (buf1[i - 1] + buf1[i + 1] + buf1[i - gridW] + buf1[i + gridW]) *
            0.28 -
          buf2[i];
        buf2[i] *= damping;
      }
    }
    const tmp = buf1;
    buf1 = buf2;
    buf2 = tmp;
  }

  function frame() {
    if (
      document.visibilityState === "hidden" ||
      !aboutPage?.classList.contains("active")
    ) {
      stopFrame();
      return;
    }

    stepWater();
    ctx.clearRect(0, 0, W, H);
    ctx.font = `400 ${fontSize}px TWKLausanne, Poppins, sans-serif`;
    ctx.textBaseline = "top";
    ctx.textAlign = "center";

    for (let r = 0; r < rows; r++) {
      const line = textRows[r];
      const py = r * cellH;
      for (let c = 0; c < line.length; c++) {
        const i = r * gridW + c;
        smoothBuf[i] = smoothBuf[i] * 0.73 + Math.abs(buf1[i]) * 0.27;
        const s = smoothBuf[i] * 4.5;
        let brightness = s / (1 + s);

        if (dropletGx >= 0) {
          const dx = c - dropletGx;
          const dy = r - dropletGy;
          const d2 = dx * dx + dy * dy;
          if (d2 < 5) {
            brightness = Math.max(brightness, ((1 - d2 / 5) ** 2) * 0.95);
          }
        }

        if (brightness < 0.015) continue;
        ctx.fillStyle = `rgba(255,255,255,${brightness.toFixed(3)})`;
        ctx.fillText(line[c], c * charW + charW * 0.5, py);
      }
    }

    rafId = requestAnimationFrame(frame);
  }

  function runIntroDroplet() {
    const duration = 1500;
    const cx = Math.floor(gridW / 2);
    const targetY = Math.floor(gridH / 2);
    const start = performance.now();
    let lastCy = -1;

    function fallFrame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = t * t * t;
      const cy = Math.round(eased * targetY);

      dropletGx = cx;
      dropletGy = cy;

      if (cy !== lastCy && cy > 0 && cy < gridH) {
        buf1[cy * gridW + cx] += 0.1;
        lastCy = cy;
      }

      if (t < 1) {
        requestAnimationFrame(fallFrame);
        return;
      }

      dropletGx = -1;
      dropletGy = -1;
      const maxR = Math.floor(
        Math.min(cx, targetY, gridW - cx, gridH - targetY) * 0.88,
      );
      const crownR = Math.max(8, maxR);
      const nPts = 22;
      for (let i = 0; i < nPts; i++) {
        const a = (i / nPts) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
        const px = Math.round(cx + Math.cos(a) * crownR);
        const py = Math.round(targetY + Math.sin(a) * crownR);
        drop(px, py, 3, 5.5 + Math.random() * 0.8);
      }
      drop(cx, targetY, 2, 5.0);

      const reboundR = Math.floor(crownR * 0.38);
      setTimeout(() => {
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const px = Math.round(cx + Math.cos(a) * reboundR);
          const py = Math.round(targetY + Math.sin(a) * reboundR);
          drop(px, py, 1, 1.8);
        }
      }, 140);
    }

    requestAnimationFrame(fallFrame);
  }

  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const now = performance.now();
    const gx = Math.floor(mx / charW);
    const gy = Math.floor(my / cellH);

    if (prevGx >= 0) {
      const dx = mx - prevMx;
      const dy = my - prevMy;
      const dt = Math.max(now - prevTime, 1);
      const speed = Math.min((Math.sqrt(dx * dx + dy * dy) / dt) * 8, 1);
      const base = isMouseDown ? 0.45 : 0.2;
      const scale = isMouseDown ? 0.55 : 0.35;
      const strength = base + speed * scale;
      const radius = isMouseDown ? 2 : 1;
      const dist = Math.sqrt((gx - prevGx) ** 2 + (gy - prevGy) ** 2);
      const steps = Math.max(1, Math.ceil(dist / 1.5));

      for (let i = 0; i <= steps; i++) {
        const ix = Math.round(prevGx + ((gx - prevGx) * i) / steps);
        const iy = Math.round(prevGy + ((gy - prevGy) * i) / steps);
        drop(ix, iy, radius, strength);
      }
    } else {
      drop(gx, gy, 1, 0.2);
    }

    prevGx = gx;
    prevGy = gy;
    prevMx = mx;
    prevMy = my;
    prevTime = now;
  });

  canvas.addEventListener("mousedown", (event) => {
    isMouseDown = true;
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor((event.clientX - rect.left) / charW);
    const gy = Math.floor((event.clientY - rect.top) / cellH);
    const n = 10 + Math.floor(Math.random() * 4);
    const crownR = 4 + Math.random() * 2.5;

    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const cx = Math.round(gx + Math.cos(a) * crownR);
      const cy = Math.round(gy + Math.sin(a) * crownR);
      drop(
        cx,
        cy,
        1 + Math.round(Math.random()),
        1.6 + Math.random() * 0.9,
      );
    }

    setTimeout(() => {
      drop(gx, gy, 1, 1.8 + Math.random() * 0.6);
    }, 35);
  });

  canvas.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  canvas.addEventListener("mouseleave", () => {
    prevGx = -1;
    prevGy = -1;
    isMouseDown = false;
  });

  canvas.addEventListener(
    "touchstart",
    (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      const rect = canvas.getBoundingClientRect();
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;
      const gx = Math.floor(mx / charW);
      const gy = Math.floor(my / cellH);
      isMouseDown = true;
      const n = 10 + Math.floor(Math.random() * 4);
      const crownR = 4 + Math.random() * 2.5;

      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const cx = Math.round(gx + Math.cos(a) * crownR);
        const cy = Math.round(gy + Math.sin(a) * crownR);
        drop(
          cx,
          cy,
          1 + Math.round(Math.random()),
          1.6 + Math.random() * 0.9,
        );
      }

      setTimeout(() => {
        drop(gx, gy, 1, 1.8 + Math.random() * 0.6);
      }, 35);

      prevGx = gx;
      prevGy = gy;
      prevMx = mx;
      prevMy = my;
      prevTime = performance.now();
    },
    { passive: false },
  );

  canvas.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      const rect = canvas.getBoundingClientRect();
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;
      const now = performance.now();
      const gx = Math.floor(mx / charW);
      const gy = Math.floor(my / cellH);

      if (prevGx >= 0) {
        const dx = mx - prevMx;
        const dy = my - prevMy;
        const dt = Math.max(now - prevTime, 1);
        const speed = Math.min((Math.sqrt(dx * dx + dy * dy) / dt) * 8, 1);
        const strength = 0.45 + speed * 0.55;
        const dist = Math.sqrt((gx - prevGx) ** 2 + (gy - prevGy) ** 2);
        const steps = Math.max(1, Math.ceil(dist / 1.5));

        for (let i = 0; i <= steps; i++) {
          drop(
            Math.round(prevGx + ((gx - prevGx) * i) / steps),
            Math.round(prevGy + ((gy - prevGy) * i) / steps),
            2,
            strength,
          );
        }
      }

      prevGx = gx;
      prevGy = gy;
      prevMx = mx;
      prevMy = my;
      prevTime = now;
    },
    { passive: false },
  );

  canvas.addEventListener("touchend", () => {
    isMouseDown = false;
    prevGx = -1;
    prevGy = -1;
  });

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });

  function scheduleIdleDrop() {
    const delay = 2500 + Math.random() * 4000;
    setTimeout(() => {
      if (gridW > 0 && gridH > 0) {
        const gx = 2 + Math.floor(Math.random() * (gridW - 4));
        const gy = 2 + Math.floor(Math.random() * (gridH - 4));
        drop(gx, gy, 2, 0.25 + Math.random() * 0.3);
      }
      scheduleIdleDrop();
    }, delay);
  }

  function init() {
    resize();
    startFrame();
    setTimeout(runIntroDroplet, 200);
    setTimeout(scheduleIdleDrop, 6000);
  }

  document.addEventListener("pagechange", (event) => {
    if (event.detail?.page === "about") {
      startFrame();
    } else {
      stopFrame();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "visible" &&
      aboutPage?.classList.contains("active")
    ) {
      startFrame();
    }
  });

  if (document.fonts) {
    document.fonts.ready.then(init);
  } else {
    setTimeout(init, 200);
  }
})();
