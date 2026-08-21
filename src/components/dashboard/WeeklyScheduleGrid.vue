<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useWeeklyScheduleStore } from "@/stores/weeklySchedule";
import { minutesToHHMM } from "@/stores/weeklySchedule";
import WeeklyScheduleBlock from "./WeeklyScheduleBlock.vue";
import type { ScheduleBlockWithSlots, ScheduleSlot } from "@/schemas/weeklySchedule";

const store = useWeeklyScheduleStore();
const emit = defineEmits<{ edit: [block: ScheduleBlockWithSlots] }>();

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const containerRef = ref<HTMLElement | null>(null);
const containerHeight = ref(400);
const containerWidth = ref(800);

function measure() {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    containerHeight.value = rect.height;
    containerWidth.value = rect.width;
  }
}

const labelWidthPx = computed(() => {
  return Math.max(32, Math.min(64, containerWidth.value * 0.06));
});
const labelWidthStyle = computed(() => labelWidthPx.value + "px");

let observer: ResizeObserver | null = null;
onMounted(() => {
  measure();
  if (containerRef.value) {
    observer = new ResizeObserver(measure);
    observer.observe(containerRef.value);
  }
});

onUnmounted(() => {
  observer?.disconnect();
});

watch(() => store.settings, measure, { deep: true });

const visibleRows = computed(() => {
  const diff = store.settings.day_end_minutes - store.settings.day_start_minutes;
  return Math.max(1, Math.floor(diff / store.settings.granularity_minutes));
});

const rowHeightPx = computed(() => {
  const headerHeight = Math.max(24, Math.min(40, containerHeight.value * 0.06));
  const avail = containerHeight.value - headerHeight;
  const calculated = avail / visibleRows.value;
  const minHeight = Math.max(20, Math.min(36, containerHeight.value * 0.045));
  return Math.max(minHeight, calculated);
});

const minuteHeightPx = computed(() => rowHeightPx.value / store.settings.granularity_minutes);
const dayStart = computed(() => store.settings.day_start_minutes);

const hourLabels = computed(() => {
  const out: { minute: number; label: string }[] = [];
  const start = store.settings.day_start_minutes;
  const end = store.settings.day_end_minutes;
  const step = store.settings.granularity_minutes;
  for (let m = start; m < end; m += step) {
    out.push({ minute: m, label: minutesToHHMM(m) });
  }
  return out;
});

const gridTotalHeightPx = computed(() => visibleRows.value * rowHeightPx.value);
const gridHeightStyle = computed(() => gridTotalHeightPx.value + "px");
const rowHeightStyle = computed(() => rowHeightPx.value + "px");

function slotTopPx(s: ScheduleSlot) {
  return (s.start_minutes - dayStart.value) * minuteHeightPx.value;
}

function slotHeightPx(s: ScheduleSlot) {
  return (s.end_minutes - s.start_minutes) * minuteHeightPx.value;
}

interface VisibleSlot {
  slot: ScheduleSlot;
  block: ScheduleBlockWithSlots;
}

const visibleSlots = computed((): VisibleSlot[] => {
  const start = store.settings.day_start_minutes;
  const end = store.settings.day_end_minutes;
  const result: VisibleSlot[] = [];
  for (const bw of store.blocksWithSlots) {
    for (const slot of bw.slots) {
      if (slot.start_minutes >= start && slot.end_minutes <= end) {
        result.push({ slot, block: bw });
      }
    }
  }
  return result;
});

function slotsForDay(day: number): VisibleSlot[] {
  return visibleSlots.value.filter((vs) => vs.slot.day_of_week === day);
}
</script>

<template>
  <div ref="containerRef" class="relative w-full h-full min-h-0 flex flex-col select-none">
    <div class="flex-1 min-h-0 overflow-y-auto relative bg-canvas scrollbar-gutter-stable">
      <div class="flex border-b border-hairline bg-surface-2 sticky top-0 z-20 flex-shrink-0">
        <div :style="{ width: labelWidthStyle }" class="flex-shrink-0 bg-surface-2" />
        <div class="flex-1 grid grid-cols-7 border-l border-hairline bg-surface-2">
          <div v-for="(day, index) in DAYS" :key="index"
               class="text-ink-muted text-center border-r border-hairline font-semibold bg-surface-2 schedule-day-label text-caption py-2 text-xs">
            {{ day }}
          </div>
        </div>
      </div>
      
      <div class="flex" :style="{ height: gridHeightStyle }">
        <div :style="{ width: labelWidthStyle }" class="flex-shrink-0 border-r border-hairline bg-surface-1/50 select-none">
          <div v-for="hl in hourLabels" :key="hl.minute"
               :style="{ height: rowHeightStyle }"
               class="text-ink-subtle flex items-center justify-end font-mono border-b border-hairline/30 schedule-hour-label text-[10px] px-1 pr-2">
            {{ hl.label }}
          </div>
        </div>
        
        <div class="flex-1 grid grid-cols-7 border-l border-hairline relative select-none">
          <div v-for="dayIndex in 7" :key="dayIndex" class="border-r border-hairline relative">
            <div v-for="hl in hourLabels" :key="hl.minute"
                 :style="{ height: rowHeightStyle }"
                 class="border-b border-hairline/30 w-full" />
            
            <WeeklyScheduleBlock
              v-for="vs in slotsForDay(dayIndex - 1)"
              :key="vs.slot.id"
              :title="vs.block.title"
              :color="vs.block.color"
              :day-of-week="vs.slot.day_of_week"
              :start-minutes="vs.slot.start_minutes"
              :end-minutes="vs.slot.end_minutes"
              class="absolute shadow-sm z-10"
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
