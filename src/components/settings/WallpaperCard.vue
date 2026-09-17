<script setup lang="ts">
import { ref } from 'vue'
import { useUiStore } from '@/stores/ui'
import { validateImageFile, fileToDataUrl, MAX_WALLPAPER_MB } from '@/lib/wallpaper'
import Card from '@/components/ui/Card.vue'
import Text from '@/components/ui/Text.vue'
import Button from '@/components/ui/Button.vue'

const ui = useUiStore()

const fileInput = ref<HTMLInputElement | null>(null)
const error = ref<string | null>(null)

function pickFile() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const validation = validateImageFile(file)
  if (!validation.ok) {
    error.value =
      validation.reason === 'type'
        ? 'El archivo debe ser una imagen.'
        : `La imagen supera el máximo de ${MAX_WALLPAPER_MB} MB.`
    return
  }

  try {
    const dataUrl = await fileToDataUrl(file)
    await ui.setWallpaper(dataUrl)
    error.value = null
  } catch {
    error.value = 'No se pudo guardar el fondo. Intentá de nuevo.'
  }
}

async function onRemove() {
  error.value = null
  await ui.removeWallpaper()
}
</script>

<template>
  <Card variant="default" padding="md" data-testid="wallpaper-card">
    <div class="flex items-start justify-between gap-3">
      <div class="flex flex-col gap-1">
        <Text variant="card-title" as="h2">Fondo</Text>
        <Text variant="body-sm" color="muted">
          Tu imagen se muestra desenfocada y atenuada para no competir con el contenido.
        </Text>
      </div>
    </div>

    <div class="mt-4 flex flex-col gap-3">
      <div
        v-if="ui.wallpaperUrl"
        data-testid="wallpaper-preview"
        class="wallpaper-image-blur relative h-28 overflow-hidden rounded-md border border-hairline bg-cover bg-center"
        :style="`background-image: url('${ui.wallpaperUrl}')`"
      >
        <div class="wallpaper-scrim absolute inset-0" />
      </div>

      <div class="flex items-center gap-2">
        <Button variant="secondary" size="sm" data-testid="wallpaper-upload-btn" @click="pickFile">
          Subir imagen
        </Button>
        <Button
          v-if="ui.wallpaperUrl"
          variant="ghost"
          size="sm"
          data-testid="wallpaper-remove-btn"
          @click="onRemove"
        >
          Quitar
        </Button>
      </div>

      <Text v-if="error" variant="caption" color="subtle" data-testid="wallpaper-error">
        {{ error }}
      </Text>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        data-testid="wallpaper-input"
        @change="onFileChange"
      />
    </div>
  </Card>
</template>
