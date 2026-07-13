<script setup lang="ts">
import { computed } from "vue";
import { useTasksStore } from "@/stores/tasks";
import TaskCard from "@/components/tasks/TaskCard.vue";
import NewTaskCard from "@/components/tasks/NewTaskCard.vue";
import EmptyState from "@/components/tasks/EmptyState.vue";
import EntityListing from "@/components/ui/EntityListing.vue";

const tasks = useTasksStore();

const list = computed(() => tasks.pendingTasks);
</script>

<template>
  <EntityListing title="Tareas" panel-test-id="tasks-panel" entity-class="tasks">
    <EmptyState v-if="list.length === 0" />
    <div v-else class="flex flex-col gap-2">
      <TaskCard
        v-for="task in list"
        :key="task.id"
        :task="task"
      />
    </div>
    <template #footer>
      <NewTaskCard />
    </template>
  </EntityListing>
</template>
