<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { useUiStore } from "@/stores/ui";
import Text from "@/components/ui/Text.vue";

const ui = useUiStore();

function onClick() {
  ui.openCreate();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    ui.openCreate();
  }
}
</script>

<template>
  <div
    data-testid="new-habit-card"
    role="button"
    tabindex="0"
    aria-label="Crear nuevo hábito"
    class="bg-surface-1 rounded-lg border border-hairline border-dashed p-4
           flex flex-col items-center justify-center gap-2
           min-h-[120px] cursor-pointer
           text-ink-muted
           transition-colors duration-150 ease-out
           hover:bg-surface-2 hover:text-ink hover:border-hairline-strong
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    @click="onClick"
    @keydown="onKeydown"
  >
    <Plus :size="24" :stroke-width="2" aria-hidden="true" />
    <Text variant="body" weight="500">Nuevo hábito</Text>
  </div>
</template>
