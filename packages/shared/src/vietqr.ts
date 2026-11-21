import QRCode from 'qrcode';

const ALPHANUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSuffix(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  }
  return out;
}

export function generateGiftCode(): string {
  // A gift code must never read as a plan or fireworks code when a bank glues text after it
  let suffix = randomSuffix(6);
  while (suffix.startsWith('FW') || suffix.startsWith('PL')) suffix = randomSuffix(6);
  return `DCO${suffix}`;
}

export function generatePlanOrderCode(): string {
  return `DCOPLAN${randomSuffix(6)}`;
}

/** Fireworks bought in the 3D hall, paid to the platform account */
export function generateFireworkCode(): string {
  return `DCOFW${randomSuffix(6)}`;
}

export function extractTransferCode(description: string): {
  kind: 'PLAN' | 'FIREWORK' | 'GIFT' | null;
  code: string | null;
} {
  const cleaned = description.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const planMatch = cleaned.match(/DCOPLAN[A-Z0-9]{6}/);
  if (planMatch) {
    return { kind: 'PLAN', code: planMatch[0] };
  }
  const fireworkMatch = cleaned.match(/DCOFW[A-Z0-9]{6}/);
  if (fireworkMatch) {
    return { kind: 'FIREWORK', code: fireworkMatch[0] };
  }
  const giftMatch = cleaned.match(/DCO[A-Z0-9]{6}/);
  if (giftMatch) {
    return { kind: 'GIFT', code: giftMatch[0] };
  }
  return { kind: null, code: null };
}

function tlv(tag: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${tag}${len}${value}`;
}

export function crc16Ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Builds standard EMVCo / Napas VietQR payload (non-custodial bank-to-bank).
 */
export function buildEmvCoVietQrPayload(params: {
  bankBin: string;
  accountNumber: string;
  amountVnd?: number;
  transferCode: string;
}): string {
  const bankInfo = tlv('00', params.bankBin.trim()) + tlv('01', params.accountNumber.trim());
  const merchantAccount = tlv('00', 'A000000727') + tlv('01', bankInfo) + tlv('02', 'QRIBFTTA');
  const additionalData = tlv('08', params.transferCode.trim().slice(0, 25));

  const parts = [
    tlv('00', '01'),
    tlv('01', params.amountVnd && params.amountVnd > 0 ? '12' : '11'),
    tlv('38', merchantAccount),
    tlv('53', '704'), // VND
  ];

  if (params.amountVnd && params.amountVnd > 0) {
    parts.push(tlv('54', String(Math.round(params.amountVnd))));
  }

  parts.push(tlv('58', 'VN'));
  parts.push(tlv('62', additionalData));

  const withoutCrc = `${parts.join('')}6304`;
  return `${withoutCrc}${crc16Ccitt(withoutCrc)}`;
}

export async function buildVietQrDataUrl(params: {
  bankBin: string;
  accountNumber: string;
  amountVnd?: number;
  transferCode: string;
}): Promise<{ payload: string; dataUrl: string }> {
  const payload = buildEmvCoVietQrPayload(params);
  const dataUrl = await QRCode.toDataURL(payload, {
    width: 320,
    margin: 2,
    color: { dark: '#1e1b4b', light: '#ffffff' },
  });
  return { payload, dataUrl };
}

export interface SanitizedVideoEmbed {
  provider: 'youtube' | 'vimeo' | 'gdrive';
  embedUrl: string;
  thumbnailUrl?: string;
}

export function sanitizeExternalVideoUrl(rawUrl: string): SanitizedVideoEmbed | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const liveMatch = parsed.pathname.match(/^\/live\/([a-zA-Z0-9_-]{6,20})/);
      const videoId = liveMatch?.[1] ?? parsed.searchParams.get('v');
      if (!videoId || !/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) return null;
      return {
        provider: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.slice(1).split('/')[0];
      if (!videoId || !/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) return null;
      return {
        provider: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const match = parsed.pathname.match(/\/(?:video\/)?(\d{5,15})/);
      if (!match) return null;
      return {
        provider: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${match[1]}?autoplay=1`,
      };
    }

    if (host === 'drive.google.com') {
      const match = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]{10,60})/);
      if (!match) return null;
      return {
        provider: 'gdrive',
        embedUrl: `https://drive.google.com/file/d/${match[1]}/preview`,
      };
    }

    return null;
  } catch {
    return null;
  }
}
