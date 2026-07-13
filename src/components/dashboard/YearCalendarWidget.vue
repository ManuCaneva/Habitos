<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import { useCalendarStore } from "@/stores/calendar";
import MonthMini from "@/components/calendar/MonthMini.vue";
import Container from "@/components/ui/Container.vue";
import Text from "@/components/ui/Text.vue";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Loader2 } from "lucide-vue-next";
import { computeLayout, type LayoutResult } from "@/lib/calendarLayout";
import { DAY_LABELS } from "@/lib/calendarDates";
import type { LayoutItem } from "@/stores/dashboard";

const props = defineProps<{
  item?: LayoutItem;
}>();

const store = useCalendarStore();

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const bodyRef = ref<HTMLElement | null>(null);
const layout = ref<LayoutResult | null>(null);
const offset = ref(0);

let resizeObserver: ResizeObserver | null = null;

const targetCols = computed(() => {
  if (!props.item) return undefined;
  return Math.round(props.item.wPercent * 12);
});

function recompute() {
  const el = bodyRef.value;
  if (!el) return;

  const availW = el.clientWidth;
  const availH = el.clientHeight;

  const result = computeLayout(availW, availH, targetCols.value);
  if (!result) return;

  layout.value = result;

  const maxOffset = Math.max(0, 12 - result.visibleSlots);
  offset.value = Math.min(offset.value, maxOffset);
  offset.value = Math.floor(offset.value / result.cols) * result.cols;
}

watch(targetCols, () => {
  recompute();
});

onMounted(() => {
  store.syncYear(store.currentYear);
  if (bodyRef.value) {
    resizeObserver = new ResizeObserver(() => recompute());
    resizeObserver.observe(bodyRef.value);
  }
  recompute();
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});

const viewportRef = ref<HTMLElement | null>(null);

const maxScroll = computed(() => {
  if (!layout.value) return 0;
  const cols = layout.value.cols;
  const rows = Math.ceil(12 / cols);
  const totalH = rows * layout.value.monthHeight + (rows - 1) * layout.value.gridGap;
  const viewportH = viewportRef.value ? viewportRef.value.clientHeight : (layout.value.visibleSlots / cols) * (layout.value.monthHeight + layout.value.gridGap);
  return Math.max(0, totalH - viewportH);
});

const showArrows = computed(() => layout.value ? layout.value.visibleSlots < 12 : false);
const canGoUp = computed(() => offset.value > 0);
const canGoDown = computed(() => {
  if (!layout.value) return false;
  const currentScroll = Math.floor(offset.value / layout.value.cols) * (layout.value.monthHeight + layout.value.gridGap);
  return currentScroll < maxScroll.value - 1;
});

function goUp() {
  if (!canGoUp.value || !layout.value) return;
  offset.value = Math.max(0, offset.value - layout.value.cols);
}

function goDown() {
  if (!canGoDown.value || !layout.value) return;
  const rowH = layout.value.monthHeight + layout.value.gridGap;
  const maxRowIndex = Math.ceil(maxScroll.value / rowH);
  const nextOffset = offset.value + layout.value.cols;
  offset.value = Math.min(maxRowIndex * layout.value.cols, nextOffset);
}



function goPrev() {
  store.goPrevYear();
}

function goNext() {
  store.goNextYear();
}

watch(
  () => store.currentYear,
  (newYear, oldYear) => {
    if (newYear !== oldYear) {
      store.syncYear(newYear);
    }
  },
);
</script>

<template>
  <Container
    variant="default"
    padding="none"
    class="h-full overflow-hidden"
    data-testid="year-calendar-widget"
  >
    <div class="ycw">
      <header class="ycw__header">
        <div></div>
        <Text variant="caption" weight="600" class="ycw__title">Calendario Anual</Text>
        <Loader2
          v-if="store.syncing"
          :size="12"
          class="animate-spin text-ink-tertiary ycw__spinner"
          data-testid="sync-spinner"
        />
      </header>

      <div
        v-if="store.syncError && store.syncError !== 'Not connected'"
        class="ycw__error"
        data-testid="sync-error"
      >
        {{ store.syncError }}
      </div>

      <div class="ycw__body" ref="bodyRef">
        <div
          v-if="layout"
          class="ycw__grid-header"
          :style="{
            '--cols': layout.cols,
            '--grid-gap': `${layout.gridGap}px`,
            '--cell-gap-x': `${layout.cellGapX}px`,
            '--month-padding': `${layout.monthPadding}px`,
            '--cell-size': `${layout.cellSize}px`,
          }"
        >
          <div
            v-for="c in layout.cols"
            :key="c"
            class="ycw__col-header"
          >
            <span v-for="day in DAY_LABELS" :key="day" class="ycw__day-label">{{ day }}</span>
          </div>
        </div>

        <div class="ycw__grid-viewport" ref="viewportRef" v-if="layout">
          <div
            class="ycw__grid"
            :style="{
              '--cols': layout.cols,
              '--grid-gap': `${layout.gridGap}px`,
              'transform': `translateY(-${Math.min(Math.floor(offset / layout.cols) * (layout.monthHeight + layout.gridGap), maxScroll)}px)`,
            }"
          >
            <MonthMini
              v-for="m in 12"
              :key="m - 1"
              :year="store.currentYear"
              :month="m - 1"
              :month-name="MONTH_NAMES[m - 1]"
              :events-by-date="store.eventsByDate"
              :show-header="false"
              :style="{
                '--month-padding': `${layout.monthPadding}px`,
                '--cell-gap-x': `${layout.cellGapX}px`,
                '--cell-gap-y': `${layout.cellGapY}px`,
                '--cell-size': `${layout.cellSize}px`,
                '--month-h': `${layout.monthHeight}px`,
                '--month-header': `${layout.monthHeader}px`,
                '--font-size': `${Math.max(0.44, layout.cellSize * 0.044)}rem`,
              }"
            />
          </div>
        </div>
      </div>

      <footer class="ycw__footer">
        <div class="ycw__year-nav">
          <button class="ycw__btn" data-testid="year-prev" @click="goPrev">
            <ChevronLeft :size="12" />
          </button>
          <Text variant="caption" weight="600" class="ycw__year">{{ store.currentYear }}</Text>
          <button class="ycw__btn" data-testid="year-next" @click="goNext">
            <ChevronRight :size="12" />
          </button>
        </div>
        <div v-if="showArrows" class="ycw__month-nav">
          <button class="ycw__btn" :disabled="!canGoUp" data-testid="month-up" @click="goUp">
            <ChevronUp :size="12" />
          </button>
          <button class="ycw__btn" :disabled="!canGoDown" data-testid="month-down" @click="goDown">
            <ChevronDown :size="12" />
          </button>
        </div>
      </footer>
    </div>
  </Container>
</template>

<style scoped>
.ycw {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.ycw__header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid rgb(var(--color-hairline));
  background: rgb(var(--color-surface-2));
  flex-shrink: 0;
}

.ycw__title {
  text-align: center;
  color: rgb(var(--color-ink));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.ycw__spinner {
  justify-self: end;
}

.ycw__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-top: 1px solid rgb(var(--color-hairline));
  background: rgb(var(--color-surface-2));
  flex-shrink: 0;
}

.ycw__year-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ycw__year {
  color: rgb(var(--color-ink));
  min-width: 36px;
  text-align: center;
}

.ycw__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid rgb(var(--color-hairline));
  background: rgb(var(--color-surface-1));
  color: rgb(var(--color-ink-muted));
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  padding: 0;
}

.ycw__btn:hover:not(:disabled) {
  background: rgb(var(--color-surface-2));
  color: rgb(var(--color-ink));
}

.ycw__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.ycw__month-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ycw__error {
  font-size: 0.75rem;
  color: #e67c73;
  padding: 4px 8px;
  line-height: 1.2;
}

.ycw__body {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 4px;
  position: relative;
  overflow: hidden;
}

.ycw__grid-header {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: var(--grid-gap, 12px);
  flex-shrink: 0;
  margin-bottom: 6px;
}

.ycw__col-header {
  display: grid;
  grid-template-columns: repeat(7, var(--cell-size, auto));
  column-gap: var(--cell-gap-x, 2px);
  justify-content: center;
  width: 100%;
}

.ycw__day-label {
  text-align: center;
  font-size: 0.65rem;
  font-weight: 600;
  color: rgb(var(--color-ink-tertiary));
  line-height: 1;
  width: var(--cell-size, auto);
}

.ycw__grid-viewport {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.ycw__grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: var(--grid-gap, 12px);
  align-content: start;
  justify-content: center;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}
</style>
