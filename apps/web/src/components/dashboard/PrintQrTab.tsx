'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Download, ExternalLink } from 'lucide-react';
import type { PublicWeddingDTO } from '@dco/database';

export const PrintQrTab: React.FC<{ wedding: PublicWeddingDTO }> = ({ wedding }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const generateCard = async () => {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://damcuoionline.vn';
      const inviteUrl = `${origin}/w/${wedding.slug}`;
      const qrDataUrl = await QRCode.toDataURL(inviteUrl, {
        width: 520,
        margin: 2,
        color: { dark: '#881337', light: '#ffffff' },
      });

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Cream silk card background
      ctx.fillStyle = '#fffdf8';
      ctx.fillRect(0, 0, 1200, 1600);

      // Crimson outer border + Gold inner border
      ctx.strokeStyle = '#9f1239';
      ctx.lineWidth = 28;
      ctx.strokeRect(24, 24, 1152, 1552);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 8;
      ctx.strokeRect(56, 56, 1088, 1488);

      ctx.fillStyle = '#9f1239';
      ctx.font = 'bold 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('THIỆP MỜI TIỆC CƯỚI TRỰC TUYẾN 3D', 600, 175);

      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 74px Georgia, serif';
      ctx.fillText(`${wedding.groomName} & ${wedding.brideName}`, 600, 295);

      ctx.fillStyle = '#b45309';
      ctx.font = '38px sans-serif';
      ctx.fillText(
        `${wedding.title} • ${new Date(wedding.weddingDate).toLocaleDateString('vi-VN')}`,
        600,
        375
      );

      ctx.fillStyle = '#475569';
      ctx.font = '32px sans-serif';
      ctx.fillText('Ở xa không về kịp? Quét mã dự tiệc 3D cùng hai bạn!', 600, 465);

      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(320, 540, 560, 560);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 6;
        ctx.strokeRect(320, 540, 560, 560);
        ctx.drawImage(qrImg, 340, 560, 520, 520);

        ctx.fillStyle = '#9f1239';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText(inviteUrl, 600, 1190);

        ctx.fillStyle = '#64748b';
        ctx.font = '28px sans-serif';
        ctx.fillText('Hỗ trợ trên trình duyệt Zalo, Safari & Chrome — Không cần cài App', 600, 1275);
        ctx.fillText('DamCuoiOnline.vn', 600, 1450);

        setPreviewUrl(canvas.toDataURL('image/png'));
      };
      qrImg.src = qrDataUrl;
    };

    generateCard().catch(() => {});
  }, [wedding]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `thiep-qr-3d-${wedding.slug}.png`;
    a.click();
  };

  return (
    <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[360px_1fr]">
      <div className="flex flex-col items-center">
        <canvas ref={canvasRef} className="hidden" />
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Thiệp QR in ấn"
            className="w-full max-w-[320px] rounded-2xl border border-amber-200 shadow-lg"
          />
        ) : (
          <div className="flex h-96 w-full items-center justify-center rounded-2xl bg-slate-100 text-xs text-slate-500">
            Đang tạo ảnh thiệp QR chất lượng cao...
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center space-y-4">
        <h3 className="text-xl font-bold text-slate-900">
          Thiệp Mời Điện Tử &amp; Mã QR In Lên Thiệp Giấy
        </h3>
        <p className="text-sm text-slate-600">
          Gửi ảnh QR độ phân giải cao (1200×1600px) cho xưởng in thiệp cưới hoặc in standee đặt tại
          bàn đón khách để người thân ở xa quét mã tham gia ngay trên điện thoại.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!previewUrl}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow hover:bg-rose-500 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Tải Ảnh QR Chất Lượng Cao (PNG)
          </button>
          <Link
            href={`/w/${wedding.slug}/invite`}
            target="_blank"
            className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-900 hover:bg-amber-100"
          >
            <ExternalLink className="h-4 w-4" /> Xem Trang Thiệp Mời Online
          </Link>
        </div>
      </div>
    </div>
  );
};
