<script setup lang="ts">
import { computed } from "vue";

type Variant = "default" | "featured" | "flat";
type Padding = "none" | "sm" | "md" | "lg";

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    padding?: Padding;
    as?: "div" | "article" | "section" | "aside";
  }>(),
  {
    variant: "default",
    padding: "md",
    as: "div",
  },
);

const paddingClass = computed(() => {
  switch (props.padding) {
    case "none":
      return "p-0";
    case "sm":
      return "p-3";
    case "lg":
      return "p-8";
    default:
      return "p-6";
  }
});

const variantClass = computed(() => {
  switch (props.variant) {
    case "featured":
      return "bg-surface-2 border border-hairline-strong";
    case "flat":
      return "bg-transparent";
    default:
      return "bg-surface-1 border border-hairline";
  }
});
</script>

<template>
  <component
    :is="as"
    :class="[
      'rounded-lg',
      paddingClass,
      variantClass,
    ]"
  >
    <div v-if="$slots.header || $slots.title" class="mb-4 flex items-start justify-between gap-3">
      <div>
        <slot name="title" />
        <slot name="header" />
      </div>
      <slot name="actions" />
    </div>
    <slot />
    <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-hairline">
      <slot name="footer" />
    </div>
  </component>
</template>
