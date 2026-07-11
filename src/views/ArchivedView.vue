<script setup lang="ts">
import { computed } from "vue";
import { useHabitsStore } from "@/stores/habits";
import HabitList from "@/components/habits/HabitList.vue";
import Text from "@/components/ui/Text.vue";

const habits = useHabitsStore();
const list = computed(() => habits.archivedHabits);
</script>

<template>
  <main class="h-full overflow-y-auto scrollbar-gutter-stable">
    <div v-if="list.length === 0" class="flex items-center justify-center py-section">
      <Text variant="subhead" color="muted">No tenés hábitos archivados.</Text>
    </div>
    <HabitList v-else :habits="list" show-archive-date />
  </main>
</template>
