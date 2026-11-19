'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ShieldAlert } from 'lucide-react';
import { OAuthModal } from '../hall/OAuthModal';

interface AdminAccessGateProps {
  mode: 'login' | 'forbidden';
  displayName?: string;
}

export const AdminAccessGate: React.FC<AdminAccessGateProps> = ({ mode, displayName }) => {
  const router = useRouter();

  if (mode === 'login') {
    return (
      <OAuthModal
        title="Quản Trị Nền Tảng"
        subtitle="Đăng nhập bằng tài khoản Google của quản trị viên để cấu hình thanh toán và lưu trữ."
        onAuthenticated={() => router.refresh()}
      />
    );
  }

  const handleSwitchAccount = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8] p-4">
      <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-slate-900">Không Có Quyền Quản Trị</h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Tài khoản <strong className="text-slate-900">{displayName}</strong> không nằm trong danh sách quản
          trị viên nền tảng.
        </p>
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" /> Đăng nhập bằng tài khoản khác
          </button>
          <Link href="/" className="block text-xs font-semibold text-slate-500 hover:underline">
            Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
};
