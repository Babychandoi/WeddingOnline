import { EventEmitter } from 'node:events';
import Redis from 'ioredis';
import { HALL_CHAT_HISTORY_SIZE, type FireworkPackId, type HallChatMessage, type PrivateMessage } from '@dco/shared';

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
    }
  | {
      /** A line of the shared chat; every shard of the wedding shows it */
      type: 'HALL_CHAT';
      weddingId: string;
      message: HallChatMessage;
    }
  | {
      /** A private message: each shard hands it only to the sender's and the recipient's sessions */
      type: 'DM';
      weddingId: string;
      message: PrivateMessage;
    }
  | {
      /** Paid fireworks (from the web app's payment webhook) */
      type: 'FIREWORKS_LAUNCH';
      weddingId: string;
      orderId: string;
      buyerName: string;
      packId: FireworkPackId;
      message: string;
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
  /** Recent shared-chat lines per wedding, so people who come in later see the congratulations */
  private chatHistory = new Map<string, HallChatMessage[]>();
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
            this.remember(parsed);
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
    this.remember(event);
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

  /** Keeps shared-chat lines (never private messages) for the history a newcomer gets */
  private remember(event: CrossShardEvent): void {
    if (event.type !== 'HALL_CHAT') return;
    const list = this.chatHistory.get(event.weddingId) ?? [];
    list.push(event.message);
    if (list.length > HALL_CHAT_HISTORY_SIZE) list.splice(0, list.length - HALL_CHAT_HISTORY_SIZE);
    this.chatHistory.set(event.weddingId, list);
  }

  public getChatHistory(weddingId: string): HallChatMessage[] {
    return this.chatHistory.get(weddingId) ?? [];
  }

  /** The last room of a wedding closed: its chat goes with it */
  public forgetWedding(weddingId: string): void {
    this.chatHistory.delete(weddingId);
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
