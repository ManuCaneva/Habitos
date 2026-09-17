import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from './notes'
import * as db from '@/lib/db'

vi.mock('@/lib/db', () => ({
  listNotes: vi.fn().mockResolvedValue([]),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn().mockResolvedValue(undefined),
}))

function makeNoteRow(overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString()
  return {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Lo que dijo el profesor',
    description: 'Repasar capítulo 3',
    color: '#6e56cf',
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

describe('notes store - createNote', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('genera id y timestamps en el store, llama db.createNote y la agrega primero', async () => {
    const store = useNotesStore()
    const draft = { title: 'Nueva nota', description: null, color: '#6e56cf' }
    vi.mocked(db.createNote).mockResolvedValue(
      makeNoteRow({ title: 'Nueva nota', description: null })
    )

    const note = await store.createNote(draft)

    expect(db.createNote).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(db.createNote).mock.calls[0]
    expect(callArgs[0]).toEqual(draft)
    expect(typeof callArgs[1]).toBe('string')
    expect(typeof callArgs[2]).toBe('string')
    expect(typeof callArgs[3]).toBe('string')

    expect(store.notes).toHaveLength(1)
    expect(store.notes[0].id).toBe(note.id)
    expect(store.notes[0].title).toBe('Nueva nota')
  })

  it('la nota creada queda primera (orden: última creada primero)', async () => {
    const store = useNotesStore()
    vi.mocked(db.createNote).mockResolvedValueOnce(
      makeNoteRow({ id: '22222222-2222-4222-8222-222222222221', title: 'Primera' })
    )
    vi.mocked(db.createNote).mockResolvedValueOnce(
      makeNoteRow({ id: '22222222-2222-4222-8222-222222222222', title: 'Segunda' })
    )

    await store.createNote({ title: 'Primera', description: null, color: '#6e56cf' })
    await store.createNote({ title: 'Segunda', description: null, color: '#6e56cf' })

    expect(store.notes.map((n) => n.title)).toEqual(['Segunda', 'Primera'])
  })

  it('rechaza draft sin título ni descripción sin invocar db', async () => {
    const store = useNotesStore()
    await expect(
      store.createNote({ title: null, description: null, color: '#6e56cf' })
    ).rejects.toThrow()
    expect(db.createNote).not.toHaveBeenCalled()
  })
})

describe('notes store - updateNote', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(db.listNotes).mockResolvedValue([
      makeNoteRow({
        id: '22222222-2222-4222-8222-222222222221',
        title: 'Vieja',
        description: 'Desc vieja',
      }),
    ])
  })

  it('hace merge del patch, bumpa updated_at y NO reordena', async () => {
    const store = useNotesStore()
    await store.loadNotes()
    expect(store.notes.map((n) => n.title)).toEqual(['Vieja'])

    vi.mocked(db.updateNote).mockResolvedValue(
      makeNoteRow({
        id: '22222222-2222-4222-8222-222222222221',
        title: 'Nueva',
        description: 'Desc vieja',
      })
    )

    const updated = await store.updateNote('22222222-2222-4222-8222-222222222221', {
      title: 'Nueva',
    })

    expect(db.updateNote).toHaveBeenCalledWith(
      '22222222-2222-4222-8222-222222222221',
      { title: 'Nueva' },
      expect.any(String)
    )
    expect(updated.title).toBe('Nueva')
    expect(store.notes).toHaveLength(1)
    expect(store.notes[0].id).toBe('22222222-2222-4222-8222-222222222221')
    expect(store.notes.map((n) => n.title)).toEqual(['Nueva'])
  })

  it('limpiar título (null) deja nota solo con descripción', async () => {
    const store = useNotesStore()
    await store.loadNotes()
    vi.mocked(db.updateNote).mockResolvedValue(
      makeNoteRow({
        id: '22222222-2222-4222-8222-222222222221',
        title: null,
        description: 'Desc vieja',
      })
    )

    await store.updateNote('22222222-2222-4222-8222-222222222221', { title: null })

    expect(store.notes[0].title).toBeNull()
    expect(store.notes[0].description).toBe('Desc vieja')
  })

  it('patch que dejaría la nota vacía rechaza sin invocar db', async () => {
    const store = useNotesStore()
    await store.loadNotes()
    vi.mocked(db.updateNote).mockResolvedValue(
      makeNoteRow({ id: '22222222-2222-4222-8222-222222222221', title: null, description: null })
    )

    await expect(
      store.updateNote('22222222-2222-4222-8222-222222222221', { title: null, description: null })
    ).rejects.toThrow()
    expect(db.updateNote).not.toHaveBeenCalled()
  })
})

describe('notes store - deleteNote', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(db.listNotes).mockResolvedValue([
      makeNoteRow({ id: '22222222-2222-4222-8222-222222222221' }),
      makeNoteRow({ id: '22222222-2222-4222-8222-222222222222' }),
    ])
  })

  it('elimina del estado después de borrar en db', async () => {
    const store = useNotesStore()
    await store.loadNotes()
    expect(store.notes).toHaveLength(2)

    await store.deleteNote('22222222-2222-4222-8222-222222222221')

    expect(db.deleteNote).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222221')
    expect(store.notes.map((n) => n.id)).toEqual(['22222222-2222-4222-8222-222222222222'])
  })
})

describe('notes store - loadNotes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('carga y mapea las notas desde rows', async () => {
    const store = useNotesStore()
    vi.mocked(db.listNotes).mockResolvedValue([
      makeNoteRow({ id: '22222222-2222-4222-8222-222222222221' }),
      makeNoteRow({ id: '22222222-2222-4222-8222-222222222222' }),
    ])

    await store.loadNotes()

    expect(db.listNotes).toHaveBeenCalledTimes(1)
    expect(store.notes).toHaveLength(2)
    expect(store.loading).toBe(false)
  })

  it('ante error de db setea lastError sin romper', async () => {
    const store = useNotesStore()
    vi.mocked(db.listNotes).mockRejectedValue(new Error('boom'))

    await store.loadNotes()

    expect(store.lastError).toBe('boom')
    expect(store.notes).toHaveLength(0)
  })
})
