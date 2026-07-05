<script setup lang="ts">
import { ref, computed } from "vue";
import type { LayoutItem } from "@/stores/dashboard";
import type { GridDimensions } from "@/composables/useDashGrid";
import { useDashDrag } from "@/composables/useDashDrag";

const props = defineProps<{
  item: LayoutItem;
  dims: GridDimensions;
  editMode: boolean;
}>();

const emit = defineEmits<{
  moved: [id: string, x: number, y: number];
  resized: [id: string, w: number, h: number];
}>();

const elRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);

function gridToPixel() {
  const { colWidth, rowHeight, marginX, marginY } = props.dims;
  const cellW = colWidth + marginX;
  const cellH = rowHeight + marginY;
  return {
    left: props.item.x * cellW,
    top: props.item.y * cellH,
    width: props.item.w * colWidth + (props.item.w - 1) * marginX,
    height: props.item.h * rowHeight + (props.item.h - 1) * marginY,
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
    const { colWidth, rowHeight, marginX, marginY } = props.dims;
    const cellW = colWidth + marginX;
    const cellH = rowHeight + marginY;
    const px = gridToPixel();
    const newX = Math.max(0, Math.round((px.left + dragAccumX) / cellW));
    const newY = Math.max(0, Math.round((px.top + dragAccumY) / cellH));
    dragAccumX = 0;
    dragAccumY = 0;
    resizeAccumW = 0;
    resizeAccumH = 0;
    isDragging.value = false;
    emit("moved", props.item.i, newX, newY);
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
    const { colWidth, rowHeight, marginX, marginY } = props.dims;
    const cellW = colWidth + marginX;
    const cellH = rowHeight + marginY;
    const px = gridToPixel();
    const newW = Math.max(1, Math.round((px.width + resizeAccumW + marginX) / cellW));
    const newH = Math.max(1, Math.round((px.height + resizeAccumH + marginY) / cellH));
    dragAccumX = 0;
    dragAccumY = 0;
    resizeAccumW = 0;
    resizeAccumH = 0;
    isDragging.value = false;
    emit("resized", props.item.i, newW, newH);
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
  border-radius: 16px;
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
