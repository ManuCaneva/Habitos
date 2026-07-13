<script setup lang="ts">
import { ref, watch } from "vue";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import TimePicker from "@/components/ui/TimePicker.vue";
import { useWeeklyScheduleStore } from "@/stores/weeklySchedule";
import { BLOCK_COLOR_TOKENS, type ScheduleBlock } from "@/schemas/weeklySchedule";
import { minutesToHHMM, hhmmToMinutes } from "@/stores/weeklySchedule";

const props = defineProps<{ open: boolean; block: ScheduleBlock | null }>();
const emit = defineEmits<{ close: [] }>();
const store = useWeeklyScheduleStore();

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const title = ref(""); const color = ref<(typeof BLOCK_COLOR_TOKENS)[number]>("lavender");
const day = ref(0); const start = ref("06:00"); const end = ref("07:00");
const error = ref<string | null>(null);

watch(() => props.open, (o) => {
  if (!o) return;
  error.value = null;
  if (props.block) {
    title.value = props.block.title; color.value = props.block.color;
    day.value = props.block.day_of_week;
    start.value = minutesToHHMM(props.block.start_minutes);
    end.value = minutesToHHMM(props.block.end_minutes);
  } else {
    title.value = ""; color.value = "lavender"; day.value = 0;
    start.value = "06:00"; end.value = "07:00";
  }
}, { immediate: true });

async function save() {
  error.value = null;
  try {
    const s = hhmmToMinutes(start.value); const e = hhmmToMinutes(end.value);
    if (e <= s) { error.value = "La hora de fin debe ser mayor que la de inicio"; return; }
    const draft = { day_of_week: day.value, start_minutes: s, end_minutes: e,
                    title: title.value, color: color.value, sort_order: 0 };
    if (props.block) await store.updateBlock(props.block.id, draft);
    else await store.createBlock(draft);
    emit("close");
  } catch (e: any) { error.value = String(e.message || e); }
}

async function remove() {
  if (!props.block) return;
  try {
    await store.deleteBlock(props.block.id);
    emit("close");
  } catch (e: any) { error.value = String(e.message || e); }
}

const colorMap: Record<string, string> = {
  lavender: "#5e6ad2",
  green: "#4cb782",
  yellow: "#f2c94c",
  red: "#eb5757",
  pink: "#f178b6",
  cyan: "#56b6c2",
  orange: "#f2994a",
  bone: "#d4d4d4",
};

function getBgColorStyle(c: string) {
  return colorMap[c] || colorMap.lavender;
}
</script>

<template>
  <Modal :open="open" size="md" @close="emit('close')">
    <div class="p-4">
      <h3 class="text-card-title text-ink mb-3 font-semibold text-lg">
        {{ block ? "Editar bloque" : "Nuevo bloque" }}
      </h3>
      <label class="block text-caption text-ink-muted mb-1 font-medium text-xs">Título</label>
      <Input v-model="title" placeholder="Ej. Gimnasio" />
      
      <label class="block text-caption text-ink-muted mt-3 mb-1.5 font-medium text-xs">Color</label>
      <div class="flex gap-2">
        <button v-for="c in BLOCK_COLOR_TOKENS" :key="c" type="button"
          :class="['w-6 h-6 rounded-sm border-2 transition-all', c === color ? 'border-ink scale-110 ring-2 ring-primary/25' : 'border-transparent hover:scale-105']"
          :style="{ backgroundColor: getBgColorStyle(c) }"
          @click="color = c" :aria-label="c" />
      </div>
      
      <label class="block text-caption text-ink-muted mt-3 mb-1 font-medium text-xs">Día</label>
      <select v-model="day" class="bg-surface-2 border border-hairline rounded-sm px-2 py-1.5 text-body w-full">
        <option v-for="(d, i) in DAYS" :key="i" :value="i">{{ d }}</option>
      </select>
      
      <div class="flex gap-3 mt-3">
        <div class="flex-1">
          <label class="block text-caption text-ink-muted mb-1.5 font-medium text-xs text-center">Inicio</label>
          <TimePicker v-model="start" />
        </div>
        <div class="flex-1">
          <label class="block text-caption text-ink-muted mb-1.5 font-medium text-xs text-center">Fin</label>
          <TimePicker v-model="end" />
        </div>
      </div>
      
      <p v-if="error" class="text-body-sm text-primary mt-2 text-sm">{{ error }}</p>
      
      <div class="flex justify-between mt-5">
        <Button v-if="block" variant="danger" @click="remove">Eliminar</Button>
        <div v-else />
        <div class="flex gap-2">
          <Button variant="ghost" @click="emit('close')">Cancelar</Button>
          <Button @click="save">{{ block ? "Guardar" : "Crear" }}</Button>
        </div>
      </div>
    </div>
  </Modal>
</template>
