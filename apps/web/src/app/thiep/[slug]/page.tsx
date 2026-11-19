import { redirect } from 'next/navigation';

/** Short share link: /thiep/<slug>?khach=Tên → the invitation */
export default function ShortInvitationLink({ params, searchParams }: { params: { slug: string }; searchParams: { khach?: string } }) {
  const guest = typeof searchParams.khach === 'string' && searchParams.khach.trim() ? `?khach=${encodeURIComponent(searchParams.khach.trim().slice(0, 60))}` : '';
  redirect(`/w/${encodeURIComponent(params.slug)}/invite${guest}`);
}
