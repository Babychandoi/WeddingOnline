import { formatLunarVi, lunarOfInstant } from '@dco/shared';

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

/** Wall-clock parts of an instant in Vietnam (UTC+7) */
export function vnParts(iso: string) {
  const t = Date.parse(iso);
  const d = new Date((Number.isFinite(t) ? t : Date.now()) + 7 * 3600 * 1000);
  return {
    day: d.getUTCDate(),
    month: d.getUTCMonth() + 1,
    year: d.getUTCFullYear(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    weekday: WEEKDAYS[d.getUTCDay()],
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function vnTime(iso: string): string {
  const p = vnParts(iso);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function vnDate(iso: string): string {
  const p = vnParts(iso);
  return `${pad(p.day)}.${pad(p.month)}.${p.year}`;
}

/** "Tức ngày 1 tháng 11 năm Bính Ngọ" */
export function lunarLine(iso: string): string {
  const s = formatLunarVi(iso);
  return s ? `Tức ngày ${s}` : '';
}

/** "1/11 âm lịch" */
export function lunarShort(iso: string): string {
  const l = lunarOfInstant(iso);
  return l ? `${l.day}/${l.month}${l.leap ? ' nhuận' : ''} âm lịch` : '';
}

/** Google Calendar "add event" link (2 hours long) */
export function calendarLink(title: string, startIso: string, location: string, details: string): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + 2 * 3600 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const q = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${fmt(start)}/${fmt(end)}`, location, details });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export function formatVnd(n: number): string {
  return `${n.toLocaleString('vi-VN')}đ`;
}
