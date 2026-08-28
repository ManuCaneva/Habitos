<script setup lang="ts">
import Text from '@/components/ui/Text.vue'

defineProps<{
  title: string
  panelTestId?: string
  entityClass?: string
}>()
</script>

<template>
  <div :data-testid="panelTestId" class="flex h-full flex-col">
    <div
      class="flex shrink-0 items-baseline justify-center gap-1.5 border-b border-hairline bg-surface-2 px-3 py-2"
      :class="entityClass ? `${entityClass}-header-responsive` : undefined"
    >
      <Text variant="card-title" weight="600">{{ title }}</Text>
    </div>
    <div class="scrollbar-gutter-stable entity-body-responsive flex-1 overflow-auto p-1.5">
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="entity-footer-responsive shrink-0 border-t border-hairline p-1.5"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
