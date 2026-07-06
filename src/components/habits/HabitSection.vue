<script setup lang="ts">
import Container from "@/components/ui/Container.vue";

withDefaults(defineProps<{ variant?: "contained" | "flat" }>(), {
  variant: "contained",
});
</script>

<template>
  <Container
    v-if="variant === 'contained'"
    variant="default"
    padding="md"
  >
    <slot />
  </Container>
  <div v-else>
    <slot />
  </div>
</template>
