import { dbRepo } from '@dco/database';
import { renderWeddingOgPng } from '@/lib/ogPng';

export const runtime = 'nodejs';
export const alt = 'Thiệp Mời Đám Cưới Online 3D — DamCuoiOnline.vn';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function WeddingOpenGraphImage({
  params,
}: {
  params: { slug: string };
}) {
  const wedding = await dbRepo.getWeddingBySlug(params.slug);
  const title = wedding?.title || 'Lễ Thành Hôn Trực Tuyến 3D';
  const couple = wedding
    ? `${wedding.groomName} & ${wedding.brideName}`
    : 'DamCuoiOnline.vn';
  const dateStr = wedding
    ? new Date(wedding.weddingDate).toLocaleDateString('vi-VN')
    : '2026';

  const png = renderWeddingOgPng({
    couple,
    subtitle: `${title} - ${dateStr}`,
  });

  return new Response(new Uint8Array(png), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
