# 01: Fundamento de datos — `count`, tope 20 y `upsert_habit_log`

Status: ready-for-agent

Blocked by: None (can start immediately)

**What to build:** La capa de persistencia y validación que permite registrar un hábito diario con varias repeticiones por día, sin cambiar todavía ningún comportamiento visible. Al terminar este ticket, un hábito diario puede tener un target de hasta 20 repeticiones y sus logs guardan cuántas repeticiones acumuló ese día, aunque el target siga fijo en 1 para los hábitos existentes.

- [x] Una migración `008` recrea la tabla `habits` relajando el `CHECK (target_per_period <= 7)` a `<= 20` (patrón de recreación ya usado en la migración 006), y agrega la columna `count` a `habit_logs` con `DEFAULT 1`, backfilleando a `1` los logs existentes.
- [x] Un comando `upsert_habit_log` hace `INSERT ... ON CONFLICT(habit_id, log_date) DO UPDATE SET count = excluded.count`, espejando `upsert_goal_log`, y queda registrado en el `invoke_handler`.
- [x] El wrapper de `@/lib/db` expone `upsertHabitLog` (valida con Zod y llama al comando) y devuelve la fila del log con su `count`.
- [x] Los schemas actualizan `target_per_period` a `min(1).max(20)` y agregan `count` a `HabitLog` / `HabitLogRow` (default `1`).
- [x] `target_per_period` sigue validando correctamente: acepta 1..20, rechaza 0 y 21.
- [x] `npm run test`, `npm run build` y `cargo check` pasan.
