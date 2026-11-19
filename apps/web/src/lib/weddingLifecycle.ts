import type { WeddingStatus, WeddingTier } from '@dco/shared';
import { calendarDaysFrom } from './adminFormat';

/**
 * Where a wedding room sits in its life: draft → trial → 3D hall → the seven days
 * after the wedding → permanent 2D memorial. Derived from status plus dates, because
 * a published hall whose wedding day has passed is already in its grace week.
 */

export const LIFECYCLE_STAGES = ['Nháp', 'Dùng thử', 'Sảnh 3D', 'Sau ngày cưới', 'Kỷ niệm 2D'] as const;

export type LifecycleTone = 'neutral' | 'trial' | 'live' | 'grace' | 'archived' | 'halted';

export interface LifecycleView {
  /** Index into LIFECYCLE_STAGES, or -1 for the always-on public plaza */
  stage: number;
  label: string;
  detail: string;
  tone: LifecycleTone;
  /** The room stopped at this stage instead of moving on (expired trial) */
  halted: boolean;
}

export function describeLifecycle(
  wedding: {
    tier: WeddingTier;
    status: WeddingStatus;
    weddingDate: string;
    trialExpiresAt: string | null;
    archiveAt: string | null;
  },
  now: Date
): LifecycleView {
  if (wedding.tier === 'PUBLIC_PLAZA') {
    return { stage: -1, label: 'Mở 24/7', detail: 'Quảng trường cộng đồng', tone: 'live', halted: false };
  }

  const weddingDay = calendarDaysFrom(wedding.weddingDate, now);

  switch (wedding.status) {
    case 'DRAFT':
      return { stage: 0, label: 'Nháp', detail: 'Chưa mở sảnh', tone: 'neutral', halted: false };

    case 'TRIAL_ACTIVE': {
      const hoursLeft = wedding.trialExpiresAt
        ? Math.max(0, Math.ceil((Date.parse(wedding.trialExpiresAt) - now.getTime()) / 3_600_000))
        : null;
      return {
        stage: 1,
        label: 'Đang dùng thử',
        detail: hoursLeft === null ? 'Chưa nâng cấp' : hoursLeft <= 1 ? 'Hết hạn trong 1 giờ' : `Còn ${hoursLeft} giờ`,
        tone: 'trial',
        halted: false,
      };
    }

    case 'EXPIRED_TRIAL':
      return { stage: 1, label: 'Hết hạn dùng thử', detail: 'Chưa nâng cấp gói', tone: 'halted', halted: true };

    case 'ARCHIVED_2D_FOREVER':
      return { stage: 4, label: 'Kỷ niệm 2D', detail: 'Đã đóng sảnh 3D', tone: 'archived', halted: false };

    case 'GRACE_PERIOD_7D':
    case 'PUBLISHED_3D':
    default: {
      if (wedding.status === 'PUBLISHED_3D' && weddingDay >= 0) {
        return {
          stage: 2,
          label: 'Sảnh 3D đang mở',
          detail:
            weddingDay === 0
              ? 'Cưới hôm nay'
              : weddingDay === 1
              ? 'Cưới ngày mai'
              : `Còn ${weddingDay} ngày tới ngày cưới`,
          tone: 'live',
          halted: false,
        };
      }
      const archiveIn = wedding.archiveAt ? calendarDaysFrom(wedding.archiveAt, now) : null;
      return {
        stage: 3,
        label: 'Sau ngày cưới',
        detail:
          archiveIn === null
            ? 'Sắp chuyển kỷ niệm 2D'
            : archiveIn <= 0
            ? 'Chuyển kỷ niệm 2D hôm nay'
            : `Chuyển kỷ niệm 2D sau ${archiveIn} ngày`,
        tone: 'grace',
        halted: false,
      };
    }
  }
}
