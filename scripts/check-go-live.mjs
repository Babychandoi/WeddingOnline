import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');

// Same rules the servers enforce at runtime (packages/shared/src/secrets.ts)
const require = createRequire(import.meta.url);
let isInsecureSecret;
try {
  ({ isInsecureSecret } = require(path.join(ROOT, 'packages', 'shared', 'dist', 'secrets.js')));
} catch {
  console.error('Chưa build @dco/shared — hãy chạy "npm run build" trước.');
  process.exit(1);
}

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const raw of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

async function checkHttpJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function main() {
  const env = parseEnvFile(ENV_PATH);
  const webHealth = await checkHttpJson('http://127.0.0.1:3000/api/health');
  const rtHealth = await checkHttpJson('http://127.0.0.1:2567/health');

  const appUrl = (env.NEXT_PUBLIC_APP_URL || env.NEXTAUTH_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );
  const googleReady = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  // Payment & storage settings live in /admin/settings (database) — ask the running web app
  const sepayReady = Boolean(webHealth?.sepayLiveConfigured && webHealth?.platformBankConfigured);
  const weakSecrets = [
    ['SESSION_SECRET', 32],
    ['INTERNAL_SERVICE_SECRET', 32],
    ['LIVEKIT_API_SECRET', 32],
    ['SETTINGS_ENCRYPTION_KEY', 32],
  ]
    .filter(([key, minLength]) => isInsecureSecret(env[key], minLength))
    .map(([key]) => key);
  const adminReady = Boolean((env.PLATFORM_ADMIN_EMAILS || '').trim());
  const r2Ready = Boolean(webHealth?.r2Configured);
  const httpsReady = appUrl.startsWith('https://') && (env.LIVEKIT_URL || '').startsWith('wss://');

  console.log('=== KIỂM TRA SẴN SÀNG VẬN HÀNH DAMCUOIONLINE ===\n');
  console.log(
    `[0] Secret nội bộ (phiên đăng nhập, realtime, LiveKit): ${
      weakSecrets.length === 0
        ? 'OK'
        : `NGUY HIỂM — còn giá trị mặc định/yếu: ${weakSecrets.join(', ')} (chạy: npm run secrets:rotate)`
    }`
  );
  console.log(
    `[1] Cụm dịch vụ nền (Web + Colyseus + PostgreSQL): ${
      webHealth?.ok && rtHealth?.ok && webHealth.storageDriver === 'prisma-postgres'
        ? 'OK (Đang chạy trên PostgreSQL thật)'
        : 'CHƯA BẬT ĐỦ'
    }`
  );
  console.log(
    `[2] Đăng nhập Google OAuth 2.0 (Chỉ dùng Google): ${
      googleReady
        ? 'OK (Đã điền GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET)'
        : `CHỜ BẠN ĐIỀN (.env -> GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Redirect URI: ${appUrl}/api/auth/oauth/google)`
    }`
  );
  console.log(
    `[3] Trang quản trị /admin/settings: ${
      adminReady ? 'OK (Đã khai báo PLATFORM_ADMIN_EMAILS)' : 'CHƯA CÓ ADMIN (.env -> PLATFORM_ADMIN_EMAILS)'
    }`
  );
  console.log(
    `[4] Thanh toán & Webhook SePay thực tế: ${
      sepayReady
        ? 'OK'
        : webHealth
        ? 'CHƯA CẤU HÌNH (nhập tài khoản ngân hàng & khóa SePay tại /admin/settings)'
        : 'KHÔNG KIỂM TRA ĐƯỢC (web chưa chạy)'
    }`
  );
  console.log(
    `[5] Lưu trữ ảnh Cloudflare R2 CDN: ${
      r2Ready ? 'OK (Cloudflare R2)' : 'ĐANG DÙNG LOCAL FALLBACK (.local-data/uploads) — cấu hình tại /admin/settings'
    }`
  );
  console.log(
    `[6] Tên miền HTTPS & LiveKit WSS (Deploy VPS): ${
      httpsReady ? 'OK' : 'ĐANG CHẠY LOCALHOST (Sẵn cấu hình tại infra/docker-compose.yml & infra/Caddyfile)'
    }\n`
  );
}

main();
