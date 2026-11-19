import type { Metadata } from 'next';
import { AdminWeddingsTable } from '@/components/admin/AdminWeddingsTable';
import { AdminPageHeader } from '@/components/admin/ui';
import { loadAdminDataset, toWeddingRows } from '@/lib/adminData';
import { getAdminSession } from '@/lib/adminPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Phòng cưới' };

export default async function AdminWeddingsPage({ searchParams }: { searchParams: { q?: string } }) {
  if (!(await getAdminSession())) return null;
  const rows = toWeddingRows(await loadAdminDataset());

  return (
    <>
      <AdminPageHeader
        title="Phòng cưới"
        description="Tra cứu phòng cưới theo tên cặp đôi, đường dẫn hoặc email chủ tiệc, và xem phòng đang ở giai đoạn nào."
      />
      <AdminWeddingsTable rows={rows} initialQuery={typeof searchParams.q === 'string' ? searchParams.q : ''} />
    </>
  );
}
