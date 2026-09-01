<script setup lang="ts">
import { computed } from 'vue'
import {
  PanelLeftClose,
  PanelLeftOpen,
  CheckSquare,
  Archive,
  Settings,
  Pencil,
  Timer,
} from 'lucide-vue-next'
import { useUiStore, type ViewMode } from '@/stores/ui'
import Text from '@/components/ui/Text.vue'

const ui = useUiStore()

interface NavItem {
  id: ViewMode
  label: string
  icon: typeof CheckSquare
}

const navItems: readonly NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: CheckSquare },
  { id: 'archived', label: 'Archivados', icon: Archive },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
] as const

const collapseIcon = computed(() => (ui.sidebarCollapsed ? PanelLeftOpen : PanelLeftClose))
</script>

<template>
  <aside
    :class="[
      'flex h-screen flex-col border-r border-hairline bg-canvas transition-all duration-200',
      ui.sidebarCollapsed ? 'w-[40px]' : 'w-28',
    ]"
  >
    <div class="flex items-center gap-1 border-b border-hairline px-2 py-2">
      <span class="shrink-0 text-headline text-primary" aria-hidden="true">◉</span>
      <Text v-if="!ui.sidebarCollapsed" variant="body-sm" weight="600" class="truncate">
        AEON
      </Text>
    </div>

    <nav class="flex flex-1 flex-col gap-0.5 px-1 py-1.5">
      <button
        v-for="item in navItems"
        :key="item.id"
        type="button"
        :class="[
          'flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors duration-150',
          'text-caption font-medium',
          ui.viewMode === item.id
            ? 'bg-surface-2 text-ink'
            : 'text-ink-muted hover:bg-surface-1 hover:text-ink',
        ]"
        :data-testid="`nav-${item.id}`"
        @click="ui.setViewMode(item.id)"
      >
        <component :is="item.icon" :size="18" class="shrink-0" />
        <span v-if="!ui.sidebarCollapsed" class="truncate">{{ item.label }}</span>
      </button>
    </nav>

    <div class="flex flex-col gap-0.5 border-t border-hairline px-1 py-1.5">
      <button
        type="button"
        :class="[
          'flex items-center gap-1.5 rounded-md px-1.5 py-1 text-caption font-medium transition-colors duration-150',
          ui.editMode
            ? 'bg-surface-2 text-ink'
            : 'text-ink-muted hover:bg-surface-1 hover:text-ink',
        ]"
        aria-label="Modo edición"
        title="Modo edición"
        @click="ui.toggleEditMode()"
      >
        <Pencil :size="18" class="shrink-0" />
        <span v-if="!ui.sidebarCollapsed" class="truncate">Modo Edición</span>
      </button>
      <button
        type="button"
        :class="[
          'flex items-center gap-1.5 rounded-md px-1.5 py-1 text-caption font-medium transition-colors duration-150',
          ui.viewMode === 'settings'
            ? 'bg-surface-2 text-ink'
            : 'text-ink-muted hover:bg-surface-1 hover:text-ink',
        ]"
        aria-label="Settings"
        title="Settings"
        @click="ui.setViewMode('settings')"
      >
        <Settings :size="18" class="shrink-0" />
        <span v-if="!ui.sidebarCollapsed" class="truncate">Settings</span>
      </button>
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-caption font-medium text-ink-muted transition-colors duration-150 hover:bg-surface-1 hover:text-ink"
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
