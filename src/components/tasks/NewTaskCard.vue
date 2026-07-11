<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { useUiStore } from "@/stores/ui";
import Text from "@/components/ui/Text.vue";

const ui = useUiStore();

function onClick() {
  ui.openCreateTask();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    ui.openCreateTask();
  }
}
</script>

<template>
  <div
    data-testid="new-task-card"
    role="button"
    tabindex="0"
    aria-label="Crear nueva tarea"
    class="border-t border-dashed border-hairline
           flex flex-col items-center justify-center gap-1.5
           min-h-[44px] py-2 cursor-pointer
           text-ink-muted
           transition-colors duration-150 ease-out
           hover:bg-surface-3/30 hover:text-ink
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas
           task-card-responsive new-task-card"
    @click="onClick"
    @keydown="onKeydown"
  >
    <Plus :size="16" :stroke-width="2" aria-hidden="true" class="new-task-card-icon" />
    <Text variant="body-sm" weight="500" class="new-task-card-text">Nueva tarea</Text>
  </div>
</template>
