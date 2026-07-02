<script setup lang="ts">
import { computed } from "vue";
import type { HabitLog } from "@/schemas/habits";
import { buildHeatmapGrid } from "@/lib/buildHeatmapGrid";
import { shadeFor } from "@/lib/habitColors";

const props = withDefaults(
  defineProps<{ logs: HabitLog[]; color: string; days?: number }>(),
  { days: 91 }
);
const cells = computed(() => buildHeatmapGrid(props.days, props.logs));
const todayStr = new Date().toISOString().slice(0, 10);
function cellStyle(c: { completed: boolean; isEmpty: boolean; date: string }) {
  if (c.isEmpty) return "background: transparent";
  const intensity = c.completed ? 1 : 0;
  const base = shadeFor(props.color, intensity as 0 | 1);
  return c.date === todayStr && c.completed
    ? `background: ${base}; box-shadow: 0 0 0 1px ${shadeFor(props.color, 1)}`
    : `background: ${base}`;
}
</script>
<template>
  <div data-testid="heat-grid" class="grid gap-0.5"
       style="grid-template-columns: repeat(13, minmax(0,1fr)); grid-template-rows: repeat(7, minmax(0,1fr)); grid-auto-flow: column;">
    <div v-for="(c, i) in cells" :key="i" data-testid="heat-cell"
         class="w-2 h-2 rounded-sm" :style="cellStyle(c)" />
  </div>
</template>
