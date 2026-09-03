# 05: Sync sin errores tragados — banner honesto en el widget anual

**Status:** done

**What to build:** Que el calendario anual diga la verdad. Hoy, si Google rechaza algún calendario (401/403/429) el sync "termina bien" con cero feedback y el widget muestra menos eventos como si nada; y el widget borra el error al montar, así que ningún mensaje sobrevive. El usuario ve que hay eventos en Google y que no aparecen, sin explicación.

**Blocked by:** 04 (el reintento tras refresh usa el single-flight nuevo)

## Qué entrega

1. **Fallos por calendario contados, no tragados**: cuando la lista de calendarios sincroniza en paralelo, un fallo de un calendario individual no hace `return` silencioso ni `catch {}`: se acumula. Si hubo fallos, el sync termina con error de sync visible tipo "No se pudieron sincronizar N calendarios" junto a los eventos que sí llegaron (éxito parcial es un estado legítimo y visible).
2. **401 → refresh + un reintento**: un 401 en el fetch de calendarios/eventos (token revocado a mitad de sesión con expiry local vencido aún no detectado) dispara el flujo de refresh de 04 y reintenta una vez antes de reportar fallo.
3. **El widget deja de limpiar el error al montar**: `syncYear` deja de resetear el error de sync al iniciar de forma que un error reciente sobreviva; el banner del widget deja de filtrar el mensaje "Not connected" (ya no hace falta: con 03/04 ese estado contradictorio no existe). El error de sync persiste hasta que un sync exitoso lo limpia.
4. **El parseo tolerante queda asentado**: un calendario sin eventos devuelve lista vacía sin considerarse fallo (caso feliz real de la API).

## Acceptance criteria

- [x] TDD: tests rojos primero — un calendario que responde 403 con otros dos OK produce eventos de los dos + error visible con "1 calendario"; fallo de red de un calendario ídem; 401 en la lista de calendarios dispara exactamente un refresh y un reintento exitoso; el error de sync sigue visible tras montar el widget (test del widget: banner presente después de montar con error preexistente).
- [x] El banner del widget muestra el mensaje de éxito parcial y los dots de los eventos que sí llegaron a la vez.
- [x] Un sync posterior exitoso limpia el banner.
- [x] `npm run test` y `npm run build` en verde.
- [x] `npm run test:perf` sigue verde (el cambio toca el dashboard).

## Notas

- Seam: store del calendario para la lógica + widget anual para el banner (prior art: suite existente del widget con su data-testid de error).
- No cambia qué eventos se muestran ni el cap de dots de MonthMini; solo honestidad del estado.
