<script setup lang="ts">
import { useUiStore } from "@/stores/ui";
import NewEntityCard from "@/components/ui/NewEntityCard.vue";

const ui = useUiStore();
</script>

<template>
  <NewEntityCard
    label="Nueva tarea"
    aria-label="Crear nueva tarea"
    data-testid="new-task-card"
    css-class="task-card-responsive new-task-card"
    @create="ui.openCreateTask()"
  />
</template>
