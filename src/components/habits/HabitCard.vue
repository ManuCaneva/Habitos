<script setup lang="ts">
import { computed } from "vue";
import { Check, MoreHorizontal } from "lucide-vue-next";
import { useHabitsStore } from "@/stores/habits";
import { useUiStore } from "@/stores/ui";
import type { Habit, HabitLog } from "@/schemas/habits";
import Text from "@/components/ui/Text.vue";
import HeatmapGrid from "./HeatmapGrid.vue";

const props = defineProps<{
  habit: Habit;
  logs: HabitLog[];
}>();

const habits = useHabitsStore();
const ui = useUiStore();

const checked = computed(() => habits.completedToday.has(props.habit.id));
const isMenuOpen = computed(() => ui.menuOpenForHabitId === props.habit.id);

async function toggleCheck() {
  const today = habits.getTodayDate();
  if (checked.value) {
    await habits.undoCheckIn(props.habit.id, today);
  } else {
    await habits.checkIn(props.habit.id);
  }
}
</script>

<template>
  <div class="bg-surface-1 rounded-lg border border-hairline p-5 group">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span
          data-testid="color-dot"
          :style="{ backgroundColor: habit.color }"
          class="w-3 h-3 rounded-full shrink-0"
          aria-hidden="true"
        />
        <Text variant="body-lg" weight="500">{{ habit.name }}</Text>
      </div>
      <div class="flex items-center gap-2">
        <button
          data-testid="checkin-button"
          type="button"
          :class="[
            'shrink-0 w-7 h-7 rounded-md border flex items-center justify-center',
            'transition-all duration-150 active:scale-95',
            checked
              ? 'bg-primary border-primary text-white'
              : 'border-hairline-strong hover:border-primary',
          ]"
          :aria-label="checked ? 'Desmarcar hábito' : 'Marcar hábito'"
          :title="checked ? 'Desmarcar' : 'Marcar'"
          @click="toggleCheck"
        >
          <Check v-if="checked" :size="16" :stroke-width="3" />
        </button>
        <button
          data-testid="menu-button"
          type="button"
          :class="[
            'shrink-0 w-7 h-7 rounded-md flex items-center justify-center',
            'transition-opacity duration-150',
            'text-ink-tertiary hover:text-ink hover:bg-surface-2',
            isMenuOpen
              ? 'opacity-100 bg-surface-2 text-ink'
              : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          ]"
          aria-label="Más opciones"
          title="Más opciones"
          @click="ui.toggleMenu(habit.id)"
        >
          <MoreHorizontal :size="16" />
        </button>
      </div>
    </div>
    <HeatmapGrid :logs="logs" :color="habit.color" :days="30" />
  </div>
</template>
