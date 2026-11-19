'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, type RemoteTrackPublication } from 'livekit-client';
import { ExternalLink, Mic, MicOff, Volume2 } from 'lucide-react';

interface TableVoiceManagerProps {
  slug: string;
  tier: string;
  shardIndex: number;
  seatedTableNo: number;
  stageBroadcastActive: boolean;
  isHostOrMc: boolean;
  isMutedByMod: boolean;
  onSpeakingChange: (speaking: boolean) => void;
}

function isInAppSocialWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Zalo|FBAN|FBAV|Messenger/i.test(navigator.userAgent);
}

export const TableVoiceManager: React.FC<TableVoiceManagerProps> = ({
  slug,
  tier,
  shardIndex,
  seatedTableNo,
  stageBroadcastActive,
  isHostOrMc,
  isMutedByMod,
  onSpeakingChange,
}) => {
  const tableRoomRef = useRef<Room | null>(null);
  const stageRoomRef = useRef<Room | null>(null);
  const audioContainerRef = useRef<HTMLDivElement | null>(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [webViewBlocked, setWebViewBlocked] = useState(false);

  const isVip = tier === 'VIP_FULFILLMENT';

  // Lazy table audio connection when seatedTableNo >= 0
  useEffect(() => {
    if (!isVip || seatedTableNo < 0) {
      if (tableRoomRef.current) {
        tableRoomRef.current.disconnect().catch(() => {});
        tableRoomRef.current = null;
        setMicEnabled(false);
        onSpeakingChange(false);
      }
      return;
    }

    let cancelled = false;
    const connectTable = async () => {
      try {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, shardIndex, tableNo: seatedTableNo, scope: 'table' }),
        });
        const data = await res.json();
        if (!res.ok || !data.livekitUrl || cancelled) {
          setStatusText('Sẵn sàng Voice Bàn (chưa bật LiveKit server)');
          return;
        }

        const room = new Room({ adaptiveStream: true, dynacast: true });
        tableRoomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Audio && audioContainerRef.current) {
            const el = track.attach() as HTMLAudioElement;
            el.volume = stageBroadcastActive ? 0.25 : 1.0; // -12dB ducking
            el.dataset.scope = 'table';
            audioContainerRef.current.appendChild(el);
          }
        });

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          const localSpeaking = speakers.some((s) => s.isLocal);
          onSpeakingChange(localSpeaking);
        });

        await room.connect(data.livekitUrl, data.token);
        setStatusText(`Đã kết nối Voice Bàn ${seatedTableNo}`);
      } catch {
        setStatusText('Chế độ nghe bàn tiệc (LiveKit offline)');
      }
    };

    connectTable();
    return () => {
      cancelled = true;
      if (tableRoomRef.current) {
        tableRoomRef.current.disconnect().catch(() => {});
        tableRoomRef.current = null;
      }
    };
  }, [isVip, slug, shardIndex, seatedTableNo]);

  // Apply -12dB ducking dynamically when stageBroadcastActive changes
  useEffect(() => {
    if (!audioContainerRef.current) return;
    const els = audioContainerRef.current.querySelectorAll<HTMLAudioElement>('audio[data-scope="table"]');
    els.forEach((el) => {
      el.volume = stageBroadcastActive ? 0.25 : 1.0;
    });
  }, [stageBroadcastActive]);

  // Subscribe to stage broadcast audio when active
  useEffect(() => {
    if (!isVip || !stageBroadcastActive) {
      if (stageRoomRef.current) {
        stageRoomRef.current.disconnect().catch(() => {});
        stageRoomRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const connectStage = async () => {
      try {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, scope: 'stage' }),
        });
        const data = await res.json();
        if (!res.ok || !data.livekitUrl || cancelled) return;

        const room = new Room();
        stageRoomRef.current = room;
        room.on(RoomEvent.TrackSubscribed, (track, _pub: RemoteTrackPublication) => {
          if (track.kind === Track.Kind.Audio && audioContainerRef.current) {
            const el = track.attach() as HTMLAudioElement;
            el.volume = 1.0;
            el.dataset.scope = 'stage';
            audioContainerRef.current.appendChild(el);
          }
        });
        await room.connect(data.livekitUrl, data.token);
        if (isHostOrMc && data.canPublish) {
          await room.localParticipant.setMicrophoneEnabled(true);
        }
      } catch {
        // ignore offline livekit
      }
    };
    connectStage();
    return () => {
      cancelled = true;
      if (stageRoomRef.current) {
        stageRoomRef.current.disconnect().catch(() => {});
        stageRoomRef.current = null;
      }
    };
  }, [isVip, stageBroadcastActive, slug, isHostOrMc]);

  const toggleMic = async () => {
    if (isMutedByMod) return;
    const next = !micEnabled;
    if (next && (!navigator.mediaDevices?.getUserMedia || isInAppSocialWebView())) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        setWebViewBlocked(true);
        return;
      }
    }
    if (tableRoomRef.current) {
      await tableRoomRef.current.localParticipant.setMicrophoneEnabled(next);
    }
    setMicEnabled(next);
    onSpeakingChange(next);
  };

  const handleOpenExternalBrowser = async () => {
    const res = await fetch('/api/auth/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, tableNo: seatedTableNo }),
    });
    const data = await res.json();
    if (data.handoffUrl) {
      window.open(data.handoffUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isVip || seatedTableNo < 0) {
    return <div ref={audioContainerRef} className="hidden" />;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div ref={audioContainerRef} className="hidden" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleMic}
          disabled={isMutedByMod}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow transition ${
            micEnabled
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-800 hover:bg-slate-100'
          } disabled:opacity-50`}
        >
          {micEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
          {isMutedByMod ? 'Đang bị khóa Mic' : micEnabled ? 'Đang Nói (Bàn)' : 'Bật Mic Bàn'}
        </button>
        {stageBroadcastActive && (
          <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white">
            <Volume2 className="h-3 w-3" /> Sân khấu đang phát (-12dB bàn)
          </span>
        )}
        {statusText && <span className="hidden text-[10px] text-slate-600 sm:inline">{statusText}</span>}
      </div>

      {webViewBlocked && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span>Zalo/Messenger đang khóa quyền Micro.</span>
          <button
            type="button"
            onClick={handleOpenExternalBrowser}
            className="flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 font-bold text-white"
          >
            <ExternalLink className="h-3 w-3" /> Mở Safari / Chrome
          </button>
        </div>
      )}
    </div>
  );
};
