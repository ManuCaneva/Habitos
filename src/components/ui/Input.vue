<script setup lang="ts">
import { computed, useId } from "vue";

type Size = "sm" | "md";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    type?: "text" | "email" | "password" | "number" | "url" | "search" | "date";
    size?: Size;
    disabled?: boolean;
    error?: string;
    label?: string;
    helper?: string;
  }>(),
  {
    type: "text",
    size: "md",
    disabled: false,
    placeholder: "",
  },
);

defineEmits<{
  "update:modelValue": [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const id = useId();

const sizeClass = computed(() => {
  if (props.size === "sm") return "h-8 px-3 text-body-sm";
  return "h-10 px-3 text-body";
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
    <div
      :class="[
        'flex items-center gap-2 rounded-md border transition-colors duration-150',
        sizeClass,
        stateClass,
      ]"
    >
      <slot name="icon-left" />
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-invalid="!!error"
        :aria-describedby="error || helper ? `${id}-msg` : undefined"
        class="flex-1 bg-transparent outline-none placeholder:text-ink-tertiary disabled:cursor-not-allowed"
        @input="(e) => $emit('update:modelValue', (e.target as HTMLInputElement).value)"
        @blur="(e) => $emit('blur', e)"
        @focus="(e) => $emit('focus', e)"
      />
      <slot name="icon-right" />
    </div>
    <p
      v-if="error || helper"
      :id="`${id}-msg`"
      :class="['text-caption', error ? 'text-red-400' : 'text-ink-subtle']"
    >
      {{ error || helper }}
    </p>
  </div>
</template>
