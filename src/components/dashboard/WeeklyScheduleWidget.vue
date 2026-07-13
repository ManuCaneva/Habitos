<script setup lang="ts">
import { onMounted, ref } from "vue";
import Container from "@/components/ui/Container.vue";
import IconButton from "@/components/ui/IconButton.vue";
import Text from "@/components/ui/Text.vue";
import { Settings, Plus } from "lucide-vue-next";
import WeeklyScheduleGrid from "./WeeklyScheduleGrid.vue";
import WeeklyScheduleModal from "./WeeklyScheduleModal.vue";
import WeeklyScheduleSettingsModal from "./WeeklyScheduleSettingsModal.vue";
import { useWeeklyScheduleStore } from "@/stores/weeklySchedule";
import type { ScheduleBlock } from "@/schemas/weeklySchedule";

const store = useWeeklyScheduleStore();
const editingBlock = ref<ScheduleBlock | null>(null);
const showCreate = ref(false);
const showSettings = ref(false);

onMounted(() => store.loadAll());

function openEdit(b: ScheduleBlock) { editingBlock.value = b; }
</script>

<template>
  <Container variant="default" padding="none" class="h-full overflow-hidden"
             style="container-type: inline-size" data-testid="weekly-schedule-widget">
    <div class="flex flex-col h-full min-h-0">
      <header class="grid grid-cols-[1fr_auto_1fr] items-center px-3 py-2 border-b border-hairline bg-surface-2 flex-shrink-0">
        <div></div>
        <Text variant="card-title" weight="600" class="text-center truncate min-w-0">Cronograma Semanal</Text>
        <div class="flex items-center gap-1 justify-end">
          <IconButton label="Ajustes" @click="showSettings = true">
            <Settings class="h-4 w-4 text-ink-muted" />
          </IconButton>
          <IconButton label="Nuevo bloque" @click="showCreate = true">
            <Plus class="h-4 w-4 text-ink-muted" />
          </IconButton>
        </div>
      </header>
      <div v-if="store.lastError" class="p-3 bg-red-500/10 text-red-500 text-xs border-b border-red-500/20 whitespace-pre-wrap select-text">
        Error al cargar: {{ store.lastError }}
      </div>
      <WeeklyScheduleGrid class="flex-1 min-h-0 overflow-hidden" @edit="openEdit" />
    </div>
    <WeeklyScheduleModal :open="showCreate" :block="null" @close="showCreate = false" />
    <WeeklyScheduleModal :open="!!editingBlock" :block="editingBlock"
                         @close="editingBlock = null" />
    <WeeklyScheduleSettingsModal :open="showSettings" @close="showSettings = false" />
  </Container>
</template>
