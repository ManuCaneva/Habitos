<script setup lang="ts">
import { computed } from "vue";
import { Loader2 } from "lucide-vue-next";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    size?: Size;
    label: string;
    loading?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "secondary",
    size: "md",
    loading: false,
    disabled: false,
    type: "button",
  },
);

defineEmits<{
  click: [event: MouseEvent];
}>();

const iconSize = computed(() => (props.size === "sm" ? 14 : props.size === "lg" ? 18 : 16));

const base =
  "inline-flex items-center justify-center rounded-md transition-colors duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

const sizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "h-8 w-8";
    case "lg":
      return "h-11 w-11";
    default:
      return "h-9 w-9";
  }
});

const variantClass = computed(() => {
  switch (props.variant) {
    case "primary":
      return "bg-primary text-white hover:bg-primary-hover active:bg-primary-focus";
    case "ghost":
      return "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-1 active:bg-surface-2";
    default:
      return "bg-surface-1 text-ink border border-hairline hover:bg-surface-2 hover:border-hairline-strong";
  }
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-label="label"
    :title="label"
    :class="[base, sizeClass, variantClass]"
    @click="(e) => $emit('click', e)"
  >
    <Loader2 v-if="loading" :size="iconSize" class="animate-spin" />
    <slot v-else />
  </button>
</template>
