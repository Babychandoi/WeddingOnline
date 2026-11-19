'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share2, Upload, X } from 'lucide-react';
import { TIER_CATALOG, type WeddingTier } from '@dco/shared';

interface PhotoboothModalProps {
  slug: string;
  weddingTitle: string;
  weddingDate: string;
  tier: WeddingTier;
  rawSnapshotDataUrl: string;
  onClose: () => void;
  onSaved: () => void;
}

export const PhotoboothModal: React.FC<PhotoboothModalProps> = ({
  slug,
  weddingTitle,
  weddingDate,
  tier,
  rawSnapshotDataUrl,
  onClose,
  onSaved,
}) => {
  const [polaroidUrl, setPolaroidUrl] = useState<string>('');
  const [caption, setCaption] = useState('Khoảnh khắc dự tiệc 3D siêu vui!');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const showWatermark = TIER_CATALOG[tier].photoboothWatermark;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Polaroid Paper Background
      ctx.fillStyle = '#fffdf8';
      ctx.fillRect(0, 0, 1080, 1350);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 10;
      ctx.strokeRect(24, 24, 1032, 1302);

      // Draw 3D Capture cropped cleanly inside top frame
      const targetW = 960;
      const targetH = 920;
      const scale = Math.max(targetW / img.width, targetH / img.height);
      const sw = targetW / scale;
      const sh = targetH / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 60, 60, targetW, targetH);

      // Wedding Title & Date Footer
      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 44px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(weddingTitle.slice(0, 34), 540, 1075);

      ctx.fillStyle = '#be123c';
      ctx.font = '28px sans-serif';
      const formattedDate = new Date(weddingDate).toLocaleDateString('vi-VN');
      ctx.fillText(`Ngày Chung Đôi • ${formattedDate}`, 540, 1135);

      if (showWatermark) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.fillRect(190, 1190, 700, 64);
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('DamCuoiOnline.vn — Bản Dùng Thử 24h', 540, 1232);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = '24px sans-serif';
        ctx.fillText('Kỷ niệm từ Sảnh Cưới 3D DamCuoiOnline.vn', 540, 1225);
      }

      setPolaroidUrl(canvas.toDataURL('image/png'));
    };
    img.src = rawSnapshotDataUrl;
  }, [rawSnapshotDataUrl, weddingTitle, weddingDate, showWatermark]);

  const handleSaveToWall = async () => {
    if (!polaroidUrl) return;
    setSaving(true);
    setSavedMsg('');
    try {
      const blob = await (await fetch(polaroidUrl)).blob();
      const presignRes = await fetch('/api/r2/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          folder: 'photobooth',
          contentType: 'image/png',
          byteSize: blob.size,
        }),
      });
      const presign = await presignRes.json();
      if (!presignRes.ok) throw new Error(presign.error || 'PRESIGN_FAILED');

      await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/png' },
        body: blob,
      });

      const registerRes = await fetch(`/api/weddings/${encodeURIComponent(slug)}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PHOTOBOOTH_SNAPSHOT',
          r2ObjectKey: presign.objectKey,
          publicUrl: presign.publicUrl,
          caption,
        }),
      });
      if (!registerRes.ok) {
        const err = await registerRes.json();
        throw new Error(err.error || 'SAVE_FAILED');
      }
      setSavedMsg('Đã lưu ảnh lên Tường Kỷ Niệm của đám cưới!');
      onSaved();
    } catch (err) {
      setSavedMsg(err instanceof Error ? err.message : 'Lỗi lưu ảnh');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!polaroidUrl) return;
    const a = document.createElement('a');
    a.href = polaroidUrl;
    a.download = `photobooth-${slug}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!polaroidUrl || !navigator.share) {
      handleDownload();
      return;
    }
    const blob = await (await fetch(polaroidUrl)).blob();
    const file = new File([blob], `photobooth-${slug}.png`, { type: 'image/png' });
    await navigator.share({
      title: weddingTitle,
      text: 'Kỷ niệm dự tiệc cưới 3D cực vui!',
      files: [file],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">📸 Photobooth Polaroid 3D</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {polaroidUrl ? (
          <img
            src={polaroidUrl}
            alt="Polaroid snapshot"
            className="mx-auto max-h-[340px] rounded-xl border border-amber-200 shadow-md"
          />
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-slate-500">
            Đang xử lý khung Polaroid...
          </div>
        )}

        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Nhập chú thích kỷ niệm..."
          className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-rose-500"
        />

        {savedMsg && <p className="mt-2 text-center text-xs font-semibold text-emerald-600">{savedMsg}</p>}

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Tải Ảnh
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-1 rounded-xl border border-rose-300 bg-rose-50 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            <Share2 className="h-4 w-4" /> Chia Sẻ
          </button>
          <button
            type="button"
            onClick={handleSaveToWall}
            disabled={saving}
            className="flex items-center justify-center gap-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu Tường'}
          </button>
        </div>
      </div>
    </div>
  );
};
