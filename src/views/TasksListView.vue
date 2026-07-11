<script setup lang="ts">
import { computed } from "vue";
import { useTasksStore } from "@/stores/tasks";
import { useUiStore } from "@/stores/ui";
import TaskCard from "@/components/tasks/TaskCard.vue";
import NewTaskCard from "@/components/tasks/NewTaskCard.vue";
import TaskContextMenu from "@/components/tasks/TaskContextMenu.vue";
import EmptyState from "@/components/tasks/EmptyState.vue";
import EntityListing from "@/components/ui/EntityListing.vue";

const tasks = useTasksStore();
const ui = useUiStore();

const list = computed(() => tasks.pendingTasks);

function getTaskById(id: string) {
  return tasks.tasks.find((t) => t.id === id);
}
</script>

<template>
  <EntityListing title="Tareas" panel-test-id="tasks-panel" entity-class="tasks">
    <EmptyState v-if="list.length === 0" />
    <div v-else class="flex flex-col gap-2">
      <TaskCard
        v-for="task in list"
        :key="task.id"
        :task="task"
        @toggle:menu="ui.toggleTaskMenu(task.id)"
      />
    </div>
    <NewTaskCard />
    <TaskContextMenu
      v-if="ui.menuOpenForTaskId && getTaskById(ui.menuOpenForTaskId)"
      :task="getTaskById(ui.menuOpenForTaskId)!"
    />
  </EntityListing>
</template>
