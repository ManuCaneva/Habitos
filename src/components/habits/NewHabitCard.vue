<script setup lang="ts">
import { useUiStore } from "@/stores/ui";
import NewEntityCard from "@/components/ui/NewEntityCard.vue";

const ui = useUiStore();
</script>

<template>
  <NewEntityCard
    label="Nuevo hábito"
    aria-label="Crear nuevo hábito"
    data-testid="new-habit-card"
    css-class="habit-card-responsive new-habit-card"
    @create="ui.openCreate()"
  />
</template>
