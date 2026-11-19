'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, Loader2, Plus, TicketPercent } from 'lucide-react';
import type { PartnerVoucherRecord } from '@dco/database';
import type { WeddingTier } from '@dco/shared';
import { formatDate, normalizeSearch, TIER_LABELS } from '@/lib/adminFormat';
import { ResultCount, SearchField } from './controls';
import { cx, EmptyState, Panel, Pill, tableStyles } from './ui';

export interface VoucherRow extends PartnerVoucherRecord {
  createdLabel: string;
}

const ERROR_COPY: Record<string, string> = {
  VOUCHER_CODE_EXISTS: 'Mã này đã tồn tại, hãy chọn mã khác.',
  INVALID_VOUCHER_CODE: 'Mã cần ít nhất 4 ký tự, chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.',
  PLATFORM_ADMIN_ONLY: 'Tài khoản này không còn quyền quản trị.',
};

function suggestCode(): string {
  return `STUDIO${Math.floor(100 + Math.random() * 900)}`;
}

function UsageMeter({ used, max }: { used: number; max: number }) {
  const exhausted = used >= max;
  return (
    <span className={cx('tabular-nums', exhausted ? 'font-semibold text-amber-900' : 'text-slate-800')}>
      {used} / {max}
      {exhausted && <span className="ml-1.5 text-xs font-medium">· hết lượt</span>}
    </span>
  );
}

export function AdminVouchersClient({ initialVouchers }: { initialVouchers: VoucherRow[] }) {
  const [vouchers, setVouchers] = useState(initialVouchers);
  const [query, setQuery] = useState('');

  const [code, setCode] = useState('');
  const [studioName, setStudioName] = useState('');
  const [discountPercent, setDiscountPercent] = useState(35);
  const [targetTier, setTargetTier] = useState<'' | WeddingTier>('');
  const [maxUses, setMaxUses] = useState(30);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [formStatus, setFormStatus] = useState('');

  const [togglingCode, setTogglingCode] = useState('');
  const [tableError, setTableError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  // Random suggestion only after mount, so server and client markup match
  useEffect(() => setCode(suggestCode()), []);

  const shown = useMemo(() => {
    const q = normalizeSearch(query);
    return vouchers.filter((v) => !q || normalizeSearch(`${v.code} ${v.studioName}`).includes(q));
  }, [vouchers, query]);

  const activeFreeCodes = vouchers.filter((v) => v.isActive && v.discountPercent >= 100 && v.usedCount < v.maxUses);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError('');
    setFormStatus('');
    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, studioName, discountPercent, targetTier: targetTier || null, maxUses }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(ERROR_COPY[data.error] || 'Không phát hành được mã, vui lòng thử lại.');
        return;
      }
      const created = data.voucher as PartnerVoucherRecord;
      setVouchers((prev) => [{ ...created, createdLabel: formatDate(created.createdAt) }, ...prev]);
      setFormStatus(`Đã phát hành mã ${created.code}.`);
      setCode(suggestCode());
    } catch {
      setFormError('Mất kết nối tới máy chủ, vui lòng thử lại.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (voucher: VoucherRow) => {
    setTogglingCode(voucher.code);
    setTableError('');
    try {
      const res = await fetch('/api/vouchers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucher.code, isActive: !voucher.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTableError(ERROR_COPY[data.error] || `Không cập nhật được mã ${voucher.code}.`);
        return;
      }
      setVouchers((prev) =>
        prev.map((v) => (v.code === voucher.code ? { ...v, isActive: (data.voucher as PartnerVoucherRecord).isActive } : v))
      );
    } catch {
      setTableError('Mất kết nối tới máy chủ, vui lòng thử lại.');
    } finally {
      setTogglingCode('');
    }
  };

  const handleCopy = async (voucherCode: string) => {
    try {
      await navigator.clipboard.writeText(voucherCode);
      setCopiedCode(voucherCode);
      setTimeout(() => setCopiedCode((cur) => (cur === voucherCode ? '' : cur)), 2000);
    } catch {
      // clipboard may be blocked
    }
  };

  const inputClass =
    'w-full rounded-lg border border-[#DCCDB4] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200';

  return (
    <div className="space-y-5">
      <Panel
        title="Phát hành mã mới"
        description="Mã dành cho studio đối tác tặng cặp đôi. Mã 100% kích hoạt gói ngay, không cần chuyển khoản."
      >
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label htmlFor="voucher-studio" className="mb-1.5 block text-[13px] font-semibold text-slate-800">
              Studio đối tác
            </label>
            <input
              id="voucher-studio"
              required
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="VD: Áo Cưới Ánh Dương"
              className={inputClass}
            />
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="voucher-code" className="mb-1.5 block text-[13px] font-semibold text-slate-800">
              Mã
            </label>
            <input
              id="voucher-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              spellCheck={false}
              className={`${inputClass} font-mono uppercase`}
            />
          </div>
          <div>
            <label htmlFor="voucher-discount" className="mb-1.5 block text-[13px] font-semibold text-slate-800">
              Giảm (%)
            </label>
            <input
              id="voucher-discount"
              type="number"
              min={1}
              max={100}
              required
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className={`${inputClass} tabular-nums`}
            />
          </div>
          <div>
            <label htmlFor="voucher-tier" className="mb-1.5 block text-[13px] font-semibold text-slate-800">
              Áp dụng cho
            </label>
            <select
              id="voucher-tier"
              value={targetTier}
              onChange={(e) => setTargetTier(e.target.value as '' | WeddingTier)}
              className={inputClass}
            >
              <option value="">Mọi gói trả phí</option>
              <option value="HAPPINESS">{TIER_LABELS.HAPPINESS}</option>
              <option value="VIP_FULFILLMENT">{TIER_LABELS.VIP_FULFILLMENT}</option>
            </select>
          </div>
          <div>
            <label htmlFor="voucher-uses" className="mb-1.5 block text-[13px] font-semibold text-slate-800">
              Số lượt
            </label>
            <input
              id="voucher-uses"
              type="number"
              min={1}
              max={1000}
              required
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className={`${inputClass} tabular-nums`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-6">
            <button
              type="submit"
              disabled={creating || !code}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Phát hành mã
            </button>
            {discountPercent >= 100 && (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-900">
                <AlertTriangle aria-hidden className="h-4 w-4" /> Ai có mã này đều kích hoạt gói miễn phí.
              </span>
            )}
            <span role="status" className="text-[13px] font-medium">
              {formError ? <span className="text-rose-700">{formError}</span> : <span className="text-emerald-700">{formStatus}</span>}
            </span>
          </div>
        </form>
      </Panel>

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[#F2E9DA] px-5 py-3.5">
          <SearchField value={query} onChange={setQuery} label="Tìm mã voucher" placeholder="Mã hoặc tên studio…" />
          {activeFreeCodes.length > 0 && (
            <Pill tone="amber">{activeFreeCodes.length} mã miễn phí đang bật</Pill>
          )}
          <ResultCount shown={shown.length} total={vouchers.length} unit="mã" />
        </div>
        {tableError && (
          <p role="alert" className="border-b border-rose-100 bg-rose-50 px-5 py-2.5 text-[13px] font-medium text-rose-800">
            {tableError}
          </p>
        )}

        {shown.length === 0 ? (
          <EmptyState
            icon={<TicketPercent className="h-7 w-7" />}
            title={vouchers.length === 0 ? 'Chưa có mã nào' : 'Không có mã nào khớp từ khoá'}
          >
            {vouchers.length === 0 && 'Phát hành mã đầu tiên ở khung phía trên.'}
          </EmptyState>
        ) : (
          <div className={tableStyles.wrap}>
            <table className={`${tableStyles.table} min-w-[820px]`}>
              <thead>
                <tr>
                  <th scope="col" className={tableStyles.th}>Mã</th>
                  <th scope="col" className={tableStyles.th}>Studio</th>
                  <th scope="col" className={tableStyles.th}>Giảm</th>
                  <th scope="col" className={tableStyles.th}>Áp dụng cho</th>
                  <th scope="col" className={tableStyles.th}>Đã dùng</th>
                  <th scope="col" className={tableStyles.th}>Trạng thái</th>
                  <th scope="col" className={tableStyles.th}>Tạo ngày</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((v) => (
                  <tr key={v.id} className={cx(tableStyles.row, !v.isActive && 'text-slate-500')}>
                    <td className={tableStyles.td}>
                      <div className="flex items-center gap-1.5">
                        <span className={cx('font-mono text-xs font-semibold', v.isActive ? 'text-slate-900' : 'text-slate-500 line-through')}>
                          {v.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(v.code)}
                          aria-label={`Sao chép mã ${v.code}`}
                          className="rounded p-1 text-slate-500 transition-colors hover:bg-[#F7EEDF] hover:text-slate-900"
                        >
                          {copiedCode === v.code ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className={tableStyles.td}>
                      <span className="block max-w-[240px] truncate">{v.studioName}</span>
                    </td>
                    <td className={tableStyles.td}>
                      {v.discountPercent >= 100 ? <Pill tone="rose">100% · miễn phí</Pill> : <span className="tabular-nums">{v.discountPercent}%</span>}
                    </td>
                    <td className={tableStyles.td}>{v.targetTier ? TIER_LABELS[v.targetTier] : 'Mọi gói trả phí'}</td>
                    <td className={tableStyles.td}>
                      <UsageMeter used={v.usedCount} max={v.maxUses} />
                    </td>
                    <td className={tableStyles.td}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={v.isActive}
                        aria-label={`Mã ${v.code}: ${v.isActive ? 'đang bật' : 'đã tắt'}`}
                        disabled={togglingCode === v.code}
                        onClick={() => handleToggle(v)}
                        className="group inline-flex items-center gap-2 rounded-full disabled:opacity-60"
                      >
                        <span
                          className={cx(
                            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                            v.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                          )}
                        >
                          <span
                            className={cx(
                              'inline-block h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform',
                              v.isActive ? 'translate-x-[18px]' : 'translate-x-0.5'
                            )}
                          />
                        </span>
                        <span className={cx('text-xs font-semibold', v.isActive ? 'text-emerald-800' : 'text-slate-600')}>
                          {togglingCode === v.code ? 'Đang lưu…' : v.isActive ? 'Đang bật' : 'Đã tắt'}
                        </span>
                      </button>
                    </td>
                    <td className={`${tableStyles.td} whitespace-nowrap tabular-nums`}>{v.createdLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
