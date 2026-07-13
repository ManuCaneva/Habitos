<script setup lang="ts">
import { ref, computed } from "vue";
import { MoreHorizontal, Check } from "lucide-vue-next";
import type { Task } from "@/schemas/tasks";
import { useTasksStore, daysUntilDue, urgencyLevel, deadlineProgress } from "@/stores/tasks";
import { useUiStore } from "@/stores/ui";
import Container from "@/components/ui/Container.vue";
import Text from "@/components/ui/Text.vue";
import TaskContextMenu from "./TaskContextMenu.vue";

const props = defineProps<{
  task: Task;
}>();

const store = useTasksStore();
const ui = useUiStore();

const isMenuOpen = computed(() => ui.menuOpenForTaskId === props.task.id);

const expanded = ref(false);

const completedSteps = computed(() => props.task.steps.filter((s) => s.done).length);
const totalSteps = computed(() => props.task.steps.length);
const hasSteps = computed(() => totalSteps.value > 0);
const allStepsDone = computed(() => hasSteps.value && props.task.steps.every((s) => s.done));
const canComplete = computed(() => !hasSteps.value || allStepsDone.value);
const hasDeadline = computed(() => props.task.due_date !== null);

const urgency = computed(() => urgencyLevel(props.task.due_date));

const urgencyLabel = computed(() => {
  if (!props.task.due_date) return "";
  const days = daysUntilDue(props.task.due_date);
  if (days < 0) return `Vencida hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? "s" : ""}`;
  if (days === 0) return "Vence hoy";
  return `Faltan ${days} día${days !== 1 ? "s" : ""}`;
});

const urgencyColor = computed(() => {
  switch (urgency.value) {
    case "overdue":
      return "text-red-500";
    case "warning":
      return "text-primary";
    default:
      return "text-ink-tertiary";
  }
});

const progress = computed(() => {
  if (!props.task.due_date) return null;
  return deadlineProgress(props.task.created_at, props.task.due_date);
});

const progressColor = computed(() => {
  if (urgency.value === "overdue") return "bg-red-500";
  return "bg-primary";
});

function toggleExpand() {
  expanded.value = !expanded.value;
}

function handleToggleStep(stepId: string) {
  store.toggleStep(props.task.id, stepId);
}

function handleComplete() {
  store.completeTask(props.task.id);
}
</script>

<template>
  <Container
    data-testid="task-card"
    variant="ghost"
    padding="sm"
    :class="['group relative task-card-responsive', isMenuOpen && 'z-10']"
  >
    <div class="flex items-start gap-3">
      <div
        data-testid="task-color-indicator"
        class="w-1 h-10 rounded-sm shrink-0 mt-0.5"
        :style="{ backgroundColor: task.color }"
      />

      <div
        class="flex-1 min-w-0 cursor-pointer"
        data-testid="task-card-body"
        @click="toggleExpand"
      >
        <div class="flex items-center gap-2 mb-1">
          <Text as="div" variant="body" weight="500" class="truncate">
            {{ task.title }}
          </Text>
          <button
            data-testid="task-menu-button"
            :data-task-menu-trigger="task.id"
            class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface-2"
            @click.stop="ui.toggleTaskMenu(task.id)"
          >
            <MoreHorizontal :size="16" class="text-ink-muted" />
          </button>
        </div>

        <Text
          v-if="task.description"
          data-testid="task-description"
          as="div"
          variant="body-sm"
          color="muted"
          class="truncate mb-2"
        >
          {{ task.description }}
        </Text>

        <div class="flex items-center gap-3 text-caption">
          <div v-if="hasSteps" data-testid="task-steps" class="flex items-center gap-1 text-ink-muted">
            <span>{{ completedSteps }}/{{ totalSteps }}</span>
          </div>

          <div
            v-if="hasDeadline"
            data-testid="task-deadline"
            class="flex items-center gap-1"
            :class="urgencyColor"
          >
            <span>{{ urgencyLabel }}</span>
          </div>
        </div>

        <div
          v-if="hasDeadline && progress !== null"
          data-testid="task-progress-bar"
          class="mt-2 h-1 bg-surface-2 rounded-full overflow-hidden"
        >
          <div
            :class="['h-full transition-all', progressColor]"
            :style="{ width: `${progress * 100}%` }"
          />
        </div>

        <div class="steps-expand mt-2" :class="{ open: expanded }">
          <div>
            <div
              v-if="expanded"
              data-testid="task-steps-list"
              class="flex flex-col gap-1 py-1"
            >
              <div
                v-for="step in task.steps"
                :key="step.id"
                data-testid="task-step-item"
                class="flex items-center gap-2 px-1 py-1 rounded hover:bg-surface-2 transition-colors"
              >
                <label
                  class="relative inline-flex h-4 w-4 shrink-0 items-center justify-center cursor-pointer"
                  @click.stop
                >
                  <input
                    type="checkbox"
                    :checked="step.done"
                    data-testid="task-step-checkbox"
                    class="peer absolute inset-0 cursor-pointer opacity-0"
                    @click.stop="handleToggleStep(step.id)"
                  />
                  <span
                    :class="[
                      'h-4 w-4 rounded border transition-colors duration-150 flex items-center justify-center',
                      step.done
                        ? 'bg-primary border-primary'
                        : 'bg-surface-1 border-hairline-strong',
                      'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-focus/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas',
                    ]"
                  >
                    <Check v-if="step.done" :size="12" class="text-white" stroke-width="3" />
                  </span>
                </label>
                <Text
                  as="span"
                  variant="body-sm"
                  :class="['truncate', step.done ? 'line-through text-ink-muted' : '']"
                >
                  {{ step.title }}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center shrink-0">
        <button
          data-testid="task-complete-btn"
          :disabled="!canComplete"
          :class="[
            'h-5 w-5 rounded border flex items-center justify-center transition-all duration-150',
            canComplete
              ? 'border-hairline-strong bg-surface-1 hover:bg-primary/20 hover:border-primary cursor-pointer'
              : 'border-hairline-light bg-surface-1/50 cursor-not-allowed opacity-30',
          ]"
          @click.stop="handleComplete"
        >
          <Check :size="14" stroke-width="3" class="text-transparent" />
        </button>
      </div>
    </div>
    <TaskContextMenu v-if="isMenuOpen" :task="task" />
  </Container>
</template>

<style scoped>
.steps-expand {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease;
  overflow: hidden;
}
.steps-expand.open {
  grid-template-rows: 1fr;
}
.steps-expand > div {
  min-height: 0;
}
</style>
