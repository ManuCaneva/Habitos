<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from "vue";
import { Pencil, Archive, ArchiveRestore } from "lucide-vue-next";
import { useUiStore } from "@/stores/ui";
import { useHabitsStore } from "@/stores/habits";
import type { Habit } from "@/schemas/habits";

const props = defineProps<{ habit: Habit }>();

const ui = useUiStore();
const habits = useHabitsStore();

const menuRef = ref<HTMLDivElement | null>(null);
const position = ref({ top: 0, left: 0 });

function updatePosition() {
  const trigger = document.querySelector(
    `[data-habit-menu-trigger="${props.habit.id}"]`,
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
    if (target.closest(`[data-habit-menu-trigger="${props.habit.id}"]`)) {
      return;
    }
    ui.closeMenu();
  }
}

onMounted(() => {
  nextTick(updatePosition);
  document.addEventListener("mousedown", handleClickOutside);
});

onUnmounted(() => document.removeEventListener("mousedown", handleClickOutside));

function handleEdit() {
  ui.openEdit(props.habit.id);
}

async function handleArchiveToggle() {
  try {
    if (props.habit.archived_at) {
      await habits.restoreHabit(props.habit.id);
    } else {
      await habits.archiveHabit(props.habit.id);
    }
  } finally {
    ui.closeMenu();
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
        :class="[
          'w-full flex items-center gap-2 px-3 py-2 text-body-sm transition-colors',
          'hover:bg-surface-3',
          habit.archived_at ? 'text-ink' : 'text-red-400',
        ]"
        role="menuitem"
        @click="handleArchiveToggle"
      >
        <Archive v-if="!habit.archived_at" :size="14" />
        <ArchiveRestore v-else :size="14" />
        {{ habit.archived_at ? "Restaurar" : "Archivar" }}
      </button>
    </div>
  </Teleport>
</template>
