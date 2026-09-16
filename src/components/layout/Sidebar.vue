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

interface NavRow {
  key: string
  label: string
  icon: typeof CheckSquare
  dot: string
  active: boolean
  select: () => void
}

const navItems: readonly { id: ViewMode; label: string; icon: typeof CheckSquare; dot: string }[] =
  [
    { id: 'dashboard', label: 'Dashboard', icon: CheckSquare, dot: 'bg-primary' },
    { id: 'archived', label: 'Archivados', icon: Archive, dot: 'bg-accent-orange' },
    { id: 'pomodoro', label: 'Pomodoro', icon: Timer, dot: 'bg-accent-green' },
  ] as const

const navRows = computed<NavRow[]>(() =>
  navItems.map((item) => ({
    key: item.id,
    label: item.label,
    icon: item.icon,
    dot: item.dot,
    active: ui.viewMode === item.id,
    select: () => ui.setViewMode(item.id),
  }))
)

const systemRows = computed<NavRow[]>(() => [
  {
    key: 'edit-mode',
    label: 'Modo Edición',
    icon: Pencil,
    dot: ui.editMode ? 'bg-accent-orange' : 'bg-ink-tertiary',
    active: ui.editMode,
    select: () => ui.toggleEditMode(),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    dot: 'bg-accent-purple',
    active: ui.viewMode === 'settings',
    select: () => ui.setViewMode('settings'),
  },
])

const collapseIcon = computed(() => (ui.sidebarCollapsed ? PanelLeftOpen : PanelLeftClose))

const rowBase =
  'group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-caption font-medium transition-colors duration-150'
const rowIdle = 'text-ink-muted hover:bg-surface-2 hover:text-ink'
const rowActive = 'bg-surface-3 text-ink'
</script>

<template>
  <aside
    :class="[
      'flex h-full flex-col rounded-xl border border-hairline bg-surface-1 transition-all duration-200',
      ui.sidebarCollapsed ? 'w-14' : 'w-56',
    ]"
  >
    <div data-testid="sidebar-header" class="flex items-center gap-2 px-2 py-2.5">
      <Text
        v-if="!ui.sidebarCollapsed"
        variant="body-sm"
        weight="600"
        class="min-w-0 flex-1 truncate"
      >
        AEON
      </Text>
      <button
        type="button"
        data-testid="sidebar-toggle"
        class="flex shrink-0 items-center justify-center rounded-md px-1.5 py-1.5 text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
        aria-label="Colapsar sidebar"
        title="Colapsar sidebar"
        @click="ui.toggleSidebar()"
      >
        <component :is="collapseIcon" :size="16" class="shrink-0" />
      </button>
    </div>

    <nav class="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-1">
      <Text v-if="!ui.sidebarCollapsed" variant="eyebrow" color="subtle" class="px-2 pb-1 pt-2">
        Navegación
      </Text>
      <button
        v-for="row in navRows"
        :key="row.key"
        type="button"
        :class="[rowBase, row.active ? rowActive : rowIdle]"
        :data-testid="`nav-${row.key}`"
        @click="row.select()"
      >
        <component :is="row.icon" :size="18" class="shrink-0" />
        <template v-if="!ui.sidebarCollapsed">
          <span class="min-w-0 flex-1 truncate text-left">{{ row.label }}</span>
          <span :class="['h-1.5 w-1.5 shrink-0 rounded-full', row.dot]" aria-hidden="true" />
        </template>
      </button>
    </nav>

    <div class="flex flex-col gap-1 border-t border-hairline px-2 py-2">
      <Text v-if="!ui.sidebarCollapsed" variant="eyebrow" color="subtle" class="px-2 pb-1 pt-1">
        Sistema
      </Text>
      <button
        v-for="row in systemRows"
        :key="row.key"
        type="button"
        :class="[rowBase, row.active ? rowActive : rowIdle]"
        :data-testid="`nav-${row.key}`"
        :aria-label="row.label"
        :title="row.label"
        @click="row.select()"
      >
        <component :is="row.icon" :size="18" class="shrink-0" />
        <template v-if="!ui.sidebarCollapsed">
          <span class="min-w-0 flex-1 truncate text-left">{{ row.label }}</span>
          <span :class="['h-1.5 w-1.5 shrink-0 rounded-full', row.dot]" aria-hidden="true" />
        </template>
      </button>
    </div>
  </aside>
</template>
