<script setup lang="ts">
import { computed } from "vue";
import { useHabitsStore } from "@/stores/habits";
import HabitCard from "@/components/habits/HabitCard.vue";
import NewHabitCard from "@/components/habits/NewHabitCard.vue";
import EmptyState from "@/components/habits/EmptyState.vue";
import HabitSection from "@/components/habits/HabitSection.vue";

const habits = useHabitsStore();

const list = computed(() => habits.activeHabits);
const logs = computed(() => habits.logs);
</script>

<template>
  <div class="w-[15%] self-start" data-testid="habits-panel">
    <HabitSection>
      <EmptyState v-if="list.length === 0" />
      <div v-else class="flex flex-col gap-1">
        <HabitCard
          v-for="habit in list"
          :key="`${habit.id}-${habit.updated_at}`"
          :habit="habit"
          :logs="logs.filter((l) => l.habit_id === habit.id)"
        />
        <NewHabitCard />
      </div>
    </HabitSection>
  </div>
</template>
