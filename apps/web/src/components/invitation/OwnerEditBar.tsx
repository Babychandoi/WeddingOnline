'use client';

import React, { useEffect, useState } from 'react';
import { PencilLine } from 'lucide-react';

/**
 * When the bride, groom or host opens their own invitation, offer a way straight into the
 * editor. Guests never see it: the check only runs for signed-in visitors, and the editor API
 * answers only to the couple.
 */
export function OwnerEditBar({ slug }: { slug: string }) {
  const [isHost, setIsHost] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => (d?.authenticated ? fetch(`/api/weddings/${encodeURIComponent(slug)}/invitation`, { cache: 'no-store' }) : null))
      .then((r) => alive && r?.ok && setIsHost(true))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [slug]);
  if (!isHost) return null;
  return (
    <a
      href={`/dashboard/${encodeURIComponent(slug)}?tab=thiep`}
      className="fixed bottom-4 left-4 z-[60] inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full bg-slate-950/90 px-4 text-sm font-bold text-white shadow-lg backdrop-blur hover:bg-slate-900"
    >
      <PencilLine className="h-4 w-4" /> Thiệp của bạn · Sửa thiệp
    </a>
  );
}
