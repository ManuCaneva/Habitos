<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useUiStore } from "@/stores/ui";
import { useHabitsStore } from "@/stores/habits";
import { HABIT_COLORS, DEFAULT_HABIT_COLOR } from "@/lib/habitColors";
import Modal from "@/components/ui/Modal.vue";
import Input from "@/components/ui/Input.vue";
import Button from "@/components/ui/Button.vue";
import Text from "@/components/ui/Text.vue";

const ui = useUiStore();
const habits = useHabitsStore();

const editing = computed(() => {
  if (!ui.editingHabitId) return null;
  return habits.habits.find((h) => h.id === ui.editingHabitId) ?? null;
});

const isEdit = computed(() => editing.value !== null);

const name = ref("");
const color = ref<string>(DEFAULT_HABIT_COLOR);
const error = ref<string | null>(null);
const saving = ref(false);

watch(
  () => [ui.createHabitOpen, ui.editingHabitId] as const,
  ([open]) => {
    if (open) {
      if (editing.value) {
        name.value = editing.value.name;
        color.value = editing.value.color;
      } else {
        name.value = "";
        color.value = DEFAULT_HABIT_COLOR;
      }
      error.value = null;
    }
  },
);

async function handleSubmit(e: Event) {
  e.preventDefault();
  const trimmed = name.value.trim();
  if (!trimmed) {
    error.value = "El nombre no puede estar vacío.";
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    if (editing.value) {
      await habits.updateHabit(editing.value.id, {
        name: trimmed,
        color: color.value,
      });
    } else {
      await habits.createHabit({
        name: trimmed,
        color: color.value,
        frequency: { type: "daily", target_per_period: 1 },
      });
    }
    ui.closeModal();
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal :open="ui.createHabitOpen" size="md" @close="ui.closeModal()">
    <form @submit="handleSubmit">
      <div class="px-5 py-4 border-b border-hairline">
        <Text variant="card-title" as="h2">
          {{ isEdit ? "Editar hábito" : "Nuevo hábito" }}
        </Text>
      </div>

      <div class="px-5 py-5 flex flex-col gap-5">
        <Input
          v-model="name"
          label="Nombre"
          placeholder="Ej: Leer 20 minutos"
          :error="error ?? undefined"
          maxlength="100"
          required
        />

        <div class="flex flex-col gap-2">
          <Text variant="body-sm" color="muted">Color</Text>
          <div class="grid grid-cols-8 gap-2">
            <button
              v-for="c in HABIT_COLORS"
              :key="c.value"
              type="button"
              :title="c.name"
              :aria-label="c.name"
              :aria-pressed="color === c.value"
              :style="{ backgroundColor: c.value }"
              :class="[
                'w-8 h-8 rounded-full transition-all duration-150',
                'hover:scale-110 active:scale-95',
                color === c.value
                  ? 'ring-2 ring-offset-2 ring-offset-surface-1 ring-white'
                  : '',
              ]"
              @click="color = c.value"
            />
          </div>
        </div>
      </div>

      <div
        class="px-5 py-4 border-t border-hairline flex items-center justify-end gap-2"
      >
        <Button
          type="button"
          variant="tertiary"
          size="md"
          :disabled="saving"
          @click="ui.closeModal()"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          :loading="saving"
        >
          {{ isEdit ? "Guardar" : "Crear" }}
        </Button>
      </div>
    </form>
  </Modal>
</template>
