<script setup lang="ts">
import { computed } from "vue";
import { useGoalsStore } from "@/stores/goals";
import { useUiStore } from "@/stores/ui";
import GoalCard from "@/components/goals/GoalCard.vue";
import NewGoalCard from "@/components/goals/NewGoalCard.vue";
import GoalContextMenu from "@/components/goals/GoalContextMenu.vue";
import Text from "@/components/ui/Text.vue";

const goals = useGoalsStore();
const ui = useUiStore();

const list = computed(() => goals.goals);

function getGoalById(id: string) {
  return goals.goals.find((g) => g.id === id);
}
</script>

<template>
  <div
    data-testid="goals-panel"
    class="h-full flex flex-col overflow-hidden"
  >
    <div class="flex items-center justify-between px-3 py-2 border-b border-hairline">
      <Text variant="subhead" weight="600">
        Objetivos
      </Text>
      <Text variant="caption" color="muted">
        {{ list.length }}
      </Text>
    </div>

    <div class="flex-1 overflow-y-auto scrollbar-gutter-stable">
      <div v-if="list.length === 0" class="flex items-center justify-center h-full">
        <Text variant="body" color="muted">
          No hay objetivos
        </Text>
      </div>

      <div v-else class="flex flex-col gap-2 p-3">
        <GoalCard
          v-for="goal in list"
          :key="goal.id"
          :goal="goal"
          @toggle:menu="ui.toggleGoalMenu(goal.id)"
        />
      </div>

      <NewGoalCard />
    </div>

    <GoalContextMenu
      v-if="ui.menuOpenForGoalId && getGoalById(ui.menuOpenForGoalId)"
      :goal="getGoalById(ui.menuOpenForGoalId)!"
    />
  </div>
</template>
