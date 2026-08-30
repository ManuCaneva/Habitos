<script setup lang="ts">
import { computed } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'
import { useHabitsStore } from '@/stores/habits'
import { useUiStore } from '@/stores/ui'
import { iconFor } from '@/lib/icons'
import { shadeFor } from '@/lib/habitColors'
import type { Habit } from '@/schemas/habits'
import Text from '@/components/ui/Text.vue'
import HabitContextMenu from './HabitContextMenu.vue'
import SegmentedCheckCircle from '@/components/ui/SegmentedCheckCircle.vue'

const props = defineProps<{ habit: Habit; showArchiveDate?: boolean }>()

const habits = useHabitsStore()
const ui = useUiStore()

const target = computed(() => props.habit.frequency.target_per_period)
const count = computed(() => habits.completedToday.get(props.habit.id) ?? 0)
const checked = computed(() => count.value >= 1)
const icon = computed(() => iconFor(props.habit.icon))
const streak = computed(() => habits.currentStreak(props.habit.id))
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

const archivedLabel = computed(() => {
  if (!props.habit.archived_at) return ''
  return new Date(props.habit.archived_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
})
</script>

<template>
  <div
    data-testid="habit-row"
    :class="['group relative', isMenuOpen && 'z-10']"
    :style="
      checked
        ? {
            backgroundColor: shadeFor(habit.color, 0.25),
            boxShadow: `inset 3px 0 0 0 ${habit.color}`,
          }
        : {}
    "
  >
    <div
      :class="[
        'flex items-center gap-3 px-6 py-3 transition-colors duration-150',
        'border-b border-hairline last:border-b-0',
        !checked && 'hover:bg-surface-1',
        isMenuOpen && 'bg-surface-1',
      ]"
    >
      <span data-testid="habit-icon" class="shrink-0 text-white">
        <component :is="icon.icon" :size="18" :stroke-width="2" />
      </span>
      <button type="button" class="min-w-0 flex-1 text-left" @click="ui.openEdit(habit.id)">
        <Text
          variant="body"
          :color="checked ? 'subtle' : 'default'"
          :class="['truncate', checked && 'line-through']"
        >
          {{ habit.name }}
        </Text>
        <Text v-if="showArchiveDate && archivedLabel" variant="caption" color="subtle">
          Archivado el {{ archivedLabel }}
        </Text>
      </button>
      <button
        type="button"
        :class="[
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
          'text-ink-tertiary hover:bg-surface-2 hover:text-ink',
          isMenuOpen ? 'bg-surface-2 text-ink' : '',
        ]"
        data-testid="menu-button"
        :data-habit-menu-trigger="habit.id"
        aria-label="Más opciones"
        title="Más opciones"
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
      <div class="w-10 shrink-0 text-right">
        <Text variant="body-sm" color="subtle" mono>
          {{ streak }}
        </Text>
      </div>
    </div>
    <HabitContextMenu v-if="isMenuOpen" :habit="habit" />
  </div>
</template>
