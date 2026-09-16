import { describe, it, expect } from 'vitest'
import { hasHardcodedColor } from './colorGuard'

const MIN_SCANNED_SOURCES = 50

const sources: Record<string, string> = {
  ...import.meta.glob('../components/**/*.vue', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  ...import.meta.glob('../views/**/*.vue', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('../App.vue', { query: '?raw', import: 'default', eager: true }),
}

describe('certificación de paleta', () => {
  it('encuentra componentes y vistas para escanear', () => {
    expect(Object.keys(sources).length).toBeGreaterThanOrEqual(MIN_SCANNED_SOURCES)
  })

  it.each(Object.keys(sources))('%s no hardcodea colores fuera de los tokens', (path) => {
    const offenders = sources[path]
      .split('\n')
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line }) => hasHardcodedColor(line))
      .map(({ line, number }) => `${number}: ${line.trim()}`)

    expect(offenders, `${path}\n${offenders.join('\n')}`).toEqual([])
  })
})
