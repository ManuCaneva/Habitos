<script setup lang="ts">
import { computed } from "vue";
import type { HabitLog } from "@/schemas/habits";
import { buildHeatmapGrid, HISTORY_COLS } from "@/lib/buildHeatmapGrid";
import { shadeFor } from "@/lib/habitColors";

const props = withDefaults(
  defineProps<{ logs: HabitLog[]; color: string; days?: number; cols?: number }>(),
  { days: 91, cols: HISTORY_COLS }
);

const cells = computed(() =>
  buildHeatmapGrid({ days: props.days, logs: props.logs, cols: props.cols })
);

const todayStr = computed(() => new Date().toISOString().slice(0, 10));

function cellStyle(c: { completed: boolean; isEmpty: boolean; date: string }) {
  if (c.isEmpty) return "background: transparent";
  const intensity: 0 | 1 = c.completed ? 1 : 0;
  const base = shadeFor(props.color, intensity);
  return c.date === todayStr.value && c.completed
    ? `background: ${base}; box-shadow: 0 0 0 1px ${shadeFor(props.color, 1)}`
    : `background: ${base}`;
}
</script>

<template>
  <div
    data-testid="heat-grid"
    class="grid gap-0.5"
    :style="{ gridTemplateColumns: `repeat(${props.cols}, minmax(0,1fr))` }"
  >
    <div
      v-for="(c, i) in cells"
      :key="i"
      data-testid="heat-cell"
      class="w-2.5 h-2.5 rounded-sm"
      :style="cellStyle(c)"
    />
  </div>
</template>
