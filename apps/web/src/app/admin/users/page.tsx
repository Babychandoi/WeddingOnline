import type { Metadata } from 'next';
import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { AdminPageHeader } from '@/components/admin/ui';
import { isPlatformAdminEmail } from '@/lib/adminAuth';
import { loadAdminDataset, toUserRows } from '@/lib/adminData';
import { getAdminSession } from '@/lib/adminPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Người dùng' };

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const admin = await getAdminSession();
  if (!admin) return null;
  const rows = toUserRows(
    await loadAdminDataset(),
    (u) => u.id === admin.user.id || isPlatformAdminEmail(u.email)
  );

  return (
    <>
      <AdminPageHeader
        title="Người dùng"
        description="Mọi tài khoản đã đăng nhập: chủ tiệc và khách mời. Khoá một tài khoản sẽ đăng xuất người đó, chặn đăng nhập lại và mời họ ra khỏi mọi sảnh đang mở."
      />
      <AdminUsersTable rows={rows} initialQuery={typeof searchParams.q === 'string' ? searchParams.q : ''} />
    </>
  );
}
