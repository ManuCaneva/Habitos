<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useHabitsStore } from "./stores/habits";

const store = useHabitsStore();
const status = ref<string>("Inicializando…");

onMounted(async () => {
  try {
    await store.loadHabits();
    status.value = `Cargados ${store.activeHabits.length} hábitos activos.`;
  } catch (e) {
    status.value = `Error: ${String(e)}`;
  }
});

async function seedTestHabit() {
  try {
    await store.createHabit({
      name: "Leer 20 minutos",
      description: "Prueba inicial",
      color: "#5e6ad2",
      frequency: { type: "daily", target_per_period: 1 },
    });
    status.value = `Creado. Total activos: ${store.activeHabits.length}`;
  } catch (e) {
    status.value = `Error creando: ${String(e)}`;
  }
}
</script>

<template>
  <main class="container">
    <h1>Hábitos — smoke test</h1>
    <p>{{ status }}</p>
    <button type="button" @click="seedTestHabit">Crear hábito de prueba</button>
    <ul>
      <li v-for="h in store.activeHabits" :key="h.id">
        <span :style="{ color: h.color }">●</span>
        {{ h.name }} — racha: {{ store.currentStreak(h.id) }}
      </li>
    </ul>
  </main>
</template>

<style scoped>
.container {
  padding: 24px;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
  color: #f7f8f8;
  background: #010102;
  min-height: 100vh;
}
button {
  padding: 8px 14px;
  background: #5e6ad2;
  color: #fff;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  padding: 8px 0;
}
</style>
