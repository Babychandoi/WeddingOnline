import type { Metadata } from 'next';
import { AdminAccessGate } from '@/components/admin/AdminAccessGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { isPlatformAdmin } from '@/lib/adminAuth';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Quản trị — DamCuoiOnline', template: '%s · Quản trị DamCuoiOnline' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getSessionFromRequest();
  if (!auth) return <AdminAccessGate mode="login" />;
  if (!isPlatformAdmin(auth)) {
    return <AdminAccessGate mode="forbidden" displayName={auth.user.displayName} />;
  }

  return (
    <AdminShell adminName={auth.user.displayName} adminEmail={auth.user.email ?? ''}>
      {children}
    </AdminShell>
  );
}
