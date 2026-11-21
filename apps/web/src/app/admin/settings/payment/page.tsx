import type { Metadata } from 'next';
import { AdminSettingsClient } from '@/components/admin/AdminSettingsClient';
import { AdminPageHeader } from '@/components/admin/ui';
import { getAdminSession } from '@/lib/adminPage';
import { describePlatformSettings, isSettingsEncryptionReady } from '@/lib/platformSettings';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Thanh toán' };

export default async function AdminPaymentSettingsPage() {
  if (!(await getAdminSession())) return null;

  return (
    <>
      <AdminPageHeader
        title="Thanh toán"
        description="Tài khoản nhận tiền khi khách nâng cấp gói hoặc mua pháo hoa, khoá SePay dùng để tự động xác nhận chuyển khoản, và giá pháo hoa."
      />
      <AdminSettingsClient
        initialSettings={await describePlatformSettings()}
        encryptionReady={isSettingsEncryptionReady()}
        groups={['bank', 'webhook', 'fireworks']}
      />
    </>
  );
}
