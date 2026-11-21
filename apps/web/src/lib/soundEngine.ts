'use client';

/**
 * Pure Web Audio API sound engine for DamCuoiOnline.
 * Synthesizes gentle romantic wedding BGM and ceremony SFX with zero external MP3 dependencies.
 */
class WeddingSoundEngine {
  private ctx: AudioContext | null = null;
  private bgmMasterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmTimer: ReturnType<typeof setInterval> | null = null;
  private playing = false;
  private ducked = false;
  private noteIndex = 0;

  // Romantic major-7th / warm pentatonic harp arpeggio (C4, E4, G4, B4, D5, E5, G5, E5)
  private readonly arpeggioFreqs = [
    261.63, 329.63, 392.0, 493.88, 587.33, 659.25, 783.99, 659.25,
    220.0, 261.63, 329.63, 440.0, 523.25, 659.25, 523.25, 440.0,
    174.61, 220.0, 261.63, 349.23, 440.0, 523.25, 440.0, 349.23,
    196.0, 246.94, 293.66, 392.0, 493.88, 587.33, 493.88, 392.0,
  ];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.bgmMasterGain = this.ctx.createGain();
      this.bgmMasterGain.gain.value = 0.09;
      this.bgmMasterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.25;
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isBgmPlaying(): boolean {
    return this.playing;
  }

  public startBgm(): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.bgmMasterGain) return false;
    if (this.playing) return true;

    this.playing = true;
    this.updateBgmGain();

    this.bgmTimer = setInterval(() => {
      if (!this.playing || !this.ctx || !this.bgmMasterGain) return;
      const freq = this.arpeggioFreqs[this.noteIndex % this.arpeggioFreqs.length];
      this.noteIndex += 1;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.35, now + 0.04);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

      osc.connect(env);
      env.connect(this.bgmMasterGain);
      osc.start(now);
      osc.stop(now + 1.4);
    }, 460);

    return true;
  }

  public stopBgm(): void {
    this.playing = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  public toggleBgm(): boolean {
    if (this.playing) {
      this.stopBgm();
      return false;
    }
    return this.startBgm();
  }

  /**
   * Smoothly ducks background music by -20dB (0.1x) while MC speaks on Stage.
   */
  public setStageDucking(active: boolean): void {
    this.ducked = active;
    this.updateBgmGain();
  }

  private updateBgmGain(): void {
    if (!this.ctx || !this.bgmMasterGain) return;
    const now = this.ctx.currentTime;
    const target = this.ducked ? 0.009 : 0.09; // -20dB when ducked
    this.bgmMasterGain.gain.cancelScheduledValues(now);
    this.bgmMasterGain.gain.setValueAtTime(this.bgmMasterGain.gain.value, now);
    this.bgmMasterGain.gain.linearRampToValueAtTime(target, now + 0.35);
  }

  public playCheersSfx(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    // Crystal glass clink harmonics + sparkle chime
    [1318.5, 1975.5, 2637.0, 3135.9].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.001, now + idx * 0.045);
      gain.gain.linearRampToValueAtTime(0.32, now + idx * 0.045 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.75);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.8);
    });
  }

  public playClapSfx(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    for (let i = 0; i < 4; i++) {
      const start = ctx.currentTime + i * 0.13;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100 + i * 120;
      const gain = ctx.createGain();
      gain.gain.value = 0.35;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      src.start(start);
    }
  }

  public playFireworkSfx(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    // Festive rising whistle + pop + bright triad shimmer
    const rise = ctx.createOscillator();
    const riseGain = ctx.createGain();
    rise.type = 'sine';
    rise.frequency.setValueAtTime(320, now);
    rise.frequency.exponentialRampToValueAtTime(1180, now + 0.25);
    riseGain.gain.setValueAtTime(0.22, now);
    riseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    rise.connect(riseGain);
    riseGain.connect(this.sfxGain);
    rise.start(now);
    rise.stop(now + 0.3);

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + 0.26 + idx * 0.04;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.26, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  }

  private noiseBuffer: AudioBuffer | null = null;

  /** One second of white noise, made once, for whooshes and crackle */
  private noise(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    return this.noiseBuffer;
  }

  /** A shell leaving the mortar: a short rising hiss */
  public playFireworkLaunch(volume = 1): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise(ctx);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 6;
    band.frequency.setValueAtTime(700, now);
    band.frequency.exponentialRampToValueAtTime(3200, now + 0.9);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16 * volume, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
    src.connect(band);
    band.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now, Math.random() * 0.5, 1.05);
  }

  /** A shell bursting: a low thump, a bang, then crackle. Distance softens and dulls it. */
  public playFireworkBurst(volume = 1, crackle = true): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const v = Math.max(0.15, Math.min(1, volume));

    const thump = ctx.createOscillator();
    const tg = ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(110, now);
    thump.frequency.exponentialRampToValueAtTime(38, now + 0.5);
    tg.gain.setValueAtTime(0.55 * v, now);
    tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    thump.connect(tg);
    tg.connect(this.sfxGain);
    thump.start(now);
    thump.stop(now + 0.65);

    const bang = ctx.createBufferSource();
    bang.buffer = this.noise(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900 + 2600 * v;
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.42 * v, now);
    bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    bang.connect(lp);
    lp.connect(bg);
    bg.connect(this.sfxGain);
    bang.start(now, Math.random() * 0.4, 0.5);

    if (!crackle) return;
    // Crackle: a scatter of tiny high clicks over the next second
    for (let i = 0; i < 14; i++) {
      const t = now + 0.35 + Math.random() * 1.1;
      const c = ctx.createBufferSource();
      c.buffer = this.noise(ctx);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 3500;
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.12 * v * Math.random(), t);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      c.connect(hp);
      hp.connect(cg);
      cg.connect(this.sfxGain);
      c.start(t, Math.random() * 0.9, 0.04);
    }
  }

  /** Soft two-note ping for a new private message */
  public playMessagePing(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    [880, 1318.5].forEach((freq, idx) => {
      const t = ctx.currentTime + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  public playBouquetSfx(won = false): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const notes = won ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [440, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      const t = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }
}

export const soundEngine = new WeddingSoundEngine();
