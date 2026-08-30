<script setup lang="ts">
import { computed } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'
import type { Habit, HabitLog } from '@/schemas/habits'
import { useHabitsStore } from '@/stores/habits'
import { useUiStore } from '@/stores/ui'
import { iconFor } from '@/lib/icons'
import { frequencyLabel } from '@/lib/frequencyLabel'
import HabitContextMenu from './HabitContextMenu.vue'
import HeatmapGrid from './HeatmapGrid.vue'
import SegmentedCheckCircle from '@/components/ui/SegmentedCheckCircle.vue'
import Container from '@/components/ui/Container.vue'

const props = defineProps<{ habit: Habit; logs: HabitLog[] }>()
const habits = useHabitsStore()
const ui = useUiStore()

const target = computed(() => props.habit.frequency.target_per_period)
const count = computed(() => habits.completedToday.get(props.habit.id) ?? 0)
const icon = computed(() => iconFor(props.habit.icon))
const subtitle = computed(() => props.habit.description ?? frequencyLabel(props.habit.frequency))
const isMenuOpen = computed(() => ui.menuOpenForHabitId === props.habit.id)

async function onIncrement() {
  await habits.incrementCheckIn(props.habit.id)
}

async function onDecrement() {
  await habits.decrementCheckIn(props.habit.id)
}

async function onReset() {
  await habits.resetCheckIn(props.habit.id)
}
</script>

<template>
  <Container
    data-testid="habit-card"
    variant="ghost"
    padding="sm"
    :class="['habit-card-responsive group relative', isMenuOpen && 'z-10']"
  >
    <div class="habit-card-row mb-1.5 flex items-center gap-1.5">
      <span data-testid="habit-icon" class="habit-card-icon shrink-0 text-white">
        <component :is="icon.icon" :size="14" :stroke-width="2" />
      </span>
      <button
        data-testid="habit-title"
        class="min-w-0 flex-1 text-left"
        @click="ui.openEdit(habit.id)"
      >
        <div class="habit-card-title truncate text-body-sm font-medium text-ink">
          {{ habit.name }}
        </div>
        <div data-testid="habit-subtitle" class="habit-card-subtitle text-caption text-ink-muted">
          {{ subtitle }}
        </div>
      </button>
      <div class="flex shrink-0 items-center gap-1">
        <button
          data-testid="menu-button"
          :data-habit-menu-trigger="habit.id"
          class="habit-card-btn flex h-7 w-7 items-center justify-center"
          aria-label="Más opciones"
          @click="ui.toggleMenu(habit.id)"
        >
          <MoreHorizontal :size="16" />
        </button>
        <SegmentedCheckCircle
          :target="target"
          :count="count"
          :color="habit.color"
          @increment="onIncrement"
          @decrement="onDecrement"
          @reset="onReset"
        />
      </div>
    </div>
    <HabitContextMenu v-if="isMenuOpen" :habit="habit" />
    <HeatmapGrid
      :logs="logs"
      :color="habit.color"
      :days="364"
      :target="habit.frequency.target_per_period"
      class="habit-card-heatmap"
    />
  </Container>
</template>
