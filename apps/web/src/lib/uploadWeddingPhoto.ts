import type { PhotoAssetRecord } from '@dco/database';

/** Longest side after resizing; plenty for a phone screen, a few hundred KB as JPEG */
const MAX_SIDE = 2000;

/**
 * Phone photos are often 3–8 MB (the server takes up to 5 MB), sometimes HEIC. Redraw them on a
 * canvas as a JPEG of at most 2000 px, which every browser can show. Falls back to the original
 * file if the browser cannot decode it.
 */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.86));
    return blob ?? file;
  } catch {
    return file;
  }
}

const ERRORS: Record<string, string> = {
  FILE_TOO_LARGE_MAX_5MB: 'Ảnh lớn quá 5 MB.',
  INVALID_UPLOAD_REQUEST: 'Chỉ nhận ảnh JPG, PNG hoặc WebP.',
  PHOTO_QUOTA_EXCEEDED: 'Album đã đủ số ảnh tối đa. Xoá bớt ảnh để thêm ảnh mới.',
  HOST_ONLY: 'Chỉ cô dâu, chú rể hoặc chủ tiệc mới thêm ảnh được.',
  OAUTH_REQUIRED: 'Phiên đăng nhập đã hết, bạn đăng nhập lại nhé.',
};

/** Uploads one wedding photo into the couple's album; throws a Vietnamese message on failure */
export async function uploadWeddingPhoto(slug: string, file: File): Promise<PhotoAssetRecord> {
  const body = await shrink(file);
  const contentType = body.type === 'image/png' || body.type === 'image/webp' ? body.type : 'image/jpeg';
  const presignRes = await fetch('/api/r2/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, folder: 'gallery', contentType, byteSize: body.size }),
  });
  const presign = await presignRes.json().catch(() => ({}));
  if (!presignRes.ok) throw new Error(ERRORS[presign.error] ?? 'Chưa tải được ảnh, bạn thử lại nhé.');

  const put = await fetch(presign.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body });
  if (!put.ok) throw new Error('Chưa tải được ảnh lên kho lưu trữ, bạn thử lại nhé.');

  const saveRes = await fetch(`/api/weddings/${encodeURIComponent(slug)}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'PRE_WEDDING_GALLERY', r2ObjectKey: presign.objectKey, publicUrl: presign.publicUrl, caption: file.name.replace(/\.[a-z0-9]+$/i, '') }),
  });
  const saved = await saveRes.json().catch(() => ({}));
  if (!saveRes.ok || !saved.photo) throw new Error(ERRORS[saved.error] ?? 'Chưa lưu được ảnh, bạn thử lại nhé.');
  return saved.photo as PhotoAssetRecord;
}

export async function deleteWeddingPhoto(slug: string, photoId: string): Promise<void> {
  const res = await fetch(`/api/weddings/${encodeURIComponent(slug)}/photos/${encodeURIComponent(photoId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Chưa xoá được ảnh, bạn thử lại nhé.');
}
