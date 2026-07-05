import { defineStore } from "pinia";
import { shallowRef, markRaw } from "vue";
import { useStorage } from "@vueuse/core";
import { widgets, getWidgetById } from "@/lib/dashboardWidgets";

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export type Layout = LayoutItem[];

const STORAGE_KEY = "habitos-dashboard-layout";

function getDefaultLayout(): Layout {
  return widgets.map((widget) =>
    markRaw({
      i: widget.id,
      x: widget.defaultX,
      y: widget.defaultY,
      w: widget.defaultW,
      h: widget.defaultH,
      minW: widget.minWidth,
      minH: widget.minHeight,
    }),
  );
}

function isValidItem(item: unknown): item is LayoutItem {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.i === "string" &&
    obj.i.length > 0 &&
    typeof obj.x === "number" &&
    typeof obj.y === "number" &&
    typeof obj.w === "number" &&
    typeof obj.h === "number"
  );
}

function validateLayout(raw: unknown): Layout | null {
  if (!Array.isArray(raw)) return null;
  const valid = raw.filter(isValidItem).map((item) =>
    markRaw({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
    }),
  );
  return valid.length > 0 ? valid : null;
}

export const useDashboardStore = defineStore("dashboard", () => {
  const savedLayout = useStorage<Layout | null>(STORAGE_KEY, null);

  const validated = validateLayout(savedLayout.value);
  const layout = shallowRef<Layout>(validated ?? getDefaultLayout());

  function persist() {
    savedLayout.value = [...layout.value];
  }

  function updateLayout(newLayout: Layout) {
    layout.value = newLayout.map((item) => markRaw({ ...item }));
    persist();
  }

  function moveTo(id: string, x: number, y: number) {
    const item = layout.value.find((i) => i.i === id);
    if (!item) return;
    item.x = x;
    item.y = y;
    layout.value = [...layout.value];
    persist();
  }

  function resizeTo(id: string, w: number, h: number) {
    const item = layout.value.find((i) => i.i === id);
    if (!item) return;
    item.w = w;
    item.h = h;
    layout.value = [...layout.value];
    persist();
  }

  function addWidget(widgetId: string) {
    const widget = getWidgetById(widgetId);
    if (!widget) return;
    if (layout.value.some((item) => item.i === widgetId)) return;

    layout.value = [
      ...layout.value,
      markRaw({
        i: widget.id,
        x: widget.defaultX,
        y: widget.defaultY,
        w: widget.defaultW,
        h: widget.defaultH,
        minW: widget.minWidth,
        minH: widget.minHeight,
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
