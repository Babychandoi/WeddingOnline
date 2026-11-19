'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ReceiptText } from 'lucide-react';
import { formatVnd, normalizeSearch, ORDER_STATUS_LABELS } from '@/lib/adminFormat';
import type { OrderRow } from '@/lib/adminData';
import { nextSort, ResultCount, SearchField, SortHeader, type SortDir } from './controls';
import { cx, EmptyState, Panel, Pill, TierBadge, tableStyles } from './ui';

export type OrderStatusFilter = 'ALL' | OrderRow['status'];

const STATUS_TONE = { PENDING: 'amber', PAID: 'emerald', CANCELLED: 'slate' } as const;

const STATUS_TABS: Array<{ value: OrderStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: ORDER_STATUS_LABELS.PENDING },
  { value: 'PAID', label: ORDER_STATUS_LABELS.PAID },
  { value: 'CANCELLED', label: ORDER_STATUS_LABELS.CANCELLED },
];

export function AdminOrdersTable({
  rows,
  initialStatus = 'ALL',
}: {
  rows: OrderRow[];
  initialStatus?: OrderStatusFilter;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<OrderStatusFilter>(initialStatus);
  const [sort, setSort] = useState<{ key: 'created'; dir: SortDir }>({ key: 'created', dir: 'desc' });

  const counts = useMemo(() => {
    const c: Record<OrderStatusFilter, number> = { ALL: rows.length, PENDING: 0, PAID: 0, CANCELLED: 0 };
    for (const r of rows) c[r.status] += 1;
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    const q = normalizeSearch(query);
    return rows
      .filter((r) => (status === 'ALL' || r.status === status) && (!q || r.search.includes(q)))
      .sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * a.createdIso.localeCompare(b.createdIso));
  }, [rows, query, status, sort]);

  const paidTotal = shown.filter((r) => r.status === 'PAID').reduce((sum, r) => sum + r.amountVnd, 0);

  return (
    <Panel bodyClassName="p-0">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-[#F2E9DA] px-5 py-3.5">
        <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-1 rounded-lg bg-[#F7EFE2] p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={status === tab.value}
              onClick={() => setStatus(tab.value)}
              className={cx(
                'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                status === tab.value
                  ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(91,22,38,0.12)]'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs tabular-nums text-slate-500">{counts[tab.value]}</span>
            </button>
          ))}
        </div>
        <SearchField value={query} onChange={setQuery} label="Tìm đơn hàng" placeholder="Mã đơn, phòng cưới, người mua…" />
        <ResultCount shown={shown.length} total={rows.length} unit="đơn" />
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-7 w-7" />}
          title={rows.length === 0 ? 'Chưa có đơn hàng nào' : 'Không có đơn hàng nào khớp bộ lọc'}
        >
          {rows.length === 0 ? (
            'Đơn được tạo khi chủ tiệc nâng cấp gói ở bảng điều khiển phòng cưới.'
          ) : (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setStatus('ALL');
              }}
              className="font-semibold text-rose-700 hover:underline"
            >
              Xoá bộ lọc
            </button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className={tableStyles.wrap}>
            <table className={`${tableStyles.table} min-w-[980px]`}>
              <thead>
                <tr>
                  <th scope="col" className={`${tableStyles.th} ${tableStyles.stickyTh}`}>Mã đơn</th>
                  <th scope="col" className={tableStyles.th}>Phòng cưới</th>
                  <th scope="col" className={tableStyles.th}>Gói</th>
                  <th scope="col" className={`${tableStyles.th} text-right`}>Số tiền</th>
                  <th scope="col" className={tableStyles.th}>Trạng thái</th>
                  <th scope="col" className={tableStyles.th}>Người mua</th>
                  <SortHeader label="Tạo lúc" sortKey="created" sort={sort} onSort={(k) => setSort(nextSort(sort, k))} />
                  <th scope="col" className={tableStyles.th}>Thanh toán lúc</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className={tableStyles.row}>
                    <td className={`${tableStyles.td} ${tableStyles.stickyTd} whitespace-nowrap font-mono text-xs text-slate-800`}>
                      {r.orderCode}
                    </td>
                    <td className={tableStyles.td}>
                      {r.weddingSlug ? (
                        <Link
                          href={`/admin/weddings/${encodeURIComponent(r.weddingSlug)}`}
                          className="block max-w-[220px] truncate font-medium text-slate-900 hover:text-rose-700 hover:underline"
                        >
                          {r.weddingTitle}
                        </Link>
                      ) : (
                        <p className="max-w-[220px] truncate font-medium text-slate-900">{r.weddingTitle}</p>
                      )}
                      {r.weddingSlug && <p className="text-xs text-slate-500">/w/{r.weddingSlug}</p>}
                    </td>
                    <td className={tableStyles.td}>
                      <TierBadge tier={r.tier} />
                    </td>
                    <td
                      className={cx(
                        tableStyles.td,
                        'whitespace-nowrap text-right tabular-nums',
                        r.viaVoucher ? 'text-slate-600' : 'font-semibold text-slate-900'
                      )}
                    >
                      {r.amountLabel}
                    </td>
                    <td className={tableStyles.td}>
                      <Pill tone={STATUS_TONE[r.status]}>{ORDER_STATUS_LABELS[r.status]}</Pill>
                    </td>
                    <td className={tableStyles.td}>
                      <p className="max-w-[180px] truncate text-slate-800">{r.buyerName}</p>
                      {r.buyerEmail && <p className="max-w-[180px] truncate text-xs text-slate-500">{r.buyerEmail}</p>}
                    </td>
                    <td className={`${tableStyles.td} whitespace-nowrap tabular-nums text-slate-700`}>{r.createdLabel}</td>
                    <td className={`${tableStyles.td} whitespace-nowrap tabular-nums text-slate-700`}>{r.paidLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 text-[13px] text-slate-600">
            Đã thanh toán trong danh sách này:
            <span className="font-semibold tabular-nums text-slate-900">{formatVnd(paidTotal)}</span>
          </div>
        </>
      )}
    </Panel>
  );
}
