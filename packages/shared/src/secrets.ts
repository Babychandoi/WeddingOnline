/**
 * Central guard for server secrets.
 *
 * Local development keeps working with the built-in dev defaults below, but a
 * hardened production process refuses to sign or verify anything with a missing
 * or well-known value — those defaults live in this source code, so anyone who has
 * seen it could forge sessions, webhooks or internal events.
 */

export const DEV_SECRET_DEFAULTS = {
  SESSION_SECRET: 'dev_session_secret_change_in_production_32chars',
  INTERNAL_SERVICE_SECRET: 'dev_internal_secret_change_me',
  LIVEKIT_API_SECRET: 'secret_dev_livekit_damcuoionline_32chars',
  PLATFORM_SEPAY_API_KEY: 'dev_sepay_key',
  SETTINGS_ENCRYPTION_KEY: 'dev_settings_encryption_key_local_only',
} as const;

export type ManagedSecretName = keyof typeof DEV_SECRET_DEFAULTS;

// Secrets we generate ourselves must be long; provider-issued webhook tokens may be shorter.
const MIN_LENGTH: Record<ManagedSecretName, number> = {
  SESSION_SECRET: 32,
  INTERNAL_SERVICE_SECRET: 32,
  LIVEKIT_API_SECRET: 32,
  PLATFORM_SEPAY_API_KEY: 16,
  SETTINGS_ENCRYPTION_KEY: 32,
};

const INSECURE_MARKERS = [
  'dev_',
  'devkey',
  'change_me',
  'changeme',
  'change_in_production',
  'generate_strong',
  'replace_with',
  'placeholder',
  'your_',
  'example',
];

/**
 * True for a real production server. Local smoke/load tests run `next start` with
 * NODE_ENV=production but opt out with ALLOW_DEV_AUTH=1 — which already allows
 * logging in as anyone, so it must never be set on a public deployment.
 */
export function isHardenedProduction(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_AUTH !== '1';
}

export function isInsecureSecret(value: string | null | undefined, minLength = 32): boolean {
  const v = (value ?? '').trim();
  if (v.length < minLength) return true;
  const lower = v.toLowerCase();
  return INSECURE_MARKERS.some((marker) => lower.includes(marker));
}

/**
 * Returns the secret, the dev default outside hardened production, or null when a
 * hardened production server has no usable value.
 */
export function resolveSecret(
  name: ManagedSecretName,
  value: string | null | undefined = process.env[name]
): string | null {
  const v = (value ?? '').trim();
  if (!isHardenedProduction()) return v || DEV_SECRET_DEFAULTS[name];
  return isInsecureSecret(v, MIN_LENGTH[name]) ? null : v;
}

/** Like resolveSecret, but throws so the caller fails closed instead of using a weak key. */
export function requireSecret(
  name: ManagedSecretName,
  value: string | null | undefined = process.env[name]
): string {
  const secret = resolveSecret(name, value);
  if (secret === null) {
    throw new Error(
      `[security] ${name} is missing or still a development default. ` +
        `Set a strong random value (>= ${MIN_LENGTH[name]} chars) in .env before running in production.`
    );
  }
  return secret;
}
