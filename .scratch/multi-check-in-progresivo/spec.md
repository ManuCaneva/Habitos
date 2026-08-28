# Spec: Multi-check-in progresivo (hábitos con N repeticiones por día)

Status: ready-for-agent

## Problem Statement

Hoy un hábito es binario: o está marcado o no. Un usuario que quiere "Tomar 8 vasos de agua" (o "Leer 20 páginas", "Hacer 5 flexiones de brazo") no puede registrar cuánto hizo; solo puede marcar un check completo, y pierde la noción de si un día cumplió de más o de menos.

El campo `target_per_period` ya existe en el esquema (Zod + SQLite + Rust) pero está muerto: el formulario lo hardcodea a `1`, ninguna vista lo muestra y ningún cálculo lo usa. Además, la base de datos impone físicamente `UNIQUE (habit_id, log_date)`, así que hoy hay exactamente un log por día y el store modela el "cumplido" como un `Set` binario de ids.

La idea es "resucitar" ese campo y hacer el check-in progresivo: un hábito diario puede tener un target de N repeticiones por día, y cada tap acumula una repetición hasta completar el target, dejando visible cuánto se cumplió cada día.

## Solution

Un hábito diario puede tener un **target de repeticiones por día** (1 a 20, default 1). El botón de check-in deja de ser binario: pasa a ser un **círculo segmentado** con un segmento por repetición. Cada tap enciende un segmento (acumula progreso); al encender el último, los segmentos se funden en un círculo sólido idéntico al check de los hábitos simples. El heatmap tiñe cada día con intensidad proporcional al progreso alcanzado, de modo que "se note si se cumplió más o menos".

- `target = 1` degenera exactamente al check binario de hoy (cero fricción para hábitos simples).
- La racha premia la **consistencia**, no la intensidad: registrar al menos una repetición (progreso ≥ 1) cuenta como día cumplido; el target solo satura el color/intensidad.

## User Stories

1. Como usuario, quiero crear un hábito con un objetivo de repeticiones por día (ej. "Tomar 8 vasos de agua"), para poder comprometerme a una cantidad concreta.
2. Como usuario, quiero que el hábito muestre un círculo segmentado (un segmento por repetición) en vez de un check plano, para ver de un vistazo cuánto me falta.
3. Como usuario, quiero que cada tap en el círculo encienda un segmento, para registrar una repetición a la vez.
4. Como usuario, quiero que al encender el último segmento el círculo se funda en un círculo sólido (como un hábito no progresivo), para sentir el cierre.
5. Como usuario, quiero que tocar el círculo lleno lo resetee a cero, para corregir un check-in accidental (igual que el "uncheck" de los hábitos simples).
6. Como usuario, quiero poder decrementar de a una repetición (sin llegar a cero de golpe), para afinar si me pasé.
7. Como usuario con un hábito simple (target 1), quiero que se vea y se comporte exactamente como antes (tap = marcar/desmarcar), para no perder la experiencia que ya tengo.
8. Como usuario, quiero que un día con progreso parcial cuente igual para mi racha, porque lo que quiero premiar es la constancia de todos los días.
9. Como usuario, quiero que el heatmap muestre días con distinta intensidad según cuánto cumplí, para ver de un vistazo qué días cumplí de más o de menos.
10. Como usuario, quiero ver el target junto a la frecuencia del hábito (ej. "Diario · 8/día"), para recordar qué meta tengo.
11. Como usuario, quiero poder editar el target de un hábito existente, para ajustar mi compromiso sin recrear el hábito.
12. Como usuario, quiero que mis logs viejos sigan intactos al actualizar la app (cada log existente cuenta como 1 repetición), para no perder historial.
13. Como usuario, quiero que los hábitos semanales y por intervalo sigan siendo binarios como hoy, para que el scope de la feature no altere lo que ya funciona.

## Implementation Decisions

### Modelo de dominio

- La frecuencia diaria de un hábito pasa a ser el único caso que soporta target progresivo. `weekly` e `interval` quedan con `target_per_period = 1` (binarios), como hoy.
- El target se modela reutilizando `target_per_period`, subiendo su tope de `7` a `20` (decisión del usuario: "20 es un buen límite y realista"). El mínimo sigue siendo `1`.
- El `HabitLog` gana un campo `count` (entero ≥ 1, default 1) que representa cuántas repeticiones acumuló ese día. Una sola fila por `(habit_id, log_date)` — el `UNIQUE` se mantiene.

### Persistencia (Rust = solo I/O)

- Nueva migración `008` que:
  - Recrea la tabla `habits` para relajar el `CHECK (target_per_period <= 7)` a `<= 20` (SQLite no permite alterar CHECKs; se usa el patrón de recreación ya empleado en la migración 006).
  - Agrega la columna `count` a `habit_logs` con `DEFAULT 1`, backfilleando a `1` los logs existentes.
- Nuevo comando `upsert_habit_log` que hace `INSERT ... ON CONFLICT(habit_id, log_date) DO UPDATE SET count = excluded.count`, espejando exactamente `upsert_goal_log` (el patrón ya probado para objetivos). Es el único comando nuevo; no se duplica lógica de negocio en Rust.
- `create_log` / `delete_log` actuales se adaptan o dejan de usarse para el flujo diario progresivo (el upsert pasa a ser el camino único de escritura).

### Store (toda la lógica en TypeScript)

- `completedToday` deja de ser un `Set` binario y pasa a exponer el progreso por hábito en el día actual (un mapa `habit_id → count`, o similar). Se mantiene un getter booleano equivalente a "progreso ≥ 1" para las vistas binarias.
- Nuevas acciones `incrementCheckIn(habitId)` y `decrementCheckIn(habitId)` que:
  - Calculan el `count` nuevo como `count actual + 1` (o `- 1`), sin pasarse de `target` ni bajar de `0`.
  - En `count <= 0`, borran el log del día (uncheck total).
  - Persisten vía `upsert_habit_log` y actualizan `logs` reactivamente.
- La racha (`currentStreak`) mantiene su semántica actual (día cumplido = tiene log), que ya coincide con "progreso ≥ 1". No cambia su cálculo.
- El mapeo de filas incluye el nuevo `count`.

### UI

- Nuevo componente `SegmentedCheckCircle` que recibe `target` y `count` (o `progress`), y el color; renderiza un círculo con `target` segmentos y enciende `count` de ellos. Con `target = 1` se comporta idéntico al check actual (Check/Plus).
- El botón de check-in de `HabitCard` y `HabitRow` se reemplaza por `SegmentedCheckCircle` para hábitos diarios con `target > 1`; para `target = 1` (y para weekly/interval) se conserva el check binario actual.
- Tap en el círculo lleno = reset a 0; un botón `−` (visible en hover, desktop) decrementa de a 1.
- El heatmap tiñe cada celda con intensidad proporcional a `count / target` (en vez de binario), reutilizando `shadeFor`. El `GridCell` necesita conocer `count` y `target`, no solo `completed`.
- El subtítulo del hábito muestra el target: "Diario · 8/día" para hábitos diarios con `target > 1` (vía `frequencyLabel`).
- El formulario de hábito gana un input numérico **"Repeticiones por día"** (stepper 1–20, default 1), visible tanto al crear como al editar.

## Testing Decisions

**Qué hace un buen test (por AGENTS.md):** testear comportamiento externo observable, no implementación interna. Componentes Vue: vía props/emit. Store: lógica pura de dominio. Tests al lado del código (`foo.ts` → `foo.test.ts`), mockeando `@/lib/db` con `vi.mock()`.

**Módulos a testear:**

- **`src/schemas/habits.ts`**: validación del nuevo tope de `target_per_period` (acepta 1..20, rechaza 0 y 21), y el nuevo campo `count` en `HabitLog`/`HabitLogRow` (default 1). Prior art: `src/schemas/habits.test.ts`.
- **`src/stores/habits.ts`**: `incrementCheckIn` acumula y no supera el target; `decrementCheckIn` baja de a 1 y borra al llegar a 0; `completedToday`/progreso refleja `count`; la racha cuenta con progreso parcial (≥1). Prior art: `src/stores/habits.test.ts` (mock de `@/lib/db`).
- **`src/lib/buildHeatmapGrid.ts`**: el `GridCell` lleva progreso (`count`/`target`) y produce intensidad proporcional. Prior art: tests existentes del heatmap si los hay, o crear `buildHeatmapGrid.test.ts`.
- **`src/components/habits/`** (HabitCard, HabitRow): render de `SegmentedCheckCircle` según `target`, tap que llama a `incrementCheckIn`/`decrementCheckIn`, y que `target = 1` conserva el comportamiento binario. Prior art: `HabitCard.test.ts` / `HabitRow.test.ts` (props/emit).

**Seams:** el seam único es el store + el mock de `@/lib/db` (ya existente). No se agregan seams nuevos. El comando Rust `upsert_habit_log` se valida por integración manual (`npm run tauri dev`) y `cargo check`, no con tests unitarios (Rust es solo I/O).

## Out of Scope

- Target progresivo para frecuencias `weekly` e `interval` (siguen binarios; ver notas).
- Migración de la vista de objetivos o cambios en `GoalCard`/`goals` (los objetivos ya tienen su propio `target` + `amount`).
- Cambiar el cálculo de racha para exigir el target completo (la decisión es: progreso ≥ 1 ya cuenta).
- Contador numérico "3/8" en el círculo (la decisión es el círculo segmentado, no números).
- Sincronización cloud, exportación, o gamificación por intensidad.

## Further Notes

- Regla de oro (AGENTS.md): toda la lógica (acumulación, clamping a target, mapeo de progreso) vive en TypeScript; Rust solo persiste con el upsert espejo de objetivos.
- La semántica elegida ("premiar consistencia, no intensidad") cambia la distinción hábito/objetivo del glosario: `CONTEXT.md` debe actualizarse — Hábito admite target progresivo, Check-in acumula progreso, Objetivo se distingue por medir cantidad continua arbitraria (páginas/minutos) vs. repeticiones discretas por día, y Racha aclara "registró al menos un check-in". Aprobado en el grilling.
- Al editar el `target` de un hábito existente, la intensidad del heatmap se recalcula en vivo (`count / target`) sin migrar datos: los días que antes estaban "completos" (count 1) se verán más claros si sube el target. Es el comportamiento esperado.
- No se agrega ADR: la decisión es fácilmente reversible y sigue el patrón ya establecido por los objetivos (no sorprende a un lector futuro).
