import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Sidebar from './Sidebar.vue'

const setViewMode = vi.fn()
vi.mock('@/stores/ui', () => ({
  useUiStore: () => ({
    viewMode: 'dashboard',
    sidebarCollapsed: false,
    editMode: false,
    setViewMode,
    toggleEditMode: vi.fn(),
    toggleSidebar: vi.fn(),
  }),
}))

describe('Sidebar', () => {
  it('offers Pomodoro navigation', async () => {
    const wrapper = mount(Sidebar)
    const button = wrapper.get('[data-testid="nav-pomodoro"]')
    expect(button.text()).toContain('Pomodoro')
    await button.trigger('click')
    expect(setViewMode).toHaveBeenCalledWith('pomodoro')
  })
})
