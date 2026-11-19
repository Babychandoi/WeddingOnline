import zlib from 'node:zlib';

const WIDTH = 1200;
const HEIGHT = 630;

// Classic 5x7 uppercase bitmap font (bit 4 = leftmost pixel, bit 0 = rightmost)
const FONT_5X7: Record<string, number[]> = {
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '-': [0, 0, 0, 0b11111, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 0b01100, 0b01100],
  '/': [0b00001, 0b00010, 0b00100, 0b00100, 0b01000, 0b10000, 0],
  ':': [0, 0b01100, 0b01100, 0, 0b01100, 0b01100, 0],
  '&': [0b01100, 0b10010, 0b10100, 0b01000, 0b10101, 0b10010, 0b01101],
  '!': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0, 0b00100],
  '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  '3': [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  '6': [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11100, 0b10010, 0b10001, 0b10001, 0b10001, 0b10010, 0b11100],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b10010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
};

function toAsciiUpper(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9 &:./!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fillRect(
  rgba: Uint8Array,
  x0: number,
  y0: number,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
  a = 255
) {
  const xStart = Math.max(0, Math.floor(x0));
  const yStart = Math.max(0, Math.floor(y0));
  const xEnd = Math.min(WIDTH, Math.floor(x0 + w));
  const yEnd = Math.min(HEIGHT, Math.floor(y0 + h));
  const alpha = a / 255;
  const inv = 1 - alpha;
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const idx = (y * WIDTH + x) * 4;
      if (a === 255) {
        rgba[idx] = r;
        rgba[idx + 1] = g;
        rgba[idx + 2] = b;
        rgba[idx + 3] = 255;
      } else {
        rgba[idx] = Math.round(r * alpha + rgba[idx] * inv);
        rgba[idx + 1] = Math.round(g * alpha + rgba[idx + 1] * inv);
        rgba[idx + 2] = Math.round(b * alpha + rgba[idx + 2] * inv);
        rgba[idx + 3] = 255;
      }
    }
  }
}

function drawCenteredText(
  rgba: Uint8Array,
  text: string,
  cy: number,
  scale: number,
  color: [number, number, number]
) {
  const clean = toAsciiUpper(text).slice(0, 36);
  if (!clean) return;
  const charW = 6 * scale;
  const totalW = clean.length * charW - scale;
  let cursorX = Math.round((WIDTH - totalW) / 2);

  for (const ch of clean) {
    const glyph = FONT_5X7[ch] ?? FONT_5X7[' '];
    for (let row = 0; row < 7; row++) {
      const bits = glyph[row];
      for (let col = 0; col < 5; col++) {
        if ((bits >> (4 - col)) & 1) {
          fillRect(
            rgba,
            cursorX + col * scale,
            cy + row * scale,
            scale,
            scale,
            color[0],
            color[1],
            color[2]
          );
        }
      }
    }
    cursorX += charW;
  }
}

const CRC_TABLE = (() => {
  const tbl = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tbl[n] = c >>> 0;
  }
  return tbl;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const tag = Buffer.from(type, 'ascii');
  const body = Buffer.concat([tag, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

export function renderWeddingOgPng(input: {
  couple: string;
  subtitle: string;
}): Buffer {
  const rgba = new Uint8Array(WIDTH * HEIGHT * 4);

  // Diagonal crimson -> rose -> gold gradient backdrop
  for (let y = 0; y < HEIGHT; y++) {
    const vy = y / HEIGHT;
    for (let x = 0; x < WIDTH; x++) {
      const vx = x / WIDTH;
      const t = (vx * 0.6 + vy * 0.4);
      const r = Math.round(136 + (190 - 136) * t);
      const g = Math.round(19 + (28 - 19) * t + vx * 35);
      const b = Math.round(55 + (92 - 55) * (1 - t));
      const idx = (y * WIDTH + x) * 4;
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = 255;
    }
  }

  // Outer gold border
  fillRect(rgba, 28, 28, WIDTH - 56, 10, 253, 230, 138);
  fillRect(rgba, 28, HEIGHT - 38, WIDTH - 56, 10, 253, 230, 138);
  fillRect(rgba, 28, 28, 10, HEIGHT - 56, 253, 230, 138);
  fillRect(rgba, WIDTH - 38, 28, 10, HEIGHT - 56, 253, 230, 138);

  // Translucent ivory inner frame
  fillRect(rgba, 72, 72, WIDTH - 144, HEIGHT - 144, 255, 253, 248, 28);

  // Gold Song Hy geometric emblem at top center
  const ex = WIDTH / 2 - 22;
  fillRect(rgba, ex, 108, 44, 44, 217, 119, 6);
  fillRect(rgba, ex + 4, 112, 36, 36, 185, 28, 28);
  fillRect(rgba, ex + 10, 118, 6, 24, 253, 224, 71);
  fillRect(rgba, ex + 28, 118, 6, 24, 253, 224, 71);
  fillRect(rgba, ex + 8, 128, 28, 5, 253, 224, 71);

  drawCenteredText(rgba, 'THIEP MOI SANH CUOI 3D TRUC TUYEN', 180, 4, [253, 230, 138]);
  drawCenteredText(rgba, input.couple, 260, 10, [255, 255, 255]);
  drawCenteredText(rgba, input.subtitle, 375, 4, [255, 228, 230]);

  // White CTA pill at bottom
  fillRect(rgba, WIDTH / 2 - 310, 458, 620, 68, 255, 253, 248);
  drawCenteredText(rgba, 'VAO SANH CUOI - DAMCUOIONLINE.VN', 480, 3, [159, 18, 57]);

  // Encode PNG with filter byte 0 per scanline
  const rawScanlines = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    const rowStart = y * (WIDTH * 4 + 1);
    rawScanlines[rowStart] = 0;
    rawScanlines.set(rgba.subarray(y * WIDTH * 4, (y + 1) * WIDTH * 4), rowStart + 1);
  }
  const compressed = zlib.deflateSync(rawScanlines, { level: 6 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}
