<script setup lang="ts">
import { ref } from "vue";
import { useTheme } from "@/composables/useTheme";
import { useCalendarStore } from "@/stores/calendar";
import Card from "@/components/ui/Card.vue";
import Text from "@/components/ui/Text.vue";
import Heading from "@/components/ui/Heading.vue";
import Switch from "@/components/ui/Switch.vue";
import Button from "@/components/ui/Button.vue";

const { isDark, setTheme } = useTheme();
const store = useCalendarStore();
const connecting = ref(false);

function onToggle(value: boolean) {
  setTheme(value ? "dark" : "light");
}

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
          <Text variant="card-title" as="h2" class="mb-1">Tema oscuro</Text>
          <Text variant="body-sm" color="muted">
            Activalo para reducir el cansancio visual.
          </Text>
        </div>
        <Switch
          :model-value="isDark"
          aria-label="Activar tema oscuro"
          @update:model-value="onToggle"
        />
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
        class="mt-2 text-red-500 font-medium"
      >
        Error: {{ store.syncError }}
      </Text>
    </Card>
  </main>
</template>
