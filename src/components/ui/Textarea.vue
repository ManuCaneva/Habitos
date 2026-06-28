<script setup lang="ts">
import { computed, useId } from "vue";

type Resize = "none" | "vertical" | "horizontal" | "both";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    rows?: number;
    resize?: Resize;
    label?: string;
    helper?: string;
  }>(),
  {
    rows: 4,
    disabled: false,
    resize: "vertical",
    placeholder: "",
  },
);

defineEmits<{
  "update:modelValue": [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const id = useId();

const resizeClass = computed(() => {
  switch (props.resize) {
    case "none":
      return "resize-none";
    case "horizontal":
      return "resize-x";
    case "both":
      return "resize";
    default:
      return "resize-y";
  }
});

const stateClass = computed(() => {
  if (props.disabled) {
    return "bg-surface-1 border-hairline text-ink-tertiary cursor-not-allowed";
  }
  if (props.error) {
    return "bg-surface-1 border-red-500/50 text-ink focus-within:border-red-500";
  }
  return "bg-surface-1 border-hairline text-ink focus-within:border-hairline-strong hover:border-hairline-strong";
});
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      v-if="label"
      :for="id"
      class="text-body-sm text-ink-muted select-none"
    >
      {{ label }}
    </label>
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :aria-invalid="!!error"
      :class="[
        'rounded-md border p-3 text-body outline-none transition-colors duration-150 placeholder:text-ink-tertiary',
        resizeClass,
        stateClass,
      ]"
      @input="(e) => $emit('update:modelValue', (e.target as HTMLTextAreaElement).value)"
      @blur="(e) => $emit('blur', e)"
      @focus="(e) => $emit('focus', e)"
    />
    <p
      v-if="error || helper"
      :class="['text-caption', error ? 'text-red-400' : 'text-ink-subtle']"
    >
      {{ error || helper }}
    </p>
  </div>
</template>
