export const MAX_WALLPAPER_BYTES = 4 * 1024 * 1024

export const MAX_WALLPAPER_MB = Math.round(MAX_WALLPAPER_BYTES / (1024 * 1024))

export type FileValidation = { ok: true } | { ok: false; reason: 'type' | 'size' }

export function validateImageFile(file: File): FileValidation {
  if (!file.type.startsWith('image/')) {
    return { ok: false, reason: 'type' }
  }
  if (file.size > MAX_WALLPAPER_BYTES) {
    return { ok: false, reason: 'size' }
  }
  return { ok: true }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}
