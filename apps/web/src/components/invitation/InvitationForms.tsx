'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Gift, Loader2, Minus, Plus, Send } from 'lucide-react';
import type { InvitationWish } from '@/app/api/invitations/[slug]/wishes/route';
import { formatVnd } from './format';

type Side = 'GROOM_SIDE' | 'BRIDE_SIDE' | 'FRIEND' | 'COLLEAGUE';
const SIDE_OPTIONS: Array<{ value: Side; label: string }> = [
  { value: 'GROOM_SIDE', label: 'Nhà trai' },
  { value: 'BRIDE_SIDE', label: 'Nhà gái' },
  { value: 'FRIEND', label: 'Bạn bè' },
  { value: 'COLLEAGUE', label: 'Đồng nghiệp' },
];
const SIDE_LABEL: Record<Side, string> = { GROOM_SIDE: 'Nhà trai', BRIDE_SIDE: 'Nhà gái', FRIEND: 'Bạn bè', COLLEAGUE: 'Đồng nghiệp' };

export const fieldClass =
  'w-full rounded-[var(--inv-r)] border border-[color:var(--inv-line)] bg-[var(--inv-panel)] px-4 py-3 text-[16px] text-[color:var(--inv-ink)] placeholder:text-[color:var(--inv-ink-soft)] placeholder:opacity-80 outline-none transition focus:border-[color:var(--inv-accent)] focus:ring-1 focus:ring-[color:var(--inv-accent)]';
export const primaryButton =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--inv-btn-r)] bg-[var(--inv-accent)] px-7 text-[15px] font-semibold text-[color:var(--inv-on-accent)] shadow-[var(--inv-btn-shadow)] transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55';
const labelClass = 'mb-1.5 block text-[14px] font-medium text-[color:var(--inv-ink-soft)]';

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className={labelClass}>
      {children}
    </label>
  );
}

async function postJson<T>(url: string, body: unknown): Promise<{ ok: boolean; data: T & { message?: string } }> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  return { ok: res.ok, data };
}

/* ───────────────────────── RSVP ───────────────────────── */

export function RsvpForm({ slug, demo, guestName, deadline }: { slug: string; demo: boolean; guestName: string; deadline: string }) {
  const [name, setName] = useState(guestName);
  const [attending, setAttending] = useState<boolean | null>(null);
  const [count, setCount] = useState(1);
  const [side, setSide] = useState<Side>('FRIEND');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | boolean>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Bạn nhập tên giúp mình nhé.');
    if (attending === null) return setError('Bạn chọn có đến được không nhé.');
    setBusy(true);
    if (demo) {
      await new Promise((r) => setTimeout(r, 500));
      setBusy(false);
      return setDone(attending);
    }
    const { ok, data } = await postJson<{ attending: boolean }>(`/api/invitations/${slug}/rsvp`, {
      guestName: name,
      attending,
      headcount: count,
      side,
      phone,
      note,
    });
    setBusy(false);
    if (!ok) return setError(data.message || 'Chưa gửi được, bạn thử lại nhé.');
    setDone(attending);
  }

  if (done !== null) {
    return (
      <div className="rounded-[var(--inv-r)] border border-[color:var(--inv-line)] bg-[var(--inv-panel)] px-6 py-8 text-center" role="status">
        <Check className="mx-auto h-9 w-9 text-[color:var(--inv-accent-text)]" />
        <p className="mt-3 text-[18px] font-semibold">{done ? 'Cảm ơn bạn! Hẹn gặp bạn trong ngày vui.' : 'Cảm ơn bạn đã báo. Cô dâu chú rể sẽ nhớ đến bạn.'}</p>
        {demo && <p className="mt-2 text-[14px] text-[color:var(--inv-ink-soft)]">Thiệp mẫu: câu trả lời không được gửi đi.</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-left" noValidate>
      <div>
        <Label htmlFor="rsvp-name">Tên của bạn</Label>
        <input id="rsvp-name" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
      </div>
      <div role="radiogroup" aria-label="Bạn có đến được không" className="grid grid-cols-2 gap-3">
        {[
          { v: true, label: 'Mình sẽ đến' },
          { v: false, label: 'Tiếc quá, bận rồi' },
        ].map((o) => (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={attending === o.v}
            onClick={() => setAttending(o.v)}
            className={`min-h-[52px] rounded-[var(--inv-r)] border px-2 text-[15px] font-semibold leading-tight transition ${
              attending === o.v
                ? 'border-[color:var(--inv-accent)] bg-[var(--inv-accent)] text-[color:var(--inv-on-accent)]'
                : 'border-[color:var(--inv-line)] bg-[var(--inv-panel)] text-[color:var(--inv-ink)] hover:border-[color:var(--inv-accent)]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {attending && (
        <div className="flex items-center justify-between rounded-[var(--inv-r)] border border-[color:var(--inv-line)] bg-[var(--inv-panel)] px-4 py-2.5">
          <span className="text-[15px]">Số người đi cùng (kể cả bạn)</span>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Bớt một người" onClick={() => setCount((c) => Math.max(1, c - 1))} className="grid h-11 w-11 place-items-center rounded-full border border-[color:var(--inv-line)] hover:border-[color:var(--inv-accent)]">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-[18px] font-semibold tabular-nums" aria-live="polite">
              {count}
            </span>
            <button type="button" aria-label="Thêm một người" onClick={() => setCount((c) => Math.min(10, c + 1))} className="grid h-11 w-11 place-items-center rounded-full border border-[color:var(--inv-line)] hover:border-[color:var(--inv-accent)]">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="rsvp-side">Bạn là khách của</Label>
          <select id="rsvp-side" className={fieldClass} value={side} onChange={(e) => setSide(e.target.value as Side)}>
            {SIDE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="rsvp-phone">Số điện thoại</Label>
          <input id="rsvp-phone" className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="Không bắt buộc" maxLength={20} />
        </div>
      </div>
      <div>
        <Label htmlFor="rsvp-note">Nhắn cô dâu chú rể</Label>
        <input id="rsvp-note" className={fieldClass} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Ví dụ: mình ăn chay" />
      </div>
      {error && (
        <p className="text-[14px] font-medium text-[color:var(--inv-accent-text)]" role="alert">
          {error}
        </p>
      )}
      <div className="pt-1 text-center">
        <button type="submit" className={primaryButton} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gửi xác nhận
        </button>
        {deadline && <p className="mt-3 text-[14px] text-[color:var(--inv-ink-soft)]">Vui lòng xác nhận trước {deadline}</p>}
      </div>
    </form>
  );
}

/* ───────────────────────── Wishes ───────────────────────── */

export function WishesSection({ slug, demo, guestName, initial }: { slug: string; demo: boolean; guestName: string; initial: InvitationWish[] }) {
  const [wishes, setWishes] = useState(initial);
  const [name, setName] = useState(guestName);
  const [message, setMessage] = useState('');
  const [side, setSide] = useState<Side>('FRIEND');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shown, setShown] = useState(12);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Bạn cho cô dâu chú rể biết tên nhé.');
    if (message.trim().length < 2) return setError('Lời chúc còn trống.');
    setBusy(true);
    if (demo) {
      await new Promise((r) => setTimeout(r, 400));
      setWishes((w) => [{ id: `demo_${Date.now()}`, name: name.trim(), side, message: message.trim(), createdAt: new Date().toISOString(), withGift: false }, ...w]);
      setMessage('');
      return setBusy(false);
    }
    const { ok, data } = await postJson<{ wish: InvitationWish }>(`/api/invitations/${slug}/wishes`, { name, message, side });
    setBusy(false);
    if (!ok) return setError(data.message || 'Chưa gửi được, bạn thử lại nhé.');
    setWishes((w) => [data.wish, ...w]);
    setMessage('');
  }

  return (
    <div className="text-left">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <Label htmlFor="wish-name">Tên của bạn</Label>
            <input id="wish-name" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" />
          </div>
          <div>
            <Label htmlFor="wish-side">Khách của</Label>
            <select id="wish-side" className={fieldClass} value={side} onChange={(e) => setSide(e.target.value as Side)}>
              {SIDE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="wish-message">Lời chúc</Label>
          <textarea id="wish-message" className={`${fieldClass} min-h-[110px] resize-y`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="Chúc hai bạn trăm năm hạnh phúc…" />
        </div>
        {error && (
          <p className="text-[14px] font-medium text-[color:var(--inv-accent-text)]" role="alert">
            {error}
          </p>
        )}
        <div className="text-center">
          <button type="submit" className={primaryButton} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gửi lời chúc
          </button>
        </div>
      </form>

      <ul className="mt-8 space-y-3" aria-label="Lời chúc của mọi người">
        {wishes.length === 0 && <li className="py-6 text-center text-[15px] text-[color:var(--inv-ink-soft)]">Chưa có lời chúc nào. Bạn hãy là người đầu tiên!</li>}
        {wishes.slice(0, shown).map((w) => (
          <li key={w.id} className="rounded-[var(--inv-r)] border border-[color:var(--inv-line)] bg-[var(--inv-panel)] px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[15px] font-semibold">
                {w.name}
                {w.side && <span className="ml-2 text-[13px] font-normal text-[color:var(--inv-ink-soft)]">{SIDE_LABEL[w.side]}</span>}
              </p>
              {w.withGift && (
                <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-[color:var(--inv-accent-text)]">
                  <Gift className="h-3.5 w-3.5" /> Đã gửi mừng
                </span>
              )}
            </div>
            <p className="mt-1.5 whitespace-pre-line break-words text-[15px] leading-relaxed">{w.message}</p>
          </li>
        ))}
      </ul>
      {wishes.length > shown && (
        <div className="mt-4 text-center">
          <button type="button" onClick={() => setShown((s) => s + 12)} className="text-[15px] font-semibold text-[color:var(--inv-accent-text)] underline underline-offset-4">
            Xem thêm lời chúc ({wishes.length - shown})
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Gift ───────────────────────── */

interface GiftQr {
  intentId: string;
  transferCode: string;
  bankAccountNo: string;
  bankAccountName: string | null;
  qrDataUrl: string;
}

const AMOUNTS = [200_000, 500_000, 1_000_000, 2_000_000];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
      className="inline-flex min-h-[40px] items-center gap-1 rounded-[var(--inv-btn-r)] border border-[color:var(--inv-line)] px-3 text-[13px] font-semibold hover:border-[color:var(--inv-accent)]"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Đã chép' : 'Chép'}
    </button>
  );
}

export function GiftBox({ slug, demo, guestName, bankName }: { slug: string; demo: boolean; guestName: string; bankName: string | null }) {
  const [name, setName] = useState(guestName);
  const [wish, setWish] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [qr, setQr] = useState<GiftQr | null>(null);
  const [status, setStatus] = useState<'PENDING' | 'VERIFIED' | 'EXPIRED'>('PENDING');
  const polls = useRef(0);

  useEffect(() => {
    if (!qr || status !== 'PENDING') return;
    const t = setInterval(async () => {
      polls.current += 1;
      if (polls.current > 300) return clearInterval(t); // ~20 minutes
      const res = await fetch(`/api/invitations/${slug}/gift/${qr.intentId}`, { cache: 'no-store' }).catch(() => null);
      if (!res?.ok) return;
      const data = (await res.json()) as { status: typeof status };
      if (data.status !== 'PENDING') setStatus(data.status);
    }, 4000);
    return () => clearInterval(t);
  }, [qr, status, slug]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (demo) return setError('Đây là thiệp mẫu nên chưa có tài khoản nhận mừng thật.');
    if (name.trim().length < 2) return setError('Bạn nhập tên để cô dâu chú rể biết ai gửi lời mừng nhé.');
    setBusy(true);
    const { ok, data } = await postJson<GiftQr>(`/api/invitations/${slug}/gift`, { name, wish, amountVnd: amount ?? undefined });
    setBusy(false);
    if (!ok) return setError(data.message || 'Chưa tạo được mã, bạn thử lại nhé.');
    polls.current = 0;
    setStatus('PENDING');
    setQr(data);
  }

  if (qr) {
    if (status === 'VERIFIED') {
      return (
        <div className="rounded-[var(--inv-r)] border border-[color:var(--inv-line)] bg-[var(--inv-panel)] px-6 py-8 text-center" role="status">
          <Gift className="mx-auto h-10 w-10 text-[color:var(--inv-accent-text)]" />
          <p className="mt-3 text-[18px] font-semibold">Cô dâu chú rể đã nhận được lời mừng của bạn.</p>
          <p className="mt-1 text-[15px] text-[color:var(--inv-ink-soft)]">Lời chúc của bạn đã lên bức tường lời chúc. Cảm ơn bạn!</p>
        </div>
      );
    }
    return (
      <div className="rounded-[var(--inv-r)] border border-[color:var(--inv-line)] bg-[var(--inv-panel)] px-5 py-6 text-center">
        <img src={qr.qrDataUrl} alt="Mã VietQR mừng cưới" className="mx-auto h-56 w-56 rounded-[var(--inv-r)] bg-white p-2" />
        <p className="mt-3 text-[14px] text-[color:var(--inv-ink-soft)]">Mở ứng dụng ngân hàng và quét mã. Nội dung chuyển khoản đã có sẵn trong mã.</p>
        <dl className="mx-auto mt-5 max-w-sm space-y-2.5 text-left text-[15px]">
          {bankName && (
            <div className="flex justify-between gap-3">
              <dt className="text-[color:var(--inv-ink-soft)]">Ngân hàng</dt>
              <dd className="font-semibold">{bankName}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[color:var(--inv-ink-soft)]">Số tài khoản</dt>
            <dd className="flex items-center gap-2 font-semibold tabular-nums">
              {qr.bankAccountNo} <CopyButton value={qr.bankAccountNo} label="Chép số tài khoản" />
            </dd>
          </div>
          {qr.bankAccountName && (
            <div className="flex justify-between gap-3">
              <dt className="text-[color:var(--inv-ink-soft)]">Chủ tài khoản</dt>
              <dd className="text-right font-semibold uppercase">{qr.bankAccountName}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[color:var(--inv-ink-soft)]">Nội dung</dt>
            <dd className="flex items-center gap-2 font-semibold tabular-nums">
              {qr.transferCode} <CopyButton value={qr.transferCode} label="Chép nội dung chuyển khoản" />
            </dd>
          </div>
        </dl>
        <p className="mt-5 inline-flex items-center gap-2 text-[14px] text-[color:var(--inv-ink-soft)]" role="status">
          {status === 'EXPIRED' ? (
            'Mã này đã hết hạn. Bạn tạo mã mới nhé.'
          ) : (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Đang chờ ngân hàng xác nhận…
            </>
          )}
        </p>
        <p className="mt-2 text-[13px] text-[color:var(--inv-ink-soft)]">Giữ đúng nội dung chuyển khoản để hệ thống nhận ra lời mừng của bạn.</p>
      </div>
    );
  }

  return (
    <form onSubmit={create} className="space-y-4 text-left" noValidate>
      <div>
        <Label htmlFor="gift-name">Tên người gửi</Label>
        <input id="gift-name" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" />
      </div>
      <div>
        <Label htmlFor="gift-wish">Lời chúc gửi kèm</Label>
        <input id="gift-wish" className={fieldClass} value={wish} onChange={(e) => setWish(e.target.value)} maxLength={280} placeholder="Chúc hai bạn trăm năm hạnh phúc!" />
      </div>
      <fieldset>
        <legend className={labelClass}>Số tiền gợi ý (có thể sửa trong ứng dụng ngân hàng)</legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={amount === a}
              onClick={() => setAmount(amount === a ? null : a)}
              className={`min-h-[46px] rounded-[var(--inv-r)] border text-[15px] font-semibold tabular-nums transition ${
                amount === a ? 'border-[color:var(--inv-accent)] bg-[var(--inv-accent)] text-[color:var(--inv-on-accent)]' : 'border-[color:var(--inv-line)] bg-[var(--inv-panel)] hover:border-[color:var(--inv-accent)]'
              }`}
            >
              {formatVnd(a)}
            </button>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="text-[14px] font-medium text-[color:var(--inv-accent-text)]" role="alert">
          {error}
        </p>
      )}
      <div className="text-center">
        <button type="submit" className={primaryButton} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />} Tạo mã QR mừng cưới
        </button>
        <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--inv-ink-soft)]">
          Tiền chuyển thẳng vào tài khoản của cô dâu chú rể. Số tiền không hiển thị công khai ở bất kỳ đâu.
        </p>
      </div>
    </form>
  );
}
