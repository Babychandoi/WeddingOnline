import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { dbRepo, toPublicWedding } from '@dco/database';
import { STARTER_TEMPLATES } from '@dco/shared';
import { HallExperience } from '@/components/hall/HallExperience';
import { MemorialArchiveView } from '@/components/memorial/MemorialArchiveView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const wedding = await dbRepo.getWeddingBySlug(params.slug);
  if (!wedding) {
    return { title: 'Không tìm thấy phòng cưới — DamCuoiOnline.vn' };
  }
  const dateStr = new Date(wedding.weddingDate).toLocaleDateString('vi-VN');
  return {
    title: `${wedding.title} (${wedding.groomName} & ${wedding.brideName}) — DamCuoiOnline.vn`,
    description: `Trân trọng kính mời bạn vào Sảnh Cưới 3D trực tuyến ngày ${dateStr}: ngắm ảnh cưới, ký Sổ Lưu Bút, cụng ly 1-2-3 Dzô và chung vui cùng cô dâu chú rể.`,
  };
}

export default async function WeddingRoomPage({ params }: { params: { slug: string } }) {
  const wedding = await dbRepo.getWeddingBySlug(params.slug);
  if (!wedding) notFound();
  // An invitation-only wedding has no 3D hall: its link opens the invitation
  if (wedding.invitationOnly) redirect(`/w/${wedding.slug}/invite`);

  const [photos, guestbook, bouquetCatches] = await Promise.all([
    dbRepo.listPhotos(wedding.id),
    dbRepo.listGuestbook(wedding.id),
    dbRepo.listBouquetCatches(wedding.id),
  ]);
  const publicWedding = toPublicWedding(wedding);

  if (wedding.status === 'ARCHIVED_2D_FOREVER') {
    return (
      <MemorialArchiveView
        wedding={publicWedding}
        photos={photos}
        guestbook={guestbook}
        bouquetCatches={bouquetCatches}
      />
    );
  }

  if (wedding.status === 'EXPIRED_TRIAL') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8] p-4">
        <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Phòng Dùng Thử 24h Đã Kết Thúc</h1>
          <p className="mt-2 text-sm text-slate-600">
            Thời hạn dùng thử miễn phí của <strong>{wedding.title}</strong> đã hết. Chủ tiệc có thể
            nâng cấp lên Gói Hạnh Phúc hoặc Viên Mãn VIP để mở lại sảnh cưới vĩnh viễn.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={`/dashboard/${wedding.slug}`}
              className="rounded-xl bg-rose-600 py-3 text-sm font-bold text-white"
            >
              Vào Trang Quản Trị Nâng Cấp
            </Link>
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:underline">
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const scene = await dbRepo.getSceneByWeddingId(wedding.id);
  const layout = scene?.layoutData ?? STARTER_TEMPLATES.luxury_ballroom.layout;

  return (
    <HallExperience
      wedding={publicWedding}
      layout={layout}
      initialPhotos={photos}
      initialGuestbook={guestbook}
    />
  );
}
