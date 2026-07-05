<script setup lang="ts">
import { computed } from "vue";
import { Sun, Moon, PanelLeftClose, PanelLeftOpen, CheckSquare, Archive, Settings } from "lucide-vue-next";
import { useUiStore, type ViewMode } from "@/stores/ui";
import { useTheme } from "@/composables/useTheme";
import Text from "@/components/ui/Text.vue";

const ui = useUiStore();
const { isDark, toggleDark } = useTheme();

interface NavItem {
  id: ViewMode;
  label: string;
  icon: typeof CheckSquare;
}

const navItems: readonly NavItem[] = [
  { id: "today", label: "Hoy", icon: CheckSquare },
  { id: "archived", label: "Archivados", icon: Archive },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

const themeIcon = computed(() => (isDark.value ? Sun : Moon));
const themeLabel = computed(() =>
  isDark.value ? "Cambiar a tema claro" : "Cambiar a tema oscuro",
);
const collapseIcon = computed(() =>
  ui.sidebarCollapsed ? PanelLeftOpen : PanelLeftClose,
);
</script>

<template>
  <aside
    :class="[
      'flex flex-col h-screen bg-canvas border-r border-hairline transition-all duration-200',
      ui.sidebarCollapsed ? 'w-[40px]' : 'w-28',
    ]"
  >
    <div class="flex items-center gap-1 px-2 py-2 border-b border-hairline">
      <span class="text-headline text-primary shrink-0" aria-hidden="true">◉</span>
      <Text
        v-if="!ui.sidebarCollapsed"
        variant="body-sm"
        weight="600"
        class="truncate"
      >
        Hábitos
      </Text>
    </div>

    <nav class="flex-1 px-1 py-1.5 flex flex-col gap-0.5">
      <button
        v-for="item in navItems"
        :key="item.id"
        type="button"
        :class="[
          'flex items-center gap-1.5 px-1.5 py-1 rounded-md transition-colors duration-150',
          'text-caption font-medium',
          ui.viewMode === item.id
            ? 'bg-surface-2 text-ink'
            : 'text-ink-muted hover:text-ink hover:bg-surface-1',
        ]"
        @click="ui.setViewMode(item.id)"
      >
        <component :is="item.icon" :size="18" class="shrink-0" />
        <span v-if="!ui.sidebarCollapsed" class="truncate">{{ item.label }}</span>
      </button>
    </nav>

    <div class="px-1 py-1.5 flex flex-col gap-0.5 border-t border-hairline">
      <button
        type="button"
        class="flex items-center gap-1.5 px-1.5 py-1 rounded-md transition-colors duration-150 text-ink-muted hover:text-ink hover:bg-surface-1 text-caption font-medium"
        :aria-label="themeLabel"
        :title="themeLabel"
        @click="toggleDark()"
      >
        <component :is="themeIcon" :size="18" class="shrink-0" />
        <span v-if="!ui.sidebarCollapsed" class="truncate">
          {{ isDark ? "Tema claro" : "Tema oscuro" }}
        </span>
      </button>
      <button
        type="button"
        class="flex items-center gap-1.5 px-1.5 py-1 rounded-md transition-colors duration-150 text-ink-muted hover:text-ink hover:bg-surface-1 text-caption font-medium"
        aria-label="Colapsar sidebar"
        title="Colapsar sidebar"
        @click="ui.toggleSidebar()"
      >
        <component :is="collapseIcon" :size="18" class="shrink-0" />
        <span v-if="!ui.sidebarCollapsed" class="truncate">Colapsar</span>
      </button>
    </div>
  </aside>
</template>
