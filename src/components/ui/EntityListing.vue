<script setup lang="ts">
import Text from '@/components/ui/Text.vue'

defineProps<{
  title: string
  eyebrow?: string
  panelTestId?: string
  entityClass?: string
}>()
</script>

<template>
  <div :data-testid="panelTestId" class="flex h-full flex-col">
    <div
      class="flex shrink-0 flex-col gap-1 border-b border-hairline bg-surface-2 px-4 py-3"
      :class="entityClass ? `${entityClass}-header-responsive` : undefined"
    >
      <Text v-if="eyebrow" variant="eyebrow" color="subtle" class="entity-header-eyebrow truncate">
        {{ eyebrow }}
      </Text>
      <Text variant="card-title" weight="600" class="truncate">{{ title }}</Text>
    </div>
    <div class="scrollbar-gutter-stable entity-body-responsive flex-1 overflow-auto p-2">
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="entity-footer-responsive shrink-0 border-t border-hairline p-2"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
