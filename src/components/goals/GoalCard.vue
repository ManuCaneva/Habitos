<script setup lang="ts">
import { computed } from "vue";
import { Plus, MoreHorizontal } from "lucide-vue-next";
import { useGoalsStore } from "@/stores/goals";
import { useUiStore } from "@/stores/ui";
import type { Goal } from "@/schemas/goals";
import Container from "@/components/ui/Container.vue";
import Text from "@/components/ui/Text.vue";
import IconButton from "@/components/ui/IconButton.vue";
import GoalContextMenu from "./GoalContextMenu.vue";

const props = defineProps<{ goal: Goal }>();

const goals = useGoalsStore();
const ui = useUiStore();

const isMenuOpen = computed(() => ui.menuOpenForGoalId === props.goal.id);

const currentProgress = computed(() => {
  const today = new Date().toISOString().split("T")[0];
  const periodStart = getPeriodStart(props.goal, today);
  return goals.logs
    .filter((l) => l.goal_id === props.goal.id && l.log_date >= periodStart && l.log_date <= today)
    .reduce((sum, l) => sum + l.amount, 0);
});

const progressPercent = computed(() => {
  return Math.min((currentProgress.value / props.goal.target) * 100, 100);
});

const isComplete = computed(() => {
  return currentProgress.value >= props.goal.target;
});

function getPeriodStart(goal: Goal, today: string): string {
  switch (goal.frequency.type) {
    case "daily":
      return today;
    case "weekly": {
      const d = new Date(today + "T00:00:00");
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    case "interval": {
      const createdDate = goal.created_at.split("T")[0];
      if (!createdDate) return today;
      const daysDiff = Math.round((new Date(today).getTime() - new Date(createdDate).getTime()) / 86400000);
      const intervalDays = goal.frequency.interval_days;
      const periodsPassed = Math.floor(daysDiff / intervalDays);
      const d = new Date(createdDate + "T00:00:00");
      d.setDate(d.getDate() + periodsPassed * intervalDays);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
  }
}

function frequencyLabel(): string {
  switch (props.goal.frequency.type) {
    case "daily":
      return "Diario";
    case "weekly":
      return "Semanal";
    case "interval":
      return `Cada ${props.goal.frequency.interval_days} días`;
  }
}

async function handleIncrement() {
  await goals.incrementLog(props.goal.id, 1);
}
</script>

<template>
  <Container
    data-testid="goal-card"
    variant="ghost"
    padding="sm"
    :class="['goal-card-responsive relative group', isMenuOpen && 'z-10']"
  >
    <div class="flex items-start gap-3">
      <div
        data-testid="goal-color-indicator"
        :style="{ backgroundColor: goal.color }"
        class="w-2 h-2 rounded-full mt-2 flex-shrink-0"
      />

      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <Text variant="body" weight="600" class="truncate">
              {{ goal.title }}
            </Text>
            <Text
              v-if="goal.description"
              data-testid="goal-description"
              variant="body-sm"
              color="muted"
              class="truncate block"
            >
              {{ goal.description }}
            </Text>
          </div>

          <IconButton
            data-testid="goal-menu-button"
            :data-goal-menu-trigger="goal.id"
            variant="ghost"
            size="sm"
            label="Menú"
            @click.stop="ui.toggleGoalMenu(goal.id)"
          >
            <MoreHorizontal :size="16" />
          </IconButton>
        </div>

        <div class="mt-2 flex items-center gap-3">
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <Text variant="body-sm" :color="isComplete ? 'success' : 'default'">
                {{ currentProgress }}/{{ goal.target }}
                <span v-if="goal.unit" class="text-ink-muted">{{ goal.unit }}</span>
              </Text>
              <Text variant="caption" color="muted">
                {{ frequencyLabel() }}
              </Text>
            </div>
            <div
              data-testid="goal-progress-bar"
              class="h-1.5 bg-surface-2 rounded-full overflow-hidden"
            >
              <div
                :style="{
                  width: `${progressPercent}%`,
                  backgroundColor: goal.color,
                }"
                class="h-full transition-all duration-300"
              />
            </div>
          </div>

          <button
            data-testid="goal-increment-button"
            :disabled="isComplete"
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
              isComplete
                ? 'bg-success/20 text-success cursor-not-allowed'
                : 'bg-surface-2 hover:bg-surface-3 text-ink',
            ]"
            @click="handleIncrement"
          >
            <Plus :size="16" />
          </button>
        </div>
      </div>
    </div>
    <GoalContextMenu v-if="isMenuOpen" :goal="goal" />
  </Container>
</template>
