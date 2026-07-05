<script setup lang="ts">
import TodayView from "@/views/TodayView.vue";
</script>

<template>
  <div
    data-testid="habits-widget"
    class="h-full overflow-auto rounded-xl bg-surface-1 border border-hairline p-3"
  >
    <TodayView />
  </div>
</template>
