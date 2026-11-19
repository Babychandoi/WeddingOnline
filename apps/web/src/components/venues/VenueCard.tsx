import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { VenueTheme } from '@dco/shared';

/** Rendered still of a venue (scripts/render-venue-thumbnails.mjs writes these) */
export function venueThumbnail(id: string): string {
  return `/venues/${id}.webp`;
}

export function VenueCard({ venue, priority = false }: { venue: VenueTheme; priority?: boolean }) {
  return (
    <Link
      href={`/khong-gian/${venue.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[16/10] overflow-hidden" style={{ backgroundColor: venue.colors.s }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-rendered stills, already sized */}
        <img
          src={venueThumbnail(venue.id)}
          alt={`Sảnh cưới 3D ${venue.nameVi}`}
          width={640}
          height={400}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-xl font-bold leading-snug text-slate-900">{venue.nameVi}</h3>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{venue.place}</p>
        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-slate-600">{venue.descriptionVi}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-bold text-rose-700">
          Xem trước 3D <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
