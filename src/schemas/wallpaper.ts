import { z } from 'zod'

const imageDataUrl = z
  .string()
  .regex(
    /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/,
    'debe ser una data URL de imagen base64'
  )

export const WallpaperSettingsSchema = z.object({
  dataUrl: imageDataUrl.nullable().default(null),
})
export type WallpaperSettings = z.infer<typeof WallpaperSettingsSchema>

export const defaultWallpaperSettings: WallpaperSettings = WallpaperSettingsSchema.parse({})

export function parseWallpaperSettingsJson(raw: string | null | undefined): WallpaperSettings {
  if (!raw) return defaultWallpaperSettings
  try {
    const parsed = WallpaperSettingsSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return defaultWallpaperSettings
    return { dataUrl: parsed.data.dataUrl }
  } catch {
    return defaultWallpaperSettings
  }
}
