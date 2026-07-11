<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from "vue";
import { Pencil, Archive, ArchiveRestore } from "lucide-vue-next";

const props = defineProps<{
  entityId: string;
  isArchived: boolean;
  triggerDataAttr: string;
}>();

const emit = defineEmits<{
  edit: [];
  "archive-toggle": [];
  close: [];
}>();

const menuRef = ref<HTMLDivElement | null>(null);
const position = ref({ top: 0, left: 0 });

function updatePosition() {
  const trigger = document.querySelector(
    `[${props.triggerDataAttr}="${props.entityId}"]`,
  );
  if (trigger) {
    const rect = trigger.getBoundingClientRect();
    position.value = {
      top: rect.bottom + 4,
      left: rect.right - 176,
    };
  }
}

function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    const target = e.target as HTMLElement;
    if (target.closest(`[${props.triggerDataAttr}="${props.entityId}"]`)) {
      return;
    }
    emit("close");
  }
}

onMounted(() => {
  nextTick(updatePosition);
  document.addEventListener("mousedown", handleClickOutside);
});

onUnmounted(() => document.removeEventListener("mousedown", handleClickOutside));
</script>

<template>
  <Teleport to="body">
    <div
      ref="menuRef"
      :style="{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 50,
      }"
      class="w-44 bg-surface-2 border border-hairline-strong rounded-md shadow-xl py-1 animate-fade-in"
      role="menu"
    >
      <button
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-ink hover:bg-surface-3 transition-colors"
        role="menuitem"
        @click="emit('edit')"
      >
        <Pencil :size="14" />
        Editar
      </button>
      <button
        type="button"
        :class="[
          'w-full flex items-center gap-2 px-3 py-2 text-body-sm transition-colors',
          'hover:bg-surface-3',
          isArchived ? 'text-ink' : 'text-red-400',
        ]"
        role="menuitem"
        @click="emit('archive-toggle')"
      >
        <Archive v-if="!isArchived" :size="14" />
        <ArchiveRestore v-else :size="14" />
        {{ isArchived ? "Restaurar" : "Archivar" }}
      </button>
    </div>
  </Teleport>
</template>
