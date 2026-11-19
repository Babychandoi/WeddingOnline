'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookHeart, Calendar, Crown, Image as ImageIcon, Sparkles } from 'lucide-react';
import type {
  BouquetCatchRecord,
  GuestbookEntryRecord,
  PhotoAssetRecord,
  PublicWeddingDTO,
} from '@dco/database';

interface MemorialArchiveViewProps {
  wedding: PublicWeddingDTO;
  photos: PhotoAssetRecord[];
  guestbook: GuestbookEntryRecord[];
  bouquetCatches: BouquetCatchRecord[];
}

export const MemorialArchiveView: React.FC<MemorialArchiveViewProps> = ({
  wedding,
  photos,
  guestbook,
  bouquetCatches,
}) => {
  const [lightbox, setLightbox] = useState<PhotoAssetRecord | null>(null);
  const galleryPhotos = photos.filter((p) => p.type === 'PRE_WEDDING_GALLERY');
  const photoboothPhotos = photos.filter((p) => p.type === 'PHOTOBOOTH_SNAPSHOT');

  return (
    <div className="min-h-screen bg-[#FFFDF8] pb-16">
      {/* Hero Memorial Banner */}
      <header className="border-b border-amber-200 bg-gradient-to-br from-rose-700 via-rose-600 to-amber-600 px-6 py-16 text-center text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" /> TRANG KỶ NIỆM 2D VĨNH VIỄN (SAU LỄ CƯỚI 7 NGÀY)
        </span>
        <h1 className="mt-4 font-serif text-4xl font-bold sm:text-5xl">{wedding.title}</h1>
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-rose-100">
          <Calendar className="h-4 w-4" />
          Ngày Chung Đôi: {new Date(wedding.weddingDate).toLocaleDateString('vi-VN')} • {wedding.groomName} &amp;{' '}
          {wedding.brideName}
        </p>
      </header>

      <main className="mx-auto mt-10 max-w-5xl space-y-12 px-4">
        {/* Embedded Wedding Highlight Video */}
        {wedding.videoEmbedUrl && (
          <section className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-bold text-slate-900">🎬 Video Lễ Thành Hôn</h2>
            <div className="aspect-video overflow-hidden rounded-2xl bg-slate-900">
              <iframe
                src={wedding.videoEmbedUrl}
                className="h-full w-full border-0"
                allowFullScreen
                title="Wedding Memorial Video"
              />
            </div>
          </section>
        )}

        {/* Pre-Wedding Photo Album */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-rose-600" />
            <h2 className="text-xl font-bold text-slate-900">Album Ảnh Cưới</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryPhotos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLightbox(p)}
                className="group overflow-hidden rounded-2xl border border-amber-200 bg-white text-left shadow-sm transition hover:-translate-y-1"
              >
                <img
                  src={p.publicUrl}
                  alt={p.caption || 'Ảnh cưới'}
                  className="h-56 w-full object-cover transition group-hover:scale-105"
                />
                {p.caption && <p className="p-3 text-xs font-medium text-slate-700">{p.caption}</p>}
              </button>
            ))}
          </div>
        </section>

        {/* Photobooth Wall */}
        {photoboothPhotos.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-900">📸 Tường Kỷ Niệm Photobooth 3D</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photoboothPhotos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setLightbox(p)}
                  className="overflow-hidden rounded-2xl border border-rose-200 bg-white p-2 text-left shadow-sm"
                >
                  <img src={p.publicUrl} alt={p.caption || 'Photobooth'} className="h-56 w-full rounded-xl object-cover" />
                  {p.caption && <p className="mt-2 px-1 text-xs font-semibold text-slate-700">{p.caption}</p>}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Bouquet Hall of Fame + Guestbook */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BookHeart className="h-5 w-5 text-rose-600" />
              <h2 className="text-xl font-bold text-slate-900">Sổ Lưu Bút Trăm Năm</h2>
            </div>
            <div className="space-y-3">
              {guestbook.map((g) => (
                <div key={g.id} className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-slate-900">{g.authorName}</strong>
                    <span className="text-slate-400">
                      {new Date(g.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-700">{g.message}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Crown className="h-4 w-4 text-amber-500" /> Người Bắt Được Hoa Cưới
              </div>
              {bouquetCatches.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">Chưa có kỷ lục bắt hoa cưới.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {bouquetCatches.map((b) => (
                    <li
                      key={b.id}
                      className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900"
                    >
                      💐 {b.winnerName}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-center">
              <p className="text-xs font-semibold text-rose-900">
                Bạn muốn tạo một Sảnh Cưới 3D &amp; Trang Kỷ Niệm cho riêng mình?
              </p>
              <Link
                href={`/dashboard/${wedding.slug}/print`}
                className="mt-3 block rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                🖨️ In / Xuất Sổ Kỷ Niệm PDF
              </Link>
              <Link
                href="/create"
                className="mt-2 inline-block rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
              >
                Tạo Phòng Cưới Ngay →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
        >
          <img src={lightbox.publicUrl} alt={lightbox.caption || 'Ảnh'} className="max-h-[85vh] rounded-2xl" />
        </div>
      )}
    </div>
  );
};
