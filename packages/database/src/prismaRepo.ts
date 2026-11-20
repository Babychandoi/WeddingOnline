import {
  Prisma,
  PrismaClient,
  type BouquetCatch as PrismaBouquetCatch,
  type GiftIntent as PrismaGiftIntent,
  type GiftLedger as PrismaGiftLedger,
  type GuestbookEntry as PrismaGuestbookEntry,
  type PartnerVoucher as PrismaPartnerVoucher,
  type PhotoAsset as PrismaPhotoAsset,
  type SaasOrder as PrismaSaasOrder,
  type User as PrismaUser,
  type Wedding as PrismaWedding,
  type WeddingMember as PrismaWeddingMember,
  type WeddingScene as PrismaWeddingScene,
} from '@prisma/client';
import {
  STARTER_TEMPLATES,
  TIER_CATALOG,
  type AuthProvider,
  type AvatarConfig,
  type CeremonyConfig,
  type GuestSide,
  type MemberRole,
  type ModerationStatus,
  type SceneLayoutDocument,
  type TemplateId,
  type WeddingTier,
} from '@dco/shared';
import { createSeedSnapshot } from './seedData';
import type {
  AdminUserRecord,
  BouquetCatchRecord,
  GiftIntentRecord,
  GiftLedgerRecord,
  GuestbookEntryRecord,
  InvitationRsvpRecord,
  PartnerVoucherRecord,
  PhotoAssetRecord,
  PhotoType,
  PlatformSettingRecord,
  SaasOrderRecord,
  UserRecord,
  WeddingMemberRecord,
  WeddingRecord,
  WeddingSceneRecord,
} from './types';

declare global {
  // eslint-disable-next-line no-var
  var __dcoPrismaClient: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
  if (!globalThis.__dcoPrismaClient) {
    globalThis.__dcoPrismaClient = new PrismaClient();
  }
  return globalThis.__dcoPrismaClient;
}

function mapUser(u: PrismaUser): UserRecord {
  return {
    id: u.id,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    email: u.email,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    isLocked: u.isLocked,
    lockedAt: u.lockedAt ? u.lockedAt.toISOString() : null,
    lockedReason: u.lockedReason,
    lockedById: u.lockedById,
  };
}

function mapWedding(w: PrismaWedding): WeddingRecord {
  return {
    id: w.id,
    slug: w.slug,
    title: w.title,
    brideName: w.brideName,
    groomName: w.groomName,
    ownerId: w.ownerId,
    tier: w.tier,
    status: w.status,
    weddingDate: w.weddingDate.toISOString(),
    trialExpiresAt: w.trialExpiresAt ? w.trialExpiresAt.toISOString() : null,
    archiveAt: w.archiveAt ? w.archiveAt.toISOString() : null,
    archivedAt: w.archivedAt ? w.archivedAt.toISOString() : null,
    pinHash: w.pinHash,
    maxConcurrentUsers: w.maxConcurrentUsers,
    videoEmbedUrl: w.videoEmbedUrl,
    videoIsLive: w.videoIsLive,
    bankBin: w.bankBin,
    bankAccountNo: w.bankAccountNo,
    bankAccountName: w.bankAccountName,
    webhookProvider: w.webhookProvider,
    webhookSecretHash: w.webhookSecretHash,
    ceremonyConfig: (w.ceremonyConfig as unknown as CeremonyConfig | null) ?? null,
    invitationConfig: w.invitationConfig ?? null,
    invitationOnly: w.invitationOnly,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

function mapScene(s: PrismaWeddingScene): WeddingSceneRecord {
  return {
    id: s.id,
    weddingId: s.weddingId,
    templateId: s.templateId as TemplateId,
    layoutData: s.layoutData as unknown as SceneLayoutDocument,
    version: s.version,
    updatedAt: s.updatedAt.toISOString(),
  };
}

function mapMember(m: PrismaWeddingMember): WeddingMemberRecord {
  return {
    id: m.id,
    weddingId: m.weddingId,
    userId: m.userId,
    role: m.role,
    side: m.side,
    nicknameOverride: m.nicknameOverride,
    avatarConfig: (m.avatarConfig as unknown as AvatarConfig | null) ?? null,
    moderationStatus: m.moderationStatus,
    moderatedById: m.moderatedById,
    moderationReason: m.moderationReason,
    joinedAt: m.joinedAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

function mapPhoto(p: PrismaPhotoAsset): PhotoAssetRecord {
  return {
    id: p.id,
    weddingId: p.weddingId,
    uploaderId: p.uploaderId,
    type: p.type,
    r2ObjectKey: p.r2ObjectKey,
    publicUrl: p.publicUrl,
    caption: p.caption,
    hasWatermark: p.hasWatermark,
    displayOrder: p.displayOrder,
    createdAt: p.createdAt.toISOString(),
  };
}

function mapGuestbook(g: PrismaGuestbookEntry): GuestbookEntryRecord {
  return {
    id: g.id,
    weddingId: g.weddingId,
    authorId: g.authorId,
    authorName: g.authorName,
    side: g.side,
    message: g.message,
    isHidden: g.isHidden,
    createdAt: g.createdAt.toISOString(),
  };
}

function mapBouquet(b: PrismaBouquetCatch): BouquetCatchRecord {
  return {
    id: b.id,
    weddingId: b.weddingId,
    winnerId: b.winnerId,
    winnerName: b.winnerName,
    shardId: b.shardId,
    caughtAt: b.caughtAt.toISOString(),
  };
}

function mapGiftIntent(i: PrismaGiftIntent): GiftIntentRecord {
  return {
    id: i.id,
    weddingId: i.weddingId,
    guestUserId: i.guestUserId,
    guestName: i.guestName,
    wishMessage: i.wishMessage,
    transferCode: i.transferCode,
    status: i.status,
    expiresAt: i.expiresAt.toISOString(),
    createdAt: i.createdAt.toISOString(),
  };
}

function mapGiftLedger(l: PrismaGiftLedger): GiftLedgerRecord {
  return {
    id: l.id,
    weddingId: l.weddingId,
    giftIntentId: l.giftIntentId,
    guestUserId: l.guestUserId,
    guestName: l.guestName,
    wishMessage: l.wishMessage,
    amountVnd: l.amountVnd,
    provider: l.provider,
    providerTxId: l.providerTxId,
    bankTxDate: l.bankTxDate.toISOString(),
    verifiedAt: l.verifiedAt.toISOString(),
  };
}

function mapRsvp(r: { id: string; weddingId: string; guestName: string; phone: string | null; attending: boolean; headcount: number; side: GuestSide; note: string | null; createdAt: Date }): InvitationRsvpRecord {
  return { ...r, createdAt: r.createdAt.toISOString() };
}

function mapSaasOrder(o: PrismaSaasOrder): SaasOrderRecord {
  return {
    id: o.id,
    weddingId: o.weddingId,
    buyerId: o.buyerId,
    targetTier: o.targetTier,
    amountVnd: o.amountVnd,
    orderCode: o.orderCode,
    status: o.status,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
  };
}

function mapVoucher(v: PrismaPartnerVoucher): PartnerVoucherRecord {
  return {
    id: v.id,
    code: v.code,
    studioName: v.studioName,
    discountPercent: v.discountPercent,
    targetTier: v.targetTier,
    maxUses: v.maxUses,
    usedCount: v.usedCount,
    isActive: v.isActive,
    createdAt: v.createdAt.toISOString(),
  };
}

export const prismaRepo = {
  async upsertOAuthUser(input: {
    provider: AuthProvider;
    providerAccountId: string;
    displayName: string;
    email?: string | null;
    avatarUrl?: string | null;
  }): Promise<UserRecord> {
    const prisma = getPrismaClient();
    const existingAcc = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: input.provider,
          providerAccountId: input.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existingAcc) {
      const updated = await prisma.user.update({
        where: { id: existingAcc.userId },
        data: {
          displayName: input.displayName || existingAcc.user.displayName,
          avatarUrl: input.avatarUrl ?? existingAcc.user.avatarUrl,
        },
      });
      return mapUser(updated);
    }

    const created = await prisma.user.create({
      data: {
        displayName: input.displayName,
        email: input.email ?? null,
        avatarUrl: input.avatarUrl ?? null,
        accounts: {
          create: {
            provider: input.provider,
            providerAccountId: input.providerAccountId,
          },
        },
      },
    });
    return mapUser(created);
  },

  async getUserById(userId: string): Promise<UserRecord | null> {
    const user = await getPrismaClient().user.findUnique({ where: { id: userId } });
    return user ? mapUser(user) : null;
  },

  async listWeddings(ownerId?: string): Promise<WeddingRecord[]> {
    const rows = await getPrismaClient().wedding.findMany({
      where: ownerId ? { ownerId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapWedding);
  },

  async getWeddingBySlug(slug: string): Promise<WeddingRecord | null> {
    const row = await getPrismaClient().wedding.findUnique({ where: { slug } });
    return row ? mapWedding(row) : null;
  },

  async getWeddingById(id: string): Promise<WeddingRecord | null> {
    const row = await getPrismaClient().wedding.findUnique({ where: { id } });
    return row ? mapWedding(row) : null;
  },

  async getSceneByWeddingId(weddingId: string): Promise<WeddingSceneRecord | null> {
    const row = await getPrismaClient().weddingScene.findUnique({ where: { weddingId } });
    return row ? mapScene(row) : null;
  },

  async createWedding(input: {
    slug: string;
    title: string;
    brideName: string;
    groomName: string;
    ownerId: string;
    tier: WeddingTier;
    templateId: TemplateId;
    weddingDate: string;
    /** Invitation only: no trial clock, the invitation stays open */
    invitationOnly?: boolean;
  }): Promise<{ wedding: WeddingRecord; scene: WeddingSceneRecord }> {
    const prisma = getPrismaClient();
    const existing = await prisma.wedding.findUnique({ where: { slug: input.slug } });
    if (existing) throw new Error('SLUG_ALREADY_EXISTS');

    const now = new Date();
    const isTrial = input.tier === 'TRIAL_24H' && !input.invitationOnly;
    const weddingDate = new Date(input.weddingDate);
    const archiveAt = isTrial || input.invitationOnly
      ? null
      : new Date(weddingDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tpl = STARTER_TEMPLATES[input.templateId] ?? STARTER_TEMPLATES.luxury_ballroom;

    const result = await prisma.$transaction(async (tx) => {
      const wedding = await tx.wedding.create({
        data: {
          slug: input.slug,
          title: input.title,
          brideName: input.brideName,
          groomName: input.groomName,
          ownerId: input.ownerId,
          tier: input.tier,
          status: isTrial ? 'TRIAL_ACTIVE' : 'DRAFT',
          weddingDate,
          trialExpiresAt: isTrial ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : null,
          archiveAt,
          maxConcurrentUsers: TIER_CATALOG[input.tier].maxCcu,
          invitationOnly: Boolean(input.invitationOnly),
          ceremonyConfig: { autoBouquetToss: true } as Prisma.InputJsonValue,
        },
      });

      const scene = await tx.weddingScene.create({
        data: {
          weddingId: wedding.id,
          templateId: input.templateId,
          layoutData: structuredClone(tpl.layout) as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.weddingMember.create({
        data: {
          weddingId: wedding.id,
          userId: input.ownerId,
          role: 'OWNER',
          side: 'GROOM_SIDE',
          avatarConfig: {
            outfitId: 'vest_chu_re',
            hairId: 'hair_1',
            hairColor: '#1f2937',
          } as Prisma.InputJsonValue,
        },
      });

      return { wedding: mapWedding(wedding), scene: mapScene(scene) };
    });

    return result;
  },

  async updateWedding(
    weddingId: string,
    patch: Partial<
      Pick<
        WeddingRecord,
        | 'title'
        | 'brideName'
        | 'groomName'
        | 'weddingDate'
        | 'pinHash'
        | 'videoEmbedUrl'
        | 'videoIsLive'
        | 'bankBin'
        | 'bankAccountNo'
        | 'bankAccountName'
        | 'webhookProvider'
        | 'webhookSecretHash'
        | 'ceremonyConfig'
        | 'invitationConfig'
      >
    >
  ): Promise<WeddingRecord | null> {
    const prisma = getPrismaClient();
    const existing = await prisma.wedding.findUnique({ where: { id: weddingId } });
    if (!existing) return null;

    const data: Prisma.WeddingUpdateInput = {};
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.brideName !== undefined) data.brideName = patch.brideName;
    if (patch.groomName !== undefined) data.groomName = patch.groomName;
    if (patch.pinHash !== undefined) data.pinHash = patch.pinHash;
    if (patch.videoEmbedUrl !== undefined) data.videoEmbedUrl = patch.videoEmbedUrl;
    if (patch.videoIsLive !== undefined) data.videoIsLive = patch.videoIsLive;
    if (patch.bankBin !== undefined) data.bankBin = patch.bankBin;
    if (patch.bankAccountNo !== undefined) data.bankAccountNo = patch.bankAccountNo;
    if (patch.bankAccountName !== undefined) data.bankAccountName = patch.bankAccountName;
    if (patch.webhookProvider !== undefined) data.webhookProvider = patch.webhookProvider;
    if (patch.webhookSecretHash !== undefined) data.webhookSecretHash = patch.webhookSecretHash;
    if (patch.ceremonyConfig !== undefined) {
      data.ceremonyConfig =
        patch.ceremonyConfig === null
          ? Prisma.JsonNull
          : (patch.ceremonyConfig as unknown as Prisma.InputJsonValue);
    }
    if (patch.invitationConfig !== undefined) {
      data.invitationConfig =
        patch.invitationConfig === null ? Prisma.JsonNull : (patch.invitationConfig as Prisma.InputJsonValue);
    }
    if (patch.weddingDate !== undefined) {
      const wd = new Date(patch.weddingDate);
      data.weddingDate = wd;
      if (existing.tier !== 'TRIAL_24H' && existing.tier !== 'PUBLIC_PLAZA') {
        data.archiveAt = new Date(wd.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
    }

    const updated = await prisma.wedding.update({ where: { id: weddingId }, data });
    return mapWedding(updated);
  },

  async updateWeddingScene(
    weddingId: string,
    layout: SceneLayoutDocument
  ): Promise<WeddingSceneRecord | null> {
    const prisma = getPrismaClient();
    const existing = await prisma.weddingScene.findUnique({ where: { weddingId } });
    if (!existing) return null;
    const updated = await prisma.weddingScene.update({
      where: { weddingId },
      data: {
        templateId: layout.templateId,
        layoutData: layout as unknown as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });
    return mapScene(updated);
  },

  async getMember(weddingId: string, userId: string): Promise<WeddingMemberRecord | null> {
    const row = await getPrismaClient().weddingMember.findUnique({
      where: { weddingId_userId: { weddingId, userId } },
    });
    return row ? mapMember(row) : null;
  },

  async listMembers(
    weddingId: string
  ): Promise<Array<WeddingMemberRecord & { userDisplayName: string }>> {
    const rows = await getPrismaClient().weddingMember.findMany({
      where: { weddingId },
      include: { user: { select: { displayName: true } } },
    });
    return rows.map((r) => ({
      ...mapMember(r),
      userDisplayName: r.user.displayName,
    }));
  },

  async upsertMember(input: {
    weddingId: string;
    userId: string;
    role?: MemberRole;
    side?: GuestSide;
    nicknameOverride?: string | null;
    avatarConfig?: AvatarConfig | null;
  }): Promise<WeddingMemberRecord> {
    const prisma = getPrismaClient();
    const existing = await prisma.weddingMember.findUnique({
      where: { weddingId_userId: { weddingId: input.weddingId, userId: input.userId } },
    });

    if (existing) {
      const updated = await prisma.weddingMember.update({
        where: { id: existing.id },
        data: {
          side: input.side ?? existing.side,
          nicknameOverride:
            input.nicknameOverride !== undefined ? input.nicknameOverride : existing.nicknameOverride,
          avatarConfig: input.avatarConfig
            ? (input.avatarConfig as unknown as Prisma.InputJsonValue)
            : undefined,
          role: input.role && existing.role !== 'OWNER' ? input.role : existing.role,
        },
      });
      return mapMember(updated);
    }

    const created = await prisma.weddingMember.create({
      data: {
        weddingId: input.weddingId,
        userId: input.userId,
        role: input.role ?? 'GUEST',
        side: input.side ?? 'FRIEND',
        nicknameOverride: input.nicknameOverride ?? null,
        avatarConfig: input.avatarConfig
          ? (input.avatarConfig as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });
    return mapMember(created);
  },

  async setMemberModeration(input: {
    weddingId: string;
    targetUserId: string;
    status: ModerationStatus;
    moderatedById: string;
    reason?: string;
  }): Promise<WeddingMemberRecord | null> {
    const prisma = getPrismaClient();
    const existing = await prisma.weddingMember.findUnique({
      where: { weddingId_userId: { weddingId: input.weddingId, userId: input.targetUserId } },
    });
    if (!existing) return null;
    const updated = await prisma.weddingMember.update({
      where: { id: existing.id },
      data: {
        moderationStatus: input.status,
        moderatedById: input.moderatedById,
        moderationReason: input.reason ?? null,
      },
    });
    return mapMember(updated);
  },

  /** Removes one photo of a wedding; false when it is not that wedding's */
  async deletePhoto(weddingId: string, photoId: string): Promise<PhotoAssetRecord | null> {
    const prisma = getPrismaClient();
    const row = await prisma.photoAsset.findFirst({ where: { id: photoId, weddingId } });
    if (!row) return null;
    await prisma.photoAsset.delete({ where: { id: row.id } });
    return mapPhoto(row);
  },

  async listPhotos(weddingId: string): Promise<PhotoAssetRecord[]> {
    const rows = await getPrismaClient().photoAsset.findMany({
      where: { weddingId },
      orderBy: { displayOrder: 'asc' },
    });
    return rows.map(mapPhoto);
  },

  async addPhoto(input: {
    weddingId: string;
    uploaderId: string;
    type: PhotoType;
    r2ObjectKey: string;
    publicUrl: string;
    caption?: string | null;
    hasWatermark: boolean;
  }): Promise<PhotoAssetRecord> {
    const prisma = getPrismaClient();
    const count = await prisma.photoAsset.count({ where: { weddingId: input.weddingId } });
    const created = await prisma.photoAsset.create({
      data: {
        weddingId: input.weddingId,
        uploaderId: input.uploaderId,
        type: input.type,
        r2ObjectKey: input.r2ObjectKey,
        publicUrl: input.publicUrl,
        caption: input.caption ?? null,
        hasWatermark: input.hasWatermark,
        displayOrder: count + 1,
      },
    });
    return mapPhoto(created);
  },

  async listGuestbook(weddingId: string): Promise<GuestbookEntryRecord[]> {
    const rows = await getPrismaClient().guestbookEntry.findMany({
      where: { weddingId, isHidden: false },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapGuestbook);
  },

  async addGuestbookEntry(input: {
    weddingId: string;
    authorId: string | null;
    authorName: string;
    side: GuestSide;
    message: string;
  }): Promise<GuestbookEntryRecord> {
    const created = await getPrismaClient().guestbookEntry.create({
      data: {
        weddingId: input.weddingId,
        authorId: input.authorId,
        authorName: input.authorName,
        side: input.side,
        message: input.message,
      },
    });
    return mapGuestbook(created);
  },

  async listBouquetCatches(weddingId: string): Promise<BouquetCatchRecord[]> {
    const rows = await getPrismaClient().bouquetCatch.findMany({
      where: { weddingId },
      orderBy: { caughtAt: 'desc' },
    });
    return rows.map(mapBouquet);
  },

  async recordBouquetCatch(input: {
    weddingId: string;
    winnerId: string;
    winnerName: string;
    shardId: string;
  }): Promise<BouquetCatchRecord> {
    const created = await getPrismaClient().bouquetCatch.create({
      data: {
        weddingId: input.weddingId,
        winnerId: input.winnerId,
        winnerName: input.winnerName,
        shardId: input.shardId,
      },
    });
    return mapBouquet(created);
  },

  async getGiftIntentByCode(transferCode: string): Promise<GiftIntentRecord | null> {
    const row = await getPrismaClient().giftIntent.findUnique({ where: { transferCode } });
    return row ? mapGiftIntent(row) : null;
  },

  async getGiftIntentById(id: string): Promise<GiftIntentRecord | null> {
    const row = await getPrismaClient().giftIntent.findUnique({ where: { id } });
    return row ? mapGiftIntent(row) : null;
  },

  async createInvitationRsvp(input: Omit<InvitationRsvpRecord, 'id' | 'createdAt'>): Promise<InvitationRsvpRecord> {
    const row = await getPrismaClient().invitationRsvp.create({ data: input });
    return mapRsvp(row);
  },

  async listInvitationRsvps(weddingId: string): Promise<InvitationRsvpRecord[]> {
    const rows = await getPrismaClient().invitationRsvp.findMany({ where: { weddingId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRsvp);
  },

  async createGiftIntent(input: {
    weddingId: string;
    guestUserId: string | null;
    guestName: string;
    wishMessage: string;
    transferCode: string;
  }): Promise<GiftIntentRecord> {
    const created = await getPrismaClient().giftIntent.create({
      data: {
        weddingId: input.weddingId,
        guestUserId: input.guestUserId,
        guestName: input.guestName,
        wishMessage: input.wishMessage,
        transferCode: input.transferCode,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    return mapGiftIntent(created);
  },

  async settleGiftByWebhook(input: {
    transferCode: string;
    amountVnd: number;
    provider: string;
    providerTxId: string;
    bankTxDate: string;
    rawPayload: unknown;
  }): Promise<{
    duplicate: boolean;
    weddingId?: string;
    guestName?: string;
    wishMessage?: string;
    ledger?: GiftLedgerRecord;
  }> {
    const prisma = getPrismaClient();
    try {
      return await prisma.$transaction(async (tx) => {
        const dupLedger = await tx.giftLedger.findUnique({
          where: { providerTxId: input.providerTxId },
        });
        const dupLog = await tx.paymentWebhookLog.findUnique({
          where: { providerTxId: input.providerTxId },
        });
        if (dupLedger || dupLog) return { duplicate: true };

        const intent = await tx.giftIntent.findUnique({
          where: { transferCode: input.transferCode },
          include: { wedding: true },
        });
        if (
          !intent ||
          (intent.wedding.tier !== 'HAPPINESS' && intent.wedding.tier !== 'VIP_FULFILLMENT')
        ) {
          return { duplicate: false };
        }

        await tx.giftIntent.update({
          where: { id: intent.id },
          data: { status: 'VERIFIED' },
        });

        const ledger = await tx.giftLedger.create({
          data: {
            weddingId: intent.weddingId,
            giftIntentId: intent.id,
            guestUserId: intent.guestUserId,
            guestName: intent.guestName,
            wishMessage: intent.wishMessage,
            amountVnd: input.amountVnd,
            provider: input.provider,
            providerTxId: input.providerTxId,
            bankTxDate: new Date(input.bankTxDate),
          },
        });

        await tx.paymentWebhookLog.create({
          data: {
            provider: input.provider,
            providerTxId: input.providerTxId,
            rawPayload: input.rawPayload as Prisma.InputJsonValue,
          },
        });

        return {
          duplicate: false,
          weddingId: intent.weddingId,
          guestName: intent.guestName,
          wishMessage: intent.wishMessage,
          ledger: mapGiftLedger(ledger),
        };
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return { duplicate: true };
      }
      throw err;
    }
  },

  async getPrivateGiftLedger(weddingId: string): Promise<GiftLedgerRecord[]> {
    const rows = await getPrismaClient().giftLedger.findMany({
      where: { weddingId },
      orderBy: { verifiedAt: 'desc' },
    });
    return rows.map(mapGiftLedger);
  },

  async createSaasOrder(input: {
    weddingId: string;
    buyerId: string;
    targetTier: WeddingTier;
    amountVnd: number;
    orderCode: string;
  }): Promise<SaasOrderRecord> {
    const created = await getPrismaClient().saasOrder.create({
      data: {
        weddingId: input.weddingId,
        buyerId: input.buyerId,
        targetTier: input.targetTier,
        amountVnd: input.amountVnd,
        orderCode: input.orderCode,
      },
    });
    return mapSaasOrder(created);
  },

  async getSaasOrderByCode(orderCode: string): Promise<SaasOrderRecord | null> {
    const row = await getPrismaClient().saasOrder.findUnique({ where: { orderCode } });
    return row ? mapSaasOrder(row) : null;
  },

  async settleSaasOrderByWebhook(input: {
    orderCode: string;
    amountVnd: number;
    provider: string;
    providerTxId: string;
    rawPayload: unknown;
  }): Promise<{ duplicate: boolean; upgraded: boolean; wedding?: WeddingRecord; reason?: string }> {
    const prisma = getPrismaClient();
    try {
      return await prisma.$transaction(async (tx) => {
        const dupLog = await tx.paymentWebhookLog.findUnique({
          where: { providerTxId: input.providerTxId },
        });
        if (dupLog) return { duplicate: true, upgraded: false };

        const order = await tx.saasOrder.findUnique({
          where: { orderCode: input.orderCode },
          include: { wedding: true },
        });
        if (!order) return { duplicate: false, upgraded: false, reason: 'ORDER_NOT_FOUND' };
        if (input.amountVnd < order.amountVnd) {
          return { duplicate: false, upgraded: false, reason: 'INSUFFICIENT_AMOUNT' };
        }

        const now = new Date();
        await tx.saasOrder.update({
          where: { id: order.id },
          data: { status: 'PAID', paidAt: now },
        });

        const updatedWedding = await tx.wedding.update({
          where: { id: order.weddingId },
          data: {
            tier: order.targetTier,
            status: 'PUBLISHED_3D',
            trialExpiresAt: null,
            maxConcurrentUsers: TIER_CATALOG[order.targetTier].maxCcu,
            archiveAt: new Date(
              order.wedding.weddingDate.getTime() + 7 * 24 * 60 * 60 * 1000
            ),
          },
        });

        await tx.paymentWebhookLog.create({
          data: {
            provider: input.provider,
            providerTxId: input.providerTxId,
            saasOrderId: order.id,
            rawPayload: input.rawPayload as Prisma.InputJsonValue,
          },
        });

        return { duplicate: false, upgraded: true, wedding: mapWedding(updatedWedding) };
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return { duplicate: true, upgraded: false };
      }
      throw err;
    }
  },

  async expireDueTrials(nowMs = Date.now()): Promise<string[]> {
    const prisma = getPrismaClient();
    const now = new Date(nowMs);
    const due = await prisma.wedding.findMany({
      where: {
        tier: 'TRIAL_24H',
        status: 'TRIAL_ACTIVE',
        trialExpiresAt: { lte: now },
      },
      select: { id: true },
    });
    if (due.length === 0) return [];
    const ids = due.map((d) => d.id);
    await prisma.wedding.updateMany({
      where: { id: { in: ids } },
      data: { status: 'EXPIRED_TRIAL' },
    });
    return ids;
  },

  async archiveDueWeddings(nowMs = Date.now()): Promise<string[]> {
    const prisma = getPrismaClient();
    const now = new Date(nowMs);
    const due = await prisma.wedding.findMany({
      where: {
        tier: { in: ['HAPPINESS', 'VIP_FULFILLMENT'] },
        status: { in: ['PUBLISHED_3D', 'GRACE_PERIOD_7D'] },
        archiveAt: { lte: now },
      },
      select: { id: true },
    });
    if (due.length === 0) return [];
    const ids = due.map((d) => d.id);
    await prisma.wedding.updateMany({
      where: { id: { in: ids } },
      data: { status: 'ARCHIVED_2D_FOREVER', archivedAt: now },
    });
    return ids;
  },

  async listVouchers(): Promise<PartnerVoucherRecord[]> {
    const rows = await getPrismaClient().partnerVoucher.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapVoucher);
  },

  async getVoucherByCode(code: string): Promise<PartnerVoucherRecord | null> {
    const row = await getPrismaClient().partnerVoucher.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    return row ? mapVoucher(row) : null;
  },

  async createVoucher(input: {
    code: string;
    studioName: string;
    discountPercent: number;
    targetTier?: WeddingTier | null;
    maxUses: number;
  }): Promise<PartnerVoucherRecord> {
    const created = await getPrismaClient().partnerVoucher.create({
      data: {
        code: input.code.trim().toUpperCase(),
        studioName: input.studioName.trim(),
        discountPercent: Math.max(1, Math.min(100, input.discountPercent)),
        targetTier: input.targetTier ?? null,
        maxUses: Math.max(1, input.maxUses),
      },
    });
    return mapVoucher(created);
  },

  async setUserLock(input: {
    userId: string;
    locked: boolean;
    reason?: string | null;
    actorId: string;
  }): Promise<UserRecord | null> {
    const prisma = getPrismaClient();
    const existing = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!existing) return null;
    const updated = await prisma.user.update({
      where: { id: input.userId },
      data: input.locked
        ? { isLocked: true, lockedAt: new Date(), lockedReason: input.reason ?? null, lockedById: input.actorId }
        : { isLocked: false, lockedAt: null, lockedReason: null, lockedById: null },
    });
    return mapUser(updated);
  },

  async listSaasOrders(): Promise<SaasOrderRecord[]> {
    const rows = await getPrismaClient().saasOrder.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(mapSaasOrder);
  },

  async listUsersForAdmin(): Promise<AdminUserRecord[]> {
    const rows = await getPrismaClient().user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        accounts: { select: { provider: true } },
        _count: { select: { ownedWeddings: true, memberships: true } },
      },
    });
    return rows.map((r) => ({
      ...mapUser(r),
      providers: Array.from(new Set(r.accounts.map((a) => a.provider as AuthProvider))),
      ownedWeddingCount: r._count.ownedWeddings,
      membershipCount: r._count.memberships,
    }));
  },

  async setVoucherActive(code: string, isActive: boolean): Promise<PartnerVoucherRecord | null> {
    const prisma = getPrismaClient();
    const upper = code.trim().toUpperCase();
    const existing = await prisma.partnerVoucher.findUnique({ where: { code: upper } });
    if (!existing) return null;
    const updated = await prisma.partnerVoucher.update({ where: { code: upper }, data: { isActive } });
    return mapVoucher(updated);
  },

  async listPlatformSettings(): Promise<PlatformSettingRecord[]> {
    const rows = await getPrismaClient().platformSetting.findMany();
    return rows.map((r) => ({
      key: r.key,
      value: r.value,
      isSecret: r.isSecret,
      updatedById: r.updatedById,
      updatedAt: r.updatedAt.toISOString(),
    }));
  },

  /** Upserts entries; an entry with value null deletes that key. */
  async savePlatformSettings(input: {
    entries: Array<{ key: string; value: string | null; isSecret: boolean }>;
    updatedById: string;
  }): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.$transaction(
      input.entries.map((entry) =>
        entry.value === null
          ? prisma.platformSetting.deleteMany({ where: { key: entry.key } })
          : prisma.platformSetting.upsert({
              where: { key: entry.key },
              create: {
                key: entry.key,
                value: entry.value,
                isSecret: entry.isSecret,
                updatedById: input.updatedById,
              },
              update: { value: entry.value, isSecret: entry.isSecret, updatedById: input.updatedById },
            })
      )
    );
  },

  async redeemVoucher(
    code: string,
    targetTier: WeddingTier
  ): Promise<{ ok: true; voucher: PartnerVoucherRecord } | { ok: false; reason: string }> {
    const prisma = getPrismaClient();
    const upper = code.trim().toUpperCase();
    return prisma.$transaction(async (tx) => {
      const v = await tx.partnerVoucher.findUnique({ where: { code: upper } });
      if (!v || !v.isActive) return { ok: false, reason: 'VOUCHER_NOT_FOUND_OR_INACTIVE' };
      if (v.usedCount >= v.maxUses) return { ok: false, reason: 'VOUCHER_EXHAUSTED' };
      if (v.targetTier && v.targetTier !== targetTier) {
        return { ok: false, reason: 'VOUCHER_TIER_MISMATCH' };
      }
      const updated = await tx.partnerVoucher.update({
        where: { id: v.id },
        data: { usedCount: { increment: 1 } },
      });
      return { ok: true, voucher: mapVoucher(updated) };
    });
  },

  async activateWeddingByVoucher(input: {
    weddingId: string;
    buyerId: string;
    targetTier: WeddingTier;
    orderCode: string;
  }): Promise<{ order: SaasOrderRecord; wedding: WeddingRecord }> {
    const prisma = getPrismaClient();
    return prisma.$transaction(async (tx) => {
      const existingWedding = await tx.wedding.findUniqueOrThrow({
        where: { id: input.weddingId },
      });
      const now = new Date();
      const order = await tx.saasOrder.create({
        data: {
          weddingId: input.weddingId,
          buyerId: input.buyerId,
          targetTier: input.targetTier,
          amountVnd: 0,
          orderCode: input.orderCode,
          status: 'PAID',
          paidAt: now,
        },
      });
      const wedding = await tx.wedding.update({
        where: { id: input.weddingId },
        data: {
          tier: input.targetTier,
          status: 'PUBLISHED_3D',
          trialExpiresAt: null,
          maxConcurrentUsers: TIER_CATALOG[input.targetTier].maxCcu,
          archiveAt: new Date(
            existingWedding.weddingDate.getTime() + 7 * 24 * 60 * 60 * 1000
          ),
        },
      });
      return { order: mapSaasOrder(order), wedding: mapWedding(wedding) };
    });
  },
};

export async function seedPostgresIfEmpty(): Promise<{ seeded: boolean; count: number }> {
  const prisma = getPrismaClient();
  const existingCount = await prisma.wedding.count();
  if (existingCount > 0) {
    return { seeded: false, count: existingCount };
  }

  const snap = createSeedSnapshot();
  await prisma.$transaction(async (tx) => {
    for (const u of snap.users) {
      await tx.user.create({
        data: {
          id: u.id,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          email: u.email,
        },
      });
    }
    for (const a of snap.accounts) {
      await tx.account.create({
        data: {
          id: a.id,
          userId: a.userId,
          provider: a.provider,
          providerAccountId: a.providerAccountId,
        },
      });
    }
    for (const w of snap.weddings) {
      await tx.wedding.create({
        data: {
          id: w.id,
          slug: w.slug,
          title: w.title,
          brideName: w.brideName,
          groomName: w.groomName,
          ownerId: w.ownerId,
          tier: w.tier,
          status: w.status,
          weddingDate: new Date(w.weddingDate),
          trialExpiresAt: w.trialExpiresAt ? new Date(w.trialExpiresAt) : null,
          archiveAt: w.archiveAt ? new Date(w.archiveAt) : null,
          archivedAt: w.archivedAt ? new Date(w.archivedAt) : null,
          pinHash: w.pinHash,
          maxConcurrentUsers: w.maxConcurrentUsers,
          videoEmbedUrl: w.videoEmbedUrl,
          videoIsLive: w.videoIsLive,
          bankBin: w.bankBin,
          bankAccountNo: w.bankAccountNo,
          bankAccountName: w.bankAccountName,
          webhookProvider: w.webhookProvider,
          webhookSecretHash: w.webhookSecretHash,
          ceremonyConfig:
            w.ceremonyConfig === null
              ? Prisma.JsonNull
              : (w.ceremonyConfig as unknown as Prisma.InputJsonValue),
        },
      });
    }
    for (const s of snap.scenes) {
      await tx.weddingScene.create({
        data: {
          id: s.id,
          weddingId: s.weddingId,
          templateId: s.templateId,
          layoutData: s.layoutData as unknown as Prisma.InputJsonValue,
          version: s.version,
        },
      });
    }
    for (const m of snap.members) {
      await tx.weddingMember.create({
        data: {
          id: m.id,
          weddingId: m.weddingId,
          userId: m.userId,
          role: m.role,
          side: m.side,
          nicknameOverride: m.nicknameOverride,
          avatarConfig: m.avatarConfig
            ? (m.avatarConfig as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          moderationStatus: m.moderationStatus,
        },
      });
    }
    for (const p of snap.photos) {
      await tx.photoAsset.create({
        data: {
          id: p.id,
          weddingId: p.weddingId,
          uploaderId: p.uploaderId,
          type: p.type,
          r2ObjectKey: p.r2ObjectKey,
          publicUrl: p.publicUrl,
          caption: p.caption,
          hasWatermark: p.hasWatermark,
          displayOrder: p.displayOrder,
        },
      });
    }
    for (const g of snap.guestbook) {
      await tx.guestbookEntry.create({
        data: {
          id: g.id,
          weddingId: g.weddingId,
          authorId: g.authorId,
          authorName: g.authorName,
          side: g.side,
          message: g.message,
          isHidden: g.isHidden,
        },
      });
    }
    for (const b of snap.bouquetCatches) {
      await tx.bouquetCatch.create({
        data: {
          id: b.id,
          weddingId: b.weddingId,
          winnerId: b.winnerId,
          winnerName: b.winnerName,
          shardId: b.shardId,
        },
      });
    }
    for (const v of snap.partnerVouchers) {
      await tx.partnerVoucher.create({
        data: {
          id: v.id,
          code: v.code,
          studioName: v.studioName,
          discountPercent: v.discountPercent,
          targetTier: v.targetTier,
          maxUses: v.maxUses,
          usedCount: v.usedCount,
          isActive: v.isActive,
        },
      });
    }
  });

  return { seeded: true, count: snap.weddings.length };
}
