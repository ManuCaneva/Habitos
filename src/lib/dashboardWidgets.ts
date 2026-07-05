import type { Component } from "vue";
import HabitsWidget from "@/components/dashboard/HabitsWidget.vue";

export interface DashboardWidget {
  id: string;
  title: string;
  icon?: string;
  component: Component;
  minWidth: number;
  minHeight: number;
  defaultX: number;
  defaultY: number;
  defaultW: number;
  defaultH: number;
}

export const widgets: DashboardWidget[] = [
  {
    id: "habits",
    title: "Hábitos",
    icon: "check-circle",
    component: HabitsWidget,
    minWidth: 3,
    minHeight: 3,
    defaultX: 0,
    defaultY: 0,
    defaultW: 12,
    defaultH: 10,
  },
];

export function getWidgetById(id: string): DashboardWidget | undefined {
  return widgets.find((w) => w.id === id);
}
