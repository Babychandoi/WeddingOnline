'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Gift, HeartHandshake, Loader2, Minus, Plus, Send, X } from 'lucide-react';
import type { InvitationWish } from '@/app/api/invitations/[slug]/wishes/route';
import { WishesHeart3D } from '@/components/motion/InvitationDelight';
import { formatVnd } from './format';

type Side = 'GROOM_SIDE' | 'BRIDE_SIDE' | 'FRIEND' | 'COLLEAGUE';
const SIDE_OPTIONS: Array<{ value: Side; label: string }> = [
  { value: 'GROOM_SIDE', label: 'Nhà trai' },
  { value: 'BRIDE_SIDE', label: 'Nhà gái' },
  { value: 'FRIEND', label: 'Bạn bè' },
  { value: 'COLLEAGUE', label: 'Đồng nghiệp' },
];
const SIDE_LABEL: Record<Side, string> = { GROOM_SIDE: 'Nhà trai', BRIDE_SIDE: 'Nhà gái', FRIEND: 'Bạn bè', COLLEAGUE: 'Đồng nghiệp' };

/** Field look comes from the template's skin (underline, soft, boxed); see formSkinCss */
export const fieldClass = 'inv-field';
export const primaryButton =
  'inv-btn-metal relative isolate overflow-hidden inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--inv-btn-r)] bg-[var(--inv-accent)] px-7 text-[15px] font-semibold text-[color:var(--inv-on-accent)] shadow-[var(--inv-btn-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-px active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55';
const labelClass = 'inv-label';

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className={labelClass}>
      {children}
    </label>
  );
}

/** Whose guest: a row of chips, one tap, no dropdown */
function SideChips({ id, value, onChange, label }: { id: string; value: Side; onChange: (s: Side) => void; label: string }) {
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`} className={labelClass}>
        {label}
      </span>
      <div className="grid grid-cols-2 gap-2 min-[460px]:grid-cols-4">
        {SIDE_OPTIONS.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className="inv-chip justify-center">
            {o.label}
          </button>
        ))}
      </div>
    </div>
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
      <div className="inv-card px-6 py-9 text-center" role="status">
        <Check className="mx-auto h-9 w-9 text-[color:var(--inv-accent-text)]" />
        <p className="mt-3 text-[18px] font-semibold">{done ? 'Cảm ơn bạn! Hẹn gặp bạn trong ngày vui.' : 'Cảm ơn bạn đã báo. Cô dâu chú rể sẽ nhớ đến bạn.'}</p>
        {demo && <p className="mt-2 text-[14px] text-[color:var(--inv-ink-soft)]">Thiệp mẫu: câu trả lời không được gửi đi.</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="inv-form space-y-5 text-left" noValidate>
      <div>
        <Label htmlFor="rsvp-name">Tên của bạn</Label>
        <input id="rsvp-name" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
      </div>
      <div role="radiogroup" aria-label="Bạn có đến được không" className="grid grid-cols-2 gap-3">
        {[
          { v: true, label: 'Mình sẽ đến', sub: 'Chắc chắn có mặt', Icon: HeartHandshake },
          { v: false, label: 'Tiếc quá', sub: 'Mình bận mất rồi', Icon: X },
        ].map((o) => (
          <button key={String(o.v)} type="button" role="radio" aria-checked={attending === o.v} onClick={() => setAttending(o.v)} className="inv-choice">
            <o.Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 text-left">
              <span className="block text-[15px] font-semibold leading-tight">{o.label}</span>
              <span className="mt-0.5 block text-[12.5px] leading-tight opacity-75">{o.sub}</span>
            </span>
          </button>
        ))}
      </div>
      {attending && (
        <div className="inv-row flex items-center justify-between gap-3">
          <span className="text-[15px]">Số người đi cùng (kể cả bạn)</span>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Bớt một người" onClick={() => setCount((c) => Math.max(1, c - 1))} className="inv-step">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-[18px] font-semibold tabular-nums" aria-live="polite">
              {count}
            </span>
            <button type="button" aria-label="Thêm một người" onClick={() => setCount((c) => Math.min(10, c + 1))} className="inv-step">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <SideChips id="rsvp-side" value={side} onChange={setSide} label="Bạn là khách của" />
      <div>
        <Label htmlFor="rsvp-phone">Số điện thoại</Label>
        <input id="rsvp-phone" className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="Không bắt buộc" maxLength={20} />
      </div>
      <div>
        <Label htmlFor="rsvp-note">Nhắn cô dâu chú rể</Label>
        <textarea id="rsvp-note" rows={2} className={`${fieldClass} resize-none`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Ví dụ: mình ăn chay, đi cùng em bé…" />
      </div>
      {error && (
        <p className="text-[14px] font-medium text-[color:var(--inv-accent-text)]" role="alert">
          {error}
        </p>
      )}
      <div className="pt-1 text-center">
        <button type="submit" className={`${primaryButton} inv-quench`} data-sending={busy ? 'true' : undefined} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gửi xác nhận
        </button>
        {deadline && <p className="mt-3 text-[14px] text-[color:var(--inv-ink-soft)]">Vui lòng xác nhận trước {deadline}</p>}
      </div>
    </form>
  );
}

/* ───────────────────────── Wishes ───────────────────────── */

export function WishesSection({
  slug,
  demo,
  guestName,
  initial,
  coupleName,
  showHeart3D = false,
  themeColors,
}: {
  slug: string;
  demo: boolean;
  guestName: string;
  initial: InvitationWish[];
  coupleName?: string;
  showHeart3D?: boolean;
  themeColors?: { accent: string; line: string; paper: string; ink: string };
}) {
  const [wishes, setWishes] = useState(initial);
  const [name, setName] = useState(guestName);
  const [message, setMessage] = useState('');
  const [side, setSide] = useState<Side>('FRIEND');
  const [busy, setBusy] = useState(false);
  const [launched, setLaunched] = useState(false);
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
      setBusy(false);
      setLaunched(true);
      window.setTimeout(() => setLaunched(false), 2200);
      return;
    }
    const { ok, data } = await postJson<{ wish: InvitationWish }>(`/api/invitations/${slug}/wishes`, { name, message, side });
    setBusy(false);
    if (!ok) return setError(data.message || 'Chưa gửi được, bạn thử lại nhé.');
    setWishes((w) => [data.wish, ...w]);
    setMessage('');
    setLaunched(true);
    window.setTimeout(() => setLaunched(false), 2200);
  }

  return (
    <div className="text-left">
      {showHeart3D && (
        <WishesHeart3D
          wishes={wishes.map((w) => ({ id: w.id, name: w.name, message: w.message }))}
          coupleName={coupleName || 'Cô Dâu & Chú Rể'}
          accent={themeColors?.accent}
          line={themeColors?.line}
          paper={themeColors?.paper}
          ink={themeColors?.ink}
        />
      )}
      <form onSubmit={submit} className="inv-form space-y-5" noValidate>
        <div>
          <Label htmlFor="wish-name">Tên của bạn</Label>
          <input id="wish-name" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" />
        </div>
        <SideChips id="wish-side" value={side} onChange={setSide} label="Bạn là khách của" />
        <div>
          <Label htmlFor="wish-message">Lời chúc</Label>
          <textarea id="wish-message" rows={4} className={`${fieldClass} min-h-[120px] resize-y`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="Chúc hai bạn trăm năm hạnh phúc…" />
        </div>
        {error && (
          <p className="text-[14px] font-medium text-[color:var(--inv-accent-text)]" role="alert">
            {error}
          </p>
        )}
        <div className="text-center">
          <button type="submit" className={`${primaryButton} inv-dart-btn`} data-launched={launched ? 'true' : undefined} disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : launched ? (
              <Check className="h-4 w-4" />
            ) : (
              <Send className="inv-plane h-4 w-4" />
            )}
            <span>{launched ? 'Đã bay vào trái tim lời chúc!' : 'Gửi lời chúc'}</span>
          </button>
        </div>
      </form>

      <ul className="inv-wishes mt-10" aria-label="Lời chúc của mọi người">
        {wishes.length === 0 && <li className="py-6 text-center text-[15px] text-[color:var(--inv-ink-soft)]">Chưa có lời chúc nào. Bạn hãy là người đầu tiên!</li>}
        {wishes.slice(0, shown).map((w) => (
          <li key={w.id} className="inv-wish">
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
      className="inv-chip !min-h-[38px] !px-3 text-[13px]"
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
        <div className="inv-card px-6 py-9 text-center" role="status">
          <Gift className="mx-auto h-10 w-10 text-[color:var(--inv-accent-text)]" />
          <p className="mt-3 text-[18px] font-semibold">Cô dâu chú rể đã nhận được lời mừng của bạn.</p>
          <p className="mt-1 text-[15px] text-[color:var(--inv-ink-soft)]">Lời chúc của bạn đã lên bức tường lời chúc. Cảm ơn bạn!</p>
        </div>
      );
    }
    return (
      <div className="inv-card px-5 py-7 text-center">
        <img src={qr.qrDataUrl} alt="Mã VietQR mừng cưới" width={224} height={224} className="mx-auto h-56 w-56 rounded-[var(--inv-r)] bg-white p-2" />
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
    <form onSubmit={create} className="inv-form space-y-5 text-left" noValidate>
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
        <div className="grid grid-cols-2 gap-2 min-[460px]:grid-cols-4">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={amount === a}
              onClick={() => setAmount(amount === a ? null : a)}
              className="inv-chip justify-center tabular-nums"
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

/* ───────────────────────── Skins ───────────────────────── */

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5l5-5' fill='none' stroke='%23888' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

/**
 * Form look per template. "line": underlined fields, editorial (square templates); "soft": white
 * pillowy fields with a glow on focus (romantic templates); "box": quiet framed fields.
 * Field colours are mixed from the theme so nothing is drawn in full-strength ink.
 */
export const formSkinCss = `
.inv-root .inv-label { display:block; margin-bottom:8px; font-size:13.5px; font-weight:500; color:var(--inv-ink-soft); }
.inv-root .inv-field { display:block; width:100%; min-height:52px; font:inherit; font-size:16px; line-height:1.45; color:var(--inv-ink); outline:none; -webkit-appearance:none; appearance:none;
  background:var(--inv-field-bg); border:1px solid var(--inv-field-line); border-radius:var(--inv-field-r); padding:13px 16px;
  transition:border-color .2s, box-shadow .2s, background-color .2s; }
.inv-root .inv-field::placeholder { color:var(--inv-ink-soft); opacity:.62; }
.inv-root .inv-field:hover { border-color:color-mix(in srgb, var(--inv-accent) 45%, var(--inv-field-line)); }
.inv-root .inv-field:focus { border-color:var(--inv-accent); box-shadow:0 0 0 4px color-mix(in srgb, var(--inv-accent) 15%, transparent); }
.inv-root select.inv-field { background-image:${CHEVRON}; background-repeat:no-repeat; background-position:right 16px center; padding-right:42px; }

.inv-root .inv-choice { position:relative; overflow:hidden; isolation:isolate; display:flex; align-items:center; gap:12px; min-height:64px; padding:12px 14px; text-align:left; color:var(--inv-ink);
  background:var(--inv-field-bg); border:1px solid var(--inv-field-line); border-radius:var(--inv-field-r); transition:all .28s cubic-bezier(0.22,1,0.36,1); }
.inv-root .inv-choice::after { content:""; position:absolute; inset:0; z-index:-1; pointer-events:none;
  background:linear-gradient(180deg, color-mix(in srgb, var(--inv-accent) 18%, transparent), color-mix(in srgb, var(--inv-accent) 8%, transparent));
  transform:translateY(102%); border-radius:42% 42% 0 0 / 18% 18% 0 0; transition:transform .52s cubic-bezier(0.16,1,0.3,1), border-radius .52s ease; }
.inv-root .inv-choice:hover { border-color:color-mix(in srgb, var(--inv-accent) 55%, var(--inv-field-line)); transform:translateY(-1px); }
.inv-root .inv-choice[aria-checked="true"] { color:var(--inv-accent-text); border-color:var(--inv-accent);
  box-shadow:inset 0 0 0 1px var(--inv-accent), 0 8px 20px -12px color-mix(in srgb, var(--inv-accent) 45%, transparent); }
.inv-root .inv-choice[aria-checked="true"]::after { transform:translateY(0); border-radius:0; }

.inv-root .inv-chip { display:inline-flex; align-items:center; gap:6px; min-height:42px; padding:0 16px; font-size:14.5px; font-weight:500; color:var(--inv-ink);
  background:var(--inv-field-bg); border:1px solid var(--inv-field-line); border-radius:var(--inv-chip-r); transition:all .2s; }
.inv-root .inv-chip:hover { border-color:color-mix(in srgb, var(--inv-accent) 55%, var(--inv-field-line)); }
.inv-root .inv-chip[aria-checked="true"], .inv-root .inv-chip[aria-pressed="true"] { color:var(--inv-on-accent); background:var(--inv-accent); border-color:var(--inv-accent); }

.inv-root .inv-row { min-height:60px; padding:8px 8px 8px 16px; background:var(--inv-field-bg); border:1px solid var(--inv-field-line); border-radius:var(--inv-field-r); }
.inv-root .inv-step { display:grid; place-items:center; width:42px; height:42px; border-radius:999px; color:var(--inv-accent-text);
  border:1px solid var(--inv-field-line); background:var(--inv-paper); transition:all .2s; }
.inv-root .inv-step:hover { border-color:var(--inv-accent); }

.inv-root .inv-card { background:var(--inv-field-bg); border:1px solid var(--inv-field-line); border-radius:calc(var(--inv-field-r) + 4px); }
.inv-root .inv-wishes { display:grid; gap:12px; }
.inv-root .inv-wish { position:relative; padding:16px 18px 16px 46px; background:var(--inv-field-bg); border:1px solid var(--inv-field-line); border-radius:calc(var(--inv-field-r) + 2px); }
.inv-root .inv-wish::before { content:"\\201C"; position:absolute; left:14px; top:6px; font-family:var(--inv-display), serif; font-size:40px; line-height:1; color:var(--inv-accent-text); opacity:.55; }

/* soft: white, pillowy, a little shadow */
.inv-root[data-skin="soft"] .inv-field, .inv-root[data-skin="soft"] .inv-choice, .inv-root[data-skin="soft"] .inv-row, .inv-root[data-skin="soft"] .inv-wish, .inv-root[data-skin="soft"] .inv-card
  { box-shadow:0 1px 2px rgba(60,20,30,.04), 0 8px 22px -16px rgba(60,20,30,.28); }
.inv-root[data-skin="soft"] .inv-field:focus { box-shadow:0 0 0 4px color-mix(in srgb, var(--inv-accent) 16%, transparent); }

/* line: editorial underlines, uppercase labels */
.inv-root[data-skin="line"] .inv-label { font-size:11.5px; font-weight:600; letter-spacing:.2em; text-transform:uppercase; margin-bottom:2px; }
.inv-root[data-skin="line"] .inv-field { background:transparent; border-width:0 0 1px; border-radius:0; padding:10px 0 9px; min-height:46px; }
.inv-root[data-skin="line"] select.inv-field { background-position:right 2px center; }
.inv-root[data-skin="line"] .inv-field:focus { box-shadow:0 1px 0 0 var(--inv-accent); }
.inv-root[data-skin="line"] textarea.inv-field { border-width:1px; padding:12px 14px; }
.inv-root[data-skin="line"] .inv-choice { background:transparent; border-radius:0; }
.inv-root[data-skin="line"] .inv-row { background:transparent; border-width:1px 0; border-radius:0; padding-left:0; padding-right:0; }
.inv-root[data-skin="line"] .inv-wish { background:transparent; border-width:0 0 1px; border-radius:0; padding:14px 0 18px 34px; }
.inv-root[data-skin="line"] .inv-wish::before { left:0; top:4px; }
.inv-root[data-skin="line"] .inv-wishes { gap:0; border-top:1px solid var(--inv-field-line); }
.inv-root[data-skin="line"] .inv-card { background:transparent; }

/* ThreeUI liquid-metal sheen + Gói 1 Quench liquid confirm & Dart paper-plane send */
@keyframes inv-metal-sweep { 0% { transform:translateX(-150%) skewX(-22deg); } 28%, 100% { transform:translateX(280%) skewX(-22deg); } }
@keyframes inv-quench-fill { 0% { transform:translateX(-100%); } 100% { transform:translateX(0%); } }
@keyframes inv-plane-hover { 0%, 100% { transform:translate3d(0,0,0) rotate(0deg); } 50% { transform:translate3d(3px,-2px,0) rotate(-6deg); } }
.inv-root .inv-btn-metal { box-shadow:inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -1px 0 rgba(0,0,0,0.18), var(--inv-btn-shadow); }
.inv-root .inv-btn-metal::before { content:""; position:absolute; inset:-2px auto -2px -30%; width:42%; pointer-events:none;
  background:linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent);
  transform:translateX(-150%) skewX(-22deg); animation:inv-metal-sweep 4.8s cubic-bezier(0.22,1,0.36,1) infinite; }
.inv-root .inv-btn-metal:hover::before { animation-duration:1.9s; }
.inv-root .inv-quench[data-sending="true"]::after { content:""; position:absolute; inset:0; z-index:-1; pointer-events:none;
  background:rgba(255,255,255,0.22); animation:inv-quench-fill 700ms ease-out forwards; }
.inv-root .inv-dart-btn:hover .inv-plane { animation:inv-plane-hover 620ms ease-in-out infinite; }
.inv-root .inv-dart-btn[data-launched="true"] { filter:brightness(1.08); box-shadow:0 10px 24px -8px color-mix(in srgb, var(--inv-accent) 65%, transparent); }
`;
