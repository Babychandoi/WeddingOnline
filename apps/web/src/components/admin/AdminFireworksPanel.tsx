import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { getFireworkPack } from '@dco/shared';
import type { FireworkOrderRecord, WeddingRecord } from '@dco/database';
import { formatDateTime, formatVnd } from '@/lib/adminFormat';
import { EmptyState, Panel, Pill, tableStyles } from './ui';

/** Fireworks guests bought in the 3D halls: revenue to the platform account */
export function AdminFireworksPanel({ orders, weddings }: { orders: FireworkOrderRecord[]; weddings: WeddingRecord[] }) {
  const weddingById = new Map(weddings.map((w) => [w.id, w]));
  const paid = orders.filter((o) => o.status === 'PAID');
  const revenue = paid.reduce((sum, o) => sum + o.amountVnd, 0);
  const shown = orders.slice(0, 60);
  return (
    <Panel
      className="mt-6"
      title="Pháo hoa trong sảnh 3D"
      description={`${paid.length} lần bắn đã thanh toán · doanh thu ${formatVnd(revenue)}`}
      bodyClassName="p-0"
    >
      {shown.length === 0 ? (
        <EmptyState title="Chưa có ai mua pháo hoa" icon={<Sparkles className="h-6 w-6" />}>
          Khách mua trong sảnh cưới 3D, chuyển khoản vào tài khoản nền tảng.
        </EmptyState>
      ) : (
        <div className={tableStyles.wrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>Mã</th>
                <th className={tableStyles.th}>Sảnh cưới</th>
                <th className={tableStyles.th}>Người mua</th>
                <th className={tableStyles.th}>Gói</th>
                <th className={`${tableStyles.th} text-right`}>Số tiền</th>
                <th className={tableStyles.th}>Trạng thái</th>
                <th className={tableStyles.th}>Tạo lúc</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => {
                const w = weddingById.get(o.weddingId);
                return (
                  <tr key={o.id} className={tableStyles.row}>
                    <td className={`${tableStyles.td} font-mono text-[12px]`}>{o.orderCode}</td>
                    <td className={tableStyles.td}>
                      {w ? (
                        <Link href={`/admin/weddings/${w.slug}`} className="font-medium text-slate-800 hover:text-rose-700">
                          {w.title}
                        </Link>
                      ) : (
                        'Phòng đã xoá'
                      )}
                    </td>
                    <td className={tableStyles.td}>{o.buyerName}</td>
                    <td className={tableStyles.td}>{getFireworkPack(o.packId)?.label ?? o.packId}</td>
                    <td className={`${tableStyles.td} text-right tabular-nums`}>{formatVnd(o.amountVnd)}</td>
                    <td className={tableStyles.td}>
                      <Pill tone={o.status === 'PAID' ? 'emerald' : o.status === 'PENDING' ? 'amber' : 'slate'}>
                        {o.status === 'PAID' ? 'Đã thanh toán' : o.status === 'PENDING' ? 'Chờ chuyển khoản' : 'Đã huỷ'}
                      </Pill>
                    </td>
                    <td className={`${tableStyles.td} whitespace-nowrap`}>{formatDateTime(o.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
