'use client';

/**
 * Adapted from ThreeUI Community `sketchbook` & `bookshelf` (MengTo/threeui, MIT).
 * Tactile CSS 3D curled page-flip wedding album & keepsake book with spine shadow,
 * drag/tap page turns, keyboard navigation, and real couple photos + wishes.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Expand } from 'lucide-react';

export interface AlbumBookPhoto {
  id: string;
  url: string;
  caption?: string | null;
}

export interface AlbumBookWish {
  id: string;
  authorName: string;
  message: string;
}

export interface WeddingSketchbookAlbumProps {
  title: string;
  coupleLabel: string;
  dateLabel?: string;
  photos: AlbumBookPhoto[];
  wishes?: AlbumBookWish[];
  onInspectPhoto?: (photo: AlbumBookPhoto) => void;
  className?: string;
}

interface BookSheet {
  frontTitle?: string;
  photo?: AlbumBookPhoto;
  wish?: AlbumBookWish;
  isCover?: boolean;
  isEnding?: boolean;
}

export function WeddingSketchbookAlbum({
  title,
  coupleLabel,
  dateLabel,
  photos,
  wishes = [],
  onInspectPhoto,
  className = '',
}: WeddingSketchbookAlbumProps) {
  const sheets: BookSheet[] = React.useMemo(() => {
    const list: BookSheet[] = [{ isCover: true, frontTitle: title }];
    photos.forEach((photo, idx) => {
      list.push({
        photo,
        wish: wishes[idx % Math.max(1, wishes.length)],
      });
    });
    if (photos.length === 0) {
      list.push({
        isEnding: true,
        wish: wishes[0],
      });
    } else {
      list.push({ isEnding: true, wish: wishes[wishes.length - 1] });
    }
    return list;
  }, [title, photos, wishes]);

  const [pageIdx, setPageIdx] = useState(0);
  const [flipping, setFlipping] = useState<'next' | 'prev' | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const go = useCallback(
    (dir: 'next' | 'prev') => {
      if (flipping) return;
      if (dir === 'next' && pageIdx >= sheets.length - 1) return;
      if (dir === 'prev' && pageIdx <= 0) return;
      setFlipping(dir);
      window.setTimeout(() => {
        setPageIdx((p) => (dir === 'next' ? Math.min(sheets.length - 1, p + 1) : Math.max(0, p - 1)));
        setFlipping(null);
      }, 280);
    },
    [flipping, pageIdx, sheets.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowRight') go('next');
      if (e.key === 'ArrowLeft') go('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const sheet = sheets[pageIdx] ?? sheets[0];
  const nextSheet = sheets[Math.min(sheets.length - 1, pageIdx + 1)];

  return (
    <div className={`mx-auto w-full max-w-3xl select-none ${className}`}>
      {/* Book stage with 3D perspective */}
      <div
        onPointerDown={(e) => setDragStartX(e.clientX)}
        onPointerUp={(e) => {
          if (dragStartX === null) return;
          const dx = e.clientX - dragStartX;
          setDragStartX(null);
          if (dx < -45) go('next');
          else if (dx > 45) go('prev');
        }}
        className="relative overflow-hidden rounded-[1.75rem] border border-amber-300/70 bg-gradient-to-br from-[#f6ebd5] via-[#efe1c5] to-[#e4cfab] p-4 shadow-[0_28px_65px_-28px_rgba(92,45,12,0.55)] sm:p-7 [perspective:1600px]"
      >
        {/* Book cover frame */}
        <div className="relative mx-auto grid min-h-[340px] grid-cols-1 overflow-hidden rounded-2xl border border-amber-900/20 bg-[#fffdf8] shadow-[0_18px_40px_-14px_rgba(68,31,10,0.45)] sm:min-h-[410px] sm:grid-cols-2">
          {/* Center leather spine crease (desktop) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-950/15 to-transparent sm:block"
          />

          {/* Left Page */}
          <div className="relative flex flex-col justify-between border-b border-amber-200/70 bg-gradient-to-br from-[#fffdf9] to-[#f8efe0] p-6 sm:border-b-0 sm:border-r sm:p-8">
            {sheet.isCover ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300 bg-rose-800 font-serif text-xl font-bold text-amber-200 shadow">
                  囍
                </span>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.28em] text-amber-800/80">
                  Sổ Ảnh &amp; Kỷ Niệm 3D
                </p>
                <h3 className="mt-2 font-serif text-3xl font-bold leading-tight text-rose-950">{coupleLabel}</h3>
                {dateLabel && (
                  <p className="mt-2 text-xs font-semibold tabular-nums tracking-[0.2em] text-slate-600">{dateLabel}</p>
                )}
                <p className="mt-5 max-w-[26ch] text-xs leading-relaxed text-slate-600">
                  Vuốt ngang hoặc bấm mũi tên để lật từng trang album cưới và lời chúc lưu giữ mãi mãi.
                </p>
              </div>
            ) : sheet.isEnding ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <BookOpen className="h-8 w-8 text-rose-700" />
                <h3 className="mt-3 font-serif text-2xl font-bold text-rose-950">Cảm Ơn Đã Chung Vui</h3>
                <p className="mt-2 max-w-[28ch] text-xs leading-relaxed text-slate-600">
                  Mọi khoảnh khắc trong ngày cưới của {coupleLabel} sẽ luôn ở đây như một cuốn sổ kỷ niệm mở ra bất cứ lúc nào.
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-700/80">
                    Trang {String(pageIdx).padStart(2, '0')} / {String(Math.max(1, photos.length)).padStart(2, '0')}
                  </span>
                  <h4 className="mt-2 font-serif text-2xl font-bold text-slate-900">
                    {sheet.photo?.caption || `Khoảnh khắc hạnh phúc #${pageIdx}`}
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {coupleLabel} {dateLabel ? `· ${dateLabel}` : ''}
                  </p>
                </div>

                {sheet.wish && (
                  <blockquote className="mt-5 rounded-xl border border-amber-200/80 bg-white/80 p-3.5 text-xs leading-relaxed text-slate-700 shadow-sm">
                    <p className="italic">“{sheet.wish.message}”</p>
                    <footer className="mt-2 font-bold text-rose-800">— {sheet.wish.authorName}</footer>
                  </blockquote>
                )}

                <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-amber-800/60">DamCuoiOnline Keepsake</p>
              </div>
            )}
          </div>

          {/* Right Page with CSS 3D curl flip */}
          <div
            style={{
              transformOrigin: 'left center',
              transform:
                flipping === 'next'
                  ? 'rotateY(-26deg) skewY(-1.5deg)'
                  : flipping === 'prev'
                    ? 'rotateY(18deg) skewY(1.2deg)'
                    : 'rotateY(0deg)',
              transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className="relative flex flex-col justify-center bg-gradient-to-bl from-[#fffdf8] to-[#f6ead6] p-5 sm:p-7 will-change-transform"
          >
            {/* Curled corner highlight */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 h-12 w-12 bg-gradient-to-tl from-amber-900/15 via-white/60 to-transparent"
            />

            {sheet.isCover && nextSheet?.photo ? (
              <div className="relative overflow-hidden rounded-xl border-4 border-white bg-white shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nextSheet.photo.url}
                  alt={nextSheet.photo.caption || title}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-slate-600">
                  <span>Bìa album cưới</span>
                  <button
                    type="button"
                    onClick={() => go('next')}
                    className="font-bold text-rose-700 hover:underline"
                  >
                    Mở trang đầu →
                  </button>
                </div>
              </div>
            ) : sheet.photo ? (
              <div className="group relative overflow-hidden rounded-xl border-4 border-white bg-white shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sheet.photo.url}
                  alt={sheet.photo.caption || 'Ảnh cưới'}
                  className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                {onInspectPhoto && (
                  <button
                    type="button"
                    onClick={() => onInspectPhoto(sheet.photo!)}
                    className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm transition hover:bg-rose-700"
                  >
                    <Expand className="h-3 w-3" /> Phóng to
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-amber-300 bg-white/70 p-6 text-center">
                <span className="font-serif text-4xl text-rose-700">♥</span>
                <p className="mt-2 font-serif text-lg font-bold text-slate-800">{coupleLabel}</p>
                <button
                  type="button"
                  onClick={() => setPageIdx(0)}
                  className="mt-4 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                >
                  Lật lại từ bìa
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom tactile book pagination controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-1">
          <button
            type="button"
            onClick={() => go('prev')}
            disabled={pageIdx <= 0}
            className="inline-flex min-h-[38px] items-center gap-1 rounded-full border border-amber-900/15 bg-white/90 px-3.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-white disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Trang trước
          </button>

          <div className="flex items-center gap-1.5">
            {sheets.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Trang ${i + 1}`}
                onClick={() => setPageIdx(i)}
                className={`h-2 rounded-full transition-all ${
                  i === pageIdx ? 'w-6 bg-rose-700' : 'w-2 bg-amber-900/25 hover:bg-amber-900/50'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go('next')}
            disabled={pageIdx >= sheets.length - 1}
            className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-rose-700 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-40"
          >
            Lật trang <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
