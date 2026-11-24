import { dbRepo, type AdminUserRecord, type SaasOrderRecord, type WeddingRecord } from '@dco/database';
import { INVITATION_3D_PLANS, INVITATION_PLANS, type AuthProvider, type WeddingTier } from '@dco/shared';
import {
  calendarDaysFrom,
  describeDayOffset,
  formatDate,
  formatDateTime,
  formatVnd,
  normalizeSearch,
} from './adminFormat';
import { describeLifecycle, type LifecycleView } from './weddingLifecycle';

/**
 * Server-side view models for the admin console. Dates and money are formatted here,
 * once, so client tables never re-format them (no hydration drift between UTC
 * servers and Vietnamese browsers).
 */

export interface WeddingRow {
  id: string;
  slug: string;
  title: string;
  couple: string;
  tier: WeddingTier;
  lifecycle: LifecycleView;
  weddingDateIso: string;
  weddingDateLabel: string;
  weddingDayLabel: string;
  createdIso: string;
  createdLabel: string;
  ownerName: string;
  ownerEmail: string;
  search: string;
}

export interface OrderRow {
  id: string;
  orderCode: string;
  weddingTitle: string;
  weddingSlug: string;
  tier: WeddingTier;
  /** Set for an online-invitation order: the plan bought ('Thiệp · 3 tháng') */
  invitationPlanLabel: string | null;
  amountVnd: number;
  amountLabel: string;
  viaVoucher: boolean;
  status: SaasOrderRecord['status'];
  buyerName: string;
  buyerEmail: string;
  createdIso: string;
  createdLabel: string;
  paidLabel: string;
  search: string;
}

export interface UserRow {
  id: string;
  displayName: string;
  email: string;
  providers: AuthProvider[];
  ownedWeddings: Array<{ slug: string; title: string }>;
  membershipCount: number;
  createdIso: string;
  createdLabel: string;
  isLocked: boolean;
  lockedLabel: string;
  lockedReason: string | null;
  /** Platform admins (and the signed-in admin) cannot be locked */
  lockable: boolean;
  search: string;
}

export interface AdminDataset {
  now: Date;
  weddings: WeddingRecord[];
  orders: SaasOrderRecord[];
  users: AdminUserRecord[];
}

export async function loadAdminDataset(): Promise<AdminDataset> {
  const [weddings, orders, users] = await Promise.all([
    dbRepo.listWeddings(),
    dbRepo.listSaasOrders(),
    dbRepo.listUsersForAdmin(),
  ]);
  return { now: new Date(), weddings, orders, users };
}

function usersById(users: AdminUserRecord[]): Map<string, AdminUserRecord> {
  return new Map(users.map((u) => [u.id, u]));
}

export function toWeddingRows({ now, weddings, users }: AdminDataset): WeddingRow[] {
  const byId = usersById(users);
  return weddings.map((w) => {
    const owner = byId.get(w.ownerId);
    const couple = `${w.groomName} & ${w.brideName}`;
    const dayOffset = calendarDaysFrom(w.weddingDate, now);
    return {
      id: w.id,
      slug: w.slug,
      title: w.title,
      couple,
      tier: w.tier,
      lifecycle: describeLifecycle(w, now),
      weddingDateIso: w.weddingDate,
      weddingDateLabel: formatDate(w.weddingDate),
      weddingDayLabel: describeDayOffset(dayOffset),
      createdIso: w.createdAt,
      createdLabel: formatDate(w.createdAt),
      ownerName: owner?.displayName ?? 'Không rõ',
      ownerEmail: owner?.email ?? '',
      search: normalizeSearch([w.title, couple, w.slug, owner?.displayName, owner?.email].join(' ')),
    };
  });
}

export function toOrderRows({ orders, weddings, users }: AdminDataset): OrderRow[] {
  const weddingById = new Map(weddings.map((w) => [w.id, w]));
  const byId = usersById(users);
  return orders.map((o) => {
    const wedding = weddingById.get(o.weddingId);
    const buyer = byId.get(o.buyerId);
    const viaVoucher = o.status === 'PAID' && o.amountVnd === 0;
    return {
      id: o.id,
      orderCode: o.orderCode,
      weddingTitle: wedding?.title ?? 'Phòng đã xoá',
      weddingSlug: wedding?.slug ?? '',
      tier: o.targetTier,
      invitationPlanLabel:
        o.kind === 'INVITATION_3D'
          ? `Thiệp 3D · ${INVITATION_3D_PLANS.find((p) => p.id === o.invitationPlan)?.nameVi ?? 'gói thiệp 3D'}`
          : o.kind === 'INVITATION'
            ? `Thiệp 2D · ${INVITATION_PLANS.find((p) => p.id === o.invitationPlan)?.nameVi ?? 'gói thiệp'}`
            : null,
      amountVnd: o.amountVnd,
      amountLabel: viaVoucher ? 'Voucher 100%' : formatVnd(o.amountVnd),
      viaVoucher,
      status: o.status,
      buyerName: buyer?.displayName ?? 'Không rõ',
      buyerEmail: buyer?.email ?? '',
      createdIso: o.createdAt,
      createdLabel: formatDateTime(o.createdAt),
      paidLabel: formatDateTime(o.paidAt),
      search: normalizeSearch([o.orderCode, wedding?.title, wedding?.slug, buyer?.displayName, buyer?.email].join(' ')),
    };
  });
}

export function toUserRows(
  { users, weddings }: AdminDataset,
  isAdminAccount: (user: AdminUserRecord) => boolean
): UserRow[] {
  const owned = new Map<string, Array<{ slug: string; title: string }>>();
  for (const w of weddings) {
    const list = owned.get(w.ownerId) ?? [];
    list.push({ slug: w.slug, title: w.title });
    owned.set(w.ownerId, list);
  }
  return users.map((u) => ({
    id: u.id,
    displayName: u.displayName,
    email: u.email ?? '',
    providers: u.providers,
    ownedWeddings: owned.get(u.id) ?? [],
    membershipCount: u.membershipCount,
    createdIso: u.createdAt,
    createdLabel: formatDate(u.createdAt),
    isLocked: Boolean(u.isLocked),
    lockedLabel: u.lockedAt ? formatDate(u.lockedAt) : '',
    lockedReason: u.lockedReason ?? null,
    lockable: !isAdminAccount(u),
    search: normalizeSearch([u.displayName, u.email].join(' ')),
  }));
}
