<script setup lang="ts">
import { computed } from "vue";
import { useGoalsStore } from "@/stores/goals";
import { useUiStore } from "@/stores/ui";
import GoalCard from "@/components/goals/GoalCard.vue";
import NewGoalCard from "@/components/goals/NewGoalCard.vue";
import GoalContextMenu from "@/components/goals/GoalContextMenu.vue";
import EmptyState from "@/components/goals/EmptyState.vue";
import EntityListing from "@/components/ui/EntityListing.vue";

const goals = useGoalsStore();
const ui = useUiStore();

const list = computed(() => goals.goals);

function getGoalById(id: string) {
  return goals.goals.find((g) => g.id === id);
}
</script>

<template>
  <EntityListing title="Objetivos" panel-test-id="goals-panel" entity-class="goals">
    <EmptyState v-if="list.length === 0" />
    <div v-else class="flex flex-col gap-2">
      <GoalCard
        v-for="goal in list"
        :key="goal.id"
        :goal="goal"
        @toggle:menu="ui.toggleGoalMenu(goal.id)"
      />
    </div>
    <NewGoalCard />
    <GoalContextMenu
      v-if="ui.menuOpenForGoalId && getGoalById(ui.menuOpenForGoalId)"
      :goal="getGoalById(ui.menuOpenForGoalId)!"
    />
  </EntityListing>
</template>
