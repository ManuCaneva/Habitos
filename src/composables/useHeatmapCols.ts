import { ref, onMounted, onUnmounted, type Ref } from "vue";

export interface HeatmapColsOptions {
  containerRef: Ref<HTMLElement | null>;
  dataCols: number;
  cellSize?: number;
  gap?: number;
}

export function useHeatmapCols({
  containerRef,
  dataCols,
  cellSize = 10,
  gap = 2,
}: HeatmapColsOptions) {
  const cols = ref(dataCols);
  const actualCellSize = ref(cellSize);

  function updateCols() {
    const el = containerRef.value;
    if (!el) return;

    const width = el.clientWidth;
    const possible = Math.floor((width + gap) / (cellSize + gap));
    cols.value = Math.max(1, Math.min(possible, dataCols));
    actualCellSize.value = cellSize;
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
