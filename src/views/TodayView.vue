<script setup lang="ts">
import { computed } from "vue";
import { Plus } from "lucide-vue-next";
import { useHabitsStore } from "@/stores/habits";
import { useUiStore } from "@/stores/ui";
import HabitList from "@/components/habits/HabitList.vue";
import EmptyState from "@/components/habits/EmptyState.vue";
import Text from "@/components/ui/Text.vue";
import IconButton from "@/components/ui/IconButton.vue";

const habits = useHabitsStore();
const ui = useUiStore();

const list = computed(() => habits.activeHabits);
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="bg-surface-1 rounded-lg border border-hairline">
      <div class="flex items-center justify-between px-5 py-4 border-b border-hairline">
        <Text variant="card-title" weight="500">Hábitos</Text>
        <IconButton
          label="Nuevo hábito"
          variant="ghost"
          size="sm"
          @click="ui.openCreate()"
        >
          <Plus :size="16" />
        </IconButton>
      </div>
      <EmptyState v-if="list.length === 0" />
      <HabitList v-else :habits="list" />
    </div>
  </div>
</template>
