<script setup lang="ts">
import { onMounted } from 'vue'
import { useCalendarStore } from '@/stores/calendar'
import Card from '@/components/ui/Card.vue'
import Text from '@/components/ui/Text.vue'
import Checkbox from '@/components/ui/Checkbox.vue'

const store = useCalendarStore()

const FALLBACK_SWATCH = 'rgb(var(--color-primary))'

onMounted(() => {
  if (store.connected && store.calendars.length === 0) {
    void store.fetchCalendars().catch(() => {})
  }
})

async function handleToggle(calendarId: string, visible: boolean): Promise<void> {
  await store.setCalendarHidden(calendarId, !visible)
}
</script>

<template>
  <Card variant="default" padding="md" data-testid="gcal-visibility-card">
    <Text variant="card-title" as="h2" class="mb-1">Calendarios visibles</Text>
    <Text variant="body-sm" color="muted" class="mb-3">
      Elegí qué calendarios mostrar en el calendario anual. Ocultar un calendario no impide crear
      eventos en él.
    </Text>
    <div v-if="!store.connected" data-testid="gcal-visibility-empty">
      <Text variant="body-sm" color="muted">
        Conectá Google Calendar para elegir qué calendarios mostrar.
      </Text>
    </div>
    <ul v-else class="flex flex-col gap-2.5">
      <li
        v-for="cal in store.calendars"
        :key="cal.id"
        data-testid="gcal-visibility-row"
        :data-calendar-id="cal.id"
        class="flex items-center gap-3"
      >
        <Checkbox
          :model-value="!store.isCalendarHidden(cal.id)"
          @update:model-value="(visible) => handleToggle(cal.id, visible)"
        />
        <span
          data-testid="gcal-visibility-swatch"
          class="h-3 w-3 shrink-0 rounded-full"
          :style="{ backgroundColor: cal.backgroundColor ?? FALLBACK_SWATCH }"
        />
        <Text variant="body-sm">{{ cal.summary }}</Text>
      </li>
    </ul>
  </Card>
</template>
