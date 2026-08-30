<script setup lang="ts">
import { computed } from 'vue'
import { Check, Minus, Plus } from 'lucide-vue-next'

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

const gridCols = computed(() => Math.max(2, Math.ceil(Math.sqrt(props.target))))

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
        'flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-95',
        !full && 'border-2 bg-surface-3/30',
      ]"
      :style="full ? { backgroundColor: color, borderColor: color } : { borderColor: color }"
      :aria-label="full ? 'Resetear hábito' : 'Marcar hábito'"
      @click.stop="onMainClick"
    >
      <Check
        v-if="full"
        data-testid="circle-check"
        :size="16"
        :stroke-width="3"
        class="text-white"
      />
      <Plus
        v-else-if="target === 1"
        data-testid="circle-plus"
        :size="16"
        :stroke-width="2"
        class="text-white"
      />
      <span
        v-else
        class="grid w-full place-items-center px-1"
        :style="{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }"
      >
        <span
          v-for="i in target"
          :key="i"
          data-testid="segment"
          :class="['segment block h-1 w-1 rounded-full', i <= litSegments && 'segment-lit']"
          :style="i <= litSegments ? { backgroundColor: color } : {}"
        />
      </span>
    </button>
  </div>
</template>
