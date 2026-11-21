import type { Metadata } from 'next';
import { AdminOrdersTable, type OrderStatusFilter } from '@/components/admin/AdminOrdersTable';
import { AdminPageHeader } from '@/components/admin/ui';
import { AdminFireworksPanel } from '@/components/admin/AdminFireworksPanel';
import { dbRepo } from '@dco/database';
import { loadAdminDataset, toOrderRows } from '@/lib/adminData';
import { getAdminSession } from '@/lib/adminPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Đơn hàng' };

const STATUSES: OrderStatusFilter[] = ['ALL', 'PENDING', 'PAID', 'CANCELLED'];

export default async function AdminOrdersPage({ searchParams }: { searchParams: { status?: string } }) {
  if (!(await getAdminSession())) return null;
  const dataset = await loadAdminDataset();
  const rows = toOrderRows(dataset);
  const fireworkOrders = await dbRepo.listFireworkOrders();
  const initialStatus = STATUSES.find((s) => s === searchParams.status) ?? 'ALL';

  return (
    <>
      <AdminPageHeader
        title="Đơn hàng"
        description="Đơn nâng cấp gói và pháo hoa. Đơn chuyển sang Đã thanh toán khi SePay xác nhận tiền vào tài khoản, hoặc ngay lập tức với voucher 100%."
      />
      <AdminOrdersTable rows={rows} initialStatus={initialStatus} />
      <AdminFireworksPanel orders={fireworkOrders} weddings={dataset.weddings} />
    </>
  );
}
