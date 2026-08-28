import { beforeEach, describe, expect, it, vi } from 'vitest'
import { migrateStorageKey } from './storageKey'

describe('migrateStorageKey', () => {
  const values = new Map<string, string>()

  beforeEach(() => {
    values.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      clear: () => values.clear(),
    })
  })

  it('copia una clave legada cuando la nueva no existe', () => {
    localStorage.setItem('habitos.theme', JSON.stringify('popi'))

    migrateStorageKey('habitos.theme', 'aeon.theme')

    expect(localStorage.getItem('aeon.theme')).toBe(JSON.stringify('popi'))
  })

  it('conserva la clave nueva si ya tiene un valor', () => {
    localStorage.setItem('habitos.theme', JSON.stringify('dark'))
    localStorage.setItem('aeon.theme', JSON.stringify('light'))

    migrateStorageKey('habitos.theme', 'aeon.theme')

    expect(localStorage.getItem('aeon.theme')).toBe(JSON.stringify('light'))
  })
})
