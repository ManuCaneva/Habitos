# 07: docs(readme) — README esencial con paso a paso de desarrollo

**What to build:** Reescribir el README para que sea simple, directo y sin relleno ("no puro chamuyo"). Contenido mínimo: qué es AEON en un par de líneas; qué incluye hoy (widgets de hábitos, tareas, objetivos, calendario anual, cronograma, pomodoro, temas); stack en una línea; cómo descargar la release; paso a paso para desarrollar (prerrequisitos, clonar, instalar, `.env` a partir del ejemplo, `npm run tauri dev`); configuración **opcional** de Google Calendar (crear cliente de tipo Desktop en Google Cloud Console, qué poner en el `.env`, nota explícita de que el client_secret viaja embebido en el binario y por qué es aceptable — no confidencial según Google para clientes Desktop); comandos de tests y convención TDD; roadmap mínimo que refleje el estado real (multi-check-in ya existe: quitar el "Próximamente" que lo lista); licencia MIT. Reemplazar la URL de clonación placeholder por el repo real.

**Blocked by:** 04 (el README enlaza el `.env.example` y el `LICENSE.txt` que ese ticket crea).

**Status:** done

- [x] El README no promete features que ya existen ni usa la URL placeholder del repo.
- [x] El paso a paso de desarrollo permite levantar el entorno desde cero siguiendo solo el README.
- [x] La sección de Google Calendar explica configuración, el `.env` y la nota del secret embebido.
- [x] El roadmap refleja el estado real del proyecto.
- [x] Referencias a `LICENSE.txt` y `.env.example` válidas.
