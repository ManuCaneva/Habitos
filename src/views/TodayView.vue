<script setup lang="ts">
import { computed } from "vue";
import { useHabitsStore } from "@/stores/habits";
import HabitCard from "@/components/habits/HabitCard.vue";
import NewHabitCard from "@/components/habits/NewHabitCard.vue";
import EmptyState from "@/components/habits/EmptyState.vue";

const habits = useHabitsStore();

const list = computed(() => habits.activeHabits);
const logs = computed(() => habits.logs);
</script>

<template>
  <div class="w-full max-w-sm" data-testid="habits-panel">
    <div
      data-testid="habits-container"
      class="bg-surface-2 rounded-2xl p-3 flex flex-col gap-2"
    >
      <EmptyState v-if="list.length === 0" />
      <template v-else>
        <HabitCard
          v-for="habit in list"
          :key="habit.id"
          :habit="habit"
          :logs="logs.filter((l) => l.habit_id === habit.id)"
        />
        <NewHabitCard />
      </template>
    </div>
  </div>
</template>
