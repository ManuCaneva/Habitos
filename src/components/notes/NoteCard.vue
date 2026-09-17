<script setup lang="ts">
import { computed } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'
import type { Note } from '@/schemas/notes'
import { useUiStore } from '@/stores/ui'
import Container from '@/components/ui/Container.vue'
import Text from '@/components/ui/Text.vue'
import NoteContextMenu from './NoteContextMenu.vue'

const props = defineProps<{
  note: Note
}>()

const ui = useUiStore()

const isMenuOpen = computed(() => ui.menuOpenForNoteId === props.note.id)
</script>

<template>
  <Container
    data-testid="note-card"
    variant="ghost"
    padding="sm"
    :class="['note-card-responsive group relative', isMenuOpen && 'z-10']"
  >
    <div class="flex items-start gap-3">
      <div
        data-testid="note-color-indicator"
        class="mt-0.5 h-10 w-1 shrink-0 rounded-full"
        :style="{ backgroundColor: note.color }"
      />

      <div class="min-w-0 flex-1">
        <div class="mb-1 flex items-center gap-2">
          <Text as="div" variant="body" weight="500" class="truncate">
            {{ note.title ?? note.description }}
          </Text>
          <button
            data-testid="note-menu-button"
            :data-note-menu-trigger="note.id"
            class="ml-auto rounded-md p-1 text-ink-muted opacity-0 transition-colors duration-150 hover:bg-surface-2 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
            @click.stop="ui.toggleNoteMenu(note.id)"
          >
            <MoreHorizontal :size="16" />
          </button>
        </div>

        <Text
          v-if="note.title && note.description"
          data-testid="note-description"
          as="div"
          variant="body-sm"
          color="muted"
          class="truncate"
        >
          {{ note.description }}
        </Text>
      </div>
    </div>
    <NoteContextMenu v-if="isMenuOpen" :note-id="note.id" />
  </Container>
</template>
