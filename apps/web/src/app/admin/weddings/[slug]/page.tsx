import type { Metadata } from 'next';
import Link from 'next/link';
import { dbRepo, type WeddingMemberRecord } from '@dco/database';
import { INVITATION_PLANS, STARTER_TEMPLATES, TIER_CATALOG, invitationAccess } from '@dco/shared';
import { ArrowLeft, ExternalLink, HeartHandshake, Mail, MessageSquareHeart } from 'lucide-react';
import {
  AdminPageHeader,
  cx,
  EmptyState,
  FactList,
  LifecycleTimeline,
  Panel,
  Pill,
  TierBadge,
  tableStyles,
} from '@/components/admin/ui';
import {
  calendarDaysFrom,
  describeDayOffset,
  formatDate,
  formatDateTime,
  formatVnd,
  maskAccountNumber,
  MODERATION_LABELS,
  ORDER_STATUS_LABELS,
  ROLE_LABELS,
  SIDE_LABELS,
} from '@/lib/adminFormat';
import { getAdminSession } from '@/lib/adminPage';
import { fetchWeddingShards } from '@/lib/realtimeClient';
import { describeLifecycle } from '@/lib/weddingLifecycle';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return { title: `Phòng /w/${params.slug}` };
}

const MEMBER_LIMIT = 50;
const ROLE_ORDER: Record<WeddingMemberRecord['role'], number> = { OWNER: 0, BRIDE: 1, GROOM: 2, MC: 3, GUEST: 4 };
const ROLE_TONE = { OWNER: 'wine', BRIDE: 'rose', GROOM: 'rose', MC: 'amber', GUEST: 'slate' } as const;
const MODERATION_TONE = { ACTIVE: 'emerald', MUTED: 'amber', BANNED: 'rose' } as const;
const ORDER_TONE = { PENDING: 'amber', PAID: 'emerald', CANCELLED: 'slate' } as const;

const linkButton =
  'inline-flex items-center gap-1.5 rounded-lg border border-[#E5D5B8] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-800 transition-colors hover:border-rose-300 hover:text-rose-800';

export default async function AdminWeddingDetailPage({ params }: { params: { slug: string } }) {
  if (!(await getAdminSession())) return null;

  const wedding = await dbRepo.getWeddingBySlug(params.slug);
  if (!wedding) {
    return (
      <>
        <AdminPageHeader
          title="Không tìm thấy phòng cưới"
          actions={
            <Link href="/admin/weddings" className={linkButton}>
              <ArrowLeft aria-hidden className="h-3.5 w-3.5" /> Danh sách phòng
            </Link>
          }
        />
        <Panel>
          <EmptyState icon={<HeartHandshake className="h-7 w-7" />} title={`Không có phòng nào ở /w/${params.slug}`}>
            Phòng có thể đã đổi đường dẫn. Tìm lại theo tên cặp đôi trong danh sách phòng cưới.
          </EmptyState>
        </Panel>
      </>
    );
  }

  const now = new Date();
  const [owner, scene, members, allOrders, guestbook, photos, gifts, catches, shards] = await Promise.all([
    dbRepo.getUserById(wedding.ownerId),
    dbRepo.getSceneByWeddingId(wedding.id),
    dbRepo.listMembers(wedding.id),
    dbRepo.listSaasOrders(),
    dbRepo.listGuestbook(wedding.id),
    dbRepo.listPhotos(wedding.id),
    dbRepo.getPrivateGiftLedger(wedding.id),
    dbRepo.listBouquetCatches(wedding.id),
    fetchWeddingShards(wedding.id),
  ]);

  const orders = allOrders.filter((o) => o.weddingId === wedding.id);
  const firstPaid = orders
    .filter((o) => o.status === 'PAID' && o.paidAt)
    .sort((a, b) => a.paidAt!.localeCompare(b.paidAt!))[0];
  const lifecycle = describeLifecycle(wedding, now);
  const couple = `${wedding.groomName} & ${wedding.brideName}`;
  const liveGuests = shards.reduce((sum, s) => sum + s.clients, 0);
  const giftsEnabled = TIER_CATALOG[wedding.tier].allowVietQr || invitationAccess(wedding).published;

  const stageDates = [
    `Tạo ${formatDate(wedding.createdAt)}`,
    wedding.trialExpiresAt ? `Hết hạn ${formatDate(wedding.trialExpiresAt)}` : '',
    // Only a stage the room actually reached gets an activation date
    firstPaid && lifecycle.stage >= 2 ? `Kích hoạt ${formatDate(firstPaid.paidAt)}` : '',
    `Cưới ${formatDate(wedding.weddingDate)}`,
    wedding.archivedAt
      ? `Đã chuyển ${formatDate(wedding.archivedAt)}`
      : wedding.archiveAt
      ? `Dự kiến ${formatDate(wedding.archiveAt)}`
      : '',
  ];

  const sortedMembers = [...members].sort(
    (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || b.joinedAt.localeCompare(a.joinedAt)
  );
  const recentGuestbook = guestbook.slice(0, 5);
  const ceremonyTime = wedding.ceremonyConfig?.ceremonyTimeIso;

  return (
    <>
      <AdminPageHeader
        title={couple}
        description={
          <>
            {wedding.title} · <span className="whitespace-nowrap">/w/{wedding.slug}</span>
          </>
        }
        actions={
          <>
            <Link href="/admin/weddings" className={linkButton}>
              <ArrowLeft aria-hidden className="h-3.5 w-3.5" /> Danh sách phòng
            </Link>
            <a href={`/w/${wedding.slug}/invite`} target="_blank" rel="noreferrer" className={linkButton}>
              <Mail aria-hidden className="h-3.5 w-3.5" /> Thiệp mời
              <span className="sr-only">(mở tab mới)</span>
            </a>
            <a href={`/w/${wedding.slug}`} target="_blank" rel="noreferrer" className={linkButton}>
              <ExternalLink aria-hidden className="h-3.5 w-3.5" /> Mở sảnh
              <span className="sr-only">(mở tab mới)</span>
            </a>
          </>
        }
      />

      <Panel
        title="Vòng đời phòng"
        description={
          lifecycle.stage >= 0 ? (
            <>
              <span className="font-semibold text-slate-800">{lifecycle.label}</span> · {lifecycle.detail}
            </>
          ) : (
            'Quảng trường cộng đồng mở 24/7, không có vòng đời.'
          )
        }
      >
        {lifecycle.stage >= 0 ? (
          <LifecycleTimeline view={lifecycle} stageDates={stageDates} />
        ) : (
          <p className="text-[13px] text-slate-600">Phòng này luôn mở cho mọi người, không cần đăng nhập.</p>
        )}
      </Panel>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Thông tin phòng">
          <FactList
            items={[
              { label: 'Gói', value: <TierBadge tier={wedding.tier} /> },
              {
                label: 'Ngày cưới',
                value: (
                  <>
                    {formatDate(wedding.weddingDate)}
                    <span className="ml-1.5 text-slate-500">
                      ({describeDayOffset(calendarDaysFrom(wedding.weddingDate, now)).toLowerCase()})
                    </span>
                  </>
                ),
              },
              {
                label: 'Chủ tiệc',
                value: owner ? (
                  <span className="inline-flex flex-col items-end">
                    <span className="inline-flex items-center gap-2">
                      {owner.isLocked && <Pill tone="rose">Đã khoá</Pill>}
                      <Link
                        href={`/admin/users?q=${encodeURIComponent(owner.email || owner.displayName)}`}
                        className="font-semibold text-rose-700 hover:underline"
                      >
                        {owner.displayName}
                      </Link>
                    </span>
                    {owner.email && <span className="text-xs text-slate-500">{owner.email}</span>}
                  </span>
                ) : (
                  'Không rõ'
                ),
              },
              {
                label: 'Mẫu sảnh',
                value: scene ? STARTER_TEMPLATES[scene.templateId]?.nameVi ?? scene.templateId : 'Mặc định',
              },
              { label: 'Sức chứa theo gói', value: `${TIER_CATALOG[wedding.tier].maxCcu} khách cùng lúc` },
              { label: 'Mã PIN vào phòng', value: wedding.pinHash ? 'Có' : 'Không' },
              {
                label: 'Video sân khấu',
                value: wedding.videoEmbedUrl ? (wedding.videoIsLive ? 'Phát trực tiếp' : 'Có video') : 'Chưa có',
              },
              { label: 'Làm lễ tự động', value: ceremonyTime ? formatDateTime(ceremonyTime) : 'Chưa hẹn giờ' },
              { label: 'Tạo lúc', value: formatDateTime(wedding.createdAt) },
            ]}
          />
        </Panel>

        <div className="space-y-5">
          <Panel title="Hoạt động">
            <FactList
              items={[
                {
                  label: 'Đang trong sảnh',
                  value: (
                    <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
                      {liveGuests > 0 && <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-500" />}
                      {liveGuests} khách
                      {shards.length > 1 && <span className="font-normal text-slate-500">· {shards.length} sảnh con</span>}
                    </span>
                  ),
                },
                { label: 'Thành viên', value: <span className="tabular-nums">{members.length}</span> },
                { label: 'Lưu bút', value: <span className="tabular-nums">{guestbook.length}</span> },
                { label: 'Ảnh', value: <span className="tabular-nums">{photos.length}</span> },
                { label: 'Bắt hoa cưới', value: <span className="tabular-nums">{catches.length} lần</span> },
              ]}
            />
          </Panel>

          <Panel title="Mừng cưới qua SePay" description="Số tiền mừng là riêng tư của cặp đôi; ở đây chỉ hiện số lượt.">
            {giftsEnabled ? (
              <FactList
                items={[
                  {
                    label: 'Tài khoản nhận',
                    value:
                      wedding.bankBin && wedding.bankAccountNo ? (
                        <span className="inline-flex flex-col items-end">
                          <span className="tabular-nums">
                            {wedding.bankBin} · {maskAccountNumber(wedding.bankAccountNo)}
                          </span>
                          {wedding.bankAccountName && (
                            <span className="text-xs text-slate-500">{wedding.bankAccountName}</span>
                          )}
                        </span>
                      ) : (
                        <Pill tone="amber">Chưa cấu hình</Pill>
                      ),
                  },
                  {
                    label: 'Khoá SePay của cặp đôi',
                    value: wedding.webhookSecretHash ? (
                      <Pill tone="emerald">Đã cấu hình</Pill>
                    ) : (
                      <span className="text-[13px] text-slate-600">Chưa có, dùng khoá của nền tảng</span>
                    ),
                  },
                  { label: 'Quà mừng đã xác nhận', value: <span className="tabular-nums">{gifts.length} lượt</span> },
                ]}
              />
            ) : (
              <p className="text-[13px] text-slate-600">
                Gói hiện tại chưa mở hộp mừng cưới VietQR. Hộp mừng có ở Gói Hạnh Phúc và Viên Mãn VIP.
              </p>
            )}
          </Panel>
        </div>
      </div>

      <Panel
        className="mt-5"
        title={`Thành viên (${members.length})`}
        description="Người đã vào phòng bằng tài khoản Google, kèm vai trò và trạng thái kiểm duyệt."
        bodyClassName="p-0"
      >
        {sortedMembers.length === 0 ? (
          <EmptyState title="Chưa có ai vào phòng này" />
        ) : (
          <>
            <div className={tableStyles.wrap}>
              <table className={`${tableStyles.table} min-w-[680px]`}>
                <thead>
                  <tr>
                    <th scope="col" className={`${tableStyles.th} ${tableStyles.stickyTh}`}>Tên</th>
                    <th scope="col" className={tableStyles.th}>Vai trò</th>
                    <th scope="col" className={tableStyles.th}>Bên</th>
                    <th scope="col" className={tableStyles.th}>Kiểm duyệt</th>
                    <th scope="col" className={tableStyles.th}>Vào phòng</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMembers.slice(0, MEMBER_LIMIT).map((m) => (
                    <tr key={m.id} className={tableStyles.row}>
                      <td className={`${tableStyles.td} ${tableStyles.stickyTd} max-md:max-w-[170px]`}>
                        <span className="block max-w-[260px] truncate font-medium text-slate-900">
                          {m.nicknameOverride || m.userDisplayName}
                        </span>
                        {m.nicknameOverride && m.nicknameOverride !== m.userDisplayName && (
                          <span className="block max-w-[260px] truncate text-xs text-slate-500">{m.userDisplayName}</span>
                        )}
                      </td>
                      <td className={tableStyles.td}>
                        <Pill tone={ROLE_TONE[m.role]}>{ROLE_LABELS[m.role]}</Pill>
                      </td>
                      <td className={`${tableStyles.td} text-slate-700`}>{SIDE_LABELS[m.side]}</td>
                      <td className={tableStyles.td}>
                        <Pill tone={MODERATION_TONE[m.moderationStatus]}>{MODERATION_LABELS[m.moderationStatus]}</Pill>
                      </td>
                      <td className={`${tableStyles.td} whitespace-nowrap tabular-nums text-slate-700`}>
                        {formatDateTime(m.joinedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sortedMembers.length > MEMBER_LIMIT && (
              <p className="px-5 py-3 text-[13px] text-slate-600">
                Đang hiện {MEMBER_LIMIT} / {sortedMembers.length} thành viên (chủ tiệc, cô dâu, chú rể, MC xếp trước).
              </p>
            )}
          </>
        )}
      </Panel>

      <Panel className="mt-5" title="Đơn nâng cấp" bodyClassName="p-0">
        {orders.length === 0 ? (
          <EmptyState title="Phòng này chưa có đơn nâng cấp nào" />
        ) : (
          <div className={tableStyles.wrap}>
            <table className={`${tableStyles.table} min-w-[680px]`}>
              <thead>
                <tr>
                  <th scope="col" className={`${tableStyles.th} ${tableStyles.stickyTh}`}>Mã đơn</th>
                  <th scope="col" className={tableStyles.th}>Gói</th>
                  <th scope="col" className={`${tableStyles.th} text-right`}>Số tiền</th>
                  <th scope="col" className={tableStyles.th}>Trạng thái</th>
                  <th scope="col" className={tableStyles.th}>Tạo lúc</th>
                  <th scope="col" className={tableStyles.th}>Thanh toán lúc</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className={tableStyles.row}>
                    <td className={`${tableStyles.td} ${tableStyles.stickyTd} whitespace-nowrap font-mono text-xs text-slate-800`}>
                      {o.orderCode}
                    </td>
                    <td className={tableStyles.td}>
                      {o.kind === 'INVITATION' ? <Pill tone="emerald">Thiệp · {INVITATION_PLANS.find((p) => p.id === o.invitationPlan)?.nameVi ?? 'gói thiệp'}</Pill> : <TierBadge tier={o.targetTier} />}
                    </td>
                    <td className={cx(tableStyles.td, 'whitespace-nowrap text-right tabular-nums text-slate-900')}>
                      {o.status === 'PAID' && o.amountVnd === 0 ? 'Voucher 100%' : formatVnd(o.amountVnd)}
                    </td>
                    <td className={tableStyles.td}>
                      <Pill tone={ORDER_TONE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Pill>
                    </td>
                    <td className={`${tableStyles.td} whitespace-nowrap tabular-nums text-slate-700`}>{formatDateTime(o.createdAt)}</td>
                    <td className={`${tableStyles.td} whitespace-nowrap tabular-nums text-slate-700`}>{formatDateTime(o.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        className="mt-5"
        title="Lưu bút gần đây"
        description={guestbook.length > recentGuestbook.length ? `5 / ${guestbook.length} lời chúc mới nhất` : undefined}
        bodyClassName="p-0"
      >
        {recentGuestbook.length === 0 ? (
          <EmptyState icon={<MessageSquareHeart className="h-7 w-7" />} title="Chưa có lời chúc nào" />
        ) : (
          <ul>
            {recentGuestbook.map((g) => (
              <li key={g.id} className="border-b border-[#F5EEE2] px-5 py-3.5 last:border-b-0">
                <p className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
                  <span className="font-semibold text-slate-900">{g.authorName}</span>
                  <span className="text-slate-500">{SIDE_LABELS[g.side]}</span>
                  <span className="ml-auto text-xs tabular-nums text-slate-500">{formatDateTime(g.createdAt)}</span>
                </p>
                <p className="mt-1 max-w-[70ch] text-sm text-slate-700">{g.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
