import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getPlatformSetting } from './platformSettings';

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256Hex(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  cdnBase: string;
}

/** R2 credentials from /admin/settings (or legacy .env); null → local disk fallback. */
export async function getR2Config(): Promise<R2Config | null> {
  const [accountId, accessKeyId, secretAccessKey, bucket, cdnUrl] = await Promise.all([
    getPlatformSetting('R2_ACCOUNT_ID'),
    getPlatformSetting('R2_ACCESS_KEY_ID'),
    getPlatformSetting('R2_SECRET_ACCESS_KEY'),
    getPlatformSetting('R2_BUCKET_NAME'),
    getPlatformSetting('R2_PUBLIC_CDN_URL'),
  ]);
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    cdnBase: (cdnUrl || `https://${bucket}.${accountId}.r2.dev`).replace(/\/$/, ''),
  };
}

/**
 * Generates an AWS Signature V4 presigned PUT URL for Cloudflare R2 without heavy SDK deps.
 */
export async function createR2PresignedPutUrl(params: {
  objectKey: string;
  contentType: string;
  expiresSec?: number;
}): Promise<{ uploadUrl: string; publicUrl: string; isLocalFallback: boolean }> {
  const config = await getR2Config();
  if (!config) {
    const encodedKey = encodeURIComponent(params.objectKey);
    return {
      uploadUrl: `/api/r2/local-upload?key=${encodedKey}`,
      publicUrl: `/api/r2/local-upload?key=${encodedKey}`,
      isLocalFallback: true,
    };
  }

  const { accountId, accessKeyId, secretAccessKey, bucket, cdnBase } = config;

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const region = 'auto';
  const service = 's3';
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const expires = params.expiresSec ?? 60;
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalUri = `/${bucket}/${params.objectKey.split('/').map(encodeURIComponent).join('/')}`;

  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expires),
    'X-Amz-SignedHeaders': 'content-type;host',
  });
  queryParams.sort();

  const canonicalHeaders = `content-type:${params.contentType}\nhost:${host}\n`;
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    queryParams.toString(),
    canonicalHeaders,
    'content-type;host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  return {
    uploadUrl: `https://${host}${canonicalUri}?${queryParams.toString()}&X-Amz-Signature=${signature}`,
    publicUrl: `${cdnBase}/${params.objectKey}`,
    isLocalFallback: false,
  };
}

export function getLocalUploadDir(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, 'turbo.json'))) {
      const target = path.join(dir, '.local-data', 'uploads');
      fs.mkdirSync(target, { recursive: true });
      return target;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const fallback = path.join(process.cwd(), '.local-data', 'uploads');
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}
