import type { Component } from "vue";
import HabitsWidget from "@/components/dashboard/HabitsWidget.vue";
import TasksWidget from "@/components/dashboard/TasksWidget.vue";
import GoalsWidget from "@/components/dashboard/GoalsWidget.vue";

export interface DashboardWidget {
  id: string;
  title: string;
  icon?: string;
  component: Component;
  minWidthPercent: number;
  minHeightPercent: number;
  defaultX: number;
  defaultY: number;
  defaultWPercent: number;
  defaultHPercent: number;
}

export const widgets: DashboardWidget[] = [
  {
    id: "habits",
    title: "Hábitos",
    icon: "check-circle",
    component: HabitsWidget,
    minWidthPercent: 1 / 12,
    minHeightPercent: 1 / 10,
    defaultX: 0,
    defaultY: 0,
    defaultWPercent: 0.5,
    defaultHPercent: 0.4,
  },
  {
    id: "tasks",
    title: "Tareas",
    icon: "list-todo",
    component: TasksWidget,
    minWidthPercent: 1 / 12,
    minHeightPercent: 1 / 10,
    defaultX: 0.5,
    defaultY: 0,
    defaultWPercent: 0.5,
    defaultHPercent: 0.4,
  },
  {
    id: "goals",
    title: "Objetivos",
    icon: "target",
    component: GoalsWidget,
    minWidthPercent: 1 / 12,
    minHeightPercent: 1 / 10,
    defaultX: 0,
    defaultY: 0.4,
    defaultWPercent: 1,
    defaultHPercent: 0.3,
  },
];

export function getWidgetById(id: string): DashboardWidget | undefined {
  return widgets.find((w) => w.id === id);
}
