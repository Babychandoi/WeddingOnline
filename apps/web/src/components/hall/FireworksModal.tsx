'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Loader2, Sparkles, X } from 'lucide-react';
import { FIREWORK_MESSAGE_MAX, type FireworkPackId } from '@dco/shared';

interface PackOffer {
  id: FireworkPackId;
  label: string;
  tagline: string;
  priceVnd: number;
}

interface Order {
  orderCode: string;
  packId: FireworkPackId;
  amountVnd: number;
  bankAccountNo: string;
  bankAccountName: string;
  qrDataUrl: string;
}

const vnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

/** Small burst icons per pack, so the three cards read at a glance */
const PACK_ART: Record<FireworkPackId, string[]> = {
  NHO: ['#ffcf5c'],
  LON: ['#ff4d8d', '#ffcf5c', '#6fe9ff'],
  DAI_TIEC: ['#ff4d8d', '#ffcf5c', '#b98aff', '#6fe9ff', '#ff3048'],
};

function Burst({ color, x, y, r }: { color: string; x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={Math.cos(a) * r * 0.3} y1={Math.sin(a) * r * 0.3} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke={color} strokeWidth={1.6} strokeLinecap="round" />;
      })}
      <circle r={r * 0.16} fill="#fff7e0" />
    </g>
  );
}

function PackArt({ id }: { id: FireworkPackId }) {
  const colors = PACK_ART[id];
  const spots = [
    [50, 30, 18],
    [24, 40, 12],
    [76, 38, 13],
    [36, 18, 9],
    [66, 16, 10],
  ];
  return (
    <svg viewBox="0 0 100 60" className="h-14 w-full" aria-hidden="true">
      {colors.map((c, i) => (
        <Burst key={i} color={c} x={spots[i][0]} y={spots[i][1]} r={spots[i][2]} />
      ))}
      {id === 'DAI_TIEC' && <path d="M50 52c-6-4-10-7-10-11a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 4-4 7-10 11z" fill="#ff2e63" />}
    </svg>
  );
}

export function FireworksModal({
  slug,
  signedIn,
  onNeedSignIn,
  onClose,
}: {
  slug: string;
  signedIn: boolean;
  onNeedSignIn: () => void;
  onClose: () => void;
}) {
  const [packs, setPacks] = useState<PackOffer[] | null>(null);
  const [packId, setPackId] = useState<FireworkPackId>('LON');
  const [message, setMessage] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'acc' | 'code' | null>(null);
  const [expired, setExpired] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/weddings/${encodeURIComponent(slug)}/fireworks`)
      .then((r) => r.json())
      .then((d) => setPacks(d.packs ?? []))
      .catch(() => setError('Không tải được danh sách pháo hoa'));
  }, [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    dialog.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Wait for the transfer: SePay tells the server, the server tells us
  useEffect(() => {
    if (!order || paid) return;
    const started = Date.now();
    const timer = window.setInterval(async () => {
      if (Date.now() - started > 15 * 60 * 1000) {
        setExpired(true);
        window.clearInterval(timer);
        return;
      }
      try {
        const r = await fetch(`/api/fireworks/${order.orderCode}`, { cache: 'no-store' });
        const d = await r.json();
        if (d.status === 'PAID') setPaid(true);
      } catch {
        /* try again on the next tick */
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [order, paid]);

  useEffect(() => {
    if (!paid) return;
    const t = window.setTimeout(onClose, 2600);
    return () => window.clearTimeout(t);
  }, [paid, onClose]);

  const buy = async () => {
    if (!signedIn) return onNeedSignIn();
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/weddings/${encodeURIComponent(slug)}/fireworks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, message }),
      });
      const d = await r.json();
      if (r.status === 401) return onNeedSignIn();
      if (!r.ok) throw new Error(d.message || 'Không tạo được đơn pháo hoa');
      setOrder(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được đơn pháo hoa');
    } finally {
      setBusy(false);
    }
  };

  const simulate = async () => {
    if (!order) return;
    setBusy(true);
    try {
      const r = await fetch('/api/dev/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: order.orderCode, amountVnd: order.amountVnd }),
      });
      const d = await r.json();
      if (r.ok && d.ok) setPaid(true);
      else setError(d.reason || d.error || 'Chưa xác nhận được');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (what: 'acc' | 'code', text: string) => {
    await navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopied(what);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const chosen = packs?.find((p) => p.id === packId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fw-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-gradient-to-b from-[#1d1030] via-[#2b1336] to-[#3a1630] p-5 text-amber-50 shadow-2xl outline-none sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="fw-title" className="flex items-center gap-2 text-[18px] font-bold">
              <Sparkles className="h-5 w-5 text-amber-300" /> Bắn pháo hoa chúc mừng
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-amber-100/75">
              Pháo hoa bắn trên trời sảnh cưới, mọi khách trong sảnh đều thấy, kèm tên và lời chúc của bạn.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-amber-100/70 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {paid ? (
          <div className="py-10 text-center" role="status">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-400">
              <Check className="h-8 w-8 text-emerald-300" />
            </div>
            <p className="mt-4 text-[17px] font-bold">Đã nhận tiền. Pháo hoa sắp bắn!</p>
            <p className="mt-1 text-[13.5px] text-amber-100/75">Nhìn lên trời phía sân khấu nhé.</p>
          </div>
        ) : order ? (
          <div className="mt-4">
            <div className="rounded-2xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={order.qrDataUrl} alt={`Mã VietQR chuyển ${vnd(order.amountVnd)}`} className="mx-auto aspect-square w-full max-w-[240px]" />
            </div>
            <dl className="mt-3 space-y-1.5 text-[13.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-amber-100/70">Số tiền</dt>
                <dd className="font-bold tabular-nums text-amber-200">{vnd(order.amountVnd)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-amber-100/70">Tài khoản</dt>
                <dd className="flex items-center gap-1.5 text-right">
                  <span className="tabular-nums">{order.bankAccountNo}</span>
                  <button type="button" onClick={() => copy('acc', order.bankAccountNo)} aria-label="Chép số tài khoản" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10">
                    {copied === 'acc' ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                  </button>
                </dd>
              </div>
              {order.bankAccountName && (
                <div className="flex justify-between gap-3">
                  <dt className="text-amber-100/70">Chủ tài khoản</dt>
                  <dd className="text-right">{order.bankAccountName}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-amber-100/70">Nội dung</dt>
                <dd className="flex items-center gap-1.5">
                  <code className="rounded-md bg-white/10 px-2 py-0.5 font-bold tracking-wider text-amber-200">{order.orderCode}</code>
                  <button type="button" onClick={() => copy('code', order.orderCode)} aria-label="Chép nội dung chuyển khoản" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10">
                    {copied === 'code' ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                  </button>
                </dd>
              </div>
            </dl>
            <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-[13px] text-amber-100/85" role="status">
              {expired ? (
                'Đã quá 15 phút chưa thấy tiền về. Nếu bạn đã chuyển, pháo hoa vẫn bắn khi ngân hàng báo về.'
              ) : (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang chờ tiền về, pháo hoa bắn ngay khi nhận được
                </>
              )}
            </p>
            {process.env.NODE_ENV !== 'production' && (
              <button type="button" onClick={simulate} disabled={busy} className="mt-2 w-full rounded-xl border border-dashed border-amber-300/50 py-2 text-[12.5px] font-semibold text-amber-200 hover:bg-white/5 disabled:opacity-50">
                Giả lập đã chuyển khoản (chỉ có khi chạy thử)
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4">
            {!packs ? (
              <div className="grid h-40 place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-amber-200" />
              </div>
            ) : (
              <div role="radiogroup" aria-label="Chọn gói pháo hoa" className="grid gap-2.5">
                {packs.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={packId === p.id}
                    onClick={() => setPackId(p.id)}
                    className={`grid grid-cols-[88px_1fr_auto] items-center gap-3 rounded-2xl p-2.5 text-left transition ${
                      packId === p.id ? 'bg-white/15 ring-2 ring-amber-300' : 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="rounded-xl bg-[#0d0716] px-1">
                      <PackArt id={p.id} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-bold">{p.label}</span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-amber-100/70">{p.tagline}</span>
                    </span>
                    <span className="text-[14px] font-bold tabular-nums text-amber-200">{vnd(p.priceVnd)}</span>
                  </button>
                ))}
              </div>
            )}

            <label htmlFor="fw-message" className="mt-4 block text-[13px] font-semibold text-amber-100/85">
              Lời chúc kèm theo
            </label>
            <input
              id="fw-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={FIREWORK_MESSAGE_MAX}
              placeholder="Chúc hai bạn trăm năm hạnh phúc!"
              className="mt-1.5 min-h-[46px] w-full rounded-xl border border-white/15 bg-white/10 px-3.5 text-[15px] text-white outline-none placeholder:text-amber-100/40 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/30"
            />

            {error && (
              <p role="alert" className="mt-3 rounded-xl bg-rose-500/15 px-3 py-2 text-[13px] text-rose-200">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={buy}
              disabled={busy || !chosen}
              className="mt-4 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-400 text-[15.5px] font-bold text-[#2a1236] shadow-lg transition hover:brightness-105 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {signedIn ? `Thanh toán ${chosen ? vnd(chosen.priceVnd) : ''}` : 'Đăng nhập để mua pháo hoa'}
            </button>
            <p className="mt-2 text-center text-[11.5px] leading-relaxed text-amber-100/55">
              Chuyển khoản qua VietQR tới tài khoản DamCuoiOnline. Pháo hoa bắn tự động khi tiền về.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
