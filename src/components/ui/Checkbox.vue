<script setup lang="ts">
import { computed, useId } from "vue";
import { Check, Minus } from "lucide-vue-next";

const props = defineProps<{
  modelValue: boolean;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
}>();

defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const id = useId();

const isChecked = computed(() => props.modelValue);
const isIndeterminate = computed(() => props.indeterminate && !props.modelValue);
</script>

<template>
  <label
    :for="id"
    :class="[
      'inline-flex items-center gap-2.5 select-none',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
    ]"
  >
    <span class="relative inline-flex h-4 w-4 items-center justify-center">
      <input
        :id="id"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        :aria-checked="indeterminate ? 'mixed' : modelValue"
        class="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        @change="(e) => $emit('update:modelValue', (e.target as HTMLInputElement).checked)"
      />
      <span
        :class="[
          'h-4 w-4 rounded border transition-colors duration-150 flex items-center justify-center',
          isChecked || isIndeterminate
            ? 'bg-primary border-primary'
            : 'bg-surface-1 border-hairline-strong peer-hover:border-primary/50',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-focus/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas',
        ]"
      >
        <Check v-if="isChecked" :size="12" class="text-white" stroke-width="3" />
        <Minus v-else-if="isIndeterminate" :size="12" class="text-white" stroke-width="3" />
      </span>
    </span>
    <span v-if="label" class="text-body text-ink">{{ label }}</span>
  </label>
</template>
