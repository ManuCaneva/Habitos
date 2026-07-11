<script setup lang="ts">
import { useUiStore } from "@/stores/ui";
import NewEntityCard from "@/components/ui/NewEntityCard.vue";

const ui = useUiStore();
</script>

<template>
  <NewEntityCard
    label="Nuevo objetivo"
    aria-label="Crear nuevo objetivo"
    data-testid="new-goal-card"
    css-class="goal-card-responsive new-goal-card"
    @create="ui.openCreateGoal()"
  />
</template>
