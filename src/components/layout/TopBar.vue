<script setup lang="ts">
import { computed } from "vue";
import { Plus } from "lucide-vue-next";
import { useUiStore } from "@/stores/ui";
import Text from "@/components/ui/Text.vue";
import Button from "@/components/ui/Button.vue";

const ui = useUiStore();

const todayLabel = computed(() => {
  const d = new Date();
  return d
    .toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .replace(/^./, (c) => c.toUpperCase());
});
</script>

<template>
  <header
    class="flex items-center justify-between px-6 py-5 border-b border-hairline"
  >
    <Text variant="card-title" as="h1" class="capitalize">
      {{ todayLabel }}
    </Text>
    <Button variant="primary" size="md" @click="ui.openCreate()">
      <template #icon-left><Plus :size="16" /></template>
      Nuevo hábito
    </Button>
  </header>
</template>
