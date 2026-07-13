import { defineStore } from "pinia";
import { shallowRef, markRaw } from "vue";
import { widgets, getWidgetById } from "@/lib/dashboardWidgets";
import { saveConfig, loadConfig } from "@/lib/db";

const COLS = 12;
const DEFAULT_MAX_ROWS = 10;
const GRID_STEP_X = 1 / COLS;
const GRID_STEP_Y = 1 / DEFAULT_MAX_ROWS;

export interface LayoutItem {
  i: string;
  xPercent: number;
  yPercent: number;
  wPercent: number;
  hPercent: number;
  minWPercent?: number;
  minHPercent?: number;
  maxWPercent?: number;
  maxHPercent?: number;
  static?: boolean;
}

export type Layout = LayoutItem[];

/**
 * Detecta si un item (xPercent, yPercent, wPercent, hPercent) colisiona
 * con cualquier otro item del layout. Retorna true si hay colisión.
 * `ignoreId` permite excluir un item del check (útil al mover/redimensionar).
 */
const COLLISION_EPSILON = 1e-6;

export function wouldCollide(
  xPercent: number,
  yPercent: number,
  wPercent: number,
  hPercent: number,
  layout: Layout,
  ignoreId?: string,
): boolean {
  for (const item of layout) {
    if (ignoreId && item.i === ignoreId) continue;
    const overlapX = Math.min(xPercent + wPercent, item.xPercent + item.wPercent) - Math.max(xPercent, item.xPercent);
    const overlapY = Math.min(yPercent + hPercent, item.yPercent + item.hPercent) - Math.max(yPercent, item.yPercent);
    if (overlapX > COLLISION_EPSILON && overlapY > COLLISION_EPSILON) {
      return true;
    }
  }
  return false;
}

/**
 * Busca la primera posición libre (x, y) para un item de tamaño (w, h)
 * en una grilla de paso GRID_STEP_X × GRID_STEP_Y.
 * Retorna null si no hay espacio.
 */
export function findFreePosition(
  wPercent: number,
  hPercent: number,
  layout: Layout,
): { xPercent: number; yPercent: number } | null {
  const cols = Math.floor(1 / GRID_STEP_X);
  const rows = Math.floor(1 / GRID_STEP_Y);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * GRID_STEP_X;
      const y = row * GRID_STEP_Y;
      if (x + wPercent > 1.0001) continue;
      if (y + hPercent > 1.0001) continue;
      if (!wouldCollide(x, y, wPercent, hPercent, layout)) {
        return { xPercent: x, yPercent: y };
      }
    }
  }
  return null;
}

const STORAGE_KEY = "habitos-dashboard-layout";

function getDefaultLayout(): Layout {
  return widgets.map((widget) =>
    markRaw({
      i: widget.id,
      xPercent: widget.defaultX,
      yPercent: widget.defaultY,
      wPercent: widget.defaultWPercent,
      hPercent: widget.defaultHPercent,
      minWPercent: widget.minWidthPercent,
      minHPercent: widget.minHeightPercent,
    }),
  );
}

function isPercentItem(item: unknown): item is LayoutItem {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.i === "string" &&
    obj.i.length > 0 &&
    typeof obj.xPercent === "number" &&
    typeof obj.yPercent === "number" &&
    typeof obj.wPercent === "number" &&
    typeof obj.hPercent === "number"
  );
}

function isLegacyItem(item: unknown): item is { i: string; x: number; y: number; w: number; h: number } {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.i === "string" &&
    obj.i.length > 0 &&
    typeof obj.x === "number" &&
    typeof obj.y === "number" &&
    typeof obj.w === "number" &&
    typeof obj.h === "number" &&
    obj.xPercent === undefined
  );
}

function migrateLegacyToPercent(legacy: { i: string; x: number; y: number; w: number; h: number }): LayoutItem {
  return {
    i: legacy.i,
    xPercent: legacy.x / COLS,
    yPercent: legacy.y / DEFAULT_MAX_ROWS,
    wPercent: legacy.w / COLS,
    hPercent: legacy.h / DEFAULT_MAX_ROWS,
  };
}

function validateLayout(raw: unknown): Layout | null {
  if (!Array.isArray(raw)) return null;
  const valid: LayoutItem[] = [];
  for (const item of raw) {
    if (isPercentItem(item)) {
      valid.push(
        markRaw({
          i: item.i,
          xPercent: item.xPercent,
          yPercent: item.yPercent,
          wPercent: item.wPercent,
          hPercent: item.hPercent,
          minWPercent: item.minWPercent,
          minHPercent: item.minHPercent,
          maxWPercent: item.maxWPercent,
          maxHPercent: item.maxHPercent,
        }),
      );
    } else if (isLegacyItem(item)) {
      const migrated = migrateLegacyToPercent(item);
      valid.push(
        markRaw({
          i: migrated.i,
          xPercent: migrated.xPercent,
          yPercent: migrated.yPercent,
          wPercent: migrated.wPercent,
          hPercent: migrated.hPercent,
        }),
      );
    }
  }
  return valid.length > 0 ? valid : null;
}

export const useDashboardStore = defineStore("dashboard", () => {
  const layout = shallowRef<Layout>(getDefaultLayout());

  loadConfig(STORAGE_KEY).then((raw) => {
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw);
        const validated = validateLayout(parsed);
        if (validated) layout.value = validated;
      } catch {
        // datos corruptos → usar default
      }
    }
  });

  function persist() {
    saveConfig(STORAGE_KEY, JSON.stringify(layout.value)).catch(() => {});
  }

  function updateLayout(newLayout: Layout) {
    layout.value = newLayout.map((item) => markRaw({ ...item }));
    persist();
  }

  function moveTo(id: string, xPercent: number, yPercent: number) {
    const item = layout.value.find((i) => i.i === id);
    if (!item) return;
    const clampedX = Math.max(0, Math.min(1 - item.wPercent, xPercent));
    const clampedY = Math.max(0, Math.min(1 - item.hPercent, yPercent));
    if (wouldCollide(clampedX, clampedY, item.wPercent, item.hPercent, layout.value, id)) {
      return;
    }
    layout.value = layout.value.map((i) =>
      i.i === id ? markRaw({ ...i, xPercent: clampedX, yPercent: clampedY }) : i,
    );
    persist();
  }

  function resizeTo(id: string, wPercent: number, hPercent: number) {
    const item = layout.value.find((i) => i.i === id);
    if (!item) return;
    const minW = item.minWPercent ?? GRID_STEP_X;
    const minH = item.minHPercent ?? GRID_STEP_Y;
    const clampedW = Math.max(minW, Math.min(1 - item.xPercent, wPercent));
    const clampedH = Math.max(minH, Math.min(1 - item.yPercent, hPercent));
    if (wouldCollide(item.xPercent, item.yPercent, clampedW, clampedH, layout.value, id)) {
      return;
    }
    layout.value = layout.value.map((i) =>
      i.i === id ? markRaw({ ...i, wPercent: clampedW, hPercent: clampedH }) : i,
    );
    persist();
  }

  function addWidget(widgetId: string) {
    const widget = getWidgetById(widgetId);
    if (!widget) return;
    if (layout.value.some((item) => item.i === widgetId)) return;

    const defaultX = widget.defaultX;
    const defaultY = widget.defaultY;
    const defaultW = widget.defaultWPercent;
    const defaultH = widget.defaultHPercent;

    let wPercent = defaultW;
    let hPercent = defaultH;
    let position: { xPercent: number; yPercent: number } | null = null;

    if (!wouldCollide(defaultX, defaultY, defaultW, defaultH, layout.value)) {
      position = { xPercent: defaultX, yPercent: defaultY };
    }

    if (!position) {
      position = findFreePosition(defaultW, defaultH, layout.value);
    }

    if (!position) {
      const minW = widget.minWidthPercent;
      const minH = widget.minHeightPercent;
      position = findFreePosition(minW, minH, layout.value);
      if (position) {
        wPercent = minW;
        hPercent = minH;
        console.warn(`Widget "${widget.title}" colocado a tamaño mínimo (grilla congestionada)`);
      }
    }

    if (!position) {
      console.error(`No se pudo colocar el widget "${widget.title}": no hay espacio en la grilla.`);
      return;
    }

    layout.value = [
      ...layout.value,
      markRaw({
        i: widget.id,
        xPercent: position.xPercent,
        yPercent: position.yPercent,
        wPercent,
        hPercent,
        minWPercent: widget.minWidthPercent,
        minHPercent: widget.minHeightPercent,
      }),
    ];
    persist();
  }

  function removeWidget(widgetId: string) {
    layout.value = layout.value.filter((item) => item.i !== widgetId);
    persist();
  }

  function resetLayout() {
    layout.value = getDefaultLayout();
    persist();
  }

  return {
    layout,
    updateLayout,
    moveTo,
    resizeTo,
    addWidget,
    removeWidget,
    resetLayout,
  };
});
