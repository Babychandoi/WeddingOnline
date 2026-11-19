// Replaces the self-managed secrets in the root .env (and the matching LiveKit key in
// infra/livekit.dev.yaml) with fresh random values. Values are never printed.
//
// The SePay webhook key is NOT generated here: it must match what is configured
// in the SePay dashboard, so enter it in /admin/settings.
//
// After running: restart the stack (npm run docker:up) — everyone gets logged out and
// any room PIN set before the rotation must be set again (PINs are hashed with SESSION_SECRET).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const LIVEKIT_YAML_PATH = path.join(ROOT, 'infra', 'livekit.dev.yaml');

// Hex output can never contain the "dev_"/"change_me"-style markers the servers reject.
const hex = (bytes) => crypto.randomBytes(bytes).toString('hex');

const updates = {
  SESSION_SECRET: hex(32),
  INTERNAL_SERVICE_SECRET: hex(32),
  LIVEKIT_API_KEY: `API${hex(6)}`,
  LIVEKIT_API_SECRET: hex(32),
};

// SETTINGS_ENCRYPTION_KEY is created once and never rotated here: changing it would make
// every secret saved in /admin/settings unreadable.
function readEnvValue(key) {
  if (!fs.existsSync(ENV_PATH)) return '';
  const line = fs
    .readFileSync(ENV_PATH, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith(`${key}=`));
  return line ? line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') : '';
}
const currentSettingsKey = readEnvValue('SETTINGS_ENCRYPTION_KEY');
if (currentSettingsKey.length < 32 || /dev_|generate_strong|change_me/i.test(currentSettingsKey)) {
  updates.SETTINGS_ENCRYPTION_KEY = hex(32);
}

function writeAtomic(filePath, content) {
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}

function rotateEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(`Không tìm thấy ${ENV_PATH}. Hãy chạy lệnh này ở thư mục gốc dự án.`);
  }
  const raw = fs.readFileSync(ENV_PATH, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const pending = new Set(Object.keys(updates));

  const next = lines.map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (!match || !pending.has(match[1])) return line;
    pending.delete(match[1]);
    return `${match[1]}="${updates[match[1]]}"`;
  });

  // Keys missing from .env are appended before the trailing blank line, if any
  if (pending.size > 0) {
    const trailingBlank = next.length > 0 && next[next.length - 1] === '';
    if (trailingBlank) next.pop();
    for (const key of pending) next.push(`${key}="${updates[key]}"`);
    if (trailingBlank) next.push('');
  }

  writeAtomic(ENV_PATH, next.join(eol));
}

function rotateLivekitYaml() {
  if (!fs.existsSync(LIVEKIT_YAML_PATH)) return false;
  const raw = fs.readFileSync(LIVEKIT_YAML_PATH, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const keysIdx = lines.findIndex((l) => /^keys:\s*$/.test(l));
  if (keysIdx < 0) throw new Error('infra/livekit.dev.yaml không có mục "keys:".');

  // Drop every existing key entry (indented lines) under "keys:" and write the new pair
  let end = keysIdx + 1;
  while (end < lines.length && /^\s+\S/.test(lines[end])) end++;
  lines.splice(keysIdx + 1, end - keysIdx - 1, `  ${updates.LIVEKIT_API_KEY}: ${updates.LIVEKIT_API_SECRET}`);

  writeAtomic(LIVEKIT_YAML_PATH, lines.join(eol));
  return true;
}

rotateEnvFile();
const yamlUpdated = rotateLivekitYaml();

console.log('Đã tạo secret mới (không in giá trị):');
for (const key of Object.keys(updates)) console.log(`  - ${key}  (.env)`);
if (yamlUpdated) console.log('  - LiveKit key/secret  (infra/livekit.dev.yaml)');
console.log('\nBước tiếp theo:');
console.log('  1. Khởi động lại toàn bộ stack: npm run docker:up');
console.log('  2. Mọi người sẽ bị đăng xuất; PIN phòng cưới đã đặt trước đó cần đặt lại.');
console.log('  3. Nhập tài khoản ngân hàng & khóa SePay thật tại /admin/settings');
console.log('     (chưa nhập thì webhook thanh toán trả 503 trên production — đúng như mong muốn).');
