<script setup lang="ts">
import type { Habit } from "@/schemas/habits";
import HabitRow from "./HabitRow.vue";

defineProps<{
  habits: Habit[];
  showArchiveDate?: boolean;
}>();
</script>

<template>
  <div class="flex flex-col">
    <HabitRow
      v-for="habit in habits"
      :key="`${habit.id}-${habit.updated_at}`"
      :habit="habit"
      :show-archive-date="showArchiveDate"
    />
  </div>
</template>
