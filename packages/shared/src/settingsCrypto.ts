import crypto from 'node:crypto';

/**
 * Encryption at rest for secrets that admins store in the database (payment webhook
 * keys, storage credentials). AES-256-GCM, key derived from SETTINGS_ENCRYPTION_KEY.
 * Changing that key makes previously stored secrets unreadable — they must be re-entered.
 */

const VERSION = 'v1';

function deriveKey(masterKey: string): Buffer {
  return crypto.createHash('sha256').update(`dco-settings:${masterKey}`, 'utf8').digest();
}

export function encryptSettingValue(plain: string, masterKey: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(masterKey), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join(':');
}

/** Returns null when the blob is malformed or was encrypted with a different key. */
export function decryptSettingValue(blob: string, masterKey: string): string | null {
  const parts = blob.split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) return null;
  try {
    const [, iv, tag, ciphertext] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(masterKey), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return null;
  }
}
