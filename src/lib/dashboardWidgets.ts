import type { Component } from 'vue'
import HabitsWidget from '@/components/dashboard/HabitsWidget.vue'
import TasksWidget from '@/components/dashboard/TasksWidget.vue'
import GoalsWidget from '@/components/dashboard/GoalsWidget.vue'
import YearCalendarWidget from '@/components/dashboard/YearCalendarWidget.vue'
import WeeklyScheduleWidget from '@/components/dashboard/WeeklyScheduleWidget.vue'

export interface DashboardWidget {
  id: string
  title: string
  icon?: string
  component: Component
  minW: number
  minH: number
  defaultX: number
  defaultY: number
  defaultW: number
  defaultH: number
}

export const widgets: DashboardWidget[] = [
  {
    id: 'habits',
    title: 'Hábitos',
    icon: 'check-circle',
    component: HabitsWidget,
    minW: 1,
    minH: 1,
    defaultX: 0,
    defaultY: 0,
    defaultW: 6,
    defaultH: 4,
  },
  {
    id: 'tasks',
    title: 'Tareas',
    icon: 'list-todo',
    component: TasksWidget,
    minW: 1,
    minH: 1,
    defaultX: 6,
    defaultY: 0,
    defaultW: 6,
    defaultH: 4,
  },
  {
    id: 'goals',
    title: 'Objetivos',
    icon: 'target',
    component: GoalsWidget,
    minW: 1,
    minH: 1,
    defaultX: 0,
    defaultY: 4,
    defaultW: 12,
    defaultH: 3,
  },
  {
    id: 'year-calendar',
    title: 'Calendario Anual',
    icon: 'calendar',
    component: YearCalendarWidget,
    minW: 1,
    minH: 3,
    defaultX: 0,
    defaultY: 7,
    defaultW: 12,
    defaultH: 5,
  },
  {
    id: 'weekly-schedule',
    title: 'Cronograma Semanal',
    icon: 'calendar-week',
    component: WeeklyScheduleWidget,
    minW: 5,
    minH: 4,
    defaultX: 0,
    defaultY: 7,
    defaultW: 12,
    defaultH: 5,
  },
]

export function getWidgetById(id: string): DashboardWidget | undefined {
  return widgets.find((w) => w.id === id)
}
