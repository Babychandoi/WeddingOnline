import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/adminPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Đối tác Studio — DamCuoiOnline' };

// Voucher codes are issued by the platform owner from /admin/vouchers
export default async function PartnerPage() {
  if (!(await getAdminSession())) redirect('/');
  redirect('/admin/vouchers');
}
