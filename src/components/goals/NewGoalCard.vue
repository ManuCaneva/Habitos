<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { useUiStore } from "@/stores/ui";
import Text from "@/components/ui/Text.vue";

const ui = useUiStore();

function onClick() {
  ui.openCreateGoal();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    ui.openCreateGoal();
  }
}
</script>

<template>
  <div
    data-testid="new-goal-card"
    role="button"
    tabindex="0"
    aria-label="Crear nuevo objetivo"
    class="border-t border-dashed border-hairline
           flex flex-col items-center justify-center gap-1.5
           min-h-[44px] py-2 cursor-pointer
           text-ink-muted
           transition-colors duration-150 ease-out
           hover:bg-surface-3/30 hover:text-ink
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas
           goal-card-responsive new-goal-card"
    @click="onClick"
    @keydown="onKeydown"
  >
    <Plus :size="16" :stroke-width="2" aria-hidden="true" class="new-goal-card-icon" />
    <Text variant="body-sm" weight="500" class="new-goal-card-text">Nuevo objetivo</Text>
  </div>
</template>
