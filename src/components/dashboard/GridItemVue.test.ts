import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import GridItemVue from './GridItemVue.vue'
import type { LayoutItem } from '@/stores/dashboard'

let dragCallbacks: Record<string, (...args: number[]) => void> = {}

vi.mock('@/composables/useDashDrag', () => ({
  useDashDrag: (
    _elRef: { value: HTMLElement | null },
    _editMode: unknown,
    callbacks: {
      onDragStart: () => void
      onDragMove: (dx: number, dy: number) => void
      onDragEnd: () => void
      onResizeStart: () => void
      onResizeMove: (dw: number, dh: number) => void
      onResizeEnd: () => void
    }
  ) => {
    dragCallbacks = callbacks as never
    return vi.fn()
  },
}))

const mockFlipTransform = vi.fn((..._args: unknown[]) => 'translate(50px, 30px) scale(1, 1)')
const mockFlipNeedsAnimation = vi.fn((..._args: unknown[]) => true)

vi.mock('@/composables/flip', () => ({
  flipTransform: (...args: unknown[]) => mockFlipTransform(...args),
  flipNeedsAnimation: (...args: unknown[]) => mockFlipNeedsAnimation(...args),
  FLIP_DURATION_MS: 180,
  FLIP_EASING: 'cubic-bezier(0.16, 1, 0.3, 1)',
}))

function makeItem(overrides: Partial<LayoutItem> = {}): LayoutItem {
  return { i: 'habits', x: 0, y: 0, w: 6, h: 4, minW: 1, minH: 1, ...overrides }
}

describe('GridItemVue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dragCallbacks = {}
  })
  it('renderiza con grid-column/grid-row derivados de x/y/w/h', () => {
    const wrapper = mount(GridItemVue, {
      props: { item: makeItem({ x: 2, y: 3, w: 6, h: 4 }), editMode: false },
    })
    const el = wrapper.element as HTMLElement
    const style = el.getAttribute('style') ?? ''
    expect(style).toContain('grid-column: 3 / span 6')
    expect(style).toContain('grid-row: 4 / span 4')
  })

  it('no aplica position: absolute en reposo (lo posiciona la grilla)', () => {
    const wrapper = mount(GridItemVue, {
      props: { item: makeItem(), editMode: false },
    })
    const style = wrapper.element.getAttribute('style') ?? ''
    expect(style).not.toContain('position: absolute')
  })

  it('emite moved en enteros tras un drag con snap', async () => {
    const wrapper = mount(GridItemVue, {
      props: { item: makeItem({ x: 0, y: 0, w: 6, h: 4 }), editMode: true },
    })
    const el = wrapper.element as HTMLElement
    Object.defineProperty(el, 'clientWidth', { value: 600, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 400, configurable: true })
    const container = el.parentElement as HTMLElement
    Object.defineProperty(container, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true })

    dragCallbacks.onDragStart?.()
    dragCallbacks.onDragMove?.(50, 30)
    dragCallbacks.onDragEnd?.()
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('moved') as unknown[][]
    expect(emitted).toHaveLength(1)
    // 50px / 100px-per-col = 0.5 → 1 celda; 30px / 60px-per-row = 0.5 → 1 celda
    expect(emitted[0]).toEqual(['habits', 1, 1])
  })

  it('emite resized en enteros tras un resize con snap', async () => {
    const wrapper = mount(GridItemVue, {
      props: { item: makeItem({ x: 0, y: 0, w: 6, h: 4 }), editMode: true },
    })
    const el = wrapper.element as HTMLElement
    Object.defineProperty(el, 'clientWidth', { value: 600, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 400, configurable: true })
    const container = el.parentElement as HTMLElement
    Object.defineProperty(container, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true })

    dragCallbacks.onResizeStart?.()
    dragCallbacks.onResizeMove?.(150, 60)
    dragCallbacks.onResizeEnd?.()
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('resized') as unknown[][]
    expect(emitted).toHaveLength(1)
    expect(emitted[0]).toEqual(['habits', 8, 5])
  })

  it('agrega clase grid-item--dragging durante el gesto', async () => {
    const wrapper = mount(GridItemVue, {
      props: { item: makeItem(), editMode: true },
    })
    dragCallbacks.onDragStart?.()
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).toContain('grid-item--dragging')
    dragCallbacks.onDragEnd?.()
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).not.toContain('grid-item--dragging')
  })

  it('escribe transform translate durante el drag (no left/top)', async () => {
    const wrapper = mount(GridItemVue, {
      props: { item: makeItem(), editMode: true },
    })
    const el = wrapper.element as HTMLElement
    dragCallbacks.onDragStart?.()
    dragCallbacks.onDragMove?.(25, 10)
    expect(el.style.transform).toContain('translate')
    expect(el.style.left).toBe('')
    dragCallbacks.onDragEnd?.()
  })

  it('el preview de resize permanece anclado: no altera position/left/top (solo width/height)', async () => {
    const wrapper = mount(GridItemVue, {
      props: { item: makeItem({ x: 6, y: 7, w: 4, h: 3 }), editMode: true },
    })
    const el = wrapper.element as HTMLElement
    const container = el.parentElement as HTMLElement
    Object.defineProperty(container, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 800, configurable: true })
    Object.defineProperty(el, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        left: 600,
        top: 560,
        width: 400,
        height: 240,
        right: 1000,
        bottom: 800,
        x: 600,
        y: 560,
        toJSON() {
          return {}
        },
      }),
    })
    dragCallbacks.onResizeStart?.()
    // Anclaje: no debe desplazarse (sin position/left/top)
    expect(el.style.position).toBe('')
    expect(el.style.left).toBe('')
    expect(el.style.top).toBe('')
    expect(el.style.width).toContain('px')
    expect(el.style.height).toContain('px')
    // Al mover, sigue anclado y solo crece width/height
    dragCallbacks.onResizeMove?.(50, 20)
    expect(el.style.position).toBe('')
    expect(el.style.left).toBe('')
    expect(el.style.top).toBe('')
    expect(el.style.width).toContain('px')
    expect(el.style.height).toContain('px')
    // El ancho refleja el delta acumulado sobre el rect medido (sin salto inicial)
    expect(el.style.width).toBe('450px')
    expect(el.style.height).toBe('260px')
    dragCallbacks.onResizeEnd?.()
    expect(el.style.width).toBe('')
    expect(el.style.height).toBe('')
  })

  it('al soltar un drag aplica FLIP: llama flipTransform/flipNeedsAnimation e inyecta grid-item--flip', async () => {
    const wrapper = mount(GridItemVue, {
      props: { item: makeItem({ x: 0, y: 0, w: 6, h: 4 }), editMode: true },
    })
    const el = wrapper.element as HTMLElement
    Object.defineProperty(el, 'clientWidth', { value: 600, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 400, configurable: true })
    const container = el.parentElement as HTMLElement
    Object.defineProperty(container, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true })
    Object.defineProperty(el, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 100, top: 60, width: 600, height: 240 }),
    })
    Object.defineProperty(el.parentElement!, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 1200, height: 600 }),
    })

    dragCallbacks.onDragStart?.()
    dragCallbacks.onDragMove?.(50, 30)
    dragCallbacks.onDragEnd?.()
    await flushPromises()
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 20))

    expect(mockFlipNeedsAnimation).toHaveBeenCalled()
    expect(mockFlipTransform).toHaveBeenCalled()
    expect(wrapper.classes()).toContain('grid-item--flip')
    expect(wrapper.classes()).not.toContain('grid-item--dragging')
    // Anima solo transform: nunca left/top/width/height.
    expect(el.style.left).toBe('')
    expect(el.style.top).toBe('')
    expect(el.style.width).toBe('')
    expect(el.style.height).toBe('')
  })

  it('al soltar un resize aplica FLIP con escala (transición de transform + clase)', async () => {
    const wrapper = mount(GridItemVue, {
      props: { item: makeItem({ x: 0, y: 0, w: 6, h: 4 }), editMode: true },
    })
    const el = wrapper.element as HTMLElement
    Object.defineProperty(el, 'clientWidth', { value: 600, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 400, configurable: true })
    const container = el.parentElement as HTMLElement
    Object.defineProperty(container, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true })
    Object.defineProperty(el, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 750, height: 300 }),
    })
    Object.defineProperty(el.parentElement!, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 1200, height: 600 }),
    })

    dragCallbacks.onResizeStart?.()
    dragCallbacks.onResizeMove?.(50, 0)
    dragCallbacks.onResizeEnd?.()
    await flushPromises()
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 20))

    expect(mockFlipNeedsAnimation).toHaveBeenCalled()
    expect(mockFlipTransform).toHaveBeenCalled()
    expect(wrapper.classes()).toContain('grid-item--flip')
    expect(el.style.position).toBe('')
  })
})
