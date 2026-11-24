/**
 * Client-side standee cutout utility for 3D Walkthrough invitations:
 * - If uploaded photo already has transparent edges (PNG/WebP), keeps alpha & adds warm cream die-cut contour.
 * - If uploaded photo has a uniform studio/solid background, keys exterior corners cleanly in perceptual RGB distance.
 * - If uploaded photo has a busy real-world background, frames it neatly as an arched die-cut couple standee card
 *   with a cream contour so it never leaves jagged cutout artifacts.
 */

const MAX_DIM = 900;

function decodeFile(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

export async function createStandeeCutoutBlob(file: File): Promise<Blob> {
  const bmp = await decodeFile(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
  const w = Math.max(120, Math.round(bmp.width * scale));
  const h = Math.max(160, Math.round(bmp.height * scale));

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = w;
  srcCanvas.height = h;
  const sctx = srcCanvas.getContext('2d')!;
  sctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();

  const img = sctx.getImageData(0, 0, w, h);
  const data = img.data;

  // 1. Check if image already carries real transparency around its borders
  let transparentCorners = 0;
  for (const [cx, cy] of [
    [2, 2],
    [w - 3, 2],
    [2, h - 3],
    [w - 3, h - 3],
  ]) {
    if (data[(cy * w + cx) * 4 + 3] < 32) transparentCorners++;
  }

  let hasCleanAlpha = transparentCorners >= 3;

  if (!hasCleanAlpha) {
    // 2. Test whether top-left & top-right corners share a uniform studio backdrop
    const sample = (x: number, y: number) => {
      const i = (y * w + x) * 4;
      return [data[i], data[i + 1], data[i + 2]];
    };
    const c0 = sample(4, 4);
    const c1 = sample(w - 5, 4);
    const c2 = sample(4, Math.floor(h * 0.25));
    const c3 = sample(w - 5, Math.floor(h * 0.25));
    const dist = (a: number[], b: number[]) =>
      Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

    const cornerSpread = Math.max(dist(c0, c1), dist(c0, c2), dist(c1, c3));
    if (cornerSpread < 42) {
      // Uniform background: exterior flood-fill matte
      const bg = [
        (c0[0] + c1[0] + c2[0] + c3[0]) / 4,
        (c0[1] + c1[1] + c2[1] + c3[1]) / 4,
        (c0[2] + c1[2] + c2[2] + c3[2]) / 4,
      ];
      const visited = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0;
      let tail = 0;
      const push = (idx: number) => {
        if (visited[idx]) return;
        const p = idx * 4;
        const d = Math.hypot(data[p] - bg[0], data[p + 1] - bg[1], data[p + 2] - bg[2]);
        if (d < 46) {
          visited[idx] = 1;
          queue[tail++] = idx;
        }
      };
      for (let x = 0; x < w; x++) {
        push(x);
        push((h - 1) * w + x);
      }
      for (let y = 0; y < h; y++) {
        push(y * w);
        push(y * w + (w - 1));
      }
      while (head < tail) {
        const idx = queue[head++];
        const x = idx % w;
        const y = (idx / w) | 0;
        if (x > 0) push(idx - 1);
        if (x < w - 1) push(idx + 1);
        if (y > 0) push(idx - w);
        if (y < h - 1) push(idx + w);
      }
      if (tail > w * h * 0.12 && tail < w * h * 0.88) {
        for (let i = 0; i < w * h; i++) {
          if (visited[i]) data[i * 4 + 3] = 0;
        }
        sctx.putImageData(img, 0, 0);
        hasCleanAlpha = true;
      }
    }
  }

  // Output stage with clean cream die-cut standee contour
  const pad = 16;
  const out = document.createElement('canvas');
  out.width = w + pad * 2;
  out.height = h + pad * 2;
  const ctx = out.getContext('2d')!;

  if (hasCleanAlpha) {
    // Draw cream border halo by offsetting 8 directions
    const rim = document.createElement('canvas');
    rim.width = out.width;
    rim.height = out.height;
    const rctx = rim.getContext('2d')!;
    rctx.fillStyle = '#fffdf6';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      rctx.drawImage(srcCanvas, pad + Math.cos(a) * 5, pad + Math.sin(a) * 5);
    }
    rctx.globalCompositeOperation = 'source-in';
    rctx.fillRect(0, 0, rim.width, rim.height);
    ctx.shadowColor = 'rgba(20, 12, 18, 0.35)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    ctx.drawImage(rim, 0, 0);
    ctx.shadowColor = 'transparent';
    ctx.drawImage(srcCanvas, pad, pad);
  } else {
    // Complex background photo: arched die-cut cream standee silhouette
    const cw = Math.min(w, Math.round(h * 0.72));
    const ch = h;
    out.width = cw + pad * 2;
    out.height = ch + pad * 2;
    ctx.save();
    const r = cw / 2;
    const drawArch = (inset: number) => {
      const x0 = pad - inset;
      const y0 = pad - inset;
      const aw = cw + inset * 2;
      const ah = ch + inset * 2;
      const ar = r + inset;
      ctx.beginPath();
      ctx.arc(x0 + aw / 2, y0 + ar, ar, Math.PI, 0, false);
      ctx.lineTo(x0 + aw, y0 + ah - 18);
      ctx.quadraticCurveTo(x0 + aw, y0 + ah, x0 + aw - 18, y0 + ah);
      ctx.lineTo(x0 + 18, y0 + ah);
      ctx.quadraticCurveTo(x0, y0 + ah, x0, y0 + ah - 18);
      ctx.closePath();
    };
    ctx.shadowColor = 'rgba(20, 12, 18, 0.38)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    drawArch(5);
    ctx.fillStyle = '#fffdf6';
    ctx.fill();
    ctx.restore();

    ctx.save();
    drawArch(0);
    ctx.clip();
    const sx = Math.max(0, Math.round((w - cw) / 2));
    ctx.drawImage(srcCanvas, sx, 0, cw, h, pad, pad, cw, ch);
    ctx.restore();
  }

  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/webp', 0.88));
  if (blob) return blob;
  return file;
}
