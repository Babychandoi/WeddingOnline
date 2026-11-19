import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { dbRepo } from '@dco/database';
import { isInsecureSecret } from '@dco/shared/server';
import { AlertCircle, ArrowRight, CalendarHeart, CheckCircle2, Clock3, HardDrive } from 'lucide-react';
import { cx, EmptyState, LifecycleTrack, Panel, Pill, TierBadge, tableStyles, AdminPageHeader } from '@/components/admin/ui';
import { calendarDaysFrom, formatLongDate, formatVnd, ORDER_STATUS_LABELS } from '@/lib/adminFormat';
import { loadAdminDataset, toOrderRows, toWeddingRows } from '@/lib/adminData';
import { getAdminSession } from '@/lib/adminPage';
import { getPlatformSetting } from '@/lib/platformSettings';
import { getR2Config } from '@/lib/r2';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tổng quan' };

type AttentionTone = 'critical' | 'warning' | 'info';

interface AttentionItem {
  tone: AttentionTone;
  title: string;
  detail: string;
  href: string;
  cta: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const ATTENTION_ICON: Record<AttentionTone, ReactNode> = {
  critical: <AlertCircle className="h-5 w-5 text-rose-600" />,
  warning: <Clock3 className="h-5 w-5 text-amber-600" />,
  info: <CalendarHeart className="h-5 w-5 text-[#8A5A2B]" />,
};

async function loadConfigHealth() {
  try {
    const [bin, account, sepayKey, r2] = await Promise.all([
      getPlatformSetting('PLATFORM_BANK_BIN'),
      getPlatformSetting('PLATFORM_BANK_ACCOUNT'),
      getPlatformSetting('PLATFORM_SEPAY_API_KEY'),
      getR2Config(),
    ]);
    return { bank: Boolean(bin && account), sepay: !isInsecureSecret(sepayKey, 16), r2: r2 !== null };
  } catch {
    return { bank: false, sepay: false, r2: false };
  }
}

export default async function AdminOverviewPage() {
  if (!(await getAdminSession())) return null;

  const [dataset, health, vouchers] = await Promise.all([
    loadAdminDataset(),
    loadConfigHealth(),
    dbRepo.listVouchers(),
  ]);
  const { now, orders, users } = dataset;
  const weddingRows = toWeddingRows(dataset);
  const orderRows = toOrderRows(dataset);

  // Figures
  const paid = orders.filter((o) => o.status === 'PAID' && o.amountVnd > 0);
  const paid30 = paid.filter((o) => o.paidAt && now.getTime() - Date.parse(o.paidAt) <= 30 * DAY_MS);
  const revenue30 = paid30.reduce((s, o) => s + o.amountVnd, 0);
  const revenueAll = paid.reduce((s, o) => s + o.amountVnd, 0);
  const pending = orders.filter((o) => o.status === 'PENDING');
  const pendingAmount = pending.reduce((s, o) => s + o.amountVnd, 0);
  const openRooms = weddingRows.filter((w) => w.lifecycle.stage >= 1 && w.lifecycle.stage <= 3 && !w.lifecycle.halted);
  const trialRooms = openRooms.filter((w) => w.lifecycle.stage === 1).length;
  const newUsers7 = users.filter((u) => now.getTime() - Date.parse(u.createdAt) <= 7 * DAY_MS).length;

  // Upcoming weddings: this week's grace rooms through the next 30 days
  const upcoming = weddingRows
    .filter((w) => w.lifecycle.stage >= 1 && w.lifecycle.stage <= 3)
    .filter((w) => {
      const d = calendarDaysFrom(w.weddingDateIso, now);
      return d >= -7 && d <= 30;
    })
    .sort((a, b) => a.weddingDateIso.localeCompare(b.weddingDateIso))
    .slice(0, 8);
  const thisWeek = upcoming.filter((w) => {
    const d = calendarDaysFrom(w.weddingDateIso, now);
    return d >= 0 && d <= 7;
  });

  const freeVouchers = vouchers.filter((v) => v.isActive && v.discountPercent >= 100 && v.usedCount < v.maxUses);

  const attention: AttentionItem[] = [];
  if (!health.bank) {
    attention.push({
      tone: 'critical',
      title: 'Chưa có tài khoản nhận tiền nâng cấp gói',
      detail: 'Khách đang không thể mua gói Hạnh Phúc hay Viên Mãn VIP.',
      href: '/admin/settings/payment',
      cta: 'Cấu hình',
    });
  }
  if (!health.sepay) {
    attention.push({
      tone: 'critical',
      title: 'Chưa có khoá SePay',
      detail: 'Chuyển khoản mua gói sẽ không được tự động xác nhận.',
      href: '/admin/settings/payment',
      cta: 'Nhập khoá',
    });
  }
  if (pending.length > 0) {
    attention.push({
      tone: 'warning',
      title: `${pending.length} đơn đang chờ thanh toán`,
      detail: `Tổng ${formatVnd(pendingAmount)}. Đơn chuyển sang đã thanh toán khi SePay xác nhận.`,
      href: '/admin/orders?status=PENDING',
      cta: 'Xem đơn',
    });
  }
  if (freeVouchers.length > 0) {
    attention.push({
      tone: 'warning',
      title: `${freeVouchers.length} mã giảm 100% đang bật`,
      detail: `${freeVouchers.map((v) => v.code).join(', ')}. Ai có mã đều kích hoạt gói miễn phí.`,
      href: '/admin/vouchers',
      cta: 'Kiểm tra',
    });
  }
  if (thisWeek.length > 0) {
    attention.push({
      tone: 'info',
      title: `${thisWeek.length} đám cưới trong 7 ngày tới`,
      detail: thisWeek.map((w) => `${w.couple} (${w.weddingDayLabel.toLowerCase()})`).join(' · '),
      href: '/admin/weddings',
      cta: 'Xem phòng',
    });
  }

  const figures: Array<{ label: string; value: string; context: string }> = [
    {
      label: 'Doanh thu 30 ngày',
      value: formatVnd(revenue30),
      context: paid30.length > 0 ? `${paid30.length} đơn đã thanh toán` : 'Chưa có đơn trả tiền trong 30 ngày',
    },
    { label: 'Tổng doanh thu', value: formatVnd(revenueAll), context: `${paid.length} đơn trả tiền` },
    {
      label: 'Đơn chờ thanh toán',
      value: `${pending.length}`,
      context: pending.length > 0 ? formatVnd(pendingAmount) : 'Không có đơn nào đang chờ',
    },
    {
      label: 'Phòng cưới đang mở',
      value: `${openRooms.length}`,
      context: `${trialRooms} dùng thử · ${openRooms.length - trialRooms} trả phí`,
    },
    { label: 'Người dùng', value: `${users.length}`, context: `${newUsers7} tài khoản mới trong 7 ngày` },
  ];

  const recentOrders = orderRows.slice(0, 5);

  return (
    <>
      <AdminPageHeader title="Tổng quan" description={formatLongDate(now)} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel title="Cần xử lý" bodyClassName="p-0">
          {attention.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="h-7 w-7 text-emerald-600" />} title="Không có việc gì cần xử lý">
              Thanh toán đã cấu hình, không có đơn chờ và không có mã miễn phí nào đang mở.
            </EmptyState>
          ) : (
            <ul>
              {attention.map((item) => (
                <li key={item.title} className="flex items-start gap-3.5 border-b border-[#F5EEE2] px-5 py-4 last:border-b-0">
                  <span className="mt-0.5 shrink-0">{ATTENTION_ICON[item.tone]}</span>
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5 sm:flex-row sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className={cx('text-sm font-semibold', item.tone === 'critical' ? 'text-rose-900' : 'text-slate-900')}>
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[13px] text-slate-600">{item.detail}</p>
                    </div>
                    <Link
                      href={item.href}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#E5D5B8] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-800 transition-colors hover:border-rose-300 hover:text-rose-800"
                    >
                      {item.cta} <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!health.r2 && (
            <p className="flex items-center gap-2 border-t border-[#F2E9DA] bg-[#FFFCF6] px-5 py-3 text-[13px] text-slate-600">
              <HardDrive aria-hidden className="h-4 w-4 shrink-0 text-slate-500" />
              Ảnh đang lưu trên ổ đĩa máy chủ.
              <Link href="/admin/settings/storage" className="font-semibold text-rose-700 hover:underline">
                Chuyển sang Cloudflare R2
              </Link>
            </p>
          )}
        </Panel>

        <Panel title="Số liệu">
          <dl className="-my-1">
            {figures.map((f) => (
              <div key={f.label} className="flex items-baseline justify-between gap-4 border-b border-[#F5EEE2] py-3 last:border-b-0">
                <div className="min-w-0">
                  <dt className="text-[13px] font-medium text-slate-700">{f.label}</dt>
                  <dd className="mt-0.5 text-xs text-slate-500">{f.context}</dd>
                </div>
                <dd className="shrink-0 font-serif text-[1.6rem] font-bold leading-none text-slate-900 [font-variant-numeric:lining-nums_tabular-nums]">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <Panel
        className="mt-5"
        title="Đám cưới sắp tới"
        description="Từ tuần vừa qua tới 30 ngày tới, kèm giai đoạn hiện tại của từng phòng."
        actions={
          <Link href="/admin/weddings" className="text-[13px] font-semibold text-rose-700 hover:underline">
            Tất cả phòng cưới
          </Link>
        }
        bodyClassName="p-0"
      >
        {upcoming.length === 0 ? (
          <EmptyState icon={<CalendarHeart className="h-7 w-7" />} title="Không có đám cưới nào trong 30 ngày tới" />
        ) : (
          <div className={tableStyles.wrap}>
            <table className={`${tableStyles.table} min-w-[720px]`}>
              <thead>
                <tr>
                  <th scope="col" className={`${tableStyles.th} ${tableStyles.stickyTh}`}>Ngày cưới</th>
                  <th scope="col" className={tableStyles.th}>Cặp đôi</th>
                  <th scope="col" className={tableStyles.th}>Gói</th>
                  <th scope="col" className={tableStyles.th}>Vòng đời</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((w) => (
                  <tr key={w.id} className={tableStyles.row}>
                    <td className={`${tableStyles.td} ${tableStyles.stickyTd} whitespace-nowrap tabular-nums`}>
                      <p className="font-semibold text-slate-900">{w.weddingDayLabel}</p>
                      <p className="text-xs text-slate-500">{w.weddingDateLabel}</p>
                    </td>
                    <td className={tableStyles.td}>
                      <Link href={`/admin/weddings/${encodeURIComponent(w.slug)}`} className="font-medium text-slate-900 hover:text-rose-700 hover:underline">
                        {w.couple}
                      </Link>
                      <p className="text-xs text-slate-500">/w/{w.slug}</p>
                    </td>
                    <td className={tableStyles.td}>
                      <TierBadge tier={w.tier} />
                    </td>
                    <td className={`${tableStyles.td} max-w-[280px]`}>
                      <LifecycleTrack view={w.lifecycle} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        className="mt-5"
        title="Đơn hàng gần đây"
        actions={
          <Link href="/admin/orders" className="text-[13px] font-semibold text-rose-700 hover:underline">
            Tất cả đơn hàng
          </Link>
        }
        bodyClassName="p-0"
      >
        {recentOrders.length === 0 ? (
          <EmptyState title="Chưa có đơn hàng nào">Đơn xuất hiện khi chủ tiệc bấm nâng cấp gói.</EmptyState>
        ) : (
          <div className={tableStyles.wrap}>
            <table className={`${tableStyles.table} min-w-[720px]`}>
              <thead>
                <tr>
                  <th scope="col" className={`${tableStyles.th} ${tableStyles.stickyTh}`}>Mã đơn</th>
                  <th scope="col" className={tableStyles.th}>Phòng cưới</th>
                  <th scope="col" className={`${tableStyles.th} text-right`}>Số tiền</th>
                  <th scope="col" className={tableStyles.th}>Trạng thái</th>
                  <th scope="col" className={tableStyles.th}>Tạo lúc</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className={tableStyles.row}>
                    <td className={`${tableStyles.td} ${tableStyles.stickyTd} whitespace-nowrap font-mono text-xs text-slate-800`}>
                      {o.orderCode}
                    </td>
                    <td className={tableStyles.td}>
                      {o.weddingSlug ? (
                        <Link
                          href={`/admin/weddings/${encodeURIComponent(o.weddingSlug)}`}
                          className="block max-w-[240px] truncate text-slate-900 hover:text-rose-700 hover:underline"
                        >
                          {o.weddingTitle}
                        </Link>
                      ) : (
                        <span className="block max-w-[240px] truncate text-slate-900">{o.weddingTitle}</span>
                      )}
                    </td>
                    <td className={`${tableStyles.td} whitespace-nowrap text-right tabular-nums text-slate-900`}>{o.amountLabel}</td>
                    <td className={tableStyles.td}>
                      <Pill tone={o.status === 'PAID' ? 'emerald' : o.status === 'PENDING' ? 'amber' : 'slate'}>
                        {ORDER_STATUS_LABELS[o.status]}
                      </Pill>
                    </td>
                    <td className={`${tableStyles.td} whitespace-nowrap tabular-nums text-slate-700`}>{o.createdLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
