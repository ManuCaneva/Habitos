# 05: Formulario — input "Repeticiones por día"

Status: ready-for-agent

Blocked by: 01 — Fundamento de datos

**What to build:** El formulario de crear/editar hábito permite fijar cuántas repeticiones por día tiene un hábito. Al terminar este ticket, el usuario puede crear "Tomar 8 vasos de agua" o editar un hábito existente para cambiarle el target.

- [ ] El formulario de hábito agrega un input numérico "Repeticiones por día" (stepper 1–20, default 1), visible al crear y al editar.
- [ ] El valor se persiste en `target_per_period` al crear y al editar (deja de hardcodear `1`).
- [ ] Al editar el target de un hábito existente, la intensidad del heatmap se recalcula en vivo (`count / target`) sin migrar datos.
- [ ] Tests (si los hay para el form, o nuevos) cubren el rango 1–20 y el default 1.
