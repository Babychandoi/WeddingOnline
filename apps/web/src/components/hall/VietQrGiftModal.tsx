'use client';

import React, { useState } from 'react';
import { CheckCircle2, Heart, Sparkles, X } from 'lucide-react';

interface VietQrGiftModalProps {
  slug: string;
  brideName: string;
  groomName: string;
  onClose: () => void;
}

export const VietQrGiftModal: React.FC<VietQrGiftModalProps> = ({
  slug,
  brideName,
  groomName,
  onClose,
}) => {
  const [wishMessage, setWishMessage] = useState('Chúc hai bạn trăm năm hạnh phúc viên mãn!');
  const [suggestedAmountVnd, setSuggestedAmountVnd] = useState<number>(500000);
  const [intent, setIntent] = useState<{
    transferCode: string;
    bankAccountNo: string;
    bankAccountName: string;
    qrDataUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  const handleCreateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/weddings/${encodeURIComponent(slug)}/gifts/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishMessage, suggestedAmountVnd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Không tạo được VietQR');
      setIntent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tạo mã VietQR');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!intent) return;
    setSimulating(true);
    try {
      const res = await fetch('/api/dev/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: intent.transferCode,
          amountVnd: suggestedAmountVnd,
        }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setVerified(true);
      } else {
        setError(data.error || 'Webhook chưa xác nhận');
      }
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-600" />
            <h3 className="text-lg font-bold text-slate-900">Hộp Mừng Cưới VietQR</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-xs text-slate-600">
          Tiền mừng chuyển khoản <strong>trực tiếp 100%</strong> vào tài khoản cá nhân của{' '}
          <strong>
            {groomName} &amp; {brideName}
          </strong>
          . Số tiền được <strong>ẩn hoàn toàn</strong> trên sảnh 3D, chỉ hiện lời chúc sau khi ngân
          hàng xác thực webhook.
        </p>

        {!intent ? (
          <form onSubmit={handleCreateQr} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Lời chúc phúc gửi lên sảnh 3D
              </label>
              <textarea
                rows={2}
                maxLength={280}
                value={wishMessage}
                onChange={(e) => setWishMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Mức gợi ý trên QR (Tùy chọn — có thể sửa trong app ngân hàng)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[200000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSuggestedAmountVnd(amt)}
                    className={`rounded-xl border py-2 text-xs font-bold ${
                      suggestedAmountVnd === amt
                        ? 'border-rose-600 bg-rose-50 text-rose-700'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {amt.toLocaleString('vi-VN')}đ
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow hover:bg-rose-500 disabled:opacity-60"
            >
              {loading ? 'Đang tạo mã VietQR...' : 'Tạo Mã Mừng Cưới VietQR'}
            </button>
          </form>
        ) : (
          <div className="space-y-3 text-center">
            <img
              src={intent.qrDataUrl}
              alt="VietQR"
              className="mx-auto h-56 w-56 rounded-2xl border border-amber-200 p-2 shadow"
            />
            <div className="rounded-xl bg-slate-50 p-3 text-left text-xs">
              <p>
                Chủ TK: <strong>{intent.bankAccountName || 'Cô Dâu & Chú Rể'}</strong>
              </p>
              <p>
                Số TK: <strong>{intent.bankAccountNo}</strong>
              </p>
              <p>
                Nội dung chuyển khoản bắt buộc:{' '}
                <strong className="text-rose-600">{intent.transferCode}</strong>
              </p>
            </div>

            {verified ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Ngân hàng đã xác thực! Pháo hoa chúc mừng vừa
                bùng nổ trên sảnh 3D!
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500">
                  Sau khi chuyển khoản thành công, sảnh 3D sẽ tự động nổ pháo hoa &amp; hiển thị lời
                  chúc của bạn.
                </p>
                {process.env.NODE_ENV !== 'production' && (
                  <button
                    type="button"
                    onClick={handleSimulateWebhook}
                    disabled={simulating}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-400"
                  >
                    <Sparkles className="h-4 w-4" />
                    {simulating
                      ? 'Đang gửi webhook SePay...'
                      : 'Mô phỏng Webhook SePay xác nhận (Dev Test)'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
