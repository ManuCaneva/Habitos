<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import { useWeeklyScheduleStore } from '@/stores/weeklySchedule'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const store = useWeeklyScheduleStore()

const granularity = ref(30)
const error = ref<string | null>(null)

watch(
  () => props.open,
  (o) => {
    if (!o) return
    error.value = null
    granularity.value = store.settings.granularity_minutes
  }
)

async function save() {
  error.value = null
  try {
    await store.saveSettings({
      granularity_minutes: granularity.value as 15 | 30 | 60,
    })
    emit('close')
  } catch (err) {
    error.value = String(err)
  }
}
</script>

<template>
  <Modal :open="open" size="sm" @close="emit('close')">
    <div class="p-4">
      <h3 class="mb-3 text-card-title text-lg font-semibold text-ink">Ajustes del cronograma</h3>
      <label class="mb-1.5 block text-caption font-medium text-ink-muted">Granularidad</label>
      <div class="mb-4 flex gap-2">
        <button
          v-for="g in [15, 30, 60]"
          :key="g"
          type="button"
          :class="[
            'rounded-sm border px-3 py-1.5 text-sm transition-colors',
            granularity === g
              ? 'border-primary bg-primary text-white'
              : 'border-hairline text-ink-muted hover:bg-surface-2',
          ]"
          @click="granularity = g"
        >
          {{ g }} min
        </button>
      </div>
      <p v-if="error" class="mt-2 text-body-sm text-sm text-primary">{{ error }}</p>
      <div class="mt-5 flex justify-end gap-2">
        <Button variant="ghost" @click="emit('close')">Cancelar</Button>
        <Button @click="save">Guardar</Button>
      </div>
    </div>
  </Modal>
</template>
