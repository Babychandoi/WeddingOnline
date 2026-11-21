'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, LogOut, Sparkles } from 'lucide-react';
import { TIER_CATALOG, isVenueId, type TemplateId, type WeddingTier } from '@dco/shared';
import { OAuthModal } from '@/components/hall/OAuthModal';
import { VenuePicker } from '@/components/venues/VenuePicker';

export default function CreateWeddingPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<{ id: string; displayName: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [title, setTitle] = useState('Lễ Thành Hôn Của Chúng Mình');
  const [brideName, setBrideName] = useState('Ngọc Mai');
  const [groomName, setGroomName] = useState('Gia Huy');
  const [slug, setSlug] = useState('huy-mai-2026');
  const [weddingDate, setWeddingDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [tier, setTier] = useState<WeddingTier>('TRIAL_24H');
  const [templateId, setTemplateId] = useState<TemplateId>('mekong_coconut_tent');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherPreview, setVoucherPreview] = useState<{
    studioName: string;
    discountPercent: number;
    targetTier?: string | null;
  } | null>(null);
  const [voucherMsg, setVoucherMsg] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pendingOrder, setPendingOrder] = useState<{
    orderCode: string;
    qrDataUrl: string;
    amountVnd: number;
    slug: string;
  } | null>(null);
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const invitationTemplate = useRef<string | null>(null);

  useEffect(() => {
    // Arriving from a venue preview ("Tạo sảnh cưới với không gian này")
    const query = new URLSearchParams(window.location.search);
    const fromPreview = query.get('template');
    if (isVenueId(fromPreview)) setTemplateId(fromPreview);
    // Arriving from an invitation sample ("Dùng mẫu này")
    invitationTemplate.current = query.get('thiep');
    setSlug(`huy-mai-${Math.floor(100 + Math.random() * 899)}`);
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setAuthUser(d.user);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/weddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title,
          brideName,
          groomName,
          tier,
          templateId,
          weddingDate,
          invitationTemplateId: invitationTemplate.current ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo phòng thất bại');

      if (tier === 'TRIAL_24H') {
        router.push(`/dashboard/${data.wedding.slug}${invitationTemplate.current ? '?tab=thiep' : ''}`);
        return;
      }

      // Create SaaS Order (DCOPLAN...) for paid packages
      const ordRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId: data.wedding.id,
          targetTier: tier,
          voucherCode: voucherCode.trim() || undefined,
        }),
      });
      const ordData = await ordRes.json();
      if (!ordRes.ok) throw new Error(ordData.error || 'Không tạo được đơn hàng VietQR');
      if (ordData.instantActivated) {
        setPendingOrder({
          orderCode: ordData.order.orderCode,
          qrDataUrl: '',
          amountVnd: 0,
          slug: data.wedding.slug,
        });
        setPaidConfirmed(true);
        return;
      }
      setPendingOrder({
        orderCode: ordData.order.orderCode,
        qrDataUrl: ordData.qrDataUrl,
        amountVnd: ordData.order.amountVnd,
        slug: data.wedding.slug,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tạo phòng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateOrderWebhook = async () => {
    if (!pendingOrder) return;
    const res = await fetch('/api/dev/simulate-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: pendingOrder.orderCode,
        amountVnd: pendingOrder.amountVnd,
      }),
    });
    if (res.ok) {
      setPaidConfirmed(true);
    }
  };

  const handleCheckVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    setVoucherMsg('');
    setVoucherPreview(null);
    if (!code) return;
    const res = await fetch(`/api/vouchers?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    if (!res.ok || !data.valid) {
      setVoucherMsg(data.error || 'Mã voucher không hợp lệ hoặc đã hết lượt.');
      return;
    }
    setVoucherPreview(data.voucher);
    setVoucherMsg(
      `Áp dụng ${data.voucher.studioName}: giảm ${data.voucher.discountPercent}%`
    );
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthUser(null);
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8] p-4">
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
          Đang tải trình tạo Sảnh Cưới...
        </div>
      </div>
    );
  }

  if (authChecked && !authUser) {
    return (
      <OAuthModal
        title="Đăng Nhập Để Tạo Phòng Cưới"
        subtitle="Tài khoản của bạn sẽ là Chủ Tiệc (OWNER) quản lý Sảnh 3D và Sổ Mừng Cưới."
        onAuthenticated={(u) => setAuthUser(u)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
                Khởi Tạo Sảnh Cưới 3D
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Chọn dùng thử 24h miễn phí hoặc mở ngay gói Hạnh Phúc / Viên Mãn VIP qua VietQR. Hai gói trả phí đã kèm thiệp cưới online. Chỉ cần thiệp? <a href="/thiep-cuoi/tao" className="font-semibold text-rose-700 underline underline-offset-2">Thiết kế thiệp riêng</a>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <LogOut className="h-3 w-3" /> {authUser?.displayName}
              </button>
              <Link href="/" className="text-xs font-semibold text-slate-500 hover:underline">
                ← Trang chủ
              </Link>
            </div>
          </div>

          {pendingOrder ? (
            <div className="space-y-4 text-center">
              <h2 className="text-lg font-bold text-slate-900">
                {pendingOrder.amountVnd === 0 && paidConfirmed
                  ? 'Đã Kích Hoạt Ngay Bằng Voucher Studio 100%!'
                  : `Thanh Toán Kích Hoạt Gói (${pendingOrder.amountVnd.toLocaleString('vi-VN')}đ)`}
              </h2>
              {pendingOrder.qrDataUrl ? (
                <img
                  src={pendingOrder.qrDataUrl}
                  alt="VietQR Order"
                  className="mx-auto h-60 w-60 rounded-2xl border border-amber-200 p-2 shadow"
                />
              ) : (
                <div className="mx-auto max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
                  ✅ Đã kích hoạt ngay bằng Voucher Studio 100%! Không cần chuyển khoản.
                </div>
              )}
              <p className="text-xs text-slate-600">
                Mã đơn: <strong className="text-rose-600">{pendingOrder.orderCode}</strong>
              </p>

              {paidConfirmed ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" /> Đã kích hoạt sảnh cưới 3D thành công!
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/${pendingOrder.slug}`}
                      className="inline-block rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white"
                    >
                      Vào Thiết Kế Sảnh 3D Ngay →
                    </Link>
                  </div>
                </div>
              ) : (
                process.env.NODE_ENV !== 'production' && (
                  <button
                    type="button"
                    onClick={handleSimulateOrderWebhook}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-400"
                  >
                    <Sparkles className="h-4 w-4" /> Mô phỏng Webhook SePay Kích Hoạt Gói (Dev)
                  </button>
                )
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Tên Chú Rể</label>
                  <input
                    type="text"
                    required
                    value={groomName}
                    onChange={(e) => setGroomName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Tên Cô Dâu</label>
                  <input
                    type="text"
                    required
                    value={brideName}
                    onChange={(e) => setBrideName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Tiêu đề Tiệc</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Đường dẫn phòng (/w/...)
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Ngày Cưới Chính Thức</label>
                  <input
                    type="date"
                    required
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 block text-xs font-semibold text-slate-700">
                  Chọn Không Gian Cưới (Tùy biến tiếp trong 3D Builder)
                </p>
                <VenuePicker value={templateId} onChange={setTemplateId} />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">Chọn Gói Dịch Vụ</label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(['TRIAL_24H', 'HAPPINESS', 'VIP_FULFILLMENT'] as WeddingTier[]).map((t) => {
                    const meta = TIER_CATALOG[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTier(t)}
                        className={`rounded-2xl border-2 p-3 text-left ${tier === t
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <p className="text-xs font-bold text-slate-900">{meta.nameVi}</p>
                        <p className="mt-1 text-sm font-extrabold text-rose-600">
                          {meta.priceVnd === 0 ? '0đ (24 giờ)' : `${meta.priceVnd.toLocaleString('vi-VN')}đ`}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-600">
                          {meta.maxCcu} khách • {meta.allowVoiceChat ? 'Voice bàn tiệc • ' : ''}
                          {meta.allowVietQr ? 'VietQR Webhook' : 'Khóa VietQR'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {tier !== 'TRIAL_24H' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2">
                  <label className="block text-xs font-bold text-amber-900">
                    Mã Voucher Đối Tác Studio Ảnh Cưới (tùy chọn)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder="VD: STUDIO35, STUDIOVIP100"
                      className="flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={handleCheckVoucher}
                      className="rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-500"
                    >
                      Kiểm tra mã
                    </button>
                  </div>
                  {voucherMsg && (
                    <p
                      className={`text-xs font-semibold ${voucherPreview ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                    >
                      {voucherPreview
                        ? `✅ ${voucherMsg}`
                        : voucherMsg}
                    </p>
                  )}
                </div>
              )}

              {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-rose-500 disabled:opacity-60"
              >
                {submitting
                  ? 'Đang khởi tạo...'
                  : tier === 'TRIAL_24H'
                    ? 'Tạo Phòng Dùng Thử 24h Ngay'
                    : 'Tạo Phòng & Thanh Toán VietQR'}
              </button>
            </form>
          )}
        </div>
      </div>
      );
}
