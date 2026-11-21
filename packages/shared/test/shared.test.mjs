import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STARTER_TEMPLATES,
  validateSceneLayout,
  buildOccupancyGrid,
  findGridPathAStar,
  gridCellToWorld,
  filterVietnameseProfanity,
  sanitizeBubbleText,
  buildEmvCoVietQrPayload,
  crc16Ccitt,
  extractTransferCode,
  sanitizeExternalVideoUrl,
  MotionTrack,
} from '../dist/index.js';

test('Remote movement plays back at an even speed despite network jitter', () => {
  let seed = 7;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const SPEED = 4.8;
  const FRAME = 1000 / 60;

  // Sender at ~60 fps with hitches, emitting every >= 100 ms (as the hall client does)
  const sends = [];
  let t = 0;
  let x = 0;
  let lastEmit = -1e9;
  while (t < 8000) {
    const dt = rnd() < 0.03 ? FRAME * 3 : FRAME * (0.9 + rnd() * 0.2);
    t += dt;
    x += (SPEED * dt) / 1000;
    if (t - lastEmit >= 100) {
      lastEmit = t;
      sends.push({ senderT: t, x });
    }
  }
  // 30–70 ms to the server, wait for its 50 ms patch, 10–50 ms to the viewer (other clock)
  const offset = 123456;
  const arrivals = sends
    .map((s) => ({ ...s, arrive: Math.ceil((s.senderT + 30 + rnd() * 40) / 50) * 50 + 10 + rnd() * 40 + offset }))
    .sort((a, b) => a.arrive - b.arrive);

  const track = new MotionTrack();
  let i = 0;
  let prev = 0;
  const speeds = [];
  for (let now = offset + 500; now < offset + 7700; now += FRAME) {
    while (i < arrivals.length && arrivals[i].arrive <= now) {
      const a = arrivals[i++];
      track.push(a.x, 0, 0, a.senderT, a.arrive);
    }
    const shown = track.sample(now)?.x ?? prev;
    if (now > offset + 1500) speeds.push(((shown - prev) / FRAME) * 1000);
    prev = shown;
  }
  const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const sd = Math.sqrt(speeds.reduce((a, b) => a + (b - mean) ** 2, 0) / speeds.length);
  assert.ok(Math.abs(mean - SPEED) < 0.25, `mean speed ${mean}`);
  assert.ok(sd / mean < 0.1, `speed varies ${((sd / mean) * 100).toFixed(0)}% frame to frame`);
  assert.equal(speeds.filter((s) => s < SPEED * 0.25).length, 0, 'avatar stalled mid-walk');

  // A seat change / respawn jumps instead of gliding across the hall
  track.push(x + 8, 0, 0, 0, offset + 9000);
  assert.equal(track.sample(offset + 9000 + 500)?.x, x + 8);
});

test('Every venue starter template passes Grid-Snap walkability & overlap validation', () => {
  for (const [id, tpl] of Object.entries(STARTER_TEMPLATES)) {
    const res = validateSceneLayout(tpl.layout);
    assert.equal(res.valid, true, `Template ${id} failed: ${res.errors.join(', ')}`);
    assert.equal(res.errors.length, 0);
  }
});

test('Scene validator detects overlapping tables and blocked corridors', () => {
  const base = structuredClone(STARTER_TEMPLATES.luxury_ballroom.layout);
  // Overlap a table on top of existing table-1 (12, 16)
  base.prefabs.push({
    instanceId: 'table-overlap',
    prefabType: 'BANQUET_TABLE_10',
    gridX: 13,
    gridZ: 17,
    rotationDeg: 0,
    meta: { tableNumber: 9, tableLabel: 'Trùng' },
  });
  const overlapRes = validateSceneLayout(base);
  assert.equal(overlapRes.valid, false);
  assert.ok(overlapRes.errors.some((e) => e.includes('chồng chéo')));

  // Now test sealing off photo-1 (24..25, 42..43) inside a ring of pillars
  const blocked = structuredClone(STARTER_TEMPLATES.luxury_ballroom.layout);
  const ring = [
    [22, 40], [24, 40], [26, 40],
    [22, 42],           [26, 42],
    [22, 44], [24, 44], [26, 44],
  ];
  for (const [x, z] of ring) {
    blocked.prefabs.push({
      instanceId: `wall-${x}-${z}`,
      prefabType: 'DECOR_FLOWER_PILLAR',
      gridX: x,
      gridZ: z,
      rotationDeg: 0,
    });
  }
  const blockedRes = validateSceneLayout(blocked);
  assert.equal(blockedRes.valid, false);
});

test('2D A* finds valid path from gate spawn to stage front', () => {
  const layout = STARTER_TEMPLATES.mekong_coconut_tent.layout;
  const grid = buildOccupancyGrid(layout);
  const start = gridCellToWorld(29, 50);
  const goal = gridCellToWorld(29, 10);
  const path = findGridPathAStar(grid, start, goal);
  assert.ok(path.length > 5);
});

test('Vietnamese profanity filter masks offensive words and caps length', () => {
  assert.equal(filterVietnameseProfanity('Chuc mung vcl nha'), 'Chuc mung *** nha');
  assert.equal(filterVietnameseProfanity('Đm thằng kia'), '** thằng kia');
  const long = sanitizeBubbleText('a'.repeat(120));
  assert.equal(long.length, 80);
});

test('VietQR EMVCo payload ends with valid CRC16 & regex parses DCO/DCOPLAN codes', () => {
  const payload = buildEmvCoVietQrPayload({
    bankBin: '970422',
    accountNumber: '0123456789',
    amountVnd: 500000,
    transferCode: 'DCO8F3A2B',
  });
  const withoutCrc = payload.slice(0, -4);
  const crc = payload.slice(-4);
  assert.equal(crc16Ccitt(withoutCrc), crc);
  assert.deepEqual(extractTransferCode('chuyen khoan dco-8f3a2b mung cuoi'), {
    kind: 'GIFT',
    code: 'DCO8F3A2B',
  });
  assert.deepEqual(extractTransferCode('Thanh toan DCOPLAN7X4P9A nang cap VIP'), {
    kind: 'PLAN',
    code: 'DCOPLAN7X4P9A',
  });
});

test('External video URL sanitizer allowlists YouTube/Vimeo/Drive only', () => {
  assert.equal(
    sanitizeExternalVideoUrl('https://youtu.be/dQw4w9WgXcQ')?.embedUrl,
    'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&enablejsapi=1'
  );
  assert.equal(
    sanitizeExternalVideoUrl('https://www.youtube.com/live/abcDEF12345')?.embedUrl,
    'https://www.youtube.com/embed/abcDEF12345?autoplay=1&enablejsapi=1'
  );
  assert.equal(
    sanitizeExternalVideoUrl('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQr/view')?.embedUrl,
    'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQr/preview'
  );
  assert.equal(sanitizeExternalVideoUrl('https://evil-site.com/stream.m3u8'), null);
});

test('Secret guard rejects dev defaults only on hardened production servers', async () => {
  const { DEV_SECRET_DEFAULTS, isInsecureSecret, resolveSecret, requireSecret } = await import(
    '../dist/secrets.js'
  );
  const saved = { NODE_ENV: process.env.NODE_ENV, ALLOW_DEV_AUTH: process.env.ALLOW_DEV_AUTH };
  const strong = 'a3f9c1e07b5d24f8a6c09e1b7d3f5a2c4e6b8d0f1a3c5e7b9d1f3a5c7e9b1d3f';
  try {
    for (const value of Object.values(DEV_SECRET_DEFAULTS)) {
      assert.equal(isInsecureSecret(value, 16), true, `default should be insecure: ${value}`);
    }
    assert.equal(isInsecureSecret('generate_strong_session_secret_at_least_32_chars'), true);
    assert.equal(isInsecureSecret('', 16), true);
    assert.equal(isInsecureSecret(strong), false);

    // Local dev: falls back to the built-in default so the app runs without a .env
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOW_DEV_AUTH;
    assert.equal(resolveSecret('SESSION_SECRET', ''), DEV_SECRET_DEFAULTS.SESSION_SECRET);

    // Production: weak or missing values fail closed
    process.env.NODE_ENV = 'production';
    assert.equal(resolveSecret('PLATFORM_SEPAY_API_KEY', 'dev_sepay_key'), null);
    assert.equal(resolveSecret('SESSION_SECRET', undefined), null);
    assert.throws(() => requireSecret('INTERNAL_SERVICE_SECRET', 'dev_internal_secret_change_me'), /\[security\]/);
    assert.equal(requireSecret('SESSION_SECRET', strong), strong);

    // Local smoke/load tests opt out explicitly
    process.env.ALLOW_DEV_AUTH = '1';
    assert.equal(resolveSecret('PLATFORM_SEPAY_API_KEY', ''), DEV_SECRET_DEFAULTS.PLATFORM_SEPAY_API_KEY);
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test('Admin settings secrets round-trip with AES-GCM and fail closed on a wrong key', async () => {
  const { encryptSettingValue, decryptSettingValue } = await import('../dist/settingsCrypto.js');
  const key = 'f'.repeat(64);
  const blob = encryptSettingValue('SEPAY-LIVE-KEY-123456', key);

  assert.ok(blob.startsWith('v1:'));
  assert.ok(!blob.includes('SEPAY-LIVE-KEY'), 'ciphertext must not contain the plaintext');
  assert.notEqual(encryptSettingValue('SEPAY-LIVE-KEY-123456', key), blob, 'random IV per write');
  assert.equal(decryptSettingValue(blob, key), 'SEPAY-LIVE-KEY-123456');

  assert.equal(decryptSettingValue(blob, 'e'.repeat(64)), null, 'wrong key → unreadable');
  const tampered = blob.slice(0, -2) + (blob.endsWith('A') ? 'BB' : 'AA');
  assert.equal(decryptSettingValue(tampered, key), null, 'tampered ciphertext → unreadable');
  assert.equal(decryptSettingValue('plain-text-from-old-row', key), null);
});

test('Vietnamese lunar calendar matches known Tết, leap-month and Trung Thu dates', async () => {
  const { solarToLunar, canChiYear, formatLunarVi } = await import('../dist/index.js');
  const tet2024 = solarToLunar(10, 2, 2024);
  assert.deepEqual([tet2024.day, tet2024.month, tet2024.year, tet2024.leap], [1, 1, 2024, false]);
  assert.equal(canChiYear(2024), 'Giáp Thìn');
  const tet2025 = solarToLunar(29, 1, 2025);
  assert.deepEqual([tet2025.day, tet2025.month, tet2025.year], [1, 1, 2025]);
  assert.equal(canChiYear(2025), 'Ất Tỵ');
  const tet2026 = solarToLunar(17, 2, 2026);
  assert.deepEqual([tet2026.day, tet2026.month, tet2026.year], [1, 1, 2026]);
  assert.equal(canChiYear(2026), 'Bính Ngọ');
  // 2023 had a leap second month starting 22 March
  const leap = solarToLunar(22, 3, 2023);
  assert.deepEqual([leap.day, leap.month, leap.leap], [1, 2, true]);
  // Trung Thu 2025: 15/8 âm lịch
  const trungThu = solarToLunar(6, 10, 2025);
  assert.deepEqual([trungThu.day, trungThu.month], [15, 8]);
  // An evening in Vietnam that is still the previous day in UTC uses the Vietnamese date
  assert.equal(formatLunarVi('2026-02-16T18:00:00.000Z'), '1 tháng 1 năm Bính Ngọ');
});

test('Invitation config sanitiser keeps content bounded and links safe', async () => {
  const { defaultInvitationConfig, sanitizeInvitationConfig, invitationMapLink } = await import('../dist/index.js');
  const base = defaultInvitationConfig({ groomName: 'Minh', brideName: 'Linh', weddingDate: '2026-12-20T03:00:00.000Z' });
  const out = sanitizeInvitationConfig(
    {
      templateId: 'not-a-template',
      coverPhotoUrl: 'javascript:alert(1)',
      music: { mode: 'URL', url: 'http://insecure.example/song.mp3' },
      headline: 'x'.repeat(500),
      events: [{ kind: 'TIEC_CUOI', venueName: 'Trung tâm tiệc cưới', address: '1 Lê Lợi, Huế', mapUrl: 'data:text/html,hi', startsAt: 'nope' }],
      sections: { gift: false },
    },
    base,
  );
  assert.equal(out.templateId, base.templateId);
  assert.equal(out.coverPhotoUrl, '');
  assert.equal(out.music.url, '');
  assert.equal(out.headline.length, 120);
  assert.equal(out.events.length, 1);
  assert.equal(out.events[0].mapUrl, '');
  assert.equal(out.events[0].startsAt, base.events[0].startsAt);
  assert.match(invitationMapLink(out.events[0]), /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  assert.equal(out.sections.gift, false);
  assert.equal(out.sections.wishes, true);
  // Untouched fields keep the defaults
  assert.equal(out.groomFullName, 'Minh');
  // Built-in music: known pieces only; invitations saved before the library default to the music box
  assert.equal(out.music.track, 'hop-nhac');
  assert.equal(sanitizeInvitationConfig({ music: { mode: 'SYNTH', track: 'canon' } }, base).music.track, 'canon');
  assert.equal(sanitizeInvitationConfig({ music: { mode: 'SYNTH', track: '../../etc' } }, base).music.track, 'hop-nhac');
  const legacy = { ...base, music: { mode: 'SYNTH', url: '' } };
  assert.equal(sanitizeInvitationConfig({}, legacy).music.track, 'hop-nhac');
});

test('Invitation plans: published only when paid, renewals add on, a paid 3D hall includes it', async () => {
  const { INVITATION_PLANS, invitationAccess, invitationPlanEnd, INVITATION_LIFETIME_UNTIL } = await import('../dist/index.js');
  assert.deepEqual(INVITATION_PLANS.map((p) => p.priceVnd), [150000, 400000, 750000, 1400000, 3000000]);
  const now = Date.parse('2026-11-20T00:00:00Z');
  const draft = { tier: 'TRIAL_24H', status: 'DRAFT', invitationPaidUntil: null };
  assert.equal(invitationAccess(draft, now).published, false);
  assert.equal(invitationAccess(draft, now).expired, false);
  // 3 months from now, then a 1-month renewal adds onto the remaining time
  const end3 = invitationPlanEnd('3m', null, new Date(now));
  assert.equal(end3, '2027-02-20T00:00:00.000Z');
  assert.equal(invitationPlanEnd('1m', end3, new Date(now)), '2027-03-20T00:00:00.000Z');
  const paid = { ...draft, invitationPaidUntil: end3 };
  assert.deepEqual(
    { ...invitationAccess(paid, now) },
    { published: true, source: 'plan', until: end3, lifetime: false, expired: false },
  );
  // Lapsed plan: hidden and marked expired; a lapsed plan restarts from today
  const lapsed = invitationAccess(paid, Date.parse('2027-03-01T00:00:00Z'));
  assert.equal(lapsed.published, false);
  assert.equal(lapsed.expired, true);
  assert.equal(invitationPlanEnd('1m', end3, new Date('2027-03-01T00:00:00Z')), '2027-04-01T00:00:00.000Z');
  assert.equal(invitationPlanEnd('life', end3, new Date(now)), INVITATION_LIFETIME_UNTIL);
  // A paid hall includes it; the paid tier alone (still DRAFT, not paid yet) does not
  assert.equal(invitationAccess({ tier: 'HAPPINESS', status: 'PUBLISHED_3D' }, now).source, 'hall');
  assert.equal(invitationAccess({ tier: 'VIP_FULFILLMENT', status: 'DRAFT' }, now).published, false);
  assert.equal(invitationAccess({ tier: 'HAPPINESS', status: 'ARCHIVED_2D_FOREVER' }, now).published, false);
});
