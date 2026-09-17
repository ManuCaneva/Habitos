<script setup lang="ts">
import { computed } from 'vue'
import { blockColorTint } from '@/lib/scheduleColors'
import type { BlockColorToken } from '@/schemas/weeklySchedule'

const props = defineProps<{
  title: string
  color: BlockColorToken
}>()

const emit = defineEmits<{
  click: []
}>()

const blockStyle = computed(() => ({
  backgroundColor: blockColorTint(props.color, 0.16),
  borderColor: blockColorTint(props.color, 0.8),
  color: 'var(--color-ink)',
}))
</script>

<template>
  <button
    :class="[
      'absolute flex cursor-pointer items-center justify-center overflow-hidden rounded-sm border text-center transition-all duration-150',
      'schedule-block',
    ]"
    :style="blockStyle"
    @click="emit('click')"
  >
    <div class="schedule-block-title break-words font-medium leading-tight">{{ title }}</div>
  </button>
</template>
