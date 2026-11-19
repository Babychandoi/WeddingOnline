import { redirect } from 'next/navigation';

// Settings are split by area in the admin rail; keep old links working
export default function AdminSettingsIndex() {
  redirect('/admin/settings/payment');
}
