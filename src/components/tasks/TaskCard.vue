<script setup lang="ts">
import { computed } from "vue";
import { MoreHorizontal } from "lucide-vue-next";
import type { Task } from "@/schemas/tasks";
import CycleCheckbox from "@/components/ui/CycleCheckbox.vue";
import Container from "@/components/ui/Container.vue";
import Text from "@/components/ui/Text.vue";
import { daysUntilDue, urgencyLevel, deadlineProgress } from "@/stores/tasks";

const props = defineProps<{
  task: Task;
}>();

const emit = defineEmits<{
  "update:status": [status: "todo" | "doing" | "done"];
  "toggle:menu": [];
}>();

const completedSteps = computed(() => props.task.steps.filter((s) => s.done).length);
const totalSteps = computed(() => props.task.steps.length);
const hasSteps = computed(() => totalSteps.value > 0);
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
</script>

<template>
  <Container
    data-testid="task-card"
    variant="ghost"
    padding="sm"
    class="group relative task-card-responsive"
  >
    <div class="flex items-start gap-3">
      <div
        data-testid="task-color-indicator"
        class="w-1 h-10 rounded-sm shrink-0 mt-0.5"
        :style="{ backgroundColor: task.color }"
      />

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <Text as="div" variant="body" weight="500" class="truncate">
            {{ task.title }}
          </Text>
          <button
            data-testid="task-menu-button"
            class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface-2"
            @click="emit('toggle:menu')"
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
      </div>

      <CycleCheckbox
        :model-value="task.status"
        @update:model-value="(status) => emit('update:status', status)"
      />
    </div>
  </Container>
</template>
