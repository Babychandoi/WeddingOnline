'use client';

/**
 * Gói 2 — Original editorial showcase motion components for DamCuoiOnline:
 * - FannedInvitationDeck (7-card fanned arc with scroll-driven spread & hover lift, inspired by Gesso)
 * - StyleAccordionShowcase (4-panel horizontal hover-expanding showcase, inspired by Moonart)
 * - OpalFilterTabs (elastic sliding active pill filter bar, inspired by Opal)
 * - ScrySearchInput (telescoping pill search bar, inspired by Scry)
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Sparkles, X } from 'lucide-react';
import { INVITATION_TEMPLATES, type InvitationTemplateId } from '@dco/shared';
import { CardFace } from '@/components/invitation/CardFace';
import { SAMPLE_COUPLE } from '@/components/invitation/sampleInvitation';

/* ───────────────────────── 1. FannedInvitationDeck (Gesso) ───────────────────────── */

const DECK_CARDS: Array<{ id: InvitationTemplateId; tag: string; tagBg: string; tagText: string }> = [
  { id: 'song-hy-do', tag: '@SongHỷĐỏ', tagBg: '#9f1239', tagText: '#fff7ed' },
  { id: 'sen-hong', tag: '@SenHồng', tagBg: '#be185d', tagText: '#fff1f2' },
  { id: 'mau-nuoc', tag: '@MàuNước', tagBg: '#9d174d', tagText: '#fdf2f8' },
  { id: 'la-xanh', tag: '@LáXanh', tagBg: '#365314', tagText: '#f7fee7' },
  { id: 'baroque-vang', tag: '@BaroqueVàng', tagBg: '#1c1917', tagText: '#fde68a' },
  { id: 'bien-xanh', tag: '@BiểnXanh', tagBg: '#0369a1', tagText: '#f0f9ff' },
  { id: 'tap-chi', tag: '@TạpChí', tagBg: '#18181b', tagText: '#ffffff' },
];

export function FannedInvitationDeck({
  compact = false,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [scrollSpread, setScrollSpread] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = hostRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      // Progress 0 when centered/high, grows gently toward 1 as user scrolls down
      const raw = (vh * 0.62 - rect.top) / (vh * 0.9);
      setScrollSpread(Math.max(-0.25, Math.min(1, raw)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const cards = compact ? DECK_CARDS.slice(0, 5) : DECK_CARDS;
  const mid = (cards.length - 1) / 2;

  return (
    <div
      ref={hostRef}
      data-gesso-deck="true"
      onMouseLeave={() => setHoveredIdx(null)}
      className={`relative mx-auto flex w-full items-center justify-center overflow-visible ${
        compact ? 'h-[260px] sm:h-[310px]' : 'h-[290px] sm:h-[370px]'
      } ${className}`}
    >
      <div className="relative flex h-full w-full max-w-[780px] items-center justify-center">
        {cards.map((card, idx) => {
          const offset = idx - mid;
          const abs = Math.abs(offset);
          const isHovered = hoveredIdx === idx;
          const neighborPush =
            hoveredIdx !== null && hoveredIdx !== idx
              ? (idx < hoveredIdx ? -1 : 1) * Math.max(0, 22 - Math.abs(idx - hoveredIdx) * 6)
              : 0;

          const baseStep = compact ? 64 : 76;
          const spreadBoost = 1 + scrollSpread * 0.22;
          const tx = offset * baseStep * spreadBoost + neighborPush;
          const ty = abs * abs * (compact ? 6.5 : 5.2) + scrollSpread * offset * 6;
          const rot = isHovered ? 0 : offset * (compact ? 6.8 : 5.4) + scrollSpread * offset * 1.6;
          const scale = isHovered ? 1.1 : Math.max(0.86, 1 - abs * 0.032);
          const meta = INVITATION_TEMPLATES.find((t) => t.id === card.id);
          const showBadge = isHovered || idx === 0 || idx === cards.length - 1;

          return (
            <Link
              key={card.id}
              href={`/thiep-cuoi/${card.id}`}
              onMouseEnter={() => setHoveredIdx(idx)}
              aria-label={`Xem thiệp mẫu ${meta?.nameVi ?? card.id}`}
              className="group absolute w-[124px] rounded-[12px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-400 sm:w-[156px]"
              style={{
                transform: `translate3d(${tx.toFixed(1)}px, ${(isHovered ? ty - 22 : ty).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${scale})`,
                zIndex: isHovered ? 35 : 20 - Math.round(abs * 2),
              }}
            >
              {/* Floating playful tag badge (Gesso style) */}
              <span
                className={`pointer-events-none absolute -top-8 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-md transition-all duration-300 ${
                  showBadge ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
                }`}
                style={{ background: card.tagBg, color: card.tagText }}
              >
                {card.tag}
              </span>

              <div className="relative overflow-hidden rounded-[12px] border-2 border-white bg-white shadow-[0_22px_44px_-18px_rgba(45,18,18,0.58)] ring-1 ring-black/5">
                <CardFace
                  templateId={card.id}
                  groom={SAMPLE_COUPLE.groomName}
                  bride={SAMPLE_COUPLE.brideName}
                  eager={compact && idx === 0}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/65 via-black/25 to-transparent py-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-rose-900 shadow">
                    Mở thiệp →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── 2. StyleAccordionShowcase (Moonart) ───────────────────────── */

interface StylePanel {
  id: string;
  templateId: InvitationTemplateId;
  kicker: string;
  title: string;
  desc: string;
  accent: string;
  bg: string;
}

const STYLE_PANELS: StylePanel[] = [
  {
    id: 'truyen-thong',
    templateId: 'song-hy-do',
    kicker: '01 · Di Sản Việt',
    title: 'Truyền Thống & Song Hỷ',
    desc: 'Đỏ son, sơn mài, hoa sen, nền lụa bay & cá Koi gợn nước tôn vinh lễ gia tiên.',
    accent: '#9f1239',
    bg: 'from-[#fff5f5] via-[#fde8e8] to-[#f9d6d0]',
  },
  {
    id: 'lang-man',
    templateId: 'la-xanh',
    kicker: '02 · Thiên Nhiên',
    title: 'Hoa Cỏ & Màu Nước',
    desc: 'Lá khuynh diệp, hoa hồng phấn, nét màu nước dịu nhẹ với cánh hoa rơi tự nhiên.',
    accent: '#3f6212',
    bg: 'from-[#f7f9f2] via-[#ebf2e3] to-[#dde8d2]',
  },
  {
    id: 'toi-gian',
    templateId: 'tap-chi',
    kicker: '03 · Biên Tập Tạp Chí',
    title: 'Tối Giản & Editorial',
    desc: 'Bố cục tạp chí thời trang sắc nét, chữ lớn tinh tế, tôn trọn ảnh cưới nghệ thuật.',
    accent: '#18181b',
    bg: 'from-[#fafafa] via-[#f1f0ec] to-[#e6e4de]',
  },
  {
    id: 'sang-trong',
    templateId: 'baroque-vang',
    kicker: '04 · Tiệc Tối & Biển Đảo',
    title: 'Baroque Vàng & Hoàng Hôn',
    desc: 'Nền đen vàng ánh kim, chòm sao lấp lánh hoặc sóng biển xanh mát tương tác theo tay.',
    accent: '#a16207',
    bg: 'from-[#fefce8] via-[#f7eed4] to-[#eedeb8]',
  },
];

export function StyleAccordionShowcase() {
  const [active, setActive] = useState(0);

  return (
    <section data-moonart-accordion="true" className="mb-14">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-rose-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> 4 Trường Phái Thiết Kế Nổi Bật
          </span>
          <h2 className="mt-1 font-serif text-2xl font-bold text-rose-950 sm:text-3xl">
            Rê chuột hoặc chạm để mở rộng từng phong cách
          </h2>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:h-[340px] md:flex-row">
        {STYLE_PANELS.map((panel, idx) => {
          const isOpen = active === idx;
          return (
            <div
              key={panel.id}
              onMouseEnter={() => setActive(idx)}
              onClick={() => setActive(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActive(idx);
                }
              }}
              className={`group relative flex cursor-pointer overflow-hidden rounded-3xl border border-amber-900/10 bg-gradient-to-br ${panel.bg} p-4 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-5 ${
                isOpen ? 'md:flex-[2.4] shadow-lg' : 'md:flex-[0.9] opacity-90 hover:opacity-100'
              }`}
            >
              <div
                className={`flex w-full items-center gap-3.5 ${
                  isOpen ? 'flex-row text-left' : 'flex-row text-left md:flex-col md:justify-center md:gap-3 md:text-center'
                }`}
              >
                <div
                  className={`shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-md transition-all duration-500 ${
                    isOpen ? 'w-[104px] sm:w-[144px]' : 'w-[84px] md:w-[108px]'
                  }`}
                >
                  <CardFace templateId={panel.templateId} groom={SAMPLE_COUPLE.groomName} bride={SAMPLE_COUPLE.brideName} />
                </div>

                <div className="min-w-0 flex-1 md:flex-initial">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.18em]" style={{ color: panel.accent }}>
                    {panel.kicker}
                  </p>
                  <h3 className={`mt-1 font-serif font-bold leading-snug text-slate-900 ${isOpen ? 'text-lg sm:text-xl' : 'text-base'}`}>
                    {panel.title}
                  </h3>
                  <p
                    className={`mt-2 text-xs leading-relaxed text-slate-700 transition-all duration-300 sm:text-sm ${
                      isOpen ? 'max-h-28 opacity-100' : 'max-h-0 overflow-hidden opacity-0 md:hidden'
                    }`}
                  >
                    {panel.desc}
                  </p>
                  {isOpen && (
                    <Link
                      href={`/thiep-cuoi/${panel.templateId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110"
                      style={{ background: panel.accent }}
                    >
                      Trải nghiệm mẫu <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────────────── 3. OpalFilterTabs (Opal Elastic Pill) ───────────────────────── */

export interface OpalTabOption {
  id: string;
  label: string;
  count?: number;
}

export function OpalFilterTabs({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: OpalTabOption[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ left: number; width: number; top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const sync = () => {
      const btn = btnRefs.current[value];
      const rail = railRef.current;
      if (!btn || !rail) return;
      setPill({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
        top: btn.offsetTop,
        height: btn.offsetHeight,
      });
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [value, options.length]);

  return (
    <div
      ref={railRef}
      role="tablist"
      aria-label={ariaLabel}
      data-opal-tabs="true"
      className="relative flex gap-1.5 overflow-x-auto rounded-2xl border border-amber-200/80 bg-white/80 p-1.5 shadow-sm backdrop-blur-md [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      {pill && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-xl bg-rose-800 shadow-[0_6px_16px_-6px_rgba(136,19,55,0.6)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            left: pill.left,
            top: pill.top,
            width: pill.width,
            height: pill.height,
          }}
        />
      )}
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            ref={(el) => {
              btnRefs.current[opt.id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`relative z-[1] min-h-[38px] shrink-0 whitespace-nowrap rounded-xl px-3.5 text-[13px] font-semibold transition-colors duration-200 ${
              active ? 'text-amber-50' : 'text-slate-700 hover:text-rose-800'
            }`}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={`ml-1 tabular-nums text-[11px] ${active ? 'opacity-80' : 'opacity-55'}`}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────── 4. ScrySearchInput (Telescoping Search) ───────────────────────── */

export function ScrySearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  const [focused, setFocused] = useState(false);
  const inputId = React.useId();
  const expanded = focused || value.length > 0;

  return (
    <div
      data-scry-search="true"
      className={`relative transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        expanded ? 'w-full lg:w-80' : 'w-full lg:w-64'
      }`}
    >
      <Search
        aria-hidden
        className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
          expanded ? 'text-rose-700' : 'text-slate-500'
        }`}
      />
      <input
        id={inputId}
        name="search-query"
        type="search"
        aria-label={ariaLabel}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-amber-200/90 bg-white/90 py-2.5 pl-10 pr-9 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-sm transition-all placeholder:text-slate-500 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-200/60 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Xoá từ khoá"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
