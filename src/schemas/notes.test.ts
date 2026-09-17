import { describe, expect, it } from 'vitest'
import {
  NoteSchema,
  CreateNoteDraftSchema,
  UpdateNoteDraftSchema,
  NoteRowSchema,
  rowToNote,
  noteToRow,
} from './notes'

const validUuid = '550e8400-e29b-41d4-a716-446655440000'
const validIso = '2026-06-27T10:00:00.000Z'

describe('NoteSchema', () => {
  const validNote = {
    id: validUuid,
    title: 'Lo que dijo el profesor',
    description: 'Repasar capítulo 3 antes del parcial',
    color: '#6e56cf',
    created_at: validIso,
    updated_at: validIso,
  }

  it('acepta una nota válida con título y descripción', () => {
    expect(NoteSchema.parse(validNote)).toEqual(validNote)
  })

  it('acepta nota solo con título (description null)', () => {
    const note = { ...validNote, description: null }
    expect(NoteSchema.parse(note)).toEqual(note)
  })

  it('acepta nota solo con descripción (title null)', () => {
    const note = { ...validNote, title: null }
    expect(NoteSchema.parse(note)).toEqual(note)
  })

  it('rechaza nota sin título ni descripción (ambos null)', () => {
    expect(() => NoteSchema.parse({ ...validNote, title: null, description: null })).toThrow()
  })

  it('rechaza título vacío', () => {
    expect(() => NoteSchema.parse({ ...validNote, title: '' })).toThrow()
  })

  it('rechaza título solo espacios', () => {
    expect(() => NoteSchema.parse({ ...validNote, title: '   ' })).toThrow()
  })

  it('recorta espacios del título', () => {
    const parsed = NoteSchema.parse({ ...validNote, title: '  hola  ' })
    expect(parsed.title).toBe('hola')
  })

  it('rechaza título mayor a 100 chars', () => {
    expect(() => NoteSchema.parse({ ...validNote, title: 'x'.repeat(101) })).toThrow()
  })

  it('acepta título de 100 chars', () => {
    const parsed = NoteSchema.parse({ ...validNote, title: 'x'.repeat(100) })
    expect(parsed.title).toBe('x'.repeat(100))
  })

  it('recorta espacios de la descripción', () => {
    const parsed = NoteSchema.parse({ ...validNote, description: '  contenido  ' })
    expect(parsed.description).toBe('contenido')
  })

  it('rechaza descripción mayor a 5000 chars', () => {
    expect(() => NoteSchema.parse({ ...validNote, description: 'x'.repeat(5001) })).toThrow()
  })

  it('acepta descripción de 5000 chars', () => {
    const parsed = NoteSchema.parse({ ...validNote, description: 'x'.repeat(5000) })
    expect(parsed.description).toBe('x'.repeat(5000))
  })

  it('rechaza color mal formato', () => {
    expect(() => NoteSchema.parse({ ...validNote, color: 'red' })).toThrow()
    expect(() => NoteSchema.parse({ ...validNote, color: '#fff' })).toThrow()
  })

  it('rechaza id inválido', () => {
    expect(() => NoteSchema.parse({ ...validNote, id: 'not-uuid' })).toThrow()
  })
})

describe('CreateNoteDraftSchema', () => {
  it('acepta draft con título y descripción', () => {
    const draft = { title: 'Título', description: 'Desc', color: '#aabbcc' }
    expect(CreateNoteDraftSchema.parse(draft)).toEqual(draft)
  })

  it('acepta draft solo con título (description ausente → null)', () => {
    const parsed = CreateNoteDraftSchema.parse({ title: 'Solo título', color: '#aabbcc' })
    expect(parsed.title).toBe('Solo título')
    expect(parsed.description).toBeNull()
  })

  it('acepta draft solo con descripción (title ausente → null)', () => {
    const parsed = CreateNoteDraftSchema.parse({ description: 'Solo desc', color: '#aabbcc' })
    expect(parsed.title).toBeNull()
    expect(parsed.description).toBe('Solo desc')
  })

  it('convierte título vacío a null (nota solo descripción)', () => {
    const parsed = CreateNoteDraftSchema.parse({
      title: '',
      description: 'Desc',
      color: '#aabbcc',
    })
    expect(parsed.title).toBeNull()
    expect(parsed.description).toBe('Desc')
  })

  it('convierte descripción vacía a null (nota solo título)', () => {
    const parsed = CreateNoteDraftSchema.parse({
      title: 'Título',
      description: '',
      color: '#aabbcc',
    })
    expect(parsed.title).toBe('Título')
    expect(parsed.description).toBeNull()
  })

  it('rechaza draft sin contenido (solo color)', () => {
    expect(() => CreateNoteDraftSchema.parse({ color: '#aabbcc' })).toThrow()
  })

  it('rechaza draft con título y descripción vacíos', () => {
    expect(() =>
      CreateNoteDraftSchema.parse({ title: '', description: '', color: '#aabbcc' })
    ).toThrow()
  })

  it('rechaza sin color', () => {
    expect(() => CreateNoteDraftSchema.parse({ title: 'Título' })).toThrow()
  })

  it('no debe llevar id ni timestamps', () => {
    const parsed = CreateNoteDraftSchema.parse({ title: 'Título', color: '#aabbcc' })
    expect(parsed).not.toHaveProperty('id')
    expect(parsed).not.toHaveProperty('created_at')
    expect(parsed).not.toHaveProperty('updated_at')
  })
})

describe('UpdateNoteDraftSchema', () => {
  it('acepta patch vacío', () => {
    expect(UpdateNoteDraftSchema.parse({})).toEqual({})
  })

  it('acepta patch de título', () => {
    expect(UpdateNoteDraftSchema.parse({ title: 'Nuevo' })).toMatchObject({ title: 'Nuevo' })
  })

  it('acepta limpiar título (null)', () => {
    expect(UpdateNoteDraftSchema.parse({ title: null })).toMatchObject({ title: null })
  })

  it('acepta limpiar descripción (null)', () => {
    expect(UpdateNoteDraftSchema.parse({ description: null })).toMatchObject({ description: null })
  })

  it('convierte título vacío a null en patch', () => {
    expect(UpdateNoteDraftSchema.parse({ title: '' })).toMatchObject({ title: null })
  })

  it('acepta patch de color', () => {
    expect(UpdateNoteDraftSchema.parse({ color: '#112233' })).toMatchObject({ color: '#112233' })
  })
})

describe('NoteRowSchema', () => {
  it('acepta row permissive (timestamps crudos, nulls)', () => {
    const row = {
      id: validUuid,
      title: '  con espacios  ',
      description: null,
      color: '#6e56cf',
      created_at: '2026-06-27 10:00:00',
      updated_at: '2026-06-27 10:00:00',
    }
    const parsed = NoteRowSchema.parse(row)
    expect(parsed.title).toBe('  con espacios  ')
    expect(parsed.description).toBeNull()
  })
})

describe('rowToNote', () => {
  const row = {
    id: validUuid,
    title: 'Título',
    description: 'Desc',
    color: '#6e56cf',
    created_at: '2026-06-27 10:00:00',
    updated_at: '2026-06-27 10:00:00',
  }

  it('mapea row a Note y normaliza timestamps', () => {
    const note = rowToNote(row)
    expect(note.title).toBe('Título')
    expect(note.description).toBe('Desc')
    expect(note.created_at).toBe('2026-06-27T10:00:00Z')
    expect(note.updated_at).toBe('2026-06-27T10:00:00Z')
  })

  it('preserva title null', () => {
    expect(rowToNote({ ...row, title: null }).title).toBeNull()
  })

  it('preserva description null', () => {
    expect(rowToNote({ ...row, description: null }).description).toBeNull()
  })
})

describe('noteToRow', () => {
  it('serializa draft de creación completo', () => {
    const draft = { title: 'Título', description: 'Desc', color: '#aabbcc' }
    expect(noteToRow(draft)).toEqual({ title: 'Título', description: 'Desc', color: '#aabbcc' })
  })

  it('title ausente → null para creación', () => {
    const draft = CreateNoteDraftSchema.parse({ description: 'Solo desc', color: '#aabbcc' })
    expect(noteToRow(draft)).toEqual({ title: null, description: 'Solo desc', color: '#aabbcc' })
  })

  it('description ausente → null para creación', () => {
    const draft = CreateNoteDraftSchema.parse({ title: 'Título', color: '#aabbcc' })
    expect(noteToRow(draft)).toEqual({ title: 'Título', description: null, color: '#aabbcc' })
  })

  it('null explícito se preserva', () => {
    const draft = { title: null, description: null, color: '#aabbcc' }
    expect(noteToRow(draft)).toEqual({ title: null, description: null, color: '#aabbcc' })
  })
})
