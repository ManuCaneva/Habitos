<script setup lang="ts">
import { ref } from "vue";
import { useDashboardStore } from "@/stores/dashboard";
import { useUiStore } from "@/stores/ui";
import { useDashGrid } from "@/composables/useDashGrid";
import { getWidgetById } from "@/lib/dashboardWidgets";
import GridItemVue from "./GridItemVue.vue";
import WidgetPicker from "./WidgetPicker.vue";
import WidgetRemoveButton from "./WidgetRemoveButton.vue";

const dashboard = useDashboardStore();
const ui = useUiStore();
const containerRef = ref<HTMLElement | null>(null);
const { dims } = useDashGrid(containerRef);

function onMoved(id: string, x: number, y: number) {
  dashboard.moveTo(id, x, y);
}

function onResized(id: string, w: number, h: number) {
  dashboard.resizeTo(id, w, h);
}

function onRemoveWidget(id: string) {
  dashboard.removeWidget(id);
}
</script>

<template>
  <div
    ref="containerRef"
    data-testid="dashboard-view"
    class="h-full overflow-hidden"
  >
    <div class="relative h-full">
      <GridItemVue
        v-for="item in dashboard.layout"
        :key="item.i"
        :item="item"
        :dims="dims"
        :edit-mode="ui.editMode"
        @moved="onMoved"
        @resized="onResized"
      >
        <component
          :is="getWidgetById(item.i)?.component"
          :item="item"
        />
        <WidgetRemoveButton
          v-if="ui.editMode"
          :widget-id="item.i"
          @remove="onRemoveWidget"
        />
      </GridItemVue>
    </div>
    <WidgetPicker />
  </div>
</template>
