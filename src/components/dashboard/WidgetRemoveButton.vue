<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{ widgetId: string }>()
const emit = defineEmits<{ remove: [id: string] }>()
</script>

<template>
  <button
    type="button"
    class="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-surface-2 text-ink-muted transition-colors duration-150 hover:bg-surface-3 hover:text-ink"
    :aria-label="`Quitar widget`"
    @click="emit('remove', widgetId)"
  >
    <X :size="14" />
  </button>
</template>
