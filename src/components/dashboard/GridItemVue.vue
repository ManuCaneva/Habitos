<script setup lang="ts">
import { ref, computed } from "vue";
import type { LayoutItem } from "@/stores/dashboard";
import type { GridDimensions } from "@/composables/useDashGrid";
import { snapToGrid } from "@/composables/useDashGrid";
import { useDashDrag } from "@/composables/useDashDrag";

const props = defineProps<{
  item: LayoutItem;
  dims: GridDimensions;
  editMode: boolean;
}>();

const emit = defineEmits<{
  moved: [id: string, xPercent: number, yPercent: number];
  resized: [id: string, wPercent: number, hPercent: number];
}>();

const elRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);

function gridToPixel() {
  const { containerWidth, containerHeight } = props.dims;
  return {
    left: props.item.xPercent * containerWidth,
    top: props.item.yPercent * containerHeight,
    width: props.item.wPercent * containerWidth,
    height: props.item.hPercent * containerHeight,
  };
}

const baseStyle = computed(() => {
  const px = gridToPixel();
  return {
    position: "absolute" as const,
    left: `${px.left}px`,
    top: `${px.top}px`,
    width: `${px.width}px`,
    height: `${px.height}px`,
  };
});

const editModeRef = computed(() => props.editMode);
const dimsRef = computed(() => props.dims);

let dragAccumX = 0;
let dragAccumY = 0;
let resizeAccumW = 0;
let resizeAccumH = 0;

function applyPixelOffset() {
  const el = elRef.value;
  if (!el) return;
  const px = gridToPixel();
  el.style.left = `${px.left + dragAccumX}px`;
  el.style.top = `${px.top + dragAccumY}px`;
  el.style.width = `${px.width + resizeAccumW}px`;
  el.style.height = `${px.height + resizeAccumH}px`;
}

useDashDrag(elRef, editModeRef, dimsRef, {
  onDragStart() {
    isDragging.value = true;
    dragAccumX = 0;
    dragAccumY = 0;
    resizeAccumW = 0;
    resizeAccumH = 0;
  },
  onDragMove(dx, dy) {
    dragAccumX += dx;
    dragAccumY += dy;
    applyPixelOffset();
  },
  onDragEnd() {
    const px = gridToPixel();
    const snapped = snapToGrid(
      px.left + dragAccumX,
      px.top + dragAccumY,
      px.width,
      px.height,
      props.dims,
      { minWPercent: props.item.minWPercent, minHPercent: props.item.minHPercent },
    );
    dragAccumX = 0;
    dragAccumY = 0;
    resizeAccumW = 0;
    resizeAccumH = 0;
    isDragging.value = false;
    emit("moved", props.item.i, snapped.xPercent, snapped.yPercent);
  },
  onResizeStart() {
    isDragging.value = true;
    dragAccumX = 0;
    dragAccumY = 0;
    resizeAccumW = 0;
    resizeAccumH = 0;
  },
  onResizeMove(dw, dh) {
    resizeAccumW += dw;
    resizeAccumH += dh;
    applyPixelOffset();
  },
  onResizeEnd() {
    const px = gridToPixel();
    const snapped = snapToGrid(
      px.left,
      px.top,
      px.width + resizeAccumW,
      px.height + resizeAccumH,
      props.dims,
      { minWPercent: props.item.minWPercent, minHPercent: props.item.minHPercent },
    );
    dragAccumX = 0;
    dragAccumY = 0;
    resizeAccumW = 0;
    resizeAccumH = 0;
    isDragging.value = false;
    emit("resized", props.item.i, snapped.wPercent, snapped.hPercent);
  },
});
</script>

<template>
  <div
    ref="elRef"
    :style="baseStyle"
    :class="[
      'grid-item',
      editMode && 'grid-item--editable',
      isDragging && 'grid-item--dragging',
    ]"
  >
    <slot />
  </div>
</template>

<style scoped>
.grid-item {
  transition: left 0.2s ease, top 0.2s ease, width 0.2s ease, height 0.2s ease;
  border-radius: 2px;
  will-change: left, top, width, height;
}

.grid-item--editable {
  cursor: grab;
}

.grid-item--editable:active {
  cursor: grabbing;
}

.grid-item--dragging {
  transition: none !important;
}
</style>
