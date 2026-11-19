'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ExternalLink,
  HardDrive,
  HeartHandshake,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  TicketPercent,
  Users,
  X,
} from 'lucide-react';
import { cx } from './ui';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Vận hành',
    items: [
      { href: '/admin', label: 'Tổng quan', icon: <LayoutDashboard className="h-[18px] w-[18px]" /> },
      { href: '/admin/weddings', label: 'Phòng cưới', icon: <HeartHandshake className="h-[18px] w-[18px]" /> },
      { href: '/admin/orders', label: 'Đơn hàng', icon: <ReceiptText className="h-[18px] w-[18px]" /> },
      { href: '/admin/vouchers', label: 'Mã voucher', icon: <TicketPercent className="h-[18px] w-[18px]" /> },
      { href: '/admin/users', label: 'Người dùng', icon: <Users className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    label: 'Cấu hình',
    items: [
      { href: '/admin/settings/payment', label: 'Thanh toán', icon: <Landmark className="h-[18px] w-[18px]" /> },
      { href: '/admin/settings/storage', label: 'Lưu trữ ảnh', icon: <HardDrive className="h-[18px] w-[18px]" /> },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
}

function RailContent({
  pathname,
  adminName,
  adminEmail,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  adminName: string;
  adminEmail: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-6 pt-7">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="block rounded-md focus-visible:outline-amber-300"
        >
          <span className="block font-serif text-[1.65rem] font-bold leading-none text-[#FBEFE3]">DamCuoiOnline</span>
          <span className="mt-1.5 block text-xs font-medium text-rose-200/80">Quản trị nền tảng</span>
        </Link>
      </div>

      <nav aria-label="Quản trị" className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="px-3 pb-1.5 text-[11px] font-semibold text-rose-200/70">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cx(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-amber-300',
                        active
                          ? 'bg-white/[0.12] text-white'
                          : 'text-[#F3DFE0] hover:bg-white/[0.06] hover:text-white'
                      )}
                    >
                      <span className={cx(active ? 'text-amber-200' : 'text-rose-200/80 group-hover:text-rose-100')}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {active && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-300" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <div className="px-3 pb-3">
          <p className="truncate text-sm font-semibold text-[#FBEFE3]">{adminName}</p>
          <p className="truncate text-xs text-rose-200/75">{adminEmail}</p>
        </div>
        <div className="flex gap-1">
          <Link
            href="/"
            onClick={onNavigate}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-[#F3DFE0] transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-amber-300"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Trang chủ
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-[#F3DFE0] transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-amber-300"
          >
            <LogOut className="h-3.5 w-3.5" /> Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

export const AdminShell: React.FC<{
  adminName: string;
  adminEmail: string;
  children: React.ReactNode;
}> = ({ adminName, adminEmail, children }) => {
  const pathname = usePathname() || '/admin';
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerLayerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const pageRef = useRef<HTMLDivElement>(null);

  // The closed drawer stays rendered so it can slide, but must leave the tab order;
  // while it is open, the page behind it must leave the tab order instead (modal).
  useEffect(() => {
    if (drawerLayerRef.current) drawerLayerRef.current.inert = !drawerOpen;
    if (pageRef.current) pageRef.current.inert = drawerOpen;
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  // Drawer: lock page scroll, close on Escape, move focus inside
  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen, closeDrawer]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-slate-800 lg:pl-[248px]">
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] bg-[#5B1626] lg:block">
        <RailContent pathname={pathname} adminName={adminName} adminEmail={adminEmail} onLogout={handleLogout} />
      </aside>

      <div ref={pageRef}>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#4A1220] bg-[#5B1626] px-4 py-3 lg:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Mở danh mục quản trị"
          aria-expanded={drawerOpen}
          aria-controls="admin-drawer"
          className="-ml-1 rounded-lg p-2 text-[#FBEFE3] hover:bg-white/10 focus-visible:outline-amber-300"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-serif text-xl font-bold text-[#FBEFE3]">DamCuoiOnline</span>
      </div>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
      </div>

      {/* Mobile drawer */}
      <div
        className={cx(
          'fixed inset-0 z-40 lg:hidden',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        aria-hidden={!drawerOpen}
        ref={drawerLayerRef}
      >
        <div
          onClick={closeDrawer}
          className={cx(
            'absolute inset-0 bg-[#2A0A12]/50 transition-opacity duration-300',
            drawerOpen ? 'opacity-100' : 'opacity-0'
          )}
        />
        <div
          id="admin-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Danh mục quản trị"
          className={cx(
            'absolute inset-y-0 left-0 w-[min(84vw,280px)] bg-[#5B1626] shadow-[8px_0_32px_-8px_rgba(42,10,18,0.5)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Đóng danh mục"
            className="absolute right-3 top-6 rounded-lg p-2 text-rose-100 hover:bg-white/10 focus-visible:outline-amber-300"
          >
            <X className="h-5 w-5" />
          </button>
          <RailContent
            pathname={pathname}
            adminName={adminName}
            adminEmail={adminEmail}
            onNavigate={() => setDrawerOpen(false)}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </div>
  );
};
