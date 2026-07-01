<script setup lang="ts">
import { onMounted } from "vue";
import { useHabitsStore } from "@/stores/habits";
import { useUiStore } from "@/stores/ui";
import Sidebar from "@/components/layout/Sidebar.vue";
import TodayView from "@/views/TodayView.vue";
import ArchivedView from "@/views/ArchivedView.vue";
import SettingsView from "@/views/SettingsView.vue";
import HabitFormModal from "@/components/habits/HabitFormModal.vue";

const store = useHabitsStore();
const ui = useUiStore();

onMounted(() => {
  store.loadInitialData();
});
</script>

<template>
  <div class="flex min-h-screen bg-canvas text-ink">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0">
      <div class="flex-1 px-6 py-8">
        <TodayView v-if="ui.viewMode === 'today'" />
        <ArchivedView v-else-if="ui.viewMode === 'archived'" />
        <SettingsView v-else-if="ui.viewMode === 'settings'" />
      </div>
    </div>

    <HabitFormModal />
  </div>
</template>
