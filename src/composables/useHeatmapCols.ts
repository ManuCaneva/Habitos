import { ref, onMounted, onUnmounted, type Ref } from "vue";

export interface HeatmapColsOptions {
  containerRef: Ref<HTMLElement | null>;
  dataCols: number;
  cellSize?: number;
  minCellSize?: number;
  maxCellSize?: number;
  gap?: number;
}

export function useHeatmapCols({
  containerRef,
  dataCols,
  cellSize = 10,
  minCellSize = 6,
  maxCellSize = 12,
  gap = 2,
}: HeatmapColsOptions) {
  const cols = ref(dataCols);
  const actualCellSize = ref(cellSize);

  function updateCols() {
    const el = containerRef.value;
    if (!el) return;

    const width = el.clientWidth;
    const desired = Math.max(minCellSize, Math.min(maxCellSize, cellSize));

    const possible = Math.floor((width + gap) / (desired + gap));

    if (possible >= 1) {
      cols.value = Math.min(possible, dataCols);
      actualCellSize.value = desired;
    } else {
      const minPossible = Math.floor((width + gap) / (minCellSize + gap));
      cols.value = Math.max(1, Math.min(minPossible, dataCols));
      actualCellSize.value = minCellSize;
    }
  }

  let observer: ResizeObserver | null = null;

  onMounted(() => {
    updateCols();
    if (containerRef.value) {
      observer = new ResizeObserver(() => updateCols());
      observer.observe(containerRef.value);
    }
  });

  onUnmounted(() => {
    observer?.disconnect();
  });

  return { cols, actualCellSize };
}
