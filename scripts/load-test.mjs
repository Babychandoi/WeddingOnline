import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Client as ColyseusClient } from 'colyseus.js';

const ROOT = process.cwd();
const WEB_URL = 'http://127.0.0.1:3000';
const REALTIME_URL = 'http://127.0.0.1:2567';

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
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timeout waiting for ${url}`);
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
  const runId = Date.now();
  const env = {
    ...dotEnv,
    NODE_ENV: 'production',
    ALLOW_DEV_AUTH: '1',
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

  const rooms = [];
  try {
    await waitForHttp(`${REALTIME_URL}/health`);
    await waitForHttp(`${WEB_URL}/api/health`);

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

    // Authenticate 120 concurrent guests in batches of 30
    const guestTokens = [];
    for (let offset = 0; offset < 120; offset += 30) {
      const batch = await Promise.all(
        Array.from({ length: 30 }, (_, idx) => {
          const n = offset + idx;
          return fetch(`${WEB_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'ZALO',
              providerAccountId: `zalo_load_${runId}_${n}`,
              displayName: `Khách Load ${n + 1}`,
            }),
          }).then((r) => r.json());
        })
      );
      for (const b of batch) {
        assert.ok(b.token);
        guestTokens.push(b.token);
      }
    }

    // Connect 120 concurrent Colyseus clients in waves of 25 so /join balances across shards (cap <= 60)
    const shardClients = [25, 25, 25, 25, 20];
    let tokenIdx = 0;
    const t0 = Date.now();

    for (const waveSize of shardClients) {
      const slice = guestTokens.slice(tokenIdx, tokenIdx + waveSize);
      tokenIdx += waveSize;
      const waveRooms = await Promise.all(
        slice.map(async (tok, localIdx) => {
          const joinRes = await fetch(`${WEB_URL}/api/weddings/minh-va-linh/join`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tok}`,
            },
            body: JSON.stringify({ displayName: `Load Guest ${tokenIdx - waveSize + localIdx + 1}` }),
          });
          assert.equal(joinRes.status, 200);
          const joinData = await joinRes.json();
          const client = new ColyseusClient('ws://127.0.0.1:2567');
          const room = await client.joinOrCreate('wedding_hall', {
            weddingId: 'wed_minh_linh',
            slug: 'minh-va-linh',
            shardIndex: joinData.shardIndex,
            joinToken: joinData.joinToken,
          });
          room.send('MOVE_INPUT', {
            x: (localIdx % 10) - 5,
            z: Math.floor(localIdx / 10) - 2,
            rotY: 0,
            isMoving: true,
          });
          return room;
        })
      );
      rooms.push(...waveRooms);
    }

    await new Promise((r) => setTimeout(r, 400));
    const connectElapsedMs = Date.now() - t0;

    // Verify shard distribution via Realtime internal endpoint
    const shardRes = await fetch(`${REALTIME_URL}/shards/wed_minh_linh`);
    assert.equal(shardRes.status, 200);
    const shardInfo = await shardRes.json();
    const totalClients = shardInfo.shards.reduce((s, x) => s + x.clients, 0);
    assert.equal(totalClients, 120, `Expected 120 concurrent clients, got ${totalClients}`);
    assert.ok(shardInfo.shards.length >= 2, `Expected >= 2 shards, got ${shardInfo.shards.length}`);
    for (const shard of shardInfo.shards) {
      assert.ok(shard.clients <= 60, `Shard ${shard.shardIndex} exceeded cap: ${shard.clients}`);
    }
    console.log(
      `120 CCU connected across ${shardInfo.shards.length} shards in ${connectElapsedMs}ms:`,
      shardInfo.shards.map((s) => `shard#${s.shardIndex}=${s.clients}`).join(', ')
    );

    // Track celebratory broadcasts across shard #1 (first client) and shard #3 (last client)
    const shard1Events = [];
    const shardLastEvents = [];
    rooms[0].onMessage('GIFT_CELEBRATION_EVENT', (ev) => shard1Events.push(ev));
    rooms[rooms.length - 1].onMessage('GIFT_CELEBRATION_EVENT', (ev) => shardLastEvents.push(ev));

    const ledgerBefore = await (
      await fetch(`${WEB_URL}/api/weddings/minh-va-linh/ledger`, {
        headers: { Authorization: `Bearer ${ownerLogin.token}` },
      })
    ).json();

    // Create 15 gift intents
    const intents = await Promise.all(
      Array.from({ length: 15 }, (_, i) =>
        fetch(`${WEB_URL}/api/weddings/minh-va-linh/gifts/intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${guestTokens[i]}`,
          },
          body: JSON.stringify({
            wishMessage: `Load Gift #${i + 1}`,
            suggestedAmountVnd: 50000,
          }),
        }).then((r) => r.json())
      )
    );

    // Fire 20 concurrent SePay webhooks: 15 unique + 5 duplicate TX IDs
    const webhookPayloads = [
      ...intents.map((it, i) => ({
        id: `tx_load_${runId}_${i}`,
        transferType: 'in',
        transferAmount: 50000,
        content: `CK ${it.transferCode}`,
      })),
      ...intents.slice(0, 5).map((it, i) => ({
        id: `tx_load_${runId}_${i}`,
        transferType: 'in',
        transferAmount: 50000,
        content: `CK ${it.transferCode}`,
      })),
    ];

    const whResponses = await Promise.all(
      webhookPayloads.map((payload) =>
        fetch(`${WEB_URL}/api/webhooks/sepay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Apikey ${env.PLATFORM_SEPAY_API_KEY}`,
          },
          body: JSON.stringify(payload),
        }).then((r) => r.json())
      )
    );

    const verifiedCount = whResponses.filter((r) => r.verified && !r.duplicate).length;
    const duplicateCount = whResponses.filter((r) => r.duplicate).length;
    assert.equal(verifiedCount, 15, `Expected 15 verified unique webhooks, got ${verifiedCount}`);
    assert.equal(duplicateCount, 5, `Expected 5 duplicate idempotent responses, got ${duplicateCount}`);

    await new Promise((r) => setTimeout(r, 800));

    const ledgerAfter = await (
      await fetch(`${WEB_URL}/api/weddings/minh-va-linh/ledger`, {
        headers: { Authorization: `Bearer ${ownerLogin.token}` },
      })
    ).json();

    assert.equal(ledgerAfter.count, ledgerBefore.count + 15);
    assert.equal(ledgerAfter.totalVnd, ledgerBefore.totalVnd + 15 * 50000);
    assert.equal(shard1Events.length, 15, `Expected 15 toasts on shard#1, got ${shard1Events.length}`);
    assert.equal(shardLastEvents.length, 15, `Expected 15 toasts on last shard, got ${shardLastEvents.length}`);
    for (const ev of [...shard1Events, ...shardLastEvents]) {
      assert.equal('amountVnd' in ev, false, 'amountVnd must NEVER leak in celebratory broadcasts!');
    }

    console.log('120 CCU + 20-CONCURRENT WEBHOOK LOAD TEST PASSED 100%!');
  } finally {
    await Promise.allSettled(rooms.map((r) => r.leave()));
    realtimeProc.kill();
    webProc.kill();
    await new Promise((r) => setTimeout(r, 500));
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
