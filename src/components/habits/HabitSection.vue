<script setup lang="ts">
type Variant = "contained" | "flat";

withDefaults(defineProps<{ variant?: Variant }>(), {
  variant: "contained",
});

const variantClass = (v: Variant) => {
  switch (v) {
    case "contained":
      return "bg-surface-1 border border-hairline rounded-xl p-3";
    case "flat":
      return "";
  }
};
</script>

<template>
  <div :class="variantClass(variant)">
    <slot />
  </div>
</template>
