<script setup lang="ts">
import { computed, useId } from "vue";

type Size = "sm" | "md";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    label?: string;
    disabled?: boolean;
    size?: Size;
  }>(),
  {
    disabled: false,
    size: "md",
  },
);

defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const id = useId();

const trackSize = computed(() =>
  props.size === "sm" ? "h-5 w-9" : "h-6 w-11",
);

const thumbSize = computed(() =>
  props.size === "sm" ? "h-4 w-4" : "h-5 w-5",
);

const thumbPosition = computed(() =>
  props.modelValue
    ? props.size === "sm"
      ? "translate-x-4"
      : "translate-x-5"
    : "translate-x-0.5",
);
</script>

<template>
  <label
    :for="id"
    :class="[
      'inline-flex items-center gap-3 select-none',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
    ]"
  >
    <span class="relative inline-block">
      <input
        :id="id"
        type="checkbox"
        role="switch"
        :checked="modelValue"
        :disabled="disabled"
        class="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        @change="(e) => $emit('update:modelValue', (e.target as HTMLInputElement).checked)"
      />
      <span
        :class="[
          'block rounded-full transition-colors duration-200 ease-out',
          trackSize,
          modelValue ? 'bg-primary' : 'bg-surface-3',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-focus/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas',
        ]"
      />
      <span
        :class="[
          'absolute top-0.5 left-0 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
          thumbSize,
          thumbPosition,
        ]"
      />
    </span>
    <span v-if="label" class="text-body text-ink">{{ label }}</span>
  </label>
</template>
