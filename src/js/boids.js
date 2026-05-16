class Boid {
  constructor(width, height) {
    this.radius = 3;
    this.maxSpeed = 2.0 + Math.random() * 1.5;
    this.maxForce = 0.04 + Math.random() * 0.03;
    
    this.offsetAngle = Math.random() * Math.PI * 2;
    this.offsetRadius = 20 + Math.random() * 35;
    this.offsetSpeed = 0.01 + Math.random() * 0.03;
    
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.flapOffset = Math.random() * Math.PI * 2;
    this.individualOpacity = 0;
    this.exitWaypoint = null;
    
    this.reset(width, height);
  }

  reset(width, height) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.prevX = this.x;
    this.prevY = this.y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.layer = 'bg';
    this.individualOpacity = 0;
    this.exitWaypoint = null;
  }

  update(boids, mouse, state, width, height, contentRects) {
    let separation = this.separate(boids);
    let alignment = {x:0, y:0};
    let cohesion = {x:0, y:0};
    let attraction = {x:0, y:0};
    let wander = {x:0, y:0};
    let drafting = {x:0, y:0};
    
    this.flapOffset += 0.2; 

    let maxF = this.maxForce;
    let maxS = this.maxSpeed;
    
    let sw = 2.5; 
    let aw = 1.0; 
    let cw = 1.0; 
    let mw = 1.75;
    let dw = 0.5; 

    if (state === 'IDLE_BG') {
      maxF = 0.015;
      maxS = 1.5 + Math.random() * 0.5;
      this.wanderAngle += (Math.random() - 0.5) * 0.1;
      wander.x = Math.cos(this.wanderAngle) * 0.05;
      wander.y = Math.sin(this.wanderAngle) * 0.05;
      alignment = this.align(boids, 80);
      cohesion = this.cohere(boids, 80);
      drafting = this.draft(boids);
      aw = 1.5; cw = 0.5;
    } else if (state === 'PLAY_FG') {
      const mouseSettled = mouse.settled;
      this.offsetAngle += this.offsetSpeed * (mouseSettled ? 0.55 : 1.0);
      alignment = this.align(boids, 50);
      cohesion = this.cohere(boids, 50);
      drafting = this.draft(boids);
      aw = mouseSettled ? 1.0 : 0.75;
      cw = mouseSettled ? 1.0 : 0.85;
      dw = mouseSettled ? 1.0 : 0.75;
      
      if (mouse.active) {
        const orbitRadius = mouseSettled
          ? 28 + this.offsetRadius * 0.4
          : 40 + this.offsetRadius * 0.55;
        let tx = mouse.smoothX + Math.cos(this.offsetAngle) * orbitRadius;
        let ty = mouse.smoothY + Math.sin(this.offsetAngle) * orbitRadius;
        
        if (this.layer === 'bg') {
          let blockedRect = this.getBlockingRect(tx, ty, contentRects);
          if (blockedRect) {
            let waypoint = this.getNearestEdgeWaypoint(blockedRect, {x: tx, y: ty}, width, height);
            this.exitWaypoint = waypoint;
            attraction = this.seek(waypoint);
          } else {
            this.exitWaypoint = null;
            attraction = this.hoverOrbit({x: tx, y: ty}, orbitRadius, mouseSettled ? 1.0 : 0.75);
          }
        } else {
          attraction = this.hoverOrbit({x: tx, y: ty}, orbitRadius, mouseSettled ? 1.0 : 0.75);
        }
      }
    } else if (state === 'BURST_OUT') {
      maxF = 0.008;
      maxS = 8.0;
      sw = 0.04; aw = 0; cw = 0; mw = 0; dw = 0;
    } else if (state === 'FADE_OUT') {
      maxF = 0.01;
      maxS = 5.2;
      this.wanderAngle += (Math.random() - 0.5) * 0.05;
      wander.x = Math.cos(this.wanderAngle) * 0.02;
      wander.y = Math.sin(this.wanderAngle) * 0.02;
      sw = 0.5; aw = 0; cw = 0; mw = 0; dw = 0;
    }

    this.vx += separation.x * sw + alignment.x * aw + cohesion.x * cw + attraction.x * mw + wander.x + drafting.x * dw;
    this.vy += separation.y * sw + alignment.y * aw + cohesion.y * cw + attraction.y * mw + wander.y + drafting.y * dw;

    this.vx *= 0.99;
    this.vy *= 0.99;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxS) {
      this.vx = (this.vx / speed) * maxS;
      this.vy = (this.vy / speed) * maxS;
    }

    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx;
    this.y += this.vy;

    const margin = this.radius * 5;
    if (this.x < -margin) this.x = width + margin;
    if (this.y < -margin) this.y = height + margin;
    if (this.x > width + margin) this.x = -margin;
    if (this.y > height + margin) this.y = -margin;
  }

  getBlockingRect(tx, ty, rects) {
    for (let rect of rects) {
      if (this.lineIntersectsRect(this.x, this.y, tx, ty, rect, 18)) {
        return rect;
      }
    }
    return null;
  }

  getNearestEdgeWaypoint(rect, target, width, height) {
    const padding = 38;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const candidates = [
      {
        x: rect.left - padding,
        y: clamp(target.y, rect.top - padding, rect.bottom + padding)
      },
      {
        x: rect.right + padding,
        y: clamp(target.y, rect.top - padding, rect.bottom + padding)
      },
      {
        x: clamp(target.x, rect.left - padding, rect.right + padding),
        y: rect.top - padding
      },
      {
        x: clamp(target.x, rect.left - padding, rect.right + padding),
        y: rect.bottom + padding
      }
    ].map(point => ({
      x: clamp(point.x, 12, width - 12),
      y: clamp(point.y, 12, height - 12)
    }));

    candidates.sort((a, b) => {
      const da = Math.hypot(this.x - a.x, this.y - a.y) + Math.hypot(target.x - a.x, target.y - a.y) * 0.45;
      const db = Math.hypot(this.x - b.x, this.y - b.y) + Math.hypot(target.x - b.x, target.y - b.y) * 0.45;
      return da - db;
    });

    return candidates[0];
  }

  lineIntersectsRect(x1, y1, x2, y2, rect, padding = 0) {
    const left = rect.left - padding;
    const right = rect.right + padding;
    const top = rect.top - padding;
    const bottom = rect.bottom + padding;

    if (
      (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) ||
      (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom)
    ) {
      return true;
    }

    return (
      this.segmentsIntersect(x1, y1, x2, y2, left, top, right, top) ||
      this.segmentsIntersect(x1, y1, x2, y2, right, top, right, bottom) ||
      this.segmentsIntersect(x1, y1, x2, y2, right, bottom, left, bottom) ||
      this.segmentsIntersect(x1, y1, x2, y2, left, bottom, left, top)
    );
  }

  segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const ccw = (px, py, qx, qy, rx, ry) => (ry - py) * (qx - px) > (qy - py) * (rx - px);
    return (
      ccw(ax, ay, cx, cy, dx, dy) !== ccw(bx, by, cx, cy, dx, dy) &&
      ccw(ax, ay, bx, by, cx, cy) !== ccw(ax, ay, bx, by, dx, dy)
    );
  }

  draft(boids) {
    let draftingDist = 40;
    let steer = {x: 0, y: 0};
    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let dx = other.x - this.x;
      let dy = other.y - this.y;
      let d = Math.hypot(dx, dy);
      if (d > 5 && d < draftingDist) {
        let dot = (dx * this.vx + dy * this.vy) / (d * Math.hypot(this.vx, this.vy));
        if (dot > 0.9) { 
          steer.x = other.vx * 0.1;
          steer.y = other.vy * 0.1;
          break; 
        }
      }
    }
    return steer;
  }

  draw(ctx, opacity, state) {
    const finalOpacity = opacity * this.individualOpacity;
    if (finalOpacity <= 0) return;

    const speed = Math.hypot(this.vx, this.vy);
    const flap = Math.sin(this.flapOffset) * 1.5;
    const length = this.radius * 2.5 + flap;
    const angle = Math.atan2(this.vy, this.vx);

    if ((state === 'BURST_OUT' || state === 'FADE_OUT') && speed > 2.2) {
      this.drawTriangle(ctx, this.x - this.vx * 1.6, this.y - this.vy * 1.6, angle, length, finalOpacity * 0.18);
      this.drawTriangle(ctx, this.x - this.vx * 2.8, this.y - this.vy * 2.8, angle, length, finalOpacity * 0.08);
    }

    this.drawTriangle(ctx, this.x, this.y, angle, length, finalOpacity);
  }

  drawTriangle(ctx, x, y, angle, length, opacity) {
    ctx.fillStyle = `rgba(255, 204, 0, ${opacity})`;
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.moveTo(length, 0);
    ctx.lineTo(-this.radius, -this.radius);
    ctx.lineTo(-this.radius, this.radius);
    ctx.closePath();
    ctx.fill();
    ctx.rotate(-angle);
    ctx.translate(-x, -y);
  }

  separate(boids) {
    let desiredSeparation = 30;
    let steer = {x: 0, y: 0};
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = Math.hypot(this.x - other.x, this.y - other.y);
      if (d > 0 && d < desiredSeparation) {
        let diff = {x: this.x - other.x, y: this.y - other.y};
        diff.x /= d; diff.y /= d;
        steer.x += diff.x; steer.y += diff.y;
        count++;
      }
    }
    if (count > 0) {
      steer.x /= count; steer.y /= count;
    }
    return this.limitForce(steer, 0.05);
  }

  align(boids, neighborDist) {
    let sum = {x: 0, y: 0};
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = Math.hypot(this.x - other.x, this.y - other.y);
      if (d > 0 && d < neighborDist) {
        sum.x += other.vx; sum.y += other.vy;
        count++;
      }
    }
    if (count > 0) {
      sum.x /= count; sum.y /= count;
      let steer = {x: sum.x - this.vx, y: sum.y - this.vy};
      return this.limitForce(steer, 0.05);
    }
    return {x: 0, y: 0};
  }

  cohere(boids, neighborDist) {
    let sum = {x: 0, y: 0};
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = Math.hypot(this.x - other.x, this.y - other.y);
      if (d > 0 && d < neighborDist) {
        sum.x += other.x; sum.y += other.y;
        count++;
      }
    }
    if (count > 0) {
      sum.x /= count; sum.y /= count;
      return this.seek(sum);
    }
    return {x: 0, y: 0};
  }

  attract(target) {
    let desired = {x: target.x - this.x, y: target.y - this.y};
    let d = Math.hypot(desired.x, desired.y);
    const attractionRange = 440;
    if (d > 0 && d < attractionRange) {
      desired.x /= d; desired.y /= d;
      let m = this.maxSpeed;
      if (d < 180) m = this.maxSpeed * (d / 180) + 0.6; 
      desired.x *= m; desired.y *= m;
      let steer = {x: desired.x - this.vx, y: desired.y - this.vy};
      let forceScale = (d < 45) ? (d / 45) : 1.0;
      let steerForce = this.limitForce(steer, 0.05);
      const rangeFalloff = 1 - Math.min(1, d / attractionRange);
      const interactionStrength = 0.25 + rangeFalloff * 0.75;
      steerForce.x *= forceScale; steerForce.y *= forceScale;
      steerForce.x *= interactionStrength; steerForce.y *= interactionStrength;
      return steerForce;
    }
    return {x: 0, y: 0};
  }

  hoverOrbit(target, orbitRadius, orbitStrength = 1) {
    let desired = {x: target.x - this.x, y: target.y - this.y};
    let d = Math.hypot(desired.x, desired.y);
    if (d === 0) return {x: 0, y: 0};

    const radial = this.attract(target);
    const ringLock = 1 - Math.min(1, Math.abs(d - orbitRadius) / orbitRadius);
    const tangent = { x: desired.y / d, y: -desired.x / d };
    const tangentSteer = this.limitForce({
      x: tangent.x * this.maxSpeed - this.vx,
      y: tangent.y * this.maxSpeed - this.vy
    }, 0.035);

    const tangentWeight = (0.2 + ringLock * 0.7) * orbitStrength;
    const radialWeight = 0.8 + ringLock * 0.25;

    return {
      x: radial.x * radialWeight + tangentSteer.x * tangentWeight,
      y: radial.y * radialWeight + tangentSteer.y * tangentWeight
    };
  }

  seek(target) {
    let desired = {x: target.x - this.x, y: target.y - this.y};
    let d = Math.hypot(desired.x, desired.y);
    if (d === 0) return {x: 0, y: 0};
    desired.x = (desired.x / d) * this.maxSpeed;
    desired.y = (desired.y / d) * this.maxSpeed;
    let steer = {x: desired.x - this.vx, y: desired.y - this.vy};
    return this.limitForce(steer, 0.05);
  }

  limitForce(steer, maxF) {
    let speed = Math.hypot(steer.x, steer.y);
    if (speed > maxF) {
      steer.x = (steer.x / speed) * maxF;
      steer.y = (steer.y / speed) * maxF;
    }
    return steer;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const bgCanvas = document.getElementById('boids-bg-canvas');
  const fgCanvas = document.getElementById('boids-fg-canvas');
  if (!bgCanvas || !fgCanvas) return;
  
  const bgCtx = bgCanvas.getContext('2d');
  const fgCtx = fgCanvas.getContext('2d');
  
  let boids = [];
  const numBoids = 110;
  let cw = 0, ch = 0;
  
  let mouse = { x: 0, y: 0, smoothX: 0, smoothY: 0, active: false, initialized: false, lastMoveAt: 0, settled: false };
  let lastMouse = { x: 0, y: 0 };
  let state = 'HIDDEN'; 
  let idleTimer = null;
  let cycleTimer = null;
  let fadeOpacity = 0;
  let lastTime = 0;
  let fadeOutStartedAt = 0;
  let fadeOutCompleteHandled = false;
  let contentRects = [];
  const hoverSettleDelay = 220;
  const interactionBurstDelay = 7800;
  const burstDuration = 3200;
  const dissolveDuration = 6800;
  const idleRestartDelay = 6000;
  const postDissolveCooldown = 9000;
  let postDissolveStartedAt = 0;
  let lastUserActivityAt = performance.now();

  function startIdleBackground() {
    clearTimeout(idleTimer);
    clearTimeout(cycleTimer);
    state = 'IDLE_BG';
    postDissolveStartedAt = 0;
    mouse.active = false;
    mouse.initialized = false;
    fadeOpacity = 0;
    boids.forEach(b => b.reset(cw, ch));
  }

  function scheduleIdleStart() {
    const now = performance.now();
    const cooldownRemaining = postDissolveStartedAt > 0
      ? postDissolveCooldown - (now - postDissolveStartedAt)
      : 0;
    const inactivityRemaining = idleRestartDelay - (now - lastUserActivityAt);
    const delay = Math.max(0, cooldownRemaining, inactivityRemaining);

    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      const currentTime = performance.now();
      if (
        state !== 'HIDDEN' ||
        currentTime - lastUserActivityAt < idleRestartDelay ||
        (postDissolveStartedAt > 0 && currentTime - postDissolveStartedAt < postDissolveCooldown)
      ) {
        scheduleIdleStart();
        return;
      }

      startIdleBackground();
    }, delay);
  }

  function recordActivity() {
    lastUserActivityAt = performance.now();
    if (state === 'HIDDEN') {
      scheduleIdleStart();
    }
  }

  function scheduleInitialIdleStart() {
    const startAfterPageLoad = () => {
      lastUserActivityAt = performance.now();
      scheduleIdleStart();
    };

    if (document.readyState === 'complete') {
      startAfterPageLoad();
    } else {
      window.addEventListener('load', startAfterPageLoad, { once: true });
    }
  }
  
  function resize() {
    cw = window.innerWidth;
    ch = window.innerHeight;
    bgCanvas.width = cw;
    bgCanvas.height = ch;
    fgCanvas.width = cw;
    fgCanvas.height = ch;
    updateContentRects();
  }
  
  function updateContentRects() {
    contentRects = [];
    const elements = document.querySelectorAll('.sidebar, article.active, .navbar');
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      contentRects.push({
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom
      });
    });
  }

  function isInsideContent(x, y) {
    for (let rect of contentRects) {
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return true;
      }
    }
    return false;
  }

  function hasBlockedRoute(boid, tx, ty, padding = 0) {
    for (let rect of contentRects) {
      if (boid.lineIntersectsRect(boid.x, boid.y, tx, ty, rect, padding)) {
        return true;
      }
    }
    return false;
  }

  function shouldPromoteToForeground(boid, nearMouse) {
    if (state !== 'PLAY_FG' || !mouse.active || boid.layer !== 'bg' || !nearMouse) {
      return false;
    }

    if (isInsideContent(boid.x, boid.y)) {
      return false;
    }

    if (boid.exitWaypoint) {
      return Math.hypot(boid.x - boid.exitWaypoint.x, boid.y - boid.exitWaypoint.y) < 42;
    }

    return !hasBlockedRoute(boid, mouse.smoothX, mouse.smoothY, 12);
  }
  
  window.addEventListener('resize', resize);
  
  const observer = new MutationObserver(updateContentRects);
  observer.observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ['class'] });

  resize();

  for (let i = 0; i < numBoids; i++) {
    boids.push(new Boid(cw, ch));
  }
  
  function handleInteraction(x, y) {
    const now = performance.now();
    recordActivity();

    if (state === 'BURST_OUT' || state === 'FADE_OUT') {
      return;
    }

    if (state === 'HIDDEN') {
      return;
    }

    if (!mouse.initialized) {
      mouse.smoothX = x;
      mouse.smoothY = y;
      mouse.initialized = true;
    }
    mouse.x = x;
    mouse.y = y;
    mouse.lastMoveAt = now;
    lastMouse.x = x;
    lastMouse.y = y;
    mouse.active = true;

    clearTimeout(cycleTimer);

    if (state === 'IDLE_BG') {
      state = 'PLAY_FG';
      updateContentRects();
      cycleTimer = setTimeout(() => {
        beginBurst();
      }, interactionBurstDelay);
    } else if (state === 'PLAY_FG') {
      cycleTimer = setTimeout(() => {
        beginBurst();
      }, interactionBurstDelay);
    }
  }

  function beginBurst() {
    if (state === 'BURST_OUT' || state === 'FADE_OUT') return;
    clearTimeout(cycleTimer);
    state = 'BURST_OUT';
    mouse.active = false;
    burstBoids();
    cycleTimer = setTimeout(() => {
      beginFadeOut();
    }, burstDuration);
  }

  function beginFadeOut() {
    if (state === 'FADE_OUT') return;
    clearTimeout(cycleTimer);
    state = 'FADE_OUT';
    fadeOutStartedAt = performance.now();
    fadeOutCompleteHandled = false;
  }

  function burstBoids() {
    boids.forEach(b => {
      const dx = b.x - lastMouse.x;
      const dy = b.y - lastMouse.y;
      const d = Math.hypot(dx, dy);
      const influence = Math.max(0.12, 1 - Math.min(1, d / 680));

      const angle = d > 0 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
      const tangent = angle + Math.PI / 2;
      const burst = 4.2 + influence * 6.4;
      const twist = (Math.random() - 0.5) * 2.6 * influence;
      b.vx += Math.cos(angle) * burst + Math.cos(tangent) * twist;
      b.vy += Math.sin(angle) * burst + Math.sin(tangent) * twist;
      b.layer = 'fg';
    });
  }

  document.addEventListener('mousemove', (e) => handleInteraction(e.clientX, e.clientY));
  document.addEventListener('mousedown', recordActivity);
  document.addEventListener('wheel', recordActivity, { passive: true });
  document.addEventListener('touchstart', (e) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY));
  document.addEventListener('touchmove', (e) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY));
  document.addEventListener('keydown', recordActivity);
  document.addEventListener('keyup', recordActivity);

  function animate(time) {
    requestAnimationFrame(animate);
    
    const dt = time - lastTime;
    lastTime = time;

    mouse.settled = mouse.active && (time - mouse.lastMoveAt > hoverSettleDelay);

    if (mouse.active) {
      mouse.smoothX += (mouse.x - mouse.smoothX) * 0.14;
      mouse.smoothY += (mouse.y - mouse.smoothY) * 0.14;
    }

    if (state === 'IDLE_BG' || state === 'PLAY_FG' || state === 'BURST_OUT') {
      fadeOpacity = Math.min(1, fadeOpacity + dt * 0.001);
      boids.forEach(b => b.individualOpacity = Math.min(1, b.individualOpacity + dt * 0.002));
    } else if (state === 'FADE_OUT') {
      fadeOpacity = Math.max(0, fadeOpacity - dt * 0.0002);
      const dissolveProgress = Math.min(1, (time - fadeOutStartedAt) / dissolveDuration);
      const dissolveRadius = Math.hypot(cw, ch) * 1.34;
      const waveRadius = dissolveProgress * dissolveRadius;
      const waveSoftness = Math.max(380, Math.min(cw, ch) * 0.52);
      
      boids.forEach(b => {
        const d = Math.hypot(b.x - lastMouse.x, b.y - lastMouse.y);
        const waveDepth = 1 - Math.min(1, Math.max(0, d - waveRadius) / waveSoftness);
        const fadeSpeed = 0.00008 + waveDepth * 0.0025;
        b.individualOpacity = Math.max(0, b.individualOpacity - dt * fadeSpeed);
      });

      if (!fadeOutCompleteHandled && dissolveProgress === 1) {
        fadeOutCompleteHandled = true;
        fadeOpacity = 0;
        state = 'HIDDEN';
        postDissolveStartedAt = performance.now();
        scheduleIdleStart();
      }
    }

    if (
      state === 'HIDDEN' &&
      postDissolveStartedAt > 0 &&
      time - postDissolveStartedAt >= postDissolveCooldown &&
      time - lastUserActivityAt >= idleRestartDelay
    ) {
      startIdleBackground();
    }

    bgCtx.clearRect(0, 0, cw, ch);
    fgCtx.clearRect(0, 0, cw, ch);
    
    if (state !== 'HIDDEN' && fadeOpacity > 0) {
      for (let i = 0; i < boids.length; i++) {
        const b = boids[i];
        const nearMouse = Math.hypot(b.x - mouse.smoothX, b.y - mouse.smoothY) < 540;

        b.update(boids, mouse, state, cw, ch, contentRects);
        
        if (shouldPromoteToForeground(b, nearMouse) || state === 'BURST_OUT' || state === 'FADE_OUT') {
          b.layer = 'fg';
        } else if (state === 'HIDDEN') {
          b.layer = 'bg';
        }

        if (b.layer === 'bg') {
          b.draw(bgCtx, fadeOpacity, state);
        } else {
          b.draw(fgCtx, fadeOpacity, state);
        }
      }
    }
  }

  scheduleInitialIdleStart();
  requestAnimationFrame(animate);
});
