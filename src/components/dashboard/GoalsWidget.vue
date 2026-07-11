<script setup lang="ts">
import Container from "@/components/ui/Container.vue";
import GoalsListView from "@/views/GoalsListView.vue";
</script>

<template>
  <Container
    data-testid="goals-widget"
    variant="default"
    padding="none"
    class="h-full overflow-hidden"
    style="container-type: inline-size"
  >
    <GoalsListView />
  </Container>
</template>
