<script setup lang="ts">
import { computed, ref } from "vue";
import { shadeFor } from "@/lib/habitColors";
import type { ScheduleBlock } from "@/schemas/weeklySchedule";

const props = defineProps<{
  block: ScheduleBlock;
}>();

const emit = defineEmits<{
  click: [];
}>();

const showOverlapError = ref(false);

const colorHexMap: Record<string, string> = {
  lavender: "#5e6ad2",
  green: "#4cb782",
  yellow: "#f2c94c",
  red: "#eb5757",
  pink: "#f178b6",
  cyan: "#56b6c2",
  orange: "#f2994a",
  bone: "#d4d4d4",
};

const blockStyle = computed(() => {
  if (showOverlapError.value) {
    return {
      backgroundColor: "rgba(239, 68, 68, 0.2)",
      borderColor: "rgb(239, 68, 68)",
      color: "rgb(185, 28, 28)",
    };
  }
  const hex = colorHexMap[props.block.color] || colorHexMap.lavender;
  return {
    backgroundColor: shadeFor(hex, 0.15),
    borderColor: hex,
    color: "var(--color-ink)",
  };
});
</script>

<template>
  <button
    :class="[
      'absolute rounded-sm border px-1.5 py-1 text-button text-left truncate overflow-hidden transition-all duration-150 cursor-pointer'
    ]"
    :style="blockStyle"
    :data-day="block.day_of_week"
    :data-start="block.start_minutes"
    :data-end="block.end_minutes"
    @click="emit('click')"
  >
    <div class="font-medium text-xs leading-tight truncate">{{ block.title }}</div>
  </button>
</template>
