<script setup lang="ts">
import { computed, ref } from "vue";
import { shadeFor } from "@/lib/habitColors";

const props = defineProps<{
  title: string;
  color: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
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
  const hex = colorHexMap[props.color] || colorHexMap.lavender;
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
      'absolute rounded-sm border text-left truncate overflow-hidden transition-all duration-150 cursor-pointer',
      'schedule-block'
    ]"
    :style="blockStyle"
    :data-day="dayOfWeek"
    :data-start="startMinutes"
    :data-end="endMinutes"
    @click="emit('click')"
  >
    <div class="font-medium truncate schedule-block-title leading-tight">{{ title }}</div>
  </button>
</template>
