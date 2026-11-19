import React from 'react';
import type { WeddingTier } from '@dco/shared';
import { TIER_LABELS } from '@/lib/adminFormat';
import { LIFECYCLE_STAGES, type LifecycleTone, type LifecycleView } from '@/lib/weddingLifecycle';

/* Shared building blocks for the admin console. Server- and client-safe (no hooks). */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-balance font-serif text-[2rem] font-bold leading-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cx(
        'overflow-hidden rounded-2xl border border-[#EBDFCC] bg-white shadow-[0_1px_2px_rgba(91,22,38,0.04),0_10px_28px_-16px_rgba(91,22,38,0.14)]',
        className
      )}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F2E9DA] px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-slate-600">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {/* A custom bodyClassName replaces the default padding (p-0 cannot override px-5 in Tailwind's order) */}
      <div className={bodyClassName ?? 'px-5 py-4'}>{children}</div>
    </section>
  );
}

type PillTone = 'emerald' | 'amber' | 'slate' | 'rose' | 'wine';

const PILL_TONES: Record<PillTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-900 ring-amber-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  rose: 'bg-rose-50 text-rose-800 ring-rose-200',
  wine: 'bg-[#5B1626] text-amber-100 ring-[#5B1626]',
};

export function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        PILL_TONES[tone]
      )}
    >
      {children}
    </span>
  );
}

const TIER_TONES: Record<WeddingTier, PillTone> = {
  PUBLIC_PLAZA: 'slate',
  TRIAL_24H: 'amber',
  HAPPINESS: 'rose',
  VIP_FULFILLMENT: 'wine',
};

export function TierBadge({ tier }: { tier: WeddingTier }) {
  return <Pill tone={TIER_TONES[tier]}>{TIER_LABELS[tier]}</Pill>;
}

const CURRENT_SEGMENT: Record<LifecycleTone, string> = {
  neutral: 'bg-slate-400',
  trial: 'bg-amber-500',
  live: 'bg-emerald-500',
  grace: 'bg-rose-500',
  archived: 'bg-slate-500',
  halted: 'bg-amber-600 ring-2 ring-amber-200',
};

const LABEL_TONE: Record<LifecycleTone, string> = {
  neutral: 'text-slate-700',
  trial: 'text-amber-900',
  live: 'text-emerald-800',
  grace: 'text-rose-800',
  archived: 'text-slate-600',
  halted: 'text-amber-900',
};

/**
 * The room lifecycle as a five-segment ribbon: stages already lived through in
 * invitation red, the current one in its state colour, the rest still blank.
 */
export function LifecycleTrack({ view, compact = false }: { view: LifecycleView; compact?: boolean }) {
  const description = `Vòng đời: ${view.label}. ${view.detail}`;
  return (
    <div className="flex min-w-0 items-center gap-3">
      {view.stage >= 0 ? (
        <span role="img" aria-label={description} title={description} className="flex shrink-0 items-center gap-1">
          {LIFECYCLE_STAGES.map((name, i) => (
            <span
              key={name}
              className={cx(
                'h-1.5 rounded-full transition-colors',
                i === view.stage ? cx('w-6', CURRENT_SEGMENT[view.tone]) : 'w-3.5',
                i < view.stage && 'bg-[#5B1626]/75',
                i > view.stage && 'bg-[#EADFCF]'
              )}
            />
          ))}
        </span>
      ) : (
        <span aria-hidden className="h-1.5 w-[76px] shrink-0 rounded-full bg-emerald-500/80" />
      )}
      <span className="min-w-0 leading-snug">
        <span className={cx('block text-[13px] font-semibold', LABEL_TONE[view.tone])}>{view.label}</span>
        {!compact && <span className="block text-[11px] text-slate-500">{view.detail}</span>}
      </span>
    </div>
  );
}

/**
 * The lifecycle ribbon at full scale for a single wedding: every stage named, with
 * the date that opened or closes it, the current stage in its state colour.
 */
export function LifecycleTimeline({ view, stageDates }: { view: LifecycleView; stageDates: string[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-5 sm:gap-2">
      {LIFECYCLE_STAGES.map((name, i) => {
        const current = i === view.stage;
        return (
          <li
            key={name}
            aria-current={current ? 'step' : undefined}
            className="flex items-center gap-3 sm:block"
          >
            <span
              aria-hidden
              className={cx(
                'block h-2 w-10 shrink-0 rounded-full sm:w-full',
                current && CURRENT_SEGMENT[view.tone],
                i < view.stage && 'bg-[#5B1626]/75',
                i > view.stage && 'bg-[#EADFCF]'
              )}
            />
            <span
              className={cx(
                'text-[13px] font-semibold sm:mt-2.5 sm:block',
                current ? LABEL_TONE[view.tone] : i < view.stage ? 'text-slate-700' : 'text-slate-500'
              )}
            >
              {name}
              {current && <span className="sr-only"> (giai đoạn hiện tại)</span>}
            </span>
            <span className="ml-auto text-xs tabular-nums text-slate-500 sm:ml-0 sm:mt-0.5 sm:block">
              {stageDates[i] || '—'}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Label / value rows for a facts panel */
export function FactList({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <dl className="-my-1">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[#F5EEE2] py-3 last:border-b-0"
        >
          <dt className="text-[13px] text-slate-600">{item.label}</dt>
          <dd className="min-w-0 text-right text-sm text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({
  title,
  children,
  icon,
}: {
  title: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && <div className="mb-3 text-[#B48A5A]">{icon}</div>}
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {children && <div className="mt-1 max-w-sm text-[13px] text-slate-600">{children}</div>}
    </div>
  );
}

/** Table cell / header classes shared by every admin list */
export const tableStyles = {
  wrap: 'admin-scroll-x overflow-x-auto',
  table: 'w-full border-collapse text-left text-[13px]',
  th: 'whitespace-nowrap border-b border-[#F2E9DA] bg-[#FFFCF6] px-4 py-2.5 text-xs font-semibold text-slate-500 first:pl-5 last:pr-5',
  td: 'border-b border-[#F5EEE2] px-4 py-3 align-middle first:pl-5 last:pr-5',
  row: 'group transition-colors hover:bg-[#FFF9EF]',
  /** First column stays pinned while a wide table scrolls sideways on small screens */
  stickyTh: 'max-md:sticky max-md:left-0 max-md:z-[1] max-md:shadow-[1px_0_0_#F2E9DA]',
  stickyTd:
    'max-md:sticky max-md:left-0 max-md:z-[1] max-md:bg-white max-md:shadow-[1px_0_0_#F2E9DA] max-md:group-hover:bg-[#FFF9EF]',
};
