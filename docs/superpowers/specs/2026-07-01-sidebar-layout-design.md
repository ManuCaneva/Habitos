# Spec: Sidebar + Card contenedora de hábitos

## Resumen

Rediseño del layout principal: reemplazar la TopBar + TabBar por una sidebar izquierda colapsable (estilo Linear/Notion) y envolver la lista de hábitos en una card contenedora. Se elimina la fecha del header. Se incluye fix del bug del botón de check.

## Arquitectura

### Layout general
- `App.vue` usa `flex` horizontal: sidebar a la izquierda, contenido principal a la derecha
- Sidebar: 240px expandido, 60px colapsado
- Contenido: fluid, con padding, card centrada con `max-w-2xl mx-auto`

### Sidebar (`src/components/layout/Sidebar.vue` - nuevo)
- Fondo `canvas`, borde derecho `1px border-hairline`
- Items de navegación: Hoy, Archivados, Settings (iconos lucide-vue-next)
- Logo + nombre arriba
- Toggle de tema (claro/oscuro) al fondo
- Botón de colapsar/expandir al fondo
- Estado de colapso persistido en `uiStore` via `useStorage`
- Item activo: `bg-surface-2 text-ink`
- Items inactivos: `text-ink-muted hover:text-ink hover:bg-surface-1`
- Transición suave con CSS en el ancho

### Card contenedora de hábitos
- Fondo `surface-1`, bordes `rounded-lg` (12px), borde `1px hairline`
- Header: título "Hábitos" a la izquierda, botón `+` (IconButton ghost) a la derecha
- Separador `border-b hairline` entre header y lista
- Lista de hábitos dentro con padding interno
- EmptyState se muestra dentro de la card cuando no hay hábitos

### Archivos afectados

| Archivo | Acción |
|---------|--------|
| `src/components/layout/Sidebar.vue` | Crear |
| `src/components/layout/TopBar.vue` | Eliminar |
| `src/components/layout/TabBar.vue` | Eliminar |
| `src/App.vue` | Reescribir layout |
| `src/stores/ui.ts` | Agregar `sidebarCollapsed` state |
| `src/views/TodayView.vue` | Envolver en card contenedora |
| `src/components/habits/HabitRow.vue` | Ajustar styling + fix bug check |

### Bug del check button
Investigar y fixear por qué el botón de check no actualiza visualmente el estado ni la racha. Hipótesis: problema de reactividad en `completedToday` (Set) o en `currentStreak`. Verificar que `checkIn()` propaga correctamente el cambio a los `computed`.

### Responsive (fuera de scope por ahora)
- Mobile (<768px): sidebar se oculta, aparece hamburger. Se deja para iteración futura.
