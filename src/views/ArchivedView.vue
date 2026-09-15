<script setup lang="ts">
import { computed } from 'vue'
import { Archive } from 'lucide-vue-next'
import { useHabitsStore } from '@/stores/habits'
import HabitList from '@/components/habits/HabitList.vue'
import Text from '@/components/ui/Text.vue'
import Heading from '@/components/ui/Heading.vue'

const habits = useHabitsStore()
const list = computed(() => habits.archivedHabits)
</script>

<template>
  <main
    data-testid="archived-view"
    class="scrollbar-gutter-stable flex h-full flex-col overflow-y-auto"
  >
    <header class="flex shrink-0 flex-col gap-1 px-6 pb-4 pt-12">
      <Text variant="eyebrow" color="subtle">Biblioteca</Text>
      <Heading>Archivados</Heading>
    </header>

    <div v-if="list.length === 0" class="flex flex-1 items-center justify-center px-6 py-12">
      <div class="flex flex-col items-center gap-3 text-center">
        <span
          class="flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-surface-1 text-ink-subtle"
        >
          <Archive :size="20" />
        </span>
        <Text variant="subhead" color="muted">No tenés hábitos archivados.</Text>
      </div>
    </div>
    <HabitList v-else :habits="list" show-archive-date />
  </main>
</template>
