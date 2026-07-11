<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from "vue";
import { Pencil, Trash2 } from "lucide-vue-next";
import { useUiStore } from "@/stores/ui";
import { useGoalsStore } from "@/stores/goals";
import type { Goal } from "@/schemas/goals";

const props = defineProps<{ goal: Goal }>();

const ui = useUiStore();
const goals = useGoalsStore();

const menuRef = ref<HTMLDivElement | null>(null);
const position = ref({ top: 0, left: 0 });

function updatePosition() {
  const trigger = document.querySelector(
    `[data-goal-menu-trigger="${props.goal.id}"]`,
  );
  if (trigger) {
    const rect = trigger.getBoundingClientRect();
    position.value = {
      top: rect.bottom + 4,
      left: rect.right - 176,
    };
  }
}

function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    const target = e.target as HTMLElement;
    if (target.closest(`[data-goal-menu-trigger="${props.goal.id}"]`)) {
      return;
    }
    ui.closeGoalMenu();
  }
}

onMounted(() => {
  nextTick(updatePosition);
  document.addEventListener("mousedown", handleClickOutside);
});

onUnmounted(() => document.removeEventListener("mousedown", handleClickOutside));

function handleEdit() {
  ui.openEditGoal(props.goal.id);
}

async function handleDelete() {
  try {
    await goals.deleteGoal(props.goal.id);
  } finally {
    ui.closeGoalMenu();
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      ref="menuRef"
      :style="{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 50,
      }"
      class="w-44 bg-surface-2 border border-hairline-strong rounded-md shadow-xl py-1 animate-fade-in"
      role="menu"
    >
      <button
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-ink hover:bg-surface-3 transition-colors"
        role="menuitem"
        @click="handleEdit"
      >
        <Pencil :size="14" />
        Editar
      </button>
      <button
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-red-400 hover:bg-surface-3 transition-colors"
        role="menuitem"
        @click="handleDelete"
      >
        <Trash2 :size="14" />
        Eliminar
      </button>
    </div>
  </Teleport>
</template>
