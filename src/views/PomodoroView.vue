<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Heading from '@/components/ui/Heading.vue'
import Text from '@/components/ui/Text.vue'
import PomodoroSettingsPanel from '@/components/pomodoro/PomodoroSettingsPanel.vue'
import { usePomodoroStore } from '@/stores/pomodoro'
import { formatRemainingTime, getPhaseDurationMs, getProgressFraction } from '@/lib/pomodoro'

const pomodoro = usePomodoroStore()
const clock = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

const phaseLabel = computed(() => {
  if (pomodoro.session.phase === 'shortBreak') return 'Descanso corto'
  if (pomodoro.session.phase === 'longBreak') return 'Descanso largo'
  return 'Enfoque'
})
const durationMs = computed(() => getPhaseDurationMs(pomodoro.session.phase, pomodoro.settings))
const progress = computed(() => getProgressFraction(pomodoro.remainingMs, durationMs.value))
const progressPercent = computed(() => Math.round(progress.value * 100))

const cycleDots = computed(() =>
  Array.from({ length: pomodoro.settings.longBreakInterval }, (_, index) => index)
)

async function start() {
  await pomodoro.prepareAudio()
  await pomodoro.start()
}

onMounted(async () => {
  timer = setInterval(() => {
    clock.value += 1
    void pomodoro.advanceIfExpired()
  }, 250)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <main data-testid="pomodoro-view" class="scrollbar-gutter-stable h-full overflow-y-auto">
    <div class="mx-auto flex min-h-full max-w-2xl flex-col items-center gap-6 px-6 py-section">
      <Heading>Pomodoro</Heading>

      <Card class="flex w-full flex-col items-center gap-5 py-8" data-testid="pomodoro-card">
        <Text data-testid="pomodoro-phase" variant="subhead" color="muted">{{ phaseLabel }}</Text>
        <div
          data-testid="pomodoro-progress"
          class="relative flex h-64 w-64 items-center justify-center rounded-full"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="progressPercent"
          :style="{
            background: `conic-gradient(var(--color-primary) ${progressPercent}%, var(--color-surface-3) 0)`,
          }"
        >
          <div
            class="flex h-[calc(100%-12px)] w-[calc(100%-12px)] items-center justify-center rounded-full bg-surface-1"
          >
            <span
              data-testid="pomodoro-countdown"
              class="font-mono text-5xl font-semibold tracking-tight"
            >
              {{ formatRemainingTime(pomodoro.remainingMs) }}
            </span>
          </div>
        </div>

        <div
          data-testid="pomodoro-cycle"
          class="flex items-center gap-2"
          aria-label="Ciclos completados"
        >
          <span
            v-for="dot in cycleDots"
            :key="dot"
            data-testid="cycle-dot"
            class="h-2.5 w-2.5 rounded-full"
            :class="dot < pomodoro.session.completedFocusSessions ? 'bg-primary' : 'bg-surface-3'"
          />
        </div>
        <Text variant="body-sm" color="muted">
          {{ pomodoro.session.completedFocusSessions }} de
          {{ pomodoro.settings.longBreakInterval }} ciclos completados
        </Text>

        <div class="flex flex-wrap justify-center gap-2">
          <Button
            v-if="!pomodoro.session.isRunning"
            data-testid="pomodoro-start"
            size="lg"
            @click="start"
          >
            <template #icon-left><Play :size="16" /></template>
            Iniciar
          </Button>
          <Button
            v-else
            data-testid="pomodoro-pause"
            variant="secondary"
            size="lg"
            @click="pomodoro.pause()"
          >
            <template #icon-left><Pause :size="16" /></template>
            Pausar
          </Button>
          <Button data-testid="pomodoro-skip" variant="tertiary" size="lg" @click="pomodoro.skip()">
            <template #icon-left><SkipForward :size="16" /></template>
            Saltar
          </Button>
          <Button
            data-testid="pomodoro-reset"
            variant="tertiary"
            size="lg"
            @click="pomodoro.reset()"
          >
            <template #icon-left><RotateCcw :size="16" /></template>
            Reiniciar
          </Button>
        </div>
      </Card>
      <PomodoroSettingsPanel
        :settings="pomodoro.settings"
        @update:settings="pomodoro.saveSettings"
      />
    </div>
  </main>
</template>
