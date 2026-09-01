<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Pause, Play } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Container from '@/components/ui/Container.vue'
import Text from '@/components/ui/Text.vue'
import { usePomodoroStore } from '@/stores/pomodoro'
import { useUiStore } from '@/stores/ui'
import {
  formatRemainingTime,
  getPhaseDurationMs,
  getProgressFraction,
  getRemainingMs,
} from '@/lib/pomodoro'

const pomodoro = usePomodoroStore()
const ui = useUiStore()
const clock = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

const phaseLabel = computed(() => {
  if (pomodoro.session.phase === 'shortBreak') return 'Descanso corto'
  if (pomodoro.session.phase === 'longBreak') return 'Descanso largo'
  return 'Enfoque'
})
const displayedRemainingMs = computed(() => {
  void clock.value
  if (pomodoro.session.isRunning && pomodoro.session.endsAt) {
    return getRemainingMs(pomodoro.session.endsAt)
  }
  return pomodoro.remainingMs
})
const durationMs = computed(() => getPhaseDurationMs(pomodoro.session.phase, pomodoro.settings))
const progressPercent = computed(() =>
  Math.round(getProgressFraction(displayedRemainingMs.value, durationMs.value) * 100)
)

async function start() {
  await pomodoro.prepareAudio()
  await pomodoro.start()
}

function openPomodoro() {
  ui.setViewMode('pomodoro')
}

onMounted(() => {
  timer = setInterval(() => {
    clock.value += 1
  }, 250)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <Container
    data-testid="pomodoro-widget"
    variant="default"
    class="flex h-full cursor-pointer flex-col justify-between gap-3 p-4"
    role="button"
    tabindex="0"
    @click="openPomodoro"
    @keydown.enter="openPomodoro"
  >
    <div class="flex items-start justify-between gap-2">
      <Text data-testid="pomodoro-widget-phase" variant="subhead" color="muted">
        {{ phaseLabel }}
      </Text>
      <Button
        v-if="!pomodoro.session.isRunning"
        data-testid="pomodoro-widget-start"
        size="sm"
        aria-label="Iniciar Pomodoro"
        @click.stop="start"
      >
        <template #icon-left><Play :size="14" /></template>
        Iniciar
      </Button>
      <Button
        v-else
        data-testid="pomodoro-widget-pause"
        variant="secondary"
        size="sm"
        aria-label="Pausar Pomodoro"
        @click.stop="pomodoro.pause()"
      >
        <template #icon-left><Pause :size="14" /></template>
        Pausar
      </Button>
    </div>

    <div class="flex min-h-0 flex-1 items-center justify-center">
      <div
        data-testid="pomodoro-widget-progress"
        class="relative flex aspect-square w-[min(100%,11rem)] items-center justify-center rounded-full"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="progressPercent"
        :style="{
          background: `conic-gradient(var(--color-primary) ${progressPercent}%, var(--color-surface-3) 0)`,
        }"
      >
        <div
          class="flex h-[calc(100%-8px)] w-[calc(100%-8px)] items-center justify-center rounded-full bg-surface-1"
        >
          <span
            data-testid="pomodoro-widget-countdown"
            class="font-mono text-3xl font-semibold tracking-tight"
          >
            {{ formatRemainingTime(displayedRemainingMs) }}
          </span>
        </div>
      </div>
    </div>
  </Container>
</template>
