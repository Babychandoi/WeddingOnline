import { STARTER_TEMPLATES } from '@dco/shared';
import type {
  FireworkOrderRecord,
  AccountRecord,
  BouquetCatchRecord,
  GiftIntentRecord,
  GiftLedgerRecord,
  GuestbookEntryRecord,
  PartnerVoucherRecord,
  PaymentWebhookLogRecord,
  PhotoAssetRecord,
  PlatformSettingRecord,
  SaasOrderRecord,
  UserRecord,
  WeddingMemberRecord,
  WeddingRecord,
  WeddingSceneRecord,
  InvitationRsvpRecord,
} from './types';

export interface LocalDatabaseSnapshot {
  users: UserRecord[];
  accounts: AccountRecord[];
  weddings: WeddingRecord[];
  scenes: WeddingSceneRecord[];
  members: WeddingMemberRecord[];
  photos: PhotoAssetRecord[];
  guestbook: GuestbookEntryRecord[];
  bouquetCatches: BouquetCatchRecord[];
  giftIntents: GiftIntentRecord[];
  giftLedgers: GiftLedgerRecord[];
  saasOrders: SaasOrderRecord[];
  webhookLogs: PaymentWebhookLogRecord[];
  partnerVouchers: PartnerVoucherRecord[];
  /** Optional: snapshots written before admin settings existed don't have it */
  platformSettings?: PlatformSettingRecord[];
  /** Optional: snapshots written before online invitations existed don't have it */
  invitationRsvps?: InvitationRsvpRecord[];
  /** Optional: snapshots written before hall fireworks existed don't have it */
  fireworkOrders?: FireworkOrderRecord[];
}

export function createSampleSvgPhoto(title: string, subtitle: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#1e1b4b"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#g)"/>
    <circle cx="400" cy="240" r="110" fill="rgba(255,255,255,0.14)"/>
    <text x="400" y="250" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="#fff">${title}</text>
    <text x="400" y="310" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#fde68a">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createSeedSnapshot(): LocalDatabaseSnapshot {
  const now = new Date();
  const futureWeddingDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const futureArchiveAt = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString();
  const pastArchiveDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString();
  const pastArchivedAt = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = now.toISOString();

  const ownerId = 'user_owner_minh';
  const brideId = 'user_bride_linh';
  const memorialOwnerId = 'user_owner_duy';

  return {
    users: [
      {
        id: ownerId,
        displayName: 'Chú Rể Minh Nguyễn',
        avatarUrl: null,
        email: 'minh@damcuoionline.vn',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: brideId,
        displayName: 'Cô Dâu Linh Trần',
        avatarUrl: null,
        email: 'linh@damcuoionline.vn',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: memorialOwnerId,
        displayName: 'Duy & Thảo',
        avatarUrl: null,
        email: 'duythao@damcuoionline.vn',
        createdAt: pastArchiveDate,
        updatedAt: pastArchivedAt,
      },
    ],
    accounts: [
      {
        id: 'acc_zalo_minh',
        userId: ownerId,
        provider: 'ZALO',
        providerAccountId: 'zalo_demo_minh',
        createdAt: nowIso,
      },
      {
        id: 'acc_google_linh',
        userId: brideId,
        provider: 'GOOGLE',
        providerAccountId: 'google_demo_linh',
        createdAt: nowIso,
      },
    ],
    weddings: [
      {
        id: 'wed_public_plaza',
        slug: 'plaza',
        title: 'Sảnh Quảng Trường Cưới 24/7',
        brideName: 'Tiểu Vy',
        groomName: 'Hoàng Nam',
        ownerId,
        tier: 'PUBLIC_PLAZA',
        status: 'PUBLISHED_3D',
        weddingDate: futureWeddingDate,
        trialExpiresAt: null,
        archiveAt: null,
        archivedAt: null,
        pinHash: null,
        maxConcurrentUsers: 60,
        videoEmbedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&enablejsapi=1',
        videoIsLive: true,
        bankBin: null,
        bankAccountNo: null,
        bankAccountName: null,
        webhookProvider: null,
        webhookSecretHash: null,
        ceremonyConfig: {
          autoBouquetToss: true,
          greetingMessage: 'Chào mừng bạn đến Sảnh Quảng Trường Cưới 24/7!',
        },
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'wed_minh_linh',
        slug: 'minh-va-linh',
        title: 'Lễ Thành Hôn Minh & Linh',
        brideName: 'Thùy Linh',
        groomName: 'Nhật Minh',
        ownerId,
        tier: 'VIP_FULFILLMENT',
        status: 'PUBLISHED_3D',
        weddingDate: futureWeddingDate,
        trialExpiresAt: null,
        archiveAt: futureArchiveAt,
        archivedAt: null,
        pinHash: null,
        maxConcurrentUsers: 200,
        videoEmbedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&enablejsapi=1',
        videoIsLive: false,
        bankBin: '970422',
        bankAccountNo: '0987654321',
        bankAccountName: 'NGUYEN NHAT MINH',
        webhookProvider: 'SEPAY',
        webhookSecretHash: 'dev_sepay_key',
        ceremonyConfig: {
          ceremonyTimeIso: futureWeddingDate,
          autoBouquetToss: true,
          greetingMessage: 'Cảm ơn anh chị em ở xa đã ghé chung vui cùng Minh & Linh!',
        },
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'wed_duy_thao_memorial',
        slug: 'duy-va-thao-kyniem',
        title: 'Kỷ Niệm Ngày Cưới Duy & Thảo',
        brideName: 'Phương Thảo',
        groomName: 'Quốc Duy',
        ownerId: memorialOwnerId,
        tier: 'VIP_FULFILLMENT',
        status: 'ARCHIVED_2D_FOREVER',
        weddingDate: pastArchiveDate,
        trialExpiresAt: null,
        archiveAt: pastArchivedAt,
        archivedAt: pastArchivedAt,
        pinHash: null,
        maxConcurrentUsers: 200,
        videoEmbedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?enablejsapi=1',
        videoIsLive: false,
        bankBin: null,
        bankAccountNo: null,
        bankAccountName: null,
        webhookProvider: null,
        webhookSecretHash: null,
        ceremonyConfig: null,
        createdAt: pastArchiveDate,
        updatedAt: pastArchivedAt,
      },
    ],
    scenes: [
      {
        id: 'scene_plaza',
        weddingId: 'wed_public_plaza',
        templateId: 'sunset_garden',
        layoutData: STARTER_TEMPLATES.sunset_garden.layout,
        version: 1,
        updatedAt: nowIso,
      },
      {
        id: 'scene_minh_linh',
        weddingId: 'wed_minh_linh',
        templateId: 'mekong_coconut_tent',
        layoutData: STARTER_TEMPLATES.mekong_coconut_tent.layout,
        version: 1,
        updatedAt: nowIso,
      },
      {
        id: 'scene_duy_thao',
        weddingId: 'wed_duy_thao_memorial',
        templateId: 'luxury_ballroom',
        layoutData: STARTER_TEMPLATES.luxury_ballroom.layout,
        version: 1,
        updatedAt: pastArchivedAt,
      },
    ],
    members: [
      {
        id: 'mem_minh_owner',
        weddingId: 'wed_minh_linh',
        userId: ownerId,
        role: 'OWNER',
        side: 'GROOM_SIDE',
        nicknameOverride: 'Chú Rể Minh',
        avatarConfig: { outfitId: 'vest_chu_re', hairId: 'hair_2', hairColor: '#1f2937' },
        moderationStatus: 'ACTIVE',
        moderatedById: null,
        moderationReason: null,
        joinedAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'mem_linh_bride',
        weddingId: 'wed_minh_linh',
        userId: brideId,
        role: 'BRIDE',
        side: 'BRIDE_SIDE',
        nicknameOverride: 'Cô Dâu Linh',
        avatarConfig: { outfitId: 'vay_cuoi_trang', hairId: 'hair_4', hairColor: '#3f2e21' },
        moderationStatus: 'ACTIVE',
        moderatedById: null,
        moderationReason: null,
        joinedAt: nowIso,
        updatedAt: nowIso,
      },
    ],
    photos: [
      {
        id: 'photo_ml_1',
        weddingId: 'wed_minh_linh',
        uploaderId: ownerId,
        type: 'PRE_WEDDING_GALLERY',
        r2ObjectKey: 'invitation-samples/ao-dai-gate.webp',
        publicUrl: '/invitation-samples/ao-dai-gate.webp',
        caption: 'Chuyến đi Đà Lạt đầu tiên của hai đứa',
        hasWatermark: false,
        displayOrder: 1,
        createdAt: nowIso,
      },
      {
        id: 'photo_ml_2',
        weddingId: 'wed_minh_linh',
        uploaderId: ownerId,
        type: 'PRE_WEDDING_GALLERY',
        r2ObjectKey: 'invitation-samples/ao-dai-arch.webp',
        publicUrl: '/invitation-samples/ao-dai-arch.webp',
        caption: 'Bộ ảnh cưới áo dài tại quê nhà',
        hasWatermark: false,
        displayOrder: 2,
        createdAt: nowIso,
      },
      {
        id: 'photo_ml_3',
        weddingId: 'wed_minh_linh',
        uploaderId: ownerId,
        type: 'PRE_WEDDING_GALLERY',
        r2ObjectKey: 'invitation-samples/aodai-arch-pastel.webp',
        publicUrl: '/invitation-samples/aodai-arch-pastel.webp',
        caption: 'Khoảnh khắc trao lời hẹn ước trăm năm',
        hasWatermark: false,
        displayOrder: 3,
        createdAt: nowIso,
      },
      {
        id: 'photo_ml_4',
        weddingId: 'wed_minh_linh',
        uploaderId: ownerId,
        type: 'PRE_WEDDING_GALLERY',
        r2ObjectKey: 'invitation-samples/ao-dai-red.webp',
        publicUrl: '/invitation-samples/ao-dai-red.webp',
        caption: 'Nụ cười ngày chung đôi',
        hasWatermark: false,
        displayOrder: 4,
        createdAt: nowIso,
      },
      {
        id: 'photo_dt_1',
        weddingId: 'wed_duy_thao_memorial',
        uploaderId: memorialOwnerId,
        type: 'PRE_WEDDING_GALLERY',
        r2ObjectKey: 'invitation-samples/bouquet-veil.webp',
        publicUrl: '/invitation-samples/bouquet-veil.webp',
        caption: 'Khoảnh khắc trao nhẫn đáng nhớ',
        hasWatermark: false,
        displayOrder: 1,
        createdAt: pastArchiveDate,
      },
      {
        id: 'photo_dt_2',
        weddingId: 'wed_duy_thao_memorial',
        uploaderId: memorialOwnerId,
        type: 'PHOTOBOOTH_SNAPSHOT',
        r2ObjectKey: 'invitation-samples/beach-vows.webp',
        publicUrl: '/invitation-samples/beach-vows.webp',
        caption: 'Hội bạn thân ở Tokyo chụp tại sảnh 3D',
        hasWatermark: false,
        displayOrder: 2,
        createdAt: pastArchiveDate,
      },
    ],
    guestbook: [
      {
        id: 'gb_ml_1',
        weddingId: 'wed_minh_linh',
        authorId: brideId,
        authorName: 'Anh Tuấn (Tokyo)',
        side: 'GROOM_SIDE',
        message: 'Không bay về kịp nhưng ngồi bàn 1-2-3 Dzô online với anh em vui quá! Chúc Minh Linh trăm năm hạnh phúc!',
        isHidden: false,
        createdAt: nowIso,
      },
      {
        id: 'gb_dt_1',
        weddingId: 'wed_duy_thao_memorial',
        authorId: memorialOwnerId,
        authorName: 'Chị Lan (California)',
        side: 'BRIDE_SIDE',
        message: 'Mỗi năm vào lại trang kỷ niệm vẫn thấy ấm lòng. Chúc hai em mãi hạnh phúc!',
        isHidden: false,
        createdAt: pastArchiveDate,
      },
    ],
    bouquetCatches: [
      {
        id: 'bq_dt_1',
        weddingId: 'wed_duy_thao_memorial',
        winnerId: memorialOwnerId,
        winnerName: 'Bé Vy (Hội Bạn Thân)',
        shardId: 'shard-1',
        caughtAt: pastArchiveDate,
      },
    ],
    giftIntents: [],
    giftLedgers: [],
    saasOrders: [],
    webhookLogs: [],
    partnerVouchers: [
      {
        id: 'vch_studio35',
        code: 'STUDIO35',
        studioName: 'Áo Cưới Ánh Dương (Đối tác B2B2C)',
        discountPercent: 35,
        targetTier: null,
        maxUses: 100,
        usedCount: 0,
        isActive: true,
        createdAt: nowIso,
      },
      {
        id: 'vch_studiovip100',
        code: 'STUDIOVIP100',
        studioName: 'Combo Chụp Ảnh VIP Studio Sài Gòn',
        discountPercent: 100,
        targetTier: 'VIP_FULFILLMENT',
        maxUses: 50,
        usedCount: 0,
        isActive: true,
        createdAt: nowIso,
      },
    ],
    platformSettings: [],
  };
}
