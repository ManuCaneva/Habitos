<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { LayoutItem } from '@/stores/dashboard'
import { pxToCells } from '@/composables/gridSnap'
import {
  flipTransform,
  flipNeedsAnimation,
  FLIP_DURATION_MS,
  FLIP_EASING,
  type FlipRect,
} from '@/composables/flip'
import { useDashDrag } from '@/composables/useDashDrag'
import { COLS, ROWS } from '@/lib/grid'

const props = defineProps<{
  item: LayoutItem
  editMode: boolean
}>()

const emit = defineEmits<{
  moved: [id: string, x: number, y: number]
  resized: [id: string, w: number, h: number]
}>()

const elRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const isFlipping = ref(false)

const gridStyle = computed(() => ({
  gridColumn: `${props.item.x + 1} / span ${props.item.w}`,
  gridRow: `${props.item.y + 1} / span ${props.item.h}`,
}))

const editModeRef = computed(() => props.editMode)

function containerSize() {
  const container = elRef.value?.parentElement
  return {
    containerWidth: container?.clientWidth ?? 0,
    containerHeight: container?.clientHeight ?? 0,
  }
}

const ZERO_RECT: FlipRect = { left: 0, top: 0, width: 0, height: 0 }

function elementRect(el: HTMLElement): FlipRect {
  const rect = el.getBoundingClientRect()
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
}

function applyFlip(first: FlipRect) {
  const el = elRef.value
  if (!el) return
  const last = elementRect(el)
  if (!flipNeedsAnimation(first, last)) return
  const invert = flipTransform(first, last)
  el.style.transition = 'none'
  el.style.transform = invert
  // Force reflow: el pintado en la posición invertida antes de animar a cero.
  void el.offsetWidth
  el.style.transition = `transform ${FLIP_DURATION_MS}ms ${FLIP_EASING}`
  el.style.transform = ''
  isFlipping.value = true
  setTimeout(() => {
    el.style.transition = ''
    isFlipping.value = false
  }, FLIP_DURATION_MS)
}

let dragAccumX = 0
let dragAccumY = 0
let resizeAccumW = 0
let resizeAccumH = 0

function applyResizeOffset() {
  const el = elRef.value
  if (!el) return
  const { containerWidth, containerHeight } = containerSize()
  el.style.position = 'absolute'
  el.style.left = `${(props.item.x / COLS) * containerWidth}px`
  el.style.top = `${(props.item.y / ROWS) * containerHeight}px`
  el.style.width = `${(props.item.w / COLS) * containerWidth + resizeAccumW}px`
  el.style.height = `${(props.item.h / ROWS) * containerHeight + resizeAccumH}px`
}

useDashDrag(elRef, editModeRef, {
  onDragStart() {
    isDragging.value = true
    dragAccumX = 0
    dragAccumY = 0
    resizeAccumW = 0
    resizeAccumH = 0
  },
  onDragMove(dx, dy) {
    dragAccumX += dx
    dragAccumY += dy
    const el = elRef.value
    if (el) {
      el.style.transform = `translate(${dragAccumX}px, ${dragAccumY}px)`
    }
  },
  onDragEnd() {
    const el = elRef.value
    const first = el ? elementRect(el) : ZERO_RECT
    if (el) {
      el.style.transform = ''
    }
    const { containerWidth, containerHeight } = containerSize()
    const colWidth = containerWidth / COLS
    const rowHeight = containerHeight / ROWS
    const startLeft = props.item.x * colWidth
    const startTop = props.item.y * rowHeight
    const snapped = pxToCells(
      startLeft + dragAccumX,
      startTop + dragAccumY,
      props.item.w * colWidth,
      props.item.h * rowHeight,
      containerWidth,
      containerHeight,
      { minW: props.item.minW, minH: props.item.minH }
    )
    dragAccumX = 0
    dragAccumY = 0
    resizeAccumW = 0
    resizeAccumH = 0
    isDragging.value = false
    emit('moved', props.item.i, snapped.x, snapped.y)
    if (el) {
      nextTick(() => applyFlip(first))
    }
  },
  onResizeStart() {
    isDragging.value = true
    dragAccumX = 0
    dragAccumY = 0
    resizeAccumW = 0
    resizeAccumH = 0
    applyResizeOffset()
  },
  onResizeMove(dw, dh) {
    resizeAccumW += dw
    resizeAccumH += dh
    applyResizeOffset()
  },
  onResizeEnd() {
    const el = elRef.value
    const first = el ? elementRect(el) : ZERO_RECT
    if (el) {
      el.style.position = ''
      el.style.left = ''
      el.style.top = ''
      el.style.width = ''
      el.style.height = ''
    }
    const { containerWidth, containerHeight } = containerSize()
    const colWidth = containerWidth / COLS
    const rowHeight = containerHeight / ROWS
    const snapped = pxToCells(
      props.item.x * colWidth,
      props.item.y * rowHeight,
      props.item.w * colWidth + resizeAccumW,
      props.item.h * rowHeight + resizeAccumH,
      containerWidth,
      containerHeight,
      { minW: props.item.minW, minH: props.item.minH }
    )
    dragAccumX = 0
    dragAccumY = 0
    resizeAccumW = 0
    resizeAccumH = 0
    isDragging.value = false
    emit('resized', props.item.i, snapped.w, snapped.h)
    if (el) {
      nextTick(() => applyFlip(first))
    }
  },
})
</script>

<template>
  <div
    ref="elRef"
    :style="gridStyle"
    :class="[
      'grid-item',
      editMode && 'grid-item--editable',
      isDragging && 'grid-item--dragging',
      isFlipping && 'grid-item--flip',
    ]"
  >
    <slot />
  </div>
</template>

<style scoped>
.grid-item {
  border-radius: 2px;
  contain: layout paint;
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

.grid-item--flip {
  will-change: transform;
}
</style>
