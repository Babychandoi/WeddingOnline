import type { Metadata } from 'next';
import { dbRepo } from '@dco/database';
import { AdminVouchersClient } from '@/components/admin/AdminVouchersClient';
import { AdminPageHeader } from '@/components/admin/ui';
import { formatDate } from '@/lib/adminFormat';
import { getAdminSession } from '@/lib/adminPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Mã voucher' };

export default async function AdminVouchersPage() {
  if (!(await getAdminSession())) return null;
  const vouchers = (await dbRepo.listVouchers()).map((v) => ({ ...v, createdLabel: formatDate(v.createdAt) }));

  return (
    <>
      <AdminPageHeader
        title="Mã voucher"
        description="Mã ưu đãi cho studio đối tác. Tắt một mã là có hiệu lực ngay; lượt đã dùng vẫn được giữ."
      />
      <AdminVouchersClient initialVouchers={vouchers} />
    </>
  );
}
