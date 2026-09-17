<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useNotesStore } from '@/stores/notes'
import NoteCard from '@/components/notes/NoteCard.vue'
import NewNoteCard from '@/components/notes/NewNoteCard.vue'
import NotesEmptyState from '@/components/notes/EmptyState.vue'
import EntityListing from '@/components/ui/EntityListing.vue'

withDefaults(
  defineProps<{
    showEyebrow?: boolean
  }>(),
  {
    showEyebrow: true,
  }
)

const notes = useNotesStore()

const list = computed(() => notes.notes)

onMounted(() => {
  if (notes.notes.length === 0 && !notes.loading) {
    notes.loadNotes()
  }
})
</script>

<template>
  <EntityListing
    title="Notas"
    eyebrow="Todo"
    :show-eyebrow="showEyebrow"
    panel-test-id="notes-panel"
    entity-class="notes"
  >
    <NotesEmptyState v-if="list.length === 0" />
    <div v-else class="flex flex-col gap-2">
      <NoteCard v-for="note in list" :key="note.id" :note="note" />
    </div>
    <template #footer>
      <NewNoteCard />
    </template>
  </EntityListing>
</template>
