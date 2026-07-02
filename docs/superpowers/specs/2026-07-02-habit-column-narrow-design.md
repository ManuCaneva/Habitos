# Diseño: Columna de hábitos angosta (phone-like en desktop)

**Fecha:** 2026-07-02
**Estado:** Aprobado
**Tipo:** Refactor de layout

## Objetivo

Cambiar la vista "Hoy" para que las cards de hábitos se muestren en una **columna angosta** (~384px) pegada a la sidebar, en vez del panel `max-w-3xl` (768px) que ocupa gran parte del ancho. La densidad y la jerarquía deben acercarse a la versión mobile ya validada visualmente, sin perder la información de heatmap mensual.

## Motivación

El panel actual (`max-w-3xl` ≈ 768px) genera mucho espacio horizontal vacío en pantallas desktop. El heatmap dentro de cada card es pequeño (~96px) y queda mucho "aire" entre el nombre y el heatmap. Una columna más angosta (≈384px, ancho típico de iPhone) aprovecha mejor el espacio, lee como "feed vertical" y elimina el header intermedio que separa la lista del resto de la app.

## Cambios

### 1. `src/views/TodayView.vue`

- Contenedor del panel: `max-w-3xl` → `max-w-sm` (384px). Se mantiene `w-full` y se omite `mx-auto` (la columna queda pegada a la sidebar).
- **Eliminar** el panel header completo (`bg-surface-1 rounded-lg border border-hairline` con título "Hábitos" + IconButton "+").
- Lista de hábitos: las cards van directo, sin el wrapper card. Padding del contenedor de la lista: `p-0` (no necesita padding porque las cards ya tienen su propio padding).
- Al final de la lista (cuando hay al menos un hábito), agregar `<NewHabitCard />` como última card.
- Cuando no hay hábitos, mantener `EmptyState` (que ya tiene su propio CTA para crear el primero).
- Imports: quitar `Text`, `IconButton`, `Plus` (de lucide). Agregar `NewHabitCard`.

### 2. `src/components/habits/HabitCard.vue`

- Padding interno: `p-5` (20px) → `p-4` (16px) para que la card no se vea inflada en columna angosta.
- Check button: `w-7 h-7` → `w-8 h-8` (32px), más cómodo para tap.
- Estructura interna sin cambios: header row (color dot + name | check + menu) y heatmap debajo.
- Color dot sigue siendo el "icono" (mantiene `w-3 h-3 rounded-full`).
- Agregar `truncate` al nombre del hábito (con `title` attr) para evitar overflow con nombres largos.
- `mb-3` del header row se mantiene.

### 3. `src/components/habits/HeatmapGrid.vue`

- Orientación: pasar de **5 cols × 7 rows** (transpuesto) a **7 cols × 5 rows** (vista de calendario natural).
- `gridTemplateColumns: repeat(7, minmax(0, 1fr))` — siempre 7 columnas.
- Cell size: `w-4 h-4` (16px) → `w-2.5 h-2.5` (10px).
- `gap-1` (4px) se mantiene.
- Dimensiones finales: 7×10 + 6×4 = **94px** de ancho × 5×10 + 4×4 = **66px** de alto.
- `buildHeatmapGrid()` no necesita cambios — ya itera cronológicamente y el grid CSS auto-flow los acomoda por filas. Las cells de padding (vacías al inicio para alinear por semana) quedan arriba-izquierda; "today" queda abajo-derecha.
- El test de "35 celdas para 30 días" sigue válido (no cambia el conteo).

### 4. `src/components/habits/NewHabitCard.vue` (nuevo)

Card al final de la lista con la misma forma que una `HabitCard` (mismo `bg-surface-1 border border-hairline rounded-lg p-4`). Contenido:

- Centrada vertical y horizontal (`flex flex-col items-center justify-center`).
- Icono `Plus` grande (`w-6 h-6` con stroke 2) en `text-ink-muted`.
- Texto "Nuevo hábito" debajo en `body` weight 500, `text-ink-muted`.
- Hover: `hover:bg-surface-2`, icon y texto a `text-ink`.
- Click: dispara `ui.openCreate()`.
- Accesibilidad: `aria-label="Crear nuevo hábito"`, `role="button"`, `data-testid="new-habit-card"`.
- Altura mínima: igual a una `HabitCard` promedio (~110-130px) para que la lista no "salte" cuando se agrega el primer hábito.

## Lo que NO cambia

- `ArchivedView` y `HabitList`/`HabitRow` — sin cambios (la vista de archivados ya es una lista angosta).
- `SettingsView` — sin cambios.
- `EmptyState` — sin cambios; sigue apareciendo cuando `list.length === 0`.
- Schema (`src/schemas/habits.ts`) — sin cambios.
- Stores (`src/stores/habits.ts`, `src/stores/ui.ts`) — sin cambios. `ui.openCreate()` ya existe.
- Backend Rust — sin cambios (regla de oro: la lógica es de UI, no toca persistencia).
- `HeatmapGrid.buildHeatmapGrid()` — sin cambios (función pura, output idéntico).

## Tests a actualizar / agregar

| Archivo | Tipo | Cambio |
|---|---|---|
| `src/views/TodayView.test.ts` | Update | Panel tiene `max-w-sm`; no tiene header "Hábitos"; cuando hay hábitos, la última card es `NewHabitCard` (o tiene `data-testid="new-habit-card"`). |
| `src/components/habits/HabitCard.test.ts` | Update | La card tiene `p-4` (no `p-5`); el check button tiene `w-8 h-8`. |
| `src/components/habits/HeatmapGrid.test.ts` | Update | El grid tiene 7 columnas (assertion sobre `gridStyle` o `style` attribute); las cells son de 10px (assertion sobre clases o width computado). |
| `src/components/habits/NewHabitCard.test.ts` | Nuevo | Renderiza "+" + "Nuevo hábito"; click dispara `ui.openCreate()`. |

## Constraints heredadas

- El panel del `TodayView` **nunca** debe tener `max-w-2xl` ni `mx-auto` (test existente en `src/views/TodayView.test.ts:49-54`). Se mantiene.
- Regla de oro: lógica de negocio en TS, no en Rust. No se toca `src-tauri/`.

## Riesgos

- **Heatmap a 10px**: queda muy compacto. Si después se quiere más grande, es un cambio de 1 clase (`w-2.5` → `w-3`).
- **Nombres largos**: `truncate` + `title` attr mitiga el overflow.
- **Accesibilidad del "+"**: el botón debe ser focuseable y tener `aria-label` claro.

## Definition of Done

- [ ] `npm run test` pasa (verde).
- [ ] `npm run build` pasa (types + producción).
- [ ] Diseño visualmente verificado en `npm run dev` (no automatizable, queda para QA manual).
- [ ] No hay TODOs ni código comentado.
- [ ] Sin cambios en `src-tauri/`.
