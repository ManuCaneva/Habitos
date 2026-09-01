<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Pause, Play } from 'lucide-vue-next'
import Container from '@/components/ui/Container.vue'
import Text from '@/components/ui/Text.vue'
import { usePomodoroStore } from '@/stores/pomodoro'
import {
  formatRemainingTime,
  getPhaseDurationMs,
  getProgressFraction,
  getRemainingMs,
} from '@/lib/pomodoro'

const pomodoro = usePomodoroStore()
const clock = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

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
const ringToken = computed(() => (pomodoro.session.phase === 'focus' ? 'primary' : 'success'))
const toggleLabel = computed(() =>
  pomodoro.session.isRunning ? 'Pausar Pomodoro' : 'Iniciar Pomodoro'
)

function toggle() {
  if (pomodoro.session.isRunning) {
    void pomodoro.pause()
    return
  }
  void pomodoro.prepareAudio().catch(() => {})
  void pomodoro.start()
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
    padding="none"
    class="container-widget flex h-full flex-col overflow-hidden"
    style="container-type: inline-size"
  >
    <header
      data-testid="pomodoro-widget-header"
      class="flex shrink-0 items-center justify-center border-b border-hairline bg-surface-2 px-2 py-1"
    >
      <Text variant="card-title" weight="600" class="text-center">Pomodoro</Text>
    </header>

    <div class="flex min-h-0 flex-1 items-center justify-center p-4">
      <button
        data-testid="pomodoro-widget-toggle"
        type="button"
        class="group flex aspect-square w-[min(100%,11rem)] items-center justify-center rounded-full p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :aria-label="toggleLabel"
        @click="toggle"
      >
        <div
          data-testid="pomodoro-widget-progress"
          class="relative flex h-full w-full items-center justify-center rounded-full"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="progressPercent"
          :style="{
            background: `conic-gradient(rgb(var(--color-${ringToken})) ${progressPercent}%, rgb(var(--color-surface-3)) 0)`,
          }"
        >
          <div
            class="flex h-[calc(100%-8px)] w-[calc(100%-8px)] flex-col items-center justify-center gap-1.5 rounded-full bg-surface-1"
          >
            <span
              data-testid="pomodoro-widget-countdown"
              class="font-mono text-3xl font-semibold tracking-tight"
            >
              {{ formatRemainingTime(displayedRemainingMs) }}
            </span>
            <span
              data-testid="pomodoro-widget-toggle-icon"
              class="flex items-center justify-center text-ink-subtle"
              aria-hidden="true"
            >
              <Play v-if="!pomodoro.session.isRunning" :size="14" />
              <Pause v-else :size="14" />
            </span>
          </div>
        </div>
      </button>
    </div>
  </Container>
</template>
