<script setup lang="ts">
import { useUiStore } from "@/stores/ui";
import { useHabitsStore } from "@/stores/habits";
import type { Habit } from "@/schemas/habits";
import EntityContextMenu from "@/components/ui/EntityContextMenu.vue";

const props = defineProps<{ habit: Habit }>();

const ui = useUiStore();
const habits = useHabitsStore();

function handleEdit() {
  ui.openEdit(props.habit.id);
}

async function handleArchiveToggle() {
  try {
    if (props.habit.archived_at) {
      await habits.restoreHabit(props.habit.id);
    } else {
      await habits.archiveHabit(props.habit.id);
    }
  } finally {
    ui.closeMenu();
  }
}
</script>

<template>
  <EntityContextMenu
    :entity-id="habit.id"
    :is-archived="!!habit.archived_at"
    trigger-data-attr="data-habit-menu-trigger"
    @edit="handleEdit"
    @archive-toggle="handleArchiveToggle"
    @close="ui.closeMenu()"
  />
</template>
