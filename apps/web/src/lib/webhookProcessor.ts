import crypto from 'node:crypto';
import { dbRepo } from '@dco/database';
import { extractTransferCode, invitationAccess } from '@dco/shared';
import { isHardenedProduction, isInsecureSecret, resolveSecret } from '@dco/shared/server';
import { getPlatformSetting } from './platformSettings';
import { publishRealtimeEvent } from './realtimeClient';

// SePay is the only bank-notification provider (Casso support was removed)
type WebhookProvider = 'SEPAY';

type WebhookResult = { status: number; body: Record<string, unknown> };

const WEBHOOK_NOT_CONFIGURED: WebhookResult = {
  status: 503,
  body: { error: 'WEBHOOK_NOT_CONFIGURED' },
};

function safeSecretEqual(actual: string, expected: string): boolean {
  if (!actual || !expected) return false;
  const a = Buffer.from(actual.trim(), 'utf8');
  const b = Buffer.from(expected.trim(), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Platform SePay key (set in /admin/settings); null on production until a real key exists. */
async function platformWebhookSecret(): Promise<string | null> {
  return resolveSecret('PLATFORM_SEPAY_API_KEY', await getPlatformSetting('PLATFORM_SEPAY_API_KEY'));
}

/** A couple's own webhook key wins, unless production sees it is a weak/default value. */
async function weddingWebhookSecret(weddingSecret: string | null): Promise<string | null> {
  if (weddingSecret && !(isHardenedProduction() && isInsecureSecret(weddingSecret, 16))) {
    return weddingSecret;
  }
  return platformWebhookSecret();
}

export async function processBankWebhook(input: {
  provider: WebhookProvider;
  providerTxId: string;
  description: string;
  amountVnd: number;
  bankTxDate: string;
  authSecret: string;
  rawPayload: unknown;
}): Promise<WebhookResult> {
  const { kind, code } = extractTransferCode(input.description);
  if (!kind || !code) {
    return { status: 200, body: { ok: true, ignored: true, reason: 'NO_DCO_CODE' } };
  }

  if (kind === 'PLAN') {
    const expectedSecret = await platformWebhookSecret();
    if (!expectedSecret) return WEBHOOK_NOT_CONFIGURED;

    if (!safeSecretEqual(input.authSecret, expectedSecret)) {
      return { status: 401, body: { error: 'INVALID_WEBHOOK_SIGNATURE' } };
    }

    const result = await dbRepo.settleSaasOrderByWebhook({
      orderCode: code,
      amountVnd: input.amountVnd,
      provider: input.provider,
      providerTxId: input.providerTxId,
      rawPayload: input.rawPayload,
    });

    if (result.duplicate) {
      return { status: 200, body: { ok: true, duplicate: true } };
    }

    if (result.upgraded && result.wedding) {
      await publishRealtimeEvent({
        type: 'PLAN_ACTIVATED',
        weddingId: result.wedding.id,
        tier: result.wedding.tier,
      });
    }

    return {
      status: result.upgraded ? 200 : 422,
      body: {
        ok: result.upgraded,
        kind: 'PLAN',
        orderCode: code,
        reason: result.reason,
        tier: result.wedding?.tier,
      },
    };
  }

  if (kind === 'FIREWORK') {
    const expectedSecret = await platformWebhookSecret();
    if (!expectedSecret) return WEBHOOK_NOT_CONFIGURED;
    if (!safeSecretEqual(input.authSecret, expectedSecret)) {
      return { status: 401, body: { error: 'INVALID_WEBHOOK_SIGNATURE' } };
    }

    const result = await dbRepo.settleFireworkOrderByWebhook({
      orderCode: code,
      amountVnd: input.amountVnd,
      provider: input.provider,
      providerTxId: input.providerTxId,
      rawPayload: input.rawPayload,
    });
    if (result.duplicate) return { status: 200, body: { ok: true, duplicate: true } };

    if (result.launched && result.order) {
      await publishRealtimeEvent({
        type: 'FIREWORKS_LAUNCH',
        weddingId: result.order.weddingId,
        orderId: result.order.id,
        buyerName: result.order.buyerName,
        packId: result.order.packId,
        message: result.order.message,
      });
    }
    // A second transfer for an order already paid is acknowledged (no retry storm), not launched again
    return {
      status: result.launched || result.reason === 'ALREADY_PAID' ? 200 : 422,
      body: { ok: result.launched, kind: 'FIREWORK', orderCode: code, reason: result.reason },
    };
  }

  // kind === 'GIFT'
  const intent = await dbRepo.getGiftIntentByCode(code);
  if (!intent) {
    return { status: 200, body: { ok: true, ignored: true, reason: 'INTENT_NOT_FOUND' } };
  }

  const wedding = await dbRepo.getWeddingById(intent.weddingId);
  // Gifts through a paid 3D hall, or through a published invitation
  if (!wedding || (wedding.tier !== 'HAPPINESS' && wedding.tier !== 'VIP_FULFILLMENT' && !invitationAccess(wedding).published)) {
    return { status: 403, body: { error: 'GIFT_NOT_ALLOWED_FOR_TIER' } };
  }

  const expectedWeddingSecret = await weddingWebhookSecret(wedding.webhookSecretHash);
  if (!expectedWeddingSecret) return WEBHOOK_NOT_CONFIGURED;

  if (!safeSecretEqual(input.authSecret, expectedWeddingSecret)) {
    return { status: 401, body: { error: 'INVALID_WEDDING_WEBHOOK_SECRET' } };
  }

  const settled = await dbRepo.settleGiftByWebhook({
    transferCode: code,
    amountVnd: input.amountVnd,
    provider: input.provider,
    providerTxId: input.providerTxId,
    bankTxDate: input.bankTxDate,
    rawPayload: input.rawPayload,
  });

  if (settled.duplicate) {
    return { status: 200, body: { ok: true, duplicate: true } };
  }

  if (settled.weddingId && settled.guestName && settled.wishMessage) {
    // STRICT PRIVACY: Publish guestName + wishMessage ONLY — never amountVnd!
    await publishRealtimeEvent({
      type: 'GIFT_CELEBRATION_EVENT',
      weddingId: settled.weddingId,
      guestName: settled.guestName,
      wishMessage: settled.wishMessage,
    });
  }

  return {
    status: 200,
    body: {
      ok: true,
      kind: 'GIFT',
      transferCode: code,
      verified: Boolean(settled.ledger),
    },
  };
}
