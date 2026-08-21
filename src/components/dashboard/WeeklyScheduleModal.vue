<script setup lang="ts">
import { ref, watch } from "vue";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import TimePicker from "@/components/ui/TimePicker.vue";
import { useWeeklyScheduleStore } from "@/stores/weeklySchedule";
import { BLOCK_COLOR_TOKENS, type ScheduleBlockWithSlots, type CreateScheduleSlotDraft } from "@/schemas/weeklySchedule";
import { minutesToHHMM, hhmmToMinutes } from "@/stores/weeklySchedule";

const props = defineProps<{ open: boolean; block: ScheduleBlockWithSlots | null }>();
const emit = defineEmits<{ close: [] }>();
const store = useWeeklyScheduleStore();

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const title = ref("");
const color = ref<(typeof BLOCK_COLOR_TOKENS)[number]>("lavender");
const error = ref<string | null>(null);

const newSlotDay = ref(0);
const newSlotStart = ref("06:00");
const newSlotEnd = ref("07:00");
const editingSlotId = ref<string | null>(null);
const createdBlockId = ref<string | null>(null);

watch(() => props.open, (o) => {
  if (!o) return;
  error.value = null;
  editingSlotId.value = null;
  createdBlockId.value = null;
  if (props.block) {
    title.value = props.block.title;
    color.value = props.block.color;
    newSlotDay.value = 0;
    newSlotStart.value = "06:00";
    newSlotEnd.value = "07:00";
  } else {
    title.value = "";
    color.value = "lavender";
    newSlotDay.value = 0;
    newSlotStart.value = "06:00";
    newSlotEnd.value = "07:00";
  }
}, { immediate: true });

async function save() {
  error.value = null;
  try {
    if (!title.value.trim()) {
      error.value = "El título es obligatorio";
      return;
    }
    if (props.block) {
      await store.updateBlock(props.block.id, { title: title.value, color: color.value });
    } else {
      await store.createBlock(
        { title: title.value, color: color.value, sort_order: 0 },
        []
      );
    }
    emit("close");
  } catch (e: any) {
    error.value = String(e.message || e);
  }
}

async function addSlot() {
  error.value = null;
  try {
    const s = hhmmToMinutes(newSlotStart.value);
    const e = hhmmToMinutes(newSlotEnd.value);
    if (e <= s) {
      error.value = "La hora de fin debe ser mayor que la de inicio";
      return;
    }
    const slotDraft: CreateScheduleSlotDraft = {
      day_of_week: newSlotDay.value,
      start_minutes: s,
      end_minutes: e,
    };
    if (props.block) {
      if (editingSlotId.value) {
        await store.updateSlot(editingSlotId.value, slotDraft);
      } else {
        await store.addSlot(props.block.id, slotDraft);
      }
    } else {
      if (createdBlockId.value) {
        await store.addSlot(createdBlockId.value, slotDraft);
      } else {
        const bw = await store.createBlock(
          { title: title.value, color: color.value, sort_order: 0 },
          [slotDraft]
        );
        createdBlockId.value = bw.id;
      }
    }
    editingSlotId.value = null;
    newSlotDay.value = 0;
    newSlotStart.value = "06:00";
    newSlotEnd.value = "07:00";
  } catch (e: any) {
    error.value = String(e.message || e);
  }
}

function editSlot(slotId: string) {
  if (!props.block) return;
  const slot = props.block.slots.find((s) => s.id === slotId);
  if (!slot) return;
  editingSlotId.value = slotId;
  newSlotDay.value = slot.day_of_week;
  newSlotStart.value = minutesToHHMM(slot.start_minutes);
  newSlotEnd.value = minutesToHHMM(slot.end_minutes);
}

async function deleteSlot(slotId: string) {
  error.value = null;
  try {
    await store.deleteSlot(slotId);
    if (editingSlotId.value === slotId) {
      editingSlotId.value = null;
      newSlotDay.value = 0;
      newSlotStart.value = "06:00";
      newSlotEnd.value = "07:00";
    }
  } catch (e: any) {
    error.value = String(e.message || e);
  }
}

async function remove() {
  if (!props.block) return;
  try {
    await store.deleteBlock(props.block.id);
    emit("close");
  } catch (e: any) {
    error.value = String(e.message || e);
  }
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
      
      <div v-if="block" class="mt-4">
        <label class="block text-caption text-ink-muted mb-2 font-medium text-xs">Horarios</label>
        <div v-if="block.slots.length === 0" class="text-body-sm text-ink-subtle text-sm italic mb-2">
          Sin horarios asignados
        </div>
        <div v-for="slot in block.slots" :key="slot.id" class="flex items-center gap-2 mb-2 p-2 bg-surface-2 border border-hairline rounded-sm">
          <div class="flex-1 text-body-sm text-sm">
            <span class="font-medium">{{ DAYS[slot.day_of_week] }}</span>
            <span class="text-ink-subtle ml-2">{{ minutesToHHMM(slot.start_minutes) }} - {{ minutesToHHMM(slot.end_minutes) }}</span>
          </div>
          <button type="button" class="text-primary hover:text-primary-hover text-xs px-2 py-1" @click="editSlot(slot.id)">Editar</button>
          <button type="button" class="text-red-500 hover:text-red-600 text-xs px-2 py-1" @click="deleteSlot(slot.id)">Eliminar</button>
        </div>
      </div>
      
      <div class="mt-4 p-3 bg-surface-2 border border-hairline rounded-sm">
        <label class="block text-caption text-ink-muted mb-2 font-medium text-xs">
          {{ editingSlotId ? "Editar horario" : "Agregar horario" }}
        </label>
        <label class="block text-caption text-ink-muted mb-1 font-medium text-xs">Día</label>
        <select v-model="newSlotDay" class="bg-surface-2 border border-hairline rounded-sm px-2 py-1.5 text-body w-full mb-2">
          <option v-for="(d, i) in DAYS" :key="i" :value="i">{{ d }}</option>
        </select>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-caption text-ink-muted mb-1.5 font-medium text-xs text-center">Inicio</label>
            <TimePicker v-model="newSlotStart" />
          </div>
          <div class="flex-1">
            <label class="block text-caption text-ink-muted mb-1.5 font-medium text-xs text-center">Fin</label>
            <TimePicker v-model="newSlotEnd" />
          </div>
        </div>
        <div class="flex gap-2 mt-2">
          <Button size="sm" @click="addSlot">{{ editingSlotId ? "Actualizar" : "Agregar" }}</Button>
          <Button v-if="editingSlotId" size="sm" variant="ghost" @click="editingSlotId = null; newSlotDay = 0; newSlotStart = '06:00'; newSlotEnd = '07:00'">Cancelar</Button>
        </div>
      </div>
      
      <p v-if="error" class="text-body-sm text-primary mt-2 text-sm">{{ error }}</p>
      
      <div class="flex justify-between mt-5">
        <Button v-if="block" variant="danger" @click="remove">Eliminar</Button>
        <div v-else />
        <div class="flex gap-2">
          <Button variant="ghost" @click="emit('close')">Cancelar</Button>
          <Button v-if="!block" @click="save">Crear</Button>
          <Button v-else @click="save">Guardar</Button>
        </div>
      </div>
    </div>
  </Modal>
</template>
