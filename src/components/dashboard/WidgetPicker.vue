<script setup lang="ts">
import { ref, computed } from "vue";
import { Plus } from "lucide-vue-next";
import { useDashboardStore } from "@/stores/dashboard";
import { useUiStore } from "@/stores/ui";
import { widgets } from "@/lib/dashboardWidgets";
import Text from "@/components/ui/Text.vue";

const dashboard = useDashboardStore();
const ui = useUiStore();

const open = ref(false);

const availableWidgets = computed(() => {
  const layoutIds = new Set(dashboard.layout.map((item) => item.i));
  return widgets.filter((w) => !layoutIds.has(w.id));
});

function toggleOpen() {
  open.value = !open.value;
}

function selectWidget(id: string) {
  dashboard.addWidget(id);
  open.value = false;
}
</script>

<template>
  <div v-if="ui.editMode" data-testid="widget-picker" class="fixed bottom-6 right-6 z-50">
    <div class="relative">
      <div v-if="open" class="absolute bottom-12 right-0 bg-surface-1 border border-hairline rounded-lg shadow-lg p-2 min-w-[180px]">
        <Text variant="caption" weight="600" class="px-2 py-1 text-ink-muted">Agregar widget</Text>
        <button
          v-for="widget in availableWidgets"
          :key="widget.id"
          :data-widget-id="widget.id"
          data-testid="widget-picker-item"
          type="button"
          class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-caption text-ink hover:bg-surface-2 transition-colors duration-150"
          @click="selectWidget(widget.id)"
        >
          <span class="text-primary">{{ widget.title }}</span>
        </button>
        <div v-if="availableWidgets.length === 0" class="px-2 py-1.5 text-caption text-ink-muted">
          Todos los widgets ya están agregados
        </div>
      </div>
      <button
        data-testid="widget-picker-toggle"
        type="button"
        class="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white hover:bg-primary-hover active:bg-primary-focus transition-colors duration-150 shadow-lg"
        aria-label="Agregar widget"
        @click="toggleOpen"
      >
        <Plus :size="24" />
      </button>
    </div>
  </div>
</template>
