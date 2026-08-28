<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useWeeklyScheduleStore } from '@/stores/weeklySchedule'
import { minutesToHHMM } from '@/stores/weeklySchedule'
import WeeklyScheduleBlock from './WeeklyScheduleBlock.vue'
import type { ScheduleBlockWithSlots, ScheduleSlot } from '@/schemas/weeklySchedule'

const store = useWeeklyScheduleStore()
const emit = defineEmits<{ edit: [block: ScheduleBlockWithSlots] }>()

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const containerRef = ref<HTMLElement | null>(null)
const containerHeight = ref(400)
const containerWidth = ref(800)

let rafId: number | null = null

function measure() {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect()
      containerHeight.value = rect.height
      containerWidth.value = rect.width
    }
  })
}

function flushMeasure() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    containerHeight.value = rect.height
    containerWidth.value = rect.width
  }
}

const labelWidthPx = computed(() => {
  return Math.max(32, Math.min(64, containerWidth.value * 0.06))
})
const labelWidthStyle = computed(() => labelWidthPx.value + 'px')

let observer: ResizeObserver | null = null
onMounted(() => {
  flushMeasure()
  if (containerRef.value) {
    observer = new ResizeObserver(measure)
    observer.observe(containerRef.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
})

watch(() => store.settings, measure, { deep: true })

const visibleRows = computed(() => {
  const diff = store.settings.day_end_minutes - store.settings.day_start_minutes
  return Math.max(1, Math.floor(diff / store.settings.granularity_minutes))
})

const rowHeightPx = computed(() => {
  const headerHeight = Math.max(24, Math.min(40, containerHeight.value * 0.06))
  const avail = containerHeight.value - headerHeight
  const calculated = avail / visibleRows.value
  const minHeight = Math.max(20, Math.min(36, containerHeight.value * 0.045))
  return Math.max(minHeight, calculated)
})

const minuteHeightPx = computed(() => rowHeightPx.value / store.settings.granularity_minutes)
const dayStart = computed(() => store.settings.day_start_minutes)

const hourLabels = computed(() => {
  const out: { minute: number; label: string }[] = []
  const start = store.settings.day_start_minutes
  const end = store.settings.day_end_minutes
  const step = store.settings.granularity_minutes
  for (let m = start; m < end; m += step) {
    out.push({ minute: m, label: minutesToHHMM(m) })
  }
  return out
})

const gridTotalHeightPx = computed(() => visibleRows.value * rowHeightPx.value)
const gridHeightStyle = computed(() => gridTotalHeightPx.value + 'px')
const rowHeightStyle = computed(() => rowHeightPx.value + 'px')

function slotTopPx(s: ScheduleSlot) {
  return (s.start_minutes - dayStart.value) * minuteHeightPx.value
}

function slotHeightPx(s: ScheduleSlot) {
  return (s.end_minutes - s.start_minutes) * minuteHeightPx.value
}

interface VisibleSlot {
  slot: ScheduleSlot
  block: ScheduleBlockWithSlots
}

const visibleSlots = computed((): VisibleSlot[] => {
  const start = store.settings.day_start_minutes
  const end = store.settings.day_end_minutes
  const result: VisibleSlot[] = []
  for (const bw of store.blocksWithSlots) {
    for (const slot of bw.slots) {
      if (slot.start_minutes >= start && slot.end_minutes <= end) {
        result.push({ slot, block: bw })
      }
    }
  }
  return result
})

function slotsForDay(day: number): VisibleSlot[] {
  return visibleSlots.value.filter((vs) => vs.slot.day_of_week === day)
}
</script>

<template>
  <div ref="containerRef" class="relative flex h-full min-h-0 w-full select-none flex-col">
    <div class="scrollbar-gutter-stable relative min-h-0 flex-1 overflow-y-auto bg-canvas">
      <div class="sticky top-0 z-20 flex flex-shrink-0 border-b border-hairline bg-surface-2">
        <div :style="{ width: labelWidthStyle }" class="flex-shrink-0 bg-surface-2" />
        <div class="grid flex-1 grid-cols-7 border-l border-hairline bg-surface-2">
          <div
            v-for="(day, index) in DAYS"
            :key="index"
            class="schedule-day-label border-r border-hairline bg-surface-2 py-2 text-center text-caption text-xs font-semibold text-ink-muted"
          >
            {{ day }}
          </div>
        </div>
      </div>

      <div class="flex" :style="{ height: gridHeightStyle }">
        <div
          :style="{ width: labelWidthStyle }"
          class="flex-shrink-0 select-none border-r border-hairline bg-surface-1/50"
        >
          <div
            v-for="hl in hourLabels"
            :key="hl.minute"
            :style="{ height: rowHeightStyle }"
            class="schedule-hour-label flex items-center justify-end border-b border-hairline/30 px-1 pr-2 font-mono text-[10px] text-ink-subtle"
          >
            {{ hl.label }}
          </div>
        </div>

        <div class="relative grid flex-1 select-none grid-cols-7 border-l border-hairline">
          <div v-for="dayIndex in 7" :key="dayIndex" class="relative border-r border-hairline">
            <div
              v-for="hl in hourLabels"
              :key="hl.minute"
              :style="{ height: rowHeightStyle }"
              class="w-full border-b border-hairline/30"
            />

            <WeeklyScheduleBlock
              v-for="vs in slotsForDay(dayIndex - 1)"
              :key="vs.slot.id"
              :title="vs.block.title"
              :color="vs.block.color"
              :day-of-week="vs.slot.day_of_week"
              :start-minutes="vs.slot.start_minutes"
              :end-minutes="vs.slot.end_minutes"
              class="absolute z-10 shadow-sm"
              :style="{
                top: slotTopPx(vs.slot) + 'px',
                height: slotHeightPx(vs.slot) + 'px',
                left: '2%',
                width: '96%',
              }"
              @click="emit('edit', vs.block)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
