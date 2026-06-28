import { useDark, useToggle } from "@vueuse/core";
import { computed } from "vue";

export type ThemeChoice = "light" | "dark";

const isDark = useDark({
  storageKey: "habitos.theme",
  valueDark: "dark",
  valueLight: "light",
});

const toggle = useToggle(isDark);

export function useTheme() {
  return {
    theme: computed<ThemeChoice>(() => (isDark.value ? "dark" : "light")),
    isDark: computed<boolean>(() => isDark.value),
    setTheme: (v: ThemeChoice) => {
      isDark.value = v === "dark";
    },
    toggleDark: () => toggle(),
  };
}
