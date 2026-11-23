'use client';

/**
 * Gói 5 — Original system micro-interactions for DamCuoiOnline Dashboard, Auth, Checkout & 404:
 * - PlimsollUploadDropzone (drag/drop & click wedding photo uploader with rising liquid wave, inspired by Upload/Plimsoll)
 * - ParachuteDownloadButton (QR print download button with perimeter progress ring & gliding arrow, inspired by Parachute/Bead)
 * - TenderCheckoutButton (tactile card-swipe & liquid-sheen checkout CTA, inspired by Tender)
 * - SleuthNotFoundClient (interactive cursor magnifying-glass 404 experience, inspired by Sleuth)
 */

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Check, CreditCard, Download, Home, ImagePlus, Loader2, Search, Sparkles, UploadCloud } from 'lucide-react';

/* ───────────────────────── 1. PlimsollUploadDropzone (Upload + Plimsoll) ───────────────────────── */

export function PlimsollUploadDropzone({
  onChange,
}: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [level, setLevel] = useState(0); // 0..100 liquid fill animation
  const [justUploaded, setJustUploaded] = useState(false);

  const pulseFill = () => {
    setJustUploaded(false);
    setLevel(28);
    window.setTimeout(() => setLevel(76), 180);
    window.setTimeout(() => {
      setLevel(100);
      setJustUploaded(true);
    }, 520);
    window.setTimeout(() => {
      setLevel(0);
      setJustUploaded(false);
    }, 2400);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      pulseFill();
    }
    onChange(e);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0 || !inputRef.current) return;
    try {
      const dt = new DataTransfer();
      Array.from(files).forEach((f) => dt.items.add(f));
      inputRef.current.files = dt.files;
      inputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    } catch {
      // Fallback: open file picker if DataTransfer assignment is restricted
      inputRef.current.click();
    }
  };

  return (
    <label
      data-plimsoll-upload="true"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`group relative flex cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-2xl border-2 border-dashed px-4 py-3.5 transition-all duration-300 ${
        dragging
          ? 'border-rose-500 bg-rose-50/70 shadow-md'
          : 'border-amber-300/90 bg-gradient-to-r from-[#fffdf8] to-[#fff5f6] hover:border-rose-400'
      }`}
    >
      {/* Rising Plimsoll liquid wave */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-rose-500/20 via-amber-300/20 to-transparent transition-all duration-500 ease-out"
        style={{ height: dragging ? '60%' : `${level}%` }}
      />

      <div className="relative z-[1] flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-600 text-white shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5">
          {justUploaded ? <Check className="h-5 w-5" /> : dragging ? <UploadCloud className="h-5 w-5 animate-bounce" /> : <ImagePlus className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-xs font-bold text-slate-900 sm:text-sm">
            {justUploaded
              ? 'Đã tiếp nhận ảnh cưới — đang tải lên kho lưu trữ!'
              : dragging
                ? 'Thả ảnh cưới vào đây để tải lên ngay'
                : 'Kéo thả nhiều ảnh cưới vào đây hoặc bấm chọn tệp'}
          </p>
          <p className="text-[11px] text-slate-500">Hỗ trợ JPG, PNG, WebP · Tự tối ưu hiển thị trên Sảnh 3D &amp; Thiệp</p>
        </div>
      </div>

      <span className="relative z-[1] hidden shrink-0 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition group-hover:bg-rose-500 sm:inline-block">
        + Tải Ảnh Cưới
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
    </label>
  );
}

/* ───────────────────────── 2. ParachuteDownloadButton (Parachute + Bead) ───────────────────────── */

export function ParachuteDownloadButton({
  onClick,
  disabled,
  label = 'Tải Ảnh QR Chất Lượng Cao (PNG)',
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  const [state, setState] = useState<'idle' | 'gliding' | 'done'>('idle');

  const trigger = () => {
    if (disabled || state === 'gliding') return;
    setState('gliding');
    onClick();
    window.setTimeout(() => setState('done'), 550);
    window.setTimeout(() => setState('idle'), 2600);
  };

  return (
    <button
      type="button"
      onClick={trigger}
      disabled={disabled}
      data-parachute-btn={state}
      className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50"
    >
      {/* Bead perimeter shimmer trace when downloading */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-amber-300 transition-all duration-500 ease-out"
        style={{ width: state === 'idle' ? '0%' : '100%' }}
      />
      <span
        className={`inline-flex transition-transform duration-500 ${
          state === 'gliding' ? 'translate-y-1.5 scale-90' : 'group-hover:translate-y-0.5'
        }`}
      >
        {state === 'done' ? <Check className="h-4 w-4 text-amber-200" /> : <Download className="h-4 w-4" />}
      </span>
      <span>{state === 'done' ? 'Đã tải ảnh QR PNG ✓' : state === 'gliding' ? 'Đang lưu tệp…' : label}</span>
    </button>
  );
}

/* ───────────────────────── 3. TenderCheckoutButton (Tender) ───────────────────────── */

export function TenderCheckoutButton({
  submitting,
  label = 'Tạo Phòng & Thanh Toán VietQR',
}: {
  submitting: boolean;
  label?: string;
}) {
  return (
    <button
      type="submit"
      disabled={submitting}
      data-tender-checkout="true"
      className="group relative isolate flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-rose-700 via-rose-600 to-amber-700 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_-10px_rgba(190,18,60,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[420%]"
      />
      {submitting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-6 group-hover:translate-x-0.5" />
      )}
      <span>{submitting ? 'Đang khởi tạo mã VietQR…' : label}</span>
    </button>
  );
}

/* ───────────────────────── 4. SleuthNotFoundClient (Sleuth 404 Lens) ───────────────────────── */

export function SleuthNotFoundClient() {
  const [lens, setLens] = useState({ x: 50, y: 45, active: false });

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100;
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100;
    setLens({ x, y, active: true });
  };

  return (
    <main
      data-sleuth-404="true"
      onPointerMove={handleMove}
      onPointerLeave={() => setLens((l) => ({ ...l, active: false }))}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FFFDF8] px-5 py-16 text-center text-slate-900 select-none"
    >
      {/* Soft warm radial bokeh backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 25% 25%, rgba(251,191,36,0.16), transparent 65%), radial-gradient(55% 45% at 78% 75%, rgba(190,18,60,0.12), transparent 65%)',
        }}
      />

      {/* Interactive Sleuth spotlight lens stage */}
      <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-amber-200/90 bg-white/85 px-6 py-12 shadow-[0_28px_64px_-28px_rgba(92,28,38,0.35)] backdrop-blur-md sm:px-12 sm:py-16">
        {/* Blurred base 404 watermark */}
        <div className="relative mx-auto mb-6 flex h-36 items-center justify-center sm:h-44">
          <p className="font-serif text-[6.5rem] font-black leading-none tracking-tight text-rose-950/15 blur-[3px] sm:text-[8.5rem]">
            404
          </p>
          {/* Magnified crisp revealed layer inside the circular lens */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200"
            style={{
              clipPath: `circle(${lens.active ? '78px' : '58px'} at ${lens.x}% ${lens.y}%)`,
            }}
          >
            <p className="font-serif text-[6.5rem] font-black leading-none tracking-tight text-rose-700 sm:text-[8.5rem]">
              404
            </p>
          </div>
          {/* Visible brass magnifying-glass ring tracking pointer */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-500/80 shadow-[0_0_0_3px_rgba(255,253,248,0.85),0_14px_28px_-10px_rgba(120,53,15,0.4)] transition-[width,height] duration-200"
            style={{
              left: `${lens.x}%`,
              top: `${lens.y}%`,
              width: lens.active ? '156px' : '116px',
              height: lens.active ? '156px' : '116px',
              background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.45), transparent 62%)',
            }}
          >
            <Search className="absolute bottom-2.5 right-2.5 h-4 w-4 text-amber-700/70" />
          </span>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-700">
          Rê chuột để soi kính lúp · Không tìm thấy trang
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-rose-950 sm:text-4xl">
          Cánh thiệp này đang bay lạc đâu đó…
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
          Đường dẫn thiệp cưới hoặc sảnh 3D có thể đã đổi tên, gõ nhầm ký tự hoặc vừa hết thời hạn hiển thị.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-rose-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-rose-600"
          >
            <Home className="h-4 w-4" /> Về Trang Chủ
          </Link>
          <Link
            href="/thiep-cuoi"
            className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 text-sm font-bold text-rose-900 transition hover:bg-rose-100"
          >
            <Sparkles className="h-4 w-4 text-rose-600" /> Xem 100 Mẫu Thiệp
          </Link>
          <Link
            href="/khong-gian"
            className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-amber-300 bg-white px-5 text-sm font-bold text-slate-800 transition hover:bg-amber-50"
          >
            101 Không Gian 3D
          </Link>
        </div>
      </div>
    </main>
  );
}
