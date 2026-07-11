import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useStorage } from "@vueuse/core";

export type ViewMode = "dashboard" | "archived" | "settings";

const VALID_MODES: readonly ViewMode[] = ["dashboard", "archived", "settings"];

function isViewMode(v: unknown): v is ViewMode {
  return typeof v === "string" && (VALID_MODES as readonly string[]).includes(v);
}

function createEntityUi() {
  const createOpen = ref(false);
  const editingId = ref<string | null>(null);
  const menuOpenForId = ref<string | null>(null);

  const isEditing = computed(() => editingId.value !== null);

  function openCreate() {
    editingId.value = null;
    createOpen.value = true;
    menuOpenForId.value = null;
  }

  function openEdit(id: string) {
    editingId.value = id;
    createOpen.value = true;
    menuOpenForId.value = null;
  }

  function closeModal() {
    createOpen.value = false;
    editingId.value = null;
  }

  function toggleMenu(entityId: string) {
    menuOpenForId.value = menuOpenForId.value === entityId ? null : entityId;
  }

  function closeMenu() {
    menuOpenForId.value = null;
  }

  return {
    createOpen,
    editingId,
    menuOpenForId,
    isEditing,
    openCreate,
    openEdit,
    closeModal,
    toggleMenu,
    closeMenu,
  };
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

  const editMode = ref(false);

  const habits = createEntityUi();
  const tasks = createEntityUi();
  const goals = createEntityUi();

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode;
    habits.closeMenu();
    tasks.closeMenu();
    goals.closeMenu();
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function toggleEditMode() {
    editMode.value = !editMode.value;
  }

  return {
    viewMode,
    sidebarCollapsed,
    editMode,
    isEditing: habits.isEditing,
    isEditingTask: tasks.isEditing,
    isEditingGoal: goals.isEditing,
    createHabitOpen: habits.createOpen,
    editingHabitId: habits.editingId,
    menuOpenForHabitId: habits.menuOpenForId,
    createTaskOpen: tasks.createOpen,
    editingTaskId: tasks.editingId,
    menuOpenForTaskId: tasks.menuOpenForId,
    createGoalOpen: goals.createOpen,
    editingGoalId: goals.editingId,
    menuOpenForGoalId: goals.menuOpenForId,
    setViewMode,
    toggleSidebar,
    toggleEditMode,
    openCreate: habits.openCreate,
    openEdit: habits.openEdit,
    closeModal: habits.closeModal,
    toggleMenu: habits.toggleMenu,
    closeMenu: habits.closeMenu,
    openCreateTask: tasks.openCreate,
    openEditTask: tasks.openEdit,
    closeTaskModal: tasks.closeModal,
    toggleTaskMenu: tasks.toggleMenu,
    closeTaskMenu: tasks.closeMenu,
    openCreateGoal: goals.openCreate,
    openEditGoal: goals.openEdit,
    closeGoalModal: goals.closeModal,
    toggleGoalMenu: goals.toggleMenu,
    closeGoalMenu: goals.closeMenu,
  };
});
