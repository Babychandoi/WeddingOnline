import { dbRepo } from '@dco/database';
import {
  decryptSettingValue,
  encryptSettingValue,
  isHardenedProduction,
  isInsecureSecret,
  requireSecret,
  resolveSecret,
} from '@dco/shared/server';
import { getRuntimeEnv } from './runtimeEnv';

/**
 * Platform-wide settings managed from /admin/settings and stored in the database.
 * Resolution order per key: value saved by an admin → legacy .env value → unset.
 */

export type PlatformSettingKey =
  | 'PLATFORM_BANK_BIN'
  | 'PLATFORM_BANK_ACCOUNT'
  | 'PLATFORM_BANK_NAME'
  | 'PLATFORM_SEPAY_API_KEY'
  | 'R2_ACCOUNT_ID'
  | 'R2_ACCESS_KEY_ID'
  | 'R2_SECRET_ACCESS_KEY'
  | 'R2_BUCKET_NAME'
  | 'R2_PUBLIC_CDN_URL';

export type SettingGroup = 'bank' | 'webhook' | 'storage';

export interface SettingDefinition {
  key: PlatformSettingKey;
  group: SettingGroup;
  label: string;
  secret: boolean;
  placeholder?: string;
  help?: string;
  /** Returns an error message, or null when the value is acceptable */
  validate: (value: string) => string | null;
}

const maxLen = (n: number) => (v: string) => (v.length <= n ? null : `Tối đa ${n} ký tự`);

export const PLATFORM_SETTING_DEFS: SettingDefinition[] = [
  {
    key: 'PLATFORM_BANK_BIN',
    group: 'bank',
    label: 'Mã BIN ngân hàng',
    secret: false,
    placeholder: '970422',
    help: 'Mã 6 số theo chuẩn Napas (VD: MB Bank 970422, Vietcombank 970436).',
    validate: (v) => (/^\d{6}$/.test(v) ? null : 'Mã BIN gồm đúng 6 chữ số'),
  },
  {
    key: 'PLATFORM_BANK_ACCOUNT',
    group: 'bank',
    label: 'Số tài khoản',
    secret: false,
    validate: (v) => (/^\d{6,19}$/.test(v) ? null : 'Số tài khoản chỉ gồm 6–19 chữ số'),
  },
  {
    key: 'PLATFORM_BANK_NAME',
    group: 'bank',
    label: 'Tên chủ tài khoản',
    secret: false,
    placeholder: 'CONG TY TNHH ...',
    validate: maxLen(100),
  },
  {
    key: 'PLATFORM_SEPAY_API_KEY',
    group: 'webhook',
    label: 'SePay API Key',
    secret: true,
    help: 'Lấy trong SePay → Tích hợp Webhooks. SePay gửi kèm khóa này ở header Authorization.',
    validate: (v) =>
      isInsecureSecret(v, 16) ? 'Khóa quá ngắn hoặc là giá trị mẫu (cần ≥ 16 ký tự)' : null,
  },
  {
    key: 'R2_ACCOUNT_ID',
    group: 'storage',
    label: 'Cloudflare Account ID',
    secret: false,
    validate: (v) => (/^[A-Za-z0-9]{16,64}$/.test(v) ? null : 'Account ID không hợp lệ'),
  },
  {
    key: 'R2_ACCESS_KEY_ID',
    group: 'storage',
    label: 'R2 Access Key ID',
    secret: true,
    validate: maxLen(128),
  },
  {
    key: 'R2_SECRET_ACCESS_KEY',
    group: 'storage',
    label: 'R2 Secret Access Key',
    secret: true,
    validate: maxLen(256),
  },
  {
    key: 'R2_BUCKET_NAME',
    group: 'storage',
    label: 'Tên bucket',
    secret: false,
    placeholder: 'damcuoionline-assets',
    validate: (v) =>
      /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(v) ? null : 'Chỉ gồm chữ thường, số và dấu gạch ngang',
  },
  {
    key: 'R2_PUBLIC_CDN_URL',
    group: 'storage',
    label: 'Địa chỉ CDN công khai',
    secret: false,
    placeholder: 'https://cdn.ten-mien.vn',
    help: 'Để trống để dùng địa chỉ mặc định *.r2.dev của bucket.',
    validate: (v) => {
      try {
        return new URL(v).protocol === 'https:' ? null : 'Phải là địa chỉ https://';
      } catch {
        return 'Địa chỉ không hợp lệ';
      }
    },
  },
];

const DEFS_BY_KEY = new Map(PLATFORM_SETTING_DEFS.map((d) => [d.key, d]));

interface StoredSetting {
  /** null when the stored secret can no longer be decrypted (encryption key changed) */
  value: string | null;
  updatedAt: string;
}

const CACHE_TTL_MS = 15_000;
let cache: { loadedAt: number; values: Map<PlatformSettingKey, StoredSetting> } | null = null;

function encryptionKey(): string {
  return requireSecret('SETTINGS_ENCRYPTION_KEY', getRuntimeEnv('SETTINGS_ENCRYPTION_KEY'));
}

async function loadStoredSettings(): Promise<Map<PlatformSettingKey, StoredSetting>> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.values;

  const values = new Map<PlatformSettingKey, StoredSetting>();
  const masterKey = resolveSecret('SETTINGS_ENCRYPTION_KEY', getRuntimeEnv('SETTINGS_ENCRYPTION_KEY'));
  for (const row of await dbRepo.listPlatformSettings()) {
    if (!DEFS_BY_KEY.has(row.key as PlatformSettingKey)) continue;
    let value: string | null = row.value;
    if (row.isSecret) {
      // Missing/weak key on production: treat as unreadable instead of failing every request
      value = masterKey ? decryptSettingValue(row.value, masterKey) : null;
      if (value === null) {
        console.error(`[settings] Cannot decrypt ${row.key}: SETTINGS_ENCRYPTION_KEY changed? Re-enter it in /admin/settings.`);
      }
    }
    values.set(row.key as PlatformSettingKey, { value, updatedAt: row.updatedAt });
  }
  cache = { loadedAt: Date.now(), values };
  return values;
}

export async function getPlatformSetting(key: PlatformSettingKey): Promise<string | undefined> {
  const stored = (await loadStoredSettings()).get(key);
  if (stored?.value) return stored.value;
  return getRuntimeEnv(key);
}

export interface PlatformBankAccount {
  bankBin: string;
  accountNumber: string;
  accountName: string;
}

/** Account that receives plan payments; null on production until an admin configures it. */
export async function getPlatformBankAccount(): Promise<PlatformBankAccount | null> {
  const [bankBin, accountNumber, accountName] = await Promise.all([
    getPlatformSetting('PLATFORM_BANK_BIN'),
    getPlatformSetting('PLATFORM_BANK_ACCOUNT'),
    getPlatformSetting('PLATFORM_BANK_NAME'),
  ]);
  if (bankBin && accountNumber) {
    return { bankBin, accountNumber, accountName: accountName || '' };
  }
  if (isHardenedProduction()) return null;
  return { bankBin: '970422', accountNumber: '0123456789', accountName: 'CONG TY DAMCUOIONLINE (DEV)' };
}

export type SettingSource = 'admin' | 'env' | 'unset';

export interface SettingView {
  key: PlatformSettingKey;
  group: SettingGroup;
  label: string;
  secret: boolean;
  placeholder?: string;
  help?: string;
  source: SettingSource;
  /** Current value for non-secret fields only — secrets are never sent to the browser */
  value: string;
  /** Last 4 characters of a configured secret */
  hint: string;
  /** Configured, but a development/weak value */
  insecure: boolean;
  /** Stored in the database but unreadable with the current encryption key */
  unreadable: boolean;
  updatedAt: string | null;
}

export async function describePlatformSettings(): Promise<SettingView[]> {
  const stored = await loadStoredSettings();
  return PLATFORM_SETTING_DEFS.map((def) => {
    const row = stored.get(def.key);
    const fromDb = row?.value ?? undefined;
    const fromEnv = getRuntimeEnv(def.key);
    const effective = fromDb || fromEnv || '';
    const source: SettingSource = fromDb ? 'admin' : fromEnv ? 'env' : 'unset';
    return {
      key: def.key,
      group: def.group,
      label: def.label,
      secret: def.secret,
      placeholder: def.placeholder,
      help: def.help,
      source,
      value: def.secret ? '' : effective,
      hint: def.secret && effective ? effective.slice(-4) : '',
      insecure: def.secret && Boolean(effective) && def.validate(effective) !== null,
      unreadable: Boolean(row && row.value === null),
      updatedAt: row?.updatedAt ?? null,
    };
  });
}

export function isSettingsEncryptionReady(): boolean {
  return resolveSecret('SETTINGS_ENCRYPTION_KEY', getRuntimeEnv('SETTINGS_ENCRYPTION_KEY')) !== null;
}

/**
 * Applies an admin edit. `set`: new values (an empty string clears a plain field and
 * leaves a secret unchanged). `clear`: keys to remove, falling back to .env / unset.
 */
export async function updatePlatformSettings(
  input: { set?: Record<string, unknown>; clear?: unknown[] },
  actorId: string
): Promise<{ ok: true } | { ok: false; errors: Record<string, string> }> {
  const errors: Record<string, string> = {};
  const entries: Array<{ key: string; value: string | null; isSecret: boolean }> = [];

  for (const [key, raw] of Object.entries(input.set ?? {})) {
    const def = DEFS_BY_KEY.get(key as PlatformSettingKey);
    if (!def) {
      errors[key] = 'Khóa cấu hình không hợp lệ';
      continue;
    }
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value) {
      if (!def.secret) entries.push({ key, value: null, isSecret: false });
      continue;
    }
    const problem = def.validate(value);
    if (problem) {
      errors[key] = problem;
      continue;
    }
    if (def.secret && !isSettingsEncryptionReady()) {
      errors[key] = 'Máy chủ chưa có SETTINGS_ENCRYPTION_KEY nên chưa thể lưu khóa bí mật';
      continue;
    }
    entries.push({
      key,
      value: def.secret ? encryptSettingValue(value, encryptionKey()) : value,
      isSecret: def.secret,
    });
  }

  for (const key of input.clear ?? []) {
    if (typeof key === 'string' && DEFS_BY_KEY.has(key as PlatformSettingKey)) {
      entries.push({ key, value: null, isSecret: DEFS_BY_KEY.get(key as PlatformSettingKey)!.secret });
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  if (entries.length > 0) {
    await dbRepo.savePlatformSettings({ entries, updatedById: actorId });
    cache = null;
  }
  return { ok: true };
}
