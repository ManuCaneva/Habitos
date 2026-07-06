<script setup lang="ts">
type Variant = "default" | "ghost" | "dashed";
type Padding = "none" | "sm" | "md" | "lg";

withDefaults(
  defineProps<{
    variant?: Variant;
    padding?: Padding;
    as?: string;
  }>(),
  {
    variant: "default",
    padding: "md",
    as: "div",
  }
);
</script>

<template>
  <component
    :is="as"
    :class="[
      'bg-surface-1 border border-hairline rounded-sm select-none min-h-0',
      padding === 'sm' && 'p-2',
      padding === 'md' && 'p-3',
      padding === 'lg' && 'p-4',
      variant === 'default' && 'border-hairline',
      variant === 'ghost' && 'bg-transparent border-transparent',
      variant === 'dashed' && 'border-dashed',
    ]"
  >
    <slot />
  </component>
</template>
