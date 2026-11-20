import { MapSchema, Schema, type } from '@colyseus/schema';

export const WS_MESSAGES = {
  MOVE_INPUT: 'MOVE_INPUT',
  SIT_TABLE: 'SIT_TABLE',
  STAND_UP: 'STAND_UP',
  CHAT_BUBBLE: 'CHAT_BUBBLE',
  EMOTE: 'EMOTE',
  TABLE_CHEERS: 'TABLE_CHEERS',
  TABLE_CHEERS_BURST: 'TABLE_CHEERS_BURST',
  NPC_TAKEOVER: 'NPC_TAKEOVER',
  NPC_RELEASE: 'NPC_RELEASE',
  TRIGGER_CEREMONY: 'TRIGGER_CEREMONY',
  TOSS_BOUQUET: 'TOSS_BOUQUET',
  ATTEMPT_CATCH: 'ATTEMPT_CATCH',
  BOUQUET_WON: 'BOUQUET_WON',
  VIDEO_CONTROL: 'VIDEO_CONTROL',
  MOD_ACTION: 'MOD_ACTION',
  GIFT_CELEBRATION_EVENT: 'GIFT_CELEBRATION_EVENT',
  SPEAKING_STATE: 'SPEAKING_STATE',
  ROOM_SYSTEM_NOTICE: 'ROOM_SYSTEM_NOTICE',
} as const;

export class PlayerSchema extends Schema {
  @type('string') sessionId: string = '';
  @type('string') userId: string = '';
  @type('string') displayName: string = '';
  @type('string') role: string = 'GUEST';
  @type('string') side: string = 'FRIEND';
  @type('string') outfitId: string = 'ao_dai_guest';
  @type('string') hairId: string = 'hair_1';
  @type('string') hairColor: string = '#222222';

  @type('number') x: number = 0;
  @type('number') z: number = 10;
  @type('number') rotY: number = 0;
  @type('string') anim: string = 'idle';
  /** The mover's own clock (ms) when it sent this position; lets viewers replay movement evenly */
  @type('number') mt: number = 0;

  @type('number') seatedTableNo: number = -1;
  @type('number') seatIndex: number = -1;
  @type('boolean') hasBouquetCrown: boolean = false;
  @type('boolean') isSpeaking: boolean = false;
  @type('boolean') isMuted: boolean = false;
  @type('string') takingOverNpc: string = '';

  @type('string') bubbleText: string = '';
  @type('number') bubbleExpiresAt: number = 0;
  /** Realistic person (PEOPLE id) the guest attends as; '' = stylised figure */
  @type('string') personId: string = '';
}

export class NpcSchema extends Schema {
  @type('string') npcId: string = 'BRIDE';
  @type('string') displayName: string = 'Cô Dâu';
  @type('string') outfitId: string = 'vay_cuoi_trang';
  @type('boolean') isTakenOver: boolean = false;
  @type('string') mode: string = 'GREETING';
  @type('number') x: number = 0;
  @type('number') z: number = 0;
  @type('number') rotY: number = 0;
  @type('string') anim: string = 'wave';
  @type('string') bubbleText: string = '';
  /** Real person the bride/groom appears as (people.ts); '' = drawn figure */
  @type('string') personId: string = '';
}

export class CeremonySchema extends Schema {
  @type('string') activeRitual: string = 'NONE';
  @type('number') ritualEndsAt: number = 0;
  @type('boolean') stageBroadcastActive: boolean = false;
  @type('string') broadcastHostName: string = '';
}

export class BouquetSchema extends Schema {
  @type('string') status: string = 'IDLE';
  @type('number') originX: number = 0;
  @type('number') originZ: number = -12;
  @type('number') targetX: number = 0;
  @type('number') targetZ: number = -6;
  @type('number') tossStartTs: number = 0;
  @type('number') flightDurationMs: number = 2400;
  @type('string') winnerSessionId: string = '';
  @type('string') winnerName: string = '';
}

export class VideoSyncSchema extends Schema {
  @type('string') embedUrl: string = '';
  @type('boolean') isLive: boolean = false;
  @type('boolean') isPlaying: boolean = false;
  @type('number') playbackOffsetSec: number = 0;
  @type('number') updatedAtServerTs: number = 0;
}

export class WeddingRoomState extends Schema {
  @type('string') weddingId: string = '';
  @type('string') slug: string = '';
  @type('string') tier: string = 'PUBLIC_PLAZA';
  @type('number') shardIndex: number = 1;
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type({ map: NpcSchema }) npcs = new MapSchema<NpcSchema>();
  @type(CeremonySchema) ceremony = new CeremonySchema();
  @type(BouquetSchema) bouquet = new BouquetSchema();
  @type(VideoSyncSchema) videoSync = new VideoSyncSchema();
}
