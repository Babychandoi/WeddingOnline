'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, Loader2, Save } from 'lucide-react';
import type { PlatformSettingKey, SettingGroup, SettingView } from '@/lib/platformSettings';
import { Panel, Pill } from './ui';

interface AdminSettingsClientProps {
  initialSettings: SettingView[];
  encryptionReady: boolean;
  /** Which groups this page edits; the rest are left untouched */
  groups: SettingGroup[];
}

const GROUP_COPY: Record<SettingGroup, { title: string; description: string }> = {
  bank: {
    title: 'Tài khoản nhận tiền nâng cấp gói',
    description:
      'Khách nâng cấp gói quét mã VietQR chuyển vào tài khoản này. Chưa cấu hình thì hệ thống tạm dừng nhận đơn trả phí.',
  },
  webhook: {
    title: 'Xác nhận thanh toán qua SePay',
    description:
      'SePay gọi về hệ thống khi tiền vào tài khoản. Chưa có khoá thật thì mọi xác nhận bị từ chối để chống giả mạo thanh toán.',
  },
  storage: {
    title: 'Cloudflare R2',
    description: 'Để trống để lưu ảnh cưới và photobooth trên ổ đĩa máy chủ.',
  },
};

function initialDrafts(settings: SettingView[]): Record<string, string> {
  return Object.fromEntries(settings.map((s) => [s.key, s.secret ? '' : s.value]));
}

function StatusBadge({ setting, clearing }: { setting: SettingView; clearing: boolean }) {
  if (clearing) return <Pill tone="slate">Sẽ xoá khi lưu</Pill>;
  if (setting.unreadable) return <Pill tone="rose">Không giải mã được, cần nhập lại</Pill>;
  if (setting.insecure) return <Pill tone="rose">Giá trị mẫu, không an toàn</Pill>;
  if (setting.source === 'admin') return <Pill tone="emerald">Đã lưu</Pill>;
  if (setting.source === 'env') return <Pill tone="amber">Đang lấy từ .env</Pill>;
  return <Pill tone="slate">Chưa cấu hình</Pill>;
}

export const AdminSettingsClient: React.FC<AdminSettingsClientProps> = ({
  initialSettings,
  encryptionReady: initialEncryptionReady,
  groups,
}) => {
  const [settings, setSettings] = useState(initialSettings);
  const [encryptionReady, setEncryptionReady] = useState(initialEncryptionReady);
  const [drafts, setDrafts] = useState<Record<string, string>>(() => initialDrafts(initialSettings));
  const [clears, setClears] = useState<Set<PlatformSettingKey>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Read after mount so server and client render the same markup
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  const sepayWebhookUrl = `${origin}/api/webhooks/sepay`;

  const visible = settings.filter((s) => groups.includes(s.group));

  const changes = useMemo(() => {
    const set: Record<string, string> = {};
    for (const s of visible) {
      const draft = (drafts[s.key] ?? '').trim();
      if (s.secret ? draft !== '' : draft !== s.value) set[s.key] = draft;
    }
    return { set, clear: Array.from(clears) };
  }, [visible, drafts, clears]);
  const dirty = Object.keys(changes.set).length > 0 || changes.clear.length > 0;

  const toggleClear = (key: PlatformSettingKey) => {
    setClears((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(sepayWebhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be blocked
    }
  };

  const handleReset = () => {
    setDrafts(initialDrafts(settings));
    setClears(new Set());
    setErrors({});
    setErrorMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    setStatusMsg('');
    setErrorMsg('');
    setErrors({});
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setErrorMsg(
          res.status === 403
            ? 'Tài khoản này không còn quyền quản trị.'
            : data.errors
            ? 'Một số mục chưa hợp lệ, xem chi tiết bên dưới.'
            : 'Không lưu được cấu hình, vui lòng thử lại.'
        );
        return;
      }
      setSettings(data.settings);
      setEncryptionReady(data.encryptionReady);
      setDrafts(initialDrafts(data.settings));
      setClears(new Set());
      setStatusMsg('Đã lưu. Thay đổi có hiệu lực ngay.');
    } catch {
      setErrorMsg('Mất kết nối tới máy chủ, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5 pb-4">
      {!encryptionReady && visible.some((s) => s.secret) && (
        <div role="alert" className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-[13px] text-rose-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Máy chủ chưa có <code className="font-semibold">SETTINGS_ENCRYPTION_KEY</code> hợp lệ trong .env nên chưa
            thể lưu khoá bí mật. Các mục thông thường vẫn lưu được.
          </p>
        </div>
      )}

      {groups.map((group) => (
        <Panel key={group} title={GROUP_COPY[group].title} description={GROUP_COPY[group].description}>
          {group === 'webhook' && (
            <div className="mb-5 rounded-xl border border-[#EFE2C9] bg-[#FFF8EA] p-3.5">
              <p className="text-[13px] font-medium text-amber-950">
                Khai báo địa chỉ này trong SePay → Tích hợp Webhooks:
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-[#EFE2C9] bg-white px-2.5 py-1.5 text-xs text-slate-800">
                  {sepayWebhookUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E5D5B8] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-rose-300 hover:text-rose-700"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
            {visible
              .filter((s) => s.group === group)
              .map((s) => {
                const inputId = `setting-${s.key}`;
                const errorId = `${inputId}-error`;
                const helpId = `${inputId}-help`;
                const clearing = clears.has(s.key);
                const wide = s.secret || s.key === 'R2_PUBLIC_CDN_URL';
                return (
                  <div key={s.key} className={wide ? 'sm:col-span-2' : undefined}>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor={inputId} className="text-[13px] font-semibold text-slate-800">
                        {s.label}
                      </label>
                      <StatusBadge setting={s} clearing={clearing} />
                    </div>
                    <div className="flex gap-2">
                      <input
                        id={inputId}
                        type={s.secret ? 'password' : 'text'}
                        autoComplete={s.secret ? 'new-password' : 'off'}
                        spellCheck={false}
                        disabled={clearing || (s.secret && !encryptionReady)}
                        value={drafts[s.key] ?? ''}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [s.key]: e.target.value }))}
                        placeholder={
                          s.secret
                            ? s.hint
                              ? `Đã cấu hình (••••${s.hint}), để trống nếu giữ nguyên`
                              : 'Nhập khoá'
                            : s.placeholder
                        }
                        aria-invalid={Boolean(errors[s.key])}
                        aria-describedby={errors[s.key] ? errorId : s.help ? helpId : undefined}
                        className="w-full min-w-0 rounded-lg border border-[#DCCDB4] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:bg-[#FBF7F0] disabled:text-slate-500 aria-[invalid=true]:border-rose-500"
                      />
                      {s.secret && s.source === 'admin' && (
                        <button
                          type="button"
                          onClick={() => toggleClear(s.key)}
                          className="shrink-0 rounded-lg border border-[#DCCDB4] bg-white px-3 text-[13px] font-semibold text-slate-700 transition-colors hover:border-rose-300 hover:text-rose-700"
                        >
                          {clearing ? 'Hoàn tác' : 'Xoá'}
                        </button>
                      )}
                    </div>
                    {errors[s.key] ? (
                      <p id={errorId} className="mt-1.5 text-xs font-semibold text-rose-700">
                        {errors[s.key]}
                      </p>
                    ) : (
                      s.help && (
                        <p id={helpId} className="mt-1.5 text-xs text-slate-600">
                          {s.help}
                        </p>
                      )
                    )}
                  </div>
                );
              })}
          </div>
        </Panel>
      ))}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-[#E5D5B8] bg-white/95 px-4 py-3 shadow-[0_12px_32px_-12px_rgba(91,22,38,0.25)] backdrop-blur">
        <button
          type="submit"
          disabled={!dirty || saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu thay đổi
        </button>
        {dirty && !saving && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Huỷ
          </button>
        )}
        <span role="status" className="text-[13px] font-medium">
          {errorMsg ? (
            <span className="text-rose-700">{errorMsg}</span>
          ) : statusMsg ? (
            <span className="text-emerald-700">{statusMsg}</span>
          ) : dirty ? (
            <span className="text-amber-900">Có thay đổi chưa lưu</span>
          ) : (
            <span className="text-slate-500">Chưa có thay đổi</span>
          )}
        </span>
      </div>
    </form>
  );
};
