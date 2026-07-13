<script setup lang="ts">
import { computed } from "vue";
import { useGoalsStore } from "@/stores/goals";
import GoalCard from "@/components/goals/GoalCard.vue";
import NewGoalCard from "@/components/goals/NewGoalCard.vue";
import EmptyState from "@/components/goals/EmptyState.vue";
import EntityListing from "@/components/ui/EntityListing.vue";

const goals = useGoalsStore();

const list = computed(() => goals.goals);
</script>

<template>
  <EntityListing title="Objetivos" panel-test-id="goals-panel" entity-class="goals">
    <EmptyState v-if="list.length === 0" />
    <div v-else class="flex flex-col gap-2">
      <GoalCard
        v-for="goal in list"
        :key="goal.id"
        :goal="goal"
      />
    </div>
    <template #footer>
      <NewGoalCard />
    </template>
  </EntityListing>
</template>
