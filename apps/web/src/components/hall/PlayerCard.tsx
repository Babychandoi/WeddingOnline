'use client';

import React, { useEffect } from 'react';
import { Hand, Lock, MessageCircle, ShieldAlert, X } from 'lucide-react';
import type { RemotePlayerView } from '../three/VenueScene';
import { ROLE_LABELS, SIDE_LABELS } from './HallChatPanel';

/** What you get when you click on someone in the hall */
export function PlayerCard({
  player,
  canMessage,
  isHostOrMc,
  online,
  onMessage,
  onWave,
  onModerate,
  onClose,
}: {
  player: RemotePlayerView;
  /** False in the public plaza */
  canMessage: boolean;
  isHostOrMc: boolean;
  online: boolean;
  onMessage: () => void;
  onWave: () => void;
  onModerate: (action: 'MUTE' | 'KICK' | 'BAN') => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const role = ROLE_LABELS[player.role];
  const initial = player.displayName.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-card-name"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] rounded-3xl border border-amber-200/70 bg-[#fffdf8] p-4 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-200 to-amber-100 text-[20px] font-bold text-rose-800">{initial}</span>
          <div className="min-w-0 flex-1">
            <h2 id="player-card-name" className="truncate text-[16px] font-bold text-slate-900">
              {player.displayName}
            </h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-slate-600">
              {role && <span className="rounded bg-rose-600 px-1.5 py-px text-[10.5px] font-bold uppercase tracking-wide text-white">{role}</span>}
              <span>Khách {SIDE_LABELS[player.side]?.toLowerCase() ?? 'mời'}</span>
              {player.seatedTableNo >= 0 && <span>· Bàn {player.seatedTableNo}</span>}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          {canMessage ? (
            <button type="button" onClick={onMessage} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-rose-600 text-[14.5px] font-bold text-white shadow-sm transition hover:bg-rose-500">
              <MessageCircle className="h-[18px] w-[18px]" /> Nhắn tin riêng
            </button>
          ) : (
            <p className="rounded-2xl bg-slate-100 px-3 py-2.5 text-[12.5px] leading-snug text-slate-600">Quảng trường công cộng không có tin nhắn riêng.</p>
          )}
          <button type="button" onClick={onWave} className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl px-4 text-[14px] font-bold text-rose-900 ring-1 ring-rose-200 transition hover:bg-rose-50">
            <Hand className="h-[18px] w-[18px]" /> Vẫy chào
          </button>
        </div>
        {canMessage && (
          <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-slate-500">
            <Lock className="h-3 w-3" aria-hidden="true" /> Chỉ hai bạn thấy tin nhắn riêng{online ? '' : ' · người này đang ở sảnh khác'}
          </p>
        )}

        {isHostOrMc && (
          <div className="mt-4 border-t border-amber-100 pt-3">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-rose-700">
              <ShieldAlert className="h-3.5 w-3.5" /> Kiểm duyệt
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {(
                [
                  ['MUTE', 'Tắt tiếng'],
                  ['KICK', 'Mời ra'],
                  ['BAN', 'Chặn hẳn'],
                ] as const
              ).map(([action, label]) => (
                <button key={action} type="button" onClick={() => onModerate(action)} className="min-h-[38px] rounded-xl bg-rose-50 text-[12.5px] font-bold text-rose-800 ring-1 ring-rose-100 hover:bg-rose-100">
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
