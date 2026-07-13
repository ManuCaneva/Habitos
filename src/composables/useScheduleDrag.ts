import interact from "interactjs";
import { onUnmounted, type Ref, watch } from "vue";

interface DragCtx {
  columnWidthPx: () => number;   // containerWidth / 7
  rowHeightPx:   () => number;   // visibleHeight / visibleRows
  dayStart:       () => number;  // minutes
  granularity:    () => number;  // minutes
  onEnd: (day: number, start_minutes: number, end_minutes: number) => void | Promise<void>;
  onOverrideRejected: () => void; // feedback visual si overlap
}

export function useScheduleDrag(elRef: Ref<HTMLElement | null>, enabled: Ref<boolean>, ctx: DragCtx) {
  let interactable: ReturnType<typeof interact> | null = null;

  function init() {
    if (!elRef.value) return;
    interactable = interact(elRef.value).draggable({
      enabled: enabled.value,
      inertia: false,
      modifiers: [],
      listeners: {
        start(event) {
          event.stopPropagation();
        },
        move(event) {
          event.stopPropagation();
          const target = event.target as HTMLElement;
          const x = (parseFloat(target.getAttribute("data-x") || "0") || 0) + event.dx;
          const y = (parseFloat(target.getAttribute("data-y") || "0") || 0) + event.dy;

          target.style.transform = `translate(${x}px, ${y}px)`;
          target.style.zIndex = "40"; // Asegurar que esté por encima de otros

          target.setAttribute("data-x", String(x));
          target.setAttribute("data-y", String(y));
        },
        end(event) {
          event.stopPropagation();
          const target = event.target as HTMLElement;
          const x = parseFloat(target.getAttribute("data-x") || "0") || 0;
          const y = parseFloat(target.getAttribute("data-y") || "0") || 0;

          // Limpiar estilos temporales de drag
          target.style.transform = "";
          target.style.zIndex = "";
          target.removeAttribute("data-x");
          target.removeAttribute("data-y");

          const colWidth = ctx.columnWidthPx();
          const minuteHeight = ctx.rowHeightPx() / ctx.granularity();
          const dayStart = ctx.dayStart();
          const current = target.dataset;
          const currentDay = Number(current.day ?? "0");
          const currentStart = Number(current.start ?? "0");
          const currentEnd = Number(current.end ?? "0");
          const duration = currentEnd - currentStart;

          // Mover entre columnas (días)
          const dayDelta = Math.round(x / colWidth);
          let newDay = currentDay + dayDelta;
          newDay = Math.min(6, Math.max(0, newDay));

          // Mover en minutos
          const minuteDelta = y / minuteHeight;
          let newStart = currentStart + minuteDelta;
          newStart = Math.min(1440 - duration, Math.max(dayStart, newStart));
          newStart = Math.floor(newStart / ctx.granularity()) * ctx.granularity();

          const newEnd = newStart + duration;
          if (newEnd > 1440) { ctx.onOverrideRejected(); return; }

          ctx.onEnd(newDay, newStart, newEnd);
        },
      },
    });
  }

  watch(enabled, (val) => {
    if (interactable) {
      interactable.draggable(val);
    }
  });

  watch(elRef, (el) => {
    if (el) {
      init();
    } else {
      interactable?.unset();
      interactable = null;
    }
  });

  if (elRef.value) {
    init();
  }

  onUnmounted(() => { interactable?.unset(); });
  return { init };
}
