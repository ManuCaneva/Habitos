<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useWeeklyScheduleStore } from "@/stores/weeklySchedule";
import { minutesToHHMM } from "@/stores/weeklySchedule";
import WeeklyScheduleBlock from "./WeeklyScheduleBlock.vue";
import type { ScheduleBlock } from "@/schemas/weeklySchedule";

const store = useWeeklyScheduleStore();
const emit = defineEmits<{ edit: [block: ScheduleBlock] }>();

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const labelWidthPx = 48;

const containerRef = ref<HTMLElement | null>(null);
const containerHeight = ref(400);

function measure() {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.getBoundingClientRect().height;
  }
}

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
  const headerHeight = 33;
  const avail = containerHeight.value - headerHeight;
  const calculated = avail / visibleRows.value;
  const minHeight = 28;
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

function blockTopPx(b: ScheduleBlock) {
  return (b.start_minutes - dayStart.value) * minuteHeightPx.value;
}

function blockHeightPx(b: ScheduleBlock) {
  return (b.end_minutes - b.start_minutes) * minuteHeightPx.value;
}

// Solo mostramos bloques que entren en el rango horario visible
const visibleBlocks = computed(() => {
  const start = store.settings.day_start_minutes;
  const end = store.settings.day_end_minutes;
  return store.blocks.filter((b) => b.start_minutes >= start && b.end_minutes <= end);
});

function blocksForDay(day: number) {
  return visibleBlocks.value.filter((b) => b.day_of_week === day);
}
</script>

<template>
  <div ref="containerRef" class="relative w-full h-full min-h-0 flex flex-col select-none">
    <!-- Contenedor scrollable de la grilla -->
    <div class="flex-1 min-h-0 overflow-y-auto relative bg-canvas scrollbar-gutter-stable">
      <!-- Header de días (sticky) -->
      <div class="flex border-b border-hairline bg-surface-2 sticky top-0 z-20 flex-shrink-0">
        <div :style="{ width: labelWidthPx + 'px' }" class="flex-shrink-0 bg-surface-2" />
        <div class="flex-1 grid grid-cols-7 border-l border-hairline bg-surface-2">
          <div v-for="(day, index) in DAYS" :key="index"
               class="text-caption text-ink-muted text-center py-2 border-r border-hairline font-semibold text-xs bg-surface-2">
            {{ day }}
          </div>
        </div>
      </div>
      
      <!-- Grilla de fondo con las líneas de horas y días -->
      <div class="flex" :style="{ height: gridHeightStyle }">
        <!-- Columna de etiquetas de horas -->
        <div :style="{ width: labelWidthPx + 'px' }" class="flex-shrink-0 border-r border-hairline bg-surface-1/50 select-none">
          <div v-for="hl in hourLabels" :key="hl.minute"
               :style="{ height: rowHeightStyle }"
               class="text-[10px] text-ink-subtle px-1 flex items-center justify-end pr-2 font-mono border-b border-hairline/30">
            {{ hl.label }}
          </div>
        </div>
        
        <!-- Líneas divisorias de la grilla -->
        <div class="flex-1 grid grid-cols-7 border-l border-hairline relative select-none">
          <div v-for="dayIndex in 7" :key="dayIndex" class="border-r border-hairline relative">
            <!-- Celdas de la grilla para cada slot de hora -->
            <div v-for="hl in hourLabels" :key="hl.minute"
                 :style="{ height: rowHeightStyle }"
                 class="border-b border-hairline/30 w-full" />
            
            <!-- Bloques de este día específico -->
            <WeeklyScheduleBlock
              v-for="b in blocksForDay(dayIndex - 1)"
              :key="b.id"
              :block="b"
              class="absolute shadow-sm z-10"
              :style="{
                top: blockTopPx(b) + 'px',
                height: blockHeightPx(b) + 'px',
                left: '2px',
                width: 'calc(100% - 4px)',
              }"
              @click="emit('edit', b)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
