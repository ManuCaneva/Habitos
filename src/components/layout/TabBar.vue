<script setup lang="ts">
import { useUiStore, type ViewMode } from "@/stores/ui";
import { computed } from "vue";

const ui = useUiStore();

interface Tab {
  id: ViewMode;
  label: string;
}

const tabs: readonly Tab[] = [
  { id: "today", label: "Hoy" },
  { id: "archived", label: "Archivados" },
  { id: "settings", label: "Settings" },
] as const;

const counts = computed(() => ({
  today: ui.viewMode === "today" ? "" : "",
  archived: ui.viewMode === "archived" ? "" : "",
  settings: "",
}));
</script>

<template>
  <nav class="flex items-center gap-1 px-6 border-b border-hairline">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      :class="[
        'px-3 py-2.5 text-body-sm font-medium transition-colors duration-150',
        'border-b-2 -mb-px',
        ui.viewMode === tab.id
          ? 'text-ink border-primary'
          : 'text-ink-muted border-transparent hover:text-ink',
      ]"
      @click="ui.setViewMode(tab.id)"
    >
      {{ tab.label }}{{ counts[tab.id] }}
    </button>
  </nav>
</template>
