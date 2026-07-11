<script setup lang="ts">
import { computed } from "vue";
import { useTasksStore } from "@/stores/tasks";
import { useUiStore } from "@/stores/ui";
import TaskCard from "@/components/tasks/TaskCard.vue";
import NewTaskCard from "@/components/tasks/NewTaskCard.vue";
import TaskContextMenu from "@/components/tasks/TaskContextMenu.vue";
import Text from "@/components/ui/Text.vue";

const tasks = useTasksStore();
const ui = useUiStore();

const list = computed(() => tasks.pendingTasks);

function getTaskById(id: string) {
  return tasks.tasks.find((t) => t.id === id);
}
</script>

<template>
  <div
    data-testid="tasks-panel"
    class="h-full flex flex-col overflow-hidden"
  >
    <div class="flex items-center justify-between px-3 py-2 border-b border-hairline">
      <Text variant="subhead" weight="600">
        Tareas
      </Text>
      <Text variant="caption" color="muted">
        {{ list.length }}
      </Text>
    </div>

    <div class="flex-1 overflow-y-auto scrollbar-gutter-stable">
      <div v-if="list.length === 0" class="flex items-center justify-center h-full">
        <Text variant="body" color="muted">
          No hay tareas pendientes
        </Text>
      </div>

      <div v-else class="flex flex-col gap-2 p-3">
        <TaskCard
          v-for="task in list"
          :key="task.id"
          :task="task"
          @toggle:menu="ui.toggleTaskMenu(task.id)"
        />
      </div>

      <NewTaskCard />
    </div>

    <TaskContextMenu
      v-if="ui.menuOpenForTaskId && getTaskById(ui.menuOpenForTaskId)"
      :task="getTaskById(ui.menuOpenForTaskId)!"
    />
  </div>
</template>
