import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import { mount } from '@vue/test-utils'
import Sidebar from './Sidebar.vue'

const setViewMode = vi.fn()
const toggleEditMode = vi.fn()
const toggleSidebar = vi.fn()

let uiState: Record<string, unknown>

vi.mock('@/stores/ui', () => ({
  useUiStore: () => uiState,
}))

function mountSidebar() {
  return mount(Sidebar)
}

function mountWithReactiveUi(sidebarCollapsed: boolean) {
  uiState = reactive({
    viewMode: 'dashboard',
    sidebarCollapsed,
    editMode: false,
    setViewMode,
    toggleEditMode,
    toggleSidebar,
  }) as unknown as Record<string, unknown>
  return mount(Sidebar)
}

beforeEach(() => {
  vi.clearAllMocks()
  uiState = {
    viewMode: 'dashboard',
    sidebarCollapsed: false,
    editMode: false,
    setViewMode,
    toggleEditMode,
    toggleSidebar,
  }
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Sidebar', () => {
  it('offers Pomodoro navigation', async () => {
    const wrapper = mountSidebar()
    const button = wrapper.get('[data-testid="nav-pomodoro"]')
    expect(button.text()).toContain('Pomodoro')
    await button.trigger('click')
    expect(setViewMode).toHaveBeenCalledWith('pomodoro')
  })

  it('renders a section eyebrow per group and a color dot per row', () => {
    const wrapper = mountSidebar()
    const eyebrows = wrapper.findAll('.text-eyebrow')
    expect(eyebrows.map((e) => e.text())).toEqual(['Navegación', 'Sistema'])

    for (const key of ['dashboard', 'archived', 'pomodoro', 'edit-mode', 'settings']) {
      const row = wrapper.get(`[data-testid="nav-${key}"]`)
      expect(row.find('span.rounded-full').exists()).toBe(true)
    }
  })

  it('marks the active view row distinctly from idle rows', () => {
    uiState.viewMode = 'pomodoro'
    const wrapper = mountSidebar()
    const active = wrapper.get('[data-testid="nav-pomodoro"]')
    const idle = wrapper.get('[data-testid="nav-archived"]')

    const activeBg = active.classes().find((c) => c.startsWith('bg-'))
    const idleBg = idle.classes().find((c) => c.startsWith('bg-'))
    expect(activeBg).toBeTruthy()
    expect(activeBg).not.toBe(idleBg)
    expect(idle.classes()).toContain('hover:bg-surface-2')
  })

  it('toggles edit mode from the system section', async () => {
    const wrapper = mountSidebar()
    await wrapper.get('[data-testid="nav-edit-mode"]').trigger('click')
    expect(toggleEditMode).toHaveBeenCalled()
  })

  it('collapsed settled: oculta labels y dots y centra las filas', () => {
    uiState.sidebarCollapsed = true
    const wrapper = mountSidebar()

    expect(wrapper.get('[data-testid="sidebar-title"]').classes()).toContain('hidden')
    expect(wrapper.findAll('.text-eyebrow').every((e) => e.classes().includes('hidden'))).toBe(true)

    for (const key of ['dashboard', 'archived', 'pomodoro', 'edit-mode', 'settings']) {
      const row = wrapper.get(`[data-testid="nav-${key}"]`)
      expect(row.classes()).toContain('justify-center')
      expect(row.get('span.rounded-full').classes()).toContain('hidden')
    }
  })

  it('renders AEON without a decorative logo in the header', () => {
    const wrapper = mountSidebar()
    const header = wrapper.get('[data-testid="sidebar-header"]')
    expect(header.text()).toBe('AEON')
    expect(header.findAll('svg')).toHaveLength(1)
    expect(header.get('[data-testid="sidebar-toggle"]').find('svg').exists()).toBe(true)
  })

  it('anchors the collapse toggle to the right when expanded', async () => {
    const wrapper = mountSidebar()
    const header = wrapper.get('[data-testid="sidebar-header"]')
    const toggle = header.get('[data-testid="sidebar-toggle"]')
    expect(header.element.lastElementChild).toBe(toggle.element)
    await toggle.trigger('click')
    expect(toggleSidebar).toHaveBeenCalled()
  })

  it('collapsed: keeps only the collapse toggle inside the panel', async () => {
    uiState.sidebarCollapsed = true
    const wrapper = mountSidebar()
    expect(wrapper.get('[data-testid="sidebar-title"]').classes()).toContain('hidden')

    const header = wrapper.get('[data-testid="sidebar-header"]')
    expect(header.findAll('button')).toHaveLength(1)
    await header.get('[data-testid="sidebar-toggle"]').trigger('click')
    expect(toggleSidebar).toHaveBeenCalled()
  })

  it('collapsed: centra el toggle y las filas de navegación horizontalmente', () => {
    uiState.sidebarCollapsed = true
    const wrapper = mountSidebar()

    const header = wrapper.get('[data-testid="sidebar-header"]')
    expect(header.classes()).toContain('justify-center')

    const toggle = header.get('[data-testid="sidebar-toggle"]')
    expect(toggle.classes()).toContain('justify-center')

    for (const key of ['dashboard', 'archived', 'pomodoro', 'edit-mode', 'settings']) {
      const row = wrapper.get(`[data-testid="nav-${key}"]`)
      expect(row.classes()).toContain('justify-center')
    }
  })

  it('el toggle usa el mismo tamaño de ícono que las filas de navegación', () => {
    const wrapper = mountSidebar()
    const toggleIcon = wrapper.get('[data-testid="sidebar-toggle"] svg')
    const navIcon = wrapper.get('[data-testid="nav-dashboard"] svg')
    expect(toggleIcon.attributes('width')).toBe(navIcon.attributes('width'))
    expect(toggleIcon.attributes('height')).toBe(navIcon.attributes('height'))
  })

  it('keeps the collapsed and expanded widths unchanged', () => {
    const expanded = mountSidebar()
    expect(expanded.get('aside').classes()).toContain('w-56')
    expect(expanded.get('aside').classes()).not.toContain('w-14')

    uiState.sidebarCollapsed = true
    const collapsed = mountSidebar()
    expect(collapsed.get('aside').classes()).toContain('w-14')
    expect(collapsed.get('aside').classes()).not.toContain('w-56')
  })

  it('anima solo el width del panel, no todas las propiedades', () => {
    const wrapper = mountSidebar()
    const aside = wrapper.get('aside')
    expect(aside.classes()).toContain('transition-[width]')
    expect(aside.classes()).not.toContain('transition-all')
  })

  it('al montar ya colapsado, asienta el layout colapsado sin esperar', () => {
    uiState.sidebarCollapsed = true
    const wrapper = mountSidebar()
    expect(wrapper.get('[data-testid="nav-dashboard"]').classes()).toContain('justify-center')
    expect(wrapper.get('[data-testid="sidebar-title"]').classes()).toContain('hidden')
  })

  it('colapsando: fadea labels y dots sin centrar hasta el settle', async () => {
    vi.useFakeTimers()
    const wrapper = mountWithReactiveUi(false)

    uiState.sidebarCollapsed = true
    await nextTick()

    const aside = wrapper.get('aside')
    const row = wrapper.get('[data-testid="nav-pomodoro"]')
    const dot = row.get('span.rounded-full')
    const label = row.get('[data-testid="nav-label-pomodoro"]')

    expect(aside.classes()).toContain('w-14')
    expect(dot.classes()).toContain('opacity-0')
    expect(label.classes()).toContain('opacity-0')
    expect(dot.classes()).not.toContain('hidden')
    expect(label.classes()).not.toContain('hidden')
    expect(row.classes()).not.toContain('justify-center')
    expect(wrapper.get('[data-testid="sidebar-header"]').classes()).not.toContain('justify-center')

    vi.advanceTimersByTime(200)
    await nextTick()

    expect(dot.classes()).toContain('hidden')
    expect(label.classes()).toContain('hidden')
    expect(row.classes()).toContain('justify-center')
    expect(wrapper.get('[data-testid="sidebar-header"]').classes()).toContain('justify-center')
  })

  it('expandir revierte el layout inmediatamente', async () => {
    const wrapper = mountWithReactiveUi(true)
    expect(wrapper.get('[data-testid="nav-pomodoro"]').classes()).toContain('justify-center')

    uiState.sidebarCollapsed = false
    await nextTick()

    const row = wrapper.get('[data-testid="nav-pomodoro"]')
    const dot = row.get('span.rounded-full')
    expect(wrapper.get('aside').classes()).toContain('w-56')
    expect(row.classes()).not.toContain('justify-center')
    expect(dot.classes()).not.toContain('opacity-0')
    expect(dot.classes()).not.toContain('hidden')
  })

  it('expandir antes del settle cancela el layout colapsado pendiente', async () => {
    vi.useFakeTimers()
    const wrapper = mountWithReactiveUi(false)

    uiState.sidebarCollapsed = true
    await nextTick()
    uiState.sidebarCollapsed = false
    await nextTick()
    vi.advanceTimersByTime(300)
    await nextTick()

    const row = wrapper.get('[data-testid="nav-pomodoro"]')
    const dot = row.get('span.rounded-full')
    expect(row.classes()).not.toContain('justify-center')
    expect(dot.classes()).not.toContain('hidden')
    expect(dot.classes()).not.toContain('opacity-0')
  })
})
