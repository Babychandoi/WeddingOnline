'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Expand,
  Gift,
  MapPin,
  Pause,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { InvitationMemoryItem, Walkthrough3DTemplateId } from '@dco/shared';
import { formatShortDotsDate, formatWalkthroughDate, walkthrough3DTheme } from './themes3d';
import {
  buildTourStations,
  type JoystickInput,
  type WalkthroughEventBoardItem,
  type WalkthroughPhotoItem,
} from './WalkthroughScene3D';

const WalkthroughSceneCanvas = dynamic(
  () => import('./WalkthroughScene3D').then((m) => m.WalkthroughSceneCanvas),
  { ssr: false },
);

function detectWebGL(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

export interface WalkthroughInvitationHeroProps {
  themeId: Walkthrough3DTemplateId;
  groom: string;
  bride: string;
  dateIso: string;
  guestName: string;
  greetingTemplate?: string;
  welcomeSubtitle?: string;
  coupleCutoutUrl?: string;
  photos: WalkthroughPhotoItem[];
  memories?: InvitationMemoryItem[];
  events?: WalkthroughEventBoardItem[];
  hallUrl: string | null;
  showEvents?: boolean;
  showRsvp?: boolean;
  showGift?: boolean;
  playing?: boolean;
  musicEnabled?: boolean;
  onToggleMusic?: () => void;
  demo?: boolean;
  /** True inside visual editor so owner sees quick edit pills cleanly */
  editorMode?: boolean;
  onEditSpot?: (part: 'cover' | 'album' | 'events') => void;
  onOpenPhoto?: (index: number) => void;
  /** Scroll target id below the fullscreen 3D showcase */
  detailsAnchorId?: string;
}

export function WalkthroughInvitationHero({
  themeId,
  groom,
  bride,
  dateIso,
  guestName,
  greetingTemplate,
  welcomeSubtitle,
  coupleCutoutUrl,
  photos,
  memories = [],
  events = [],
  hallUrl,
  showEvents = true,
  showRsvp = true,
  showGift = true,
  playing = false,
  musicEnabled = false,
  onToggleMusic,
  demo = false,
  editorMode = false,
  onEditSpot,
  onOpenPhoto,
  detailsAnchorId = 'chi-tiet-thiep',
}: WalkthroughInvitationHeroProps) {
  const theme = walkthrough3DTheme(themeId);
  const [webglOk, setWebglOk] = useState(true);
  const [stationIndex, setStationIndex] = useState(0);
  const [stationRevision, setStationRevision] = useState(0);
  const [freeWalkActive, setFreeWalkActive] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [autoTour, setAutoTour] = useState(false);
  const [stationMenuOpen, setStationMenuOpen] = useState(false);

  const joystickRef = useRef<JoystickInput>({ x: 0, y: 0, active: false });
  const joyPadRef = useRef<HTMLDivElement>(null);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0, active: false });

  useEffect(() => {
    setWebglOk(detectWebGL());
  }, []);

  const stations = useMemo(
    () =>
      buildTourStations({
        themeId,
        photoCount: photos.length,
        events,
      }),
    [themeId, photos.length, events],
  );

  useEffect(() => {
    setStationIndex((idx) => Math.min(stations.length - 1, Math.max(0, idx)));
  }, [stations.length]);

  const currentStation = stations[stationIndex] ?? stations[0];
  const shownPhotoCount = Math.min(6, photos.length);

  const goToStation = (idx: number, keepInspect = false) => {
    const nextIdx = ((idx % stations.length) + stations.length) % stations.length;
    setFreeWalkActive(false);
    setStationMenuOpen(false);
    setInspectOpen(keepInspect);
    setStationIndex(nextIdx);
    setStationRevision((r) => r + 1);
  };

  // Focus & zoom in on a specific photo easel (triggered by clicking the 3D frame or "Xem kỷ niệm")
  const inspectPhotoAt = (photoIdx: number) => {
    if (editorMode && onEditSpot) {
      onEditSpot('album');
      return;
    }
    const targetIdx = stations.findIndex((s) => s.kind === 'photo' && s.photoIndex === photoIdx);
    setAutoTour(false);
    setFreeWalkActive(false);
    setStationMenuOpen(false);
    if (targetIdx >= 0 && targetIdx !== stationIndex) {
      setStationIndex(targetIdx);
      setStationRevision((r) => r + 1);
    }
    setInspectOpen(true);
  };

  // Focus & zoom in on a specific event easel (triggered by clicking the 3D event board or "Xem chi tiết")
  const inspectEventAt = (eventIdx: number) => {
    if (editorMode && onEditSpot) {
      onEditSpot('events');
      return;
    }
    const targetIdx = stations.findIndex((s) => s.kind === 'event' && s.eventIndex === eventIdx);
    setAutoTour(false);
    setFreeWalkActive(false);
    setStationMenuOpen(false);
    if (targetIdx >= 0 && targetIdx !== stationIndex) {
      setStationIndex(targetIdx);
      setStationRevision((r) => r + 1);
    }
    setInspectOpen(true);
  };

  useEffect(() => {
    if (!autoTour || freeWalkActive || inspectOpen) return;
    const t = window.setInterval(() => {
      setStationIndex((idx) => {
        if (idx >= stations.length - 1) {
          setAutoTour(false);
          return idx;
        }
        setStationRevision((r) => r + 1);
        return idx + 1;
      });
    }, 3800);
    return () => window.clearInterval(t);
  }, [autoTour, freeWalkActive, inspectOpen, stations.length]);

  const updateJoystickFromPointer = (clientX: number, clientY: number) => {
    const el = joyPadRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR && dist > 0) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    const nx = Math.max(-1, Math.min(1, dx / maxR));
    const ny = Math.max(-1, Math.min(1, dy / maxR));
    joystickRef.current = { x: nx, y: ny, active: true };
    setJoyKnob({ x: dx, y: dy, active: true });
    setAutoTour(false);
    setInspectOpen(false);
    setFreeWalkActive(true);
  };

  const resetJoystick = () => {
    joystickRef.current = { x: 0, y: 0, active: false };
    setJoyKnob({ x: 0, y: 0, active: false });
  };

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cleanGuest = guestName.trim() || 'Quý khách';
  const bubbleMsg = (greetingTemplate?.trim() || theme.defaultGreeting).replace(/\{khach\}/gi, cleanGuest);
  const fullDateLabel = useMemo(() => formatWalkthroughDate(dateIso), [dateIso]);
  const shortDotsDate = useMemo(() => formatShortDotsDate(dateIso), [dateIso]);

  // Resolve current photo memory metadata when at a Photo station
  const activePhotoIndex = currentStation.kind === 'photo' ? (currentStation.photoIndex ?? 0) : null;
  const activePhoto = activePhotoIndex !== null ? photos[activePhotoIndex] : null;
  const activeMemory = useMemo(() => {
    if (activePhotoIndex === null || !activePhoto) return null;
    const matched = memories.find((m) => m.photoUrl && m.photoUrl === activePhoto.url) ?? memories[activePhotoIndex];
    return {
      year: matched?.year?.trim() || '',
      title: matched?.title?.trim() || activePhoto.caption?.trim() || `Kỷ niệm ${activePhotoIndex + 1}`,
      story:
        matched?.story?.trim() ||
        'Khoảnh khắc lưu giữ yêu thương trên hành trình về chung một nhà của hai chúng mình.',
    };
  }, [activePhoto, activePhotoIndex, memories]);

  // Resolve current event board metadata when at an Event station
  const activeEventIndex = currentStation.kind === 'event' ? (currentStation.eventIndex ?? 0) : null;
  const activeEvent = activeEventIndex !== null ? events[activeEventIndex] : null;

  return (
    <section
      aria-label={`Trải nghiệm thiệp cưới 3D ${theme.nameVi}`}
      className={`relative mx-auto w-full select-none ${editorMode ? 'h-[620px] max-w-[560px]' : demo ? 'h-[calc(100dvh-56px)] min-h-[540px] w-full' : 'h-[100dvh] w-full'
        }`}
      style={{ backgroundColor: theme.cardBgTint }}
    >
      <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: theme.cardBgTint }}>
        {webglOk ? (
          <WalkthroughSceneCanvas
            themeId={themeId}
            stationIndex={stationIndex}
            stationRevision={stationRevision}
            stations={stations}
            inspectFocused={inspectOpen && (currentStation.kind === 'photo' || currentStation.kind === 'event')}
            joystickRef={joystickRef}
            freeWalkActive={freeWalkActive}
            onEnterFreeWalk={() => {
              setAutoTour(false);
              setInspectOpen(false);
              setFreeWalkActive(true);
            }}
            groom={groom}
            bride={bride}
            dateIso={dateIso}
            guestName={cleanGuest}
            welcomeSubtitle={welcomeSubtitle}
            events={events}
            coupleCutoutUrl={coupleCutoutUrl}
            photos={photos}
            onInspectPhoto={inspectPhotoAt}
            onInspectEvent={inspectEventAt}
          />
        ) : (
          <div className="relative h-full w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/invitation-3d/${theme.slug}/sky.webp`} alt={theme.nameVi} className="h-full w-full object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentStation.kind === 'stage' ? `/invitation-3d/${theme.slug}/stage.webp` : `/invitation-3d/${theme.slug}/arch.webp`}
              alt={theme.nameVi}
              className="absolute bottom-[12%] left-1/2 h-[66%] w-[92%] -translate-x-1/2 object-contain"
            />
          </div>
        )}

        {/* Top-Left Compact Controls (hidden while zoomed in on a photo/event story card) */}
        {!inspectOpen &&
          (editorMode && onEditSpot ? (
            <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onEditSpot('cover')}
                className="rounded-full bg-sky-600 px-3 py-1 text-[11px] font-bold text-white shadow-md hover:bg-sky-500"
              >
                ✎ Tên &amp; lời chào 3D
              </button>
              <button
                type="button"
                onClick={() => onEditSpot('album')}
                className="rounded-full bg-sky-600 px-3 py-1 text-[11px] font-bold text-white shadow-md hover:bg-sky-500"
              >
                ✎ Ảnh &amp; Kỷ niệm 3D
              </button>
              <button
                type="button"
                onClick={() => onEditSpot('events')}
                className="rounded-full bg-sky-600 px-3 py-1 text-[11px] font-bold text-white shadow-md hover:bg-sky-500"
              >
                ✎ Điểm sự kiện
              </button>
            </div>
          ) : (
            <div className="absolute left-3.5 top-3.5 z-20 flex items-center gap-2">
              <button
                type="button"
                data-testid="walkthrough-autotour"
                onClick={() => {
                  setFreeWalkActive(false);
                  setInspectOpen(false);
                  if (!autoTour && stationIndex >= stations.length - 1) goToStation(0);
                  setAutoTour((v) => !v);
                }}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-amber-300/45 bg-[#161834]/70 px-3.5 text-xs font-bold text-[#fef6e4] shadow-lg backdrop-blur-md transition hover:bg-[#1e2147]/85"
              >
                {autoTour ? <Pause className="h-3.5 w-3.5 text-amber-300" /> : <Play className="h-3.5 w-3.5 text-amber-300" />}
                <span>{autoTour ? 'Đang dẫn' : 'Tự dẫn'}</span>
              </button>
              <button
                type="button"
                data-testid="walkthrough-details-btn"
                onClick={() => scrollToSection(detailsAnchorId)}
                className="inline-flex h-10 items-center gap-1 rounded-full border border-white/25 bg-[#161834]/65 px-3 text-xs font-bold text-white/95 shadow-lg backdrop-blur-md transition hover:bg-[#1e2147]/85"
              >
                <span>Chi tiết</span>
                <ChevronDown className="h-3.5 w-3.5 text-amber-300" />
              </button>
            </div>
          ))}

        {/* Top-Right Circular Music/Mute Button */}
        {musicEnabled && onToggleMusic && (
          <button
            type="button"
            data-testid="walkthrough-music-btn"
            onClick={onToggleMusic}
            aria-label={playing ? 'Tắt nhạc cưới' : 'Bật nhạc cưới'}
            className="absolute right-3.5 top-3.5 z-30 grid h-[42px] w-[42px] place-items-center rounded-full border border-amber-300/55 bg-[#161834]/72 text-[#f6dc9c] shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-[#1e2147]"
          >
            {playing ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
          </button>
        )}

        {/* Station 0 ("Cổng cưới"): Calligraphic Cover Title */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-14 z-10 px-5 text-center transition-all duration-500 ${currentStation.kind === 'gate' && !freeWalkActive ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
            }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] drop-shadow" style={{ color: theme.titleColor }}>
            {theme.kickerVi}
          </p>
          <h1
            className="mt-2 text-[clamp(2.5rem,9vw,3.5rem)] leading-[1.06] drop-shadow-[0_3px_14px_rgba(0,0,0,0.7)]"
            style={{ fontFamily: 'var(--f-imperial), var(--f-dancing), cursive', color: theme.titleColor }}
          >
            {bride}
            <span className="block text-[0.58em] opacity-90">&amp;</span>
            {groom}
          </h1>
          <p className="mt-2 text-xs font-medium tracking-[0.2em] text-[#fff8ec] drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
            {fullDateLabel}
          </p>
        </div>

        {/* Station 1 ("Cô dâu chú rể"): Personalized Guest Speech Bubble */}
        <div
          data-walkthrough-bubble="true"
          className={`pointer-events-none absolute inset-x-6 top-[16%] z-10 flex justify-center transition-all duration-400 ${currentStation.kind === 'couple' && !freeWalkActive
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-2 scale-95 opacity-0'
            }`}
        >
          <div className="relative max-w-[285px] rounded-2xl border border-amber-200/95 bg-[#fffdf8]/95 px-4 py-2.5 text-center text-[13.5px] font-semibold leading-snug text-slate-900 shadow-[0_12px_30px_-6px_rgba(12,8,20,0.55)] backdrop-blur-sm">
            {bubbleMsg}
            <span
              aria-hidden="true"
              className={`absolute -bottom-1.5 h-3 w-3 rotate-45 border-b border-r border-amber-200/95 bg-[#fffdf8] ${theme.standeeSide === 'left' ? 'left-[35%]' : 'left-[62%]'
                }`}
            />
          </div>
        </div>

        {/* Photo Station Prompt Pill ("Chạm ảnh / Xem kỷ niệm") when resting before zoom-in */}
        {!inspectOpen && !freeWalkActive && activePhotoIndex !== null && activeMemory && (
          <div className="absolute inset-x-4 bottom-[114px] z-20 flex justify-center sm:bottom-20">
            <button
              type="button"
              data-testid="walkthrough-open-memory"
              onClick={() => inspectPhotoAt(activePhotoIndex)}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-amber-300/60 bg-[#161834]/82 px-4 text-xs font-bold text-[#fae6b8] shadow-xl backdrop-blur-md transition hover:scale-105 hover:bg-[#232652]"
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-300" />
              <span>Xem kỷ niệm: {activeMemory.title}</span>
            </button>
          </div>
        )}

        {/* Event Station Prompt Pill ("Xem bản đồ & chi tiết lễ") when resting before zoom-in */}
        {!inspectOpen && !freeWalkActive && activeEventIndex !== null && activeEvent && (
          <div className="absolute inset-x-4 bottom-[114px] z-20 flex justify-center sm:bottom-20">
            <button
              type="button"
              data-testid="walkthrough-open-event"
              onClick={() => inspectEventAt(activeEventIndex)}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-amber-300/60 bg-[#161834]/82 px-4 text-xs font-bold text-[#fae6b8] shadow-xl backdrop-blur-md transition hover:scale-105 hover:bg-[#232652]"
            >
              <MapPin className="h-3.5 w-3.5 text-amber-300" />
              <span>Xem bản đồ &amp; chi tiết {activeEvent.title}</span>
            </button>
          </div>
        )}

        {/* Stage Station Quick Action Chips */}
        <div
          className={`absolute inset-x-3 bottom-[112px] z-10 flex flex-wrap items-center justify-center gap-2 transition-all duration-500 sm:bottom-20 ${
            currentStation.kind === 'stage' && !freeWalkActive && !inspectOpen
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-3 opacity-0'
          }`}
        >
          {showEvents && (
            <button
              type="button"
              onClick={() => scrollToSection('su-kien')}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-white/95 px-3.5 text-xs font-bold text-slate-900 shadow-lg ring-1 ring-amber-200 backdrop-blur transition hover:bg-amber-50"
            >
              <Calendar className="h-3.5 w-3.5 text-rose-700" /> Lịch lễ · {shortDotsDate}
            </button>
          )}
          {showRsvp && (
            <button
              type="button"
              onClick={() => scrollToSection('xac-nhan')}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-rose-700 px-3.5 text-xs font-bold text-white shadow-lg transition hover:bg-rose-600"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Xác nhận tham dự
            </button>
          )}
          {showGift && (
            <button
              type="button"
              onClick={() => scrollToSection('mung-cuoi')}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-white/95 px-3.5 text-xs font-bold text-rose-900 shadow-lg ring-1 ring-rose-200 transition hover:bg-rose-50"
            >
              <Gift className="h-3.5 w-3.5 text-rose-700" /> Mừng cưới
            </button>
          )}
          {hallUrl && (
            <a
              href={hallUrl}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-amber-400 px-3.5 text-xs font-bold text-slate-950 shadow-lg transition hover:bg-amber-300"
            >
              <Sparkles className="h-3.5 w-3.5" /> Vào Sảnh 3D
            </a>
          )}
        </div>

        {/* SLIDE-UP ZOOM-IN MEMORY STORY CARD (matches @thiepcuoitiec3d 00:19/00:41!) */}
        {inspectOpen && activePhotoIndex !== null && activeMemory && (
          <div
            data-testid="walkthrough-memory-card"
            role="dialog"
            aria-label={`Kỷ niệm ${activePhotoIndex + 1}`}
            className="absolute inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[560px] rounded-t-[26px] border-t border-amber-200/35 bg-[#1b1640]/92 px-6 pb-6 pt-5 text-white shadow-[0_-20px_60px_rgba(8,6,24,0.75)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                data-testid="walkthrough-inspect-close"
                onClick={() => setInspectOpen(false)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#f3cf87] transition hover:text-amber-200"
              >
                <ChevronLeft className="h-4 w-4" /> Tiếp tục đi
              </button>
              <div className="flex items-center gap-1.5">
                {onOpenPhoto && (
                  <button
                    type="button"
                    onClick={() => onOpenPhoto(activePhotoIndex)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-amber-50 hover:bg-white/20"
                  >
                    <Expand className="h-3 w-3" /> Phóng to
                  </button>
                )}
                {activePhotoIndex + 1 < shownPhotoCount && (
                  <button
                    type="button"
                    onClick={() => goToStation(stationIndex + 1, true)}
                    className="inline-flex items-center gap-0.5 rounded-full border border-amber-300/45 bg-amber-300/15 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-300/25"
                  >
                    Ảnh sau <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.26em] text-amber-100/80">
              KỶ NIỆM {activePhotoIndex + 1} / {shownPhotoCount}
              {activeMemory.year ? ` · ${activeMemory.year}` : ''}
            </p>
            <h2 className="mt-2 font-serif text-[28px] font-bold leading-tight text-white">
              {activeMemory.title}
            </h2>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-amber-50/90">
              {activeMemory.story}
            </p>
            {demo && (
              <p className="mt-4 text-[11px] text-amber-100/55">
                Ảnh &amp; câu chuyện mẫu. Bản thật bạn tự tải ảnh và chỉnh sửa lời kể kỷ niệm riêng trong trang quản trị.
              </p>
            )}
          </div>
        )}

        {/* SLIDE-UP ZOOM-IN EVENT DETAIL CARD (matches @thiepcuoitiec3d Event Board interaction!) */}
        {inspectOpen && activeEventIndex !== null && activeEvent && (
          <div
            data-testid="walkthrough-event-card"
            role="dialog"
            aria-label={activeEvent.title}
            className="absolute inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[560px] rounded-t-[26px] border-t border-amber-200/35 bg-[#151326]/94 px-6 pb-6 pt-5 text-white shadow-[0_-20px_60px_rgba(8,6,24,0.75)] backdrop-blur-xl"
          >
            <button
              type="button"
              data-testid="walkthrough-inspect-close"
              onClick={() => setInspectOpen(false)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#f3cf87] transition hover:text-amber-200"
            >
              <ChevronLeft className="h-4 w-4" /> Tiếp tục đi
            </button>

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.26em] text-amber-200/80">
              {activeEvent.kicker}
            </p>
            <h2 className="mt-1 font-serif text-[26px] font-bold leading-tight text-white">
              {activeEvent.title} · {activeEvent.timeText}
            </h2>
            <p className="mt-1 text-xs font-medium text-amber-100/85">
              {activeEvent.solarDateText}
              {activeEvent.lunarDateText ? ` (Nhằm ngày ${activeEvent.lunarDateText})` : ''}
            </p>
            <p className="mt-3 text-sm font-bold text-amber-50">{activeEvent.venueName}</p>
            {activeEvent.address && <p className="mt-0.5 text-xs leading-relaxed text-amber-50/80">{activeEvent.address}</p>}
            {(activeEvent.note || activeEvent.dressCode) && (
              <p className="mt-2 text-xs italic text-amber-200/90">
                {[activeEvent.note, activeEvent.dressCode ? `Trang phục: ${activeEvent.dressCode}` : ''].filter(Boolean).join(' · ')}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {activeEvent.mapUrl && (
                <a
                  href={activeEvent.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-amber-300 px-4 text-xs font-black text-slate-950 shadow hover:bg-amber-200"
                >
                  <MapPin className="h-3.5 w-3.5" /> Mở Google Maps chỉ đường
                </a>
              )}
              {showRsvp && (
                <button
                  type="button"
                  onClick={() => {
                    setInspectOpen(false);
                    scrollToSection('xac-nhan');
                  }}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-rose-700 px-4 text-xs font-bold text-white shadow hover:bg-rose-600"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Xác nhận tham dự
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom-Left Golden 3D Virtual Joystick (hidden while reading zoomed-in card) */}
        {!inspectOpen && (
          <div
            ref={joyPadRef}
            data-testid="walkthrough-joystick"
            role="application"
            aria-label="Cần điều khiển đi dạo tự do trong không gian 3D"
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              updateJoystickFromPointer(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.buttons === 0 && !joyKnob.active) return;
              updateJoystickFromPointer(e.clientX, e.clientY);
            }}
            onPointerUp={resetJoystick}
            onPointerCancel={resetJoystick}
            className="absolute bottom-4 left-4 z-20 grid h-[88px] w-[88px] cursor-grab touch-none place-items-center rounded-full border border-amber-300/55 bg-[#161834]/58 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md active:cursor-grabbing"
          >
            <ChevronUp className="pointer-events-none absolute top-1.5 h-3.5 w-3.5 text-amber-200/80" />
            <ChevronDown className="pointer-events-none absolute bottom-1.5 h-3.5 w-3.5 text-amber-200/80" />
            <ChevronLeft className="pointer-events-none absolute left-1.5 h-3.5 w-3.5 text-amber-200/80" />
            <ChevronRight className="pointer-events-none absolute right-1.5 h-3.5 w-3.5 text-amber-200/80" />

            <span
              aria-hidden="true"
              className="pointer-events-none h-9 w-9 rounded-full shadow-[0_4px_14px_rgba(243,207,118,0.55)] ring-1 ring-amber-100/70 transition-transform duration-75"
              style={{
                transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)`,
                background: 'radial-gradient(circle at 34% 30%, #fff6d2 0%, #f5d073 52%, #c38f34 100%)',
              }}
            />
          </div>
        )}

        {/* Bottom-Right Guided Tour Stepper (< [ Station Pill ] >) */}
        {!inspectOpen && (
          <div className="absolute bottom-5 right-4 z-20 flex flex-col items-end gap-2">
            {stationMenuOpen && (
              <div
                role="menu"
                aria-label="Chọn trạm tham quan 3D"
                className="max-h-[48vh] w-56 overflow-y-auto rounded-2xl border border-amber-300/45 bg-[#141630]/92 p-1.5 text-xs text-amber-50 shadow-2xl backdrop-blur-md"
              >
                {stations.map((st, idx) => (
                  <button
                    key={st.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAutoTour(false);
                      goToStation(idx);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-semibold transition ${
                      !freeWalkActive && idx === stationIndex
                        ? 'bg-amber-300/25 text-amber-200'
                        : 'text-white/85 hover:bg-white/10'
                    }`}
                  >
                    <span className="truncate">{st.label}</span>
                    <span className="ml-2 shrink-0 text-[10px] opacity-60">{idx + 1}/{stations.length}</span>
                  </button>
                ))}
              </div>
            )}

            <div role="navigation" aria-label="Điều hướng các chặng thiệp 3D" className="inline-flex items-center gap-1.5">
              <button
                type="button"
                data-testid="walkthrough-prev"
                aria-label="Chặng trước"
                onClick={() => {
                  setAutoTour(false);
                  goToStation(stationIndex - 1);
                }}
                className="grid h-10 w-10 place-items-center rounded-full border border-amber-300/45 bg-[#161834]/75 text-amber-100 shadow-lg backdrop-blur-md transition hover:bg-[#232754]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                data-testid="walkthrough-station-pill"
                onClick={() => setStationMenuOpen((o) => !o)}
                className="inline-flex min-h-[40px] min-w-[118px] items-center justify-center rounded-full border border-amber-300/55 bg-[#161834]/82 px-4 text-[13px] font-bold tracking-wide text-[#fef5df] shadow-lg backdrop-blur-md transition hover:bg-[#232754]"
              >
                {freeWalkActive ? 'Đi dạo tự do' : currentStation.label}
              </button>

              <button
                type="button"
                data-testid="walkthrough-next"
                aria-label="Chặng tiếp theo"
                onClick={() => {
                  setAutoTour(false);
                  goToStation(stationIndex + 1);
                }}
                className="grid h-10 w-10 place-items-center rounded-full border border-amber-300/45 bg-[#161834]/75 text-amber-100 shadow-lg backdrop-blur-md transition hover:bg-[#232754]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
