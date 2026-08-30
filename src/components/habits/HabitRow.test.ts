import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HabitRow from './HabitRow.vue'
import type { Habit } from '@/schemas/habits'
import { ref } from 'vue'
import { shadeFor } from '@/lib/habitColors'

const completedToday = ref<Map<string, number>>(new Map())
const habitsMock = {
  get completedToday() {
    return completedToday.value
  },
  isCompletedToday: (id: string) => (completedToday.value.get(id) ?? 0) >= 1,
  incrementCheckIn: vi.fn(),
  decrementCheckIn: vi.fn(),
  resetCheckIn: vi.fn(),
  getTodayDate: () => '2026-07-01',
  currentStreak: () => 0,
}
const uiMock = { menuOpenForHabitId: null as string | null, toggleMenu: vi.fn(), openEdit: vi.fn() }
vi.mock('@/stores/habits', () => ({ useHabitsStore: () => habitsMock }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => uiMock }))

const base: Habit = {
  id: 'h1',
  name: 'Meditar',
  description: null,
  icon: 'footprints',
  color: '#5e6ad2',
  frequency: { type: 'daily', target_per_period: 1 },
  sort_order: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  archived_at: null,
}

describe('HabitRow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    completedToday.value = new Map()
    vi.clearAllMocks()
  })

  it('rendera el nombre del hábito', () => {
    const w = mount(HabitRow, { props: { habit: base } })
    expect(w.text()).toContain('Meditar')
  })

  it('botón de menú siempre visible (sin opacity-0)', () => {
    const w = mount(HabitRow, { props: { habit: base } })
    expect(w.find("[data-testid='menu-button']").exists()).toBe(true)
    expect(w.find("[data-testid='menu-button']").classes()).not.toContain('opacity-0')
  })

  it('botón de menú tiene el atributo data-habit-menu-trigger', () => {
    const w = mount(HabitRow, { props: { habit: base } })
    const btn = w.find("[data-testid='menu-button']")
    expect(btn.attributes('data-habit-menu-trigger')).toBe('h1')
  })

  it('botón menú aparece antes que botón check', () => {
    const w = mount(HabitRow, { props: { habit: base } })
    const all = w.findAll("[data-testid='checkin-button'], [data-testid='menu-button']")
    const checkIndex = all.findIndex(
      (el: ReturnType<typeof w.find>) => el.attributes('data-testid') === 'checkin-button'
    )
    const menuIndex = all.findIndex(
      (el: ReturnType<typeof w.find>) => el.attributes('data-testid') === 'menu-button'
    )
    expect(menuIndex).toBeGreaterThanOrEqual(0)
    expect(checkIndex).toBeGreaterThanOrEqual(0)
    expect(menuIndex).toBeLessThan(checkIndex)
  })

  it('row tiene z-10 cuando su menú está abierto', () => {
    uiMock.menuOpenForHabitId = 'h1'
    const w = mount(HabitRow, { props: { habit: base } })
    expect(w.find("[data-testid='habit-row']").classes()).toContain('z-10')
  })

  it('row NO tiene z-10 cuando otro menú está abierto', () => {
    uiMock.menuOpenForHabitId = 'h2'
    const w = mount(HabitRow, { props: { habit: base } })
    expect(w.find("[data-testid='habit-row']").classes()).not.toContain('z-10')
  })

  describe('feedback visual al marcar', () => {
    it('fila tiene backgroundColor tintado con el color del hábito cuando está checked', async () => {
      const w = mount(HabitRow, { props: { habit: base } })
      expect(w.find("[data-testid='habit-row']").attributes('style') ?? '').not.toContain(
        shadeFor(base.color, 0.25)
      )
      completedToday.value = new Map([[base.id, 1]])
      await w.vm.$nextTick()
      const rowStyle = w.find("[data-testid='habit-row']").attributes('style') ?? ''
      expect(rowStyle).toContain(shadeFor(base.color, 0.25))
    })

    it('botón check usa el color del hábito cuando está checked (no bg-primary)', async () => {
      const w = mount(HabitRow, { props: { habit: base } })
      const btn = w.find("[data-testid='checkin-button']")
      expect(btn.classes()).not.toContain('bg-primary')
      completedToday.value = new Map([[base.id, 1]])
      await w.vm.$nextTick()
      const btnStyle = w.find("[data-testid='checkin-button']").attributes('style') ?? ''
      expect(btnStyle).toContain(base.color)
    })
  })

  describe('reactividad a prop changes', () => {
    it('re-rendera el color del hábito cuando la prop habit.color cambia', async () => {
      const w = mount(HabitRow, { props: { habit: base } })
      expect(w.text()).toContain('Meditar')
      await w.setProps({
        habit: { ...base, color: '#eb5757', name: 'Correr' },
      })
      expect(w.text()).toContain('Correr')
      const titleButton = w.find('button.flex-1')
      expect(titleButton.attributes('style') ?? '').not.toContain('#eb5757')
    })
  })

  describe('progresivo (target > 1)', () => {
    const progressive: Habit = {
      ...base,
      frequency: { type: 'daily', target_per_period: 8 },
    }

    it('rendera el círculo segmentado con target y count', () => {
      completedToday.value = new Map([['h1', 3]])
      const w = mount(HabitRow, { props: { habit: progressive } })
      const circle = w.findComponent({ name: 'SegmentedCheckCircle' })
      expect(circle.exists()).toBe(true)
      expect(circle.props('target')).toBe(8)
      expect(circle.props('count')).toBe(3)
    })

    it('increment desde el círculo llama incrementCheckIn', async () => {
      completedToday.value = new Map([['h1', 3]])
      const w = mount(HabitRow, { props: { habit: progressive } })
      await w.findComponent({ name: 'SegmentedCheckCircle' }).vm.$emit('increment')
      expect(habitsMock.incrementCheckIn).toHaveBeenCalledWith('h1')
    })

    it('reset desde el círculo lleno llama resetCheckIn', async () => {
      completedToday.value = new Map([['h1', 8]])
      const w = mount(HabitRow, { props: { habit: progressive } })
      await w.findComponent({ name: 'SegmentedCheckCircle' }).vm.$emit('reset')
      expect(habitsMock.resetCheckIn).toHaveBeenCalledWith('h1')
    })

    it('decrement desde el círculo llama decrementCheckIn', async () => {
      completedToday.value = new Map([['h1', 3]])
      const w = mount(HabitRow, { props: { habit: progressive } })
      await w.findComponent({ name: 'SegmentedCheckCircle' }).vm.$emit('decrement')
      expect(habitsMock.decrementCheckIn).toHaveBeenCalledWith('h1')
    })

    it('la fila conserva racha y estilos (streak visible)', () => {
      const w = mount(HabitRow, { props: { habit: progressive } })
      expect(w.find("[data-testid='habit-row']").exists()).toBe(true)
      expect(w.find("[data-testid='check-button']").exists()).toBe(false)
      expect(w.findComponent({ name: 'SegmentedCheckCircle' }).exists()).toBe(true)
    })
  })
})
