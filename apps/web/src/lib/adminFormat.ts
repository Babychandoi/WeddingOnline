import type { WeddingStatus, WeddingTier } from '@dco/shared';

/**
 * Formatting for the admin console. Everything is rendered in Vietnam time so the
 * server (UTC in Docker) and the browser always print the same thing.
 */

const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const DAY_MS = 24 * 60 * 60 * 1000;

const vndFormatter = new Intl.NumberFormat('vi-VN');
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: TIME_ZONE,
});
const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TIME_ZONE,
});
const longDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: TIME_ZONE,
});
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: TIME_ZONE,
});

export function formatVnd(amount: number): string {
  return `${vndFormatter.format(amount)} ₫`;
}

export function formatDate(iso: string | null | undefined): string {
  return iso ? dateFormatter.format(new Date(iso)) : '—';
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${timeFormatter.format(d)} · ${dateFormatter.format(d)}`;
}

export function formatLongDate(date: Date): string {
  const text = longDateFormatter.format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Calendar-day difference in Vietnam time (0 = today, 1 = tomorrow, -1 = yesterday) */
export function calendarDaysFrom(iso: string, now: Date): number {
  const target = Date.parse(dayKeyFormatter.format(new Date(iso)));
  const today = Date.parse(dayKeyFormatter.format(now));
  return Math.round((target - today) / DAY_MS);
}

export function describeDayOffset(days: number): string {
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Ngày mai';
  if (days === -1) return 'Hôm qua';
  return days > 0 ? `Còn ${days} ngày` : `${-days} ngày trước`;
}

/** Lower-cases and strips Vietnamese diacritics so "minh va linh" finds "Minh và Linh" */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export const TIER_LABELS: Record<WeddingTier, string> = {
  PUBLIC_PLAZA: 'Quảng trường',
  TRIAL_24H: 'Dùng thử 24h',
  HAPPINESS: 'Hạnh Phúc',
  VIP_FULFILLMENT: 'Viên Mãn VIP',
};

export const ORDER_STATUS_LABELS = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã huỷ',
} as const;

export const ROLE_LABELS = {
  OWNER: 'Chủ tiệc',
  BRIDE: 'Cô dâu',
  GROOM: 'Chú rể',
  MC: 'MC',
  GUEST: 'Khách',
} as const;

export const SIDE_LABELS = {
  GROOM_SIDE: 'Nhà trai',
  BRIDE_SIDE: 'Nhà gái',
  FRIEND: 'Bạn bè',
  COLLEAGUE: 'Đồng nghiệp',
} as const;

export const MODERATION_LABELS = {
  ACTIVE: 'Bình thường',
  MUTED: 'Bị tắt tiếng',
  BANNED: 'Bị chặn',
} as const;

/** "•••• 6789" — enough for support to confirm an account, never the full number */
export function maskAccountNumber(accountNo: string | null | undefined): string {
  if (!accountNo) return '';
  return `•••• ${accountNo.slice(-4)}`;
}

export const PROVIDER_LABELS = {
  GOOGLE: 'Google',
  ZALO: 'Zalo',
  FACEBOOK: 'Facebook',
} as const;

export type { WeddingStatus, WeddingTier };
