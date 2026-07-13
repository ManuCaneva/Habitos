<script setup lang="ts">
import { computed } from "vue";
import { monthGrid, DAY_LABELS } from "@/lib/calendarDates";
import type { CalendarEvent } from "@/schemas/calendar";

const props = withDefaults(
  defineProps<{
    year: number;
    month: number;
    eventsByDate: Map<string, CalendarEvent[]>;
    monthName?: string;
    showHeader?: boolean;
  }>(),
  {
    monthName: "",
    showHeader: false,
  },
);

const MAX_DOTS = 4;

const grid = computed(() => monthGrid(props.year, props.month, 0));

function getEvents(date: string | null): CalendarEvent[] {
  if (!date) return [];
  return props.eventsByDate.get(date) ?? [];
}

function visibleDots(date: string | null): CalendarEvent[] {
  return getEvents(date).slice(0, MAX_DOTS);
}

function overflowCount(date: string | null): number {
  return Math.max(0, getEvents(date).length - MAX_DOTS);
}
</script>

<template>
  <div
    class="month-mini"
    :title="monthName"
    data-testid="month-mini"
  >
    <div
      v-if="monthName"
      class="month-mini__name"
    >
      {{ monthName }}
    </div>
    <div v-if="showHeader" class="month-mini__headers">
      <span
        v-for="day in DAY_LABELS"
        :key="day"
        class="month-mini__header-label"
        data-testid="day-header"
      >{{ day }}</span>
    </div>

    <div class="month-mini__grid">
      <template v-for="(week, wi) in grid" :key="`w-${wi}`">
        <div
          v-for="(cell, di) in week"
          :key="`c-${wi}-${di}`"
          :data-testid="cell.date ? 'day-cell' : undefined"
          :class="['day-cell', { 'day-cell--empty': !cell.date }]"
        >
          <template v-if="cell.date">
            <span
              v-for="evt in visibleDots(cell.date)"
              :key="evt.id"
              class="event-dot"
              :style="{ backgroundColor: evt.color }"
              data-testid="event-dot"
            />
            <span
              v-if="overflowCount(cell.date) > 0"
              class="overflow"
            >+{{ overflowCount(cell.date) }}</span>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.month-mini {
  display: flex;
  flex-direction: column;
  gap: var(--cell-gap, 4px);
  height: var(--month-h, auto);
  box-sizing: border-box;
  width: 100%;
  padding: var(--month-padding, 0px);
}

.month-mini__name {
  text-align: center;
  font-size: var(--font-size, 0.72rem);
  font-weight: 600;
  color: rgb(var(--color-ink-muted));
  text-transform: capitalize;
  line-height: 1.2;
  margin-bottom: 4px;
  height: var(--month-header, auto);
  display: flex;
  align-items: center;
  justify-content: center;
}

.month-mini__headers {
  display: grid;
  grid-template-columns: repeat(7, var(--cell-size, auto));
  column-gap: var(--cell-gap-x, 2px);
  row-gap: var(--cell-gap-y, 2px);
  justify-content: center;
}

.month-mini__header-label {
  text-align: center;
  font-size: 0.65rem;
  font-weight: 500;
  line-height: 1;
  color: rgb(var(--color-ink-tertiary));
  width: var(--cell-size, auto);
}

.month-mini__grid {
  display: grid;
  grid-template-columns: repeat(7, var(--cell-size, auto));
  column-gap: var(--cell-gap-x, 2px);
  row-gap: var(--cell-gap-y, 2px);
  justify-content: center;
}

.day-cell {
  width: var(--cell-size, auto);
  height: var(--cell-size, auto);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--cell-gap, 1px);
  overflow: hidden;
  background: rgb(var(--color-surface-3));
  border-radius: 1px;
}

.day-cell--empty {
  background: transparent;
}

.event-dot {
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.overflow {
  font-size: 0.55rem;
  line-height: 1;
  color: rgb(var(--color-ink-tertiary));
}
</style>
