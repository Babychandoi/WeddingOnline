import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  STARTER_TEMPLATES,
  TIER_CATALOG,
  type AuthProvider,
  type AvatarConfig,
  type GuestSide,
  type MemberRole,
  type ModerationStatus,
  type SceneLayoutDocument,
  type TemplateId,
  type WeddingTier,
  invitationPlanEnd,
  isInvitationPlanId,
} from '@dco/shared';
import { prismaRepo } from './prismaRepo';
import { createSeedSnapshot, type LocalDatabaseSnapshot } from './seedData';
import type {
  AdminUserRecord,
  BouquetCatchRecord,
  FireworkOrderRecord,
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

let envLoaded = false;

function findTurboRootDir(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, 'turbo.json'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function loadMonorepoEnvOnce(): void {
  if (envLoaded) return;
  envLoaded = true;
  const rootDir = findTurboRootDir();
  if (!rootDir) return;
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadMonorepoEnvOnce();

function findRepoRoot(): string {
  if (process.env.DCO_LOCAL_DATA_DIR) {
    return path.resolve(process.env.DCO_LOCAL_DATA_DIR);
  }
  const rootDir = findTurboRootDir();
  if (rootDir) {
    return path.join(rootDir, '.local-data');
  }
  return path.join(process.cwd(), '.local-data');
}

class LocalJsonStore {
  private filePath: string;
  private lastLoadedMtime = 0;
  private cache: LocalDatabaseSnapshot | null = null;

  constructor() {
    const dir = findRepoRoot();
    fs.mkdirSync(dir, { recursive: true });
    this.filePath = path.join(dir, 'db.json');
    if (!fs.existsSync(this.filePath)) {
      this.writeSnapshot(createSeedSnapshot());
    }
  }

  private readSnapshot(): LocalDatabaseSnapshot {
    const stat = fs.statSync(this.filePath);
    if (this.cache && stat.mtimeMs === this.lastLoadedMtime) {
      return this.cache;
    }
    const raw = fs.readFileSync(this.filePath, 'utf8');
    this.cache = JSON.parse(raw) as LocalDatabaseSnapshot;
    this.lastLoadedMtime = stat.mtimeMs;
    return this.cache;
  }

  private writeSnapshot(data: LocalDatabaseSnapshot): void {
    const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, this.filePath);
    const stat = fs.statSync(this.filePath);
    this.cache = data;
    this.lastLoadedMtime = stat.mtimeMs;
  }

  public mutate<T>(fn: (db: LocalDatabaseSnapshot) => T): T {
    const db = structuredClone(this.readSnapshot());
    const result = fn(db);
    this.writeSnapshot(db);
    return result;
  }

  public query<T>(fn: (db: LocalDatabaseSnapshot) => T): T {
    return fn(this.readSnapshot());
  }
}

let singletonStore: LocalJsonStore | null = null;

function getStore(): LocalJsonStore {
  if (!singletonStore) {
    singletonStore = new LocalJsonStore();
  }
  return singletonStore;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

export function getStorageDriver(): 'prisma-postgres' | 'local-json' {
    loadMonorepoEnvOnce();
    return process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0
      ? 'prisma-postgres'
      : 'local-json';
}

const localJsonRepo = {
  async upsertOAuthUser(input: {
    provider: AuthProvider;
    providerAccountId: string;
    displayName: string;
    email?: string | null;
    avatarUrl?: string | null;
  }): Promise<UserRecord> {
    return getStore().mutate((db) => {
      const existingAcc = db.accounts.find(
        (a) => a.provider === input.provider && a.providerAccountId === input.providerAccountId
      );
      const nowIso = new Date().toISOString();
      if (existingAcc) {
        const user = db.users.find((u) => u.id === existingAcc.userId);
        if (user) {
          user.displayName = input.displayName || user.displayName;
          user.avatarUrl = input.avatarUrl ?? user.avatarUrl;
          user.updatedAt = nowIso;
          return user;
        }
      }
      const userId = newId('usr');
      const user: UserRecord = {
        id: userId,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl ?? null,
        email: input.email ?? null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.users.push(user);
      db.accounts.push({
        id: newId('acc'),
        userId,
        provider: input.provider,
        providerAccountId: input.providerAccountId,
        createdAt: nowIso,
      });
      return user;
    });
  },

  async getUserById(userId: string): Promise < UserRecord | null > {
      return getStore().query((db) => db.users.find((u) => u.id === userId) ?? null);
    },

  async listWeddings(ownerId ?: string): Promise < WeddingRecord[] > {
        return getStore().query((db) =>
          ownerId ? db.weddings.filter((w) => w.ownerId === ownerId) : [...db.weddings]
        );
      },

  async getWeddingBySlug(slug: string): Promise < WeddingRecord | null > {
          return getStore().query((db) => db.weddings.find((w) => w.slug === slug) ?? null);
        },

  async getWeddingById(id: string): Promise < WeddingRecord | null > {
            return getStore().query((db) => db.weddings.find((w) => w.id === id) ?? null);
          },

  async getSceneByWeddingId(weddingId: string): Promise < WeddingSceneRecord | null > {
              return getStore().query((db) => db.scenes.find((s) => s.weddingId === weddingId) ?? null);
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
                  invitationOnly?: boolean;
                }): Promise < { wedding: WeddingRecord; scene: WeddingSceneRecord } > {
                  return getStore().mutate((db) => {
                    if (db.weddings.some((w) => w.slug === input.slug)) {
                      throw new Error('SLUG_ALREADY_EXISTS');
                    }
                    const now = new Date();
                    const nowIso = now.toISOString();
                    const weddingId = newId('wed');
                    const isTrial = input.tier === 'TRIAL_24H' && !input.invitationOnly;
                    const weddingDateMs = new Date(input.weddingDate).getTime();
                    const archiveAt = new Date(weddingDateMs + 7 * 24 * 60 * 60 * 1000).toISOString();

                    const wedding: WeddingRecord = {
                      id: weddingId,
                      slug: input.slug,
                      title: input.title,
                      brideName: input.brideName,
                      groomName: input.groomName,
                      ownerId: input.ownerId,
                      tier: input.tier,
                      status: isTrial ? 'TRIAL_ACTIVE' : 'DRAFT',
                      weddingDate: input.weddingDate,
                      trialExpiresAt: isTrial ? new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
                      archiveAt: isTrial || input.invitationOnly ? null : archiveAt,
                      invitationOnly: Boolean(input.invitationOnly),
                      archivedAt: null,
                      pinHash: null,
                      maxConcurrentUsers: TIER_CATALOG[input.tier].maxCcu,
                      videoEmbedUrl: null,
                      videoIsLive: false,
                      bankBin: null,
                      bankAccountNo: null,
                      bankAccountName: null,
                      webhookProvider: null,
                      webhookSecretHash: null,
                      ceremonyConfig: { autoBouquetToss: true },
                      createdAt: nowIso,
                      updatedAt: nowIso,
                    };

                    const tpl = STARTER_TEMPLATES[input.templateId] ?? STARTER_TEMPLATES.luxury_ballroom;
                    const scene: WeddingSceneRecord = {
                      id: newId('scn'),
                      weddingId,
                      templateId: input.templateId,
                      layoutData: structuredClone(tpl.layout),
                      version: 1,
                      updatedAt: nowIso,
                    };

                    const ownerMember: WeddingMemberRecord = {
                      id: newId('mem'),
                      weddingId,
                      userId: input.ownerId,
                      role: 'OWNER',
                      side: 'GROOM_SIDE',
                      nicknameOverride: null,
                      avatarConfig: { outfitId: 'vest_chu_re', hairId: 'hair_1', hairColor: '#1f2937' },
                      moderationStatus: 'ACTIVE',
                      moderatedById: null,
                      moderationReason: null,
                      joinedAt: nowIso,
                      updatedAt: nowIso,
                    };

                    db.weddings.push(wedding);
                    db.scenes.push(scene);
                    db.members.push(ownerMember);

                    return { wedding, scene };
                  });
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
  ): Promise < WeddingRecord | null > {
              return getStore().mutate((db) => {
                const w = db.weddings.find((item) => item.id === weddingId);
                if (!w) return null;
                Object.assign(w, patch, { updatedAt: new Date().toISOString() });
                if (patch.weddingDate && w.tier !== 'TRIAL_24H' && w.tier !== 'PUBLIC_PLAZA') {
                  w.archiveAt = new Date(new Date(patch.weddingDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
                }
                return w;
              });
            },

  async updateWeddingScene(
                weddingId: string,
                layout: SceneLayoutDocument
              ): Promise < WeddingSceneRecord | null > {
                return getStore().mutate((db) => {
                  const scene = db.scenes.find((s) => s.weddingId === weddingId);
                  if (!scene) return null;
                  scene.templateId = layout.templateId;
                  scene.layoutData = layout;
                  scene.version += 1;
                  scene.updatedAt = new Date().toISOString();
                  return scene;
                });
              },

  async getMember(weddingId: string, userId: string): Promise < WeddingMemberRecord | null > {
                  return getStore().query(
                    (db) => db.members.find((m) => m.weddingId === weddingId && m.userId === userId) ?? null
                  );
                },

                    async listMembers(
                      weddingId: string
                    ): Promise<Array<WeddingMemberRecord & { userDisplayName: string }>> {
                      return getStore().query((db) =>
                        db.members
                          .filter((m) => m.weddingId === weddingId)
                          .map((m) => ({
                            ...m,
                            userDisplayName: db.users.find((u) => u.id === m.userId)?.displayName ?? 'Khách',
                          }))
                      );
                    },

                      async upsertMember(input: {
                        weddingId: string;
                        userId: string;
                        role?: MemberRole;
                        side?: GuestSide;
                        nicknameOverride?: string | null;
                        avatarConfig?: AvatarConfig | null;
                      }): Promise<WeddingMemberRecord> {
                      return getStore().mutate((db) => {
                        const nowIso = new Date().toISOString();
                        const existing = db.members.find(
                          (m) => m.weddingId === input.weddingId && m.userId === input.userId
                        );
                        if (existing) {
                          if (input.side) existing.side = input.side;
                          if (input.nicknameOverride !== undefined) existing.nicknameOverride = input.nicknameOverride;
                          if (input.avatarConfig) existing.avatarConfig = input.avatarConfig;
                          if (input.role && existing.role !== 'OWNER') existing.role = input.role;
                          existing.updatedAt = nowIso;
                          return existing;
                        }
                        const created: WeddingMemberRecord = {
                          id: newId('mem'),
                          weddingId: input.weddingId,
                          userId: input.userId,
                          role: input.role ?? 'GUEST',
                          side: input.side ?? 'FRIEND',
                          nicknameOverride: input.nicknameOverride ?? null,
                          avatarConfig: input.avatarConfig ?? null,
                          moderationStatus: 'ACTIVE',
                          moderatedById: null,
                          moderationReason: null,
                          joinedAt: nowIso,
                          updatedAt: nowIso,
                        };
                        db.members.push(created);
                        return created;
                      });
                    },

                      async setMemberModeration(input: {
                        weddingId: string;
                        targetUserId: string;
                        status: ModerationStatus;
                        moderatedById: string;
                        reason?: string;
                      }): Promise<WeddingMemberRecord | null> {
                      return getStore().mutate((db) => {
                        const m = db.members.find(
                          (item) => item.weddingId === input.weddingId && item.userId === input.targetUserId
                        );
                        if (!m) return null;
                        m.moderationStatus = input.status;
                        m.moderatedById = input.moderatedById;
                        m.moderationReason = input.reason ?? null;
                        m.updatedAt = new Date().toISOString();
                        return m;
                      });
                    },

  async deletePhoto(weddingId: string, photoId: string): Promise<PhotoAssetRecord | null> {
    return getStore().mutate((db) => {
      const i = db.photos.findIndex((p) => p.id === photoId && p.weddingId === weddingId);
      if (i < 0) return null;
      const [removed] = db.photos.splice(i, 1);
      return removed;
    });
  },

  async listPhotos(weddingId: string): Promise < PhotoAssetRecord[] > {
                        return getStore().query((db) =>
                          db.photos.filter((p) => p.weddingId === weddingId).sort((a, b) => a.displayOrder - b.displayOrder)
                        );
                      },

                          async addPhoto(input: {
                            weddingId: string;
                            uploaderId: string;
                            type: PhotoType;
                            r2ObjectKey: string;
                            publicUrl: string;
                            caption?: string | null;
                            hasWatermark: boolean;
                          }): Promise < PhotoAssetRecord > {
                            return getStore().mutate((db) => {
                              const count = db.photos.filter((p) => p.weddingId === input.weddingId).length;
                              const asset: PhotoAssetRecord = {
                                id: newId('pht'),
                                weddingId: input.weddingId,
                                uploaderId: input.uploaderId,
                                type: input.type,
                                r2ObjectKey: input.r2ObjectKey,
                                publicUrl: input.publicUrl,
                                caption: input.caption ?? null,
                                hasWatermark: input.hasWatermark,
                                displayOrder: count + 1,
                                createdAt: new Date().toISOString(),
                              };
                              db.photos.push(asset);
                              return asset;
                            });
                          },

  async listGuestbook(weddingId: string): Promise < GuestbookEntryRecord[] > {
                          return getStore().query((db) =>
                            db.guestbook
                              .filter((g) => g.weddingId === weddingId && !g.isHidden)
                              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                          );
                        },

                            async addGuestbookEntry(input: {
                              weddingId: string;
                              authorId: string | null;
                              authorName: string;
                              side: GuestSide;
                              message: string;
                            }): Promise < GuestbookEntryRecord > {
                              return getStore().mutate((db) => {
                                const entry: GuestbookEntryRecord = {
                                  id: newId('gb'),
                                  weddingId: input.weddingId,
                                  authorId: input.authorId,
                                  authorName: input.authorName,
                                  side: input.side,
                                  message: input.message,
                                  isHidden: false,
                                  createdAt: new Date().toISOString(),
                                };
                                db.guestbook.push(entry);
                                return entry;
                              });
                            },

  async listBouquetCatches(weddingId: string): Promise < BouquetCatchRecord[] > {
                            return getStore().query((db) =>
                              db.bouquetCatches
                                .filter((b) => b.weddingId === weddingId)
                                .sort((a, b) => b.caughtAt.localeCompare(a.caughtAt))
                            );
                          },

                              async recordBouquetCatch(input: {
                                weddingId: string;
                                winnerId: string;
                                winnerName: string;
                                shardId: string;
                              }): Promise < BouquetCatchRecord > {
                                return getStore().mutate((db) => {
                                  const rec: BouquetCatchRecord = {
                                    id: newId('bq'),
                                    weddingId: input.weddingId,
                                    winnerId: input.winnerId,
                                    winnerName: input.winnerName,
                                    shardId: input.shardId,
                                    caughtAt: new Date().toISOString(),
                                  };
                                  db.bouquetCatches.push(rec);
                                  return rec;
                                });
                              },

  async getGiftIntentById(id: string): Promise<GiftIntentRecord | null> {
    return getStore().query((db) => db.giftIntents.find((i) => i.id === id) ?? null);
  },

  async createInvitationRsvp(input: Omit<InvitationRsvpRecord, 'id' | 'createdAt'>): Promise<InvitationRsvpRecord> {
    return getStore().mutate((db) => {
      const rec: InvitationRsvpRecord = { ...input, id: newId('rsvp'), createdAt: new Date().toISOString() };
      (db.invitationRsvps ??= []).push(rec);
      return rec;
    });
  },

  async listInvitationRsvps(weddingId: string): Promise<InvitationRsvpRecord[]> {
    return getStore().query((db) =>
      (db.invitationRsvps ?? []).filter((r) => r.weddingId === weddingId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },

  async getGiftIntentByCode(transferCode: string): Promise < GiftIntentRecord | null > {
                              return getStore().query((db) => db.giftIntents.find((i) => i.transferCode === transferCode) ?? null);
                            },

                                async createGiftIntent(input: {
                                  weddingId: string;
                                  guestUserId: string | null;
                                  guestName: string;
                                  wishMessage: string;
                                  transferCode: string;
                                }): Promise < GiftIntentRecord > {
                                  return getStore().mutate((db) => {
                                    const now = new Date();
                                    const intent: GiftIntentRecord = {
                                      id: newId('gi'),
                                      weddingId: input.weddingId,
                                      guestUserId: input.guestUserId,
                                      guestName: input.guestName,
                                      wishMessage: input.wishMessage,
                                      transferCode: input.transferCode,
                                      status: 'PENDING',
                                      expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
                                      createdAt: now.toISOString(),
                                    };
                                    db.giftIntents.push(intent);
                                    return intent;
                                  });
                                },

                                    async settleGiftByWebhook(input: {
                                      transferCode: string;
                                      amountVnd: number;
                                      provider: string;
                                      providerTxId: string;
                                      bankTxDate: string;
                                      rawPayload: unknown;
                                      }): Promise < {
                                        duplicate: boolean;
                                        weddingId?: string;
                                        guestName?: string;
                                        wishMessage?: string;
                                        ledger?: GiftLedgerRecord;
                            }> {
                              return getStore().mutate((db) => {
                                if (
                                  db.giftLedgers.some((l) => l.providerTxId === input.providerTxId) ||
                                  db.webhookLogs.some((w) => w.providerTxId === input.providerTxId)
                                ) {
                                  return { duplicate: true };
                                }

                                const intent = db.giftIntents.find((i) => i.transferCode === input.transferCode);
                                if (!intent) return { duplicate: false };

                                const wedding = db.weddings.find((w) => w.id === intent.weddingId);
                                if (!wedding || (wedding.tier !== 'HAPPINESS' && wedding.tier !== 'VIP_FULFILLMENT' && !(wedding.invitationPaidUntil && Date.parse(wedding.invitationPaidUntil) > Date.now()))) {
                                  return { duplicate: false };
                                }

                                intent.status = 'VERIFIED';
                                const nowIso = new Date().toISOString();
                                const ledger: GiftLedgerRecord = {
                                  id: newId('gl'),
                                  weddingId: intent.weddingId,
                                  giftIntentId: intent.id,
                                  guestUserId: intent.guestUserId,
                                  guestName: intent.guestName,
                                  wishMessage: intent.wishMessage,
                                  amountVnd: input.amountVnd,
                                  provider: input.provider,
                                  providerTxId: input.providerTxId,
                                  bankTxDate: input.bankTxDate,
                                  verifiedAt: nowIso,
                                };
                                db.giftLedgers.push(ledger);
                                db.webhookLogs.push({
                                  id: newId('wh'),
                                  provider: input.provider,
                                  providerTxId: input.providerTxId,
                                  saasOrderId: null,
                                  rawPayload: input.rawPayload,
                                  processedAt: nowIso,
                                });

                                return {
                                  duplicate: false,
                                  weddingId: intent.weddingId,
                                  guestName: intent.guestName,
                                  wishMessage: intent.wishMessage,
                                  ledger,
                                };
                              });
                            },

  async getPrivateGiftLedger(weddingId: string): Promise < GiftLedgerRecord[] > {
                                return getStore().query((db) =>
                                  db.giftLedgers
                                    .filter((l) => l.weddingId === weddingId)
                                    .sort((a, b) => b.verifiedAt.localeCompare(a.verifiedAt))
                                );
                              },

                                  async createSaasOrder(input: {
                                    weddingId: string;
                                    buyerId: string;
                                    targetTier: WeddingTier;
                                    amountVnd: number;
                                    orderCode: string;
                                    kind?: 'HALL' | 'INVITATION';
                                    invitationPlan?: string | null;
                                  }): Promise < SaasOrderRecord > {
                                    return getStore().mutate((db) => {
                                      const order: SaasOrderRecord = {
                                        id: newId('ord'),
                                        weddingId: input.weddingId,
                                        buyerId: input.buyerId,
                                        targetTier: input.targetTier,
                                        kind: input.kind ?? 'HALL',
                                        invitationPlan: input.invitationPlan ?? null,
                                        amountVnd: input.amountVnd,
                                        orderCode: input.orderCode,
                                        status: 'PENDING',
                                        paidAt: null,
                                        createdAt: new Date().toISOString(),
                                      };
                                      db.saasOrders.push(order);
                                      return order;
                                    });
                                  },

  async getSaasOrderByCode(orderCode: string): Promise < SaasOrderRecord | null > {
                                  return getStore().query((db) => db.saasOrders.find((o) => o.orderCode === orderCode) ?? null);
                                },

                                    async settleSaasOrderByWebhook(input: {
                                      orderCode: string;
                                      amountVnd: number;
                                      provider: string;
                                      providerTxId: string;
                                      rawPayload: unknown;
                                    }): Promise < { duplicate: boolean; upgraded: boolean; wedding?: WeddingRecord; reason?: string } > {
                                      return getStore().mutate((db) => {
                                        if (db.webhookLogs.some((w) => w.providerTxId === input.providerTxId)) {
                                          return { duplicate: true, upgraded: false };
                                        }
                                        const order = db.saasOrders.find((o) => o.orderCode === input.orderCode);
                                        if (!order) return { duplicate: false, upgraded: false, reason: 'ORDER_NOT_FOUND' };
                                        if (input.amountVnd < order.amountVnd) {
                                          return { duplicate: false, upgraded: false, reason: 'INSUFFICIENT_AMOUNT' };
                                        }

                                        const nowIso = new Date().toISOString();
                                        order.status = 'PAID';
                                        order.paidAt = nowIso;

                                        const wedding = db.weddings.find((w) => w.id === order.weddingId);
                                        if (wedding && order.kind === 'INVITATION' && isInvitationPlanId(order.invitationPlan)) {
                                          // An invitation plan publishes (or extends) the invitation; the hall is untouched
                                          wedding.invitationPaidUntil = invitationPlanEnd(order.invitationPlan, wedding.invitationPaidUntil ?? null, new Date(nowIso));
                                          wedding.updatedAt = nowIso;
                                        } else if (wedding) {
                                          wedding.tier = order.targetTier;
                                          wedding.status = 'PUBLISHED_3D';
                                          wedding.trialExpiresAt = null;
                                          wedding.maxConcurrentUsers = TIER_CATALOG[order.targetTier].maxCcu;
                                          wedding.archiveAt = new Date(
                                            new Date(wedding.weddingDate).getTime() + 7 * 24 * 60 * 60 * 1000
                                          ).toISOString();
                                          wedding.updatedAt = nowIso;
                                        }

                                        db.webhookLogs.push({
                                          id: newId('wh'),
                                          provider: input.provider,
                                          providerTxId: input.providerTxId,
                                          saasOrderId: order.id,
                                          rawPayload: input.rawPayload,
                                          processedAt: nowIso,
                                        });

                                        return { duplicate: false, upgraded: true, wedding };
                                      });
                                    },

  async createFireworkOrder(input: {
    weddingId: string;
    buyerId: string;
    buyerName: string;
    packId: string;
    amountVnd: number;
    message: string;
    orderCode: string;
  }): Promise<FireworkOrderRecord> {
    return getStore().mutate((db) => {
      const order: FireworkOrderRecord = {
        id: newId('fw'),
        ...input,
        status: 'PENDING',
        paidAt: null,
        createdAt: new Date().toISOString(),
      };
      (db.fireworkOrders ??= []).push(order);
      return order;
    });
  },

  async getFireworkOrderByCode(orderCode: string): Promise<FireworkOrderRecord | null> {
    return getStore().query((db) => (db.fireworkOrders ?? []).find((o) => o.orderCode === orderCode) ?? null);
  },

  /** Paid fireworks, newest first (admin) */
  async listFireworkOrders(): Promise<FireworkOrderRecord[]> {
    return getStore().query((db) => [...(db.fireworkOrders ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },

  async settleFireworkOrderByWebhook(input: {
    orderCode: string;
    amountVnd: number;
    provider: string;
    providerTxId: string;
    rawPayload: unknown;
  }): Promise<{ duplicate: boolean; launched: boolean; order?: FireworkOrderRecord; reason?: string }> {
    return getStore().mutate((db) => {
      if (db.webhookLogs.some((w) => w.providerTxId === input.providerTxId)) {
        return { duplicate: true, launched: false };
      }
      const order = (db.fireworkOrders ?? []).find((o) => o.orderCode === input.orderCode);
      if (!order) return { duplicate: false, launched: false, reason: 'ORDER_NOT_FOUND' };
      if (order.status === 'PAID') return { duplicate: false, launched: false, reason: 'ALREADY_PAID', order };
      if (input.amountVnd < order.amountVnd) {
        return { duplicate: false, launched: false, reason: 'INSUFFICIENT_AMOUNT', order };
      }
      const nowIso = new Date().toISOString();
      order.status = 'PAID';
      order.paidAt = nowIso;
      db.webhookLogs.push({
        id: newId('wh'),
        provider: input.provider,
        providerTxId: input.providerTxId,
        saasOrderId: null,
        rawPayload: input.rawPayload,
        processedAt: nowIso,
      });
      return { duplicate: false, launched: true, order };
    });
  },

  async expireDueTrials(nowMs = Date.now()): Promise < string[] > {
                                    return getStore().mutate((db) => {
                                      const expiredIds: string[] = [];
                                      for (const w of db.weddings) {
                                        if (
                                          w.tier === 'TRIAL_24H' &&
                                          w.status === 'TRIAL_ACTIVE' &&
                                          w.trialExpiresAt &&
                                          new Date(w.trialExpiresAt).getTime() <= nowMs
                                        ) {
                                          w.status = 'EXPIRED_TRIAL';
                                          w.updatedAt = new Date(nowMs).toISOString();
                                          expiredIds.push(w.id);
                                        }
                                      }
                                      return expiredIds;
                                    });
                                  },

  async archiveDueWeddings(nowMs = Date.now()): Promise < string[] > {
                                      return getStore().mutate((db) => {
                                        const archivedIds: string[] = [];
                                        for (const w of db.weddings) {
                                          if (
                                            w.tier !== 'PUBLIC_PLAZA' &&
                                            w.tier !== 'TRIAL_24H' &&
                                            (w.status === 'PUBLISHED_3D' || w.status === 'GRACE_PERIOD_7D') &&
                                            w.archiveAt &&
                                            new Date(w.archiveAt).getTime() <= nowMs
                                          ) {
                                            const iso = new Date(nowMs).toISOString();
                                            w.status = 'ARCHIVED_2D_FOREVER';
                                            w.archivedAt = iso;
                                            w.updatedAt = iso;
                                            archivedIds.push(w.id);
                                          }
                                        }
                                        return archivedIds;
                                      });
                                    },

  async listVouchers(): Promise<PartnerVoucherRecord[]> {
    return getStore().query((db) =>
      [...(db.partnerVouchers ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  },

  async getVoucherByCode(code: string): Promise<PartnerVoucherRecord | null> {
    const upper = code.trim().toUpperCase();
    return getStore().query(
      (db) => (db.partnerVouchers ?? []).find((v) => v.code === upper) ?? null
    );
  },

  async createVoucher(input: {
    code: string;
    studioName: string;
    discountPercent: number;
    targetTier?: WeddingTier | null;
    maxUses: number;
  }): Promise<PartnerVoucherRecord> {
    return getStore().mutate((db) => {
      db.partnerVouchers ??= [];
      const upper = input.code.trim().toUpperCase();
      if (db.partnerVouchers.some((v) => v.code === upper)) {
        throw new Error('VOUCHER_CODE_EXISTS');
      }
      const created: PartnerVoucherRecord = {
        id: newId('vch'),
        code: upper,
        studioName: input.studioName.trim(),
        discountPercent: Math.max(1, Math.min(100, input.discountPercent)),
        targetTier: input.targetTier ?? null,
        maxUses: Math.max(1, input.maxUses),
        usedCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      db.partnerVouchers.push(created);
      return created;
    });
  },

  async setUserLock(input: {
    userId: string;
    locked: boolean;
    reason?: string | null;
    actorId: string;
  }): Promise<UserRecord | null> {
    return getStore().mutate((db) => {
      const user = db.users.find((u) => u.id === input.userId);
      if (!user) return null;
      const nowIso = new Date().toISOString();
      user.isLocked = input.locked;
      user.lockedAt = input.locked ? nowIso : null;
      user.lockedReason = input.locked ? input.reason ?? null : null;
      user.lockedById = input.locked ? input.actorId : null;
      user.updatedAt = nowIso;
      return { ...user };
    });
  },

  async listSaasOrders(): Promise<SaasOrderRecord[]> {
    return getStore().query((db) =>
      [...db.saasOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  },

  async listUsersForAdmin(): Promise<AdminUserRecord[]> {
    return getStore().query((db) =>
      [...db.users]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((u) => ({
          ...u,
          providers: Array.from(
            new Set(db.accounts.filter((a) => a.userId === u.id).map((a) => a.provider))
          ),
          ownedWeddingCount: db.weddings.filter((w) => w.ownerId === u.id).length,
          membershipCount: db.members.filter((m) => m.userId === u.id).length,
        }))
    );
  },

  async setVoucherActive(code: string, isActive: boolean): Promise<PartnerVoucherRecord | null> {
    return getStore().mutate((db) => {
      const upper = code.trim().toUpperCase();
      const v = (db.partnerVouchers ?? []).find((item) => item.code === upper);
      if (!v) return null;
      v.isActive = isActive;
      return v;
    });
  },

  async listPlatformSettings(): Promise<PlatformSettingRecord[]> {
    return getStore().query((db) => [...(db.platformSettings ?? [])]);
  },

  /** Upserts entries; an entry with value null deletes that key. */
  async savePlatformSettings(input: {
    entries: Array<{ key: string; value: string | null; isSecret: boolean }>;
    updatedById: string;
  }): Promise<void> {
    getStore().mutate((db) => {
      db.platformSettings ??= [];
      const nowIso = new Date().toISOString();
      for (const entry of input.entries) {
        const idx = db.platformSettings.findIndex((s) => s.key === entry.key);
        if (entry.value === null) {
          if (idx >= 0) db.platformSettings.splice(idx, 1);
          continue;
        }
        const record: PlatformSettingRecord = {
          key: entry.key,
          value: entry.value,
          isSecret: entry.isSecret,
          updatedById: input.updatedById,
          updatedAt: nowIso,
        };
        if (idx >= 0) db.platformSettings[idx] = record;
        else db.platformSettings.push(record);
      }
    });
  },

  async redeemVoucher(
    code: string,
    targetTier: WeddingTier
  ): Promise<{ ok: true; voucher: PartnerVoucherRecord } | { ok: false; reason: string }> {
    return getStore().mutate((db) => {
      db.partnerVouchers ??= [];
      const upper = code.trim().toUpperCase();
      const v = db.partnerVouchers.find((item) => item.code === upper);
      if (!v || !v.isActive) return { ok: false, reason: 'VOUCHER_NOT_FOUND_OR_INACTIVE' };
      if (v.usedCount >= v.maxUses) return { ok: false, reason: 'VOUCHER_EXHAUSTED' };
      if (v.targetTier && v.targetTier !== targetTier) {
        return { ok: false, reason: 'VOUCHER_TIER_MISMATCH' };
      }
      v.usedCount += 1;
      return { ok: true, voucher: v };
    });
  },

  async activateWeddingByVoucher(input: {
    weddingId: string;
    buyerId: string;
    targetTier: WeddingTier;
    orderCode: string;
  }): Promise<{ order: SaasOrderRecord; wedding: WeddingRecord }> {
    return getStore().mutate((db) => {
      const nowIso = new Date().toISOString();
      const wedding = db.weddings.find((w) => w.id === input.weddingId);
      if (!wedding) throw new Error('WEDDING_NOT_FOUND');

      const order: SaasOrderRecord = {
        id: newId('ord'),
        weddingId: input.weddingId,
        buyerId: input.buyerId,
        targetTier: input.targetTier,
        amountVnd: 0,
        orderCode: input.orderCode,
        status: 'PAID',
        paidAt: nowIso,
        createdAt: nowIso,
      };
      db.saasOrders.push(order);

      wedding.tier = input.targetTier;
      wedding.status = 'PUBLISHED_3D';
      wedding.trialExpiresAt = null;
      wedding.maxConcurrentUsers = TIER_CATALOG[input.targetTier].maxCcu;
      wedding.archiveAt = new Date(
        new Date(wedding.weddingDate).getTime() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      wedding.updatedAt = nowIso;

      return { order, wedding };
    });
  },
};

                                  function activeRepo() {
                                    return getStorageDriver() === 'prisma-postgres' ? prismaRepo : localJsonRepo;
                                  }

                                  export const dbRepo = {
                                    upsertOAuthUser: (i: Parameters<typeof localJsonRepo.upsertOAuthUser>[0]) =>
                                      activeRepo().upsertOAuthUser(i),
                                    getUserById: (id: string) => activeRepo().getUserById(id),
                                    listWeddings: (ownerId?: string) => activeRepo().listWeddings(ownerId),
                                    getWeddingBySlug: (slug: string) => activeRepo().getWeddingBySlug(slug),
                                    getWeddingById: (id: string) => activeRepo().getWeddingById(id),
                                    getSceneByWeddingId: (weddingId: string) => activeRepo().getSceneByWeddingId(weddingId),
                                    createWedding: (i: Parameters<typeof localJsonRepo.createWedding>[0]) =>
                                      activeRepo().createWedding(i),
                                    updateWedding: (
                                      weddingId: string,
                                      patch: Parameters<typeof localJsonRepo.updateWedding>[1]
                                    ) => activeRepo().updateWedding(weddingId, patch),
                                    updateWeddingScene: (weddingId: string, layout: SceneLayoutDocument) =>
                                      activeRepo().updateWeddingScene(weddingId, layout),
                                    getMember: (weddingId: string, userId: string) => activeRepo().getMember(weddingId, userId),
                                    listMembers: (weddingId: string) => activeRepo().listMembers(weddingId),
                                    upsertMember: (i: Parameters<typeof localJsonRepo.upsertMember>[0]) =>
                                      activeRepo().upsertMember(i),
                                    setMemberModeration: (i: Parameters<typeof localJsonRepo.setMemberModeration>[0]) =>
                                      activeRepo().setMemberModeration(i),
                                    listPhotos: (weddingId: string) => activeRepo().listPhotos(weddingId),
                                    deletePhoto: (weddingId: string, photoId: string) => activeRepo().deletePhoto(weddingId, photoId),
                                    addPhoto: (i: Parameters<typeof localJsonRepo.addPhoto>[0]) => activeRepo().addPhoto(i),
                                    listGuestbook: (weddingId: string) => activeRepo().listGuestbook(weddingId),
                                    addGuestbookEntry: (i: Parameters<typeof localJsonRepo.addGuestbookEntry>[0]) =>
                                      activeRepo().addGuestbookEntry(i),
                                    listBouquetCatches: (weddingId: string) => activeRepo().listBouquetCatches(weddingId),
                                    recordBouquetCatch: (i: Parameters<typeof localJsonRepo.recordBouquetCatch>[0]) =>
                                      activeRepo().recordBouquetCatch(i),
                                    getGiftIntentByCode: (code: string) => activeRepo().getGiftIntentByCode(code),
                                    getGiftIntentById: (id: string) => activeRepo().getGiftIntentById(id),
                                    createInvitationRsvp: (i: Parameters<typeof localJsonRepo.createInvitationRsvp>[0]) =>
                                      activeRepo().createInvitationRsvp(i),
                                    listInvitationRsvps: (weddingId: string) => activeRepo().listInvitationRsvps(weddingId),
                                    createGiftIntent: (i: Parameters<typeof localJsonRepo.createGiftIntent>[0]) =>
                                      activeRepo().createGiftIntent(i),
                                    settleGiftByWebhook: (i: Parameters<typeof localJsonRepo.settleGiftByWebhook>[0]) =>
                                      activeRepo().settleGiftByWebhook(i),
                                    getPrivateGiftLedger: (weddingId: string) => activeRepo().getPrivateGiftLedger(weddingId),
                                    createSaasOrder: (i: Parameters<typeof localJsonRepo.createSaasOrder>[0]) =>
                                      activeRepo().createSaasOrder(i),
                                    getSaasOrderByCode: (code: string) => activeRepo().getSaasOrderByCode(code),
                                    settleSaasOrderByWebhook: (i: Parameters<typeof localJsonRepo.settleSaasOrderByWebhook>[0]) =>
                                      activeRepo().settleSaasOrderByWebhook(i),
                                    createFireworkOrder: (i: Parameters<typeof localJsonRepo.createFireworkOrder>[0]) =>
                                      activeRepo().createFireworkOrder(i),
                                    getFireworkOrderByCode: (code: string) => activeRepo().getFireworkOrderByCode(code),
                                    listFireworkOrders: () => activeRepo().listFireworkOrders(),
                                    settleFireworkOrderByWebhook: (i: Parameters<typeof localJsonRepo.settleFireworkOrderByWebhook>[0]) =>
                                      activeRepo().settleFireworkOrderByWebhook(i),
                                    expireDueTrials: (nowMs?: number) => activeRepo().expireDueTrials(nowMs),
                                    archiveDueWeddings: (nowMs?: number) => activeRepo().archiveDueWeddings(nowMs),
                                    listVouchers: () => activeRepo().listVouchers(),
                                    getVoucherByCode: (code: string) => activeRepo().getVoucherByCode(code),
                                    createVoucher: (i: Parameters<typeof localJsonRepo.createVoucher>[0]) =>
                                      activeRepo().createVoucher(i),
                                    redeemVoucher: (code: string, targetTier: WeddingTier) =>
                                      activeRepo().redeemVoucher(code, targetTier),
                                    setUserLock: (i: Parameters<typeof localJsonRepo.setUserLock>[0]) =>
                                      activeRepo().setUserLock(i),
                                    listSaasOrders: () => activeRepo().listSaasOrders(),
                                    listUsersForAdmin: () => activeRepo().listUsersForAdmin(),
                                    setVoucherActive: (code: string, isActive: boolean) =>
                                      activeRepo().setVoucherActive(code, isActive),
                                    listPlatformSettings: () => activeRepo().listPlatformSettings(),
                                    savePlatformSettings: (i: Parameters<typeof localJsonRepo.savePlatformSettings>[0]) =>
                                      activeRepo().savePlatformSettings(i),
                                    activateWeddingByVoucher: (i: Parameters<typeof localJsonRepo.activateWeddingByVoucher>[0]) =>
                                      activeRepo().activateWeddingByVoucher(i),
                                  };
