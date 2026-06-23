const SFX = {
  ctx: null,
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  _play(gen) {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    gen(this.ctx);
  },
  _tap(ctx, freq, dur, vol) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur + 0.01);
  },
  button() {
    this._play(ctx => {
      const t = ctx.currentTime;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      g.connect(ctx.destination);

      const hi = ctx.createOscillator();
      hi.type = 'sine'; hi.frequency.setValueAtTime(1800, t);
      hi.frequency.exponentialRampToValueAtTime(900, t + 0.04);
      hi.connect(g); hi.start(t); hi.stop(t + 0.04);

      const body = ctx.createOscillator();
      body.type = 'sine'; body.frequency.setValueAtTime(660, t);
      body.frequency.exponentialRampToValueAtTime(500, t + 0.1);
      body.connect(g); body.start(t + 0.02); body.stop(t + 0.12);
    });
  },
  click() {
    this._play(ctx => {
      const t = ctx.currentTime;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      g.connect(ctx.destination);

      const hit = ctx.createOscillator();
      hit.type = 'sine'; hit.frequency.setValueAtTime(1400, t);
      hit.frequency.exponentialRampToValueAtTime(600, t + 0.04);
      hit.connect(g); hit.start(t); hit.stop(t + 0.04);

      const thud = ctx.createOscillator();
      thud.type = 'sine'; thud.frequency.setValueAtTime(300, t);
      thud.frequency.exponentialRampToValueAtTime(120, t + 0.06);
      thud.connect(g); thud.start(t + 0.01); thud.stop(t + 0.07);
    });
  },
  draw() {
    this._play(ctx => {
      const bufSize = ctx.sampleRate * 0.2;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        const env = 1 - i / bufSize;
        const noise = (Math.random() * 2 - 1) * 0.8;
        const angle = 2 * Math.PI * (600 + 2000 * (i / bufSize)) * i / ctx.sampleRate;
        data[i] = noise * Math.sin(angle) * env * env;
      }
      const src = ctx.createBufferSource(); const g = ctx.createGain();
      src.buffer = buf;
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      src.connect(g); g.connect(ctx.destination);
      src.start();
    });
  },
  whoosh() {
    this._play(ctx => {
      const bufSize = ctx.sampleRate * 0.25;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        const env = 1 - i / bufSize;
        const noise = (Math.random() * 2 - 1) * 0.5;
        const angle = 2 * Math.PI * (300 + 1800 * (1 - i / bufSize)) * i / ctx.sampleRate;
        data[i] = noise * Math.sin(angle) * env * 0.6;
      }
      const src = ctx.createBufferSource(); const g = ctx.createGain();
      src.buffer = buf;
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      src.connect(g); g.connect(ctx.destination);
      src.start();
    });
  },
  place() {
    this._play(ctx => {
      const t = ctx.currentTime;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      g.connect(ctx.destination);

      const tap = ctx.createOscillator();
      tap.type = 'sine'; tap.frequency.setValueAtTime(1200, t);
      tap.frequency.exponentialRampToValueAtTime(400, t + 0.03);
      tap.connect(g); tap.start(t); tap.stop(t + 0.03);

      const thump = ctx.createOscillator();
      thump.type = 'sine'; thump.frequency.setValueAtTime(250, t);
      thump.frequency.exponentialRampToValueAtTime(80, t + 0.09);
      thump.connect(g); thump.start(t + 0.01); thump.stop(t + 0.1);
    });
  },
  win() {
    this._play(ctx => {
      const freqs = [523, 587, 659, 784];
      freqs.forEach((f, i) => {
        const t = ctx.currentTime + i * 0.1;
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(f, t);
        const vol = 0.15 + 0.06 * (i / (freqs.length - 1));
        g.gain.setValueAtTime(vol, t);
        g.gain.linearRampToValueAtTime(vol * 0.8, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.2);
      });
    });
  },
  lose() {
    this._play(ctx => {
      const freqs = [400, 340, 280];
      freqs.forEach((f, i) => {
        const t = ctx.currentTime + i * 0.15;
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.16, t);
        g.gain.linearRampToValueAtTime(0.1, t + 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.25);

        if (i < freqs.length - 1) {
          const tail = ctx.createOscillator(); const gt = ctx.createGain();
          tail.type = 'sine'; tail.frequency.setValueAtTime(f, t + 0.05);
          gt.gain.setValueAtTime(0.04, t + 0.05);
          gt.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          tail.connect(gt); gt.connect(ctx.destination);
          tail.start(t + 0.05); tail.stop(t + 0.2);
        }
      });
    });
  },
};
