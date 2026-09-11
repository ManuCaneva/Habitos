# 05: style(ci) — formatear los archivos que rompen format:check

**What to build:** `npm run format:check` falla hoy en cinco archivos: las dos páginas legales estáticas de docs y tres documentos del tracker local (la spec de visibilidad de calendarios, la spec de OAuth y un issue del cronograma). Como el CI corre `format:check` en cada push a `main`, la rama principal está en rojo. Formatear los cinco archivos con Prettier (decisión del usuario: formatear, **no** ignorarlos en `.prettierignore`) y restaurar el `.prettierignore` del árbol a su estado commiteado.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] `npm run format:check` pasa en el árbol completo.
- [x] `.prettierignore` no tiene cambios sin commitear respecto de su estado previo.
- [x] El contenido legible de las páginas legales no cambia (solo formato).
