<script setup lang="ts">
import { computed } from "vue";

type Variant =
  | "display-xl"
  | "display-lg"
  | "display-md"
  | "headline"
  | "card-title"
  | "subhead"
  | "body-lg"
  | "body"
  | "body-sm"
  | "caption"
  | "button"
  | "eyebrow"
  | "mono";

type AsTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "label";

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    as?: AsTag;
    color?: "default" | "muted" | "subtle" | "tertiary" | "primary" | "success";
    weight?: "400" | "500" | "600" | "700";
    mono?: boolean;
  }>(),
  {
    variant: "body",
    as: "p",
    color: "default",
    weight: undefined,
    mono: false,
  },
);

const colorClass = computed(() => {
  switch (props.color) {
    case "muted":
      return "text-ink-muted";
    case "subtle":
      return "text-ink-subtle";
    case "tertiary":
      return "text-ink-tertiary";
    case "primary":
      return "text-primary";
    case "success":
      return "text-success";
    default:
      return "text-ink";
  }
});

const weightClass = computed(() => {
  if (props.weight) return `font-${props.weight}`;
  return "";
});
</script>

<template>
  <component
    :is="as"
    :class="[
      `text-${variant}`,
      colorClass,
      weightClass,
      mono && 'font-mono',
    ]"
  >
    <slot />
  </component>
</template>
