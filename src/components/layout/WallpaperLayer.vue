<script setup lang="ts">
defineProps<{
  url: string | null
}>()

// El tratamiento visual (gradiente fallback, scrim, blur) vive en el
// stylesheet global: happy-dom descarta var() en estilos inline.
const imageStyle = (url: string) => `background-image: url("${url}")`
</script>

<template>
  <div
    data-testid="wallpaper-layer"
    class="absolute inset-0 -z-10 overflow-hidden"
    aria-hidden="true"
  >
    <div
      v-if="url"
      data-testid="wallpaper-image"
      class="wallpaper-image-blur absolute inset-0 bg-cover bg-center"
      :style="imageStyle(url)"
    />
    <div v-else data-testid="wallpaper-fallback" class="wallpaper-fallback absolute inset-0" />
    <div v-if="url" class="wallpaper-scrim absolute inset-0" />
  </div>
</template>
