/* Interactive starfield "Garazy"
   - Canvas-based particle system
   - Click/tap to generate swirling interactions
   - Idle -> form star-text after ~50s
   - Optimized for responsiveness and performance
*/
(() => {
  'use strict';

  const canvas = document.getElementById('garazy');
  const ctx = canvas.getContext('2d', { alpha: true });
  const fallback = document.getElementById('fallback');
  const soundToggle = document.getElementById('soundToggle');
  const ambient = document.getElementById('ambient');

  // Config
  const CONFIG = {
    BACKGROUND_COLOR: '#02040a',
    DENSITY: 0.00045, // particles per px^2 at baseline; will cap based on device
    MIN_PARTICLES: 600,
    MAX_PARTICLES: 3000,
    STAR_SIZE_MIN: 0.6,
    STAR_SIZE_MAX: 2.6,
    TWINKLE_SPEED: 0.4, // global multiplier
    INTERACTION_DURATION: 10000, // ms for swirl effect
    IDLE_TO_TEXT_MS: 50000, // 50s to form text
    TEXT: 'Never Hide. Is the master coding.',
    TEXT_FONT_FALLBACK: 'bold 180px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    TEXT_SAMPLE_GAP: 6, // sampling gap for forming text
    TEXT_FORCE_IN: 1400, // ms to animate into text
  };

  // Palette: cosmic hues
  const PALETTE = [
    '#ffffff',
    '#eaf6ff', // soft blue-white
    '#cfe7ff', // light blue
    '#ffdfa6', // soft gold
    '#f6e9ff'  // soft violet
  ];

  // internal state
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let width = 0, height = 0, area = 0;
  let particles = [];
  let interactions = []; // active swirls
  let lastFrame = performance.now();
  let idleSince = performance.now();
  let textMode = false;
  let textPositions = null; // array of {x,y}
  let animatingToText = false;
  let needsRedrawFallback = false;
  let paused = false;

  // util helpers
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function choose(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // Particle class
  class Particle {
    constructor(x, y, size, color) {
      this.x = x; this.y = y;
      this.vx = rand(-0.03, 0.03);
      this.vy = rand(-0.03, 0.03);
      this.baseSize = size;
      this.size = size;
      this.color = color;
      this.twinklePhase = rand(0, Math.PI * 2);
      this.alpha = 0.9;
      // orbit properties when under interaction
      this.orbit = null; // {cx, cy, radius, angle, angularSpeed, startedAt, intensity}
      this.toText = null; // {tx, ty, start, duration} if forming text
    }

    update(dt, t) {
      // twinkle
      this.twinklePhase += dt * 0.001 * CONFIG.TWINKLE_SPEED * (0.5 + this.baseSize);
      const tw = 0.15 + Math.sin(this.twinklePhase) * 0.35;
      this.alpha = clamp(0.45 + tw, 0.15, 1.0);

      // If forming text, smoothly move to target pos
      if (this.toText) {
        const now = t;
        const p = clamp((now - this.toText.start) / this.toText.duration, 0, 1);
        const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
        this.x = this.toText.sx + (this.toText.tx - this.toText.sx) * ease;
        this.y = this.toText.sy + (this.toText.ty - this.toText.sy) * ease;
        // enlarge and brighten a bit
        this.size = this.baseSize * (1 + 1.2 * ease);
        this.alpha = clamp(this.alpha + 0.6 * ease, 0, 1);
        if (p >= 1) {
          // remain in place; keep slight pulsing by altering twinklePhase
          this.toText = { ...this.toText, locked: true };
        }
        return;
      }

      // If under orbit interaction
      if (this.orbit) {
        const elapsed = t - this.orbit.startedAt;
        const progress = clamp(elapsed / this.orbit.duration, 0, 1);
        const intensity = this.orbit.intensity * (1 - progress);
        // Update angle
        this.orbit.angle += this.orbit.angularSpeed * (1 + intensity * 2) * dt * 0.001;
        // Target position on orbit
        const tx = this.orbit.cx + Math.cos(this.orbit.angle) * this.orbit.radius;
        const ty = this.orbit.cy + Math.sin(this.orbit.angle) * this.orbit.radius;
        // smooth approach
        const ax = (tx - this.x) * (0.12 + intensity * 0.18);
        const ay = (ty - this.y) * (0.12 + intensity * 0.18);
        this.vx += ax; this.vy += ay;
        // slowly reduce orbit influence over time
        if (progress >= 1) {
          this.orbit = null;
        }
      }

      // normal motion
      // small friction for stability
      this.vx *= 0.999;
      this.vy *= 0.999;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Boundaries: wrap around for continuous field
      if (this.x < -10) this.x = width + 10;
      if (this.x > width + 10) this.x = -10;
      if (this.y < -10) this.y = height + 10;
      if (this.y > height + 10) this.y = -10;

      // settle size slowly back to base
      this.size += (this.baseSize - this.size) * 0.06;
    }

    draw(ctx) {
      // simple radial glow for performance
      const s = this.size;
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, s * 4);
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(0.45, this.color + Math.floor((this.alpha * 180)).toString(16));
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, s * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // small bright center
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, s * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
    }
  }

  // initialize / resize
  function resize() {
    DPR = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(200, window.innerHeight);
    width = Math.floor(w);
    height = Math.floor(h);
    area = width * height;

    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // recalc particle count
    const target = Math.round(area * CONFIG.DENSITY);
    const count = clamp(target, CONFIG.MIN_PARTICLES, CONFIG.MAX_PARTICLES);
    setParticleCount(count);

    // re-render text pixel map if necessary
    if (textPositions) {
      generateTextPositions();
    }
    // hide fallback if canvas ok
    fallback.style.display = 'none';
  }

  function setParticleCount(count) {
    const delta = count - particles.length;
    if (delta > 0) {
      for (let i = 0; i < delta; i++) {
        particles.push(spawnParticle(true));
      }
    } else if (delta < 0) {
      particles.splice(count);
    }
  }

  function spawnParticle(randomPos = true) {
    const x = randomPos ? rand(0, width) : width / 2;
    const y = randomPos ? rand(0, height) : height / 2;
    const size = rand(CONFIG.STAR_SIZE_MIN, CONFIG.STAR_SIZE_MAX) * (DPR > 1 ? 1.1 : 1.0);
    const color = choose(PALETTE);
    return new Particle(x, y, size, color);
  }

  // Drawing loop
  function frame(now) {
    if (paused) {
      requestAnimationFrame(frame);
      return;
    }
    const dt = Math.min(40, now - lastFrame);
    lastFrame = now;

    // clear
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    // optional subtle background gradient
    ctx.fillStyle = CONFIG.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, width, height);

    // update & draw
    for (let p of particles) {
      p.update(dt, now);
    }

    // Draw star clusters with compositing for sheen
    ctx.globalCompositeOperation = 'lighter';
    for (let p of particles) p.draw(ctx);
    ctx.globalCompositeOperation = 'source-over';

    // If text mode active, draw soft glow behind the text
    if (textMode && textPositions) {
      // Pulsing overlay
      const pulse = 0.85 + 0.15 * Math.sin(now * 0.0016);
      ctx.fillStyle = `rgba(255,255,255,${0.02 * pulse})`;
      ctx.fillRect(0, 0, width, height);
    }

    requestAnimationFrame(frame);
  }

  // Interaction handling
  function createInteraction(x, y) {
    const now = performance.now();
    idleSince = now;
    // Intensity based on screen area (makes sense on larger screens)
    const baseRadius = Math.min(width, height) * 0.18;
    const interaction = {
      x, y,
      startedAt: now,
      duration: CONFIG.INTERACTION_DURATION,
      radius: baseRadius,
      intensity: 1.0,
    };
    interactions.push(interaction);

    // Affect nearby particles: set them into orbit
    for (let p of particles) {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < interaction.radius * 1.15) {
        // create orbit parameters
        const radius = clamp(dist, 8, interaction.radius * (0.95));
        const angle = Math.atan2(dy, dx);
        // angular speed depends on distance and intensity
        const angularSpeed = (0.0012 + (interaction.intensity * 0.002)) * (1 + (interaction.radius - radius) / interaction.radius * 2) * (Math.random() < 0.5 ? -1 : 1);
        p.orbit = {
          cx: x,
          cy: y,
          radius,
          angle,
          angularSpeed,
          startedAt: now,
          duration: interaction.duration,
          intensity: interaction.intensity * rand(0.6, 1.2),
        };
        // give a small push outward/inward for visual
        p.vx += (dx / (dist + 0.1)) * rand(0.02, 0.06) * (Math.random() < 0.5 ? -1 : 1);
        p.vy += (dy / (dist + 0.1)) * rand(0.02, 0.06) * (Math.random() < 0.5 ? -1 : 1);
      }
    }
    // reset text mode so new interactions disperse text
    if (textMode || animatingToText) {
      // disperse: clear textPositions, and release particles from text
      textMode = false;
      animatingToText = false;
      textPositions = null;
      for (let p of particles) {
        p.toText = null;
      }
    }
  }

  // Input events
  let pointerDown = false;
  function onPointerDown(e) {
    e.preventDefault();
    restartIdleTimer();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    createInteraction(x, y);
  }

  function onPointerMove(e) {
    // optional: small subtle influence on move
    restartIdleTimer();
    if (pointerDown) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
      const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
      // lighter swirl on move
      createInteraction(x, y);
    }
  }

  function onPointerUp(e) {
    pointerDown = false;
  }

  // Idle -> text formation
  function restartIdleTimer() {
    idleSince = performance.now();
  }

  function checkIdleToText() {
    const now = performance.now();
    if (!textMode && !animatingToText && (now - idleSince) > CONFIG.IDLE_TO_TEXT_MS) {
      startTextFormation();
    }
  }

  // Render text to offscreen canvas and sample positions
  function generateTextPositions() {
    // create temporary offscreen canvas sized to screen
    const off = document.createElement('canvas');
    const octx = off.getContext('2d');
    off.width = Math.max(800, Math.floor(width * 0.9));
    off.height = Math.max(300, Math.floor(height * 0.35));
    // scale font to fit width
    const fontSize = Math.floor(off.height * 0.8);
    octx.clearRect(0, 0, off.width, off.height);
    octx.fillStyle = '#000';
    octx.fillRect(0, 0, off.width, off.height);

    // Determine font size so text fits
    let font = CONFIG.TEXT_FONT_FALLBACK.replace('180px', fontSize + 'px');
    octx.font = font;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    // draw text in white
    octx.fillStyle = '#ffffff';
    const lines = wrapText(octx, CONFIG.TEXT, off.width * 0.92);
    // center vertical block
    const totalTextHeight = lines.length * fontSize * 0.9;
    let startY = off.height / 2 - totalTextHeight / 2 + fontSize * 0.45;
    for (let i = 0; i < lines.length; i++) {
      octx.fillText(lines[i], off.width / 2, startY + i * fontSize * 0.92);
    }

    // sample pixels
    const img = octx.getImageData(0, 0, off.width, off.height).data;
    const positions = [];
    const gap = clamp(CONFIG.TEXT_SAMPLE_GAP, 4, 12);
    for (let y = 0; y < off.height; y += gap) {
      for (let x = 0; x < off.width; x += gap) {
        const idx = (y * off.width + x) * 4 + 3; // alpha channel
        const a = img[idx];
        if (a > 128) {
          // map to screen coords (centered)
          const sx = (x / off.width) * width + (width - (off.width / off.width) * width) / 2;
          const sy = (y / off.height) * (height * 0.45) + (height / 2 - (off.height / off.height) * (height * 0.45) / 2);
          positions.push({ x: sx, y: sy });
        }
      }
    }
    // shuffle positions so formation is organic
    shuffleArray(positions);
    textPositions = positions;
    return positions;
  }

  function wrapText(ctx, text, maxWidth) {
    // simple wrapper that breaks by spaces
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      const metrics = ctx.measureText(test);
      if (metrics.width > maxWidth && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function startTextFormation() {
    if (!textPositions) generateTextPositions();
    if (!textPositions || textPositions.length === 0) return;
    animatingToText = true;
    textMode = true;
    const now = performance.now();

    // Ensure we have at least as many particles as text positions; spawn extras if needed
    if (particles.length < textPositions.length) {
      const extra = textPositions.length - particles.length;
      for (let i = 0; i < extra; i++) particles.push(spawnParticle(true));
    }

    // assign each particle to a text position (reuse if more particles than positions)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const target = textPositions[i % textPositions.length];
      p.toText = {
        tx: target.x,
        ty: target.y,
        start: now + rand(0, 1200), // stagger
        duration: CONFIG.TEXT_FORCE_IN + rand(-500, 900),
        sx: p.x,
        sy: p.y,
      };
      // slightly reduce current velocity to allow neat motion
      p.vx *= 0.2; p.vy *= 0.2;
    }

    // after animation completes, finalize
    setTimeout(() => {
      animatingToText = false;
      // lock into text: small glow animation handled in draw via twinkles
    }, CONFIG.TEXT_FORCE_IN + 1400);
  }

  // Utility shuffle
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Simple fallback detection & UI
  function checkCanvasSupport() {
    if (!canvas || !ctx) {
      fallback.style.display = 'flex';
      canvas.style.display = 'none';
      return false;
    }
    return true;
  }

  // Ambient audio controls
  function toggleSound() {
    if (!ambient) return;
    if (ambient.paused) {
      ambient.play().catch(() => { /* autoplay blocked, user must interact */ });
      soundToggle.textContent = 'Pause ambient';
    } else {
      ambient.pause();
      soundToggle.textContent = 'Play ambient';
    }
  }

  // small performance guard
  let idleCheckTimer = null;
  function startIdleCheck() {
    if (idleCheckTimer) clearInterval(idleCheckTimer);
    idleCheckTimer = setInterval(checkIdleToText, 1000);
  }

  // Start/stop
  function start() {
    if (!checkCanvasSupport()) return;
    resize();
    lastFrame = performance.now();
    requestAnimationFrame(frame);
    startIdleCheck();
  }

  // Event listeners
  window.addEventListener('resize', () => {
    resize();
  });

  // Pointer events: support mouse & touch & pointer
  canvas.addEventListener('pointerdown', (e) => { pointerDown = true; onPointerDown(e); });
  window.addEventListener('pointermove', (e) => { onPointerMove(e); });
  window.addEventListener('pointerup', (e) => { pointerDown = false; onPointerUp(e); });

  // fallback button for sound
  soundToggle.addEventListener('click', () => {
    restartIdleTimer();
    toggleSound();
  });

  // If canvas not supported, reveal fallback
  if (!window.HTMLCanvasElement) {
    fallback.style.display = 'flex';
    canvas.style.display = 'none';
  }

  // Optimize rendering on page hidden
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
  });

  // init particle set
  (function initParticles() {
    // set an initial reasonable number; resize will adjust
    for (let i = 0; i < Math.min(900, CONFIG.MAX_PARTICLES); i++) particles.push(spawnParticle());
  })();

  // small polyfill for requestAnimationFrame in older browsers is not required here

  // start
  start();

  // Expose for debugging (optional)
  window.Garazy = {
    particles,
    createInteraction,
    startTextFormation,
    CONFIG,
  };

})();
