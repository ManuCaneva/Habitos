<script setup lang="ts">
import { useUiStore } from "@/stores/ui";
import { useGoalsStore } from "@/stores/goals";
import type { Goal } from "@/schemas/goals";
import EntityContextMenu from "@/components/ui/EntityContextMenu.vue";

const props = defineProps<{ goal: Goal }>();

const ui = useUiStore();
const goals = useGoalsStore();

function handleEdit() {
  ui.openEditGoal(props.goal.id);
}

async function handleArchiveToggle() {
  try {
    if (props.goal.archived_at) {
      await goals.restoreGoal(props.goal.id);
    } else {
      await goals.archiveGoal(props.goal.id);
    }
  } finally {
    ui.closeGoalMenu();
  }
}
</script>

<template>
  <EntityContextMenu
    :entity-id="goal.id"
    :is-archived="!!goal.archived_at"
    trigger-data-attr="data-goal-menu-trigger"
    @edit="handleEdit"
    @archive-toggle="handleArchiveToggle"
    @close="ui.closeGoalMenu()"
  />
</template>
