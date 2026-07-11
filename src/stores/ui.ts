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

  const editMode = ref(false);

  const createHabitOpen = ref(false);
  const editingHabitId = ref<string | null>(null);
  const menuOpenForHabitId = ref<string | null>(null);

  const createTaskOpen = ref(false);
  const editingTaskId = ref<string | null>(null);
  const menuOpenForTaskId = ref<string | null>(null);

  const createGoalOpen = ref(false);
  const editingGoalId = ref<string | null>(null);
  const menuOpenForGoalId = ref<string | null>(null);

  const isEditing = computed(() => editingHabitId.value !== null);
  const isEditingTask = computed(() => editingTaskId.value !== null);
  const isEditingGoal = computed(() => editingGoalId.value !== null);

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode;
    menuOpenForHabitId.value = null;
    menuOpenForTaskId.value = null;
    menuOpenForGoalId.value = null;
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

  function openCreateTask() {
    editingTaskId.value = null;
    createTaskOpen.value = true;
    menuOpenForTaskId.value = null;
  }

  function openEditTask(id: string) {
    editingTaskId.value = id;
    createTaskOpen.value = true;
    menuOpenForTaskId.value = null;
  }

  function closeTaskModal() {
    createTaskOpen.value = false;
    editingTaskId.value = null;
  }

  function toggleTaskMenu(taskId: string) {
    menuOpenForTaskId.value = menuOpenForTaskId.value === taskId ? null : taskId;
  }

  function closeTaskMenu() {
    menuOpenForTaskId.value = null;
  }

  function openCreateGoal() {
    editingGoalId.value = null;
    createGoalOpen.value = true;
    menuOpenForGoalId.value = null;
  }

  function openEditGoal(id: string) {
    editingGoalId.value = id;
    createGoalOpen.value = true;
    menuOpenForGoalId.value = null;
  }

  function closeGoalModal() {
    createGoalOpen.value = false;
    editingGoalId.value = null;
  }

  function toggleGoalMenu(goalId: string) {
    menuOpenForGoalId.value = menuOpenForGoalId.value === goalId ? null : goalId;
  }

  function closeGoalMenu() {
    menuOpenForGoalId.value = null;
  }

  return {
    viewMode,
    sidebarCollapsed,
    editMode,
    createHabitOpen,
    editingHabitId,
    menuOpenForHabitId,
    isEditing,
    createTaskOpen,
    editingTaskId,
    menuOpenForTaskId,
    isEditingTask,
    createGoalOpen,
    editingGoalId,
    menuOpenForGoalId,
    isEditingGoal,
    setViewMode,
    toggleSidebar,
    toggleEditMode,
    openCreate,
    openEdit,
    closeModal,
    toggleMenu,
    closeMenu,
    openCreateTask,
    openEditTask,
    closeTaskModal,
    toggleTaskMenu,
    closeTaskMenu,
    openCreateGoal,
    openEditGoal,
    closeGoalModal,
    toggleGoalMenu,
    closeGoalMenu,
  };

});
