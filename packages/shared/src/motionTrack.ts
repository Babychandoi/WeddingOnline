/**
 * Smooth playback of other people's movement.
 *
 * Positions arrive ~10 times a second, unevenly (network jitter, and the server batches
 * state every 50 ms). Chasing the newest position makes avatars dash, stop and dash again.
 * Instead each avatar is drawn a fixed moment in the past, interpolating between the two
 * samples around that moment — constant speed, no stops. Samples are placed on the
 * sender's own clock (the `mt` stamp it sends with each move), so arrival jitter does not
 * turn into speed jitter.
 */

export interface MotionPose {
  x: number;
  z: number;
  rotY: number;
  /** metres per second, for the walk cycle */
  speed: number;
}

interface Sample {
  t: number;
  x: number;
  z: number;
  rotY: number;
}

/**
 * How far in the past remote avatars are drawn: one send interval plus the network jitter
 * actually observed on this track (peak-held, slowly decaying), within these bounds.
 */
const MIN_DELAY_MS = 120;
const MAX_DELAY_MS = 400;
/** The delay drifts towards its target by at most 3% of elapsed time — an invisible speed change */
const DELAY_SLEW = 0.03;
/** Moves larger than this are seat changes / spawns: jump instead of sliding across the hall */
const TELEPORT_METRES = 3.2;

function angleLerp(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export class MotionTrack {
  private samples: Sample[] = [];
  /** local clock − sender clock, estimated from the fastest delivery seen */
  private offset: number | null = null;
  private lastSenderT = 0;
  private lastPushAt = 0;
  /** Peak-held lateness of arrivals behind the fastest delivery, ms */
  private jitter = 40;
  /** Peak-held gap between consecutive sends, ms */
  private interval = 110;
  private delay = 170;
  private lastSampleAt = 0;

  /** Record the latest server state; `senderT` is the mover's clock stamp (0 when the server moved them) */
  push(x: number, z: number, rotY: number, senderT: number, now: number): void {
    const last = this.samples[this.samples.length - 1];
    if (last && last.x === x && last.z === z && last.rotY === rotY) return;

    if (last && Math.hypot(x - last.x, z - last.z) > TELEPORT_METRES) {
      this.samples = [];
    }

    // Let the offset creep up slowly so one unusually fast packet does not pin it forever
    if (this.offset !== null) this.offset += (now - this.lastPushAt) * 0.01;
    this.lastPushAt = now;

    let t = now;
    if (senderT > 0 && senderT !== this.lastSenderT) {
      const observed = now - senderT;
      if (this.offset === null || observed < this.offset) this.offset = observed;
      t = senderT + this.offset;
      // Peak-hold with a slow decay (~1 ms per sample) so one spike is remembered for a while
      this.jitter = Math.max(now - t, this.jitter - 1);
      const gap = this.lastSenderT > 0 ? senderT - this.lastSenderT : 0;
      if (gap > 0 && gap < 1000) this.interval = Math.max(gap, this.interval - 1);
      this.lastSenderT = senderT;
    }
    const prev = this.samples[this.samples.length - 1];
    if (prev && t <= prev.t) t = prev.t + 1;

    this.samples.push({ t, x, z, rotY });
    if (this.samples.length > 40) this.samples.splice(0, this.samples.length - 40);
  }

  /** Where the avatar should be drawn at local time `now` (performance.now()) */
  sample(now: number): MotionPose | null {
    const s = this.samples;
    if (s.length === 0) return null;
    const want = Math.min(MAX_DELAY_MS, Math.max(MIN_DELAY_MS, this.interval + this.jitter + 15));
    const elapsed = this.lastSampleAt ? Math.min(100, now - this.lastSampleAt) : 0;
    this.lastSampleAt = now;
    const step = elapsed * DELAY_SLEW;
    this.delay += Math.max(-step, Math.min(step, want - this.delay));
    const rt = now - this.delay;

    // Drop samples we have moved past, keeping the one just before the render time
    while (s.length > 2 && s[1].t <= rt) s.shift();

    if (s.length === 1 || rt <= s[0].t) {
      return { x: s[0].x, z: s[0].z, rotY: s[0].rotY, speed: 0 };
    }
    const a = s[0];
    const b = s[1];
    if (rt >= b.t) {
      // Ran out of samples (they stopped, or a packet is late): hold the last position
      return { x: b.x, z: b.z, rotY: b.rotY, speed: 0 };
    }
    const k = (rt - a.t) / (b.t - a.t);
    const dist = Math.hypot(b.x - a.x, b.z - a.z);
    return {
      x: a.x + (b.x - a.x) * k,
      z: a.z + (b.z - a.z) * k,
      rotY: angleLerp(a.rotY, b.rotY, k),
      speed: dist / Math.max(0.001, (b.t - a.t) / 1000),
    };
  }
}

/** One track per avatar, keyed by session id (players) or `npc:<id>` */
export type MotionStore = Map<string, MotionTrack>;

export function npcTrackKey(npcId: string): string {
  return `npc:${npcId}`;
}
