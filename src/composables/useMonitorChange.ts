import { ref, onMounted, onUnmounted, watch } from "vue";
import { useDevicePixelRatio } from "@vueuse/core";

export function useMonitorChange() {
  const changed = ref(false);
  const { pixelRatio } = useDevicePixelRatio();
  let prevRatio = pixelRatio.value;
  let unlistenMove: (() => void) | null = null;

  watch(pixelRatio, (newRatio) => {
    if (newRatio !== prevRatio) {
      prevRatio = newRatio;
      changed.value = true;
    }
  });

  onMounted(async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      unlistenMove = await win.onMoved(() => {
        changed.value = true;
      });
    } catch {
      // Not running in Tauri (e.g. tests or browser)
    }
  });

  onUnmounted(() => {
    unlistenMove?.();
  });

  function ackChange() {
    changed.value = false;
  }

  return { changed, ackChange };
}
