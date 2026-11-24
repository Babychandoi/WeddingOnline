'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Building2 } from 'lucide-react';
import { WeddingTopDock, type DockNavItem } from '@/components/threeui/LiquidMetalButton';

let cachedAdmin: boolean | null = null;
let inflight: Promise<boolean> | null = null;

export function useIsPlatformAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(cachedAdmin ?? false);

  useEffect(() => {
    if (cachedAdmin !== null) {
      setIsAdmin(cachedAdmin);
      return;
    }
    if (!inflight) {
      inflight = fetch('/api/auth/me')
        .then((r) => (r.ok ? r.json() : { authenticated: false }))
        .then((d) => {
          cachedAdmin = Boolean(d?.authenticated && d?.user?.isPlatformAdmin);
          return cachedAdmin;
        })
        .catch(() => {
          cachedAdmin = false;
          return false;
        });
    }
    let alive = true;
    inflight.then((val) => {
      if (alive) setIsAdmin(val);
    });
    return () => {
      alive = false;
    };
  }, []);

  return isAdmin;
}

const BASE_DOCK_ITEMS: Array<{ label: string; href: string; match: (path: string) => boolean }> = [
  { label: 'Thiệp 2D', href: '/thiep-cuoi', match: (p) => p === '/thiep-cuoi' || p.startsWith('/thiep-cuoi/') },
  { label: 'Thiệp 3D', href: '/thiep-cuoi-3d', match: (p) => p.startsWith('/thiep-cuoi-3d') },
  { label: 'Không Gian 3D', href: '/khong-gian', match: (p) => p.startsWith('/khong-gian') },
  { label: 'Bảng Gói', href: '/bang-gia', match: (p) => p.startsWith('/bang-gia') },
  { label: 'Cẩm Nang', href: '/huong-dan', match: (p) => p.startsWith('/huong-dan') || p.startsWith('/so-sanh') },
];

export function HomeTopDock() {
  const isAdmin = useIsPlatformAdmin();
  const pathname = usePathname() || '/';
  const items: DockNavItem[] = [
    ...BASE_DOCK_ITEMS.map((item) => ({
      label: item.label,
      href: item.href,
      active: item.match(pathname),
    })),
    ...(isAdmin
      ? [{ label: 'Đối Tác Studio', href: '/partner', active: pathname.startsWith('/partner') }]
      : []),
  ];
  return <WeddingTopDock items={items} />;
}

export function MobileNavStrip() {
  const isAdmin = useIsPlatformAdmin();
  const pathname = usePathname() || '/';
  const items = [
    ...BASE_DOCK_ITEMS,
    ...(isAdmin ? [{ label: 'Đối Tác Studio', href: '/partner', match: (p: string) => p.startsWith('/partner') }] : []),
  ];
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-t border-amber-200/60 px-4 py-2 [scrollbar-width:none] md:hidden">
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
              active
                ? 'bg-rose-50 font-bold text-rose-700 ring-1 ring-rose-200/80'
                : 'text-slate-700 hover:bg-rose-50/70 hover:text-rose-700'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function AdminStudioBanner() {
  const isAdmin = useIsPlatformAdmin();
  if (!isAdmin) return null;
  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-950">
      <strong className="flex items-center gap-1.5 text-sm font-bold text-rose-800">
        <Building2 className="h-4 w-4" /> Dành cho Studio Ảnh Cưới &amp; Xưởng In Thiệp
      </strong>
      <p className="mt-1.5 text-amber-900/90">
        Tích hợp sẵn cổng đối tác B2B2C giúp tạo mã ưu đãi 35% hoặc voucher trả trước 100% kích hoạt ngay cho khách đặt
        gói chụp ảnh.
      </p>
      <Link href="/partner" className="mt-2.5 inline-flex items-center gap-1 font-bold text-rose-700 hover:underline">
        Mở Cổng Đối Tác Studio <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export function AdminStudioFooterLink() {
  const isAdmin = useIsPlatformAdmin();
  if (!isAdmin) return null;
  return (
    <Link href="/partner" className="hover:text-rose-700 hover:underline">
      Đối Tác Studio
    </Link>
  );
}
