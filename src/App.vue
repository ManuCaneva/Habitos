<script setup lang="ts">
import { computed, onMounted } from "vue";
import { Sun, Moon } from "lucide-vue-next";
import { useHabitsStore } from "@/stores/habits";
import { useUiStore } from "@/stores/ui";
import { useTheme } from "@/composables/useTheme";
import Text from "@/components/ui/Text.vue";
import IconButton from "@/components/ui/IconButton.vue";
import TopBar from "@/components/layout/TopBar.vue";
import TabBar from "@/components/layout/TabBar.vue";
import TodayView from "@/views/TodayView.vue";
import ArchivedView from "@/views/ArchivedView.vue";
import SettingsView from "@/views/SettingsView.vue";
import HabitFormModal from "@/components/habits/HabitFormModal.vue";

const store = useHabitsStore();
const ui = useUiStore();
const { isDark, toggleDark } = useTheme();

onMounted(() => {
  store.loadInitialData();
});

const themeIcon = computed(() => (isDark.value ? Sun : Moon));
const themeLabel = computed(() =>
  isDark.value ? "Cambiar a tema claro" : "Cambiar a tema oscuro",
);
</script>

<template>
  <div class="min-h-screen bg-canvas text-ink flex flex-col">
    <header
      class="flex items-center justify-between px-6 py-3 border-b border-hairline bg-canvas"
    >
      <div class="flex items-center gap-2">
        <span class="text-headline text-primary" aria-hidden="true">◉</span>
        <Text variant="card-title" weight="600">Hábitos</Text>
      </div>
      <IconButton
        :label="themeLabel"
        variant="ghost"
        size="md"
        @click="toggleDark()"
      >
        <component :is="themeIcon" :size="16" />
      </IconButton>
    </header>

    <TopBar v-if="ui.viewMode !== 'settings'" />
    <TabBar />

    <div class="flex-1">
      <TodayView v-if="ui.viewMode === 'today'" />
      <ArchivedView v-else-if="ui.viewMode === 'archived'" />
      <SettingsView v-else-if="ui.viewMode === 'settings'" />
    </div>

    <HabitFormModal />
  </div>
</template>
