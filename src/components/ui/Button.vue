<script setup lang="ts">
import { computed } from "vue";
import { Loader2 } from "lucide-vue-next";

type Variant = "primary" | "secondary" | "tertiary" | "inverse" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    block?: boolean;
  }>(),
  {
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false,
    type: "button",
    block: false,
  },
);

defineEmits<{
  click: [event: MouseEvent];
}>();

const base =
  "inline-flex items-center justify-center gap-2 font-medium text-button rounded-md transition-colors duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed select-none";

const sizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "h-8 px-3 text-button";
    case "lg":
      return "h-11 px-5 text-button";
    default:
      return "h-9 px-3.5 text-button";
  }
});

const variantClass = computed(() => {
  switch (props.variant) {
    case "primary":
      return "bg-primary text-white hover:bg-primary-hover active:bg-primary-focus focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";
    case "secondary":
      return "bg-surface-1 text-ink border border-hairline hover:bg-surface-2 hover:border-hairline-strong active:bg-surface-3 focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";
    case "tertiary":
      return "bg-transparent text-ink hover:bg-surface-1 active:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";
    case "inverse":
      return "bg-white text-canvas hover:bg-ink-muted active:bg-ink-subtle focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";
    case "ghost":
      return "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-1 active:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";
    case "danger":
      return "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:bg-red-500/30 focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";
    default:
      return "";
  }
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[base, sizeClass, variantClass, block && 'w-full']"
    @click="(e) => $emit('click', e)"
  >
    <Loader2 v-if="loading" :size="size === 'sm' ? 14 : 16" class="animate-spin" />
    <slot v-else name="icon-left" />
    <slot />
    <slot name="icon-right" />
  </button>
</template>
