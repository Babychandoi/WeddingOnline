import { EventEmitter } from 'node:events';
import Redis from 'ioredis';

export type CrossShardEvent =
  | {
      type: 'GIFT_CELEBRATION_EVENT';
      weddingId: string;
      guestName: string;
      wishMessage: string;
    }
  | {
      type: 'PLAN_ACTIVATED';
      weddingId: string;
      tier: string;
    }
  | {
      type: 'FORCE_ARCHIVE_ROOM' | 'ROOM_EXPIRED';
      weddingId: string;
    }
  | {
      type: 'MOD_BAN_USER';
      weddingId: string;
      userId: string;
      action: 'MUTE' | 'UNMUTE' | 'KICK' | 'BAN';
    }
  | {
      /** Published with weddingId = PLATFORM_EVENT_SCOPE: reaches every room */
      type: 'ACCOUNT_LOCKED';
      weddingId: string;
      userId: string;
    };

export interface ShardSummary {
  roomId: string;
  weddingId: string;
  shardIndex: number;
  clients: number;
  maxClients: number;
}

class RealtimeEventBus {
  private emitter = new EventEmitter();
  private pub: Redis | null = null;
  private sub: Redis | null = null;
  private shards = new Map<string, ShardSummary>();
  private instanceId = `${process.pid}_${Math.random().toString(36).slice(2, 10)}`;

  constructor() {
    this.emitter.setMaxListeners(200);
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.pub = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
        this.sub = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
        this.sub.on('pmessage', (_pattern, _channel, message) => {
          try {
            const parsed = JSON.parse(message) as CrossShardEvent & { _originInstanceId?: string };
            if (parsed._originInstanceId === this.instanceId) {
              return;
            }
            this.emitter.emit(`wedding:${parsed.weddingId}`, parsed);
          } catch {
            // ignore malformed pubsub message
          }
        });
        this.sub.psubscribe('wedding:*:events').catch(() => {});
      } catch {
        this.pub = null;
        this.sub = null;
      }
    }
  }

  public publish(event: CrossShardEvent): void {
    // Always emit locally for single-process shards
    this.emitter.emit(`wedding:${event.weddingId}`, event);
    if (this.pub) {
      const payload = JSON.stringify({ ...event, _originInstanceId: this.instanceId });
      this.pub.publish(`wedding:${event.weddingId}:events`, payload).catch(() => {});
    }
  }

  public subscribe(weddingId: string, handler: (ev: CrossShardEvent) => void): () => void {
    const topic = `wedding:${weddingId}`;
    this.emitter.on(topic, handler);
    return () => {
      this.emitter.off(topic, handler);
    };
  }

  public upsertShard(summary: ShardSummary): void {
    this.shards.set(summary.roomId, summary);
  }

  public removeShard(roomId: string): void {
    this.shards.delete(roomId);
  }

  public getShardsForWedding(weddingId: string): ShardSummary[] {
    return Array.from(this.shards.values())
      .filter((s) => s.weddingId === weddingId)
      .sort((a, b) => a.shardIndex - b.shardIndex);
  }
}

export const eventBus = new RealtimeEventBus();
