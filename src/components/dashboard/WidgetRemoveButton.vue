<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{ widgetId: string }>()
const emit = defineEmits<{ remove: [id: string] }>()
</script>

<template>
  <button
    type="button"
    data-testid="widget-remove-button"
    class="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-hairline-strong bg-surface-2 text-ink-muted shadow-sm transition-colors duration-150 hover:bg-surface-3 hover:text-ink"
    :aria-label="`Quitar widget`"
    @click="emit('remove', widgetId)"
  >
    <X :size="14" />
  </button>
</template>
