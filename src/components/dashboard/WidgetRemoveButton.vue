<script setup lang="ts">
import { X } from "lucide-vue-next";

defineProps<{ widgetId: string }>();
const emit = defineEmits<{ remove: [id: string] }>();
</script>

<template>
  <button
    type="button"
    class="absolute top-1 right-1 z-10 flex items-center justify-center h-6 w-6 rounded-md bg-surface-2 text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors duration-150"
    :aria-label="`Quitar widget`"
    @click="emit('remove', widgetId)"
  >
    <X :size="14" />
  </button>
</template>
