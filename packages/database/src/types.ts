import type {
  AuthProvider,
  AvatarConfig,
  CeremonyConfig,
  GuestSide,
  MemberRole,
  ModerationStatus,
  SceneLayoutDocument,
  TemplateId,
  WeddingStatus,
  WeddingTier,
} from '@dco/shared';

export interface UserRecord {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  /** Optional: local JSON snapshots written before account locking have no lock fields */
  isLocked?: boolean;
  lockedAt?: string | null;
  lockedReason?: string | null;
  lockedById?: string | null;
}

export interface AccountRecord {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerAccountId: string;
  createdAt: string;
}

export interface WeddingRecord {
  id: string;
  slug: string;
  title: string;
  brideName: string;
  groomName: string;
  ownerId: string;
  tier: WeddingTier;
  status: WeddingStatus;
  weddingDate: string;
  trialExpiresAt: string | null;
  archiveAt: string | null;
  archivedAt: string | null;
  pinHash: string | null;
  maxConcurrentUsers: number;
  videoEmbedUrl: string | null;
  videoIsLive: boolean;
  bankBin: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  webhookProvider: string | null;
  webhookSecretHash: string | null;
  ceremonyConfig: CeremonyConfig | null;
  /** Raw stored invitation JSON; read it through resolveInvitationConfig() from @dco/shared */
  invitationConfig?: unknown;
  /** Online invitation for an offline wedding: no 3D hall, no trial expiry */
  invitationOnly?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeddingMemberRecord {
  id: string;
  weddingId: string;
  userId: string;
  role: MemberRole;
  side: GuestSide;
  nicknameOverride: string | null;
  avatarConfig: AvatarConfig | null;
  moderationStatus: ModerationStatus;
  moderatedById: string | null;
  moderationReason: string | null;
  joinedAt: string;
  updatedAt: string;
}

export interface WeddingSceneRecord {
  id: string;
  weddingId: string;
  templateId: TemplateId;
  layoutData: SceneLayoutDocument;
  version: number;
  updatedAt: string;
}

export type PhotoType = 'PRE_WEDDING_GALLERY' | 'PHOTOBOOTH_SNAPSHOT';

export interface PhotoAssetRecord {
  id: string;
  weddingId: string;
  uploaderId: string;
  type: PhotoType;
  r2ObjectKey: string;
  publicUrl: string;
  caption: string | null;
  hasWatermark: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface GuestbookEntryRecord {
  id: string;
  weddingId: string;
  /** Null for a wish left on the invitation page without signing in */
  authorId: string | null;
  authorName: string;
  side: GuestSide;
  message: string;
  isHidden: boolean;
  createdAt: string;
}

export interface BouquetCatchRecord {
  id: string;
  weddingId: string;
  winnerId: string;
  winnerName: string;
  shardId: string;
  caughtAt: string;
}

export interface GiftIntentRecord {
  id: string;
  weddingId: string;
  /** Null for a guest gifting from the invitation page without signing in */
  guestUserId: string | null;
  guestName: string;
  wishMessage: string;
  transferCode: string;
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export interface GiftLedgerRecord {
  id: string;
  weddingId: string;
  giftIntentId: string;
  guestUserId: string | null;
  guestName: string;
  wishMessage: string;
  amountVnd: number;
  provider: string;
  providerTxId: string;
  bankTxDate: string;
  verifiedAt: string;
}

export interface InvitationRsvpRecord {
  id: string;
  weddingId: string;
  guestName: string;
  phone: string | null;
  attending: boolean;
  headcount: number;
  side: GuestSide;
  note: string | null;
  createdAt: string;
}

export interface SaasOrderRecord {
  id: string;
  weddingId: string;
  buyerId: string;
  targetTier: WeddingTier;
  amountVnd: number;
  orderCode: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentWebhookLogRecord {
  id: string;
  provider: string;
  providerTxId: string;
  saasOrderId: string | null;
  rawPayload: unknown;
  processedAt: string;
}

export interface PartnerVoucherRecord {
  id: string;
  code: string;
  studioName: string;
  discountPercent: number;
  targetTier: WeddingTier | null;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

/** Customer account as the platform admin sees it */
export interface AdminUserRecord extends UserRecord {
  providers: AuthProvider[];
  ownedWeddingCount: number;
  membershipCount: number;
}

export interface PlatformSettingRecord {
  key: string;
  /** Plain text, or an encrypted blob when isSecret is true */
  value: string;
  isSecret: boolean;
  updatedById: string | null;
  updatedAt: string;
}

export interface PublicWeddingDTO {
  id: string;
  slug: string;
  title: string;
  brideName: string;
  groomName: string;
  tier: WeddingTier;
  status: WeddingStatus;
  weddingDate: string;
  trialExpiresAt: string | null;
  archiveAt: string | null;
  archivedAt: string | null;
  hasPin: boolean;
  maxConcurrentUsers: number;
  videoEmbedUrl: string | null;
  videoIsLive: boolean;
  hasBankConfig: boolean;
  bankAccountName: string | null;
  ceremonyConfig: CeremonyConfig | null;
  invitationOnly: boolean;
}

export function toPublicWedding(w: WeddingRecord): PublicWeddingDTO {
  return {
    id: w.id,
    slug: w.slug,
    title: w.title,
    brideName: w.brideName,
    groomName: w.groomName,
    tier: w.tier,
    status: w.status,
    weddingDate: w.weddingDate,
    trialExpiresAt: w.trialExpiresAt,
    archiveAt: w.archiveAt,
    archivedAt: w.archivedAt,
    hasPin: Boolean(w.pinHash),
    maxConcurrentUsers: w.maxConcurrentUsers,
    videoEmbedUrl: w.videoEmbedUrl,
    videoIsLive: w.videoIsLive,
    invitationOnly: Boolean(w.invitationOnly),
    hasBankConfig: Boolean(w.bankBin && w.bankAccountNo),
    bankAccountName: w.bankAccountName,
    ceremonyConfig: w.ceremonyConfig,
  };
}
