// sparks.js - ????????????????????????????????????????????? (High-Tech Plasma Spark Engine)

class SparkEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.arcs = [];
    this.animationId = null;
    this.startTime = 0;
    this.duration = 1400; // 1.4 seconds of sparks
  }

  init() {
    this.createDom();
    this.bindEvents();
    this.startSparkBurst();
  }

  createDom() {
    let loader = document.getElementById('page-spark-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'page-spark-loader';
      loader.innerHTML = `
        <canvas id="spark-canvas"></canvas>
        <div class="spark-hud-content">
          <div class="spark-reactor-ring">
            <div class="spark-core-orb">?</div>
          </div>
          <div class="spark-hud-title">SYSTEM IGNITION ACTIVE</div>
          <div class="spark-hud-subtitle">GENERATING PLASMA SPARKS // INITIALIZING HUD...</div>
          <div class="spark-progress-bar"><div class="spark-progress-fill"></div></div>
        </div>
      `;
      document.body.prepend(loader);
    }

    this.canvas = document.getElementById('spark-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resize();
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
  }

  // ????????????????????????????????????
  playSparkSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // ??????????????????????? (Electric Crackle)
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // sporadic noisy clicks
        data[i] = Math.random() > 0.85 ? (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15)) : 0;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      // ?????????????????????????? (Power-up hum)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 0.6);

      const oscFilter = ctx.createBiquadFilter();
      oscFilter.type = 'lowpass';
      oscFilter.frequency.setValueAtTime(400, ctx.currentTime);
      oscFilter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.6);

      oscGain.gain.setValueAtTime(0.12, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      osc.connect(oscFilter);
      oscFilter.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.75);
    } catch (e) {
      console.warn('Audio spark error:', e);
    }
  }

  startSparkBurst() {
    this.playSparkSound();
    this.particles = [];
    this.arcs = [];
    this.startTime = performance.now();

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    // ????????????? 160 ???? ??????????????????????
    const colors = ['#FFFFFF', '#FFE600', '#FF9900', '#FF3300', '#00F0FF', '#7000FF'];
    for (let i = 0; i < 160; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 14;
      this.particles.push({
        x: cx,
        y: cy,
        prevX: cx,
        prevY: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 3), // slight upward bias
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1.5 + Math.random() * 2.5,
        alpha: 1,
        life: 0.6 + Math.random() * 0.4,
        decay: 0.015 + Math.random() * 0.025,
        gravity: 0.16 + Math.random() * 0.1
      });
    }

    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.loop();
  }

  loop() {
    const elapsed = performance.now() - this.startTime;
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalCompositeOperation = 'lighter';

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    // ????????????????? (Lightning Arcs) ??????????
    if (elapsed < 900 && Math.random() > 0.3) {
      this.drawLightningArc(cx, cy);
    }

    // ???????????????????????????
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.prevX = p.x;
      p.prevY = p.y;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = p.size;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = p.color;

      this.ctx.beginPath();
      this.ctx.moveTo(p.prevX, p.prevY);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.stroke();

      // glowing tip point
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // ?????????????????????????????????
    if (elapsed < 1100) {
      const radius = (elapsed / 1100) * 260;
      const ringAlpha = Math.max(0, 1 - (elapsed / 1100));
      this.ctx.strokeStyle = '#00F0FF';
      this.ctx.lineWidth = 3;
      this.ctx.globalAlpha = ringAlpha * 0.8;
      this.ctx.shadowBlur = 18;
      this.ctx.shadowColor = '#00F0FF';
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.shadowBlur = 0;

    // ??????????????? ???????? ??? Loader
    if (elapsed > this.duration || this.particles.length === 0) {
      this.finish();
      return;
    }

    this.animationId = requestAnimationFrame(() => this.loop());
  }

  drawLightningArc(cx, cy) {
    const segments = 6;
    const angle = Math.random() * Math.PI * 2;
    const targetDist = 70 + Math.random() * 110;
    let curX = cx;
    let curY = cy;

    this.ctx.strokeStyle = Math.random() > 0.5 ? '#00F0FF' : '#FFE600';
    this.ctx.lineWidth = 1.8;
    this.ctx.globalAlpha = 0.9;
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = this.ctx.strokeStyle;

    this.ctx.beginPath();
    this.ctx.moveTo(curX, curY);

    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const targetX = cx + Math.cos(angle) * (targetDist * t);
      const targetY = cy + Math.sin(angle) * (targetDist * t);
      const jitter = (Math.random() - 0.5) * 24;
      curX = targetX + jitter;
      curY = targetY + jitter;
      this.ctx.lineTo(curX, curY);
    }
    this.ctx.stroke();
  }

  finish() {
    const loader = document.getElementById('page-spark-loader');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => {
        loader.style.display = 'none';
      }, 650);
    }
  }

  // ?????????????????????????????????
  reignite() {
    const loader = document.getElementById('page-spark-loader');
    if (loader) {
      loader.style.display = 'flex';
      loader.classList.remove('fade-out');
    }
    this.resize();
    this.startSparkBurst();
  }
}

// ????? Instance ?????????????????????????
window.sparkEngine = new SparkEngine();
window.reigniteSparks = function() {
  window.sparkEngine.reignite();
};

document.addEventListener('DOMContentLoaded', () => {
  window.sparkEngine.init();
});
