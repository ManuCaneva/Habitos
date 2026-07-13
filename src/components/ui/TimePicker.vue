<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";

const props = defineProps<{
  modelValue: string; // "HH:MM"
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const hoursContainer = ref<HTMLElement | null>(null);
const minutesContainer = ref<HTMLElement | null>(null);

const selectedHour = ref(12);
const selectedMinute = ref(0);

// Parse input modelValue
function parseTime(val: string) {
  const [hStr, mStr] = (val || "12:00").split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  return {
    h: isNaN(h) ? 12 : Math.max(0, Math.min(23, h)),
    m: isNaN(m) ? 0 : Math.max(0, Math.min(59, m)),
  };
}

function updateFromProps() {
  const { h, m } = parseTime(props.modelValue);
  selectedHour.value = h;
  selectedMinute.value = m;
  scrollToSelected();
}

let isScrolling = false;
let hasDragged = false;

function scrollToSelected() {
  nextTick(() => {
    isScrolling = true;
    if (hoursContainer.value) {
      hoursContainer.value.scrollTop = selectedHour.value * 32;
    }
    if (minutesContainer.value) {
      minutesContainer.value.scrollTop = selectedMinute.value * 32;
    }
    setTimeout(() => {
      isScrolling = false;
    }, 150);
  });
}

onMounted(() => {
  updateFromProps();
  if (hoursContainer.value) {
    makeGrabScrollable(hoursContainer.value, onHoursScroll, handleScrollEndHours);
  }
  if (minutesContainer.value) {
    makeGrabScrollable(minutesContainer.value, onMinutesScroll, handleScrollEndMinutes);
  }
});

watch(() => props.modelValue, () => {
  const { h, m } = parseTime(props.modelValue);
  if (h !== selectedHour.value || m !== selectedMinute.value) {
    selectedHour.value = h;
    selectedMinute.value = m;
    scrollToSelected();
  }
});

function emitTime() {
  const hStr = String(selectedHour.value).padStart(2, "0");
  const mStr = String(selectedMinute.value).padStart(2, "0");
  emit("update:modelValue", `${hStr}:${mStr}`);
}

function selectHour(h: number) {
  if (hasDragged) return;
  selectedHour.value = h;
  scrollToSelected();
  emitTime();
}

function selectMinute(m: number) {
  if (hasDragged) return;
  selectedMinute.value = m;
  scrollToSelected();
  emitTime();
}

function onHoursScroll() {
  if (isScrolling || !hoursContainer.value) return;
  const top = hoursContainer.value.scrollTop;
  const idx = Math.round(top / 32);
  const clamped = Math.max(0, Math.min(23, idx));
  if (clamped !== selectedHour.value) {
    selectedHour.value = clamped;
    emitTime();
  }
}

function onMinutesScroll() {
  if (isScrolling || !minutesContainer.value) return;
  const top = minutesContainer.value.scrollTop;
  const idx = Math.round(top / 32);
  const clamped = Math.max(0, Math.min(59, idx));
  if (clamped !== selectedMinute.value) {
    selectedMinute.value = clamped;
    emitTime();
  }
}

// Ensure snapping after scroll ends
let scrollTimeoutHours: any = null;
let scrollTimeoutMinutes: any = null;

function handleScrollEndHours() {
  if (!hoursContainer.value) return;
  clearTimeout(scrollTimeoutHours);
  scrollTimeoutHours = setTimeout(() => {
    if (isScrolling || !hoursContainer.value) return;
    const top = hoursContainer.value.scrollTop;
    const idx = Math.round(top / 32);
    isScrolling = true;
    hoursContainer.value.scrollTo({ top: idx * 32, behavior: "smooth" });
    setTimeout(() => {
      isScrolling = false;
    }, 150);
  }, 100);
}

function handleScrollEndMinutes() {
  if (!minutesContainer.value) return;
  clearTimeout(scrollTimeoutMinutes);
  scrollTimeoutMinutes = setTimeout(() => {
    if (isScrolling || !minutesContainer.value) return;
    const top = minutesContainer.value.scrollTop;
    const idx = Math.round(top / 32);
    isScrolling = true;
    minutesContainer.value.scrollTo({ top: idx * 32, behavior: "smooth" });
    setTimeout(() => {
      isScrolling = false;
    }, 150);
  }, 100);
}

function makeGrabScrollable(
  el: HTMLElement,
  onScrollFn: () => void,
  onScrollEndFn: () => void
) {
  let isDown = false;
  let startY = 0;
  let scrollTop = 0;

  el.style.cursor = "grab";

  el.addEventListener("mousedown", (e) => {
    isDown = true;
    hasDragged = false;
    el.style.cursor = "grabbing";
    startY = e.pageY - el.offsetTop;
    scrollTop = el.scrollTop;
    
    // Disable scroll snapping and smooth behavior during active drag
    el.style.scrollSnapType = "none";
    el.style.scrollBehavior = "auto";
  });

  const handleDragEnd = () => {
    if (!isDown) return;
    isDown = false;
    el.style.cursor = "grab";
    
    // Restore snap and smooth behavior, then snap
    el.style.scrollSnapType = "y mandatory";
    el.style.scrollBehavior = "smooth";
    onScrollEndFn();
    
    setTimeout(() => {
      hasDragged = false;
    }, 50);
  };

  el.addEventListener("mouseleave", handleDragEnd);
  el.addEventListener("mouseup", handleDragEnd);

  el.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const y = e.pageY - el.offsetTop;
    const walk = (y - startY) * 1.5;
    if (Math.abs(walk) > 5) {
      hasDragged = true;
    }
    el.scrollTop = scrollTop - walk;
    onScrollFn();
  });
}
</script>

<template>
  <div class="flex items-center justify-center gap-2 bg-surface-2 border border-hairline rounded-md px-4 py-2 w-full max-w-[140px] mx-auto select-none relative h-40 overflow-hidden">
    <!-- Highlight overlay in the middle -->
    <div class="absolute left-0 right-0 h-8 pointer-events-none border-y border-primary/20 bg-primary/5 top-[64px] z-0" />
    
    <!-- Hours Column -->
    <div 
      ref="hoursContainer" 
      class="flex-1 h-full overflow-y-auto scrollbar-none snap-y snap-mandatory z-10 scroll-smooth"
      @scroll="onHoursScroll(); handleScrollEndHours()"
    >
      <div class="h-16" /> <!-- padding top -->
      <button
        v-for="h in 24"
        :key="h"
        type="button"
        :class="[
          'w-full h-8 flex items-center justify-center text-sm font-semibold transition-colors duration-150 snap-center outline-none',
          selectedHour === h - 1 ? 'text-primary scale-110 font-bold' : 'text-ink-subtle hover:text-ink'
        ]"
        @click="selectHour(h - 1)"
      >
        {{ String(h - 1).padStart(2, "0") }}
      </button>
      <div class="h-16" /> <!-- padding bottom -->
    </div>

    <!-- Separator -->
    <div class="text-ink-subtle font-semibold text-lg z-10 select-none pb-0.5">:</div>

    <!-- Minutes Column -->
    <div 
      ref="minutesContainer" 
      class="flex-1 h-full overflow-y-auto scrollbar-none snap-y snap-mandatory z-10 scroll-smooth"
      @scroll="onMinutesScroll(); handleScrollEndMinutes()"
    >
      <div class="h-16" /> <!-- padding top -->
      <button
        v-for="m in 60"
        :key="m"
        type="button"
        :class="[
          'w-full h-8 flex items-center justify-center text-sm font-semibold transition-colors duration-150 snap-center outline-none',
          selectedMinute === m - 1 ? 'text-primary scale-110 font-bold' : 'text-ink-subtle hover:text-ink'
        ]"
        @click="selectMinute(m - 1)"
      >
        {{ String(m - 1).padStart(2, "0") }}
      </button>
      <div class="h-16" /> <!-- padding bottom -->
    </div>
  </div>
</template>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
