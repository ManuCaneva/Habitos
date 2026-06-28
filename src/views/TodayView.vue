<script setup lang="ts">
import { computed } from "vue";
import { useHabitsStore } from "@/stores/habits";
import HabitList from "@/components/habits/HabitList.vue";
import EmptyState from "@/components/habits/EmptyState.vue";

const habits = useHabitsStore();

const list = computed(() => habits.activeHabits);
</script>

<template>
  <main>
    <EmptyState v-if="list.length === 0" />
    <HabitList v-else :habits="list" />
  </main>
</template>
