<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useHabitsStore } from '@/stores/habits'
import { useTasksStore } from '@/stores/tasks'
import { useGoalsStore } from '@/stores/goals'
import { useUiStore } from '@/stores/ui'
import Sidebar from '@/components/layout/Sidebar.vue'
import DashboardView from '@/components/dashboard/DashboardView.vue'
import ArchivedView from '@/views/ArchivedView.vue'
import SettingsView from '@/views/SettingsView.vue'
import PomodoroView from '@/views/PomodoroView.vue'
import { useTheme } from '@/composables/useTheme'
import HabitFormModal from '@/components/habits/HabitFormModal.vue'
import TaskFormModal from '@/components/tasks/TaskFormModal.vue'
import GoalFormModal from '@/components/goals/GoalFormModal.vue'
import { usePomodoroStore } from '@/stores/pomodoro'

const habits = useHabitsStore()
const tasks = useTasksStore()
const goals = useGoalsStore()
const ui = useUiStore()
const pomodoro = usePomodoroStore()

useTheme()

let pomodoroTicker: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
  await habits.loadInitialData()
  await tasks.loadTasks()
  await goals.loadGoals()
  const today = new Date()
  const ninetyDaysAgo = new Date(today)
  ninetyDaysAgo.setDate(today.getDate() - 90)
  const fromDate = ninetyDaysAgo.toISOString().split('T')[0]
  const toDate = today.toISOString().split('T')[0]
  await goals.loadLogsForRange(fromDate, toDate)
  await pomodoro.load()
  pomodoroTicker = setInterval(() => {
    void pomodoro.advanceIfExpired()
  }, 250)
})

onBeforeUnmount(() => {
  if (pomodoroTicker) clearInterval(pomodoroTicker)
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-canvas text-ink">
    <Sidebar />

    <div class="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div class="min-h-0 flex-1 overflow-hidden px-3 py-4">
        <DashboardView v-if="ui.viewMode === 'dashboard'" />
        <ArchivedView v-else-if="ui.viewMode === 'archived'" />
        <SettingsView v-else-if="ui.viewMode === 'settings'" />
        <PomodoroView v-else-if="ui.viewMode === 'pomodoro'" />
      </div>
    </div>

    <HabitFormModal />
    <TaskFormModal />
    <GoalFormModal />
  </div>
</template>
