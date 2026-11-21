import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { getSessionFromRequest } from '@/lib/session';

/** Lets the buyer's screen know when the transfer has come in */
export async function GET(req: NextRequest, context: { params: { code: string } }) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'OAUTH_REQUIRED' }, { status: 401 });
  const order = await dbRepo.getFireworkOrderByCode(context.params.code.toUpperCase());
  // Someone else's order looks the same as no order
  if (!order || order.buyerId !== auth.user.id) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json(
    { status: order.status, packId: order.packId, paidAt: order.paidAt },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
