import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';

/** Whether SePay has confirmed this guest's transfer yet (status only, never the amount) */
export async function GET(_req: NextRequest, context: { params: { slug: string; intentId: string } }) {
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });
  const intent = await dbRepo.getGiftIntentById(context.params.intentId);
  if (!intent || intent.weddingId !== wedding.id) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ status: intent.status }, { headers: { 'Cache-Control': 'no-store' } });
}
