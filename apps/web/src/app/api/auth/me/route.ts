import { NextRequest, NextResponse } from 'next/server';
import { isPlatformAdmin } from '@/lib/adminAuth';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) {
    return NextResponse.json({ authenticated: false, user: null });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: auth.user.id,
      displayName: auth.user.displayName,
      email: auth.user.email,
      provider: auth.session.provider,
      isPlatformAdmin: isPlatformAdmin(auth),
    },
  });
}
