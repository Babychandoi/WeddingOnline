import { NextRequest, NextResponse } from 'next/server';
import { processBankWebhook } from '@/lib/webhookProcessor';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'DISABLED_IN_PRODUCTION' }, { status: 404 });
  }

  const body = (await req.json()) as {
    code: string;
    amountVnd?: number;
  };
  if (!body.code) {
    return NextResponse.json({ error: 'MISSING_CODE' }, { status: 400 });
  }

  const result = await processBankWebhook({
    provider: 'SEPAY',
    providerTxId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    description: `SIMULATED BANK TRANSFER ${body.code}`,
    amountVnd: Number(body.amountVnd ?? 500000),
    bankTxDate: new Date().toISOString(),
    authSecret: process.env.PLATFORM_SEPAY_API_KEY || 'dev_sepay_key',
    rawPayload: { simulated: true, code: body.code },
  });

  return NextResponse.json(result.body, { status: result.status });
}
