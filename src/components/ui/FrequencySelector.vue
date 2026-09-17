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

const options: readonly { type: GoalFrequency['type']; label: string }[] = [
  { type: 'daily', label: 'Diario' },
  { type: 'weekly', label: 'Semanal' },
  { type: 'interval', label: 'Intervalo' },
]
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-2">
      <button
        v-for="option in options"
        :key="option.type"
        type="button"
        :class="[
          'rounded-md px-3 py-1.5 text-body-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          modelValue.type === option.type
            ? 'bg-primary text-on-primary shadow-sm'
            : 'bg-surface-2 text-ink-muted hover:bg-surface-3 hover:text-ink',
        ]"
        @click="selectFrequency(option.type)"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="modelValue.type === 'interval'" class="flex items-center gap-2">
      <label class="text-body-sm text-ink-muted">Cada</label>
      <input
        v-model="intervalDays"
        type="number"
        min="1"
        max="365"
        class="w-20 rounded-md border border-hairline bg-surface-1 px-2 py-1 text-body-sm text-ink transition-colors hover:border-hairline-strong focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <label class="text-body-sm text-ink-muted">días</label>
    </div>
  </div>
</template>
