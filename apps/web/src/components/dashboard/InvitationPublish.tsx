'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Eye, Loader2, Rocket, X } from 'lucide-react';
import {
  INVITATION_3D_PLANS,
  INVITATION_PLANS,
  invitationAccess,
  isWalkthrough3DTemplate,
  type InvitationPlanId,
  type InvitationTemplateId,
} from '@dco/shared';
import type { PublicWeddingDTO } from '@dco/database';

const vnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;
const vnDay = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });

interface PendingOrder {
  orderCode: string;
  amountVnd: number;
  qrDataUrl: string;
  bankBin: string;
  accountNumber: string;
  accountName: string;
}

/**
 * Draft / published status of the invitation, preview link, and buying a
 * 2D or 3D plan to publish (or renew) it.
 */
export function InvitationPublish({
  wedding,
  templateId,
  onWeddingChange,
}: {
  wedding: PublicWeddingDTO;
  templateId: InvitationTemplateId;
  onWeddingChange: (w: PublicWeddingDTO) => void;
}) {
  const is3d = isWalkthrough3DTemplate(templateId);
  const access = invitationAccess(wedding, { templateId });
  const plans = is3d ? INVITATION_3D_PLANS : INVITATION_PLANS;

  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<InvitationPlanId>('3m');
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('phat-hanh') === '1' && !access.published) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!order || paid) return;
    const t = setInterval(async () => {
      const r = await fetch(`/api/orders?orderCode=${encodeURIComponent(order.orderCode)}`, { cache: 'no-store' }).catch(() => null);
      const d = r?.ok ? await r.json() : null;
      if (d?.order?.status !== 'PAID') return;
      setPaid(true);
      const w = await fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}`, { cache: 'no-store' }).then((x) => x.json()).catch(() => null);
      if (w?.wedding) onWeddingChange(w.wedding);
    }, 3000);
    return () => clearInterval(t);
  }, [order, paid, wedding.slug, onWeddingChange]);

  const startOrder = async () => {
    setBusy(true);
    setError('');
    const r = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: wedding.slug,
        kind: is3d ? 'INVITATION_3D' : 'INVITATION',
        invitationPlan: plan,
      }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r?.ok) return setError(d.message ?? 'Chưa tạo được đơn, bạn thử lại nhé.');
    setOrder({
      orderCode: d.order.orderCode,
      amountVnd: d.order.amountVnd,
      qrDataUrl: d.qrDataUrl,
      bankBin: d.bankBin,
      accountNumber: d.accountNumber,
      accountName: d.accountName,
    });
  };

  const close = () => {
    setOpen(false);
    setOrder(null);
    setPaid(false);
    setError('');
  };

  const preview = (
    <a href={`/w/${wedding.slug}/invite`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-white px-3.5 text-sm font-bold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">
      <Eye className="h-4 w-4" /> Xem trước như khách
    </a>
  );

  const tone = access.published
    ? 'border-emerald-200 bg-emerald-50'
    : access.needs3dUpgrade || access.expired
      ? 'border-rose-200 bg-rose-50'
      : 'border-amber-200 bg-amber-50';
  const kindLabel = is3d ? 'Thiệp 3D' : 'Thiệp 2D';
  const title = access.published
    ? access.source === 'hall'
      ? `${kindLabel} đã phát hành · kèm gói sảnh cưới 3D`
      : access.lifetime
        ? `${kindLabel} đã phát hành · trọn đời`
        : `${kindLabel} đã phát hành · đến ${vnDay(access.until!)}`
    : access.needs3dUpgrade
      ? 'Đang chọn mẫu Thiệp 3D · cần nâng cấp lên gói Thiệp Cưới 3D'
      : access.expired
        ? `${kindLabel} đã hết hạn · khách đang thấy “thiệp tạm ngưng”`
        : `Bản nháp (${kindLabel}) · khách chưa mở được thiệp`;
  const note = access.published
    ? 'Mọi thay đổi khách thấy ngay.'
    : access.needs3dUpgrade
      ? 'Gói Thiệp 2D hiện tại chỉ mở được 100 mẫu 2D. Mua gói Thiệp 3D (từ 290k) để phát hành mẫu 3D hoặc chuyển lại về mẫu 2D.'
      : 'Thiết kế thoải mái, mọi thứ tự lưu nháp. Khi ưng ý, bấm Phát hành để gửi thiệp cho khách.';

  const chosenPrice = plans.find((p) => p.id === plan)!.priceVnd;

  return (
    <>
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${tone}`}>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs text-slate-600">{note}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {preview}
          {!(access.published && (access.source === 'hall' || access.lifetime)) && (
            <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-600">
              <Rocket className="h-4 w-4" />{' '}
              {access.needs3dUpgrade
                ? 'Mua gói Thiệp 3D'
                : access.published || access.expired
                  ? `Gia hạn ${kindLabel}`
                  : `Phát hành ${kindLabel}`}
            </button>
          )}
        </div>
      </div>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={`Phát hành ${kindLabel}`} className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {paid
                    ? `${kindLabel} đã được phát hành`
                    : access.published || access.expired
                      ? `Gia hạn ${kindLabel}`
                      : `Phát hành ${kindLabel}`}
                </h3>
                {!paid && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {is3d
                      ? 'Gói Thiệp 3D mở khóa toàn bộ 10 không gian 3D & 100 mẫu 2D. Gia hạn tự cộng dồn thời gian.'
                      : 'Gói Thiệp 2D áp dụng cho 100 mẫu thiệp 2D. Gia hạn thì cộng thêm vào thời gian còn lại.'}
                  </p>
                )}
              </div>
              <button type="button" onClick={close} aria-label="Đóng" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {paid ? (
              <div className="mt-6 text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
                <p className="mt-3 text-sm text-slate-700">Đã nhận thanh toán. Giờ bạn gửi link thiệp cho khách được rồi.</p>
                <button type="button" onClick={close} className="mt-5 inline-flex min-h-[48px] items-center rounded-xl bg-slate-900 px-6 text-sm font-bold text-white">Xong</button>
              </div>
            ) : !order ? (
              <>
                <div role="radiogroup" aria-label={`Chọn gói ${kindLabel}`} className="mt-5 space-y-2">
                  {plans.map((p) => {
                    const perMonth = p.months ? Math.round(p.priceVnd / p.months / 1000) * 1000 : null;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={plan === p.id}
                        onClick={() => setPlan(p.id)}
                        className={`flex min-h-[60px] w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 text-left transition ${plan === p.id ? 'border-rose-600 bg-rose-50' : 'border-slate-200 hover:border-rose-300'}`}
                      >
                        <span>
                          <span className="block text-sm font-black text-slate-900">{p.nameVi}</span>
                          <span className="block text-xs text-slate-500">{perMonth ? (p.months && p.months > 1 ? `≈ ${vnd(perMonth)}/tháng` : 'Phù hợp khi cưới gần') : 'Thiệp và lời chúc giữ mãi làm kỷ niệm'}</span>
                        </span>
                        <span className="text-base font-black tabular-nums text-rose-800">{vnd(p.priceVnd)}</span>
                      </button>
                    );
                  })}
                </div>
                {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800" role="alert">{error}</p>}
                <button type="button" disabled={busy} onClick={() => void startOrder()} className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-rose-700 text-base font-bold text-white hover:bg-rose-600 disabled:opacity-60">
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />} Thanh toán {vnd(chosenPrice)}
                </button>
              </>
            ) : (
              <div className="mt-5 text-center">
                <p className="text-sm text-slate-700">Quét mã bằng app ngân hàng. Thiệp tự phát hành ngay khi nhận được tiền.</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={order.qrDataUrl} alt="Mã VietQR thanh toán" className="mx-auto mt-4 h-56 w-56 rounded-xl bg-white p-2 ring-1 ring-slate-200" />
                <dl className="mx-auto mt-4 max-w-xs space-y-1 text-left text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Số tiền</dt><dd className="font-black tabular-nums">{vnd(order.amountVnd)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Nội dung</dt><dd className="font-black">{order.orderCode}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Tài khoản</dt><dd className="font-semibold">{order.accountNumber}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Chủ tài khoản</dt><dd className="text-right font-semibold">{order.accountName}</dd></div>
                </dl>
                <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600" role="status">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang chờ xác nhận thanh toán…
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
