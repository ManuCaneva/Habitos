<script setup lang="ts">
import Text from "@/components/ui/Text.vue";

defineProps<{
  title: string;
  panelTestId?: string;
  entityClass?: string;
}>();
</script>

<template>
  <div :data-testid="panelTestId" class="h-full flex flex-col">
    <div
      class="shrink-0 bg-surface-2 px-3 py-2 border-b border-hairline flex items-baseline gap-1.5"
      :class="entityClass ? `${entityClass}-header-responsive` : undefined"
    >
      <Text variant="card-title" weight="600">{{ title }}</Text>
    </div>
    <div class="flex-1 overflow-auto p-1.5 scrollbar-gutter-stable">
      <slot />
    </div>
  </div>
</template>
