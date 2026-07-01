# Plan de implementación: Sidebar + Card contenedora

## Tareas

### 1. Fix bug del check button
- Investigar y fixear por qué el botón de check no actualiza visualmente
- Verificar reactividad de `completedToday` y `currentStreak`
- Testear que el check funciona correctamente

### 2. Crear componente Sidebar
- Crear `src/components/layout/Sidebar.vue`
- Implementar navegación: Hoy, Archivados, Settings
- Implementar toggle de tema
- Implementar colapsar/expandir
- Usar iconos de lucide-vue-next

### 3. Actualizar uiStore
- Agregar `sidebarCollapsed` state con persistencia
- Agregar método `toggleSidebar()`

### 4. Reescribir App.vue
- Reemplazar TopBar + TabBar con Sidebar
- Layout flex horizontal: sidebar + contenido
- Eliminar imports de TopBar y TabBar

### 5. Actualizar TodayView
- Envolver lista en card contenedora
- Agregar header con título "Hábitos" y botón "+"
- Ajustar styling para que encaje en la card

### 6. Eliminar archivos obsoletos
- Eliminar `src/components/layout/TopBar.vue`
- Eliminar `src/components/layout/TabBar.vue`

### 7. Verificar y testear
- Correr `npm run build` para verificar tipos
- Verificar visualmente que todo funciona
- Testear colapsar/expandir sidebar
- Testear navegación entre vistas
