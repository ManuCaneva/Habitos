<script setup lang="ts">
import { useUiStore } from "@/stores/ui";
import { useTasksStore } from "@/stores/tasks";
import type { Task } from "@/schemas/tasks";
import EntityContextMenu from "@/components/ui/EntityContextMenu.vue";

const props = defineProps<{ task: Task }>();

const ui = useUiStore();
const tasks = useTasksStore();

function handleEdit() {
  ui.openEditTask(props.task.id);
}

async function handleArchiveToggle() {
  try {
    if (props.task.archived_at) {
      await tasks.restoreTask(props.task.id);
    } else {
      await tasks.archiveTask(props.task.id);
    }
  } finally {
    ui.closeTaskMenu();
  }
}
</script>

<template>
  <EntityContextMenu
    :entity-id="task.id"
    :is-archived="!!task.archived_at"
    trigger-data-attr="data-task-menu-trigger"
    @edit="handleEdit"
    @archive-toggle="handleArchiveToggle"
    @close="ui.closeTaskMenu()"
  />
</template>
