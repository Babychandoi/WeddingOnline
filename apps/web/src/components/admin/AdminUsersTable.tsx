'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Lock, LockOpen, Users } from 'lucide-react';
import { normalizeSearch, PROVIDER_LABELS } from '@/lib/adminFormat';
import type { UserRow } from '@/lib/adminData';
import { FilterSelect, nextSort, ResultCount, SearchField, SortHeader, type SortDir } from './controls';
import { cx, EmptyState, Panel, Pill, tableStyles } from './ui';

type RoleFilter = 'ALL' | 'OWNERS' | 'GUESTS';
type StatusFilter = 'ALL' | 'ACTIVE' | 'LOCKED';

const ROLE_OPTIONS: Array<{ value: RoleFilter; label: string }> = [
  { value: 'ALL', label: 'Mọi vai trò' },
  { value: 'OWNERS', label: 'Chủ tiệc' },
  { value: 'GUESTS', label: 'Chỉ là khách' },
];

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'Mọi trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'LOCKED', label: 'Đã khoá' },
];

const COLUMN_COUNT = 7;

const ERROR_COPY: Record<string, string> = {
  CANNOT_LOCK_ADMIN: 'Không thể khoá tài khoản quản trị viên.',
  USER_NOT_FOUND: 'Không tìm thấy tài khoản này nữa.',
  PLATFORM_ADMIN_ONLY: 'Tài khoản của bạn không còn quyền quản trị.',
};

export function AdminUsersTable({ rows: initialRows, initialQuery = '' }: { rows: UserRow[]; initialQuery?: string }) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState(initialQuery);
  const [role, setRole] = useState<RoleFilter>('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [sort, setSort] = useState<{ key: 'created'; dir: SortDir }>({ key: 'created', dir: 'desc' });

  const [confirmingId, setConfirmingId] = useState('');
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const reasonRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (confirmingId) reasonRef.current?.focus();
  }, [confirmingId]);

  const lockedCount = rows.filter((r) => r.isLocked).length;

  const shown = useMemo(() => {
    const q = normalizeSearch(query);
    return rows
      .filter(
        (r) =>
          (!q || r.search.includes(q)) &&
          (role === 'ALL' || (role === 'OWNERS' ? r.ownedWeddings.length > 0 : r.ownedWeddings.length === 0)) &&
          (status === 'ALL' || (status === 'LOCKED' ? r.isLocked : !r.isLocked))
      )
      .sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * a.createdIso.localeCompare(b.createdIso));
  }, [rows, query, role, status, sort]);

  const setLock = async (row: UserRow, locked: boolean, lockReason?: string) => {
    setBusyId(row.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked, reason: lockReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ tone: 'error', text: ERROR_COPY[data.error] || 'Không cập nhật được tài khoản, vui lòng thử lại.' });
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, isLocked: data.user.isLocked, lockedReason: data.user.lockedReason, lockedLabel: data.user.lockedLabel }
            : r
        )
      );
      setConfirmingId('');
      setReason('');
      setFeedback({
        tone: 'ok',
        text: locked ? `Đã khoá tài khoản ${row.displayName}.` : `Đã mở khoá tài khoản ${row.displayName}.`,
      });
    } catch {
      setFeedback({ tone: 'error', text: 'Mất kết nối tới máy chủ, vui lòng thử lại.' });
    } finally {
      setBusyId('');
    }
  };

  const cancelConfirm = () => {
    setConfirmingId('');
    setReason('');
  };

  return (
    <Panel bodyClassName="p-0">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-[#F2E9DA] px-5 py-3.5">
        <SearchField value={query} onChange={setQuery} label="Tìm người dùng" placeholder="Tên hoặc email…" />
        <FilterSelect value={role} onChange={setRole} options={ROLE_OPTIONS} label="Lọc theo vai trò" />
        <FilterSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} label="Lọc theo trạng thái" />
        {lockedCount > 0 && <Pill tone="rose">{lockedCount} đã khoá</Pill>}
        <ResultCount shown={shown.length} total={rows.length} unit="tài khoản" />
      </div>

      {feedback && (
        <p
          role={feedback.tone === 'error' ? 'alert' : 'status'}
          className={cx(
            'border-b px-5 py-2.5 text-[13px] font-medium',
            feedback.tone === 'error' ? 'border-rose-100 bg-rose-50 text-rose-800' : 'border-emerald-100 bg-emerald-50 text-emerald-800'
          )}
        >
          {feedback.text}
        </p>
      )}

      {shown.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title={rows.length === 0 ? 'Chưa có tài khoản nào' : 'Không có tài khoản nào khớp bộ lọc'}
        >
          {rows.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setRole('ALL');
                setStatus('ALL');
              }}
              className="font-semibold text-rose-700 hover:underline"
            >
              Xoá bộ lọc
            </button>
          )}
        </EmptyState>
      ) : (
        <div className={tableStyles.wrap}>
          <table className={`${tableStyles.table} min-w-[960px]`}>
            <thead>
              <tr>
                <th scope="col" className={`${tableStyles.th} ${tableStyles.stickyTh}`}>Tài khoản</th>
                <th scope="col" className={tableStyles.th}>Đăng nhập qua</th>
                <th scope="col" className={tableStyles.th}>Phòng cưới sở hữu</th>
                <th scope="col" className={`${tableStyles.th} text-right`}>Đã dự</th>
                <SortHeader label="Tham gia" sortKey="created" sort={sort} onSort={(k) => setSort(nextSort(sort, k))} />
                <th scope="col" className={tableStyles.th}>Trạng thái</th>
                <th scope="col" className={`${tableStyles.th} text-right`}>
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <React.Fragment key={r.id}>
                  <tr className={cx(tableStyles.row, r.isLocked && 'bg-[#FBF6F1]')}>
                    <td className={`${tableStyles.td} ${tableStyles.stickyTd} max-md:max-w-[180px]`}>
                      <p className={cx('max-w-[260px] truncate font-semibold', r.isLocked ? 'text-slate-500' : 'text-slate-900')}>
                        {r.displayName}
                      </p>
                      <p className="max-w-[260px] truncate text-xs text-slate-500">{r.email || 'Không có email'}</p>
                    </td>
                    <td className={tableStyles.td}>
                      <div className="flex flex-wrap gap-1">
                        {r.providers.length === 0 ? (
                          <span className="text-xs text-slate-500">—</span>
                        ) : (
                          r.providers.map((p) => (
                            <Pill key={p} tone={p === 'GOOGLE' ? 'emerald' : 'slate'}>
                              {PROVIDER_LABELS[p]}
                            </Pill>
                          ))
                        )}
                      </div>
                    </td>
                    <td className={tableStyles.td}>
                      {r.ownedWeddings.length === 0 ? (
                        <span className="text-xs text-slate-500">Không có</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {r.ownedWeddings.slice(0, 3).map((w) => (
                            <li key={w.slug}>
                              <Link
                                href={`/admin/weddings/${encodeURIComponent(w.slug)}`}
                                className="text-[13px] font-medium text-rose-700 hover:underline"
                              >
                                {w.title}
                              </Link>
                            </li>
                          ))}
                          {r.ownedWeddings.length > 3 && (
                            <li className="text-xs text-slate-500">và {r.ownedWeddings.length - 3} phòng khác</li>
                          )}
                        </ul>
                      )}
                    </td>
                    <td className={`${tableStyles.td} whitespace-nowrap text-right tabular-nums text-slate-700`}>
                      {r.membershipCount > 0 ? `${r.membershipCount} phòng` : '—'}
                    </td>
                    <td className={`${tableStyles.td} whitespace-nowrap tabular-nums text-slate-700`}>{r.createdLabel}</td>
                    <td className={tableStyles.td}>
                      {r.isLocked ? (
                        <div className="max-w-[200px]">
                          <Pill tone="rose">Đã khoá</Pill>
                          <p className="mt-1 text-xs text-slate-600">
                            Từ {r.lockedLabel || '—'}
                            {r.lockedReason && (
                              <span className="block truncate text-slate-500" title={r.lockedReason}>
                                {r.lockedReason}
                              </span>
                            )}
                          </p>
                        </div>
                      ) : (
                        <Pill tone="emerald">Hoạt động</Pill>
                      )}
                    </td>
                    <td className={`${tableStyles.td} whitespace-nowrap text-right`}>
                      {!r.lockable ? (
                        <span className="text-xs text-slate-500">Quản trị viên</span>
                      ) : r.isLocked ? (
                        <button
                          type="button"
                          onClick={() => setLock(r, false)}
                          disabled={busyId === r.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCCDB4] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-800 transition-colors hover:border-emerald-400 hover:text-emerald-800 disabled:opacity-60"
                        >
                          {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LockOpen className="h-3.5 w-3.5" />}
                          Mở khoá
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setFeedback(null);
                            setReason('');
                            setConfirmingId(confirmingId === r.id ? '' : r.id);
                          }}
                          aria-expanded={confirmingId === r.id}
                          aria-controls={`lock-confirm-${r.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCCDB4] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-800 transition-colors hover:border-rose-300 hover:text-rose-800"
                        >
                          <Lock className="h-3.5 w-3.5" /> Khoá
                        </button>
                      )}
                    </td>
                  </tr>

                  {confirmingId === r.id && (
                    <tr id={`lock-confirm-${r.id}`}>
                      <td colSpan={COLUMN_COUNT} className="border-b border-rose-100 bg-rose-50/70 p-0">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            setLock(r, true, reason);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') cancelConfirm();
                          }}
                          className="flex flex-wrap items-end gap-3 px-5 py-4 max-md:sticky max-md:left-0 max-md:max-w-[calc(100vw-34px)]"
                        >
                          <div className="min-w-[240px] flex-1">
                            <p className="text-[13px] font-semibold text-rose-900">Khoá tài khoản {r.displayName}?</p>
                            <p className="mt-0.5 text-xs text-rose-900/80">
                              Người này bị đăng xuất ngay, không đăng nhập lại được và bị mời ra khỏi mọi sảnh đang mở.
                              Phòng cưới họ sở hữu vẫn giữ nguyên. Có thể mở khoá bất cứ lúc nào.
                            </p>
                            <label htmlFor={`lock-reason-${r.id}`} className="mt-3 block text-xs font-semibold text-slate-800">
                              Lý do (không bắt buộc, chỉ quản trị viên thấy)
                            </label>
                            <input
                              id={`lock-reason-${r.id}`}
                              ref={reasonRef}
                              value={reason}
                              maxLength={200}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="VD: Spam sổ lưu bút ở nhiều phòng"
                              className="mt-1 w-full max-w-md rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={busyId === r.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-800 disabled:opacity-60"
                            >
                              {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                              Khoá tài khoản
                            </button>
                            <button
                              type="button"
                              onClick={cancelConfirm}
                              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-white hover:text-slate-900"
                            >
                              Huỷ
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
