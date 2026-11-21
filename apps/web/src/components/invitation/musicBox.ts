/**
 * Wedding music synthesised in the browser: no recording to download, no licence to clear.
 * Public-domain classics (Pachelbel, Wagner, Beethoven) in our own simple arrangements, and
 * pieces written for the site. Or, when the couple provides one, their own audio file.
 */

import type { InvitationMusicTrackId } from '@dco/shared';

type Voice = 'box' | 'piano' | 'violin' | 'flute' | 'zither' | 'pad';
type Pattern = 'waltz' | 'arp8' | 'pad' | 'drone' | 'bass8';

interface Unit {
  /** Chord tones, MIDI, low to high */
  chord: number[];
  /** [MIDI or null for a rest, length in beats], filling the unit */
  melody: Array<[number | null, number]>;
  /** A second melody line (thirds, canon voice) */
  harmony?: Array<[number | null, number]>;
}

interface Track {
  bpm: number;
  /** Beats per unit (a unit carries one chord) */
  beats: number;
  lead: Voice;
  accomp: Voice;
  pattern: Pattern;
  units: Unit[];
}

/* ───────────── Notation helpers ───────────── */

const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** "F#5" → 78 */
function n(name: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
/** "E5/1 G5/0.5 r/0.5" → melody */
function mel(s: string): Array<[number | null, number]> {
  return s
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const [name, len] = tok.split('/');
      return [name === 'r' ? null : n(name), Number(len)];
    });
}
/** "D3 A3 D4 F#4" → chord */
const ch = (s: string) => s.trim().split(/\s+/).map(n);

const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/* ───────────── The pieces ───────────── */

const C = ch('C3 G3 C4 E4');
const G = ch('G2 D3 G3 B3');
const F = ch('F2 C3 F3 A3');
const Am = ch('A2 E3 A3 C4');
const Em = ch('E3 B3 E4 G4');

// Original music-box waltz (C major, 3/4)
const WALTZ_ROOTS = [48, 45, 41, 43, 48, 52, 41, 43, 45, 41, 48, 43, 41, 43, 48, 48];
const WALTZ_MINOR = new Set([1, 5, 8]);
const WALTZ_MELODY = [
  'E5/1 G5/1 C6/1', 'B5/2 A5/1', 'A5/1 F5/1 C5/1', 'D5/3',
  'E5/1 G5/1 C6/1', 'D6/2 B5/1', 'A5/1 G5/1 F5/1', 'G5/3',
  'A5/1 C6/1 E6/1', 'D6/1 C6/1 A5/1', 'G5/1.5 E5/0.5 G5/1', 'B5/3',
  'A5/1 F5/1 D5/1', 'G5/1 F5/1 D5/1', 'E5/1 D5/1 B4/1', 'C5/3',
];

// Pachelbel's ground: D A Bm F#m G D G A, one chord per half note
const CANON_CHORDS = ['D3 A3 D4 F#4', 'A2 E3 A3 C#4', 'B2 F#3 B3 D4', 'F#2 C#3 F#3 A3', 'G2 D3 G3 B3', 'D3 A3 D4 F#4', 'G2 D3 G3 B3', 'A2 E3 A3 C#4'].map(ch);
const CANON_V1 = ['F#5/2', 'E5/2', 'D5/2', 'C#5/2', 'B4/2', 'A4/2', 'B4/2', 'C#5/2'];
const CANON_V1_LOW = ['D5/2', 'C#5/2', 'B4/2', 'A4/2', 'G4/2', 'F#4/2', 'G4/2', 'A4/2'];
const CANON_V2 = ['D5/1 F#5/1', 'A5/1 G5/1', 'F#5/1 D5/1', 'F#5/1 E5/1', 'D5/1 B4/1', 'D5/1 A5/1', 'G5/1 B5/1', 'A5/1 G5/1'];

const TRACKS: Record<InvitationMusicTrackId, Track> = {
  'hop-nhac': {
    bpm: 84,
    beats: 3,
    lead: 'box',
    accomp: 'box',
    pattern: 'waltz',
    units: WALTZ_ROOTS.map((root, i) => ({
      chord: [root, root + 7, root + 12 + (WALTZ_MINOR.has(i) ? 3 : 4)],
      melody: mel(WALTZ_MELODY[i]),
    })),
  },

  canon: {
    bpm: 64,
    beats: 2,
    lead: 'violin',
    accomp: 'piano',
    pattern: 'arp8',
    units: [
      // the ground alone, then the first violin line, then the leaping variation, then two voices
      ...CANON_CHORDS.map((chord) => ({ chord, melody: mel('r/2') })),
      ...CANON_CHORDS.map((chord, i) => ({ chord, melody: mel(CANON_V1[i]) })),
      ...CANON_CHORDS.map((chord, i) => ({ chord, melody: mel(CANON_V2[i]) })),
      ...CANON_CHORDS.map((chord, i) => ({ chord, melody: mel(CANON_V1[i]), harmony: mel(CANON_V1_LOW[i]) })),
    ],
  },

  bridal: {
    // Wagner's Bridal Chorus, opening phrases, slow processional
    bpm: 60,
    beats: 2,
    lead: 'violin',
    accomp: 'pad',
    pattern: 'pad',
    units: [
      { chord: C, melody: mel('r/1 G4/1') },
      { chord: C, melody: mel('C5/1.5 C5/0.5') },
      { chord: C, melody: mel('C5/2') },
      { chord: C, melody: mel('r/1 G4/1') },
      { chord: G, melody: mel('D5/1.5 B4/0.5') },
      { chord: C, melody: mel('C5/2') },
      { chord: C, melody: mel('r/1 G4/1') },
      { chord: C, melody: mel('C5/1.5 C5/0.5') },
      { chord: F, melody: mel('C5/2') },
      { chord: F, melody: mel('r/1 G4/1') },
      { chord: G, melody: mel('D5/1.5 B4/0.5') },
      { chord: C, melody: mel('C5/2') },
      // a short cadence of our own before it starts again
      { chord: Am, melody: mel('E5/1 C5/1') },
      { chord: F, melody: mel('A4/1 C5/1') },
      { chord: G, melody: mel('B4/1 D5/1') },
      { chord: C, melody: mel('C5/2') },
    ],
  },

  ode: {
    // Beethoven, "Ode to Joy" (C major, 4/4)
    bpm: 96,
    beats: 4,
    lead: 'piano',
    accomp: 'piano',
    pattern: 'arp8',
    units: [
      { chord: C, melody: mel('E5/1 E5/1 F5/1 G5/1') },
      { chord: G, melody: mel('G5/1 F5/1 E5/1 D5/1') },
      { chord: C, melody: mel('C5/1 C5/1 D5/1 E5/1') },
      { chord: G, melody: mel('E5/1.5 D5/0.5 D5/2') },
      { chord: C, melody: mel('E5/1 E5/1 F5/1 G5/1') },
      { chord: G, melody: mel('G5/1 F5/1 E5/1 D5/1') },
      { chord: C, melody: mel('C5/1 C5/1 D5/1 E5/1') },
      { chord: C, melody: mel('D5/1.5 C5/0.5 C5/2') },
      { chord: G, melody: mel('D5/1 D5/1 E5/1 C5/1') },
      { chord: G, melody: mel('D5/1 E5/0.5 F5/0.5 E5/1 C5/1') },
      { chord: G, melody: mel('D5/1 E5/0.5 F5/0.5 E5/1 D5/1') },
      { chord: G, melody: mel('C5/1 D5/1 G4/2') },
      { chord: C, melody: mel('E5/1 E5/1 F5/1 G5/1') },
      { chord: G, melody: mel('G5/1 F5/1 E5/1 D5/1') },
      { chord: C, melody: mel('C5/1 C5/1 D5/1 E5/1') },
      { chord: C, melody: mel('D5/1.5 C5/0.5 C5/2') },
    ],
  },

  piano: {
    // Original: G D Em C, a slow romantic piano line
    bpm: 70,
    beats: 4,
    lead: 'piano',
    accomp: 'piano',
    pattern: 'arp8',
    units: [
      { chord: ch('G2 D3 G3 B3'), melody: mel('D5/1.5 B4/0.5 D5/2') },
      { chord: ch('D3 A3 D4 F#4'), melody: mel('F#5/1.5 E5/0.5 D5/2') },
      { chord: Em, melody: mel('E5/1 G5/1 B5/1.5 A5/0.5') },
      { chord: ch('C3 G3 C4 E4'), melody: mel('G5/2 E5/2') },
      { chord: ch('G2 D3 G3 B3'), melody: mel('D5/1 B4/1 G5/1.5 F#5/0.5') },
      { chord: ch('D3 A3 D4 F#4'), melody: mel('E5/1 D5/1 A4/2') },
      { chord: ch('C3 G3 C4 E4'), melody: mel('C5/1 E5/1 G5/1 E5/1') },
      { chord: ch('D3 A3 D4 F#4'), melody: mel('D5/4') },
      { chord: Em, melody: mel('B4/1 E5/1 G5/2') },
      { chord: ch('C3 G3 C4 E4'), melody: mel('G5/1 E5/1 C5/2') },
      { chord: ch('G2 D3 G3 B3'), melody: mel('D5/1.5 E5/0.5 D5/1 B4/1') },
      { chord: ch('D3 A3 D4 F#4'), melody: mel('A4/2 F#5/2') },
      { chord: Em, melody: mel('E5/1 F#5/1 G5/2') },
      { chord: ch('C3 G3 C4 E4'), melody: mel('G5/1 A5/1 B5/2') },
      { chord: ch('D3 A3 D4 F#4'), melody: mel('A5/1.5 G5/0.5 F#5/1 A5/1') },
      { chord: ch('G2 D3 G3 B3'), melody: mel('G5/4') },
    ],
  },

  'sao-truc': {
    // Original, Vietnamese pentatonic (C D F G A) on a bamboo flute over a soft drone
    bpm: 62,
    beats: 4,
    lead: 'flute',
    accomp: 'pad',
    pattern: 'drone',
    units: [
      { chord: ch('C3 G3'), melody: mel('G5/2 A5/1 C6/1') },
      { chord: ch('F2 C3'), melody: mel('A5/1.5 G5/0.5 F5/2') },
      { chord: ch('C3 G3'), melody: mel('D5/1 F5/1 G5/1.5 A5/0.5') },
      { chord: ch('C3 G3'), melody: mel('G5/4') },
      { chord: ch('F2 C3'), melody: mel('C6/2 A5/1 G5/1') },
      { chord: ch('F2 C3'), melody: mel('F5/1 G5/1 A5/1 F5/1') },
      { chord: ch('G2 D3'), melody: mel('D5/1.5 F5/0.5 D5/1 C5/1') },
      { chord: ch('C3 G3'), melody: mel('C5/4') },
    ],
  },

  'dan-tranh': {
    // Original, pentatonic zither with a plucked low line
    bpm: 88,
    beats: 4,
    lead: 'zither',
    accomp: 'zither',
    pattern: 'bass8',
    units: [
      { chord: ch('C3 G3'), melody: mel('C5/0.5 D5/0.5 F5/1 G5/1 A5/1') },
      { chord: ch('F2 C3'), melody: mel('G5/0.5 F5/0.5 D5/1 C5/2') },
      { chord: ch('F2 C3'), melody: mel('F5/0.5 G5/0.5 A5/1 C6/1 A5/1') },
      { chord: ch('C3 G3'), melody: mel('G5/3 r/1') },
      { chord: ch('D3 A3'), melody: mel('A5/0.5 G5/0.5 F5/1 D5/1 F5/1') },
      { chord: ch('C3 G3'), melody: mel('G5/1 A5/0.5 G5/0.5 F5/2') },
      { chord: ch('G2 D3'), melody: mel('D5/0.5 F5/0.5 G5/1 F5/0.5 D5/0.5 C5/1') },
      { chord: ch('C3 G3'), melody: mel('C5/4') },
    ],
  },
};

/* ───────────── Player ───────────── */

export class MusicBox {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextUnit = 0;
  private nextTime = 0;
  private audio: HTMLAudioElement | null = null;
  private readonly track: Track;

  constructor(
    private readonly url: string | null,
    trackId: InvitationMusicTrackId = 'hop-nhac',
  ) {
    this.track = TRACKS[trackId] ?? TRACKS['hop-nhac'];
  }

  get playing(): boolean {
    return this.timer !== null || Boolean(this.audio && !this.audio.paused);
  }

  /** Must be called from a user gesture (the envelope tap, a play button) */
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
      reverb.buffer = this.impulse(2.4);
      const wet = this.ctx.createGain();
      wet.gain.value = 0.32;
      this.master.connect(this.ctx.destination);
      this.master.connect(reverb);
      reverb.connect(wet);
      wet.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => undefined);
    const now = this.ctx.currentTime;
    this.master!.gain.cancelScheduledValues(now);
    this.master!.gain.setValueAtTime(this.master!.gain.value, now);
    this.master!.gain.linearRampToValueAtTime(0.34, now + 1.5);
    this.nextTime = now + 0.12;
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
    const ctx = this.ctx;
    this.ctx = null;
    this.audio = null;
    // let the fade finish before closing
    if (ctx) setTimeout(() => ctx.close().catch(() => undefined), 700);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) return;
    const tr = this.track;
    const beat = 60 / tr.bpm;
    while (this.nextTime < ctx.currentTime + 0.8) {
      const u = tr.units[this.nextUnit % tr.units.length];
      const t0 = this.nextTime;
      const unitLen = tr.beats * beat;
      this.accompany(u.chord, t0, unitLen, beat);
      for (const line of [u.melody, u.harmony]) {
        if (!line) continue;
        let t = t0;
        for (const [note, len] of line) {
          if (note !== null) this.play(tr.lead, midiHz(note), t, len * beat, line === u.harmony ? 0.6 : 1);
          t += len * beat;
        }
      }
      this.nextTime += unitLen;
      this.nextUnit += 1;
    }
  }

  private accompany(chord: number[], t0: number, unitLen: number, beat: number) {
    const tr = this.track;
    const v = tr.accomp;
    switch (tr.pattern) {
      case 'waltz':
        chord.slice(0, tr.beats).forEach((m, i) => this.play(v, midiHz(m), t0 + i * beat, beat * 1.6, 0.55));
        break;
      case 'arp8': {
        // root on the beat, then up and down through the chord in eighths
        const order = [0, 1, 2, 3, 2, 1, 2, 3];
        const steps = Math.round((unitLen / beat) * 2);
        for (let i = 0; i < steps; i++) {
          const m = chord[order[i % order.length] % chord.length];
          this.play(v, midiHz(m), t0 + (i * beat) / 2, i === 0 ? unitLen : beat * 1.2, i === 0 ? 0.5 : 0.32);
        }
        break;
      }
      case 'pad':
        this.play('pad', midiHz(chord[0] - 12), t0, unitLen, 0.5);
        chord.slice(1).forEach((m) => this.play('pad', midiHz(m), t0, unitLen, 0.3));
        break;
      case 'drone':
        chord.forEach((m) => this.play('pad', midiHz(m), t0, unitLen, 0.32));
        this.play('zither', midiHz(chord[0]), t0, beat * 2, 0.35);
        break;
      case 'bass8': {
        const steps = Math.round((unitLen / beat) * 2);
        for (let i = 0; i < steps; i++) {
          const m = i % 4 === 0 ? chord[0] : i % 2 === 0 ? chord[1] : chord[0] + 12;
          this.play(v, midiHz(m), t0 + (i * beat) / 2, beat, i % 4 === 0 ? 0.42 : 0.24);
        }
        break;
      }
    }
  }

  /** One note on one instrument */
  private play(voice: Voice, freq: number, at: number, len: number, level: number) {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.connect(this.master!);
    const osc = (type: OscillatorType, f: number, gain: number, dest: AudioNode, until: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, at);
      g.gain.value = gain;
      o.connect(g);
      g.connect(dest);
      o.start(at);
      o.stop(until);
      return o;
    };
    const vibrato = (o: OscillatorNode, depth: number, rate: number, from: number, until: number) => {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = rate;
      lg.gain.setValueAtTime(0, at);
      lg.gain.linearRampToValueAtTime(depth, from);
      lfo.connect(lg);
      lg.connect(o.frequency);
      lfo.start(at);
      lfo.stop(until);
    };

    switch (voice) {
      case 'box': {
        const decay = Math.max(1.6, len + 1);
        out.gain.setValueAtTime(0.0001, at);
        out.gain.exponentialRampToValueAtTime(0.2 * level, at + 0.008);
        out.gain.exponentialRampToValueAtTime(0.0001, at + decay);
        [[1, 1], [2, 0.28], [4.2, 0.06]].forEach(([m, g]) => osc('sine', freq * m, g, out, at + decay + 0.05));
        break;
      }
      case 'piano': {
        const decay = Math.min(3.2, Math.max(1.2, len * 1.6));
        out.gain.setValueAtTime(0.0001, at);
        out.gain.exponentialRampToValueAtTime(0.22 * level, at + 0.006);
        out.gain.exponentialRampToValueAtTime(0.09 * level, at + 0.25);
        out.gain.exponentialRampToValueAtTime(0.0001, at + decay);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(Math.min(9000, freq * 9), at);
        lp.frequency.exponentialRampToValueAtTime(Math.min(4000, freq * 3), at + 0.6);
        lp.connect(out);
        osc('triangle', freq, 1, lp, at + decay + 0.05);
        osc('sine', freq * 2.003, 0.35, lp, at + decay + 0.05);
        osc('sine', freq * 3.01, 0.12, lp, at + decay * 0.6);
        break;
      }
      case 'violin': {
        const end = at + len + 0.35;
        out.gain.setValueAtTime(0.0001, at);
        out.gain.linearRampToValueAtTime(0.085 * level, at + Math.min(0.18, len * 0.3));
        out.gain.setValueAtTime(0.085 * level, at + Math.max(0.2, len - 0.05));
        out.gain.linearRampToValueAtTime(0.0001, end);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = Math.min(5200, freq * 6);
        lp.Q.value = 0.7;
        lp.connect(out);
        const a = osc('sawtooth', freq, 0.6, lp, end + 0.05);
        const b = osc('sawtooth', freq * 1.004, 0.5, lp, end + 0.05);
        if (len > 0.45) {
          vibrato(a, freq * 0.006, 5.4, at + 0.3, end);
          vibrato(b, freq * 0.006, 5.1, at + 0.3, end);
        }
        break;
      }
      case 'pad': {
        const end = at + len + 0.6;
        out.gain.setValueAtTime(0.0001, at);
        out.gain.linearRampToValueAtTime(0.05 * level, at + Math.min(0.5, len * 0.4));
        out.gain.setValueAtTime(0.05 * level, at + len);
        out.gain.linearRampToValueAtTime(0.0001, end);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1400;
        lp.connect(out);
        osc('sawtooth', freq * 0.997, 0.5, lp, end + 0.05);
        osc('triangle', freq * 1.003, 0.7, lp, end + 0.05);
        break;
      }
      case 'flute': {
        const end = at + len + 0.25;
        out.gain.setValueAtTime(0.0001, at);
        out.gain.linearRampToValueAtTime(0.16 * level, at + 0.07);
        out.gain.setValueAtTime(0.14 * level, at + Math.max(0.1, len - 0.05));
        out.gain.linearRampToValueAtTime(0.0001, end);
        // a slight scoop up into each note, like a bamboo flute
        const o = osc('sine', freq * 0.97, 1, out, end + 0.05);
        o.frequency.exponentialRampToValueAtTime(freq, at + 0.09);
        osc('triangle', freq * 2, 0.08, out, end + 0.05);
        if (len > 0.6) vibrato(o, freq * 0.008, 5, at + 0.35, end);
        // breath
        if (this.noise) {
          const src = ctx.createBufferSource();
          src.buffer = this.noise;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = freq * 2;
          bp.Q.value = 2;
          const ng = ctx.createGain();
          ng.gain.setValueAtTime(0.0001, at);
          ng.gain.linearRampToValueAtTime(0.05 * level, at + 0.04);
          ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
          src.connect(bp);
          bp.connect(ng);
          ng.connect(out);
          src.start(at);
          src.stop(at + 0.35);
        }
        break;
      }
      case 'zither': {
        const decay = Math.max(0.9, Math.min(2.6, len * 1.4));
        out.gain.setValueAtTime(0.0001, at);
        out.gain.exponentialRampToValueAtTime(0.2 * level, at + 0.004);
        out.gain.exponentialRampToValueAtTime(0.0001, at + decay);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(Math.min(8000, freq * 8), at);
        lp.frequency.exponentialRampToValueAtTime(Math.min(2500, freq * 2), at + 0.4);
        lp.connect(out);
        const o = osc('sawtooth', freq, 0.5, lp, at + decay + 0.05);
        osc('triangle', freq * 2, 0.3, lp, at + decay + 0.05);
        // the zither's pressed-string waver on long notes
        if (len >= 1.5) vibrato(o, freq * 0.012, 4.2, at + 0.45, at + decay);
        break;
      }
    }
  }

  private impulse(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    // a little white noise for breathy instruments
    const nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
    return buf;
  }
}

/** Timing check for the built-in pieces: every line of every unit fills exactly its beats */
export function musicTrackProblems(): string[] {
  const out: string[] = [];
  for (const [id, tr] of Object.entries(TRACKS)) {
    tr.units.forEach((u, i) => {
      for (const [name, line] of [['melody', u.melody], ['harmony', u.harmony]] as const) {
        if (!line) continue;
        const total = line.reduce((s, [, len]) => s + len, 0);
        if (Math.abs(total - tr.beats) > 1e-9) out.push(`${id} unit ${i + 1} ${name}: ${total} beats, expected ${tr.beats}`);
      }
      if (u.chord.length === 0) out.push(`${id} unit ${i + 1}: empty chord`);
    });
  }
  return out;
}
