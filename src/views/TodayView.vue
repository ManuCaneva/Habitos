<script setup lang="ts">
import { computed } from "vue";
import { useHabitsStore } from "@/stores/habits";
import HabitCard from "@/components/habits/HabitCard.vue";
import NewHabitCard from "@/components/habits/NewHabitCard.vue";
import EmptyState from "@/components/habits/EmptyState.vue";
import HabitSection from "@/components/habits/HabitSection.vue";
import Text from "@/components/ui/Text.vue";

const habits = useHabitsStore();

const list = computed(() => habits.activeHabits);
const logs = computed(() => habits.logs);
const activeCount = computed(() => list.value.length);
</script>

<template>
  <div data-testid="habits-panel" class="h-full flex flex-col">
    <div
      data-testid="habits-header"
      class="shrink-0 bg-surface-2 px-3 py-2 border-b border-hairline flex items-baseline gap-1.5 habits-header-responsive"
    >
      <Text variant="card-title" weight="600" class="habits-header-title">Hábitos</Text>
      <Text variant="body-sm" color="muted" class="habits-header-count">· {{ activeCount }}</Text>
    </div>
    <div data-testid="habits-scroll" class="flex-1 overflow-auto p-1.5 scrollbar-gutter-stable">
      <HabitSection variant="flat">
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
  </div>
</template>
