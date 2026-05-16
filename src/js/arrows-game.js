"use strict";

if (!window.initArrowsGame) {
  let gameInitialized = false;
  const THEME_STORAGE_KEY = "arrows-game-theme";
  const THEMES = {
    light: {
      background: "#ffffff",
      guide: "rgba(17,17,17,0.07)",
      hunter: "#000000",
      hunterStroke: "rgba(0,0,0,0.72)",
      preyStroke: "rgba(0,0,0,0.12)",
      paintMode: "multiply",
    },
    dark: {
      background: "#111111",
      guide: "rgba(255,255,255,0.12)",
      hunter: "#ffffff",
      hunterStroke: "rgba(255,255,255,0.78)",
      preyStroke: "rgba(255,255,255,0.16)",
      paintMode: "screen",
    },
  };

  function readStoredTheme() {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch (error) {
      // Ignore storage access failures and fall back to the default theme.
    }

    return "dark";
  }

  window.initArrowsGame = function initArrowsGame() {
    if (gameInitialized) return;
    const canvas = document.getElementById("arrows-game-canvas");
    if (!canvas) return;
    gameInitialized = true;

    const ctx = canvas.getContext("2d");
    const paintCanvas = document.createElement("canvas");
    const paintCtx = paintCanvas.getContext("2d");
    const stage = canvas.closest(".arrows-game__stage");
    const themeToggleButton = document.querySelector("[data-game-theme-toggle]");
    const fullscreenButton = document.querySelector("[data-game-fullscreen]");
    const themeToggleIcon = themeToggleButton.querySelector("ion-icon");
    const fullscreenIcon = fullscreenButton.querySelector("ion-icon");
    let currentThemeName = readStoredTheme();
    let currentTheme = THEMES[currentThemeName];

    function syncThemeControls() {
      const isDark = currentThemeName === "dark";
      stage.dataset.theme = currentThemeName;
      themeToggleButton.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode",
      );
      themeToggleButton.setAttribute(
        "title",
        isDark ? "Switch to light mode" : "Switch to dark mode",
      );
      themeToggleIcon.setAttribute(
        "name",
        isDark ? "sunny-outline" : "moon-outline",
      );
    }

    function applyTheme(nextThemeName, persist = true) {
      currentThemeName = nextThemeName;
      currentTheme = THEMES[currentThemeName];
      syncThemeControls();

      for (const hunter of hunters) {
        hunter.color = currentTheme.hunter;
      }

      if (persist) {
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, currentThemeName);
        } catch (error) {
          // Ignore storage write failures.
        }
      }

      redrawPaint();
      draw();
    }

  const colors = [
    "#ff1744",
    "#ff4d6d",
    "#ff8a00",
    "#ffbe0b",
    "#ffd166",
    "#9ef01a",
    "#06d6a0",
    "#00f5d4",
    "#4cc9f0",
    "#4895ef",
    "#4361ee",
    "#7209b7",
    "#b517ff",
    "#f72585",
    "#fb5607",
    "#80ed99",
    "#c77dff",
  ];

  const hunters = [];
  const prey = [];
  const splashes = [];
  const preyGrid = new Map();
  const gridCellSize = 72;
  const pointer = {
    x: 0,
    y: 0,
    active: false,
    down: false,
    side: "right",
    spawnTimer: 0,
  };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let lastTime = performance.now();
  let colorIndex = 0;

  function resize() {
    const rect = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    paintCanvas.width = canvas.width;
    paintCanvas.height = canvas.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pointer.x = pointer.x || width * 0.72;
    pointer.y = pointer.y || height * 0.5;
    redrawPaint();
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function darkenHexColor(hex, mix = 0.35) {
    if (typeof hex !== "string" || !hex.startsWith("#")) return hex;

    const raw = hex.slice(1);
    const normalized =
      raw.length === 3
        ? raw
            .split("")
            .map((char) => char + char)
            .join("")
        : raw;

    if (normalized.length !== 6) return hex;

    const num = Number.parseInt(normalized, 16);
    if (Number.isNaN(num)) return hex;

    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const blend = (channel) => Math.round(channel * (1 - mix));
    return `rgb(${blend(r)}, ${blend(g)}, ${blend(b)})`;
  }

  function normalize(vector) {
    const length = Math.hypot(vector.x, vector.y) || 1;
    return { x: vector.x / length, y: vector.y / length };
  }

  function limitVelocity(arrow, maxSpeed) {
    const speed = Math.hypot(arrow.vx, arrow.vy);
    if (speed > maxSpeed) {
      arrow.vx = (arrow.vx / speed) * maxSpeed;
      arrow.vy = (arrow.vy / speed) * maxSpeed;
    }
  }

  function makeArrow(type, x, y) {
    const angleJitter =
      type === "hunter" ? rand(-0.35, 0.35) : rand(-0.38, 0.38);
    const angle = type === "hunter" ? angleJitter : Math.PI + angleJitter;
    const speed = type === "hunter" ? rand(4.0, 6.8) : rand(5.6, 8.8);
    const color =
      type === "hunter"
        ? currentTheme.hunter
        : colors[colorIndex++ % colors.length];
    return {
      type,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: type === "hunter" ? rand(3.2, 4.9) : rand(3.4, 5.1),
      color,
      splatterColor: color,
      orbit: rand(0, Math.PI * 2),
      orbitRadius: type === "hunter" ? rand(24, 96) : rand(12, 58),
      orbitSpeed: type === "hunter" ? rand(0.03, 0.075) : rand(0.065, 0.13),
      wave: rand(0, Math.PI * 2),
      alive: true,
    };
  }

  function spawn(side, amount = 1) {
    for (let i = 0; i < amount; i++) {
      const anchorY = pointer.active ? pointer.y : height * 0.5;
      const verticalChaos = Math.max(18, Math.min(74, height * 0.1));
      const spawnY = clamp(
        anchorY + rand(-verticalChaos, verticalChaos),
        24,
        height - 24,
      );
      if (side === "left") {
        hunters.push(makeArrow("hunter", rand(18, width * 0.18), spawnY));
      } else {
        prey.push(makeArrow("prey", rand(width * 0.82, width - 18), spawnY));
      }
    }
  }

  function getPointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const source = event.touches ? event.touches[0] || event.changedTouches[0] : event;
    return {
      x: clamp(source.clientX - rect.left, 0, width),
      y: clamp(source.clientY - rect.top, 0, height),
    };
  }

  function setPointer(event) {
    const pos = getPointerPosition(event);
    pointer.x = pos.x;
    pointer.y = pos.y;
    pointer.active = true;
    pointer.side = pos.x < width / 2 ? "left" : "right";
  }

  function splash(x, y, color, vx = 0, vy = 0) {
    const firstNewSplashIndex = splashes.length;
    const impactAngle =
      Math.hypot(vx, vy) > 0.01 ? Math.atan2(vy, vx) : rand(0, Math.PI * 2);
    const baseRadius = rand(18, 42);
    const stainCount = Math.floor(rand(3, 7));
    for (let i = 0; i < stainCount; i++) {
      const angle = impactAngle + rand(-1.25, 1.25);
      const distance =
        i === 0 ? 0 : Math.pow(Math.random(), 0.56) * baseRadius * rand(0.12, 1.4);
      const radius = baseRadius * rand(0.42, 1.18);
      const lobes = [];
      const lobeCount = Math.floor(rand(6, 18));
      for (let j = 0; j < lobeCount; j++) {
        const lobeAngle = angle + rand(-1.65, 1.65);
        lobes.push({
          x: Math.cos(lobeAngle) * radius * rand(0.08, 1.05),
          y: Math.sin(lobeAngle) * radius * rand(0.08, 1.05),
          radius: radius * rand(0.12, 0.7),
          rotation: rand(-0.12, 0.12),
          alpha: rand(0.035, 0.13),
        });
      }
      splashes.push({
        type: "stain",
        x: x + Math.cos(angle) * distance + rand(-5, 5),
        y: y + Math.sin(angle) * distance + rand(-5, 5),
        radius,
        rotation: impactAngle + rand(-0.9, 0.9),
        lobes,
        color: darkenHexColor(color, 0.06),
        coreColor: darkenHexColor(color, 0.2),
        coreAlpha: rand(0.08, 0.16),
        alpha: rand(0.08, 0.18),
      });
    }

    const streaks = Math.floor(rand(1, 4));
    for (let i = 0; i < streaks; i++) {
      const angle = impactAngle + rand(-0.55, 0.55);
      const distance = baseRadius * rand(0.55, 1.6);
      const beads = [];
      const beadCount = Math.floor(rand(2, 6));
      for (let j = 0; j < beadCount; j++) {
        const t = (j + Math.random() * 0.3) / beadCount;
        beads.push({
          x: Math.cos(angle) * distance * t + rand(-2, 2),
          y: Math.sin(angle) * distance * t + rand(-2, 2),
          radius: baseRadius * rand(0.03, 0.14) * (1 - t * 0.4),
          alpha: rand(0.045, 0.15) * (1 - t * 0.3),
        });
      }
      splashes.push({
        type: "spray",
        x: x + Math.cos(angle) * rand(3, 12),
        y: y + Math.sin(angle) * rand(3, 12),
        beads,
        color: darkenHexColor(color, 0.05),
      });
    }

    const droplets = Math.floor(rand(8, 28));
    for (let i = 0; i < droplets; i++) {
      const angle =
        Math.random() < 0.58
          ? impactAngle + rand(-1.55, 1.55)
          : rand(0, Math.PI * 2);
      const distance = Math.pow(Math.random(), 0.42) * baseRadius * rand(0.8, 2.55);
      splashes.push({
        type: "drop",
        x: x + Math.cos(angle) * distance + rand(-3, 3),
        y: y + Math.sin(angle) * distance + rand(-3, 3),
        radius: baseRadius * rand(0.035, 0.15),
        color: darkenHexColor(color, 0.08),
        alpha: rand(0.045, 0.2),
      });
    }

    drawPaintFrom(firstNewSplashIndex);
  }

  function nearestPrey(hunter) {
    if (prey.length > 80) {
      const localTarget = nearestGridPrey(hunter);
      if (localTarget) return localTarget;
      return sampledNearestPrey(hunter);
    }

    let closest = null;
    let closestDistance = Infinity;
    for (const target of prey) {
      const distance = Math.hypot(target.x - hunter.x, target.y - hunter.y);
      if (distance < closestDistance) {
        closest = target;
        closestDistance = distance;
      }
    }
    return closest;
  }

  function sampledNearestPrey(hunter) {
    let closest = null;
    let closestDistance = Infinity;
    const step = Math.max(1, Math.floor(prey.length / 48));
    for (let i = 0; i < prey.length; i += step) {
      const target = prey[i];
      const dx = target.x - hunter.x;
      const dy = target.y - hunter.y;
      const distance = dx * dx + dy * dy;
      if (distance < closestDistance) {
        closest = target;
        closestDistance = distance;
      }
    }
    return closest;
  }

  function nearestGridPrey(hunter) {
    let closest = null;
    let closestDistance = Infinity;
    const cellX = Math.floor(hunter.x / gridCellSize);
    const cellY = Math.floor(hunter.y / gridCellSize);

    for (let radius = 0; radius <= 5; radius++) {
      for (let gx = cellX - radius; gx <= cellX + radius; gx++) {
        for (let gy = cellY - radius; gy <= cellY + radius; gy++) {
          if (
            radius > 0 &&
            gx > cellX - radius &&
            gx < cellX + radius &&
            gy > cellY - radius &&
            gy < cellY + radius
          ) {
            continue;
          }

          const bucket = preyGrid.get(`${gx},${gy}`);
          if (!bucket) continue;

          for (const target of bucket) {
            if (!target.alive) continue;
            const dx = target.x - hunter.x;
            const dy = target.y - hunter.y;
            const distance = dx * dx + dy * dy;
            if (distance < closestDistance) {
              closest = target;
              closestDistance = distance;
            }
          }
        }
      }
      if (closest) return closest;
    }

    return null;
  }

  function buildPreyGrid() {
    preyGrid.clear();
    for (const target of prey) {
      if (!target.alive) continue;
      const gx = Math.floor(target.x / gridCellSize);
      const gy = Math.floor(target.y / gridCellSize);
      const key = `${gx},${gy}`;
      let bucket = preyGrid.get(key);
      if (!bucket) {
        bucket = [];
        preyGrid.set(key, bucket);
      }
      bucket.push(target);
    }
  }

  function flock(arrow, group, radius, strength) {
    let sx = 0;
    let sy = 0;
    let count = 0;
    for (const other of group) {
      if (other === arrow) continue;
      const dx = arrow.x - other.x;
      const dy = arrow.y - other.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0 && distance < radius) {
        sx += dx / distance;
        sy += dy / distance;
        count++;
      }
    }
    if (!count) return;
    arrow.vx += (sx / count) * strength;
    arrow.vy += (sy / count) * strength;
  }

  function steerToward(arrow, tx, ty, strength) {
    const desired = normalize({ x: tx - arrow.x, y: ty - arrow.y });
    arrow.vx += desired.x * strength;
    arrow.vy += desired.y * strength;
  }

  function updatePrey(dt) {
    const centerX = pointer.active ? pointer.x : width * 0.7;
    const centerY = pointer.active ? pointer.y : height * 0.5;
    const timeScale = dt / 16.67;

    for (let i = 0; i < prey.length; i++) {
      const arrow = prey[i];
      arrow.orbit += arrow.orbitSpeed * timeScale;
      arrow.wave += 0.045 * timeScale;

      const band = Math.max(28, Math.min(width, height) * 0.2);
      const tx =
        centerX +
        Math.cos(arrow.orbit + i * 0.33) *
          (arrow.orbitRadius + Math.sin(arrow.wave) * band * 0.12);
      const ty =
        centerY +
        Math.sin(arrow.orbit * 1.35 + i * 0.47) *
          (arrow.orbitRadius * 0.48 + band * 0.12);

      steerToward(arrow, tx, ty, 0.33);
      flock(arrow, prey, 15, 0.058);
      arrow.vx *= 0.976;
      arrow.vy *= 0.976;
      limitVelocity(arrow, 11.8);
      arrow.x += arrow.vx * timeScale;
      arrow.y += arrow.vy * timeScale;
      wrapArrow(arrow);
    }
  }

  function updateHunters(dt) {
    const timeScale = dt / 16.67;

    for (const hunter of hunters) {
      const target = nearestPrey(hunter);
      if (target) {
        steerToward(hunter, target.x, target.y, 0.14);
      } else {
        steerToward(hunter, width * 0.5, height * 0.5, 0.03);
      }

      flock(hunter, hunters, 17, 0.04);
      hunter.vx *= 0.99;
      hunter.vy *= 0.99;
      limitVelocity(hunter, 9.4);
      hunter.x += hunter.vx * timeScale;
      hunter.y += hunter.vy * timeScale;
      wrapArrow(hunter);
    }
  }

  function wrapArrow(arrow) {
    const recovery = Math.max(170, Math.min(width, height) * 0.42);
    const maxDistance = Math.max(width, height) * 0.65;
    const recoveryForce = arrow.type === "hunter" ? 0.115 : 0.145;
    const maxRecoveryForce = arrow.type === "hunter" ? 0.28 : 0.36;

    if (arrow.x < 0) {
      arrow.vx += Math.min(maxRecoveryForce, (-arrow.x / recovery) * recoveryForce);
    }
    if (arrow.x > width) {
      arrow.vx -= Math.min(
        maxRecoveryForce,
        ((arrow.x - width) / recovery) * recoveryForce,
      );
    }
    if (arrow.y < 0) {
      arrow.vy += Math.min(maxRecoveryForce, (-arrow.y / recovery) * recoveryForce);
    }
    if (arrow.y > height) {
      arrow.vy -= Math.min(
        maxRecoveryForce,
        ((arrow.y - height) / recovery) * recoveryForce,
      );
    }

    arrow.x = clamp(arrow.x, -maxDistance, width + maxDistance);
    arrow.y = clamp(arrow.y, -maxDistance, height + maxDistance);
  }

  function resolveCollisions() {
    for (const hunter of hunters) {
      for (const target of nearbyCollisionPrey(hunter)) {
        if (!target.alive) continue;
        const dx = hunter.x - target.x;
        const dy = hunter.y - target.y;
        const collisionDistance = hunter.size + target.size + 1.5;
        if (dx * dx + dy * dy < collisionDistance * collisionDistance) {
          target.alive = false;
          splash(
            (hunter.x + target.x) / 2,
            (hunter.y + target.y) / 2,
            target.splatterColor,
            hunter.vx - target.vx,
            hunter.vy - target.vy,
          );
          break;
        }
      }
    }

    prune(hunters);
    prune(prey);
  }

  function nearbyCollisionPrey(hunter) {
    if (prey.length <= 80) return prey;

    const nearby = [];
    const cellX = Math.floor(hunter.x / gridCellSize);
    const cellY = Math.floor(hunter.y / gridCellSize);

    for (let gx = cellX - 1; gx <= cellX + 1; gx++) {
      for (let gy = cellY - 1; gy <= cellY + 1; gy++) {
        const bucket = preyGrid.get(`${gx},${gy}`);
        if (bucket) nearby.push(...bucket);
      }
    }

    return nearby;
  }

  function prune(list) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (!list[i].alive) list.splice(i, 1);
    }
  }

  function drawBackground() {
    ctx.fillStyle = currentTheme.background;
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(paintCanvas, 0, 0, width, height);

    ctx.strokeStyle = currentTheme.guide;
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 13]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function redrawPaint() {
    paintCtx.clearRect(0, 0, width, height);
    for (const mark of splashes) {
      drawPaintMark(paintCtx, mark);
    }
  }

  function drawPaintFrom(startIndex) {
    for (let i = startIndex; i < splashes.length; i++) {
      drawPaintMark(paintCtx, splashes[i]);
    }
  }

  function drawPaintMark(renderCtx, mark) {
    renderCtx.save();
    renderCtx.globalCompositeOperation = currentTheme.paintMode;
    if (mark.type === "stain") {
      drawSoftBlob(
        renderCtx,
        mark.x,
        mark.y,
        mark.radius * 0.42,
        mark.coreColor,
        mark.coreAlpha,
        {
          rotation: mark.rotation * 0.4,
        },
      );
      drawSoftBlob(
        renderCtx,
        mark.x,
        mark.y,
        mark.radius,
        mark.color,
        mark.alpha,
        {
          rotation: mark.rotation,
        },
      );

      for (const lobe of mark.lobes) {
        drawSoftBlob(
          renderCtx,
          mark.x + lobe.x,
          mark.y + lobe.y,
          lobe.radius,
          mark.color,
          lobe.alpha,
          {
            rotation: mark.rotation + lobe.rotation,
          },
        );
      }
    } else if (mark.type === "spray") {
      drawSpray(renderCtx, mark);
    } else {
      drawSoftBlob(renderCtx, mark.x, mark.y, mark.radius, mark.color, mark.alpha);
    }
    renderCtx.restore();
  }

  function drawSoftBlob(renderCtx, x, y, radius, color, alpha, transform = {}) {
    const rotation = transform.rotation || 0;

    renderCtx.save();
    renderCtx.translate(x, y);
    renderCtx.rotate(rotation);
    const gradient = renderCtx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.28, color);
    gradient.addColorStop(0.72, color);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    renderCtx.globalAlpha = alpha;
    renderCtx.fillStyle = gradient;
    renderCtx.beginPath();
    renderCtx.arc(0, 0, radius, 0, Math.PI * 2);
    renderCtx.fill();
    renderCtx.restore();
  }

  function drawSpray(renderCtx, mark) {
    for (const bead of mark.beads) {
      drawSoftBlob(
        renderCtx,
        mark.x + bead.x,
        mark.y + bead.y,
        bead.radius,
        mark.color,
        bead.alpha,
      );
    }
  }

  function drawArrow(arrow) {
    const angle = Math.atan2(arrow.vy, arrow.vx);
    const length = arrow.size * 1.75;
    const half = arrow.size * 0.72;

    ctx.save();
    ctx.translate(arrow.x, arrow.y);
    ctx.rotate(angle);
    ctx.fillStyle = arrow.color;
    ctx.strokeStyle =
      arrow.type === "hunter"
        ? currentTheme.hunterStroke
        : currentTheme.preyStroke;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(length, 0);
    ctx.lineTo(-half, -half);
    ctx.lineTo(-half * 0.55, 0);
    ctx.lineTo(-half, half);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    drawBackground();
    for (const arrow of prey) drawArrow(arrow);
    for (const hunter of hunters) drawArrow(hunter);
  }

  function frame(now) {
    const dt = Math.min(34, now - lastTime);
    lastTime = now;

    if (pointer.down) {
      pointer.spawnTimer -= dt;
      if (pointer.spawnTimer <= 0) {
        spawn(pointer.side, 1);
        pointer.spawnTimer = 34;
      }
    }

    updatePrey(dt);
    buildPreyGrid();
    updateHunters(dt);
    resolveCollisions();
    draw();
    requestAnimationFrame(frame);
  }

  stage.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    setPointer(event);
    pointer.down = true;
    pointer.spawnTimer = 0;
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener("pointermove", (event) => {
    setPointer(event);
  });

  stage.addEventListener("pointerup", () => {
    pointer.down = false;
  });

  stage.addEventListener("pointercancel", () => {
    pointer.down = false;
  });

  stage.addEventListener("mouseleave", () => {
    pointer.down = false;
  });

  themeToggleButton.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  themeToggleButton.addEventListener("click", (event) => {
    event.stopPropagation();
    applyTheme(currentThemeName === "dark" ? "light" : "dark");
  });

  fullscreenButton.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  fullscreenButton.addEventListener("click", async (event) => {
    event.stopPropagation();
    if (document.fullscreenElement === stage) {
      await document.exitFullscreen();
    } else {
      await stage.requestFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", () => {
    const isFullscreen = document.fullscreenElement === stage;
    fullscreenButton.setAttribute(
      "aria-label",
      isFullscreen ? "Exit fullscreen" : "Enter fullscreen",
    );
    fullscreenButton.setAttribute(
      "title",
      isFullscreen ? "Exit fullscreen" : "Enter fullscreen",
    );
    fullscreenIcon.setAttribute(
      "name",
      isFullscreen ? "contract-outline" : "expand-outline",
    );
    requestAnimationFrame(resize);
  });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
  }

  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    link.addEventListener("click", () => {
      if (link.textContent.trim().toLowerCase() === "game") {
        requestAnimationFrame(resize);
      }
    });
  });

  window.addEventListener("resize", resize);

  syncThemeControls();
  resize();
  requestAnimationFrame(frame);
  };
}
