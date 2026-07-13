import { useStorage } from "@vueuse/core";
import { computed } from "vue";
import {
  themes,
  applyTheme,
  DEFAULT_THEME,
  type ThemeDefinition,
} from "@/lib/themes";

const currentId = useStorage<string>("habitos.theme", DEFAULT_THEME.id);

export function useTheme() {
  const current = computed<ThemeDefinition>(
    () => themes.find((t) => t.id === currentId.value) ?? DEFAULT_THEME,
  );

  function setTheme(id: string) {
    const theme = themes.find((t) => t.id === id);
    if (!theme) return;
    currentId.value = id;
    applyTheme(theme);
  }

  // Aplicar tema al montar
  applyTheme(current.value);

  return {
    current,
    currentId,
    setTheme,
    themes: [...themes],
  };
}
