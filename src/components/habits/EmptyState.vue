<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { useUiStore } from "@/stores/ui";
import Text from "@/components/ui/Text.vue";
import Button from "@/components/ui/Button.vue";

const ui = useUiStore();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-section gap-5">
    <Text variant="subhead" color="muted">
      Todavía no tenés hábitos.
    </Text>
    <Button variant="primary" size="md" @click="ui.openCreate()">
      <template #icon-left><Plus :size="16" /></template>
      Crear tu primer hábito
    </Button>
  </div>
</template>
