/**
 * Pseudo wedding id for realtime events that concern every room (e.g. a locked
 * account must leave whichever hall it is in). Every room subscribes to it.
 */
export const PLATFORM_EVENT_SCOPE = '__platform__';

export type WeddingTier =
  | 'PUBLIC_PLAZA'
  | 'TRIAL_24H'
  | 'HAPPINESS'
  | 'VIP_FULFILLMENT';

export type WeddingStatus =
  | 'DRAFT'
  | 'TRIAL_ACTIVE'
  | 'EXPIRED_TRIAL'
  | 'PUBLISHED_3D'
  | 'GRACE_PERIOD_7D'
  | 'ARCHIVED_2D_FOREVER';

export type MemberRole = 'OWNER' | 'BRIDE' | 'GROOM' | 'MC' | 'GUEST';

export type ModerationStatus = 'ACTIVE' | 'MUTED' | 'BANNED';

export type GuestSide = 'GROOM_SIDE' | 'BRIDE_SIDE' | 'FRIEND' | 'COLLEAGUE';

export type AuthProvider = 'ZALO' | 'GOOGLE' | 'FACEBOOK';

/** A venue theme id from VENUE_THEMES (venues.ts); validate input with isVenueId() */
export type TemplateId = string;

export type PrefabType =
  | 'STAGE_MAIN'
  | 'GATE_RECEPTION'
  | 'GIFT_BOX_STAND'
  | 'BANQUET_TABLE_10'
  | 'BANQUET_TABLE_8'
  | 'PHOTO_FRAME_STAND'
  | 'AISLE_CARPET_4X4'
  | 'DECOR_FLOWER_PILLAR';

export interface PlacedPrefab {
  instanceId: string;
  prefabType: PrefabType;
  gridX: number;
  gridZ: number;
  rotationDeg: 0 | 90 | 180 | 270;
  meta?: {
    tableNumber?: number;
    tableLabel?: string;
    mediaSlotId?: string;
    customLabel?: string;
  };
}

export interface SceneLayoutDocument {
  schemaVersion: 1;
  templateId: TemplateId;
  gridSize: {
    cols: 60;
    rows: 60;
    cellSizeMeters: 0.5;
  };
  themeAccentColor: string;
  prefabs: PlacedPrefab[];
}

export interface AvatarConfig {
  outfitId: string;
  hairId: string;
  hairColor: string;
  /** A realistic person from PEOPLE; '' or absent = the stylised figure */
  personId?: string;
}

export interface CeremonyConfig {
  ceremonyTimeIso?: string;
  autoBouquetToss?: boolean;
  greetingMessage?: string;
  /** Real person the bride appears as (BRIDE_PEOPLE id); '' = drawn figure; absent = default */
  bridePersonId?: string;
  /** Real person the groom appears as (GROOM_PEOPLE id); '' = drawn figure; absent = default */
  groomPersonId?: string;
}

export interface JoinTokenPayload {
  userId: string;
  displayName: string;
  weddingId: string;
  slug: string;
  tier: WeddingTier;
  role: MemberRole;
  side: GuestSide;
  shardIndex: number;
  avatarConfig: AvatarConfig;
  isAnonymousPlaza: boolean;
  isMuted: boolean;
  exp: number;
}

export interface HandoffTokenPayload {
  userId: string;
  slug: string;
  tableNo: number;
  exp: number;
}

export interface RoleInviteTokenPayload {
  weddingId: string;
  slug: string;
  role: 'BRIDE' | 'GROOM' | 'MC';
  exp: number;
}

export interface PublicGiftToast {
  guestName: string;
  wishMessage: string;
  verifiedAt: string;
}

export interface TierMetadata {
  tier: WeddingTier;
  nameVi: string;
  priceVnd: number;
  maxCcu: number;
  maxPhotos: number;
  allowVoiceChat: boolean;
  allowVietQr: boolean;
  photoboothWatermark: boolean;
}

export const TIER_CATALOG: Record<WeddingTier, TierMetadata> = {
  PUBLIC_PLAZA: {
    tier: 'PUBLIC_PLAZA',
    nameVi: 'Quảng Trường Cộng Đồng 24/7',
    priceVnd: 0,
    maxCcu: 60,
    maxPhotos: 6,
    allowVoiceChat: false,
    allowVietQr: false,
    photoboothWatermark: false,
  },
  TRIAL_24H: {
    tier: 'TRIAL_24H',
    nameVi: 'Phòng Cưới Thử 24h',
    priceVnd: 0,
    maxCcu: 15,
    maxPhotos: 6,
    allowVoiceChat: false,
    allowVietQr: false,
    photoboothWatermark: true,
  },
  HAPPINESS: {
    tier: 'HAPPINESS',
    nameVi: 'Gói Hạnh Phúc',
    priceVnd: 399000,
    maxCcu: 100,
    maxPhotos: 20,
    allowVoiceChat: false,
    allowVietQr: true,
    photoboothWatermark: false,
  },
  VIP_FULFILLMENT: {
    tier: 'VIP_FULFILLMENT',
    nameVi: 'Gói Viên Mãn VIP',
    priceVnd: 1199000,
    maxCcu: 1000,
    maxPhotos: 50,
    allowVoiceChat: true,
    allowVietQr: true,
    photoboothWatermark: false,
  },
};
