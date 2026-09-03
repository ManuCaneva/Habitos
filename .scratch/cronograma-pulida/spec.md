# Pulida del cronograma semanal

Status: ready-for-agent

## Problem Statement

El cronograma semanal está roto en su uso básico: crear un bloque con horarios con minutos sueltos (15:50–18:05) falla con `sqlite error: NOT NULL constraint failed: schedule_blocks.start_minutes`, y el bloque nunca se guarda. El flujo del modal es confuso: el botón "Agregar" crea el bloque de forma inmediata con el primer horario, y tocar "Crear" después duplica el bloque (uno con horario, otro vacío). La ventana horaria de la grilla es fija (configurada a mano, 06:00–23:00 por defecto) y oculta cualquier slot que caiga fuera de ella en lugar de mostrarlo. Además, el usuario no puede definir una materia con dos horarios (ej. AACSW: lunes 15:50–18:05 y jueves 18:10–20:25) sin duplicar la instancia.

## Solution

Un cronograma que se ajusta solo. El usuario crea un Bloque (título + color) con uno o más Slots (día + hora inicio + hora fin) en un único flujo de guardado. La grilla calcula su **Ventana visible** automáticamente a partir de los slots existentes: si no hay ninguno, muestra el horario por defecto; si hay, abraza desde el slot más temprano hasta el más tardío (redondeado a horas enteras), y se va expandiendo a medida que se agregan bloques más tempranos o más tardíos — sin configuración manual. Un bloque puede contener varios horarios sin duplicarse. El flujo del modal se rehace: lista editable de horarios con un solo botón "Guardar" que persiste bloque + slots atómicamente a nivel de UX. La granularidad queda como control puramente visual del zoom de filas. Se repara la base de datos existente con una migración de repair.

## User Stories

1. Como usuaria, quiero crear un bloque con horarios que tengan minutos sueltos (15:50–18:05), para que mi materia real entre en la grilla sin errores.
2. Como usuaria, quiero que un bloque admita varios horarios en distintos días (lunes 15:50–18:05 y jueves 18:10–20:25) bajo una misma instancia, para no duplicar lógicamente la materia.
3. Como usuaria, quiero agregar horarios a una lista dentro del modal y verlos como ítems editables, para revisar la semana del bloque antes de guardar.
4. Como usuaria, quiero editar un slot ya agregado a la lista (día y horas) sin borrarlo y volver a crearlo, para corregir errores rápido.
5. Como usuaria, quiero eliminar un slot de la lista antes de guardar, para deshacer una carga errónea.
6. Como usuaria, quiero un único botón "Guardar" que persista el bloque con todos sus horarios, para que no se creen duplicados ni estados a medias.
7. Como usuaria, quiero que si toco "Guardar" sin ningún horario en la lista, se me avise que agregue al menos uno, para no crear bloques invisibles en la grilla.
8. Como usuaria, quiero que el título del bloque sea obligatorio, para que el cronograma tenga etiquetas legibles.
9. Como usuaria, quiero que la grilla, cuando no tiene bloques, muestre el horario por defecto (06:00–23:00), para que siempre haya una estructura visible para empezar.
10. Como usuaria, quiero que al agregar el primer bloque, la grilla se ajuste para abrazarlo, para que el cronograma se centre en lo que uso.
11. Como usuaria, quiero que si agrego un bloque más temprano que el actual inicio de la grilla, la ventana se expanda hacia arriba, para que siempre se vea lo primero del día.
12. Como usuaria, quiero que si agrego un bloque más tardío que el actual fin de la grilla, la ventana se expanda hacia abajo, para que siempre se vea lo último del día.
13. Como usuaria, quiero que la ventana visible se redondee a horas enteras (15:50 → 15:00; 20:25 → 21:00), para que las etiquetas de hora queden limpias y haya aire visual.
14. Como usuaria, quiero que este ajuste automático ocurra en ambos extremos simultáneamente, para que la grilla siempre refleje el rango real de mis actividades.
15. Como usuaria, quiero que la ventana no tenga un mínimo artificial de horas, para que un bloque corto se vea grande y legible (efecto lupa).
16. Como usuaria, quiero que la granularidad (15/30/60) siga configurable en el engranaje, para ajustar la densidad visual de las filas.
17. Como usuaria, quiero que la granularidad sea sólo visual, para poder cargar horarios como 15:50 o 18:05 sin que nada los redondee.
18. Como usuaria, quiero que si dos bloques se superponen el mismo día, el guardado se rechace con un mensaje humano ("no se pueden superponer horarios"), para que la grilla no quede ilegible.
19. Como usuaria, quiero que la validación de solapamiento considere todos los slots del día, sin importar a qué bloque pertenezcan, para que la regla sea predecible.
20. Como usuaria, quiero que los horarios deban quedar dentro del mismo día (00:00–24:00), sin cruzar medianoche, para que el modelo de la semana sea simple y predecible.
21. Como usuaria, quiero que la hora de fin sea mayor a la de inicio, para que ningún bloque quede invertido.
22. Como usuaria, quiero abrir el editor de un bloque haciendo clic sobre él en la grilla, para editar título, color u horarios existentes.
23. Como usuaria, quiero editar un bloque existente agregando o quitando horarios, para adaptar la materia cuando cambia el cuatrimestre.
24. Como usuaria, quiero eliminar un bloque completo y que todos sus horarios desaparezcan con él, para limpiar el cronograma en una sola acción.
25. Como usuaria, quiero eliminar un solo horario de un bloque, para quitar por ejemplo el sábado de una materia sin tocar el resto.
26. Como usuaria, quiero que los horarios de un bloque que caen fuera de la ventana visible se recorten visualmente en el borde, para entender que "hay algo más allá" en vez de que desaparezcan sin explicación.
27. Como usuaria, quiero que mi base de datos existente se repare automáticamente al abrir la app, para dejar de ver el error de constraint sin perder mis datos.
28. Como usuaria, quiero que los bloques y horarios existentes sobrevivan intactos a la migración de reparación, para no rehacer mi cronograma.
29. Como usuaria, quiero que el error de guardado se muestre en el modal de forma entendible, para saber qué corregir sin abrir consolas.
30. Como usuaria, quiero que el botón "Agregar" solo agregue a la lista (nunca guarde en la base), para que el flujo sea predecible.

## Implementation Decisions

**Modelo de datos (ya existente, se conserva):** `schedule_blocks` (id, title, color, sort_order, timestamps) 1:N `schedule_block_slots` (id, block_id, day_of_week 0–6, start_minutes 0–1439, end_minutes 1–1440, timestamps, CHECK end > start). Los IDs y timestamps se generan en TypeScript. No hay cambios de esquema más allá de la migración de reparación.

**Migración de reparación (nueva, Rust):** La base de este usuario quedó en un estado intermedio: `schedule_blocks` conserva `start_minutes/end_minutes NOT NULL` pero perdió `day_of_week`, con `schema_version` ya en la última — la migración 006 nunca corrió su rebuild. Se agrega una migración de repair que detecta la forma vieja de `schedule_blocks` (columna `start_minutes` presente) y la reconstruye a la forma nueva (solo id/title/color/sort_order/timestamps), siguiendo el patrón de la repair 009 de habits. La base actual del usuario tiene 0 filas en ambas tablas, pero la migración debe preservar datos si existen: si hay filas con day/start/end, se convierten a slots antes de descartar columnas. Otras reparaciones latentes del mismo patrón (FK-cascade wipe en 006, ids `slot-…` no-UUID fallando Zod) se cubren en la misma migración.

**Ventana visible auto-ajustable (TypeScript, getter del store):** La ventana visible se calcula, no se configura. Sin slots: default 06:00–23:00 (constante interna, ya no editable en UI). Con slots: inicio = hora entera inmediatamente inferior o igual al `start_minutes` mínimo de todos los slots; fin = hora entera inmediatamente superior o igual al `end_minutes` máximo. Redondeo hacia afuera, nunca hacia adentro. Sin mínimo de horas: la grilla abraza y nada más. El getter vive en el store (lógica de dominio en TS, no en el componente) para que la grilla y los tests lo consuman directo.

**Settings:** El modal de configuración queda solo con la granularidad (15/30/60), que pasa a ser exclusivamente zoom visual de filas. Los campos "Desde/Hasta" se eliminan de la UI; `day_start/day_end` dejan de ser settings y el default se vuelve constante interna. Persistencia de settings existente se reutiliza para la granularidad.

**Flujo del modal (rehace):** El modal del bloque mantiene un estado local de borradores de slots. "Agregar" añade un borrador (día + inicio + fin) a la lista; cada ítem se puede editar in situ y eliminar. "Guardar" valida (título, ≥1 slot, solapamientos) y persiste: en creación, bloque + todos los slots; en edición, diff contra el estado previo. El botón "Agregar" nunca persiste nada.

**Persistencia incremental (sin batch nuevo en Rust):** El guardado en edición se resuelve con llamadas incrementales existentes por slot (crear/actualizar/eliminar slot) más update del bloque. No se agrega comando batch atómico: SQLite local, riesgo mínimo, Rust sigue delgado (ADR 0001).

**Solapamiento:** Se mantiene el rechazo duro en el mismo día entre slots de cualquier bloque. El mensaje de error es humano ("Los horarios se superponen con…"), no un dump de ZodError.

**Ventana vs slots fuera de rango:** Un slot que cae parcialmente fuera de la ventana visible se recorta visualmente en el borde de la grilla (no se oculta). Con la ventana auto-ajustable esto solo puede pasar durante transiciones, pero la regla de clipping reemplaza al filtrado actual.

**Snap:** No hay snap de horarios a la granularidad. La granularidad no valida ni modifica minutos.

**Limpieza de código muerto:** Se eliminan el composable de drag & drop nunca conectado, `snapToSlot` (y sus tests), los atributos data-* de arrastre en el componente de bloque, y el spec viejo del modelo de tabla única (borrado de `docs/superpowers/specs/2026-07-12-cronograma-semanal-widget.md`). Los colores hardcodeados en hex duplicados en dos componentes se reemplazan por los tokens del design system.

**Restricciones conservadas:** Horarios dentro del mismo día (0–1440 minutos), fin > inicio, día 0–6, título 1–80 chars, color del palette de tokens.

## Testing Decisions

Se testea comportamiento externo vía props/emits/store, nunca estado interno (convención AGENTS.md, TDD estricto: test rojo primero).

- **Store (seam principal):** El getter de Ventana visible se testea en el store con fixtures de slots: vacío → default; slot 15:50–18:05 → 15:00–19:00; slot 18:10–20:25 → 18:00–21:00; ambos (distintos días) → 15:00–21:00; expansión al agregar más temprano/tardío; slot que cruza la hora justa (15:00–16:00 → 15:00–16:00). `db.*` mockeado con `vi.mock('@/lib/db')`, como en `src/stores/weeklySchedule.test.ts`.
- **Store (guardado):** "Guardar" con lista de borradores crea bloque + N slots en orden; edición con slots modificados produce las llamadas correctas de create/update/delete; rechazo de solapamiento con mensaje humano; rechazo de bloque sin slots.
- **Schemas:** Los drafts de slot (día/rango/minutos libres) y mensajes de error en `src/schemas/weeklySchedule.test.ts`.
- **Componentes:** Modal de bloque con `@vue/test-utils`: agregar/editar/quitar horarios de la lista local sin tocar la base; Guardar emite/llama al store una vez; error de solapamiento visible en el modal. Grid: recorte visual de slots en el borde (antes desaparecían). Prior art: `WeeklyScheduleModal.test.ts`, `WeeklyScheduleGrid.test.ts`.
- **Migración (Rust):** Test de la repair con las tres formas de tabla (005 vieja, intermedia rota, nueva) verificando que los datos sobreviven; prior art: tests de repairs en `src-tauri/src/db/tests.rs`.
- **Perf:** `npm run test:perf` debe seguir verde (el cronograma es widget pesado del presupuesto, ADR 0004).

## Out of Scope

- Drag & drop de bloques en la grilla (el composable viejo se borra; se re-evaluará en el futuro sobre el modelo nuevo).
- Horarios que cruzan medianoche (turnos nocturnos).
- Snap/redondeo de horarios a la granularidad.
- Mínimo de horas de la ventana visible (se prueba "abraza puro" y se revisa en uso real).
- Editar slots desde la grilla directamente (todo pasa por el modal).
- Repetición quincenal/excepciones de feriados, notificaciones, vistas de día única.
- `week_starts_monday` (sigue sin UI).

## Further Notes

- El spec viejo de este widget describía el modelo de tabla única con DnD y quedó obsoleto; fue eliminado del repo a pedido del usuario. Este spec lo reemplaza como fuente de verdad.
- Glosario: "Ventana visible" queda definida en `CONTEXT.md`; "Slot" ya cubre la ocurrencia día+horario de un "Bloque" — la UI debe usar exactamente esas palabras (bloque = materia/actividad; horario/slot = cada fila de la lista).
- La ventana visible es un getter derivado, nunca se persiste: al no haber estado que desincronizar, el ajuste automático no requiere migraciones ni settings nuevos.
- El usuario validó probar "abraza puro" sin mínimo antes de considerar un mínimo artificial.
