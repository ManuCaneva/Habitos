<script setup lang="ts">
import { computed } from "vue";
import type { HabitLog } from "@/schemas/habits";
import { buildHeatmapGrid } from "@/lib/buildHeatmapGrid";

const props = withDefaults(
  defineProps<{
    logs: HabitLog[];
    color: string;
    days?: number;
  }>(),
  { days: 30 }
);

const cells = computed(() => buildHeatmapGrid(props.days, props.logs));
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(7, minmax(0, 1fr))`,
}));
</script>

<template>
  <div
    data-testid="heatmap-grid"
    class="grid gap-0.5"
    :style="gridStyle"
  >
    <div
      v-for="cell in cells"
      :key="cell.date"
      data-testid="heatmap-cell"
      :class="[
        'w-2 h-2 rounded-full',
        cell.isEmpty ? 'empty' : '',
        cell.completed ? 'completed' : '',
        !cell.isEmpty && !cell.completed ? 'bg-surface-2' : '',
      ]"
      :style="cell.completed ? { backgroundColor: color } : {}"
    />
  </div>
</template>
