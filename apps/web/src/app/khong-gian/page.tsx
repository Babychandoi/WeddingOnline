import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { VENUE_THEMES } from '@dco/shared';
import { VenueGallery } from '@/components/venues/VenueGallery';

export const metadata: Metadata = {
  title: `${VENUE_THEMES.length} Không Gian Cưới 3D Việt Nam & Thế Giới — DamCuoiOnline.vn`,
  description:
    'Từ lễ gia tiên nhà ba gian, phố cổ Hội An đến đền Thần đạo Nhật Bản, mandap Ấn Độ hay đồi cát Sahara: xem trước sảnh cưới 3D ngay trên trình duyệt.',
};

export default function VenueGalleryPage() {
  const vietnamCount = VENUE_THEMES.filter((v) => v.region === 'VIETNAM').length;
  return (
    <main className="min-h-screen bg-[#FFFDF8]">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Trang chủ
        </Link>
        <h1 className="mt-5 max-w-3xl text-balance font-serif text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          {VENUE_THEMES.length} Không Gian Cưới Từ Việt Nam Đến Khắp Thế Giới
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {vietnamCount} mẫu Việt Nam và {VENUE_THEMES.length - vietnamCount} mẫu quốc tế. Xoay và phóng gần toàn sảnh 3D, hoặc mở ảnh tham chiếu để đối chiếu.
        </p>
        <div className="mt-8">
          <VenueGallery venues={VENUE_THEMES} />
        </div>
      </div>
    </main>
  );
}
