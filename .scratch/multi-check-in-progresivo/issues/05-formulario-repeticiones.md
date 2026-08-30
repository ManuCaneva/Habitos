# 05: Formulario — input "Repeticiones por día"

Status: done

Blocked by: 01 — Fundamento de datos

**What to build:** El formulario de crear/editar hábito permite fijar cuántas repeticiones por día tiene un hábito. Al terminar este ticket, el usuario puede crear "Tomar 8 vasos de agua" o editar un hábito existente para cambiarle el target.

- [x] El formulario de hábito agrega un input numérico "Repeticiones por día" (stepper 1–20, default 1), visible al crear y al editar.
- [x] El valor se persiste en `target_per_period` al crear y al editar (deja de hardcodear `1`).
- [x] Al editar el target de un hábito existente, la intensidad del heatmap se recalcula en vivo (`count / target`) sin migrar datos.
- [x] Tests (si los hay para el form, o nuevos) cubren el rango 1–20 y el default 1.

## Comments

- **2026-08-30 — Implementación.** `HabitFormModal` gana un input numérico "Repeticiones por día" (`type=number`, min 1, max 20, default 1) vía `Input.vue`. Se agregó soporte de props `min`/`max` a `Input.vue` (acepta `string | number` para no romper el `:min` de fecha de `TaskFormModal`). El valor vive en un `ref<string>('1')` y se clampa a `1..20` en `handleSubmit` (con `Math.round`, default 1 si vacío). Se persiste en `frequency.target_per_period` tanto en `createHabit` como en `updateHabit` (ya no hardcodea 1). Al editar se pre-llena desde `editing.value.frequency.target_per_period` cuando el hábito es `daily` (si no, 1). El heatmap ya recalcula en vivo porque `count/target` se deriva del store (ticket 03), sin migrar datos. Tests: +5 en `HabitFormModal.test.ts` (render con default 1, create con target 8, default 1 al vaciar, pre-llenado al editar, update con target 10). Suite completa 740 tests verde; typecheck, lint, build y format OK.
