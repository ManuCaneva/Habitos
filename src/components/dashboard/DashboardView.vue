<script setup lang="ts">
import { ref } from "vue";
import { useDashboardStore } from "@/stores/dashboard";
import { useUiStore } from "@/stores/ui";
import { useDashGrid } from "@/composables/useDashGrid";
import { getWidgetById } from "@/lib/dashboardWidgets";
import GridItemVue from "./GridItemVue.vue";

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
</script>

<template>
  <div
    ref="containerRef"
    data-testid="dashboard-view"
    class="h-full"
  >
    <div class="relative" style="min-height: 100%">
      <GridItemVue
        v-for="item in dashboard.layout"
        :key="item.i"
        :item="item"
        :dims="dims"
        :edit-mode="ui.editMode"
        @moved="onMoved"
        @resized="onResized"
      >
        <component :is="getWidgetById(item.i)?.component" />
      </GridItemVue>
    </div>
  </div>
</template>
