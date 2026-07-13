<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useTheme } from "@/composables/useTheme";
import { useCalendarStore } from "@/stores/calendar";
import Card from "@/components/ui/Card.vue";
import Text from "@/components/ui/Text.vue";
import Heading from "@/components/ui/Heading.vue";
import Button from "@/components/ui/Button.vue";

const { current, currentId, themes, setTheme } = useTheme();
const store = useCalendarStore();
const connecting = ref(false);

const primaryColor = computed(() => `rgb(${current.value.colors.primary})`);
const surfaceColor = computed(() => `rgb(${current.value.colors.surface1})`);
const inkColor = computed(() => `rgb(${current.value.colors.ink})`);
const hairlineColor = computed(() => `rgb(${current.value.colors.hairline})`);

const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false;
  }
}

function selectTheme(id: string) {
  setTheme(id);
  dropdownOpen.value = false;
}

onMounted(() => document.addEventListener("mousedown", handleClickOutside));
onBeforeUnmount(() => document.removeEventListener("mousedown", handleClickOutside));

async function handleConnect() {
  connecting.value = true;
  try {
    await store.connect();
  } catch (e) {
    // Error handling is done via store.syncError
  } finally {
    connecting.value = false;
  }
}

async function handleDisconnect() {
  await store.disconnect();
}
</script>

<template>
  <main class="scrollbar-gutter-stable h-full overflow-y-auto px-6 py-section max-w-2xl mx-auto flex flex-col gap-6">
    <Heading variant="headline">Settings</Heading>

    <Card variant="default" padding="md">
      <div class="flex items-start justify-between gap-4">
        <div>
          <Text variant="card-title" as="h2" class="mb-1">Tema</Text>
          <Text variant="body-sm" color="muted">
            Elegí el tema que más te guste.
          </Text>
        </div>
        <div ref="dropdownRef" class="relative">
          <button
            type="button"
            data-testid="theme-dropdown-btn" class="flex items-center gap-2.5 px-3 py-1.5 rounded-md border transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-focus/50"
            :style="{
              backgroundColor: surfaceColor,
              borderColor: hairlineColor,
              color: inkColor,
            }"
            @click="dropdownOpen = !dropdownOpen"
          >
            <span
              class="w-3 h-3 rounded-full shrink-0"
              :style="{ backgroundColor: primaryColor }"
            />
            <span class="text-body-sm">{{ current.name }}</span>
            <span class="text-ink-subtle text-xs ml-1">{{ dropdownOpen ? '▲' : '▼' }}</span>
          </button>
          <div
            v-if="dropdownOpen"
            class="absolute right-0 top-full mt-1 w-40 rounded-md border shadow-lg z-50 overflow-hidden"
            :style="{
              backgroundColor: surfaceColor,
              borderColor: hairlineColor,
            }"
          >
            <button
              v-for="t in themes"
              :key="t.id"
              type="button"
              class="flex items-center gap-2.5 w-full px-3 py-2 text-left text-body-sm transition-colors duration-100"
              :style="{
                color: t.id === currentId ? primaryColor : inkColor,
                backgroundColor: t.id === currentId ? `rgb(${current.colors.surface2})` : 'transparent',
              }"
              @click="selectTheme(t.id)"
            >
              <span
                class="w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: `rgb(${t.colors.primary})` }"
              />
              {{ t.name }}
            </button>
          </div>
        </div>
      </div>
    </Card>

    <Card variant="default" padding="md">
      <Text variant="card-title" as="h2" class="mb-2">Datos</Text>
      <Text variant="body-sm" color="muted" class="mb-3">
        Tus datos viven localmente en tu computadora. Para resetear la app,
        cerrala y borrá la carpeta
        <Text variant="body-sm" mono>~/.local/share/com.aeon/</Text>.
      </Text>
    </Card>

    <Card variant="default" padding="md">
      <Text variant="card-title" as="h2" class="mb-2">Google Calendar</Text>
      <Text variant="body-sm" color="muted" class="mb-3">
        Conectá tu cuenta de Google para ver tus eventos en el calendario anual.
      </Text>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-3">
          <Button
            v-if="!store.connected"
            variant="primary"
            size="sm"
            :loading="connecting"
            data-testid="gcal-connect-btn"
            @click="handleConnect"
          >
            Conectar
          </Button>
          <div v-else class="flex items-center gap-3">
            <span class="text-green-500 font-medium text-sm flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              Connected
            </span>
            <Button
              variant="secondary"
              size="sm"
              data-testid="gcal-disconnect-btn"
              @click="handleDisconnect"
            >
              Desconectar
            </Button>
          </div>
        </div>
        <span v-if="!store.connected" class="text-red-500 font-medium text-sm flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Not connected
        </span>
      </div>
      <Text
        v-if="store.syncError"
        variant="caption"
        color="muted"
        class="mt-2 text-red-500 font-medium font-mono"
      >
        Error: {{ store.syncError }}
      </Text>
    </Card>
  </main>
</template>
