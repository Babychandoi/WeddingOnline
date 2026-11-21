'use client';

import React, { useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Loader2, Save } from 'lucide-react';

const input =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 sm:text-sm';
const label = 'mb-1 block text-xs font-bold text-slate-600';

/** The couple's own gift account and SePay key, as /api/weddings/[slug]/gift-settings returns it */
export interface GiftSettings {
  allowed: boolean;
  bankBin: string;
  bankAccountNo: string;
  bankAccountName: string;
  banks: Array<{ bin: string; name: string }>;
  sepayKey: string;
  webhookUrl: string;
  ready: boolean;
}

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <input readOnly value={value} className={`${input} min-w-0 font-mono !text-xs`} onFocus={(e) => e.currentTarget.select()} />
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 text-xs font-bold text-amber-200 hover:bg-slate-800"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Đã chép' : 'Chép'}
      </button>
    </div>
  );
}

/**
 * Where wedding gifts go: the couple's bank account (the VietQR code guests scan, in the
 * invitation and in the 3D hall) and the optional SePay key that confirms each transfer.
 * Money goes straight to the couple; the platform never holds it.
 */
export function GiftReceivingSettings({
  slug,
  onSettings,
  header,
}: {
  slug: string;
  /** Called whenever the settings load or change */
  onSettings?: (g: GiftSettings) => void;
  /** Shown above the bank form once gifts are allowed (e.g. the invitation's "show gift box" toggle) */
  header?: React.ReactNode;
}) {
  const [gift, setGift] = useState<GiftSettings | null>(null);
  const [form, setForm] = useState({ bankBin: '', bankAccountNo: '', bankAccountName: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = (g: GiftSettings) => {
    setGift(g);
    setForm({ bankBin: g.bankBin, bankAccountNo: g.bankAccountNo, bankAccountName: g.bankAccountName });
    onSettings?.(g);
  };

  useEffect(() => {
    fetch(`/api/weddings/${slug}/gift-settings`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((g: GiftSettings | null) => g && apply(g))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const save = async (extra: Record<string, unknown> = {}) => {
    if (!extra.action && (!form.bankBin || !form.bankAccountNo.trim())) {
      setMsg({ ok: false, text: 'Bạn chọn ngân hàng và nhập số tài khoản nhé.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/weddings/${slug}/gift-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, ...extra }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok) return setMsg({ ok: false, text: data.message ?? 'Chưa lưu được, bạn thử lại nhé.' });
    apply(data as GiftSettings);
    setMsg({ ok: true, text: extra.action === 'generate-key' ? 'Đã tạo khoá SePay mới.' : extra.action === 'remove-key' ? 'Đã tắt tự xác nhận SePay.' : 'Đã lưu tài khoản nhận mừng cưới.' });
  };

  if (!gift) {
    return <p className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải…</p>;
  }
  if (!gift.allowed) {
    return <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">Hộp mừng cưới mở ở Gói Hạnh Phúc và Gói Viên Mãn. Nâng gói ở đầu trang quản trị để bật.</p>;
  }

  return (
    <div className="space-y-3">
      {header}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="giftset-bank">Ngân hàng</label>
          <select id="giftset-bank" className={input} value={form.bankBin} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, bankBin: v })); }}>
            <option value="" disabled>Chọn ngân hàng</option>
            {gift.banks.map((b) => (
              <option key={b.bin} value={b.bin}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="giftset-no">Số tài khoản</label>
          <input id="giftset-no" inputMode="numeric" autoComplete="off" className={input} value={form.bankAccountNo} maxLength={24} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, bankAccountNo: v })); }} placeholder="Ví dụ: 0123456789" />
        </div>
        <div>
          <label className={label} htmlFor="giftset-name">Tên chủ tài khoản</label>
          <input id="giftset-name" autoComplete="off" className={`${input} uppercase`} value={form.bankAccountName} maxLength={50} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, bankAccountName: v })); }} placeholder="NGUYEN VAN A" />
        </div>
      </div>
      <button type="button" disabled={busy} onClick={() => void save()} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu tài khoản
      </button>
      {msg && <p className={`text-xs font-semibold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`} role="status">{msg.text}</p>}
      {!gift.ready && <p className="text-xs text-amber-700">Hộp mừng cưới hiện cho khách sau khi bạn lưu số tài khoản.</p>}

      <div className="space-y-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs leading-relaxed text-slate-700">
        <p className="flex items-center gap-1.5 text-sm font-black text-emerald-900"><KeyRound className="h-4 w-4" /> Tự xác nhận bằng SePay (không bắt buộc)</p>
        <p>Không bật thì khách vẫn chuyển khoản được, bạn tự xem trong app ngân hàng. Bật thì thiệp và sảnh 3D tự báo “Đã nhận” cho khách và ghi vào Sổ mừng cưới.</p>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Đăng ký tài khoản tại <a href="https://my.sepay.vn" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-800 underline">sepay.vn</a> và liên kết đúng tài khoản ngân hàng ở trên.</li>
          <li>Trong SePay vào <strong>Tích hợp WebHooks → Thêm webhook</strong>, dán đường dẫn dưới đây, chọn sự kiện <strong>Có tiền vào</strong>, kiểu chứng thực <strong>API Key</strong>.</li>
          <li>Dán khoá API của đám cưới vào ô API Key rồi lưu.</li>
        </ol>
        <p className="font-bold text-slate-800">Đường dẫn webhook</p>
        <CopyField value={gift.webhookUrl} />
        <p className="font-bold text-slate-800">Khoá API</p>
        {gift.sepayKey ? (
          <>
            <CopyField value={gift.sepayKey} />
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => { if (window.confirm('Tạo khoá mới? Khoá cũ trong SePay sẽ không dùng được nữa.')) void save({ action: 'generate-key' }); }} className="min-h-[40px] rounded-xl px-3 font-bold text-emerald-900 ring-1 ring-emerald-300 hover:bg-emerald-100">Đổi khoá</button>
              <button type="button" disabled={busy} onClick={() => void save({ action: 'remove-key' })} className="min-h-[40px] rounded-xl px-3 font-bold text-slate-700 ring-1 ring-slate-300 hover:bg-white">Tắt tự xác nhận</button>
            </div>
          </>
        ) : (
          <button type="button" disabled={busy} onClick={() => void save({ action: 'generate-key' })} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60">
            <KeyRound className="h-4 w-4" /> Tạo khoá SePay
          </button>
        )}
      </div>
    </div>
  );
}
