<script setup lang="ts">
import Container from "@/components/ui/Container.vue";
import TodayView from "@/views/TodayView.vue";
</script>

<template>
  <Container
    data-testid="habits-widget"
    variant="default"
    padding="none"
    class="h-full overflow-hidden"
    style="container-type: inline-size"
  >
    <TodayView />
  </Container>
</template>
