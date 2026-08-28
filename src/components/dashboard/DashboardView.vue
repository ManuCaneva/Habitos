<script setup lang="ts">
import { useDashboardStore } from '@/stores/dashboard'
import { useUiStore } from '@/stores/ui'
import { getWidgetById } from '@/lib/dashboardWidgets'
import GridItemVue from './GridItemVue.vue'
import WidgetPicker from './WidgetPicker.vue'
import WidgetRemoveButton from './WidgetRemoveButton.vue'

const dashboard = useDashboardStore()
const ui = useUiStore()

function onMoved(id: string, x: number, y: number) {
  dashboard.moveTo(id, x, y)
}

function onResized(id: string, w: number, h: number) {
  dashboard.resizeTo(id, w, h)
}

function onRemoveWidget(id: string) {
  dashboard.removeWidget(id)
}
</script>

<template>
  <div data-testid="dashboard-view" class="h-full overflow-hidden">
    <div
      class="dashboard-grid relative h-full"
      style="
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        grid-template-rows: repeat(10, 1fr);
        gap: 4px;
      "
    >
      <GridItemVue
        v-for="item in dashboard.layout"
        :key="item.i"
        :item="item"
        :edit-mode="ui.editMode"
        @moved="onMoved"
        @resized="onResized"
      >
        <component :is="getWidgetById(item.i)?.component" :item="item" />
        <WidgetRemoveButton v-if="ui.editMode" :widget-id="item.i" @remove="onRemoveWidget" />
      </GridItemVue>
    </div>
    <WidgetPicker />
  </div>
</template>
