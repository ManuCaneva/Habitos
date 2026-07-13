<script setup lang="ts">
import { onMounted } from "vue";
import { useHabitsStore } from "@/stores/habits";
import { useTasksStore } from "@/stores/tasks";
import { useGoalsStore } from "@/stores/goals";
import { useUiStore } from "@/stores/ui";
import Sidebar from "@/components/layout/Sidebar.vue";
import DashboardView from "@/components/dashboard/DashboardView.vue";
import ArchivedView from "@/views/ArchivedView.vue";
import SettingsView from "@/views/SettingsView.vue";
import { useTheme } from "@/composables/useTheme";
import HabitFormModal from "@/components/habits/HabitFormModal.vue";
import TaskFormModal from "@/components/tasks/TaskFormModal.vue";
import GoalFormModal from "@/components/goals/GoalFormModal.vue";

const habits = useHabitsStore();
const tasks = useTasksStore();
const goals = useGoalsStore();
const ui = useUiStore();

useTheme();

onMounted(async () => {
  await habits.loadInitialData();
  await tasks.loadTasks();
  await goals.loadGoals();
  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(today.getDate() - 90);
  const fromDate = ninetyDaysAgo.toISOString().split("T")[0];
  const toDate = today.toISOString().split("T")[0];
  await goals.loadLogsForRange(fromDate, toDate);
});
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-canvas text-ink">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <div class="flex-1 min-h-0 overflow-hidden px-3 py-4">
        <DashboardView v-if="ui.viewMode === 'dashboard'" />
        <ArchivedView v-else-if="ui.viewMode === 'archived'" />
        <SettingsView v-else-if="ui.viewMode === 'settings'" />
      </div>
    </div>

    <HabitFormModal />
    <TaskFormModal />
    <GoalFormModal />
  </div>
</template>
