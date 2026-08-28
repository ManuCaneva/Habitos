<script setup lang="ts">
import { computed } from 'vue'
import { Check, Plus, MoreHorizontal } from 'lucide-vue-next'
import type { Habit, HabitLog } from '@/schemas/habits'
import { useHabitsStore } from '@/stores/habits'
import { useUiStore } from '@/stores/ui'
import { iconFor } from '@/lib/icons'
import { frequencyLabel } from '@/lib/frequencyLabel'
import HabitContextMenu from './HabitContextMenu.vue'
import HeatmapGrid from './HeatmapGrid.vue'
import Container from '@/components/ui/Container.vue'

const props = defineProps<{ habit: Habit; logs: HabitLog[] }>()
const habits = useHabitsStore()
const ui = useUiStore()

const checked = computed(() => habits.completedToday.has(props.habit.id))
const icon = computed(() => iconFor(props.habit.icon))
const subtitle = computed(() => props.habit.description ?? frequencyLabel(props.habit.frequency))
const isMenuOpen = computed(() => ui.menuOpenForHabitId === props.habit.id)

async function toggleCheck() {
  if (checked.value) await habits.undoCheckIn(props.habit.id, habits.getTodayDate())
  else await habits.checkIn(props.habit.id)
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
        <button
          data-testid="checkin-button"
          :class="[
            'habit-card-checkin flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-95',
            !checked && 'border-2 bg-surface-3/30',
          ]"
          :style="checked ? { backgroundColor: habit.color } : { borderColor: habit.color }"
          :aria-label="checked ? 'Desmarcar hábito' : 'Marcar hábito'"
          @click="toggleCheck"
        >
          <Check v-if="checked" :size="16" :stroke-width="3" class="text-white" />
          <Plus v-else :size="16" :stroke-width="2" class="text-white" />
        </button>
      </div>
    </div>
    <HabitContextMenu v-if="isMenuOpen" :habit="habit" />
    <HeatmapGrid :logs="logs" :color="habit.color" :days="364" class="habit-card-heatmap" />
  </Container>
</template>
