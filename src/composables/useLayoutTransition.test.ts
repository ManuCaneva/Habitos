import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, watch } from 'vue'
import { useLayoutTransition, LAYOUT_TRANSITION_FALLBACK_MS } from './useLayoutTransition'

describe('useLayoutTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('expone transitioning=false antes de start', () => {
    const { transitioning } = useLayoutTransition()
    expect(transitioning.value).toBe(false)
  })

  it('start() activa el flag inmediatamente', () => {
    const { transitioning, start } = useLayoutTransition()
    start()
    expect(transitioning.value).toBe(true)
  })

  it('end() desactiva el flag y dispara los callbacks de suscriptores', async () => {
    const { transitioning, start, end, onEnd } = useLayoutTransition()
    const callback = vi.fn()

    start()
    const un = onEnd(callback)
    expect(callback).not.toHaveBeenCalled()
    end()
    await nextTick()

    expect(transitioning.value).toBe(false)
    expect(callback).toHaveBeenCalledTimes(1)
    un()
  })

  it('end() sin start() activo no dispara callbacks', () => {
    const { end, onEnd } = useLayoutTransition()
    const callback = vi.fn()
    onEnd(callback)

    end()
    expect(callback).not.toHaveBeenCalled()
  })

  it('re-start() antes de end() reinicia el fallback y dispara los suscriptores una sola vez al final', async () => {
    const { transitioning, start, end, onEnd } = useLayoutTransition()
    const callback = vi.fn()
    onEnd(callback)

    start()
    start()
    end()
    await nextTick()

    expect(transitioning.value).toBe(false)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('re-start() reinicia la ventana de fallback completa', async () => {
    const { transitioning, start, onEnd } = useLayoutTransition()
    const callback = vi.fn()
    onEnd(callback)

    start()
    vi.advanceTimersByTime(LAYOUT_TRANSITION_FALLBACK_MS - 1)
    start()
    vi.advanceTimersByTime(LAYOUT_TRANSITION_FALLBACK_MS - 1)
    expect(transitioning.value).toBe(true)
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await nextTick()

    expect(transitioning.value).toBe(false)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('auto-termina por fallback tras LAYOUT_TRANSITION_FALLBACK_MS si nadie llama end()', async () => {
    const { transitioning, start, onEnd } = useLayoutTransition()
    const callback = vi.fn()
    onEnd(callback)

    start()
    vi.advanceTimersByTime(LAYOUT_TRANSITION_FALLBACK_MS - 1)
    expect(transitioning.value).toBe(true)
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await nextTick()

    expect(transitioning.value).toBe(false)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('end() cancela el fallback pendiente', () => {
    const { transitioning, start, end, onEnd } = useLayoutTransition()
    const callback = vi.fn()
    onEnd(callback)

    start()
    end()
    vi.advanceTimersByTime(LAYOUT_TRANSITION_FALLBACK_MS * 2)

    expect(transitioning.value).toBe(false)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('unsubscribe evita callbacks posteriores', () => {
    const { start, end, onEnd } = useLayoutTransition()
    const callback = vi.fn()
    const un = onEnd(callback)
    un()

    start()
    end()
    expect(callback).not.toHaveBeenCalled()
  })

  it('es re-entrante: end() limpia el estado y un nuevo start() arranca limpio', async () => {
    const { transitioning, start, end, onEnd } = useLayoutTransition()
    const first = vi.fn()
    const second = vi.fn()
    onEnd(first)

    start()
    end()
    await nextTick()
    expect(first).toHaveBeenCalledTimes(1)
    expect(transitioning.value).toBe(false)

    onEnd(second)
    start()
    expect(transitioning.value).toBe(true)
    end()
    await nextTick()
    expect(second).toHaveBeenCalledTimes(1)
    expect(first).toHaveBeenCalledTimes(1)
  })

  it('transitioning es reactivo: consume el flag diferido dentro de un watcher', async () => {
    const { transitioning, start, end } = useLayoutTransition()
    const seen: boolean[] = []

    watch(transitioning, (active) => {
      seen.push(active)
    })

    start()
    await nextTick()
    end()
    await nextTick()

    expect(seen).toEqual([true, false])
  })
})
