<script setup lang="ts">
import { computed } from "vue";
import { Check, MoreHorizontal } from "lucide-vue-next";
import { useHabitsStore } from "@/stores/habits";
import { useUiStore } from "@/stores/ui";
import type { Habit } from "@/schemas/habits";
import Text from "@/components/ui/Text.vue";
import HabitContextMenu from "./HabitContextMenu.vue";

const props = defineProps<{ habit: Habit; showArchiveDate?: boolean }>();

const habits = useHabitsStore();
const ui = useUiStore();

const checked = computed(() => habits.completedToday.has(props.habit.id));
const streak = computed(() => habits.currentStreak(props.habit.id));
const isMenuOpen = computed(() => ui.menuOpenForHabitId === props.habit.id);

async function toggleCheck() {
  const today = habits.getTodayDate();
  if (checked.value) {
    await habits.undoCheckIn(props.habit.id, today);
  } else {
    await habits.checkIn(props.habit.id);
  }
}

const archivedLabel = computed(() => {
  if (!props.habit.archived_at) return "";
  return new Date(props.habit.archived_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
});
</script>

<template>
  <div class="relative group">
    <div
      :class="[
        'flex items-center gap-3 px-6 py-3 transition-colors duration-150',
        'border-b border-hairline last:border-b-0',
        'hover:bg-surface-1',
        isMenuOpen && 'bg-surface-1',
      ]"
    >
      <span
        :style="{ backgroundColor: habit.color }"
        class="w-2.5 h-2.5 rounded-full shrink-0"
        aria-hidden="true"
      />
      <button
        type="button"
        class="flex-1 text-left min-w-0"
        @click="ui.openEdit(habit.id)"
      >
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
      <div class="w-10 text-right shrink-0">
        <Text variant="body-sm" color="subtle" mono>
          {{ streak }}
        </Text>
      </div>
      <button
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
    <HabitContextMenu v-if="isMenuOpen" :habit="habit" />
  </div>
</template>
