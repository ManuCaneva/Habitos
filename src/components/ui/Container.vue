<script setup lang="ts">
type Variant = 'default' | 'ghost' | 'dashed'
type Padding = 'none' | 'sm' | 'md' | 'lg'

withDefaults(
  defineProps<{
    variant?: Variant
    padding?: Padding
    as?: string
    glass?: boolean
  }>(),
  {
    variant: 'default',
    padding: 'md',
    as: 'div',
    glass: false,
  }
)
</script>

<template>
  <component
    :is="as"
    :class="[
      'min-h-0 min-w-0 select-none rounded-lg border border-hairline',
      glass ? 'glass-soft' : 'bg-surface-1',
      padding === 'sm' && 'p-2',
      padding === 'md' && 'p-3',
      padding === 'lg' && 'p-4',
      variant === 'default' && 'border-hairline',
      variant === 'ghost' && 'border-transparent bg-transparent',
      variant === 'dashed' && 'border-dashed',
    ]"
  >
    <slot />
  </component>
</template>
