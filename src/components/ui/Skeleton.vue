<script setup lang="ts">
import { computed } from "vue";

type Variant = "text" | "circle" | "rect";

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    width?: string;
    height?: string;
  }>(),
  {
    variant: "text",
  },
);

const sizeClass = computed(() => {
  if (props.width || props.height) return "";
  switch (props.variant) {
    case "circle":
      return "h-10 w-10 rounded-full";
    case "rect":
      return "h-24 w-full rounded-md";
    default:
      return "h-3 w-full rounded-sm";
  }
});

const style = computed(() => {
  const s: Record<string, string> = {};
  if (props.width) s.width = props.width;
  if (props.height) s.height = props.height;
  return s;
});
</script>

<template>
  <span
    :class="[
      'inline-block bg-surface-2',
      sizeClass,
    ]"
    :style="style"
  />
</template>
