import { z } from 'zod'
import { uuid, isoTimestamp, hexColor, trimmed, normalizeTimestamp } from './primitives'

// Capa dominio: título vacío o solo espacios es inválido.
const noteTitle = trimmed(1, 100)
const noteDescription = z.string().trim().max(5000)

// Capa drafts: string vacío (o solo espacios) se normaliza a null
// para soportar "nota solo con título" / "nota solo con descripción".
const draftText = (max: number, min = 1) =>
  z
    .string()
    .nullish()
    .transform((v) => {
      if (v === undefined || v === null) return v
      const t = v.trim()
      return t === '' ? null : t
    })
    .pipe(z.string().min(min).max(max).nullable().optional())

const atLeastOneField = (title: string | null, description: string | null) =>
  Boolean(title ?? description)

export const NoteSchema = z
  .object({
    id: uuid,
    title: noteTitle.nullish(),
    description: noteDescription.nullish(),
    color: hexColor,
    created_at: isoTimestamp,
    updated_at: isoTimestamp,
  })
  .transform((n) => ({
    id: n.id,
    title: n.title ? n.title : null,
    description: n.description ? n.description : null,
    color: n.color,
    created_at: n.created_at,
    updated_at: n.updated_at,
  }))
  .pipe(
    z
      .object({
        id: uuid,
        title: z.string().min(1).max(100).nullable(),
        description: z.string().max(5000).nullable(),
        color: hexColor,
        created_at: isoTimestamp,
        updated_at: isoTimestamp,
      })
      .refine((n) => atLeastOneField(n.title, n.description), {
        message: 'La nota necesita título o descripción',
      })
  )

export type Note = z.infer<typeof NoteSchema>

export const CreateNoteDraftSchema = z
  .object({
    title: draftText(100),
    description: draftText(5000, 0),
    color: hexColor,
  })
  .transform((n) => ({
    title: n.title ?? null,
    description: n.description ?? null,
    color: n.color,
  }))
  .pipe(
    z
      .object({
        title: z.string().min(1).max(100).nullable(),
        description: z.string().max(5000).nullable(),
        color: hexColor,
      })
      .refine((n) => atLeastOneField(n.title, n.description), {
        message: 'La nota necesita título o descripción',
      })
  )

export type CreateNoteDraft = z.infer<typeof CreateNoteDraftSchema>

// Patch de update: undefined = no tocar, null = limpiar, string = nuevo valor.
// Sin refine de contenido: la validez del merge la valida el store.
export const UpdateNoteDraftSchema = z
  .object({
    title: draftText(100),
    description: draftText(5000, 0),
    color: hexColor.optional(),
  })
  .transform((n) => ({
    title: n.title,
    description: n.description,
    color: n.color,
  }))
  .pipe(
    z.object({
      title: z.string().min(1).max(100).nullable().optional(),
      description: z.string().max(5000).nullable().optional(),
      color: hexColor.optional(),
    })
  )

export type UpdateNoteDraft = z.infer<typeof UpdateNoteDraftSchema>

export const NoteRowSchema = z.object({
  id: uuid,
  title: z.string().nullable(),
  description: z.string().nullable(),
  color: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type NoteRow = z.infer<typeof NoteRowSchema>

export function rowToNote(row: NoteRow): Note {
  return NoteSchema.parse({
    id: row.id,
    title: row.title,
    description: row.description,
    color: row.color,
    created_at: normalizeTimestamp(row.created_at),
    updated_at: normalizeTimestamp(row.updated_at),
  })
}

export function noteToRow(draft: CreateNoteDraft): {
  title: string | null
  description: string | null
  color: string
} {
  return {
    title: draft.title,
    description: draft.description,
    color: draft.color,
  }
}
