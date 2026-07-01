# Heatmap de hábitos - Diseño

## Contexto

Actualmente los hábitos se muestran en una lista horizontal centrada (`max-w-2xl mx-auto`) con checkboxes individuales. El usuario quiere transformar esto en una vista vertical pegada al sidebar con un heatmap tipo GitHub por hábito, mostrando el historial de cumplimiento de forma visual.

## Objetivo

Reemplazar la vista actual de hábitos por un layout vertical donde cada hábito muestre:
- Nombre + indicador de color + botón de configuración (arriba)
- Grilla heatmap 7x5 mostrando los últimos 30 días (abajo)
- Panel pegado al sidebar, sin centrar

## Decisiones de diseño

### 1. Historial mostrado
- **Default**: 30 días
- **Configurable**: en el formulario de edición de cada hábito (accesible desde el botón `⋮`)
- La grilla se ajusta automáticamente (30 días = 4-5 columnas, 90 días = 13 columnas)

### 2. Disposición de celdas
- **Grilla multi-fila tipo GitHub**: 7 filas (días de la semana) x N columnas (semanas)
- **Hoy** en la esquina inferior derecha
- Las celdas se leen de izquierda a derecha, arriba a abajo

### 3. Visualización de celdas
- **Binario con color del hábito**: celda con el color del hábito al 100% si se completó, fondo `surface-2` si no
- Sin niveles de intensidad (se puede agregar después)

### 4. Interacción
- **Celdas del heatmap**: solo visualización, no interactivas
- **Check-in**: botón cuadrado a la derecha del nombre del hábito (entre el nombre y el botón de editar)
- El botón muestra un check cuando el hábito está completado hoy, vacío cuando no

### 5. Layout del panel
- Pegado al sidebar (sin margen izquierdo)
- Sin centrar con `max-w-2xl mx-auto`
- Ancho más generoso para acomodar nombre + grilla

### 6. Layout de cada hábito
- **Arriba**: nombre + indicador de color + botón check-in + botón menú (⋮)
- **Abajo**: grilla heatmap tipo GitHub
- No al costado, sino debajo del título
- Layout del header: `[color] Nombre [✓] [⋮]`

## Arquitectura de componentes

### Nuevos componentes

#### `HeatmapGrid.vue`
Componente puro que recibe:
- `logs: HabitLog[]` (logs de un hábito específico)
- `color: string` (color del hábito)
- `days: number` (cantidad de días, default 30)

Genera grilla 7x5 (7 filas = días de la semana, 5 columnas = semanas para 30 días).

#### `HabitCard.vue`
Reemplaza `HabitRow` en `TodayView`:
- Layout vertical: nombre + color indicator + botón check-in + botón menú arriba, grilla abajo
- Mantiene acceso a `HabitContextMenu` para editar/archivar
- Las celdas del heatmap son solo visuales (no interactivas)

#### `buildHeatmapGrid.ts` (en `src/lib/`)
Función pura que genera la estructura de datos para la grilla:
- Input: días de historia, logs del hábito
- Output: array de `GridCell` con fecha, estado completado, posición en grilla
- Lógica: hoy debe quedar en esquina inferior derecha

### Componentes existentes

#### `HabitRow.vue`
Queda solo para `ArchivedView` (lista horizontal con checkbox).

#### `HabitList.vue`
Se mantiene, pero recibe prop para decidir qué componente renderizar (o se crea `HabitHeatmapList.vue`).

## Data flow

1. **TodayView** → obtiene `activeHabits` y `logs` del store
2. **HabitCard** → recibe un `Habit` + todos los `logs` filtrados por `habit_id`
3. **HeatmapGrid** → recibe:
   - `logs: HabitLog[]` (solo de ese hábito)
   - `color: string`
   - `days: number` (default 30)

### Lógica de buildHeatmapGrid

```typescript
interface GridCell {
  date: Date;
  completed: boolean;
  isEmpty: boolean; // celdas fuera del rango
}

function buildHeatmapGrid(days: number, logs: HabitLog[]): GridCell[] {
  const today = new Date();
  const startDate = subDays(today, days - 1);
  
  // Generar array de N días
  const dateRange = eachDayOfInterval({ start: startDate, end: today });
  
  // Crear Set de fechas completadas para lookup O(1)
  const completedDates = new Set(logs.map(l => l.log_date));
  
  // Mapear a celdas con posición en grilla
  const cells = dateRange.map(date => ({
    date,
    completed: completedDates.has(formatISO(date)),
    isEmpty: false,
    dayOfWeek: getDay(date),
    weekIndex: // calcular en qué columna (semana) cae
  }));
  
  // Reorganizar: hoy debe quedar en esquina inferior derecha
  // Si hoy es miércoles (día 3), las primeras 3 celdas de la última columna quedan vacías
  
  return cells;
}
```

## Layout y estilos

### Panel principal (TodayView)

```vue
<!-- Antes: centrado con max-w-2xl -->
<div class="max-w-2xl mx-auto">

<!-- Nuevo: pegado al sidebar, sin centrar -->
<div class="w-full max-w-3xl">
```

- Quitar `max-w-2xl mx-auto` → reemplazar con `w-full max-w-3xl`
- Panel pegado al sidebar: sin margen izquierdo, solo padding interno

### HabitCard

```vue
<div class="bg-surface-1 rounded-lg border border-hairline p-5">
  <!-- Header: nombre + color + check-in + menú -->
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2">
      <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: habit.color }" />
      <Text variant="body-lg" weight="500">{{ habit.name }}</Text>
    </div>
    <div class="flex items-center gap-2">
      <!-- Botón check-in -->
      <button
        :class="[
          'shrink-0 w-7 h-7 rounded-md border flex items-center justify-center',
          'transition-all duration-150 active:scale-95',
          checked
            ? 'bg-primary border-primary text-white'
            : 'border-hairline-strong hover:border-primary',
        ]"
        @click="toggleCheck"
      >
        <Check v-if="checked" :size="16" :stroke-width="3" />
      </button>
      <!-- Botón menú -->
      <IconButton @click="ui.toggleMenu(habit.id)">
        <MoreHorizontal :size="16" />
      </IconButton>
    </div>
  </div>
  
  <!-- Heatmap grid -->
  <HeatmapGrid :logs="habitLogs" :color="habit.color" :days="30" />
</div>
```

### HeatmapGrid

```vue
<div class="grid grid-cols-5 gap-1">
  <div
    v-for="cell in cells"
    :key="cell.date.toISOString()"
    :class="[
      'w-4 h-4 rounded-sm',
      cell.isEmpty ? 'bg-transparent' : cell.completed ? '' : 'bg-surface-2'
    ]"
    :style="cell.completed ? { backgroundColor: color } : {}"
  />
</div>
```

### Tokens de DESIGN.md

- Fondo del panel: `bg-surface-1` (elevation level 1)
- Bordes: `border-hairline` (1px)
- Esquinas: `rounded-lg` (12px)
- Padding interno: `p-5` (20px)
- Celdas del heatmap: `w-4 h-4` (16px), `rounded-sm` (6px)
- Gap entre celdas: `gap-1` (4px, `spacing.xxs`)
- Celdas vacías: `bg-surface-2`
- Celdas completadas: inline style con `habit.color`

### Responsive

- En mobile (< 768px): celdas más pequeñas (`w-3 h-3`) o scroll horizontal
- En desktop: celdas de 16px, 5 columnas visibles

## Testing strategy

### Tests unitarios (TDD)

#### `HeatmapGrid.test.ts`
- Recibe 30 días de logs, renderiza 35 celdas (7x5)
- Celdas con logs completados tienen el color del hábito
- Celdas sin logs tienen `bg-surface-2`
- Hoy cae en la esquina inferior derecha
- Celdas fuera del rango son transparentes
- Respeta prop `days` (30, 60, 90)

#### `HabitCard.test.ts`
- Renderiza nombre y color del hábito
- Pasa logs filtrados a HeatmapGrid
- Botón de check-in marca/desmarca el hábito para hoy
- Abre menú contextual al hacer click en `⋮`

#### `buildHeatmapGrid.test.ts` (función pura en `src/lib/`)
- Genera grilla correcta para 30 días
- Calcula posición de hoy (esquina inferior derecha)
- Maneja edge cases: hábito sin logs, hábito creado hace 5 días

### Tests existentes
- `HabitRow.test.ts` — se mantiene (ArchivedView lo usa)
- `TodayView.test.ts` — actualizar para verificar que usa HabitCard

### Mocking
- `vi.mock("@/lib/db")` para stores
- No se levanta Tauri en tests unitarios

## Enfoque elegido

**Enfoque B: Crear componente nuevo HabitCard y deprecar HabitRow**

Razón: prioriza mantenibilidad a largo plazo. Se crea un componente nuevo optimizado para el diseño vertical, sin tocar `HabitRow` que puede seguir usándose en `ArchivedView`.

## Definición de done

1. Tests unitarios pasan (`npm run test`)
2. Build pasa (`npm run build`)
3. HeatmapGrid renderiza grilla 7x5 con hoy en esquina inferior derecha
4. HabitCard muestra nombre + color + botón check-in + botón menú + grilla
5. Panel pegado al sidebar, sin centrar
6. Celdas binarias con color del hábito
7. Responsive: celdas más pequeñas en mobile
8. Botón de check-in funciona (marca/desmarca hábito para hoy)
9. Sin TODOs ni código comentado
