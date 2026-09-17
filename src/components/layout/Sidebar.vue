<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
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

const SETTLE_DELAY_MS = 200

const settled = ref(ui.sidebarCollapsed)
let settleTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => ui.sidebarCollapsed,
  (collapsed) => {
    if (settleTimer) {
      clearTimeout(settleTimer)
      settleTimer = undefined
    }
    settled.value = false
    if (!collapsed) return
    settleTimer = setTimeout(() => {
      settled.value = true
      settleTimer = undefined
    }, SETTLE_DELAY_MS)
  }
)

onBeforeUnmount(() => {
  if (settleTimer) clearTimeout(settleTimer)
})

interface NavRow {
  key: string
  label: string
  icon: typeof CheckSquare
  active: boolean
  select: () => void
}

const navItems: readonly { id: ViewMode; label: string; icon: typeof CheckSquare }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: CheckSquare },
  { id: 'archived', label: 'Archivados', icon: Archive },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
] as const

const navRows = computed<NavRow[]>(() =>
  navItems.map((item) => ({
    key: item.id,
    label: item.label,
    icon: item.icon,
    active: ui.viewMode === item.id,
    select: () => ui.setViewMode(item.id),
  }))
)

const systemRows = computed<NavRow[]>(() => [
  {
    key: 'edit-mode',
    label: 'Modo Edición',
    icon: Pencil,
    active: ui.editMode,
    select: () => ui.toggleEditMode(),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    active: ui.viewMode === 'settings',
    select: () => ui.setViewMode('settings'),
  },
])

const collapseIcon = computed(() => (ui.sidebarCollapsed ? PanelLeftOpen : PanelLeftClose))

const fadeClass = computed(() => (ui.sidebarCollapsed && !settled.value ? 'opacity-0' : ''))
const hideClass = computed(() => (ui.sidebarCollapsed && settled.value ? 'hidden' : ''))
const textFade = computed(() => [fadeClass.value, hideClass.value])
const centered = computed(() => ui.sidebarCollapsed && settled.value)

const rowBase = computed(
  () =>
    `group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-caption font-medium transition-colors duration-150${
      centered.value ? ' justify-center' : ''
    }`
)
const rowIdle = 'text-ink-muted hover:bg-surface-2 hover:text-ink'
const rowActive = 'bg-surface-3 text-ink'
</script>

<template>
  <aside
    :class="[
      'flex h-full flex-col rounded-xl border border-hairline bg-surface-1 transition-[width] duration-150 ease-out',
      ui.sidebarCollapsed ? 'w-14' : 'w-44',
    ]"
  >
    <div
      data-testid="sidebar-header"
      class="flex items-center gap-2 px-2 py-2.5"
      :class="centered && 'justify-center'"
    >
      <Text
        data-testid="sidebar-title"
        variant="body-sm"
        weight="600"
        class="min-w-0 flex-1 truncate transition-opacity duration-150"
        :class="textFade"
      >
        AEON
      </Text>
      <button
        type="button"
        data-testid="sidebar-toggle"
        class="flex shrink-0 items-center justify-center rounded-md px-2 py-1.5 text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
        aria-label="Colapsar sidebar"
        title="Colapsar sidebar"
        @click="ui.toggleSidebar()"
      >
        <component :is="collapseIcon" :size="18" class="shrink-0" />
      </button>
    </div>

    <nav class="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-1">
      <Text
        variant="eyebrow"
        color="subtle"
        class="px-2 pb-1 pt-2 transition-opacity duration-150"
        :class="textFade"
      >
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
        <span
          :data-testid="`nav-label-${row.key}`"
          class="min-w-0 flex-1 truncate text-left transition-opacity duration-150"
          :class="textFade"
        >
          {{ row.label }}
        </span>
      </button>
    </nav>

    <div class="flex flex-col gap-1 border-t border-hairline px-2 py-2">
      <Text
        variant="eyebrow"
        color="subtle"
        class="px-2 pb-1 pt-1 transition-opacity duration-150"
        :class="textFade"
      >
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
        <span
          :data-testid="`nav-label-${row.key}`"
          class="min-w-0 flex-1 truncate text-left transition-opacity duration-150"
          :class="textFade"
        >
          {{ row.label }}
        </span>
      </button>
    </div>
  </aside>
</template>
