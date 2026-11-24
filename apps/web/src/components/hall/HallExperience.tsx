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
  LayoutGrid,
  Loader2,
  LogOut,
  Mail,
  Megaphone,
  MessageCircleHeart,
  ShieldAlert,
  Smile,
  Sparkles,
  Tv,
  Users,
  Volume2,
  VolumeX,
  Wine,
  X,
  Dices,
  PartyPopper,
  RotateCcw,
  RotateCw,
  ScanFace,
  User,
} from 'lucide-react';
import type { GuestbookEntryRecord, PhotoAssetRecord, PublicWeddingDTO } from '@dco/database';
import {
  TIER_CATALOG,
  WS_MESSAGES,
  getFireworkPack,
  getPrefabCenterWorld,
  type AuthProvider,
  type FireworksShow,
  type GuestSide,
  type HallChatMessage,
  type PrivateMessage,
  type SceneLayoutDocument,
} from '@dco/shared';
import { soundEngine } from '@/lib/soundEngine';
import type { BouquetView, RemoteNpcView, RemotePlayerView } from '../three/VenueScene';
import { MotionTrack, PEOPLE, npcTrackKey, sanitizePersonId, type MotionStore } from '@dco/shared';
import { OAuthModal } from './OAuthModal';
import { VideoPipOverlay } from './VideoPipOverlay';
import { PhotoboothModal } from './PhotoboothModal';
import { VietQrGiftModal } from './VietQrGiftModal';
import { GuestbookModal } from './GuestbookModal';
import { TableVoiceManager } from './TableVoiceManager';
import { HallChatPanel, type DmThread } from './HallChatPanel';
import { FireworksModal } from './FireworksModal';
import { PlayerCard } from './PlayerCard';
import type { ScheduledFireworks } from '../three/Fireworks';
import { StarPortalLoader } from '../threeui/StarPortalLoader';
import { CharacterWaveCarousel } from '../threeui/OrbitalVenueGallery';
import { LiquidMetalButton } from '../threeui/LiquidMetalButton';

const VenueScene = dynamic(
  () => import('../three/VenueScene').then((mod) => mod.VenueScene),
  {
    ssr: false,
    loading: () => (
      <StarPortalLoader
        fullscreen={false}
        title="Đang Mở Cổng Sảnh Cưới 3D"
        subtitle="Đang dựng không gian tiệc cưới & đồng bộ khách mời…"
      />
    ),
  }
);

// Lobby character preview (3D, browser only)
const AvatarPreview = dynamic(() => import('../three/AvatarPreview'), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-xs text-slate-500">Đang dựng nhân vật 3D…</div>,
});


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
  // A real, motion-captured person by default; '' = the stylised figure with outfit/hair choices
  const [personId, setPersonIdState] = useState('female_party_02');
  const [personFilter, setPersonFilter] = useState<'all' | 'f' | 'm'>('all');
  const [previewAnim, setPreviewAnim] = useState('idle');
  const [previewFocus, setPreviewFocus] = useState<'body' | 'face'>('body');
  const [previewSpin, setPreviewSpin] = useState(true);
  const previewTimer = useRef<number | null>(null);
  const tryAction = useCallback((anim: string) => {
    setPreviewAnim(anim);
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => setPreviewAnim('idle'), 3200);
  }, []);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('dco_person');
      if (saved !== null) setPersonIdState(sanitizePersonId(saved));
    } catch {
      /* private mode: keep the default */
    }
  }, []);
  const setPersonId = useCallback((id: string) => {
    setPersonIdState(id);
    try {
      window.localStorage.setItem('dco_person', id);
    } catch {
      /* not remembered, still used for this visit */
    }
  }, []);
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

  // Shared congratulations chat, private messages, fireworks
  const [myUserId, setMyUserId] = useState('');
  const [hallChat, setHallChat] = useState<HallChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<'chat' | 'dm'>('chat');
  const [chatUnread, setChatUnread] = useState(0);
  const [dmThreads, setDmThreads] = useState<Record<string, DmThread>>({});
  const [dmPeer, setDmPeer] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [fireworks, setFireworks] = useState<ScheduledFireworks[]>([]);
  const [fireworksBanner, setFireworksBanner] = useState<FireworksShow | null>(null);
  const [showFireworksModal, setShowFireworksModal] = useState(false);
  /** Phone nav bar: which pop-up above it is open */
  const [mobileMenu, setMobileMenu] = useState<'none' | 'emotes' | 'more'>('none');
  const [showSignIn, setShowSignIn] = useState(false);
  // The message handlers are bound once per connection; they read the live UI state from here
  const socialRef = useRef({ open: false, tab: 'chat' as 'chat' | 'dm', peer: null as string | null, me: '', blocked: new Set<string>() });
  socialRef.current = { open: chatOpen, tab: chatTab, peer: dmPeer, me: myUserId, blocked };

  useEffect(() => {
    // Desktop starts with the chat open; phones start with it folded away
    setChatOpen(window.matchMedia('(min-width: 1024px)').matches);
    try {
      const saved = JSON.parse(window.localStorage.getItem('dco_dm_blocked') || '[]');
      if (Array.isArray(saved)) setBlocked(new Set(saved.filter((x) => typeof x === 'string')));
    } catch {
      /* nothing blocked */
    }
  }, []);
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
              personId,
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
        setMyUserId(String(joinData.userId ?? ''));
        setHallChat([]);
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
              personId: p.personId,
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
              isMuted: p.isMuted,
            });
          });

          const positionsDue = now - lastPositionsFlush >= RERENDER_POSITIONS_MS;
          const playersKey = pList
            .map((p) =>
              [p.sessionId, p.displayName, p.role, p.side, p.outfitId, p.hairId, p.hairColor, p.personId, p.anim, p.seatedTableNo, p.seatIndex, p.hasBouquetCrown, p.isSpeaking, p.takingOverNpc, p.bubbleText, p.isMuted].join('|'),
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
              personId: n.personId,
              isTakenOver: n.isTakenOver,
              x: n.x,
              z: n.z,
              rotY: n.rotY,
              anim: n.anim,
              bubbleText: n.bubbleText,
            });
          });
          const npcsKey = nList.map((n) => [n.npcId, n.displayName, n.outfitId, n.personId, n.isTakenOver, n.anim, n.bubbleText].join('|')).join('§');
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

        room.onMessage(WS_MESSAGES.HALL_CHAT_HISTORY, (list: HallChatMessage[]) => {
          if (!Array.isArray(list)) return;
          // Merge rather than replace: a line may have arrived just before the history did
          setHallChat((prev) => {
            const ids = new Set(list.map((m) => m.id));
            return [...list, ...prev.filter((m) => !ids.has(m.id))].slice(-150);
          });
        });

        room.onMessage(WS_MESSAGES.HALL_CHAT, (m: HallChatMessage) => {
          setHallChat((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev.slice(-149), m]));
          const ui = socialRef.current;
          if (m.userId !== ui.me && !(ui.open && ui.tab === 'chat')) setChatUnread((n) => n + 1);
        });

        room.onMessage(WS_MESSAGES.DM, (m: PrivateMessage) => {
          const ui = socialRef.current;
          const incoming = m.fromUserId !== ui.me;
          const peerId = incoming ? m.fromUserId : m.toUserId;
          if (incoming && ui.blocked.has(peerId)) return;
          const viewing = ui.open && ui.tab === 'dm' && ui.peer === peerId;
          setDmThreads((prev) => {
            const t = prev[peerId] ?? { userId: peerId, name: incoming ? m.fromName : m.toName, messages: [], unread: 0, lastTs: 0 };
            if (t.messages.some((x) => x.id === m.id)) return prev;
            return {
              ...prev,
              [peerId]: {
                ...t,
                name: incoming ? m.fromName : t.name,
                messages: [...t.messages.slice(-199), m],
                unread: incoming && !viewing ? t.unread + 1 : t.unread,
                lastTs: m.ts,
              },
            };
          });
          if (incoming && !viewing) {
            soundEngine.playMessagePing();
            if (!(ui.open && ui.tab === 'dm')) showNotice(`✉️ Tin nhắn riêng từ ${m.fromName}`);
          }
        });

        room.onMessage(WS_MESSAGES.DM_FAILED, (p: { reason: string }) => {
          showNotice(
            p.reason === 'TOO_FAST'
              ? 'Bạn nhắn hơi nhanh, chờ một chút rồi gửi tiếp nhé.'
              : p.reason === 'MUTED'
                ? 'Bạn đang bị tắt tiếng nên chưa nhắn được.'
                : 'Quảng trường công cộng không có tin nhắn riêng.',
          );
        });

        room.onMessage(WS_MESSAGES.FIREWORKS_SHOW, (p: FireworksShow & { delayMs: number }) => {
          const now = performance.now() / 1000;
          const startAt = now + Math.max(0, Number(p.delayMs) || 0) / 1000;
          const pack = getFireworkPack(p.packId);
          setFireworks((prev) => [...prev.filter((f) => f.startAt > now - 40), { ...p, startAt }]);
          window.setTimeout(() => {
            setFireworksBanner(p);
            // On a phone the open chat covers the sky: fold it for the show
            if (!window.matchMedia('(min-width: 1024px)').matches) setChatOpen(false);
            window.setTimeout(() => setFireworksBanner((cur) => (cur?.id === p.id ? null : cur)), Math.max(6000, (pack?.durationMs ?? 8000) - 1000));
          }, Math.max(0, Number(p.delayMs) || 0));
        });

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
    [wedding.id, wedding.slug, displayName, side, pin, outfitId, hairId, hairColor, personId, showNotice]
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

  const sendHallChat = (text: string) => sendMsg(WS_MESSAGES.HALL_CHAT_SEND, { text });

  const sendDm = (toUserId: string, toName: string, text: string) => sendMsg(WS_MESSAGES.DM_SEND, { toUserId, toName, text });

  const openDmWith = (p: { userId: string; displayName: string }) => {
    setDmThreads((prev) => (prev[p.userId] ? prev : { ...prev, [p.userId]: { userId: p.userId, name: p.displayName, messages: [], unread: 0, lastTs: Date.now() } }));
    setDmPeer(p.userId);
    setChatTab('dm');
    setChatOpen(true);
  };

  const toggleBlock = (userId: string) => {
    setBlocked((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      try {
        window.localStorage.setItem('dco_dm_blocked', JSON.stringify(Array.from(next)));
      } catch {
        /* kept for this visit */
      }
      return next;
    });
  };

  // Reading a tab / thread clears its unread count
  useEffect(() => {
    if (chatOpen && chatTab === 'chat') setChatUnread(0);
    if (chatOpen && chatTab === 'dm' && dmPeer) {
      setDmThreads((prev) => (prev[dmPeer]?.unread ? { ...prev, [dmPeer]: { ...prev[dmPeer], unread: 0 } } : prev));
    }
  }, [chatOpen, chatTab, dmPeer, hallChat.length, dmThreads]);

  const handleCapturePhotobooth = () => {
    const dataUrl = captureCanvasRef.current?.();
    if (dataUrl) {
      setPhotoboothDataUrl(dataUrl);
    }
  };

  const chatBadge = chatUnread + Object.values(dmThreads).reduce((n, t) => n + t.unread, 0);

  const sendEmote = (anim: 'wave' | 'clap' | 'bow') => {
    if (anim === 'clap') soundEngine.playClapSfx();
    sendMsg(WS_MESSAGES.EMOTE, { anim });
  };

  const mobileNavItemClass = (active: boolean) =>
    `relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl text-[10.5px] font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
      active ? 'bg-rose-100/80 text-rose-800' : 'text-rose-950/80'
    }`;

  /** Run a phone-menu action and fold the menu away */
  const fromMobileMenu = (action: () => void) => () => {
    setMobileMenu('none');
    action();
  };

  /** Couple / MC controls: a floating panel on desktop, inside "Thêm" on phones */
  const renderHostControls = () => (
    <>
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
        onClick={() => sendMsg(WS_MESSAGES.TRIGGER_CEREMONY, { stageBroadcast: !stageBroadcastActive })}
        className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
          stageBroadcastActive ? 'bg-emerald-600 text-white' : 'bg-white text-rose-950'
        }`}
      >
        <Megaphone className="h-3 w-3" /> {stageBroadcastActive ? 'Tắt Mic Sân Khấu' : 'Phát Biểu Sân Khấu'}
      </button>
    </>
  );

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

  // Pre-entry character creator: big 3D preview on one side, choices on the other
  if (!connected) {
    const shownPeople = PEOPLE.filter((p) => personFilter === 'all' || p.body === personFilter);
    const lookLabel = personId
      ? PEOPLE.find((p) => p.id === personId)?.label ?? 'Nhân vật thật'
      : `${OUTFIT_LABELS[outfitId] || outfitId} • ${HAIR_STYLES.find((h) => h.id === hairId)?.label || 'Tóc Tự Nhiên'}`;
    const toolBtn =
      'pointer-events-auto inline-flex min-h-[38px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/90 px-2.5 text-[11px] font-bold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white sm:px-3 sm:text-xs';
    return (
      <div className="min-h-screen bg-[#FFFDF8] lg:grid lg:h-screen lg:grid-cols-[minmax(0,1fr)_minmax(400px,460px)] lg:overflow-hidden">
        {/* ── Preview ── */}
        <section aria-label="Xem trước nhân vật" className="relative h-[56vh] min-h-[340px] bg-gradient-to-b from-[#fff8f1] via-[#fbefe7] to-[#f1dccf] lg:h-screen">
          <AvatarPreview
            personId={personId}
            outfitId={outfitId}
            hairId={hairId}
            hairColor={hairColor}
            displayName={displayName.trim() || 'Khách Quý'}
            anim={previewAnim}
            focus={previewFocus}
            spin={previewSpin}
            onUserRotate={() => setPreviewSpin(false)}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
            <div role="radiogroup" aria-label="Góc nhìn" className="pointer-events-auto flex rounded-full bg-white/90 p-1 shadow-sm backdrop-blur">
              {(
                [
                  ['body', 'Toàn thân', User],
                  ['face', 'Gương mặt', ScanFace],
                ] as const
              ).map(([f, label, Icon]) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={previewFocus === f}
                  onClick={() => setPreviewFocus(f)}
                  className={`inline-flex min-h-[34px] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11px] font-bold transition sm:px-3 sm:text-xs ${previewFocus === f ? 'bg-rose-600 text-white' : 'text-slate-700 hover:bg-rose-50'}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setPreviewSpin((v) => !v)} aria-pressed={previewSpin} aria-label="Tự xoay" title="Tự xoay" className={toolBtn}>
                <RotateCw className={`h-3.5 w-3.5 ${previewSpin ? 'text-rose-600' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const pool = shownPeople.filter((p) => p.id !== personId);
                  if (pool.length) setPersonId(pool[Math.floor(Math.random() * pool.length)].id);
                }}
                className={toolBtn}
              >
                <Dices className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Ngẫu nhiên</span>
              </button>
              <button
                type="button"
                aria-label="Đặt lại"
                title="Đặt lại"
                onClick={() => {
                  setPersonId('female_party_02');
                  setPersonFilter('all');
                  setPreviewFocus('body');
                  setPreviewSpin(true);
                  setPreviewAnim('idle');
                }}
                className={toolBtn}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-3 sm:p-4">
            <p className="text-[11px] font-medium text-slate-600">Kéo để xoay · Cuộn để phóng to</p>
            <div className="flex max-w-full gap-1.5 overflow-x-auto px-1">
              {(
                [
                  ['wave', 'Vẫy tay', Hand],
                  ['clap', 'Vỗ tay', Sparkles],
                  ['cheers', 'Reo hò', PartyPopper],
                  ['drink', 'Nâng ly', Wine],
                ] as const
              ).map(([anim, label, Icon]) => (
                <button
                  key={anim}
                  type="button"
                  onClick={() => tryAction(anim)}
                  aria-pressed={previewAnim === anim}
                  className={`${toolBtn} ${previewAnim === anim ? '!bg-rose-600 !text-white' : ''}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Choices ── */}
        <section aria-label="Chọn nhân vật" className="flex flex-col border-amber-100 bg-[#FFFDF8] lg:h-screen lg:border-l">
          <div className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:overflow-y-auto lg:pb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">{TIER_CATALOG[wedding.tier].nameVi}</span>
                <h1 className="mt-1.5 font-serif text-2xl font-bold leading-tight text-slate-900">{wedding.title}</h1>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {isPlaza ? 'Vào ẩn danh, không cần tài khoản.' : `Đã xác thực: ${authUser?.displayName || '...'}`}
                </p>
              </div>
              {!isPlaza && authUser && (
                <button type="button" onClick={handleLogout} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                  <LogOut className="h-3.5 w-3.5" /> Đổi tài khoản
                </button>
              )}
            </div>

            {/* Name and side */}
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <label className="block">
                <span className="sr-only">Tên hiển thị trong sảnh</span>
                <input
                  id="chibi-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tên hiển thị trong sảnh"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-500"
                />
              </label>
              {!isPlaza && (
                <label className="block">
                  <span className="sr-only">Vai vế khách mời</span>
                  <select
                    value={side}
                    onChange={(e) => setSide(e.target.value as GuestSide)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-500"
                  >
                    <option value="GROOM_SIDE">Họ nhà trai</option>
                    <option value="BRIDE_SIDE">Họ nhà gái</option>
                    <option value="FRIEND">Bạn bè</option>
                    <option value="COLLEAGUE">Đồng nghiệp</option>
                  </select>
                </label>
              )}
            </div>

            {/* People */}
            <div className="mt-5 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold leading-tight text-slate-900">Chọn người đại diện</h2>
              <div role="radiogroup" aria-label="Lọc nhân vật" className="flex gap-1">
                {(
                  [
                    ['all', 'Tất cả'],
                    ['f', 'Nữ'],
                    ['m', 'Nam'],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    role="radio"
                    aria-checked={personFilter === val}
                    onClick={() => setPersonFilter(val)}
                    className={`min-h-[32px] whitespace-nowrap rounded-full px-3 text-[11px] font-bold transition ${personFilter === val ? 'bg-slate-900 text-amber-100' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <CharacterWaveCarousel people={shownPeople} selectedId={personId} onSelect={setPersonId} />
            </div>
            <div role="radiogroup" aria-label="Nhân vật" className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {shownPeople.map((p, pIdx) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={personId === p.id}
                  aria-label={p.label ?? p.id}
                  onClick={() => setPersonId(p.id)}
                  className={`overflow-hidden rounded-2xl border-2 bg-gradient-to-b from-white to-[#f6ece6] text-left transition ${personId === p.id ? 'border-rose-600 shadow-md ring-2 ring-rose-200' : 'border-transparent hover:border-rose-200'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/assets/people/${p.id}.webp`}
                    alt={p.label ? `Nhân vật 3D ${p.label}` : 'Nhân vật 3D khách mời'}
                    width={160}
                    height={160}
                    loading={pIdx < 4 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="aspect-square w-full object-cover object-top"
                  />
                  <span className="block truncate px-1.5 py-1 text-center text-[11px] font-semibold text-slate-700">{p.label}</span>
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={personId === ''}
                onClick={() => setPersonId('')}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-white px-2 text-center transition ${personId === '' ? 'border-rose-600 shadow-md ring-2 ring-rose-200' : 'border-dashed border-slate-300 hover:border-rose-200'}`}
              >
                <Sparkles className="h-5 w-5 text-rose-500" />
                <span className="text-[11px] font-bold leading-tight text-slate-700">Hình vẽ tự phối</span>
                <span className="text-[10px] leading-tight text-slate-500">Áo dài, tóc tự chọn</span>
              </button>
            </div>

            {/* Mix-and-match options for the drawn figure */}
            {!personId && (
              <div className="mt-5 space-y-4 rounded-2xl border border-amber-200 bg-white p-4">
                <div>
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">Trang phục</span>
                  <div className="grid grid-cols-2 gap-2">
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
                        aria-pressed={outfitId === id}
                        onClick={() => setOutfitId(id)}
                        className={`min-h-[40px] rounded-xl border text-xs font-semibold transition ${outfitId === id ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">Kiểu tóc</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {HAIR_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        aria-pressed={hairId === style.id}
                        onClick={() => setHairId(style.id)}
                        className={`min-h-[36px] rounded-xl border px-2 text-[11px] font-semibold transition ${hairId === style.id ? 'border-rose-600 bg-rose-50 text-rose-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">Màu tóc</span>
                  <div className="flex items-center gap-2">
                    {HAIR_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setHairColor(c.hex)}
                        title={c.label}
                        aria-label={c.label}
                        aria-pressed={hairColor === c.hex}
                        style={{ backgroundColor: c.hex }}
                        className={`h-8 w-8 rounded-full border-2 transition ${hairColor === c.hex ? 'scale-110 border-rose-600 ring-2 ring-rose-300' : 'border-white shadow'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!isPlaza && wedding.hasPin && (
              <label className="mt-5 block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Mã PIN phòng (4 số)</span>
                <input
                  id="hall-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Mã PIN trên thiệp mời"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-500"
                />
              </label>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <Link href="/" className="hover:text-rose-700 hover:underline">
                ← Trang chủ
              </Link>
              {!isPlaza && (
                <span className="flex gap-3">
                  <Link href={`/w/${wedding.slug}/invite`} className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:underline">
                    <Mail className="h-3.5 w-3.5" /> Thiệp cưới
                  </Link>
                  <Link href={`/dashboard/${wedding.slug}`} className="font-semibold text-rose-600 hover:underline">
                    Quản trị sảnh →
                  </Link>
                </span>
              )}
            </div>
          </div>

          {/* Enter: pinned to the bottom of the panel (the screen on phones) */}
          <div className="fixed inset-x-0 bottom-0 z-10 border-t border-amber-100 bg-[#FFFDF8]/95 p-3 backdrop-blur lg:static lg:bg-[#FFFDF8] lg:p-4">
            {joinError && <p className="mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{joinError}</p>}
            <LiquidMetalButton
              onClick={() => connectToHall()}
              disabled={joining}
              variant="crimson"
              className="min-h-[52px] w-full"
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {joining ? 'Đang bước vào sảnh…' : 'Mang nhân vật vào sảnh cưới'}
            </LiquidMetalButton>
            <p className="mt-1.5 truncate text-center text-[11px] text-slate-500 lg:hidden">{lookLabel}</p>
          </div>
        </section>
        <StarPortalLoader
          active={joining}
          title={wedding.title}
          subtitle="Đang mở cổng sao bước vào sảnh cưới 3D…"
        />
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
                    if (p.sessionId !== localSessionId) setSelectedTarget(p);
                  }}
                  fireworks={fireworks}
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

                      {/* Desktop action row; phones get the bottom nav bar instead */}
                      <div className="pointer-events-auto hidden flex-wrap items-center gap-1.5 sm:flex">
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

                      {/* Congratulations chat + private messages, top right */}
                      <div className="pointer-events-none fixed right-2 top-[3.75rem] z-30 flex justify-end sm:right-3 sm:top-16">
                        <HallChatPanel
                          hideTriggerOnMobile
                          myUserId={myUserId}
                          isPlaza={isPlaza}
                          muted={Boolean(localPlayer?.isMuted)}
                          open={chatOpen}
                          onOpenChange={setChatOpen}
                          tab={chatTab}
                          onTabChange={setChatTab}
                          messages={hallChat}
                          chatUnread={chatUnread}
                          threads={Object.values(dmThreads).sort((a, b) => b.lastTs - a.lastTs)}
                          dmPeer={dmPeer}
                          onDmPeerChange={setDmPeer}
                          onlineUserIds={new Set(players.map((p) => p.userId))}
                          blocked={blocked}
                          onToggleBlock={toggleBlock}
                          onSendChat={sendHallChat}
                          onSendDm={sendDm}
                          canGift={canGiftVietQr}
                          onGift={() => setShowGiftModal(true)}
                          onFireworks={() => setShowFireworksModal(true)}
                        />
                      </div>

                      {/* Who the fireworks are from, while they play (on phones it sits above the joystick) */}
                      {fireworksBanner && (
                        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(10.75rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4 sm:bottom-auto sm:top-[4.5rem]">
                          <div className="dco-toast-in max-w-md rounded-2xl border border-amber-300/60 bg-gradient-to-r from-[#2a1638]/95 to-[#5a1d42]/95 px-5 py-2.5 text-center text-amber-50 shadow-2xl backdrop-blur">
                            <p className="text-[13px] font-bold sm:text-sm">
                              🎆 {fireworksBanner.buyerName} bắn {getFireworkPack(fireworksBanner.packId)?.label.toLowerCase() ?? 'pháo hoa'} chúc mừng cô dâu chú rể
                            </p>
                            {fireworksBanner.message && <p className="mt-0.5 text-[12.5px] italic text-amber-100/90">“{fireworksBanner.message}”</p>}
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
                        <div className="fixed bottom-[calc(10.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 sm:bottom-32">
                          <button
                            type="button"
                            onClick={() => sendMsg(WS_MESSAGES.ATTEMPT_CATCH)}
                            className="animate-pulse rounded-full border-2 border-amber-300 bg-rose-600 px-6 py-3 text-sm font-extrabold text-white shadow-2xl hover:bg-rose-500"
                          >
                            💐 NHẢY BẮT HOA CƯỚI NGAY!
                          </button>
                        </div>
                      )}

                      {/* Host / MC Control Panel (desktop; on phones it lives under "Thêm") */}
                      {isHostOrMc && (
                        <div className="fixed left-3 top-[6.5rem] z-20 hidden flex-col gap-1.5 rounded-2xl glass-panel p-2.5 shadow-xl sm:flex">
                          {renderHostControls()}
                        </div>
                      )}

                  {/* Seated Table HUD + Voice Chat */}
                  {localPlayer && localPlayer.seatedTableNo >= 0 && (
                    <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 z-20 flex w-max max-w-[calc(100vw-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl glass-panel px-4 py-2 shadow-xl sm:bottom-20">
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

                  {/* Mobile Touch Thumbstick (hidden while seated: "Đứng dậy" stands you up) */}
                  {!(localPlayer && localPlayer.seatedTableNo >= 0) && (
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
                    className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-4 z-20 flex h-20 w-20 touch-none items-center justify-center rounded-full border-2 border-white/50 bg-slate-900/35 backdrop-blur-sm sm:hidden"
                  >
                    <div
                      style={{
                        transform: `translate(${joystickInput.dx * 18}px, ${joystickInput.dz * 18}px)`,
                      }}
                      className="h-8 w-8 rounded-full bg-white/80 shadow"
                    />
                  </div>
                  )}

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

                  {/* Desktop emotes + fireworks bar (phones use the nav bar below) */}
                  <div className="fixed inset-x-0 bottom-3 z-20 hidden justify-center px-3 sm:flex">
                        <div className="flex items-center gap-2 rounded-2xl glass-panel p-2 shadow-xl">
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
                                onClick={() => sendEmote(anim)}
                                className="inline-flex items-center gap-1 rounded-xl border border-amber-200/70 bg-white px-2 py-1.5 text-[11px] font-bold text-rose-950 shadow-sm transition hover:bg-rose-50 hover:text-rose-700"
                              >
                                <Icon className="h-3.5 w-3.5 text-rose-600" />
                                <span className="hidden md:inline">{label}</span>
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowFireworksModal(true)}
                            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#3a1b4a] to-[#7a2350] px-3 text-[12px] font-bold text-amber-100 shadow-sm transition hover:brightness-110"
                          >
                            <PartyPopper className="h-4 w-4 text-amber-300" /> Bắn pháo hoa
                          </button>
                        </div>
                      </div>

                  {/* ---------- Phone nav bar: every hall action in one strip at the bottom ---------- */}
                  {mobileMenu === 'more' && (
                    <button
                      type="button"
                      aria-label="Đóng menu"
                      onClick={() => setMobileMenu('none')}
                      className="fixed inset-0 z-30 cursor-default bg-slate-950/25 sm:hidden"
                    />
                  )}

                  {mobileMenu === 'emotes' && (
                    <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-2 sm:hidden">
                      <div role="group" aria-label="Cảm xúc" className="dco-toast-in flex gap-1.5 rounded-2xl border border-amber-200/70 bg-[#fffdf8]/95 p-1.5 shadow-[0_10px_28px_-8px_rgba(76,5,25,0.35)] backdrop-blur-md">
                        {(
                          [
                            ['wave', 'Vẫy tay', Hand],
                            ['clap', 'Vỗ tay', Sparkles],
                            ['bow', 'Cúi chào', Crown],
                          ] as const
                        ).map(([anim, label, Icon]) => (
                          <button
                            key={anim}
                            type="button"
                            onClick={() => sendEmote(anim)}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-white px-3.5 text-[12.5px] font-bold text-rose-950 ring-1 ring-amber-200/70 transition active:scale-95 active:bg-rose-50"
                          >
                            <Icon className="h-4 w-4 text-rose-600" aria-hidden="true" /> {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {mobileMenu === 'more' && (
                    <div
                      role="dialog"
                      aria-label="Thêm tiện ích"
                      className="dco-toast-in fixed inset-x-2 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 max-h-[calc(100dvh-10rem)] overflow-y-auto rounded-2xl border border-amber-200/70 bg-[#fffdf8] p-3 shadow-[0_14px_36px_-10px_rgba(76,5,25,0.45)] sm:hidden"
                    >
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          aria-pressed={bgmOn}
                          onClick={() => setBgmOn(soundEngine.toggleBgm())}
                          className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl bg-white text-[11.5px] font-bold text-rose-950 ring-1 ring-amber-100 transition active:scale-95 active:bg-rose-50"
                        >
                          {bgmOn ? (
                            <Volume2 className="h-5 w-5 text-amber-600" aria-hidden="true" />
                          ) : (
                            <VolumeX className="h-5 w-5 text-slate-400" aria-hidden="true" />
                          )}
                          {bgmOn ? 'Nhạc: bật' : 'Nhạc: tắt'}
                        </button>
                        {(
                          [
                            { key: 'guestbook', label: 'Lưu bút', Icon: BookHeart, tone: 'text-rose-600', run: () => setShowGuestbook(true) },
                            { key: 'photo', label: 'Chụp ảnh', Icon: Camera, tone: 'text-amber-600', run: handleCapturePhotobooth },
                            { key: 'video', label: 'Video', Icon: Tv, tone: 'text-indigo-600', run: () => setShowVideoPip(true) },
                          ] as const
                        ).map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={fromMobileMenu(item.run)}
                            className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl bg-white text-[11.5px] font-bold text-rose-950 ring-1 ring-amber-100 transition active:scale-95 active:bg-rose-50"
                          >
                            <item.Icon className={`h-5 w-5 ${item.tone}`} aria-hidden="true" />
                            {item.label}
                          </button>
                        ))}
                      </div>

                      <p className="mb-1.5 mt-3 flex items-center gap-1 px-0.5 text-[11.5px] font-bold text-rose-900/70">
                        <Compass className="h-3.5 w-3.5" aria-hidden="true" /> Đi nhanh tới
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            ['GATE', 'Cổng hoa'],
                            ['STAGE', 'Sân khấu'],
                            ['TABLES', 'Bàn tiệc'],
                          ] as const
                        ).map(([target, label]) => (
                          <button
                            key={target}
                            type="button"
                            onClick={fromMobileMenu(() => goToWaypoint(target))}
                            className="min-h-[40px] rounded-xl bg-rose-50 text-[12px] font-bold text-rose-900 transition active:scale-95 active:bg-rose-100"
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {isHostOrMc && (
                        <div className="mt-3 flex flex-col gap-1.5 rounded-xl bg-amber-50/70 p-2.5 ring-1 ring-amber-100">
                          {renderHostControls()}
                          <Link
                            href={`/dashboard/${wedding.slug}`}
                            className="mt-0.5 rounded-lg bg-slate-900 px-2 py-1.5 text-center text-[11.5px] font-bold text-amber-300"
                          >
                            Trang quản trị đám cưới
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  <nav
                    aria-label="Tiện ích sảnh cưới"
                    className="fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 grid auto-cols-fr grid-flow-col gap-0.5 rounded-2xl border border-amber-200/70 bg-[#fffdf8]/95 p-1 shadow-[0_10px_28px_-8px_rgba(76,5,25,0.4)] backdrop-blur-md sm:hidden"
                  >
                    <button
                      type="button"
                      aria-pressed={chatOpen}
                      aria-label={chatBadge ? `Chúc mừng, ${chatBadge} tin mới` : 'Chúc mừng'}
                      onClick={() => {
                        setMobileMenu('none');
                        setChatOpen(!chatOpen);
                      }}
                      className={mobileNavItemClass(chatOpen)}
                    >
                      <MessageCircleHeart className="h-5 w-5 text-rose-600" aria-hidden="true" />
                      Chúc mừng
                      {chatBadge > 0 && (
                        <span className="absolute left-1/2 top-0.5 ml-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold tabular-nums text-white ring-2 ring-[#fffdf8]">
                          {chatBadge > 99 ? '99+' : chatBadge}
                        </span>
                      )}
                    </button>
                    {canGiftVietQr && (
                      <button type="button" onClick={fromMobileMenu(() => setShowGiftModal(true))} className={mobileNavItemClass(false)}>
                        <Gift className="h-5 w-5 text-rose-600" aria-hidden="true" />
                        Mừng cưới
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={fromMobileMenu(() => {
                        setChatOpen(false);
                        setShowFireworksModal(true);
                      })}
                      className={mobileNavItemClass(false)}
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[#3a1b4a] to-[#7a2350]" aria-hidden="true">
                        <PartyPopper className="h-3.5 w-3.5 text-amber-300" />
                      </span>
                      Pháo hoa
                    </button>
                    <button
                      type="button"
                      aria-expanded={mobileMenu === 'emotes'}
                      onClick={() => setMobileMenu(mobileMenu === 'emotes' ? 'none' : 'emotes')}
                      className={mobileNavItemClass(mobileMenu === 'emotes')}
                    >
                      <Smile className="h-5 w-5 text-amber-600" aria-hidden="true" />
                      Cảm xúc
                    </button>
                    <button
                      type="button"
                      aria-expanded={mobileMenu === 'more'}
                      onClick={() => {
                        setChatOpen(false);
                        setMobileMenu(mobileMenu === 'more' ? 'none' : 'more');
                      }}
                      className={mobileNavItemClass(mobileMenu === 'more')}
                    >
                      <LayoutGrid className="h-5 w-5 text-rose-900/70" aria-hidden="true" />
                      Thêm
                    </button>
                  </nav>

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

                      {selectedTarget && (
                        <PlayerCard
                          player={selectedTarget}
                          canMessage={!isPlaza && Boolean(selectedTarget.userId) && selectedTarget.userId !== myUserId}
                          isHostOrMc={isHostOrMc}
                          online={players.some((p) => p.userId === selectedTarget.userId)}
                          onMessage={() => {
                            openDmWith(selectedTarget);
                            setSelectedTarget(null);
                          }}
                          onWave={() => {
                            sendMsg(WS_MESSAGES.EMOTE, { anim: 'wave' });
                            setSelectedTarget(null);
                          }}
                          onModerate={(action) => {
                            sendMsg(WS_MESSAGES.MOD_ACTION, { targetUserId: selectedTarget.userId, action });
                            setSelectedTarget(null);
                          }}
                          onClose={() => setSelectedTarget(null)}
                        />
                      )}

                      {showFireworksModal && (
                        <FireworksModal
                          slug={wedding.slug}
                          signedIn={Boolean(authUser)}
                          onNeedSignIn={() => setShowSignIn(true)}
                          onClose={() => setShowFireworksModal(false)}
                        />
                      )}

                      {showSignIn && !authUser && (
                        <div className="fixed inset-0 z-[60]">
                          <OAuthModal
                            title="Đăng nhập để mua pháo hoa"
                            subtitle="Đơn pháo hoa gắn với tài khoản của bạn để xác nhận khi tiền về."
                            onClose={() => setShowSignIn(false)}
                            onAuthenticated={(u) => {
                              setAuthUser(u);
                              setShowSignIn(false);
                            }}
                          />
                        </div>
                      )}
                    </div>
                    );
};
