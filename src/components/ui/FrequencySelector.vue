<script setup lang="ts">
import { computed } from 'vue'

interface GoalFrequency {
  type: 'daily' | 'weekly' | 'interval'
  interval_days?: number
}

const props = defineProps<{
  modelValue: GoalFrequency
}>()

const emit = defineEmits<{
  'update:modelValue': [value: GoalFrequency]
}>()

function selectFrequency(type: GoalFrequency['type']) {
  if (type === 'interval') {
    emit('update:modelValue', { type, interval_days: 3 })
  } else {
    emit('update:modelValue', { type })
  }
}

function updateIntervalDays(value: number) {
  const clamped = Math.max(1, Math.min(365, value))
  emit('update:modelValue', { type: 'interval', interval_days: clamped })
}

const intervalDays = computed({
  get: () => props.modelValue.interval_days ?? 3,
  set: (value) => updateIntervalDays(Number(value)),
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-2">
      <button
        type="button"
        :class="[
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          modelValue.type === 'daily'
            ? 'bg-primary text-white'
            : 'bg-surface-2 text-ink hover:bg-surface-3',
        ]"
        @click="selectFrequency('daily')"
      >
        Diario
      </button>
      <button
        type="button"
        :class="[
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          modelValue.type === 'weekly'
            ? 'bg-primary text-white'
            : 'bg-surface-2 text-ink hover:bg-surface-3',
        ]"
        @click="selectFrequency('weekly')"
      >
        Semanal
      </button>
      <button
        type="button"
        :class="[
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          modelValue.type === 'interval'
            ? 'bg-primary text-white'
            : 'bg-surface-2 text-ink hover:bg-surface-3',
        ]"
        @click="selectFrequency('interval')"
      >
        Intervalo
      </button>
    </div>

    <div v-if="modelValue.type === 'interval'" class="flex items-center gap-2">
      <label class="text-sm text-ink-muted">Cada</label>
      <input
        v-model="intervalDays"
        type="number"
        min="1"
        max="365"
        class="w-20 rounded-md border border-hairline bg-surface-1 px-2 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <label class="text-sm text-ink-muted">días</label>
    </div>
  </div>
</template>
