# 01: Helpers OAuth — parseo único de la query cruda y payloads sin secret

**Status:** done

**What to build:** Prefactor puro del módulo de helpers OAuth que deja listas, testeadas y sin secret, las piezas que el ticket 03 necesita para completar la conexión end-to-end. No cambia comportamiento observable de la app todavía (el store sigue usando lo viejo); es la base que hace trivial el tracer bullet.

**Blocked by:** None (can start immediately)

## Qué entrega

1. **Parser canónico del callback**: un helper puro que recibe la query cruda tal como la envía Google (percent-encoded, ej. `code=4%2F0AV...&state=abc&scope=...`) y devuelve `{ code, error, state }` decodificado exactamente una vez, usando el parseo estándar de la plataforma. Reemplaza al parser de redirect URI existente (que hoy depende de que otro decodifique bien).
   - Casos cubiertos: code con `/` y `+` percent-encoded, `error=access_denied`, params ausentes, query vacía, strings malformadas (sin lanzar).
2. **Payloads sin client secret**: los builders del exchange y del refresh dejan de incluir `client_secret`. Google acepta PKCE puro para clients tipo Escritorio (decisión cerrada en el grill; el spec original ya lo anticipaba). Los tipos de los payloads pierden el campo del secret.
3. **Scope alineado**: el test que hoy espera `calendar.readonly` pasa a esperar el scope completo `auth/calendar` que el código usa de verdad (decisión: se mantiene read-write por el CRUD del modal de detalle del día).

## Acceptance criteria

- [ ] TDD: los tests nuevos del parser van rojo primero (el comportamiento de decodificación única no existe), luego verde.
- [ ] El parser decodifica `code=4%2F0AVG...` como `4/0AVG...` exactamente una vez (no `4%2F0AVG...` ni doble-decodificado).
- [ ] El parser devuelve `error` cuando Google manda `error=access_denied` y no lanza con inputs malformados.
- [ ] Los payloads de exchange y refresh no contienen `client_secret` (tests lo asientan).
- [ ] El test de la URL de consent asienta el scope `auth/calendar`.
- [ ] El parser viejo de redirect URI queda sin llamadores (se borra en este ticket si solo lo usaba el store deep-link viejo; si el store aún lo usa, se marca deprecado y se borra en 03).
- [ ] `npm run test` y `npm run build` en verde.

## Notas

- Seam: tests unitarios al lado del módulo de helpers OAuth (prior art: suite existente de esos helpers).
- No tocar el store ni el servidor Rust en este ticket.
