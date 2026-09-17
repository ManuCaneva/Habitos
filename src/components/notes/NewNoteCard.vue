<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import NewEntityCard from '@/components/ui/NewEntityCard.vue'

const ui = useUiStore()
</script>

<template>
  <NewEntityCard
    label="Nueva nota"
    aria-label="Crear nueva nota"
    data-testid="new-note-card"
    css-class="note-card-responsive new-note-card"
    @create="ui.openCreateNote()"
  />
</template>
