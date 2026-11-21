/**
 * Social layer of the 3D hall: the shared congratulations chat, private messages between
 * guests, and the fireworks guests buy to celebrate the couple.
 */

/* ───────────────────────── Fireworks ───────────────────────── */

export type FireworkPackId = 'NHO' | 'LON' | 'DAI_TIEC';

export interface FireworkPack {
  id: FireworkPackId;
  label: string;
  /** One line under the name in the shop */
  tagline: string;
  /** Price when the admin has not set one (VND) */
  defaultPriceVnd: number;
  /** Aerial shells in the show */
  shells: number;
  /** Length of the show */
  durationMs: number;
  /** Cold-spark fountains in front of the stage */
  fountains: boolean;
  /** Ends with a heart-shaped shell */
  heartFinale: boolean;
}

export const FIREWORK_PACKS: FireworkPack[] = [
  {
    id: 'NHO',
    label: 'Pháo hoa nhỏ',
    tagline: '8 quả pháo trong 7 giây',
    defaultPriceVnd: 20_000,
    shells: 8,
    durationMs: 7_000,
    fountains: false,
    heartFinale: false,
  },
  {
    id: 'LON',
    label: 'Pháo hoa lớn',
    tagline: '18 quả pháo và pháo hoa lạnh trước sân khấu, 11 giây',
    defaultPriceVnd: 50_000,
    shells: 18,
    durationMs: 11_000,
    fountains: true,
    heartFinale: false,
  },
  {
    id: 'DAI_TIEC',
    label: 'Đại tiệc pháo hoa',
    tagline: '36 quả pháo, pháo hoa lạnh và quả trái tim kết màn, 17 giây',
    defaultPriceVnd: 100_000,
    shells: 36,
    durationMs: 17_000,
    fountains: true,
    heartFinale: true,
  },
];

export function getFireworkPack(id: string): FireworkPack | undefined {
  return FIREWORK_PACKS.find((p) => p.id === id);
}

export function isFireworkPackId(id: unknown): id is FireworkPackId {
  return typeof id === 'string' && FIREWORK_PACKS.some((p) => p.id === id);
}

/** A show as the hall plays it: the seed makes every guest see the same pattern of shells */
export interface FireworksShow {
  id: string;
  packId: FireworkPackId;
  buyerName: string;
  message: string;
  seed: number;
}

/** Longest wish a buyer can attach to fireworks */
export const FIREWORK_MESSAGE_MAX = 100;

/* ───────────────────────── Chat ───────────────────────── */

export type HallChatKind = 'chat' | 'gift' | 'fireworks' | 'system';

/** One line of the shared congratulations chat, seen by everyone in the wedding (all shards) */
export interface HallChatMessage {
  id: string;
  kind: HallChatKind;
  /** Sender, or the guest a gift/fireworks line is about; '' for system lines */
  name: string;
  userId?: string;
  side?: string;
  role?: string;
  text: string;
  /** Server time (ms) */
  ts: number;
  packId?: FireworkPackId;
}

/**
 * A private message. It goes to the two people in it and nobody else: it is not kept on the
 * server, not shown to the hosts, and not part of the shared room state.
 */
export interface PrivateMessage {
  id: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  text: string;
  ts: number;
}

export const HALL_CHAT_MAX_LENGTH = 200;
export const PRIVATE_MESSAGE_MAX_LENGTH = 300;
/** Lines a guest sees from before they came in */
export const HALL_CHAT_HISTORY_SIZE = 80;
