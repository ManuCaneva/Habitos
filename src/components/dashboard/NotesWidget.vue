<script setup lang="ts">
import Container from '@/components/ui/Container.vue'
import NotesListView from '@/views/NotesListView.vue'
</script>

<template>
  <Container
    data-testid="notes-widget"
    variant="default"
    padding="none"
    class="container-widget h-full overflow-hidden"
    style="container-type: inline-size"
  >
    <NotesListView :show-eyebrow="false" />
  </Container>
</template>
