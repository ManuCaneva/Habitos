import { beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('hides labels and dots when collapsed', () => {
    uiState.sidebarCollapsed = true
    const wrapper = mountSidebar()
    expect(wrapper.text()).not.toContain('Navegación')
    expect(wrapper.get('[data-testid="nav-pomodoro"]').find('span.rounded-full').exists()).toBe(
      false
    )
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
    expect(wrapper.text()).not.toContain('AEON')

    const header = wrapper.get('[data-testid="sidebar-header"]')
    expect(header.findAll('button')).toHaveLength(1)
    expect(header.text()).toBe('')
    await header.get('[data-testid="sidebar-toggle"]').trigger('click')
    expect(toggleSidebar).toHaveBeenCalled()
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
})
