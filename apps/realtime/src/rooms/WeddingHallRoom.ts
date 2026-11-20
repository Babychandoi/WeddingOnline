import { Room, type Client } from '@colyseus/core';
import { dbRepo } from '@dco/database';
import {
  BouquetSchema,
  CeremonySchema,
  NpcSchema,
  PLATFORM_EVENT_SCOPE,
  PlayerSchema,
  STARTER_TEMPLATES,
  VideoSyncSchema,
  WS_MESSAGES,
  WeddingRoomState,
  getGateSpawnCell,
  getPrefabCenterWorld,
  getTableSeatAnchors,
  gridCellToWorld,
  sanitizeBubbleText,
  couplePersonId,
  sanitizePersonId,
  type CeremonyConfig,
  type JoinTokenPayload,
  type SceneLayoutDocument,
} from '@dco/shared';
import { verifyJoinToken } from '@dco/shared/server';
import { eventBus, type CrossShardEvent } from '../services/eventBus';

interface RoomOptions {
  weddingId?: string;
  slug?: string;
  shardIndex?: number;
}

const HOST_ROLES = new Set(['OWNER', 'BRIDE', 'GROOM', 'MC']);
const ALLOWED_EMOTES = new Set(['wave', 'clap', 'bow']);

export class WeddingHallRoom extends Room<WeddingRoomState> {
  private unsubscribeBus: (() => void) | null = null;
  private layout: SceneLayoutDocument = STARTER_TEMPLATES.luxury_ballroom.layout;
  private originalOutfits = new Map<string, string>();
  private originalPeople = new Map<string, string>();
  private lastChatTs = new Map<string, number>();
  private plazaNextAutoCeremonyAt = Date.now() + 25 * 60 * 1000;
  private bouquetCountdownEndsAt = 0;
  private ceremonyConfig: CeremonyConfig = {};
  private autoCeremonyTriggered = false;
  private scheduledBouquetAt = 0;
  private nextGreetingToggleAt = Date.now() + 5000;

  async onCreate(options: RoomOptions): Promise<void> {
    const wedding =
      (options.weddingId ? await dbRepo.getWeddingById(options.weddingId) : null) ??
      (options.slug ? await dbRepo.getWeddingBySlug(options.slug) : null) ??
      (await dbRepo.getWeddingBySlug('plaza'));

    if (!wedding) {
      throw new Error('WEDDING_NOT_FOUND');
    }

    const state = new WeddingRoomState();
    state.weddingId = wedding.id;
    state.slug = wedding.slug;
    state.tier = wedding.tier;
    state.shardIndex = options.shardIndex ?? 1;
    state.ceremony = new CeremonySchema();
    state.bouquet = new BouquetSchema();
    state.videoSync = new VideoSyncSchema();
    state.videoSync.embedUrl = wedding.videoEmbedUrl ?? '';
    state.videoSync.isLive = wedding.videoIsLive;

    this.maxClients = wedding.tier === 'TRIAL_24H' ? 15 : 60;
    this.setState(state);

    const sceneRecord = await dbRepo.getSceneByWeddingId(wedding.id);
    if (sceneRecord) {
      this.layout = sceneRecord.layoutData;
    }
    this.ceremonyConfig = wedding.ceremonyConfig ?? {};

    // Spawn Auto-NPCs (Bride & Groom)
    const gate = this.layout.prefabs.find((p) => p.prefabType === 'GATE_RECEPTION');
    const gatePos = gate ? getPrefabCenterWorld(gate) : { x: 0, z: 10 };

    const brideNpc = new NpcSchema();
    brideNpc.npcId = 'BRIDE';
    brideNpc.displayName = `Cô Dâu ${wedding.brideName}`;
    brideNpc.outfitId = 'vay_cuoi_trang';
    brideNpc.personId = couplePersonId('BRIDE', wedding.ceremonyConfig?.bridePersonId);
    brideNpc.x = gatePos.x - 1.2;
    brideNpc.z = gatePos.z - 2.4;
    brideNpc.rotY = 0;
    brideNpc.anim = 'wave';
    state.npcs.set('BRIDE', brideNpc);

    const groomNpc = new NpcSchema();
    groomNpc.npcId = 'GROOM';
    groomNpc.displayName = `Chú Rể ${wedding.groomName}`;
    groomNpc.outfitId = 'vest_chu_re';
    groomNpc.personId = couplePersonId('GROOM', wedding.ceremonyConfig?.groomPersonId);
    groomNpc.x = gatePos.x + 1.2;
    groomNpc.z = gatePos.z - 2.4;
    groomNpc.rotY = 0;
    groomNpc.anim = 'wave';
    state.npcs.set('GROOM', groomNpc);

    this.registerMessageHandlers();

    const unsubscribeWedding = eventBus.subscribe(wedding.id, (ev) => this.handleCrossShardEvent(ev));
    const unsubscribePlatform = eventBus.subscribe(PLATFORM_EVENT_SCOPE, (ev) => this.handleCrossShardEvent(ev));
    this.unsubscribeBus = () => {
      unsubscribeWedding();
      unsubscribePlatform();
    };
    this.updateShardRegistry();

    // Authoritative 10Hz tick
    this.setSimulationInterval(() => this.tick10Hz(), 100);
  }

  async onAuth(_client: Client, options: { joinToken?: string }): Promise<JoinTokenPayload> {
    if (!options?.joinToken) {
      throw new Error('MISSING_JOIN_TOKEN');
    }
    const payload = verifyJoinToken(options.joinToken);
    if (!payload) {
      throw new Error('INVALID_OR_EXPIRED_JOIN_TOKEN');
    }
    if (payload.weddingId !== this.state.weddingId) {
      throw new Error('WEDDING_MISMATCH');
    }

    const wedding = await dbRepo.getWeddingById(this.state.weddingId);
    if (!wedding) throw new Error('WEDDING_NOT_FOUND');
    if (wedding.status === 'EXPIRED_TRIAL' || wedding.status === 'ARCHIVED_2D_FOREVER') {
      throw new Error(`ROOM_CLOSED:${wedding.status}`);
    }

    // Mandatory Social OAuth guard on real weddings & trials
    if (wedding.tier !== 'PUBLIC_PLAZA' && payload.isAnonymousPlaza) {
      throw new Error('OAUTH_REQUIRED');
    }

    // Platform-wide account lock (anonymous plaza ids have no user record)
    if (!payload.isAnonymousPlaza) {
      const user = await dbRepo.getUserById(payload.userId);
      if (user?.isLocked) {
        throw new Error('ACCOUNT_LOCKED');
      }
    }

    // Enforce live Social-UID ban check
    const member = await dbRepo.getMember(wedding.id, payload.userId);
    if (member?.moderationStatus === 'BANNED') {
      throw new Error('USER_BANNED');
    }

    return {
      ...payload,
      isMuted: member?.moderationStatus === 'MUTED' || payload.isMuted,
    };
  }

  onJoin(client: Client, _options?: unknown, auth?: JoinTokenPayload): void {
    if (!auth) {
      client.leave(4001);
      return;
    }
    const player = new PlayerSchema();
    player.sessionId = client.sessionId;
    player.userId = auth.userId;
    player.displayName = auth.displayName;
    player.role = auth.role;
    player.side = auth.side;
    player.outfitId = auth.avatarConfig.outfitId || 'ao_dai_guest';
    player.hairId = auth.avatarConfig.hairId || 'hair_1';
    player.hairColor = auth.avatarConfig.hairColor || '#1f2937';
    player.personId = sanitizePersonId(auth.avatarConfig.personId);
    player.isMuted = auth.isMuted;

    const gate = this.layout.prefabs.find((p) => p.prefabType === 'GATE_RECEPTION');
    const spawnCell = gate ? getGateSpawnCell(gate) : { gx: 29, gz: 50 };
    const spawnWorld = gridCellToWorld(spawnCell.gx, spawnCell.gz);
    player.x = spawnWorld.x + (Math.random() - 0.5) * 1.6;
    player.z = spawnWorld.z + (Math.random() - 0.5) * 1.0;
    player.rotY = Math.PI;
    player.anim = 'idle';

    this.originalOutfits.set(client.sessionId, player.outfitId);
    this.originalPeople.set(client.sessionId, player.personId);
    this.state.players.set(client.sessionId, player);
    this.updateShardRegistry();
  }

  onLeave(client: Client): void {
    const player = this.state.players.get(client.sessionId);
    if (player?.takingOverNpc) {
      const npc = this.state.npcs.get(player.takingOverNpc);
      if (npc) npc.isTakenOver = false;
    }
    this.state.players.delete(client.sessionId);
    this.originalOutfits.delete(client.sessionId);
    this.originalPeople.delete(client.sessionId);
    this.lastChatTs.delete(client.sessionId);
    this.updateShardRegistry();
  }

  onDispose(): void {
    if (this.unsubscribeBus) {
      this.unsubscribeBus();
      this.unsubscribeBus = null;
    }
    eventBus.removeShard(this.roomId);
  }

  private updateShardRegistry(): void {
    eventBus.upsertShard({
      roomId: this.roomId,
      weddingId: this.state.weddingId,
      shardIndex: this.state.shardIndex,
      clients: this.state.players.size,
      maxClients: this.maxClients,
    });
  }

  private registerMessageHandlers(): void {
    this.onMessage(
      WS_MESSAGES.MOVE_INPUT,
      (client, msg: { x: number; z: number; rotY: number; isMoving: boolean; t?: number }) => {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        const clampedX = Math.max(-14.5, Math.min(14.5, Number(msg.x) || 0));
        const clampedZ = Math.max(-14.5, Math.min(14.5, Number(msg.z) || 0));
        // Anti-teleport step cap (~2.5m per message)
        const dist = Math.hypot(clampedX - player.x, clampedZ - player.z);
        if (dist <= 3.0) {
          player.x = clampedX;
          player.z = clampedZ;
          // Sender clock stamp, only used by viewers to pace playback; never trusted for logic
          const sentAt = Number(msg.t);
          if (Number.isFinite(sentAt) && sentAt > 0 && sentAt < 1e12) player.mt = Math.round(sentAt);
        }
        player.rotY = Number(msg.rotY) || 0;
        if (player.seatedTableNo >= 0 && msg.isMoving) {
          player.seatedTableNo = -1;
          player.seatIndex = -1;
        }
        if (player.seatedTableNo < 0) {
          player.anim = msg.isMoving ? 'walk' : 'idle';
        }
      }
    );

    this.onMessage(
      WS_MESSAGES.SIT_TABLE,
      (client, msg: { tableNo: number; seatIndex: number }) => {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        const tablePrefab = this.layout.prefabs.find(
          (p) =>
            (p.prefabType === 'BANQUET_TABLE_10' || p.prefabType === 'BANQUET_TABLE_8') &&
            p.meta?.tableNumber === msg.tableNo
        );
        if (!tablePrefab) return;
        const anchors = getTableSeatAnchors(tablePrefab);
        const anchor = anchors.find((a) => a.seatIndex === msg.seatIndex);
        if (!anchor) return;

        // Check seat occupancy
        let occupied = false;
        this.state.players.forEach((p, sid) => {
          if (sid !== client.sessionId && p.seatedTableNo === msg.tableNo && p.seatIndex === msg.seatIndex) {
            occupied = true;
          }
        });
        if (occupied) return;

        player.seatedTableNo = msg.tableNo;
        player.seatIndex = msg.seatIndex;
        player.x = anchor.x;
        player.z = anchor.z;
        player.rotY = anchor.rotY;
        player.anim = 'sit';
      }
    );

    this.onMessage(WS_MESSAGES.STAND_UP, (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.seatedTableNo = -1;
      player.seatIndex = -1;
      player.isSpeaking = false;
      player.anim = 'idle';
    });

    this.onMessage(WS_MESSAGES.CHAT_BUBBLE, (client, msg: { text: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isMuted) return;

      const now = Date.now();
      const prev = this.lastChatTs.get(client.sessionId) ?? 0;
      if (now - prev < 1200) return;

      const clean = sanitizeBubbleText(String(msg?.text ?? ''), 80);
      if (!clean) return;

      this.lastChatTs.set(client.sessionId, now);
      player.bubbleText = clean;
      player.bubbleExpiresAt = now + 5000;
    });

    this.onMessage(WS_MESSAGES.EMOTE, (client, msg: { anim: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !ALLOWED_EMOTES.has(msg?.anim)) return;
      if (player.seatedTableNo < 0) {
        player.anim = msg.anim;
      }
    });

    this.onMessage(WS_MESSAGES.TABLE_CHEERS, (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.seatedTableNo < 0) return;
      const tableNo = player.seatedTableNo;
      this.state.players.forEach((p) => {
        if (p.seatedTableNo === tableNo) {
          p.anim = 'cheers';
          p.bubbleText = '1... 2... 3... DZÔ!! 🥂';
          p.bubbleExpiresAt = Date.now() + 3500;
        }
      });
      this.broadcast(WS_MESSAGES.TABLE_CHEERS_BURST, { tableNo, countdownSec: 3 });
    });

    this.onMessage(WS_MESSAGES.SPEAKING_STATE, (client, msg: { isSpeaking: boolean }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.isSpeaking = !player.isMuted && Boolean(msg?.isSpeaking);
    });

    this.onMessage(
      WS_MESSAGES.NPC_TAKEOVER,
      (client, msg: { targetNpc: 'BRIDE' | 'GROOM' }) => {
        const player = this.state.players.get(client.sessionId);
        if (!player || !HOST_ROLES.has(player.role)) return;
        const npc = this.state.npcs.get(msg.targetNpc);
        if (!npc || npc.isTakenOver) return;

        npc.isTakenOver = true;
        player.takingOverNpc = msg.targetNpc;
        player.outfitId = msg.targetNpc === 'BRIDE' ? 'vay_cuoi_trang' : 'vest_chu_re';
        // The host plays the couple as the person chosen for them in the dashboard
        player.personId = npc.personId;
        player.x = npc.x;
        player.z = npc.z;
      }
    );

    this.onMessage(WS_MESSAGES.NPC_RELEASE, (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.takingOverNpc) return;
      const npc = this.state.npcs.get(player.takingOverNpc);
      if (npc) {
        npc.x = player.x;
        npc.z = player.z;
        npc.isTakenOver = false;
      }
      player.takingOverNpc = '';
      player.outfitId = this.originalOutfits.get(client.sessionId) ?? 'ao_dai_guest';
      player.personId = this.originalPeople.get(client.sessionId) ?? '';
    });

    this.onMessage(
      WS_MESSAGES.TRIGGER_CEREMONY,
      (client, msg: { ritual?: string; stageBroadcast?: boolean }) => {
        const player = this.state.players.get(client.sessionId);
        if (!player || !HOST_ROLES.has(player.role)) return;
        if (msg.ritual) {
          this.state.ceremony.activeRitual = msg.ritual;
          this.state.ceremony.ritualEndsAt = Date.now() + 12000;
        }
        if (typeof msg.stageBroadcast === 'boolean') {
          this.state.ceremony.stageBroadcastActive = msg.stageBroadcast;
          this.state.ceremony.broadcastHostName = msg.stageBroadcast ? player.displayName : '';
        }
      }
    );

    this.onMessage(WS_MESSAGES.TOSS_BOUQUET, (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !HOST_ROLES.has(player.role)) return;
      this.startBouquetToss();
    });

    this.onMessage(WS_MESSAGES.ATTEMPT_CATCH, (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.anim = 'jump_catch';

      const bq = this.state.bouquet;
      if (bq.status !== 'IN_FLIGHT') return;
      const elapsed = Date.now() - bq.tossStartTs;
      if (elapsed < bq.flightDurationMs * 0.7) return;

      const dist = Math.hypot(player.x - bq.targetX, player.z - bq.targetZ);
      if (dist <= 2.4) {
        bq.status = 'CAUGHT';
        bq.winnerSessionId = client.sessionId;
        bq.winnerName = player.displayName;
        player.hasBouquetCrown = true;

        if (this.state.tier !== 'PUBLIC_PLAZA') {
          dbRepo
            .recordBouquetCatch({
              weddingId: this.state.weddingId,
              winnerId: player.userId,
              winnerName: player.displayName,
              shardId: this.roomId,
            })
            .catch(() => {});
        }

        this.broadcast(WS_MESSAGES.BOUQUET_WON, {
          winnerSessionId: client.sessionId,
          winnerName: player.displayName,
        });
      }
    });

    this.onMessage(
      WS_MESSAGES.VIDEO_CONTROL,
      (client, msg: { isPlaying: boolean; playbackOffsetSec?: number; embedUrl?: string }) => {
        const player = this.state.players.get(client.sessionId);
        if (!player || !HOST_ROLES.has(player.role)) return;
        if (msg.embedUrl !== undefined) this.state.videoSync.embedUrl = msg.embedUrl;
        this.state.videoSync.isPlaying = Boolean(msg.isPlaying);
        this.state.videoSync.playbackOffsetSec = Number(msg.playbackOffsetSec) || 0;
        this.state.videoSync.updatedAtServerTs = Date.now();
      }
    );

    this.onMessage(
      WS_MESSAGES.MOD_ACTION,
      async (client, msg: { targetUserId: string; action: 'MUTE' | 'KICK' | 'BAN' }) => {
        const actor = this.state.players.get(client.sessionId);
        if (!actor || !HOST_ROLES.has(actor.role)) return;
        if (!msg?.targetUserId || msg.targetUserId === actor.userId) return;

        // Prevent moderators from kicking/banning the wedding OWNER
        const targetMember = await dbRepo.getMember(this.state.weddingId, msg.targetUserId);
        if (targetMember?.role === 'OWNER') return;

        if (msg.action === 'MUTE' || msg.action === 'BAN') {
          await dbRepo.setMemberModeration({
            weddingId: this.state.weddingId,
            targetUserId: msg.targetUserId,
            status: msg.action === 'MUTE' ? 'MUTED' : 'BANNED',
            moderatedById: actor.userId,
          });
        }

        eventBus.publish({
          type: 'MOD_BAN_USER',
          weddingId: this.state.weddingId,
          userId: msg.targetUserId,
          action: msg.action,
        });
      }
    );
  }

  private startBouquetToss(): void {
    if (this.state.bouquet.status === 'COUNTDOWN' || this.state.bouquet.status === 'IN_FLIGHT') {
      return;
    }
    const stage = this.layout.prefabs.find((p) => p.prefabType === 'STAGE_MAIN');
    const stagePos = stage ? getPrefabCenterWorld(stage) : { x: 0, z: -12 };

    this.state.bouquet.status = 'COUNTDOWN';
    this.state.bouquet.originX = stagePos.x;
    this.state.bouquet.originZ = stagePos.z + 1.5;
    this.state.bouquet.targetX = stagePos.x + (Math.random() - 0.5) * 4.5;
    this.state.bouquet.targetZ = stagePos.z + 5.0 + Math.random() * 3.0;
    this.state.bouquet.winnerSessionId = '';
    this.state.bouquet.winnerName = '';
    this.bouquetCountdownEndsAt = Date.now() + 4000;
  }

  private handleCrossShardEvent(ev: CrossShardEvent): void {
    if (ev.type === 'GIFT_CELEBRATION_EVENT') {
      // STRICT PRIVACY: Only guestName + wishMessage, NEVER monetary amountVnd
      this.broadcast(WS_MESSAGES.GIFT_CELEBRATION_EVENT, {
        guestName: ev.guestName,
        wishMessage: ev.wishMessage,
      });
      return;
    }

    if (ev.type === 'PLAN_ACTIVATED') {
      this.state.tier = ev.tier;
      this.maxClients = 60;
      this.broadcast(WS_MESSAGES.ROOM_SYSTEM_NOTICE, {
        message: 'Phòng cưới đã được nâng cấp thành công!',
      });
      return;
    }

    if (ev.type === 'FORCE_ARCHIVE_ROOM' || ev.type === 'ROOM_EXPIRED') {
      this.broadcast(WS_MESSAGES.ROOM_SYSTEM_NOTICE, {
        message:
          ev.type === 'FORCE_ARCHIVE_ROOM'
            ? 'Sảnh 3D đã chuyển sang Trang Kỷ Niệm 2D Vĩnh Viễn.'
            : 'Phòng dùng thử 24h đã kết thúc.',
      });
      setTimeout(() => {
        this.disconnect().catch(() => {});
      }, 2000);
      return;
    }

    if (ev.type === 'ACCOUNT_LOCKED') {
      this.state.players.forEach((p, sid) => {
        if (p.userId !== ev.userId) return;
        this.clients.find((c) => c.sessionId === sid)?.leave(4003, 'ACCOUNT_LOCKED');
      });
      return;
    }

    if (ev.type === 'MOD_BAN_USER') {
      this.state.players.forEach((p, sid) => {
        if (p.userId !== ev.userId) return;
        if (ev.action === 'MUTE') {
          p.isMuted = true;
          p.isSpeaking = false;
        } else if (ev.action === 'UNMUTE') {
          p.isMuted = false;
        } else {
          const targetClient = this.clients.find((c) => c.sessionId === sid);
          if (targetClient) targetClient.leave(4003, ev.action);
        }
      });
    }
  }

  private tick10Hz(): void {
    const now = Date.now();

    // Expire overhead bubbles
    this.state.players.forEach((p) => {
      if (p.bubbleText && p.bubbleExpiresAt > 0 && now > p.bubbleExpiresAt) {
        p.bubbleText = '';
        p.bubbleExpiresAt = 0;
      }
    });

    // End active ritual particles
    if (this.state.ceremony.activeRitual !== 'NONE' && now > this.state.ceremony.ritualEndsAt) {
      this.state.ceremony.activeRitual = 'NONE';
      this.state.ceremony.ritualEndsAt = 0;
    }

    // Bouquet state machine
    if (this.state.bouquet.status === 'COUNTDOWN' && now >= this.bouquetCountdownEndsAt) {
      this.state.bouquet.status = 'IN_FLIGHT';
      this.state.bouquet.tossStartTs = now;
    } else if (
      this.state.bouquet.status === 'IN_FLIGHT' &&
      now > this.state.bouquet.tossStartTs + this.state.bouquet.flightDurationMs + 3000
    ) {
      this.state.bouquet.status = 'IDLE';
    } else if (
      this.state.bouquet.status === 'CAUGHT' &&
      now > this.state.bouquet.tossStartTs + 10000
    ) {
      this.state.bouquet.status = 'IDLE';
    }

    // 25-minute Auto-NPC ceremony loop in 24/7 Public Plaza
    if (this.state.tier === 'PUBLIC_PLAZA' && now >= this.plazaNextAutoCeremonyAt) {
      this.plazaNextAutoCeremonyAt = now + 25 * 60 * 1000;
      this.state.ceremony.activeRitual = 'SPARKLERS';
      this.state.ceremony.ritualEndsAt = now + 12000;
      this.startBouquetToss();
    }

    // Real wedding Auto-NPC scheduled ceremony trigger (ceremonyTimeIso)
    if (this.state.tier !== 'PUBLIC_PLAZA') {
      if (this.ceremonyConfig.greetingMessage && now >= this.nextGreetingToggleAt) {
        this.nextGreetingToggleAt = now + 22000;
        const bride = this.state.npcs.get('BRIDE');
        if (bride && !bride.isTakenOver && bride.mode === 'GREETING') {
          bride.bubbleText = bride.bubbleText ? '' : this.ceremonyConfig.greetingMessage.slice(0, 80);
        }
      }

      if (!this.autoCeremonyTriggered && this.ceremonyConfig.ceremonyTimeIso) {
        const ceremonyMs = Date.parse(this.ceremonyConfig.ceremonyTimeIso);
        if (!Number.isNaN(ceremonyMs) && now >= ceremonyMs && now <= ceremonyMs + 2 * 60 * 60 * 1000) {
          this.autoCeremonyTriggered = true;
          const stage = this.layout.prefabs.find((p) => p.prefabType === 'STAGE_MAIN');
          const stagePos = stage ? getPrefabCenterWorld(stage) : { x: 0, z: -12 };

          const bride = this.state.npcs.get('BRIDE');
          const groom = this.state.npcs.get('GROOM');
          if (bride && !bride.isTakenOver) {
            bride.mode = 'STAGE_CEREMONY';
            bride.x = stagePos.x - 0.9;
            bride.z = stagePos.z + 0.5;
            bride.rotY = 0;
            bride.anim = 'clap';
            bride.bubbleText = 'Cảm ơn cả nhà đã đến chung vui! ❤️';
          }
          if (groom && !groom.isTakenOver) {
            groom.mode = 'STAGE_CEREMONY';
            groom.x = stagePos.x + 0.9;
            groom.z = stagePos.z + 0.5;
            groom.rotY = 0;
            groom.anim = 'clap';
          }

          this.state.ceremony.activeRitual = 'SPARKLERS';
          this.state.ceremony.ritualEndsAt = now + 15000;
          this.broadcast(WS_MESSAGES.ROOM_SYSTEM_NOTICE, {
            message: '🎊 Đã đến giờ lành! Lễ thành hôn chính thức bắt đầu trên sân khấu!',
          });

          if (this.ceremonyConfig.autoBouquetToss !== false) {
            this.scheduledBouquetAt = now + 10000;
          }
        }
      }

      if (this.scheduledBouquetAt > 0 && now >= this.scheduledBouquetAt) {
        this.scheduledBouquetAt = 0;
        this.startBouquetToss();
      }
    }
  }
}
