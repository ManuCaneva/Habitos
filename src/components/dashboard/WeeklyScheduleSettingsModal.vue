<script setup lang="ts">
import { ref, watch } from "vue";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import TimePicker from "@/components/ui/TimePicker.vue";
import { useWeeklyScheduleStore } from "@/stores/weeklySchedule";
import { minutesToHHMM, hhmmToMinutes } from "@/stores/weeklySchedule";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();
const store = useWeeklyScheduleStore();

const granularity = ref(30); const start = ref("06:00"); const end = ref("23:00");
const error = ref<string | null>(null);

watch(() => props.open, (o) => {
  if (!o) return;
  error.value = null;
  granularity.value = store.settings.granularity_minutes;
  start.value = minutesToHHMM(store.settings.day_start_minutes);
  end.value = minutesToHHMM(store.settings.day_end_minutes);
});

async function save() {
  error.value = null;
  try {
    const s = hhmmToMinutes(start.value); const e = hhmmToMinutes(end.value);
    if (e - s < granularity.value) {
      error.value = "El rango debe contener al menos un slot";
      return;
    }
    await store.saveSettings({
      granularity_minutes: granularity.value as 15 | 30 | 60,
      day_start_minutes: s,
      day_end_minutes: e,
    });
    emit("close");
  } catch (err) {
    error.value = String(err);
  }
}
</script>

<template>
  <Modal :open="open" size="sm" @close="emit('close')">
    <div class="p-4">
      <h3 class="text-card-title text-ink mb-3 font-semibold text-lg">Ajustes del cronograma</h3>
      <label class="block text-caption text-ink-muted mb-1.5 font-medium">Granularidad</label>
      <div class="flex gap-2 mb-4">
        <button v-for="g in [15, 30, 60]" :key="g"
          type="button"
          :class="['px-3 py-1.5 rounded-sm border text-sm transition-colors', granularity === g
                   ? 'bg-primary border-primary text-white' : 'border-hairline text-ink-muted hover:bg-surface-2']"
          @click="granularity = g">{{ g }} min</button>
      </div>
      <div class="flex gap-3 mt-3">
        <div class="flex-1">
          <label class="block text-caption text-ink-muted mb-1.5 font-medium text-center">Desde</label>
          <TimePicker v-model="start" />
        </div>
        <div class="flex-1">
          <label class="block text-caption text-ink-muted mb-1.5 font-medium text-center">Hasta</label>
          <TimePicker v-model="end" />
        </div>
      </div>
      <p v-if="error" class="text-body-sm text-primary mt-2 text-sm">{{ error }}</p>
      <div class="flex justify-end gap-2 mt-5">
        <Button variant="ghost" @click="emit('close')">Cancelar</Button>
        <Button @click="save">Guardar</Button>
      </div>
    </div>
  </Modal>
</template>
