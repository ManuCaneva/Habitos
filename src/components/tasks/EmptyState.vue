<script setup lang="ts">
import { ListChecks } from 'lucide-vue-next'
import Text from '@/components/ui/Text.vue'
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
    <span
      class="flex h-12 w-12 items-center justify-center rounded-full bg-accent-orange-tint text-accent-orange"
      aria-hidden="true"
    >
      <ListChecks :size="22" :stroke-width="1.75" />
    </span>
    <div class="flex flex-col gap-1">
      <Text variant="body" weight="500"> No hay tareas pendientes </Text>
      <Text variant="body-sm" color="muted">
        Agregá una tarea para organizar lo que tenés que hacer.
      </Text>
    </div>
  </div>
</template>
