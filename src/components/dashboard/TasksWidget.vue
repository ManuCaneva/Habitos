<script setup lang="ts">
import Container from "@/components/ui/Container.vue";
import TasksListView from "@/views/TasksListView.vue";
</script>

<template>
  <Container
    data-testid="tasks-widget"
    variant="default"
    padding="none"
    class="h-full overflow-hidden"
    style="container-type: inline-size"
  >
    <TasksListView />
  </Container>
</template>
