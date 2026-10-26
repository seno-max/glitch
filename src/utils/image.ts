const MAX_DIMENSION = 1280
const JPEG_QUALITY = 0.82

/**
 * Downscales + re-encodes an image File in the browser before upload, so a
 * 12-megapixel phone camera photo doesn't hit Supabase Storage as a raw
 * multi-MB blob. Longest edge is capped at 1280px and the result is encoded
 * as JPEG (quality 0.82), which typically lands in the 100-300KB range. If
 * anything goes wrong (unsupported format, canvas failure) the original
 * file is returned unchanged so the upload still succeeds.
 */
export async function compressImage(file: File, maxDimension = MAX_DIMENSION, quality = JPEG_QUALITY): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    if (scale >= 1 && file.size < 500_000) {
      bitmap.close()
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file

    // Reuse the original name but with a .jpg extension to match the encoder.
    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}
