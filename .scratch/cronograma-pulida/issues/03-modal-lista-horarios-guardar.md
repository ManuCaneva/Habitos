# 03: Modal de bloque — lista de horarios + Guardar único

**What to build:** El flujo de materias con varios horarios funciona sin duplicaciones. En el modal del bloque, "Agregar" suma un horario (día + inicio + fin) a una lista local de borradores; cada ítem se puede editar in situ o eliminar; nada se persiste hasta tocar "Guardar". "Guardar" valida y persiste todo de una: en creación, el Bloque con todos sus Slots (un solo bloque, sin duplicados); en edición, el diff contra el estado previo usando los comandos incrementales existentes (crear/actualizar/eliminar slot, update del bloque). Validaciones con mensajes humanos: título obligatorio, al menos un horario ("Agregá al menos un horario"), y solapamiento rechazado ("Los horarios se superponen con…" en vez de un dump de ZodError). Esto mata el bug actual donde "Agregar" + "Crear" generaba dos bloques.

**Blocked by:** None (can start immediately; paralelizable con 02).

**Status:** done

- [x] Escenario AACSW end-to-end: crear bloque con lunes 15:50–18:05 y jueves 18:10–20:25 → un solo bloque con dos slots visible en la grilla.
- [x] En modo crear, "Agregar" no persiste nada; "Guardar" persiste bloque + slots exactamente una vez (tests del store con db mockeado verifican la secuencia de llamadas).
- [x] En modo edición, cambiar/agregar/quitar horarios produce las llamadas correctas de create/update/delete y el bloque queda consistente al reabrir.
- [x] Guardar sin horarios muestra el aviso "Agregá al menos un horario" y no persiste; título vacío muestra error humano.
- [x] Solapamiento en el mismo día rechaza el guardado con mensaje humano visible en el modal.
- [x] Tests del modal vía props/emits (sin tocar estado interno); `npm run test` y `npm run build` en verde.

## Closing notes

Implementado en `dev` (se commitea junto con el resto del trabajo del ticket):

- **Store** (`src/stores/weeklySchedule.ts`): nuevo comando `saveBlock(input)` = Guardar único. En crear: valida y delega a `createBlock` (1 bloque + N slots, una sola vez). En edición: hace el diff contra el estado previo usando los comandos incrementales existentes — `deleteScheduleSlot` para slots ausentes, `updateScheduleBlock` solo si título/color cambiaron, `updateScheduleSlot`/`createScheduleSlot` según el draft. Valida con mensajes humanos antes de persistir: título obligatorio ("El título es obligatorio"), al menos un horario ("Agregá al menos un horario"), end > start, y solapamiento ("Los horarios se superponen con «X»" o "…entre sí en el día de la semana"), nombrando el bloque con el que choca. Sin batches nuevos en Rust.
- **Schemas** (`src/schemas/weeklySchedule.ts`): `SaveScheduleSlotDraftSchema` (draft de slot con `id` opcional para edición) y constantes `SCHEDULE_VALIDATION_ERRORS` con los mensajes humanos.
- **Modal** (`src/components/dashboard/WeeklyScheduleModal.vue`): estado local `drafts`; "Agregar/Actualizar" solo muta la lista local (nada persiste hasta "Guardar"); edición in situ y eliminar por ítem; "Guardar" llama a `saveBlock` una sola vez y muestra el error humano en el modal; botón de bloque completo renombrado `deleteBlock`.
- **Tests**: store (secuencia de llamadas en crear y en edición, rejects sin persistir, solapamiento intra e inter-bloque incl. edición), schemas, modal vía props/emits, y grid con el escenario AACSW (un bloque, dos slots). `npm run test` (815), `npm run build`, `npm run lint`, `npm run format:check` y `npm run test:perf` en verde.
- El `colorMap` hex del modal es preexistente (estaba en HEAD) y queda para tokenizar en el issue 05.

