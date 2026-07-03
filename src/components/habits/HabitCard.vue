<script setup lang="ts">
import { computed } from "vue";
import { Check, Plus, MoreHorizontal } from "lucide-vue-next";
import type { Habit, HabitLog } from "@/schemas/habits";
import { useHabitsStore } from "@/stores/habits";
import { useUiStore } from "@/stores/ui";
import { iconFor } from "@/lib/icons";
import { frequencyLabel } from "@/lib/frequencyLabel";
import HabitContextMenu from "./HabitContextMenu.vue";
import HeatmapGrid from "./HeatmapGrid.vue";

const props = defineProps<{ habit: Habit; logs: HabitLog[] }>();
const habits = useHabitsStore();
const ui = useUiStore();

const checked = computed(() => habits.completedToday.has(props.habit.id));
const icon = computed(() => iconFor(props.habit.icon));
const subtitle = computed(
  () => props.habit.description ?? frequencyLabel(props.habit.frequency)
);
const isMenuOpen = computed(() => ui.menuOpenForHabitId === props.habit.id);

async function toggleCheck() {
  if (checked.value) await habits.undoCheckIn(props.habit.id, habits.getTodayDate());
  else await habits.checkIn(props.habit.id);
}
</script>

<template>
  <div data-testid="habit-card" class="glass p-3 group relative">
    <div class="flex items-center gap-3 mb-3">
      <span data-testid="habit-icon" class="text-white shrink-0">
        <component :is="icon.icon" :size="20" :stroke-width="2" />
      </span>
      <button
        data-testid="habit-title"
        class="min-w-0 flex-1 text-left"
        @click="ui.openEdit(habit.id)"
      >
        <div class="font-semibold text-ink truncate">{{ habit.name }}</div>
        <div data-testid="habit-subtitle" class="text-sm text-ink-muted opacity-70">
          {{ subtitle }}
        </div>
      </button>
      <div class="flex items-center gap-1 shrink-0">
        <button
          data-testid="checkin-button"
          :class="[
            'w-9 h-9 flex items-center justify-center transition-all active:scale-95 rounded-full',
            !checked && 'border-2 bg-surface-3/30',
          ]"
          :style="checked ? { backgroundColor: habit.color } : { borderColor: habit.color }"
          :aria-label="checked ? 'Desmarcar hábito' : 'Marcar hábito'"
          @click="toggleCheck"
        >
          <Check v-if="checked" :size="18" :stroke-width="3" class="text-white" />
          <Plus v-else :size="18" :stroke-width="2" class="text-white" />
        </button>
        <button
          data-testid="menu-button"
          class="w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100"
          aria-label="Más opciones"
          @click="ui.toggleMenu(habit.id)"
        >
          <MoreHorizontal :size="18" />
        </button>
      </div>
    </div>
    <HabitContextMenu v-if="isMenuOpen" :habit="habit" />
    <HeatmapGrid :logs="logs" :color="habit.color" :days="91" />
  </div>
</template>
