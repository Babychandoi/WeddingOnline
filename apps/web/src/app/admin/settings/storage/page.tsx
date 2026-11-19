import type { Metadata } from 'next';
import { AdminSettingsClient } from '@/components/admin/AdminSettingsClient';
import { AdminPageHeader } from '@/components/admin/ui';
import { getAdminSession } from '@/lib/adminPage';
import { describePlatformSettings, isSettingsEncryptionReady } from '@/lib/platformSettings';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Lưu trữ ảnh' };

export default async function AdminStorageSettingsPage() {
  if (!(await getAdminSession())) return null;

  return (
    <>
      <AdminPageHeader
        title="Lưu trữ ảnh"
        description="Nơi lưu ảnh cưới, ảnh photobooth và ảnh khách tải lên."
      />
      <AdminSettingsClient
        initialSettings={await describePlatformSettings()}
        encryptionReady={isSettingsEncryptionReady()}
        groups={['storage']}
      />
    </>
  );
}
