import { NextRequest, NextResponse } from 'next/server';
import { processBankWebhook } from '@/lib/webhookProcessor';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.startsWith('Apikey ')
      ? authHeader.slice(7).trim()
      : authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : req.headers.get('x-sepay-secret') || '';

    const payload = (await req.json()) as {
      id?: string | number;
      referenceCode?: string;
      content?: string;
      description?: string;
      transferAmount?: number;
      transferType?: string;
      transactionDate?: string;
    };

    if (payload.transferType && payload.transferType !== 'in') {
      return NextResponse.json({ ok: true, ignored: true, reason: 'NOT_INCOMING_TRANSFER' });
    }

    const providerTxId = `sepay_${payload.id ?? payload.referenceCode ?? Date.now()}`;
    const description = payload.content || payload.description || '';
    const amountVnd = Number(payload.transferAmount || 0);
    const bankTxDate = payload.transactionDate || new Date().toISOString();

    const result = await processBankWebhook({
      provider: 'SEPAY',
      providerTxId,
      description,
      amountVnd,
      bankTxDate,
      authSecret: bearer,
      rawPayload: payload,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: 'BAD_WEBHOOK_PAYLOAD' }, { status: 400 });
  }
}
