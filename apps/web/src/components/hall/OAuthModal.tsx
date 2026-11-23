'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Crown, DoorOpen, Loader2 } from 'lucide-react';
import type { AuthProvider } from '@dco/shared';

interface OAuthModalProps {
  title?: string;
  subtitle?: string;
  onAuthenticated: (user: { id: string; displayName: string; provider: AuthProvider }) => void;
  /** Shown over the hall (not as a gate): a way back instead of the home link */
  onClose?: () => void;
}

const GOOGLE_OAUTH_ERRORS: Record<string, string> = {
  invalid_state: 'Phiên xác thực Google đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.',
  exchange_failed: 'Không đổi được mã xác thực với Google. Hãy kiểm tra Client Secret & Redirect URI.',
  google_not_configured: 'Chưa điền GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET vào file .env.',
  access_denied: 'Bạn đã hủy cấp quyền đăng nhập Google.',
  account_locked: 'Tài khoản này đã bị khoá. Vui lòng liên hệ DamCuoiOnline nếu bạn cho rằng đây là nhầm lẫn.',
};

export const OAuthModal: React.FC<OAuthModalProps> = ({
  title = 'Đăng Nhập Dự Tiệc Cưới',
  subtitle = 'Phòng cưới yêu cầu đăng nhập bằng tài khoản Google để bảo vệ không gian riêng tư của Cô Dâu & Chú Rể.',
  onAuthenticated,
  onClose,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const [devAuthEnabled, setDevAuthEnabled] = useState(false);
  const [redirectUriHint, setRedirectUriHint] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const code = new URLSearchParams(window.location.search).get('oauthError');
      if (code) {
        setError(GOOGLE_OAUTH_ERRORS[code] || `Lỗi đăng nhập Google (${code})`);
      }
    }

    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => {
        if (d.oauthConfigured) {
          setGoogleConfigured(Boolean(d.oauthConfigured.google));
        }
        setDevAuthEnabled(d.devAuthEnabled === true);
        if (d.googleRedirectUri) {
          setRedirectUriHint(d.googleRedirectUri);
        }
      })
      .catch(() => {});
  }, []);

  const performDevLogin = async (payload: {
    provider: AuthProvider;
    providerAccountId?: string;
    displayName: string;
  }) => {
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Đăng nhập thất bại');
    onAuthenticated(data.user);
  };

  const handleDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await performDevLogin({
        provider: 'GOOGLE',
        displayName: displayName.trim() || 'Khách Quý',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoOwnerLogin = async () => {
    setDemoLoading(true);
    try {
      await performDevLogin({
        provider: 'ZALO',
        providerAccountId: 'zalo_demo_minh',
        displayName: 'Chú Rể Minh Nguyễn',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi đăng nhập demo');
    } finally {
      setDemoLoading(false);
    }
  };

  const currentPath =
    typeof window !== 'undefined'
      ? (() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('oauthError');
          return url.pathname + url.search;
        })()
      : '/';

  return (
    <div
      data-nocturne-auth="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#120911]/75 p-4 backdrop-blur-md"
    >
      {/* Nocturne atmospheric wedding-night bokeh orbs behind frosted card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(38% 36% at 24% 26%, rgba(251,191,36,0.22), transparent 70%), radial-gradient(42% 40% at 78% 72%, rgba(225,29,72,0.24), transparent 72%)',
        }}
      />
      <div className="dco-fade-up relative z-[1] w-full max-w-md rounded-3xl border border-amber-200/80 bg-[#FFFDF8]/92 p-6 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.65)] ring-1 ring-white/50 backdrop-blur-xl sm:p-7">
        <div className="mb-4 flex items-center justify-between">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[36px] items-center gap-1 text-xs font-semibold text-rose-800/80 transition hover:text-rose-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Quay lại sảnh
            </button>
          ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800/80 transition hover:text-rose-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Trang chủ
          </Link>
          )}
          <span className="text-[11px] font-medium text-amber-800">DamCuoiOnline.vn</span>
        </div>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300 bg-rose-700 text-amber-200 shadow-md">
            <svg viewBox="0 0 36 36" className="h-7 w-7" fill="currentColor" aria-hidden="true">
              <path d="M9 7h4v5h3v3h-3v4h4v3h-4v7H9v-7H6v-3h3v-4H6v-3h3V7zm14 0h4v5h3v3h-3v4h3v3h-3v7h-4v-7h-4v-3h4v-4h-3v-3h3V7z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{subtitle}</p>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {error}
          </p>
        )}

        {/* Primary Google OAuth 2.0 Button with Portal subtle opening-door cue */}
        <a
          href={`/api/auth/oauth/google?next=${encodeURIComponent(currentPath)}`}
          className={`group flex w-full items-center justify-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5 ${
            googleConfigured
              ? 'border-slate-300 bg-white text-slate-900 hover:border-rose-300 hover:bg-rose-50/40 hover:shadow-md'
              : 'border-amber-200 bg-white/80 text-slate-700 hover:bg-amber-50/40'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.6H12z"
            />
            <path
              fill="#34A853"
              d="M3.6 7.4l3.2 2.4C7.7 7.8 9.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 8.3 2.5 5.1 4.6 3.6 7.4z"
            />
            <path
              fill="#FBBC05"
              d="M12 21.5c2.5 0 4.7-.8 6.3-2.3l-2.9-2.4c-.8.6-1.9 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1l-3.2 2.5c1.5 3.1 4.8 5.3 8.8 5.3z"
            />
            <path
              fill="#4285F4"
              d="M21.1 12.3c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.3-1.1 2.4-2.1 3.1l2.9 2.4c1.7-1.6 2.8-4 2.8-7.8z"
            />
          </svg>
          <span>Tiếp tục bằng Tài khoản Google</span>
          <DoorOpen className="h-4 w-4 text-rose-600/80 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-110" />
        </a>

        {googleConfigured === false && (
          <p className="mt-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-[11px] leading-relaxed text-amber-950">
            Chưa điền <code className="font-bold">GOOGLE_CLIENT_ID</code> vào <code className="font-bold">.env</code>
            {redirectUriHint ? ` (Callback: ${redirectUriHint})` : ''}.
            {devAuthEnabled && ' Bạn có thể dùng tài khoản thử nghiệm cục bộ bên dưới trong lúc chờ khóa Google.'}
          </p>
        )}

        {/* Dev / Local Quick Test Fallback — the server disables it on every production deployment */}
        {devAuthEnabled && (
          <div className="mt-4 border-t border-amber-200/80 pt-4">
            <p className="mb-2.5 text-center text-[11px] font-semibold text-slate-500">
              Đăng nhập nhanh môi trường phát triển (Local Dev)
            </p>
            <form onSubmit={handleDevSubmit} className="space-y-2.5">
              <input
                id="oauth-display-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nhập tên hiển thị (VD: Anh Tuấn - Hà Nội)"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={loading || demoLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow transition hover:bg-rose-500 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {loading ? 'Đang vào...' : 'Vào thử nghiệm nhanh (Dev)'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleDemoOwnerLogin}
              disabled={loading || demoLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
            >
              {demoLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Crown className="h-3.5 w-3.5 text-amber-600" />
              )}
              Vào nhanh Chủ Tiệc Demo (Chú Rể Minh Nguyễn)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
