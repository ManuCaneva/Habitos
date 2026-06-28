<script setup lang="ts">
import { useTheme } from "@/composables/useTheme";
import Card from "@/components/ui/Card.vue";
import Text from "@/components/ui/Text.vue";
import Heading from "@/components/ui/Heading.vue";
import Switch from "@/components/ui/Switch.vue";

const { isDark, setTheme } = useTheme();

function onToggle(value: boolean) {
  setTheme(value ? "dark" : "light");
}
</script>

<template>
  <main class="px-6 py-section max-w-2xl mx-auto flex flex-col gap-6">
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
        <Text variant="body-sm" mono>~/.local/share/com.goya.habitos/</Text>.
      </Text>
    </Card>
  </main>
</template>
