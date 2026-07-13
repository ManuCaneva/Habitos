<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import { useCalendarStore } from "@/stores/calendar";
import MonthMini from "@/components/calendar/MonthMini.vue";
import Container from "@/components/ui/Container.vue";
import DayDetailsModal from "@/components/dashboard/DayDetailsModal.vue";
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
const selectedDate = ref("");
const showDayModal = ref(false);

function openDayModal(date: string) {
  selectedDate.value = date;
  showDayModal.value = true;
}

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
  const viewportH = (layout.value.visibleSlots / cols) * (layout.value.monthHeight + layout.value.gridGap) - layout.value.gridGap;
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
    <div 
      class="ycw"
      :class="layout ? `cols-${layout.cols}` : ''"
      :style="layout ? {
        '--cols': layout.cols,
        '--cell-size': `${layout.cellSize}px`,
        '--grid-gap': `${layout.gridGap}px`,
        '--month-padding': `${layout.monthPadding}px`,
        '--cell-gap-x': `${layout.cellGapX}px`,
        '--cell-gap-y': `${layout.cellGapY}px`,
        '--month-h': `${layout.monthHeight}px`,
        '--month-header': `${layout.monthHeader}px`,
        '--name-gap': `${layout.nameGap}px`,
        '--font-size': `${Math.max(0.72, layout.cellSize * 0.075)}rem`,
        '--title-font-size': `${Math.max(0.55, layout.cellSize * 0.042)}rem`,
      } : {}"
    >
      <header class="ycw__header" :style="{ '--title-font-size': 'var(--title-font-size, 0.75rem)' }">
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
        >
          <div
            v-for="c in layout.cols"
            :key="c"
            class="ycw__col-header"
          >
            <span v-for="day in DAY_LABELS" :key="day" class="ycw__day-label">{{ day }}</span>
          </div>
        </div>

        <div 
          class="ycw__grid-viewport" 
          ref="viewportRef" 
          v-if="layout"
          :style="!layout.showsAll ? {
            height: `${(layout.visibleSlots / layout.cols) * (layout.monthHeight + layout.gridGap) - layout.gridGap}px`,
            flex: 'none'
          } : {}"
        >
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
              @select-day="openDayModal"
            />
          </div>
        </div>
      </div>

      <footer class="ycw__footer">
        <div class="ycw__nav-container">
          <button 
            class="ycw__btn" 
            data-testid="year-prev" 
            @click="goPrev"
            :style="{
              width: `${Math.max(11, Math.min(28, (layout?.cellSize || 9) * 1.5))}px`,
              height: `${Math.max(11, Math.min(28, (layout?.cellSize || 9) * 1.5))}px`
            }"
          >
            <ChevronLeft />
          </button>
          <span 
            class="ycw__year"
            :style="{
              fontSize: `${Math.max(9, Math.min(16, (layout?.cellSize || 9) * 1.05))}px`
            }"
          >{{ store.currentYear }}</span>
          <button 
            class="ycw__btn" 
            data-testid="year-next" 
            @click="goNext"
            :style="{
              width: `${Math.max(11, Math.min(28, (layout?.cellSize || 9) * 1.5))}px`,
              height: `${Math.max(11, Math.min(28, (layout?.cellSize || 9) * 1.5))}px`
            }"
          >
            <ChevronRight />
          </button>
          
          <template v-if="showArrows">
            <button 
              class="ycw__btn" 
              :disabled="!canGoUp" 
              data-testid="month-up" 
              @click="goUp"
              :style="{
                width: `${Math.max(11, Math.min(28, (layout?.cellSize || 9) * 1.5))}px`,
                height: `${Math.max(11, Math.min(28, (layout?.cellSize || 9) * 1.5))}px`
              }"
            >
              <ChevronUp />
            </button>
            <button 
              class="ycw__btn" 
              :disabled="!canGoDown" 
              data-testid="month-down" 
              @click="goDown"
              :style="{
                width: `${Math.max(11, Math.min(28, (layout?.cellSize || 9) * 1.5))}px`,
                height: `${Math.max(11, Math.min(28, (layout?.cellSize || 9) * 1.5))}px`
              }"
            >
              <ChevronDown />
            </button>
          </template>
        </div>
      </footer>
    </div>
    <DayDetailsModal
      :open="showDayModal"
      :date="selectedDate"
      @close="showDayModal = false"
    />
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 8px;
  border-bottom: 1px solid rgb(var(--color-hairline));
  background: rgb(var(--color-surface-2));
  flex-shrink: 0;
}

.ycw__title {
  text-align: center;
  color: rgb(var(--color-ink));
  font-size: var(--title-font-size, 0.75rem);
  line-height: 1.2;
  word-wrap: break-word;
}

.ycw__spinner {
  flex-shrink: 0;
}

.ycw__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  border-top: 1px solid rgb(var(--color-hairline));
  background: rgb(var(--color-surface-2));
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
}

.ycw__nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
}

.ycw__nav-container:not(.has-arrows) {
  justify-content: center;
}

.ycw__year-group {
  display: flex;
  align-items: center;
  gap: calc(var(--cell-size, 9px) * 0.4);
}

.ycw__year {
  color: rgb(var(--color-ink));
  text-align: center;
  font-weight: 700;
  padding: 0 2px;
  flex-shrink: 0;
  white-space: nowrap;
}

.ycw__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 1px solid rgb(var(--color-hairline));
  background: rgb(var(--color-surface-1));
  color: rgb(var(--color-ink-muted));
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  padding: 0;
  flex-shrink: 0;
}

.ycw__btn :deep(svg) {
  width: 55%;
  height: 55%;
}

.ycw__btn:hover:not(:disabled) {
  background: rgb(var(--color-surface-2));
  color: rgb(var(--color-ink));
}

.ycw__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
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
