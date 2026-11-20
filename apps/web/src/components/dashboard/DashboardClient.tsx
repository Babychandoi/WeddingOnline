'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Grid,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Mail,
  Printer,
  QrCode,
  Rocket,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type {
  GiftLedgerRecord,
  PhotoAssetRecord,
  PublicWeddingDTO,
  WeddingMemberRecord,
} from '@dco/database';
import { TIER_CATALOG, type SceneLayoutDocument, type WeddingTier } from '@dco/shared';
import { SceneBuilderEditor } from '../builder/SceneBuilderEditor';
import { PrintQrTab } from './PrintQrTab';
import { InvitationEditor } from './InvitationEditor';
import { RoomSetupEditor } from './RoomSetupEditor';
import { OAuthModal } from '../hall/OAuthModal';

interface DashboardClientProps {
  wedding: PublicWeddingDTO;
  ownerId: string;
  layout: SceneLayoutDocument;
  photos: PhotoAssetRecord[];
  /** Server allows the dev/demo login (never on a production deployment). */
  devAuthEnabled: boolean;
  /** Open on this tab (e.g. ?tab=thiep after picking an invitation template) */
  initialTab?: 'thiep' | 'setup';
}

type MemberWithUser = WeddingMemberRecord & { userDisplayName: string };

export const DashboardClient: React.FC<DashboardClientProps> = ({
  wedding: initialWedding,
  ownerId,
  layout,
  photos: initialPhotos,
  devAuthEnabled,
  initialTab,
}) => {
  const [wedding, setWedding] = useState(initialWedding);
  const [photos, setPhotos] = useState(initialPhotos);
  const [tab, setTab] = useState<'builder' | 'settings' | 'photos' | 'members' | 'thiep' | 'setup' | 'printqr' | 'ledger'>(initialTab ?? (initialWedding.invitationOnly ? 'thiep' : 'builder'));
  // One copy of the hall layout shared by the builder and the room setup tab
  const [layoutState, setLayoutState] = useState(layout);
  const [authUser, setAuthUser] = useState<{ id: string; displayName: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [hostAccessDenied, setHostAccessDenied] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Settings & Auto-NPC schedule state
  const [title, setTitle] = useState(initialWedding.title);
  const [videoEmbedUrl, setVideoEmbedUrl] = useState(initialWedding.videoEmbedUrl || '');
  const [videoIsLive, setVideoIsLive] = useState(initialWedding.videoIsLive);
  const [pin, setPin] = useState('');
  const [bankBin, setBankBin] = useState('970422');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankAccountName, setBankAccountName] = useState(initialWedding.bankAccountName || '');
  const [ceremonyTimeIso, setCeremonyTimeIso] = useState(() => {
    const raw = initialWedding.ceremonyConfig?.ceremonyTimeIso;
    return raw ? new Date(raw).toISOString().slice(0, 16) : '';
  });
  const [greetingMessage, setGreetingMessage] = useState(
    initialWedding.ceremonyConfig?.greetingMessage || 'Chào mừng gia đình & bạn bè đến dự tiệc 3D!'
  );
  const [autoBouquetToss, setAutoBouquetToss] = useState(
    initialWedding.ceremonyConfig?.autoBouquetToss !== false
  );
  const [saveNote, setSaveNote] = useState('');

  // Members & MC invites state
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [membersError, setMembersError] = useState('');
  const [inviteRole, setInviteRole] = useState<'MC' | 'BRIDE' | 'GROOM'>('MC');
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState('');

  // Private ledger state
  const [ledger, setLedger] = useState<GiftLedgerRecord[]>([]);
  const [totalVnd, setTotalVnd] = useState(0);
  const [ledgerError, setLedgerError] = useState('');

  // In-place upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<WeddingTier>('VIP_FULFILLMENT');
  const [upgradeOrder, setUpgradeOrder] = useState<{
    orderCode: string;
    qrDataUrl: string;
    amountVnd: number;
  } | null>(null);
  const [upgradePaid, setUpgradePaid] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeVoucher, setUpgradeVoucher] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setAuthUser(d.user);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!authUser) {
      setHostAccessDenied(false);
      return;
    }
    if (authUser.id === ownerId) {
      setHostAccessDenied(false);
      return;
    }
    fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}/members`)
      .then((r) => {
        setHostAccessDenied(r.status === 403);
      })
      .catch(() => { });
  }, [authUser, ownerId, wedding.slug]);

  useEffect(() => {
    if (tab !== 'ledger' || !authUser) return;
    fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}/ledger`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || d.error || 'Không có quyền xem sổ mừng cưới');
        setLedger(d.ledger || []);
        setTotalVnd(d.totalVnd || 0);
        setLedgerError('');
      })
      .catch((err) => setLedgerError(err instanceof Error ? err.message : 'Lỗi tải sổ'));
  }, [tab, authUser, wedding.slug]);

  useEffect(() => {
    if (tab !== 'members' || !authUser) return;
    fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}/members`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Không có quyền quản lý thành viên');
        setMembers(d.members || []);
        setMembersError('');
      })
      .catch((err) => setMembersError(err instanceof Error ? err.message : 'Lỗi tải thành viên'));
  }, [tab, authUser, wedding.slug]);

  // Poll SaaS upgrade order every 3s
  useEffect(() => {
    if (!upgradeOrder || upgradePaid) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/orders?orderCode=${encodeURIComponent(upgradeOrder.orderCode)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.order?.status === 'PAID') {
        setUpgradePaid(true);
        const wRes = await fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}`);
        if (wRes.ok) {
          const wData = await wRes.json();
          if (wData.wedding) setWedding(wData.wedding);
        }
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [upgradeOrder, upgradePaid, wedding.slug]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNote('');
    const res = await fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        videoEmbedUrl: videoEmbedUrl.trim() || null,
        videoIsLive,
        pin: pin.trim() || undefined,
        bankBin,
        bankAccountNo: bankAccountNo.trim() || undefined,
        bankAccountName: bankAccountName.trim() || undefined,
        ceremonyConfig: {
          ceremonyTimeIso: ceremonyTimeIso ? new Date(ceremonyTimeIso).toISOString() : undefined,
          greetingMessage: greetingMessage.trim() || undefined,
          autoBouquetToss,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveNote(data.message || data.error || 'Lưu thất bại (Hãy đăng nhập đúng tài khoản Chủ Tiệc)');
    } else {
      setWedding(data.wedding);
      setSaveNote('Đã cập nhật cấu hình & lịch Auto-NPC!');
    }
  };

  const handleCreateRoleInvite = async () => {
    const res = await fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE_INVITE', role: inviteRole }),
    });
    const data = await res.json();
    if (res.ok && data.invitePath) {
      const fullUrl =
        typeof window !== 'undefined' ? `${window.location.origin}${data.invitePath}` : data.invitePath;
      setGeneratedInviteUrl(fullUrl);
    }
  };

  const handleUpdateMemberRole = async (userId: string, role: string) => {
    const res = await fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SET_ROLE', userId, role }),
    });
    if (res.ok) {
      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role: role as MemberWithUser['role'] } : m)));
    }
  };

  const handleUpdateModeration = async (
    userId: string,
    moderationStatus: 'ACTIVE' | 'MUTED' | 'BANNED'
  ) => {
    const res = await fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SET_MODERATION', userId, moderationStatus }),
    });
    if (res.ok) {
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, moderationStatus } : m))
      );
    }
  };

  const handleCreateUpgradeOrder = async () => {
    setUpgradeError('');
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weddingId: wedding.id,
        targetTier: upgradeTier,
        voucherCode: upgradeVoucher.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setUpgradeError(data.error || 'Không tạo được đơn nâng cấp');
      return;
    }
    if (data.instantActivated) {
      setUpgradeOrder({
        orderCode: data.order.orderCode,
        qrDataUrl: '',
        amountVnd: 0,
      });
      setUpgradePaid(true);
      const wRes = await fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}`);
      if (wRes.ok) {
        const wData = await wRes.json();
        if (wData.wedding) setWedding(wData.wedding);
      }
      return;
    }
    setUpgradeOrder({
      orderCode: data.order.orderCode,
      qrDataUrl: data.qrDataUrl,
      amountVnd: data.order.amountVnd,
    });
  };

  const handleSimulateUpgradeWebhook = async () => {
    if (!upgradeOrder) return;
    const res = await fetch('/api/dev/simulate-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: upgradeOrder.orderCode, amountVnd: upgradeOrder.amountVnd }),
    });
    if (res.ok) {
      setUpgradePaid(true);
      const wRes = await fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}`);
      if (wRes.ok) {
        const wData = await wRes.json();
        if (wData.wedding) setWedding(wData.wedding);
      }
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const presignRes = await fetch('/api/r2/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: wedding.slug,
        folder: 'gallery',
        contentType: file.type || 'image/jpeg',
        byteSize: file.size,
      }),
    });
    const presign = await presignRes.json();
    if (!presignRes.ok) return;

    await fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'image/jpeg' },
      body: file,
    });

    const saveRes = await fetch(`/api/weddings/${encodeURIComponent(wedding.slug)}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'PRE_WEDDING_GALLERY',
        r2ObjectKey: presign.objectKey,
        publicUrl: presign.publicUrl,
        caption: file.name,
      }),
    });
    const saved = await saveRes.json();
    if (saveRes.ok && saved.photo) {
      setPhotos((prev) => [...prev, saved.photo]);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthUser(null);
    setHostAccessDenied(false);
  };

  const handleSwitchDemoOwner = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'ZALO',
        providerAccountId: 'zalo_demo_minh',
        displayName: 'Chú Rể Minh Nguyễn',
      }),
    });
    const d = await res.json();
    if (res.ok && d.user) {
      setAuthUser(d.user);
      setHostAccessDenied(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(
        wedding.invitationOnly ? `${window.location.origin}/thiep/${wedding.slug}` : `${window.location.origin}/w/${wedding.slug}/invite`,
      );
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8] p-4">
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
          Đang tải bảng điều khiển Chủ Tiệc...
        </div>
      </div>
    );
  }

  if (authChecked && !authUser) {
    return (
      <OAuthModal
        title="Đăng Nhập Quản Trị Đám Cưới"
        subtitle="Đăng nhập bằng tài khoản Chủ tiệc / Cô Dâu / Chú Rể để chỉnh sửa Sảnh 3D và xem Sổ Mừng Cưới."
        onAuthenticated={(u) => setAuthUser(u)}
      />
    );
  }

  if (authUser && hostAccessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8] p-4">
        <div className="dco-fade-up w-full max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-xl sm:p-8">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            Cần Tài Khoản Chủ Tiệc
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Bạn đang đăng nhập với tài khoản Khách mời{' '}
            <strong className="text-slate-900">{authUser.displayName}</strong> nên không có quyền
            chỉnh sửa sảnh hoặc xem Sổ Mừng Cưới riêng tư.
          </p>
          <div className="mt-5 space-y-2.5">
            {devAuthEnabled && wedding.slug === 'minh-va-linh' && (
              <button
                type="button"
                onClick={handleSwitchDemoOwner}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-white shadow hover:bg-amber-400"
              >
                <Sparkles className="h-4 w-4" /> Chuyển sang Chủ Tiệc Demo (Chú Rể Minh Nguyễn)
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4" /> Đăng nhập bằng tài khoản khác
            </button>
            <Link
              href={`/w/${wedding.slug}`}
              className="block pt-1 text-xs font-semibold text-slate-500 hover:underline"
            >
              ← Quay lại Sảnh Cưới 3D
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                {wedding.invitationOnly ? 'Thiệp cưới online · miễn phí' : `${TIER_CATALOG[wedding.tier].nameVi} • ${wedding.status}`}
              </span>
              {authUser && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                  Chủ tiệc: {authUser.displayName}
                </span>
              )}
            </div>
            <h1 className="mt-2 font-serif text-2xl font-bold text-slate-900 sm:text-3xl">{wedding.title}</h1>
            <p className="text-xs text-slate-500">
              {wedding.invitationOnly ? (
                <>
                  Link thiệp: <strong>/thiep/{wedding.slug}</strong>
                </>
              ) : (
                <>
                  Link mời khách: <strong>/w/{wedding.slug}</strong>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
            >
              {copiedInvite ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copiedInvite ? 'Đã chép link' : 'Chép Link Mời'}
            </button>
            <Link
              href={`/w/${wedding.slug}/invite`}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
            >
              <Mail className="h-4 w-4" /> Xem thiệp cưới
            </Link>
            {wedding.tier !== 'VIP_FULFILLMENT' && !wedding.invitationOnly && (
              <button
                type="button"
                onClick={() => {
                  setUpgradeOrder(null);
                  setUpgradePaid(false);
                  setShowUpgradeModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-amber-400"
              >
                <Rocket className="h-4 w-4" /> Nâng Cấp Gói
              </button>
            )}
            {!wedding.invitationOnly && (
            <Link
              href={`/dashboard/${wedding.slug}/print`}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" /> Sổ Kỷ Niệm PDF
            </Link>
            )}
            {!wedding.invitationOnly && (
            <Link
              href={`/w/${wedding.slug}`}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-rose-500"
            >
              <ExternalLink className="h-4 w-4" /> Mở Sảnh 3D
            </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất / Đổi tài khoản"
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'builder', label: 'Thiết Kế Sảnh 3D (Grid-Snap)', icon: Grid },
              { id: 'setup', label: 'Setup Phòng Cưới', icon: Sparkles },
              { id: 'settings', label: 'Cài Đặt & Lịch Auto-NPC', icon: Settings },
              { id: 'photos', label: 'Ảnh Cưới Triển Lãm', icon: ImageIcon },
              { id: 'members', label: 'Thành Viên, MC & Kiểm Duyệt', icon: Users },
              { id: 'thiep', label: 'Thiệp Cưới Online', icon: Mail },
              { id: 'printqr', label: 'Thiệp Mời & Mã QR In Ấn', icon: QrCode },
              { id: 'ledger', label: 'Sổ Mừng Cưới Riêng Tư', icon: Wallet },
            ] as const
          )
            // An invitation-only wedding has no 3D hall: just the invitation and its photos
            .filter((item) => !wedding.invitationOnly || item.id === 'thiep' || item.id === 'photos')
            .map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${tab === item.id
                    ? 'bg-slate-900 text-amber-300 shadow'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
              >
                <Icon className="h-4 w-4" /> {wedding.invitationOnly && item.id === 'photos' ? 'Ảnh Cưới Cho Thiệp' : item.label}
              </button>
            );
          })}
        </div>

        {tab === 'builder' && <SceneBuilderEditor slug={wedding.slug} initialLayout={layoutState} onSaved={setLayoutState} />}

        {tab === 'setup' && (
          <RoomSetupEditor
            wedding={wedding}
            layout={layoutState}
            photos={photos}
            onUploadPhoto={handleUploadPhoto}
            onSaved={(l, w) => {
              setLayoutState(l);
              if (w) setWedding(w);
            }}
          />
        )}

        {tab === 'settings' && (
          <form
            onSubmit={handleSaveSettings}
            className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Tên Tiệc Cưới</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Mã PIN Phòng 4 số (Để trống nếu giữ nguyên)
              </label>
              <input
                type="text"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="VD: 2026"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Link Video / Livestream Sân Khấu (YouTube Live, Vimeo, Google Drive)
              </label>
              <input
                type="url"
                value={videoEmbedUrl}
                onChange={(e) => setVideoEmbedUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={videoIsLive}
                  onChange={(e) => setVideoIsLive(e.target.checked)}
                />
                Đang phát Livestream trực tiếp
              </label>
            </div>

            {/* Auto-NPC Ceremony Schedule */}
            <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
              <h4 className="mb-2 text-xs font-bold uppercase text-amber-900">
                Lịch Hẹn Tự Động Cho Auto-NPC Cô Dâu &amp; Chú Rể
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Giờ làm lễ tự động (Lên sân khấu &amp; Pháo điện)
                  </label>
                  <input
                    type="datetime-local"
                    value={ceremonyTimeIso}
                    onChange={(e) => setCeremonyTimeIso(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Lời chào Auto-NPC đứng đón ở Cổng
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={autoBouquetToss}
                  onChange={(e) => setAutoBouquetToss(e.target.checked)}
                />
                Tự động tung hoa cưới 10 giây sau khi bắt đầu lễ
              </label>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Ngân Hàng (BIN)</label>
              <select
                value={bankBin}
                onChange={(e) => setBankBin(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="970422">MBBank (970422)</option>
                <option value="970436">Vietcombank (970436)</option>
                <option value="970407">Techcombank (970407)</option>
                <option value="970415">VietinBank (970415)</option>
                <option value="970418">BIDV (970418)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Số Tài Khoản Cô Dâu / Chú Rể
              </label>
              <input
                type="text"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                placeholder="Nhập STK nhận tiền mừng..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">Tên Chủ Tài Khoản</label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="NGUYEN NHAT MINH"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-rose-500"
              >
                Lưu Cài Đặt
              </button>
              {saveNote && <span className="text-xs font-semibold text-emerald-700">{saveNote}</span>}
            </div>
          </form>
        )}

        {tab === 'photos' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Kho Ảnh Cưới 3D &amp; Photobooth</h3>
              <label className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500">
                + Tải Ảnh Cưới Mới
                <input type="file" accept="image/*" onChange={handleUploadPhoto} className="hidden" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {photos.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-2xl border border-amber-100 bg-slate-50">
                  <img src={p.publicUrl} alt={p.caption || 'Ảnh cưới'} className="h-44 w-full object-cover" />
                  <div className="p-2.5 text-xs">
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                      {p.type === 'PRE_WEDDING_GALLERY' ? 'Triển Lãm 3D' : 'Photobooth Khách'}
                    </span>
                    <p className="mt-1 truncate text-slate-700">{p.caption || 'Kỷ niệm đám cưới'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-indigo-600" /> Tạo Link Ủy Quyền 1 Chạm (MC / Cô Dâu / Chú Rể)
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Gửi đường link này cho Phụ rể, MC hoặc người bạn đời để họ bấm vào là có quyền Nhập vai sân khấu &amp; điều phối tiệc.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'MC' | 'BRIDE' | 'GROOM')}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
                >
                  <option value="MC">Vai trò MC / Quản Trò</option>
                  <option value="BRIDE">Vai trò Cô Dâu</option>
                  <option value="GROOM">Vai trò Chú Rể</option>
                </select>
                <button
                  type="button"
                  onClick={handleCreateRoleInvite}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Tạo Link Mời {inviteRole}
                </button>
              </div>
              {generatedInviteUrl && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-indigo-200 bg-white p-2.5 text-xs">
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteUrl}
                    className="flex-1 bg-transparent text-slate-700 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(generatedInviteUrl)}
                    className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-200"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </button>
                </div>
              )}
            </div>

            {membersError ? (
              <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{membersError}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2">Thành Viên</th>
                      <th className="py-2">Vai Trò</th>
                      <th className="py-2">Trạng Thái</th>
                      <th className="py-2 text-right">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-b border-slate-100">
                        <td className="py-2.5 font-bold text-slate-900">
                          {m.nicknameOverride || m.userDisplayName}
                        </td>
                        <td className="py-2.5">
                          {m.role === 'OWNER' ? (
                            <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-900">
                              OWNER
                            </span>
                          ) : (
                            <select
                              value={m.role}
                              onChange={(e) => handleUpdateMemberRole(m.userId, e.target.value)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold"
                            >
                              <option value="GUEST">GUEST</option>
                              <option value="MC">MC</option>
                              <option value="BRIDE">BRIDE</option>
                              <option value="GROOM">GROOM</option>
                            </select>
                          )}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.moderationStatus === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : m.moderationStatus === 'MUTED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                          >
                            {m.moderationStatus}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          {m.role !== 'OWNER' && (
                            <div className="inline-flex gap-1">
                              {m.moderationStatus !== 'ACTIVE' ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateModeration(m.userId, 'ACTIVE')}
                                  className="rounded-lg bg-emerald-600 px-2.5 py-1 font-bold text-white hover:bg-emerald-500"
                                >
                                  Gỡ Chặn / Mở Tiếng
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateModeration(m.userId, 'MUTED')}
                                    className="rounded-lg bg-amber-100 px-2 py-1 font-semibold text-amber-800"
                                  >
                                    Mute
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateModeration(m.userId, 'BANNED')}
                                    className="rounded-lg bg-rose-100 px-2 py-1 font-semibold text-rose-700"
                                  >
                                    Ban
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'thiep' && <InvitationEditor wedding={wedding} photos={photos} />}

        {tab === 'printqr' && <PrintQrTab wedding={wedding} />}

        {tab === 'ledger' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sổ Mừng Cưới Riêng Tư</h3>
                <p className="text-xs text-slate-500">
                  Tổng tiền đã xác thực webhook:{' '}
                  <strong className="text-rose-600">{totalVnd.toLocaleString('vi-VN')} VNĐ</strong>
                </p>
              </div>
              <a
                href={`/api/weddings/${encodeURIComponent(wedding.slug)}/ledger?format=csv`}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
              >
                <Download className="h-4 w-4" /> Xuất File CSV
              </a>
            </div>

            {ledgerError ? (
              <p className="rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-700">{ledgerError}</p>
            ) : ledger.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Chưa có giao dịch mừng cưới nào được xác thực webhook.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2">Khách Mời</th>
                      <th className="py-2">Số Tiền</th>
                      <th className="py-2">Lời Chúc</th>
                      <th className="py-2">Cổng / Mã GD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-2.5 font-bold text-slate-900">{item.guestName}</td>
                        <td className="py-2.5 font-bold text-emerald-700">
                          {item.amountVnd.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-2.5 text-slate-600">{item.wishMessage}</td>
                        <td className="py-2.5 text-slate-500">
                          {item.provider} ({item.providerTxId})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* In-Place SaaS Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">🚀 Nâng Cấp Phòng Cưới</h3>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="rounded-full p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!upgradeOrder ? (
              <div className="space-y-3">
                {(['HAPPINESS', 'VIP_FULFILLMENT'] as WeddingTier[]).map((t) => {
                  const meta = TIER_CATALOG[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setUpgradeTier(t)}
                      className={`w-full rounded-2xl border-2 p-3 text-left ${upgradeTier === t ? 'border-rose-600 bg-rose-50' : 'border-slate-200'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{meta.nameVi}</span>
                        <span className="text-sm font-extrabold text-rose-600">
                          {meta.priceVnd.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {meta.maxCcu} khách • {meta.allowVoiceChat ? 'Voice bàn tiệc + ' : ''}VietQR Webhook + Lưu trữ 2D vĩnh viễn
                      </p>
                    </button>
                  );
                })}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Mã Voucher Đối Tác Studio (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={upgradeVoucher}
                    onChange={(e) => setUpgradeVoucher(e.target.value.toUpperCase())}
                    placeholder="VD: STUDIO35 hoặc STUDIOVIP100"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-wider"
                  />
                </div>
                {upgradeError && <p className="text-xs text-rose-600">{upgradeError}</p>}
                <button
                  type="button"
                  onClick={handleCreateUpgradeOrder}
                  className="w-full rounded-xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-500"
                >
                  Tạo Mã VietQR Thanh Toán
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                {upgradeOrder.qrDataUrl ? (
                  <img
                    src={upgradeOrder.qrDataUrl}
                    alt="VietQR Upgrade"
                    className="mx-auto h-52 w-52 rounded-2xl border border-amber-200 p-2"
                  />
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                    🎉 Kích hoạt thành công bằng Voucher 100%!
                  </div>
                )}
                <p className="text-xs text-slate-600">
                  Nội dung: <strong className="text-rose-600">{upgradeOrder.orderCode}</strong> (
                  {upgradeOrder.amountVnd.toLocaleString('vi-VN')}đ)
                </p>
                {upgradePaid ? (
                  <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Đã kích hoạt gói {wedding.tier} thành công!
                  </div>
                ) : (
                  process.env.NODE_ENV !== 'production' && (
                    <button
                      type="button"
                      onClick={handleSimulateUpgradeWebhook}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white"
                    >
                      <Sparkles className="h-4 w-4" /> Mô phỏng Webhook SePay (Dev)
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
