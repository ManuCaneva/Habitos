<script setup lang="ts">
import { computed } from "vue";
import { Check } from "lucide-vue-next";

type CycleState = "todo" | "doing" | "done";

const props = defineProps<{
  modelValue: CycleState;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: CycleState];
}>();

function next(): CycleState {
  const order: CycleState[] = ["todo", "doing", "done"];
  const idx = order.indexOf(props.modelValue);
  return order[(idx + 1) % order.length];
}

const boxClasses = computed(() => {
  const base = "h-4 w-4 rounded border transition-colors duration-150 flex items-center justify-center";
  if (props.modelValue === "todo") {
    return `${base} bg-surface-1 border-hairline-strong`;
  }
  if (props.modelValue === "doing") {
    return `${base} bg-primary/40 border-primary`;
  }
  return `${base} bg-primary border-primary`;
});
</script>

<template>
  <label
    :class="[
      'inline-flex items-center justify-center',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
    ]"
  >
    <span class="relative inline-flex h-4 w-4 items-center justify-center">
      <input
        type="checkbox"
        :checked="modelValue === 'done'"
        :disabled="disabled"
        class="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        @click.prevent="!disabled && emit('update:modelValue', next())"
      />
      <span
        data-testid="cycle-box"
        :class="[
          boxClasses,
          'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-focus/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas',
        ]"
      >
        <Check v-if="modelValue === 'done'" :size="12" class="text-white" stroke-width="3" />
      </span>
    </span>
  </label>
</template>
