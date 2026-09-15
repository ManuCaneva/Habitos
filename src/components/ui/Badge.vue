<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'default' | 'success' | 'primary'
type Size = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    dot?: boolean
  }>(),
  {
    variant: 'default',
    size: 'sm',
    dot: false,
  }
)

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'h-5 px-2 text-caption gap-1'
  return 'h-6 px-2.5 text-caption gap-1.5'
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-accent-green-tint text-accent-green'
    case 'primary':
      return 'bg-accent-purple-tint text-accent-purple'
    default:
      return 'bg-surface-2 text-ink-muted'
  }
})

const dotClass = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-accent-green'
    case 'primary':
      return 'bg-accent-purple'
    default:
      return 'bg-ink-subtle'
  }
})
</script>

<template>
  <span :class="['inline-flex items-center rounded-full font-medium', sizeClass, variantClass]">
    <span v-if="dot" :class="['h-1.5 w-1.5 rounded-full', dotClass]" />
    <slot />
  </span>
</template>
