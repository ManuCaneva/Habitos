<script setup lang="ts">
import { computed } from 'vue'
import { Check, Minus, Plus } from 'lucide-vue-next'
import { shadeFor } from '@/lib/habitColors'

const props = defineProps<{
  target: number
  count: number
  color: string
}>()

const emit = defineEmits<{
  increment: []
  decrement: []
  reset: []
}>()

const full = computed(() => props.count >= props.target)

const litSegments = computed(() => Math.min(props.count, props.target))

const ringSegments = computed(() => {
  const circumference = 2 * Math.PI * 12
  const segmentAngle = 360 / props.target
  const gapAngle = segmentAngle * 0.16
  const arcLength = circumference * ((segmentAngle - gapAngle) / 360)

  return Array.from({ length: props.target }, (_, index) => ({
    index,
    rotation: -90 + index * segmentAngle + gapAngle / 2,
    dasharray: `${arcLength} ${circumference - arcLength}`,
  }))
})

function onMainClick() {
  if (props.target <= 1) {
    if (full.value) {
      emit('decrement')
    } else {
      emit('increment')
    }
    return
  }
  if (full.value) {
    emit('reset')
  } else {
    emit('increment')
  }
}
</script>

<template>
  <div class="flex h-7 items-center justify-center gap-1">
    <button
      v-if="target > 1 && count > 0"
      type="button"
      data-testid="decrement-button"
      class="flex h-5 w-5 items-center justify-center rounded-full text-ink-muted opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
      aria-label="Quitar una repetición"
      title="Quitar una repetición"
      @click.stop="emit('decrement')"
    >
      <Minus :size="12" :stroke-width="2.5" />
    </button>
    <button
      type="button"
      data-testid="checkin-button"
      :class="[
        'relative flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-95',
        !full && target === 1 && 'border-2 bg-surface-3/30',
        !full && target > 1 && 'bg-surface-3/30',
      ]"
      :style="
        full
          ? { backgroundColor: color, borderColor: color }
          : target === 1
            ? { borderColor: color }
            : {}
      "
      :aria-label="full ? 'Resetear hábito' : 'Marcar hábito'"
      @click.stop="onMainClick"
    >
      <svg
        v-if="target > 1 && !full"
        data-testid="progress-ring"
        class="pointer-events-none absolute inset-0 h-7 w-7"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
      >
        <circle
          v-for="segment in ringSegments"
          :key="segment.index"
          data-testid="segment"
          class="segment pointer-events-none transition-colors duration-150"
          cx="14"
          cy="14"
          r="12"
          :stroke="segment.index < litSegments ? color : shadeFor(color, 0.2)"
          :stroke-dasharray="segment.dasharray"
          :transform="`rotate(${segment.rotation} 14 14)`"
          stroke-width="2"
          stroke-linecap="butt"
        />
      </svg>
      <Check
        v-if="full"
        data-testid="circle-check"
        :size="16"
        :stroke-width="3"
        class="text-white"
      />
      <Plus
        v-else-if="!full"
        data-testid="circle-plus"
        :size="16"
        :stroke-width="2"
        class="text-white"
      />
    </button>
  </div>
</template>
