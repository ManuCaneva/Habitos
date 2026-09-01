import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PomodoroSettingsPanel from './PomodoroSettingsPanel.vue'

const settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreak: true,
  autoStartFocus: false,
  volume: 1,
  muted: false,
}

describe('PomodoroSettingsPanel', () => {
  it('emits a patch when each duration and interval changes', async () => {
    const saveSettings = vi.fn()
    const wrapper = mount(PomodoroSettingsPanel, { props: { settings, saveSettings } })
    const inputs = wrapper.findAll('input[type="number"]')

    await inputs[0].setValue('30')
    await inputs[1].setValue('10')
    await inputs[2].setValue('20')
    await inputs[3].setValue('6')

    expect(saveSettings.mock.calls).toEqual([
      [{ focusMinutes: 30 }],
      [{ shortBreakMinutes: 10 }],
      [{ longBreakMinutes: 20 }],
      [{ longBreakInterval: 6 }],
    ])
  })

  it('emits both auto-start toggles and volume settings', async () => {
    const saveSettings = vi.fn()
    const wrapper = mount(PomodoroSettingsPanel, { props: { settings, saveSettings } })

    await wrapper.get('[data-testid="setting-auto-start-break"] input').setValue(false)
    await wrapper.get('[data-testid="setting-auto-start-focus"] input').setValue(true)
    await wrapper.get('[data-testid="setting-volume"]').setValue('0.4')
    await wrapper.get('[data-testid="setting-mute"] input').setValue(true)

    expect(saveSettings.mock.calls).toEqual([
      [{ autoStartBreak: false }],
      [{ autoStartFocus: true }],
      [{ volume: 0.4 }],
      [{ muted: true }],
    ])
  })
})
