import React from 'react';
import Link from 'next/link';
import { AdminStudioFooterLink, HomeTopDock, MobileNavStrip } from '@/components/home/AdminStudioSlot';

/**
 * Shared sticky top navigation header used across all public marketing, gallery,
 * pricing, guide, and legal pages on DamCuoiOnline.vn.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-amber-200/70 bg-[#FFFDF8]/92 backdrop-blur-md">
      <nav
        aria-label="Điều hướng chính"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6"
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300 bg-rose-700 text-amber-200 shadow-sm">
            <svg viewBox="0 0 36 36" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M9 7h4v5h3v3h-3v4h4v3h-4v7H9v-7H6v-3h3v-4H6v-3h3V7zm14 0h4v5h3v3h-3v4h3v3h-3v7h-4v-7h-4v-3h4v-4h-3v-3h3V7z" />
            </svg>
          </span>
          <span className="font-serif text-xl font-bold tracking-tight text-rose-800">
            DamCuoiOnline.vn
          </span>
        </Link>

        <HomeTopDock />

        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            href="/plaza"
            className="hidden rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 sm:inline-block"
          >
            Quảng Trường 24/7
          </Link>
          <Link
            href="/create"
            className="rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-500"
          >
            Tạo Sảnh Cưới
          </Link>
        </div>
      </nav>
      <MobileNavStrip />
    </header>
  );
}

/** Shared site footer for consistent navigation & E-E-A-T trust links */
export function SiteFooter() {
  return (
    <footer className="border-t border-amber-200/70 bg-[#FFFDF8] py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-xs text-slate-500 sm:px-6">
        <span className="font-semibold text-slate-700">
          DamCuoiOnline.vn — Thiệp Cưới Online &amp; Sảnh Cưới 3D Trực Tuyến
        </span>
        <div className="flex flex-wrap gap-4">
          <Link href="/thiep-cuoi" className="hover:text-rose-700 hover:underline">
            100 Mẫu Thiệp 2D
          </Link>
          <Link href="/thiep-cuoi-3d" className="hover:text-rose-700 hover:underline">
            100 Mẫu Thiệp 3D
          </Link>
          <Link href="/khong-gian" className="hover:text-rose-700 hover:underline">
            101 Không Gian 3D
          </Link>
          <Link href="/huong-dan" className="hover:text-rose-700 hover:underline">
            Cẩm Nang
          </Link>
          <Link href="/bang-gia" className="hover:text-rose-700 hover:underline">
            Bảng Giá
          </Link>
          <Link href="/ve-chung-toi" className="hover:text-rose-700 hover:underline">
            Về Chúng Tôi
          </Link>
          <Link href="/plaza" className="hover:text-rose-700 hover:underline">
            Quảng Trường 24/7
          </Link>
          <Link href="/create" className="hover:text-rose-700 hover:underline">
            Tạo Sảnh Mới
          </Link>
          <AdminStudioFooterLink />
          <Link href="/w/minh-va-linh" className="hover:text-rose-700 hover:underline">
            Demo Tiệc VIP
          </Link>
          <Link href="/chinh-sach-bao-mat" className="hover:text-rose-700 hover:underline">
            Bảo mật
          </Link>
          <Link href="/dieu-khoan-su-dung" className="hover:text-rose-700 hover:underline">
            Điều khoản
          </Link>
          <Link href="/lien-he" className="hover:text-rose-700 hover:underline">
            Liên hệ
          </Link>
        </div>
      </div>
    </footer>
  );
}
