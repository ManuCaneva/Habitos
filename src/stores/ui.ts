import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useStorage } from "@vueuse/core";

export type ViewMode = "today" | "archived" | "settings";

const VALID_MODES: readonly ViewMode[] = ["today", "archived", "settings"];

function isViewMode(v: unknown): v is ViewMode {
  return typeof v === "string" && (VALID_MODES as readonly string[]).includes(v);
}

export const useUiStore = defineStore("ui", () => {
  const stored = useStorage<ViewMode>("habitos.viewMode", "today", undefined, {
    serializer: {
      read: (raw) => {
        try {
          const parsed: unknown = JSON.parse(raw);
          return isViewMode(parsed) ? parsed : "today";
        } catch {
          return "today";
        }
      },
      write: (v) => JSON.stringify(v),
    },
  });

  const viewMode = ref<ViewMode>(stored.value);

  watch(viewMode, (v) => {
    stored.value = v;
  });

  const sidebarCollapsed = useStorage<boolean>("habitos.sidebarCollapsed", false);

  const createHabitOpen = ref(false);
  const editingHabitId = ref<string | null>(null);
  const menuOpenForHabitId = ref<string | null>(null);

  const isEditing = computed(() => editingHabitId.value !== null);

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode;
    menuOpenForHabitId.value = null;
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function openCreate() {
    editingHabitId.value = null;
    createHabitOpen.value = true;
    menuOpenForHabitId.value = null;
  }

  function openEdit(id: string) {
    editingHabitId.value = id;
    createHabitOpen.value = true;
    menuOpenForHabitId.value = null;
  }

  function closeModal() {
    createHabitOpen.value = false;
    editingHabitId.value = null;
  }

  function toggleMenu(habitId: string) {
    menuOpenForHabitId.value = menuOpenForHabitId.value === habitId ? null : habitId;
  }

  function closeMenu() {
    menuOpenForHabitId.value = null;
  }

  return {
    viewMode,
    sidebarCollapsed,
    createHabitOpen,
    editingHabitId,
    menuOpenForHabitId,
    isEditing,
    setViewMode,
    toggleSidebar,
    openCreate,
    openEdit,
    closeModal,
    toggleMenu,
    closeMenu,
  };
});
