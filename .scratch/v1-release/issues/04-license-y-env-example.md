# 04: chore(license) — LICENSE.txt MIT y .env.example

**What to build:** El README promete una licencia MIT que no existe en el repo, y quien clona el proyecto no tiene forma de saber qué variables de entorno espera la app. Crear `LICENSE.txt` (MIT, `Copyright (c) 2026 GOYA` — decisión del usuario de usar seudónimo) y un `.env.example` que liste las dos variables de Google Calendar con un comentario breve de dónde se obtienen (Google Cloud Console, cliente de tipo Desktop) y la aclaración de que el secret se embebe en el binario en builds de producción.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] `LICENSE.txt` existe con el texto MIT estándar y copyright de GOYA.
- [x] `.env.example` existe con las dos variables `VITE_GCAL_*` comentadas y sin valores reales.
- [x] Ningún secret real aparece en ninguno de los dos archivos.
