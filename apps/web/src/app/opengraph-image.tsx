import { renderWeddingOgPng } from '@/lib/ogPng';

export const runtime = 'nodejs';
export const alt = 'DamCuoiOnline.vn — 100 Mẫu Thiệp Cưới Online & 101 Sảnh Cưới 3D';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function DefaultOpenGraphImage() {
  const png = renderWeddingOgPng({
    couple: 'DAMCUOIONLINE.VN',
    subtitle: '100 THIEP CUOI ONLINE - 101 SANH CUOI 3D - VIETQR',
  });

  return new Response(new Uint8Array(png), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
