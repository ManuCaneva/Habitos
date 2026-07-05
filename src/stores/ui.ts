import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useStorage } from "@vueuse/core";

export type ViewMode = "dashboard" | "archived" | "settings";

const VALID_MODES: readonly ViewMode[] = ["dashboard", "archived", "settings"];

function isViewMode(v: unknown): v is ViewMode {
  return typeof v === "string" && (VALID_MODES as readonly string[]).includes(v);
}

export const useUiStore = defineStore("ui", () => {
  const stored = useStorage<ViewMode>("habitos.viewMode", "dashboard", undefined, {
    serializer: {
      read: (raw) => {
        try {
          const parsed: unknown = JSON.parse(raw);
          return isViewMode(parsed) ? parsed : "dashboard";
        } catch {
          return "dashboard";
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

  const editMode = useStorage<boolean>("habitos.editMode", false);

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

  function toggleEditMode() {
    editMode.value = !editMode.value;
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
    editMode,
    createHabitOpen,
    editingHabitId,
    menuOpenForHabitId,
    isEditing,
    setViewMode,
    toggleSidebar,
    toggleEditMode,
    openCreate,
    openEdit,
    closeModal,
    toggleMenu,
    closeMenu,
  };

});
