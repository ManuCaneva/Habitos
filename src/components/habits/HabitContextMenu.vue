<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { Pencil, Archive, ArchiveRestore } from "lucide-vue-next";
import { useUiStore } from "@/stores/ui";
import { useHabitsStore } from "@/stores/habits";
import type { Habit } from "@/schemas/habits";

const props = defineProps<{ habit: Habit }>();

const ui = useUiStore();
const habits = useHabitsStore();

const menuRef = ref<HTMLDivElement | null>(null);

function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    ui.closeMenu();
  }
}

onMounted(() => document.addEventListener("mousedown", handleClickOutside));
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
  <div
    ref="menuRef"
    class="absolute right-4 top-full mt-1 z-20 w-44 bg-surface-2 border border-hairline-strong rounded-md shadow-xl py-1 animate-fade-in"
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
</template>
