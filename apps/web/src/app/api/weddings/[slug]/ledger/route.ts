import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { getSessionFromRequest } from '@/lib/session';

const LEDGER_ROLES = new Set(['OWNER', 'BRIDE', 'GROOM']);

export async function GET(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });

  const member = await dbRepo.getMember(wedding.id, auth.user.id);
  const isAllowed =
    wedding.ownerId === auth.user.id || (member !== null && LEDGER_ROLES.has(member.role));

  if (!isAllowed) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Chỉ Cô dâu, Chú rể hoặc Chủ tiệc mới xem được Sổ Mừng Cưới.' },
      { status: 403 }
    );
  }

  const records = await dbRepo.getPrivateGiftLedger(wedding.id);
  const totalVnd = records.reduce((sum, r) => sum + r.amountVnd, 0);

  if (req.nextUrl.searchParams.get('format') === 'csv') {
    const header = 'ThoiGian,KhachMoi,SoTienVND,LoiChuc,NganHang,MaGiaoDich\n';
    const rows = records
      .map((r) => {
        const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
        return [
          escape(r.verifiedAt),
          escape(r.guestName),
          String(r.amountVnd),
          escape(r.wishMessage),
          escape(r.provider),
          escape(r.providerTxId),
        ].join(',');
      })
      .join('\n');
    return new NextResponse('\uFEFF' + header + rows, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="so-mung-cuoi-${wedding.slug}.csv"`,
      },
    });
  }

  return NextResponse.json({
    totalVnd,
    count: records.length,
    ledger: records,
  });
}
