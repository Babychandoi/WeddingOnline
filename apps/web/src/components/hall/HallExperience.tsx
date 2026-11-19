'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Client as ColyseusClient, type Room as ColyseusRoom } from 'colyseus.js';
import {
  ArrowLeft,
  BookHeart,
  Camera,
  Compass,
  Crown,
  Gift,
  Hand,
  Loader2,
  LogOut,
  Mail,
  Megaphone,
  ShieldAlert,
  Sparkles,
  Tv,
  Users,
  Volume2,
  VolumeX,
  Wine,
  X,
} from 'lucide-react';
import type { GuestbookEntryRecord, PhotoAssetRecord, PublicWeddingDTO } from '@dco/database';
import {
  TIER_CATALOG,
  WS_MESSAGES,
  getPrefabCenterWorld,
  type AuthProvider,
  type GuestSide,
  type SceneLayoutDocument,
} from '@dco/shared';
import { soundEngine } from '@/lib/soundEngine';
import type { BouquetView, RemoteNpcView, RemotePlayerView } from '../three/VenueScene';
import { MotionTrack, npcTrackKey, type MotionStore } from '@dco/shared';
import { OAuthModal } from './OAuthModal';
import { VideoPipOverlay } from './VideoPipOverlay';
import { PhotoboothModal } from './PhotoboothModal';
import { VietQrGiftModal } from './VietQrGiftModal';
import { GuestbookModal } from './GuestbookModal';
import { TableVoiceManager } from './TableVoiceManager';

const VenueScene = dynamic(
  () => import('../three/VenueScene').then((mod) => mod.VenueScene),
  { ssr: false }
);

interface HallExperienceProps {
  wedding: PublicWeddingDTO;
  layout: SceneLayoutDocument;
  initialPhotos: PhotoAssetRecord[];
  initialGuestbook: GuestbookEntryRecord[];
}

const DEFAULT_BOUQUET: BouquetView = {
  status: 'IDLE',
  originX: 0,
  originZ: -12,
  targetX: 0,
  targetZ: -6,
  tossStartTs: 0,
  flightDurationMs: 2400,
};

const POETIC_NAMES = ['Mây Thong Thả', 'Trăng Dịu Dàng', 'Gió Xuân', 'Nắng Ban Mai', 'Hoa Sen Nhỏ'];

const HAIR_STYLES = [
  { id: 'hair_1', label: 'Tóc Ngắn Tự Nhiên' },
  { id: 'hair_2', label: 'Tóc Vuốt Bảnh Bao' },
  { id: 'hair_3', label: 'Tóc Dài Thướt Tha' },
  { id: 'hair_4', label: 'Búi Trâm Cổ Điển' },
  { id: 'hair_5', label: 'Búi Đôi Tinh Nghịch' },
  { id: 'hair_6', label: 'Tóc Ngang Vai' },
] as const;

const HAIR_COLORS = [
  { hex: '#1f2937', label: 'Đen Tuyền' },
  { hex: '#78350f', label: 'Nâu Hạt Dẻ' },
  { hex: '#b45309', label: 'Nâu Mật Ong' },
  { hex: '#be185d', label: 'Hồng Pastel' },
  { hex: '#cbd5e1', label: 'Bạch Kim' },
] as const;

const OUTFIT_LABELS: Record<string, string> = {
  ao_dai_guest: 'Áo Dài Hồng',
  vest_suit: 'Vest Lịch Lãm',
  evening_dress: 'Đầm Dạ Hội',
  smart_casual: 'Sơ Mi Năng Động',
};

export const HallExperience: React.FC<HallExperienceProps> = ({
  wedding,
  layout,
  initialPhotos,
  initialGuestbook,
}) => {
  const isPlaza = wedding.tier === 'PUBLIC_PLAZA';
  const [authUser, setAuthUser] = useState<{
    id: string;
    displayName: string;
    provider?: AuthProvider;
  } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Pre-entry avatar config
  const [displayName, setDisplayName] = useState('');
  const [side, setSide] = useState<GuestSide>('FRIEND');
  const [outfitId, setOutfitId] = useState('ao_dai_guest');
  const [hairId, setHairId] = useState('hair_4');
  const [hairColor, setHairColor] = useState('#1f2937');
  const [pin, setPin] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Connected room state
  const roomRef = useRef<ColyseusRoom | null>(null);
  const motionStoreRef = useRef<MotionStore>(new Map());
  const captureCanvasRef = useRef<(() => string | null) | null>(null);
  const [connected, setConnected] = useState(false);
  const [localSessionId, setLocalSessionId] = useState('');
  const [myRole, setMyRole] = useState('GUEST');
  const [shardIndex, setShardIndex] = useState(1);
  const [shards, setShards] = useState<Array<{ shardIndex: number; clients: number; maxClients: number }>>([]);
  const [players, setPlayers] = useState<RemotePlayerView[]>([]);
  const [npcs, setNpcs] = useState<RemoteNpcView[]>([]);
  const [bouquet, setBouquet] = useState<BouquetView>(DEFAULT_BOUQUET);
  const [activeRitual, setActiveRitual] = useState('NONE');
  const [stageBroadcastActive, setStageBroadcastActive] = useState(false);
  const [broadcastHostName, setBroadcastHostName] = useState('');
  const [giftBurstKey, setGiftBurstKey] = useState(0);

  // Overlays & modals
  const [photos, setPhotos] = useState<PhotoAssetRecord[]>(initialPhotos);
  const [guestbook, setGuestbook] = useState<GuestbookEntryRecord[]>(initialGuestbook);
  const [showGuestbook, setShowGuestbook] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showVideoPip, setShowVideoPip] = useState(false);
  const [photoboothDataUrl, setPhotoboothDataUrl] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoAssetRecord | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<RemotePlayerView | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [toastBanner, setToastBanner] = useState<string>('');
  const [bgmOn, setBgmOn] = useState(false);
  const [joystickInput, setJoystickInput] = useState({ dx: 0, dz: 0 });
  const joyOriginRef = useRef<{ x: number; y: number } | null>(null);
  const [waypointTarget, setWaypointTarget] = useState<{ x: number; z: number; key: number } | null>(
    null
  );
  const [showControlsHint, setShowControlsHint] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user) {
          setAuthUser(d.user);
          setDisplayName(d.user.displayName);
        } else if (isPlaza) {
          setDisplayName(POETIC_NAMES[Math.floor(Math.random() * POETIC_NAMES.length)]);
        }
      })
      .finally(() => setAuthChecked(true));
  }, [isPlaza]);

  const showNotice = useCallback((msg: string) => {
    setToastBanner(msg);
    setTimeout(() => {
      setToastBanner((cur) => (cur === msg ? '' : cur));
    }, 5500);
  }, []);

  const connectToHall = useCallback(
    async (requestedShard?: number) => {
      setJoining(true);
      setJoinError('');
      try {
        if (roomRef.current) {
          await roomRef.current.leave();
          roomRef.current = null;
        }

        const guestId =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('dco_plaza_gid') ||
            (() => {
              const id = `plaza_${Math.random().toString(36).slice(2, 10)}`;
              window.localStorage.setItem('dco_plaza_gid', id);
              return id;
            })()
            : 'plaza_guest';

        const roleInviteToken =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('roleInvite') || undefined
            : undefined;

        const joinRes = await fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: displayName.trim() || 'Khách Quý',
            side,
            pin: pin || undefined,
            shardIndex: requestedShard,
            roleInviteToken,
            guestId,
            avatarConfig: {
              outfitId,
              hairId,
              hairColor,
            },
          }),
        });
        const joinData = await joinRes.json();
        if (!joinRes.ok) {
          throw new Error(
            joinData.message ||
            (joinData.error === 'INVALID_PIN'
              ? 'Mã PIN 4 số không đúng!'
              : joinData.error === 'USER_BANNED'
                ? 'Tài khoản của bạn đã bị chặn khỏi sảnh cưới này.'
                : joinData.error || 'Không thể vào sảnh')
          );
        }

        const client = new ColyseusClient(joinData.colyseusUrl);
        const room = await client.joinOrCreate('wedding_hall', {
          weddingId: wedding.id,
          slug: wedding.slug,
          shardIndex: joinData.shardIndex,
          joinToken: joinData.joinToken,
        });

        roomRef.current = room;
        setLocalSessionId(room.sessionId);
        setMyRole(joinData.role);
        setShardIndex(joinData.shardIndex);
        setShards(joinData.shards ?? []);
        setConnected(true);
        if (soundEngine.startBgm()) setBgmOn(true);

        // Positions stream into the motion tracks every patch (read each frame by the avatars);
        // React state — and with it a re-render of the whole hall — only changes when something
        // other than position does, or 4 times a second while people walk.
        const RERENDER_POSITIONS_MS = 250;
        let lastPlayersKey = '';
        let lastNpcsKey = '';
        let lastBouquetKey = '';
        let lastPositionsFlush = 0;
        let lastPositionsKey = '';
        let lastNpcPositionsKey = '';
        const tracks = motionStoreRef.current;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const syncState = (state: any) => {
          const now = performance.now();
          const seen = new Set<string>();
          state.players?.forEach((p: RemotePlayerView & { mt?: number }) => {
            seen.add(p.sessionId);
            let track = tracks.get(p.sessionId);
            if (!track) tracks.set(p.sessionId, (track = new MotionTrack()));
            track.push(p.x, p.z, p.rotY, p.mt ?? 0, now);
          });
          state.npcs?.forEach((n: RemoteNpcView) => {
            const key = npcTrackKey(n.npcId);
            seen.add(key);
            let track = tracks.get(key);
            if (!track) tracks.set(key, (track = new MotionTrack()));
            track.push(n.x, n.z, n.rotY, 0, now);
          });
          for (const id of Array.from(tracks.keys())) if (!seen.has(id)) tracks.delete(id);

          const pList: RemotePlayerView[] = [];
          state.players?.forEach((p: RemotePlayerView) => {
            pList.push({
              sessionId: p.sessionId,
              userId: p.userId,
              displayName: p.displayName,
              role: p.role,
              side: p.side,
              outfitId: p.outfitId,
              hairId: p.hairId,
              hairColor: p.hairColor,
              x: p.x,
              z: p.z,
              rotY: p.rotY,
              anim: p.anim,
              seatedTableNo: p.seatedTableNo,
              seatIndex: p.seatIndex,
              hasBouquetCrown: p.hasBouquetCrown,
              isSpeaking: p.isSpeaking,
              takingOverNpc: p.takingOverNpc,
              bubbleText: p.bubbleText,
            });
          });

          const positionsDue = now - lastPositionsFlush >= RERENDER_POSITIONS_MS;
          const playersKey = pList
            .map((p) =>
              [p.sessionId, p.displayName, p.role, p.side, p.outfitId, p.hairId, p.hairColor, p.anim, p.seatedTableNo, p.seatIndex, p.hasBouquetCrown, p.isSpeaking, p.takingOverNpc, p.bubbleText].join('|'),
            )
            .join('§');
          const positionsKey = pList.map((p) => `${p.x},${p.z},${p.rotY}`).join(';');
          if (playersKey !== lastPlayersKey || (positionsDue && positionsKey !== lastPositionsKey)) {
            lastPlayersKey = playersKey;
            lastPositionsKey = positionsKey;
            lastPositionsFlush = now;
            setPlayers(pList);
          }

          const nList: RemoteNpcView[] = [];
          state.npcs?.forEach((n: RemoteNpcView) => {
            nList.push({
              npcId: n.npcId,
              displayName: n.displayName,
              outfitId: n.outfitId,
              isTakenOver: n.isTakenOver,
              x: n.x,
              z: n.z,
              rotY: n.rotY,
              anim: n.anim,
              bubbleText: n.bubbleText,
            });
          });
          const npcsKey = nList.map((n) => [n.npcId, n.displayName, n.outfitId, n.isTakenOver, n.anim, n.bubbleText].join('|')).join('§');
          const npcPositionsKey = nList.map((n) => `${n.x},${n.z},${n.rotY}`).join(';');
          if (npcsKey !== lastNpcsKey || (positionsDue && npcPositionsKey !== lastNpcPositionsKey)) {
            lastNpcsKey = npcsKey;
            lastNpcPositionsKey = npcPositionsKey;
            lastPositionsFlush = now;
            setNpcs(nList);
          }

          if (state.ceremony) {
            setActiveRitual(state.ceremony.activeRitual);
            setStageBroadcastActive(state.ceremony.stageBroadcastActive);
            setBroadcastHostName(state.ceremony.broadcastHostName);
          }

          if (state.bouquet) {
            const b = state.bouquet;
            const bouquetKey = [b.status, b.originX, b.originZ, b.targetX, b.targetZ, b.tossStartTs, b.flightDurationMs].join('|');
            if (bouquetKey !== lastBouquetKey) {
              lastBouquetKey = bouquetKey;
              setBouquet({
                status: b.status,
                originX: b.originX,
                originZ: b.originZ,
                targetX: b.targetX,
                targetZ: b.targetZ,
                tossStartTs: b.tossStartTs,
                flightDurationMs: b.flightDurationMs,
              });
            }
          }
        };

        room.onStateChange(syncState);

        room.onMessage(
          WS_MESSAGES.GIFT_CELEBRATION_EVENT,
          (payload: { guestName: string; wishMessage: string }) => {
            setGiftBurstKey((k) => k + 1);
            soundEngine.playFireworkSfx();
            showNotice(`💝 ${payload.guestName} vừa gửi lời chúc: "${payload.wishMessage}"`);
          }
        );

        room.onMessage(WS_MESSAGES.BOUQUET_WON, (payload: { winnerName: string }) => {
          soundEngine.playBouquetSfx(true);
          showNotice(`💐 Chúc mừng ${payload.winnerName} đã bắt được hoa cưới! ("Người tiếp theo lên xe hoa")`);
        });

        room.onMessage(WS_MESSAGES.TABLE_CHEERS_BURST, (payload: { tableNo: number }) => {
          soundEngine.playCheersSfx();
          showNotice(`🥂 Bàn ${payload.tableNo} đồng thanh: 1... 2... 3... DZÔ!!`);
        });

        room.onMessage(WS_MESSAGES.ROOM_SYSTEM_NOTICE, (payload: { message: string }) => {
          soundEngine.playClapSfx();
          showNotice(`📢 ${payload.message}`);
        });

        room.onLeave((code) => {
          setConnected(false);
          if (code === 4003) {
            setJoinError('Bạn đã được mời rời khỏi sảnh bởi Chủ tiệc / MC.');
          }
        });
      } catch (err) {
        setJoinError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ Realtime');
      } finally {
        setJoining(false);
      }
    },
    [wedding.id, wedding.slug, displayName, side, pin, outfitId, hairId, hairColor, showNotice]
  );

  useEffect(() => {
    soundEngine.setStageDucking(stageBroadcastActive);
  }, [stageBroadcastActive]);

  useEffect(() => {
    return () => {
      soundEngine.stopBgm();
      if (roomRef.current) {
        roomRef.current.leave().catch(() => { });
      }
    };
  }, []);

  const localPlayer = players.find((p) => p.sessionId === localSessionId);
  const isHostOrMc = ['OWNER', 'BRIDE', 'GROOM', 'MC'].includes(myRole);
  const canGiftVietQr = TIER_CATALOG[wedding.tier].allowVietQr;

  const sendMsg = useCallback((type: string, data: unknown = {}) => {
    roomRef.current?.send(type, data);
  }, []);

  const handleLeaveToCustomizer = async () => {
    soundEngine.stopBgm();
    setBgmOn(false);
    if (roomRef.current) {
      await roomRef.current.leave().catch(() => { });
      roomRef.current = null;
    }
    setConnected(false);
  };

  const handleLogout = async () => {
    await handleLeaveToCustomizer();
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthUser(null);
  };

  const goToWaypoint = (target: 'GATE' | 'STAGE' | 'TABLES') => {
    const prefab =
      target === 'GATE'
        ? layout.prefabs.find((p) => p.prefabType === 'GATE_RECEPTION')
        : target === 'STAGE'
          ? layout.prefabs.find((p) => p.prefabType === 'STAGE_MAIN')
          : layout.prefabs.find((p) => p.prefabType.startsWith('BANQUET_TABLE'));
    if (!prefab) return;
    const c = getPrefabCenterWorld(prefab);
    const zOffset = target === 'STAGE' ? 3.2 : target === 'GATE' ? -2.2 : 2.1;
    setWaypointTarget({ x: c.x, z: c.z + zOffset, key: Date.now() });
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMsg(WS_MESSAGES.CHAT_BUBBLE, { text: chatInput.trim() });
    setChatInput('');
  };

  const handleCapturePhotobooth = () => {
    const dataUrl = captureCanvasRef.current?.();
    if (dataUrl) {
      setPhotoboothDataUrl(dataUrl);
    }
  };

  if (!isPlaza && !authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8] p-4">
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
          Đang chuẩn bị Sảnh Cưới 3D...
        </div>
      </div>
    );
  }

  // Show OAuth Gate first for Real Weddings if unauthenticated
  if (!isPlaza && authChecked && !authUser) {
    return (
      <OAuthModal
        title={`Tham Dự ${wedding.title}`}
        onAuthenticated={(u) => {
          setAuthUser(u);
          setDisplayName(u.displayName);
        }}
      />
    );
  }

  // Pre-Entry Avatar Customizer
  if (!connected) {
    return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-[#FFFDF8] to-amber-50 p-4">
              <div className="dco-fade-up w-full max-w-2xl rounded-3xl border border-amber-200 bg-white p-6 shadow-2xl sm:p-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-4">
                  <div>
                    <span className="inline-block rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold text-rose-700">
                      {TIER_CATALOG[wedding.tier].nameVi}
                    </span>
                    <h1 className="mt-2 font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
                      {wedding.title}
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                      {isPlaza
                        ? 'Truy cập ẩn danh trong 5 giây — Không cần tài khoản, không thu phí.'
                        : `Đã xác thực: ${authUser?.displayName || '...'}`}
                    </p>
                  </div>
                  {!isPlaza && authUser && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Đổi tài khoản
                    </button>
                  )}
                </div>

                {/* Live Chibi Identity Preview Card */}
                <div className="mb-5 flex items-center gap-4 rounded-2xl border border-amber-200/80 bg-[#FFFDF8] p-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-amber-300 bg-rose-50 shadow-inner">
                    <div
                      className="h-6 w-6 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: hairColor }}
                      title="Màu tóc đã chọn"
                    />
                    <span className="absolute -bottom-1.5 rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-amber-200">
                      Chibi
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {displayName.trim() || 'Khách Quý'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {OUTFIT_LABELS[outfitId] || outfitId} •{' '}
                      {HAIR_STYLES.find((h) => h.id === hairId)?.label || 'Tóc Tự Nhiên'}
                    </p>
                  </div>
                  {!isPlaza && (
                    <Link
                      href={`/w/${wedding.slug}/invite`}
                      className="hidden items-center gap-1 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 sm:inline-flex"
                    >
                      <Mail className="h-3.5 w-3.5" /> Thiệp 2D
                    </Link>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="chibi-display-name" className="mb-1 block text-xs font-semibold text-slate-700">
                      Tên trên đầu Chibi
                    </label>
                    <input
                      id="chibi-display-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nhập tên của bạn..."
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-500"
                    />
                  </div>

                  {!isPlaza && (
                    <div>
                      <span className="mb-1 block text-xs font-semibold text-slate-700">Vai vế khách mời</span>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {(
                          [
                            ['GROOM_SIDE', 'Họ Nhà Trai'],
                            ['BRIDE_SIDE', 'Họ Nhà Gái'],
                            ['FRIEND', 'Bạn Bè'],
                            ['COLLEAGUE', 'Đồng Nghiệp'],
                          ] as const
                    ).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSide(val)}
                        className={`rounded-xl border py-2 text-xs font-semibold transition ${
                          side === val
                            ? 'border-rose-600 bg-rose-50 text-rose-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="mb-1 block text-xs font-semibold text-slate-700">Trang phục Chibi</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(
                    [
                      ['ao_dai_guest', 'Áo Dài Hồng'],
                      ['vest_suit', 'Vest Lịch Lãm'],
                      ['evening_dress', 'Đầm Dạ Hội'],
                      ['smart_casual', 'Sơ Mi Trẻ Trung'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setOutfitId(id)}
                      className={`rounded-xl border py-2 text-xs font-semibold transition ${
                        outfitId === id
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Kiểu tóc Chibi</span>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {HAIR_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setHairId(style.id)}
                        className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                          hairId === style.id
                            ? 'border-rose-600 bg-rose-50 text-rose-800'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Màu tóc</span>
                  <div className="flex items-center gap-2 pt-1">
                    {HAIR_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setHairColor(c.hex)}
                        title={c.label}
                        aria-label={c.label}
                        style={{ backgroundColor: c.hex }}
                        className={`h-7 w-7 rounded-full border-2 transition ${hairColor === c.hex
                            ? 'scale-110 border-rose-600 ring-2 ring-rose-300'
                            : 'border-white shadow'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {!isPlaza && wedding.hasPin && (
                <div>
                  <label htmlFor="hall-pin" className="mb-1 block text-xs font-semibold text-slate-700">
                    Mã PIN Phòng (4 số)
                  </label>
                  <input
                    id="hall-pin"
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Nhập mã PIN từ thiệp mời..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-500"
                  />
                </div>
              )}

              {joinError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                    {joinError}
                  </div>
            )}

                  <button
                    type="button"
                    onClick={() => connectToHall()}
                    disabled={joining}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-rose-500 disabled:opacity-60"
                  >
                    {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {joining ? 'Đang bước vào sảnh 3D...' : 'Bước Vào Sảnh Cưới 3D'}
                  </button>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500">
                        <Link href="/" className="hover:text-rose-700 hover:underline">
                          ← Trang chủ
                        </Link>
                        {!isPlaza && (
                            <Link
                              href={`/dashboard/${wedding.slug}`}
                              className="font-semibold text-rose-600 hover:underline"
                            >
                              Quản trị sảnh (Cô Dâu / Chú Rể) →
                            </Link>
              )}
                          </div>
          </div>
                  </div>
                </div>
              );
  }

              return (
              <div className="relative h-screen w-screen overflow-hidden bg-slate-900">
                <VenueScene
                  layout={layout}
                  tier={wedding.tier}
                  photos={photos}
                  localSessionId={localSessionId}
                  players={players}
                  npcs={npcs}
                  motionStore={motionStoreRef.current}
                  bouquet={bouquet}
                  activeRitual={activeRitual}
                  giftBurstKey={giftBurstKey}
                  joystickInput={joystickInput}
                  waypointTarget={waypointTarget}
                  onMove={(x, z, rotY, isMoving) =>
                    sendMsg(WS_MESSAGES.MOVE_INPUT, { x, z, rotY, isMoving, t: Math.round(performance.now()) })
                  }
                  onSitSeat={(tableNo, seatIndex) => sendMsg(WS_MESSAGES.SIT_TABLE, { tableNo, seatIndex })}
                  onOpenGuestbook={() => setShowGuestbook(true)}
                  onOpenGiftBox={() => {
                    if (canGiftVietQr) setShowGiftModal(true);
                  }}
                  onOpenVideo={() => setShowVideoPip(true)}
                  onOpenPhoto={(photo) => {
                    if (photo) setLightboxPhoto(photo);
                    else showNotice('Khung ảnh này đang chờ Cô Dâu Chú Rể tải ảnh mới lên!');
                  }}
                  onSelectPlayer={(p) => {
                    if (isHostOrMc && p.sessionId !== localSessionId) setSelectedTarget(p);
                  }}
                  registerCaptureFn={(fn) => {
                    captureCanvasRef.current = fn;
                  }}
                />

                {/* Top Navigation & Shard HUD */}
                <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-2 p-3">
                      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl glass-panel px-3 py-1.5 shadow">
                        <button
                          type="button"
                          onClick={handleLeaveToCustomizer}
                          title="Đổi trang phục / Rời sảnh"
                          aria-label="Đổi trang phục"
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-white/90 px-2 py-1 text-[11px] font-bold text-rose-950 transition hover:bg-rose-50 hover:text-rose-700"
                        >
                          <ArrowLeft className="h-3 w-3" /> Đổi đồ
                        </button>
                        <span className="max-w-[180px] truncate text-xs font-bold text-slate-900 sm:max-w-xs">
                          {wedding.title}
                        </span>
                        <span className="tabular-nums flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                          <Users className="h-3 w-3" /> {players.length}
                        </span>
                        {shards.length > 1 && (
                          <select
                            value={shardIndex}
                            onChange={(e) => connectToHall(Number(e.target.value))}
                            className="rounded-lg border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-semibold"
                          >
                            {shards.map((s) => (
                              <option key={s.shardIndex} value={s.shardIndex}>
                                Sảnh {s.shardIndex} ({s.clients}/{s.maxClients})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBgmOn(soundEngine.toggleBgm())}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold shadow transition ${bgmOn ? 'bg-amber-500 text-white' : 'glass-panel text-rose-950 hover:bg-white'
                            }`}
                        >
                          {bgmOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                          {bgmOn ? 'Nhạc Cưới' : 'Tắt Nhạc'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowGuestbook(true)}
                          className="flex items-center gap-1 rounded-full glass-panel px-3 py-1.5 text-xs font-bold text-rose-950 shadow transition hover:bg-white"
                        >
                          <BookHeart className="h-3.5 w-3.5 text-rose-600" /> Lưu Bút
                        </button>
                        <button
                          type="button"
                          onClick={handleCapturePhotobooth}
                          className="flex items-center gap-1 rounded-full glass-panel px-3 py-1.5 text-xs font-bold text-rose-950 shadow transition hover:bg-white"
                        >
                          <Camera className="h-3.5 w-3.5 text-amber-600" /> Photobooth
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowVideoPip(true)}
                          className="flex items-center gap-1 rounded-full glass-panel px-3 py-1.5 text-xs font-bold text-rose-950 shadow transition hover:bg-white"
                        >
                          <Tv className="h-3.5 w-3.5 text-indigo-600" /> Video
                        </button>
                        {canGiftVietQr && (
                          <button
                            type="button"
                            onClick={() => setShowGiftModal(true)}
                            className="flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow transition hover:bg-rose-500"
                          >
                            <Gift className="h-3.5 w-3.5" /> Mừng Cưới
                          </button>
                        )}
                        {isHostOrMc && (
                          <Link
                            href={`/dashboard/${wedding.slug}`}
                            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-amber-300 shadow transition hover:bg-slate-800"
                          >
                            Quản Trị
                          </Link>
                        )}
                      </div>
                  </div>

                  {/* Quick Waypoints Navigation Bar */}
                  <div className="pointer-events-none fixed left-3 top-16 z-20 hidden sm:flex items-center gap-1.5">
                    <div className="pointer-events-auto flex items-center gap-1 rounded-full glass-panel px-2.5 py-1 shadow">
                      <Compass className="h-3.5 w-3.5 text-rose-600" />
                      <button
                        type="button"
                        onClick={() => goToWaypoint('GATE')}
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-rose-950 transition hover:bg-rose-50 hover:text-rose-700"
                      >
                        Cổng Hoa
                      </button>
                      <button
                        type="button"
                        onClick={() => goToWaypoint('STAGE')}
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-rose-950 transition hover:bg-rose-50 hover:text-rose-700"
                      >
                        Sân Khấu
                      </button>
                      <button
                        type="button"
                        onClick={() => goToWaypoint('TABLES')}
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-rose-950 transition hover:bg-rose-50 hover:text-rose-700"
                      >
                        Bàn Tiệc
                      </button>
                    </div>
                  </div>

                  {/* Global Toast / Webhook Gift Celebration Banner */}
                  {toastBanner && (
                    <div className="pointer-events-none fixed inset-x-0 top-16 z-30 flex justify-center px-4">
                        <div className="dco-toast-in rounded-2xl border border-amber-300 bg-rose-700/95 px-5 py-2.5 text-center text-xs font-bold text-white shadow-2xl sm:text-sm">
                          {toastBanner}
                        </div>
                      </div>
      )}

                      {/* Stage Broadcast Indicator */}
                      {stageBroadcastActive && (
                        <div className="pointer-events-none fixed left-1/2 top-28 z-20 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1 text-xs font-bold text-white shadow">
                          🎙️ {broadcastHostName || 'MC'} đang phát biểu trên sân khấu
                        </div>
                      )}

                      {/* Bouquet Catch Action Prompt */}
                      {(bouquet.status === 'COUNTDOWN' || bouquet.status === 'IN_FLIGHT') && (
                        <div className="fixed bottom-32 left-1/2 z-30 -translate-x-1/2">
                          <button
                            type="button"
                            onClick={() => sendMsg(WS_MESSAGES.ATTEMPT_CATCH)}
                            className="animate-pulse rounded-full border-2 border-amber-300 bg-rose-600 px-6 py-3 text-sm font-extrabold text-white shadow-2xl hover:bg-rose-500"
                          >
                            💐 NHẢY BẮT HOA CƯỚI NGAY!
                          </button>
                        </div>
                      )}

                      {/* Host / MC Control Panel */}
                      {isHostOrMc && (
                        <div className="fixed right-3 top-16 z-20 flex flex-col gap-1.5 rounded-2xl glass-panel p-2.5 shadow-xl">
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-rose-700">
                            <Crown className="h-3 w-3" /> Điều khiển {myRole}
                          </div>
                          {!localPlayer?.takingOverNpc ? (
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                type="button"
                                onClick={() => sendMsg(WS_MESSAGES.NPC_TAKEOVER, { targetNpc: 'BRIDE' })}
                                className="rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-800"
                              >
                                Nhập vai Cô Dâu
                              </button>
                              <button
                                type="button"
                                onClick={() => sendMsg(WS_MESSAGES.NPC_TAKEOVER, { targetNpc: 'GROOM' })}
                                className="rounded-lg bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-800"
                              >
                                Nhập vai Chú Rể
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => sendMsg(WS_MESSAGES.NPC_RELEASE)}
                              className="rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900"
                            >
                              Trả lại Auto-NPC
                            </button>
                          )}

                          <div className="grid grid-cols-2 gap-1">
                            <button
                              type="button"
                              onClick={() => sendMsg(WS_MESSAGES.TRIGGER_CEREMONY, { ritual: 'SPARKLERS' })}
                              className="flex items-center justify-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-[11px] font-bold text-white"
                            >
                              <Sparkles className="h-3 w-3" /> Pháo Điện
                            </button>
                            <button
                              type="button"
                              onClick={() => sendMsg(WS_MESSAGES.TOSS_BOUQUET)}
                              className="rounded-lg bg-pink-600 px-2 py-1 text-[11px] font-bold text-white"
                            >
                              💐 Tung Hoa
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              sendMsg(WS_MESSAGES.TRIGGER_CEREMONY, { stageBroadcast: !stageBroadcastActive })
                            }
                            className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                              stageBroadcastActive ? 'bg-emerald-600 text-white' : 'bg-white text-rose-950'
                            }`}
                          >
                            <Megaphone className="h-3 w-3" />{' '}
                            {stageBroadcastActive ? 'Tắt Mic Sân Khấu' : 'Phát Biểu Sân Khấu'}
                          </button>
        </div>
                  )}

                  {/* Seated Table HUD + Voice Chat */}
                  {localPlayer && localPlayer.seatedTableNo >= 0 && (
                    <div className="fixed bottom-20 left-1/2 z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl glass-panel px-4 py-2 shadow-xl">
                      <span className="text-xs font-bold text-rose-700">
                        🪑 Bàn {localPlayer.seatedTableNo}
                      </span>
                      <button
                        type="button"
                        onClick={() => sendMsg(WS_MESSAGES.TABLE_CHEERS)}
                        className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-amber-400"
                      >
                        <Wine className="h-3.5 w-3.5" /> 1-2-3 Dzô!
                      </button>
                      <TableVoiceManager
                        slug={wedding.slug}
                        tier={wedding.tier}
                        shardIndex={shardIndex}
                        seatedTableNo={localPlayer.seatedTableNo}
                        stageBroadcastActive={stageBroadcastActive}
                        isHostOrMc={isHostOrMc}
                        isMutedByMod={false}
                        onSpeakingChange={(speaking) => sendMsg(WS_MESSAGES.SPEAKING_STATE, { isSpeaking: speaking })}
                      />
                      <button
                        type="button"
                        onClick={() => sendMsg(WS_MESSAGES.STAND_UP)}
                        className="flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Đứng dậy
                      </button>
                    </div>
                  )}

                  {/* Mobile Touch Thumbstick */}
                  <div
                    onPointerDown={(e) => {
                      joyOriginRef.current = { x: e.clientX, y: e.clientY };
                    }}
                    onPointerMove={(e) => {
                      if (!joyOriginRef.current) return;
                      const dx = Math.max(-1, Math.min(1, (e.clientX - joyOriginRef.current.x) / 36));
                      const dz = Math.max(-1, Math.min(1, (e.clientY - joyOriginRef.current.y) / 36));
                      setJoystickInput({ dx, dz });
                    }}
                    onPointerUp={() => {
                      joyOriginRef.current = null;
                      setJoystickInput({ dx: 0, dz: 0 });
                    }}
                    onPointerCancel={() => {
                      joyOriginRef.current = null;
                      setJoystickInput({ dx: 0, dz: 0 });
                    }}
                    className="fixed bottom-16 left-4 z-20 flex h-20 w-20 touch-none items-center justify-center rounded-full border-2 border-white/50 bg-slate-900/35 backdrop-blur-sm sm:hidden"
                  >
                    <div
                      style={{
                        transform: `translate(${joystickInput.dx * 18}px, ${joystickInput.dz * 18}px)`,
                      }}
                      className="h-8 w-8 rounded-full bg-white/80 shadow"
                    />
                  </div>

                  {/* Subtle Dismissible Controls Hint */}
                  {showControlsHint && localPlayer && localPlayer.seatedTableNo < 0 && (
                    <div className="pointer-events-none fixed bottom-[4.5rem] left-1/2 z-20 hidden -translate-x-1/2 sm:block">
                      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-slate-950/65 px-3.5 py-1 text-[11px] font-medium text-amber-100 backdrop-blur-sm">
                        <span>WASD / Chạm sàn để đi • Kéo xoay góc nhìn • Bấm ghế để ngồi</span>
                        <button
                          type="button"
                          onClick={() => setShowControlsHint(false)}
                          aria-label="Ẩn hướng dẫn"
                          className="rounded-full p-0.5 text-amber-200/80 transition hover:bg-white/15 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bottom Chat & Emotes Bar */}
                  <div className="fixed inset-x-0 bottom-3 z-20 flex justify-center px-3">
                        <div className="flex w-full max-w-2xl items-center gap-1.5 rounded-2xl glass-panel p-2 shadow-xl sm:gap-2">
                          <div className="flex shrink-0 gap-1">
                            {(
                              [
                                ['wave', 'Vẫy', Hand],
                                ['clap', 'Vỗ tay', Sparkles],
                                ['bow', 'Chào', Crown],
                              ] as const
            ).map(([anim, label, Icon]) => (
                              <button
                                key={anim}
                                type="button"
                                title={label}
                                aria-label={label}
                                onClick={() => {
                                  if (anim === 'clap') soundEngine.playClapSfx();
                                  sendMsg(WS_MESSAGES.EMOTE, { anim });
                                }}
                                className="inline-flex items-center gap-1 rounded-xl border border-amber-200/70 bg-white px-2 py-1.5 text-[11px] font-bold text-rose-950 shadow-sm transition hover:bg-rose-50 hover:text-rose-700"
                              >
                                <Icon className="h-3.5 w-3.5 text-rose-600" />
                                <span className="hidden md:inline">{label}</span>
                              </button>
                            ))}
                          </div>
                          <form onSubmit={handleChatSubmit} className="flex flex-1 gap-2">
                            <input
                              type="text"
                              maxLength={80}
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Nhắn bong bóng chúc mừng (tối đa 80 ký tự)..."
                              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-rose-500 sm:text-sm"
                            />
                            <button
                              type="submit"
                              className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
                            >
                              Gửi
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Modals */}
                      {showVideoPip && (
                        <VideoPipOverlay
                          embedUrl={wedding.videoEmbedUrl || ''}
                          isLive={wedding.videoIsLive}
                          onClose={() => setShowVideoPip(false)}
                        />
                      )}

                      {showGuestbook && (
                        <GuestbookModal
                          slug={wedding.slug}
                          entries={guestbook}
                          defaultName={displayName}
                          defaultSide={side}
                          onEntryAdded={(entry) => setGuestbook((prev) => [entry, ...prev])}
                          onClose={() => setShowGuestbook(false)}
                        />
                      )}

                      {showGiftModal && canGiftVietQr && (
                        <VietQrGiftModal
                          slug={wedding.slug}
                          brideName={wedding.brideName}
                          groomName={wedding.groomName}
                          onClose={() => setShowGiftModal(false)}
                        />
                      )}

                      {photoboothDataUrl && (
                        <PhotoboothModal
                          slug={wedding.slug}
                          weddingTitle={wedding.title}
                          weddingDate={wedding.weddingDate}
                          tier={wedding.tier}
                          rawSnapshotDataUrl={photoboothDataUrl}
                          onClose={() => setPhotoboothDataUrl(null)}
                          onSaved={() => {
                            fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}/photos`)
                              .then((r) => r.json())
                              .then((d) => {
                                if (d.photos) setPhotos(d.photos);
                              });
                          }}
                        />
                      )}

                      {lightboxPhoto && (
                        <div
                          onClick={() => setLightboxPhoto(null)}
                          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
                        >
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-lg rounded-3xl bg-white p-4 shadow-2xl"
                          >
                            <img
                              src={lightboxPhoto.publicUrl}
                              alt={lightboxPhoto.caption || 'Ảnh cưới'}
                              className="max-h-[70vh] rounded-2xl object-contain"
                            />
                            {lightboxPhoto.caption && (
                              <p className="mt-2 text-center text-sm font-medium text-slate-700">
                                {lightboxPhoto.caption}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedTarget && isHostOrMc && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                          <div className="w-full max-w-xs rounded-2xl bg-white p-4 shadow-xl">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                              <ShieldAlert className="h-4 w-4 text-rose-600" />
                              Kiểm duyệt: {selectedTarget.displayName}
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {(
                                [
                                  ['MUTE', 'Tắt Tiếng'],
                                  ['KICK', 'Mời Ra'],
                                  ['BAN', 'Chặn UID'],
                                ] as const
                              ).map(([action, label]) => (
                                <button
                                  key={action}
                                  type="button"
                                  onClick={() => {
                                    sendMsg(WS_MESSAGES.MOD_ACTION, {
                                      targetUserId: selectedTarget.userId,
                                      action,
                                    });
                                    setSelectedTarget(null);
                                  }}
                                  className="rounded-xl bg-rose-100 py-2 text-xs font-bold text-rose-700 hover:bg-rose-200"
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedTarget(null)}
                              className="mt-2 w-full rounded-xl bg-slate-100 py-1.5 text-xs text-slate-600"
                            >
                              Đóng
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    );
};
