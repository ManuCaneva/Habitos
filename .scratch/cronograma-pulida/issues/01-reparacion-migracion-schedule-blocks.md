# 01: Reparación de la base — migración de repair de schedule_blocks

**What to build:** La app vuelve a crear bloques del cronograma sin el error `NOT NULL constraint failed: schedule_blocks.start_minutes`. Al abrir, una migración de repair detecta si la tabla de bloques conserva la forma vieja (columnas de horario presentes) y la reconstruye a la forma nueva: Bloque (título + color) 1:N Slots (día + inicio + fin). Si existen datos en la forma vieja, se convierten a Slots antes de descartar las columnas; nada se pierde. La misma repair cubre los riesgos latentes conocidos: los ids de slots migrados deben quedar en formato UUID (hoy los generados como `slot-…` hacen fallar la carga con "Error al cargar") y la reconstrucción no debe disparar borrados en cascada de slots.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Test de la migración con las tres formas de tabla posibles (vieja completa, intermedia rota, nueva) y verificación de que los datos sobreviven en todas (prior art: tests de repairs de habits).
- [x] Con la base real del usuario, abrir la app y crear un bloque con horario 15:50–18:05 sin errores.
- [x] La carga del cronograma (bloques + slots) no lanza "Error al cargar" en instalaciones migradas.
- [x] `cargo check`, `cargo fmt --check` y `cargo clippy` en verde.

Notas de cierre: migración 010 en `src-tauri/src/db/mod.rs` (`ensure_schedule_blocks_schema`, idempotente por inspección real, patrón 009). Detecta por `start_minutes` (la 006 miraba `day_of_week` y nunca reconstruía el estado intermedio real). Convierte filas 005 a slots con id UUID v4, normaliza ids `slot-…` legacy, y usa `PRAGMA foreign_keys=OFF` en autocommit para no cascadear slots. 5 tests nuevos en `src-tauri/src/db/tests.rs` (3 formas + normalización de ids + inserción 15:50–18:05 post-repair). Validado en vivo: el `tauri dev` en curso migró la base real a versión 10 sin pérdida (0 filas). Code-review: sin violaciones duras de standards; nits menores documentados (predicado UUID estricto v4, `INSERT OR IGNORE`, rama de rename parcial) aceptados como robustez de repair.
