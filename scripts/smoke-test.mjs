import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Client as ColyseusClient } from 'colyseus.js';

const ROOT = process.cwd();
const WEB_URL = 'http://127.0.0.1:3000';
const REALTIME_URL = 'http://127.0.0.1:2567';
const SMOKE_ADMIN_EMAIL = 'smoke-platform-admin@dco.test';

function loadRootEnv() {
  const envPath = path.join(ROOT, '.env');
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

async function waitForHttp(url, timeoutMs = 20000) {
  const start = Date.now();
  let lastErr = '';
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
      lastErr = `HTTP ${res.status}`;
    } catch (err) {
      const cause = err && typeof err === 'object' && 'cause' in err ? err.cause : null;
      lastErr = cause ? `${err.message} (${cause.code || cause.message || cause})` : String(err);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timeout waiting for ${url} (last error: ${lastErr})`);
}

function runProcess(args, cwd, env = {}) {
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });
  child.stdout.on('data', (d) => process.stdout.write(`[${path.basename(cwd)}] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[${path.basename(cwd)} err] ${d}`));
  return child;
}

async function main() {
  const dotEnv = loadRootEnv();
  const usePostgres = Boolean(process.env.DATABASE_URL || dotEnv.DATABASE_URL);
  const runId = Date.now();

  const tempDataDir = path.join(ROOT, '.local-data-smoke');
  if (!usePostgres) {
    fs.rmSync(tempDataDir, { recursive: true, force: true });
  }

  const env = {
    ...dotEnv,
    ...(usePostgres ? {} : { DCO_LOCAL_DATA_DIR: tempDataDir }),
    NODE_ENV: 'production',
    ALLOW_DEV_AUTH: '1',
    PLATFORM_ADMIN_EMAILS: SMOKE_ADMIN_EMAIL,
    PORT: '2567',
    REALTIME_HTTP_URL: REALTIME_URL,
    NEXT_PUBLIC_COLYSEUS_URL: 'ws://127.0.0.1:2567',
    INTERNAL_SERVICE_SECRET: dotEnv.INTERNAL_SERVICE_SECRET || 'dev_internal_secret_change_me',
    SESSION_SECRET: dotEnv.SESSION_SECRET || 'dev_session_secret_change_me_at_least_32_chars',
    PLATFORM_SEPAY_API_KEY: dotEnv.PLATFORM_SEPAY_API_KEY || 'dev_sepay_key',
  };

  const realtimeProc = runProcess([path.join(ROOT, 'apps', 'realtime', 'dist', 'index.js')], ROOT, env);
  const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  const webProc = runProcess(
    [nextBin, 'start', '-p', '3000'],
    path.join(ROOT, 'apps', 'web'),
    { ...env, PORT: '3000' }
  );

  try {
    await waitForHttp(`${REALTIME_URL}/health`);
    await waitForHttp(`${WEB_URL}/`);
    console.log(`Servers ready (driver=${usePostgres ? 'prisma-postgres' : 'local-json'}).`);

    // 1. Health, Landing, Partner, Invite, OG Image & Binary .glb Assets
    const healthRes = await fetch(`${WEB_URL}/api/health`);
    assert.equal(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assert.equal(healthJson.ok, true);
    assert.equal(healthJson.storageDriver, usePostgres ? 'prisma-postgres' : 'local-json');

    const homeRes = await fetch(`${WEB_URL}/`);
    assert.equal(homeRes.status, 200);
    const plazaHtml = await (await fetch(`${WEB_URL}/plaza`)).text();
    assert.ok(plazaHtml.includes('Quảng Trường Cưới'));

    const inviteRes = await fetch(`${WEB_URL}/w/minh-va-linh/invite`);
    assert.equal(inviteRes.status, 200);

    for (const uiPath of [
      '/w/minh-va-linh',
      '/dashboard/minh-va-linh',
      '/dashboard/minh-va-linh/print',
      '/partner',
      '/create',
    ]) {
      const uiRes = await fetch(`${WEB_URL}${uiPath}`);
      assert.equal(uiRes.status, 200, `Expected 200 for ${uiPath}`);
    }

    const logoutRes = await fetch(`${WEB_URL}/api/auth/logout`, { method: 'POST' });
    assert.equal(logoutRes.status, 200);
    assert.equal((await logoutRes.json()).ok, true);

    const ogRes = await fetch(`${WEB_URL}/w/minh-va-linh/opengraph-image`);
    assert.equal(ogRes.status, 200);
    assert.ok((ogRes.headers.get('content-type') || '').includes('image/png'));

    const glbRes = await fetch(`${WEB_URL}/models/stage-cake.glb`);
    assert.equal(glbRes.status, 200);
    const glbBuf = Buffer.from(await glbRes.arrayBuffer());
    assert.equal(glbBuf.subarray(0, 4).toString('ascii'), 'glTF');

    // 2. Anonymous Plaza Join + Custom Hair/Color + Colyseus 10Hz + Profanity Filter
    const plazaJoinRes = await fetch(`${WEB_URL}/api/weddings/plaza/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Khach Smoke',
        guestId: `plaza_smoke_${runId}`,
        avatarConfig: { outfitId: 'evening_dress', hairId: 'hair_5', hairColor: '#b45309' },
      }),
    });
    assert.equal(plazaJoinRes.status, 200);
    const plazaJoin = await plazaJoinRes.json();

    const colyseus = new ColyseusClient('ws://127.0.0.1:2567');
    const plazaRoom = await colyseus.joinOrCreate('wedding_hall', {
      weddingId: 'wed_public_plaza',
      slug: 'plaza',
      shardIndex: plazaJoin.shardIndex,
      joinToken: plazaJoin.joinToken,
    });
    plazaRoom.send('MOVE_INPUT', { x: 1.5, z: 4.5, rotY: 0, isMoving: true });
    plazaRoom.send('CHAT_BUBBLE', { text: 'Chuc mung vcl nha' });
    await new Promise((r) => setTimeout(r, 350));
    const plazaPlayer = plazaRoom.state.players.get(plazaRoom.sessionId);
    assert.ok(plazaPlayer);
    assert.equal(plazaPlayer.hairId, 'hair_5');
    assert.equal(plazaPlayer.hairColor, '#b45309');
    assert.equal(plazaPlayer.bubbleText, 'Chuc mung *** nha');
    await plazaRoom.leave();

    // 3. Hard Safety Firewall: Plaza must reject VietQR gifts (403)
    const plazaGiftRes = await fetch(`${WEB_URL}/api/weddings/plaza/gifts/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishMessage: 'Test' }),
    });
    assert.equal(plazaGiftRes.status, 403);

    // 4. Mandatory Social OAuth: Real Wedding rejects unauthenticated join (401)
    const unauthJoinRes = await fetch(`${WEB_URL}/api/weddings/minh-va-linh/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Anon' }),
    });
    assert.equal(unauthJoinRes.status, 401);

    // 5. Authenticate Guest, MC Candidate & Owner via Social OAuth
    const guestLogin = await (
      await fetch(`${WEB_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'ZALO',
          providerAccountId: `zalo_smoke_guest_${runId}`,
          displayName: 'Tuấn Smoke',
        }),
      })
    ).json();
    assert.ok(guestLogin.token);

    const mcLogin = await (
      await fetch(`${WEB_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'ZALO',
          providerAccountId: `zalo_smoke_mc_${runId}`,
          displayName: 'MC Quốc Tuấn',
        }),
      })
    ).json();
    assert.ok(mcLogin.token);

    const ownerLogin = await (
      await fetch(`${WEB_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'ZALO',
          providerAccountId: 'zalo_demo_minh',
          displayName: 'Chú Rể Minh Nguyễn',
        }),
      })
    ).json();
    assert.ok(ownerLogin.token);

    // Baseline owner ledger before adding a new smoke gift
    const ledgerBeforeRes = await fetch(`${WEB_URL}/api/weddings/minh-va-linh/ledger`, {
      headers: { Authorization: `Bearer ${ownerLogin.token}` },
    });
    assert.equal(ledgerBeforeRes.status, 200);
    const ledgerBefore = await ledgerBeforeRes.json();

    // 6. Test LiveKit Token Endpoint (if LIVEKIT_URL configured)
    const lkRes = await fetch(`${WEB_URL}/api/livekit/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${guestLogin.token}`,
      },
      body: JSON.stringify({ slug: 'minh-va-linh', shardIndex: 1, tableNo: 1, scope: 'table' }),
    });
    assert.equal(lkRes.status, 200);
    const lkData = await lkRes.json();
    assert.ok(lkData.token);
    if (dotEnv.LIVEKIT_URL) {
      assert.equal(lkData.livekitUrl, dotEnv.LIVEKIT_URL);
    }

    // 7. Test MC Role Invite Link + Mute/Unmute Flow
    const mcInviteRes = await fetch(`${WEB_URL}/api/weddings/minh-va-linh/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerLogin.token}`,
      },
      body: JSON.stringify({ action: 'CREATE_INVITE', role: 'MC' }),
    });
    assert.equal(mcInviteRes.status, 200);
    const mcInvite = await mcInviteRes.json();
    assert.ok(mcInvite.token);

    const mcJoinRes = await fetch(`${WEB_URL}/api/weddings/minh-va-linh/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mcLogin.token}`,
      },
      body: JSON.stringify({ displayName: 'MC Quốc Tuấn', roleInviteToken: mcInvite.token }),
    });
    assert.equal(mcJoinRes.status, 200);
    const mcJoin = await mcJoinRes.json();
    assert.equal(mcJoin.role, 'MC');

    const muteRes = await fetch(`${WEB_URL}/api/weddings/minh-va-linh/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerLogin.token}`,
      },
      body: JSON.stringify({
        action: 'SET_MODERATION',
        userId: mcLogin.user.id,
        moderationStatus: 'MUTED',
      }),
    });
    assert.equal(muteRes.status, 200);
    assert.equal((await muteRes.json()).member.moderationStatus, 'MUTED');

    const unmuteRes = await fetch(`${WEB_URL}/api/weddings/minh-va-linh/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerLogin.token}`,
      },
      body: JSON.stringify({
        action: 'SET_MODERATION',
        userId: mcLogin.user.id,
        moderationStatus: 'ACTIVE',
      }),
    });
    assert.equal(unmuteRes.status, 200);
    assert.equal((await unmuteRes.json()).member.moderationStatus, 'ACTIVE');

    // 8. Partner 100% Voucher Creation (platform admin only) + Instant Wedding Activation
    const voucherCode = `SMOKE100_${String(runId).slice(-5)}`;
    const voucherBody = JSON.stringify({
      code: voucherCode,
      studioName: 'Áo Cưới Smoke Studio',
      discountPercent: 100,
      targetTier: 'VIP_FULFILLMENT',
      maxUses: 5,
    });
    const nonAdminVoucherRes = await fetch(`${WEB_URL}/api/vouchers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerLogin.token}` },
      body: voucherBody,
    });
    assert.equal(nonAdminVoucherRes.status, 403, 'non-admin must not mint vouchers');
    const publicListRes = await fetch(`${WEB_URL}/api/vouchers`);
    assert.equal(publicListRes.status, 401, 'voucher list must not be public');

    const adminLogin = await (
      await fetch(`${WEB_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'GOOGLE',
          providerAccountId: 'google_smoke_platform_admin',
          displayName: 'Smoke Platform Admin',
          email: SMOKE_ADMIN_EMAIL,
        }),
      })
    ).json();
    assert.ok(adminLogin.token);

    const vRes = await fetch(`${WEB_URL}/api/vouchers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminLogin.token}` },
      body: voucherBody,
    });
    assert.equal(vRes.status, 201);

    const newSlug = `smoke-couple-${runId}`;
    const createWedRes = await fetch(`${WEB_URL}/api/weddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerLogin.token}`,
      },
      body: JSON.stringify({
        slug: newSlug,
        brideName: 'Hương',
        groomName: 'Nam',
        tier: 'TRIAL_24H',
        templateId: 'mekong_coconut_tent',
      }),
    });
    assert.equal(createWedRes.status, 201);
    const createdWed = await createWedRes.json();

    const instantOrderRes = await fetch(`${WEB_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerLogin.token}`,
      },
      body: JSON.stringify({
        weddingId: createdWed.wedding.id,
        targetTier: 'VIP_FULFILLMENT',
        voucherCode,
      }),
    });
    assert.equal(instantOrderRes.status, 201);
    const instantOrder = await instantOrderRes.json();
    assert.equal(instantOrder.instantActivated, true);
    assert.equal(instantOrder.wedding.tier, 'VIP_FULFILLMENT');

    // Cleanup: never leave an active 100% code behind in the database
    const disableVoucherRes = await fetch(`${WEB_URL}/api/vouchers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminLogin.token}` },
      body: JSON.stringify({ code: voucherCode, isActive: false }),
    });
    assert.equal(disableVoucherRes.status, 200);
    const disabledCheck = await fetch(`${WEB_URL}/api/vouchers?code=${voucherCode}`);
    assert.equal(disabledCheck.status, 404);

    // 9. Join VIP Wedding Hall as Guest via Colyseus + VietQR Gift + SePay Webhook + Idempotency
    const vipJoinRes = await fetch(`${WEB_URL}/api/weddings/minh-va-linh/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${guestLogin.token}`,
      },
      body: JSON.stringify({ displayName: 'Tuấn Smoke', side: 'GROOM_SIDE' }),
    });
    assert.equal(vipJoinRes.status, 200);
    const vipJoin = await vipJoinRes.json();

    const vipRoom = await colyseus.joinOrCreate('wedding_hall', {
      weddingId: 'wed_minh_linh',
      slug: 'minh-va-linh',
      shardIndex: vipJoin.shardIndex,
      joinToken: vipJoin.joinToken,
    });

    const receivedCelebrations = [];
    vipRoom.onMessage('GIFT_CELEBRATION_EVENT', (payload) => {
      receivedCelebrations.push(payload);
    });

    const intentRes = await fetch(`${WEB_URL}/api/weddings/minh-va-linh/gifts/intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${guestLogin.token}`,
      },
      body: JSON.stringify({
        wishMessage: 'Chúc Minh Linh trăm năm hạnh phúc!',
        suggestedAmountVnd: 500000,
      }),
    });
    assert.equal(intentRes.status, 201);
    const intentData = await intentRes.json();
    assert.ok(intentData.transferCode.startsWith('DCO'));
    assert.ok(intentData.qrDataUrl.startsWith('data:image/png'));

    const txId = `tx_smoke_${runId}`;
    const wh1 = await fetch(`${WEB_URL}/api/webhooks/sepay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Apikey ${env.PLATFORM_SEPAY_API_KEY}`,
      },
      body: JSON.stringify({
        id: txId,
        transferType: 'in',
        transferAmount: 500000,
        content: `CK ${intentData.transferCode}`,
      }),
    });
    assert.equal(wh1.status, 200);
    assert.equal((await wh1.json()).verified, true);

    await new Promise((r) => setTimeout(r, 450));
    assert.equal(receivedCelebrations.length, 1);
    assert.equal(receivedCelebrations[0].guestName, 'Tuấn Smoke');
    assert.equal(receivedCelebrations[0].wishMessage, 'Chúc Minh Linh trăm năm hạnh phúc!');
    assert.equal('amountVnd' in receivedCelebrations[0], false, 'amountVnd must NEVER leak in public toast!');

    const wh2 = await fetch(`${WEB_URL}/api/webhooks/sepay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Apikey ${env.PLATFORM_SEPAY_API_KEY}`,
      },
      body: JSON.stringify({
        id: txId,
        transferType: 'in',
        transferAmount: 500000,
        content: `CK ${intentData.transferCode}`,
      }),
    });
    assert.equal((await wh2.json()).duplicate, true);
    await new Promise((r) => setTimeout(r, 250));
    assert.equal(receivedCelebrations.length, 1);

    const guestLedgerRes = await fetch(`${WEB_URL}/api/weddings/minh-va-linh/ledger`, {
      headers: { Authorization: `Bearer ${guestLogin.token}` },
    });
    assert.equal(guestLedgerRes.status, 403);

    const ownerLedgerRes = await fetch(`${WEB_URL}/api/weddings/minh-va-linh/ledger`, {
      headers: { Authorization: `Bearer ${ownerLogin.token}` },
    });
    assert.equal(ownerLedgerRes.status, 200);
    const ownerLedger = await ownerLedgerRes.json();
    assert.equal(ownerLedger.count, ledgerBefore.count + 1);
    assert.equal(ownerLedger.totalVnd, ledgerBefore.totalVnd + 500000);

    await vipRoom.leave();

    // 10. 2D Forever Memorial & Printable Keepsake Book Check
    const memorialHtml = await (await fetch(`${WEB_URL}/w/duy-va-thao-kyniem`)).text();
    assert.ok(memorialHtml.includes('TRANG KỶ NIỆM 2D VĨNH VIỄN'));

    console.log(`ALL E2E SMOKE CHECKS PASSED SUCCESSFULLY (${healthJson.storageDriver})!`);
  } finally {
    realtimeProc.kill();
    webProc.kill();
    await new Promise((r) => setTimeout(r, 500));
    if (!usePostgres) {
      fs.rmSync(tempDataDir, { recursive: true, force: true });
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
