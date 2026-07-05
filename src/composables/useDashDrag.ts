import { watch, type Ref } from "vue";
import interact from "interactjs";
import type { GridDimensions } from "./useDashGrid";

export interface DragCallbacks {
  onDragStart: () => void;
  onDragMove: (dx: number, dy: number) => void;
  onDragEnd: () => void;
  onResizeStart: () => void;
  onResizeMove: (dw: number, dh: number) => void;
  onResizeEnd: () => void;
}

export function useDashDrag(
  elRef: Ref<HTMLElement | null>,
  editMode: Ref<boolean>,
  _dims: Ref<GridDimensions>,
  callbacks: DragCallbacks,
) {
  let interactable: ReturnType<typeof interact> | null = null;

  function setup() {
    const el = elRef.value;
    if (!el) return;

    interactable = interact(el);

    interactable
      .draggable({
        enabled: editMode.value,
        inertia: false,
        modifiers: [],
        listeners: {
          start() {
            callbacks.onDragStart();
          },
          move(event) {
            callbacks.onDragMove(event.dx, event.dy);
          },
          end() {
            callbacks.onDragEnd();
          },
        },
      })
      .resizable({
        enabled: editMode.value,
        edges: { left: false, right: true, bottom: true, top: false },
        modifiers: [],
        listeners: {
          start() {
            callbacks.onResizeStart();
          },
          move(event) {
            callbacks.onResizeMove(event.deltaRect.width, event.deltaRect.height);
          },
          end() {
            callbacks.onResizeEnd();
          },
        },
      });
  }

  watch(editMode, (enabled) => {
    if (interactable) {
      interactable.draggable({ enabled });
      interactable.resizable({ enabled });
    }
  });

  watch(elRef, (el) => {
    if (el) {
      setup();
    } else {
      interactable?.unset();
      interactable = null;
    }
  });

  if (elRef.value) {
    setup();
  }

  return () => {
    interactable?.unset();
    interactable = null;
  };
}
