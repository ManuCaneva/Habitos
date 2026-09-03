<script setup lang="ts">
import { computed } from 'vue'
import { blockColorRgb, blockColorTint } from '@/lib/scheduleColors'
import type { BlockColorToken } from '@/schemas/weeklySchedule'

const props = defineProps<{
  title: string
  color: BlockColorToken
}>()

const emit = defineEmits<{
  click: []
}>()

const blockStyle = computed(() => ({
  backgroundColor: blockColorTint(props.color, 0.15),
  borderColor: blockColorRgb(props.color),
  color: 'var(--color-ink)',
}))
</script>

<template>
  <button
    :class="[
      'absolute cursor-pointer overflow-hidden truncate rounded-sm border text-left transition-all duration-150',
      'schedule-block',
    ]"
    :style="blockStyle"
    @click="emit('click')"
  >
    <div class="schedule-block-title truncate font-medium leading-tight">{{ title }}</div>
  </button>
</template>
