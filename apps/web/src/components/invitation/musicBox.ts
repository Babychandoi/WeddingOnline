/**
 * A gentle music-box waltz synthesised in the browser: an original 16-bar melody over a
 * I–vi–IV–V arpeggio in 3/4, with a soft reverb. No recording, no licence, ~0 bytes to load.
 * Or, when the couple provides one, their own audio file.
 */

const BPM = 84;
const BEAT = 60 / BPM;

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Chords per bar (MIDI roots in octave 3): C, Am, F, G, C, Em, F, G | Am, F, C, G, F, G, C, C
const ROOTS = [48, 45, 41, 43, 48, 52, 41, 43, 45, 41, 48, 43, 41, 43, 48, 48];
const MINOR = new Set([1, 5, 8]);

// Melody: [midi, beats] per bar, three beats per bar
const MELODY: Array<Array<[number, number]>> = [
  [[76, 1], [79, 1], [84, 1]],
  [[83, 2], [81, 1]],
  [[81, 1], [77, 1], [72, 1]],
  [[74, 3]],
  [[76, 1], [79, 1], [84, 1]],
  [[86, 2], [83, 1]],
  [[81, 1], [79, 1], [77, 1]],
  [[79, 3]],
  [[81, 1], [84, 1], [88, 1]],
  [[86, 1], [84, 1], [81, 1]],
  [[79, 1.5], [76, 0.5], [79, 1]],
  [[83, 3]],
  [[81, 1], [77, 1], [74, 1]],
  [[79, 1], [77, 1], [74, 1]],
  [[76, 1], [74, 1], [71, 1]],
  [[72, 3]],
];

export class MusicBox {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextBar = 0;
  private nextTime = 0;
  private audio: HTMLAudioElement | null = null;

  constructor(private readonly url: string | null) {}

  get playing(): boolean {
    return this.timer !== null || Boolean(this.audio && !this.audio.paused);
  }

  /** Must be called from a user gesture (the envelope tap) */
  async start(): Promise<boolean> {
    if (this.url) {
      if (!this.audio) {
        this.audio = new Audio(this.url);
        this.audio.loop = true;
        this.audio.volume = 0.55;
      }
      try {
        await this.audio.play();
        return true;
      } catch {
        return false;
      }
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return false;
    if (!this.ctx) {
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      const reverb = this.ctx.createConvolver();
      reverb.buffer = this.impulse(2.2);
      const wet = this.ctx.createGain();
      wet.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
      this.master.connect(reverb);
      reverb.connect(wet);
      wet.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => undefined);
    const now = this.ctx.currentTime;
    this.master!.gain.cancelScheduledValues(now);
    this.master!.gain.setValueAtTime(this.master!.gain.value, now);
    this.master!.gain.linearRampToValueAtTime(0.32, now + 1.5);
    this.nextTime = now + 0.1;
    if (!this.timer) this.timer = setInterval(() => this.schedule(), 120);
    this.schedule();
    return true;
  }

  stop(): void {
    if (this.audio) this.audio.pause();
    if (this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.master.gain.value, now);
      this.master.gain.linearRampToValueAtTime(0, now + 0.6);
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  dispose(): void {
    this.stop();
    this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.audio = null;
  }

  private schedule() {
    if (!this.ctx) return;
    while (this.nextTime < this.ctx.currentTime + 0.6) {
      const bar = this.nextBar % MELODY.length;
      const root = ROOTS[bar];
      const third = MINOR.has(bar) ? 3 : 4;
      // Left hand: root, fifth, tenth on each beat
      [root, root + 7, root + 12 + third].forEach((n, i) => this.pluck(midi(n), this.nextTime + i * BEAT, 0.12, 1.8));
      let t = this.nextTime;
      for (const [n, beats] of MELODY[bar]) {
        this.pluck(midi(n), t, 0.2, 2.4);
        t += beats * BEAT;
      }
      this.nextTime += 3 * BEAT;
      this.nextBar += 1;
    }
  }

  /** A music-box tine: sine fundamental + quiet octave partial, fast attack, long decay */
  private pluck(freq: number, at: number, level: number, decay: number) {
    const ctx = this.ctx!;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level, at + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    env.connect(this.master!);
    [
      [1, 1],
      [2, 0.28],
      [4.2, 0.06],
    ].forEach(([mult, gain]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq * mult, at);
      g.gain.value = gain;
      o.connect(g);
      g.connect(env);
      o.start(at);
      o.stop(at + decay + 0.05);
    });
  }

  private impulse(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return buf;
  }
}
