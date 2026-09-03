# 05: Limpieza — código muerto y tokens de color

**What to build:** El cronograma queda sin rastros del drag & drop que nunca se conectó y con colores alineados al design system. Se eliminan: el composable de arrastre nunca importado, `snapToSlot` (y sus tests, hoy solo consumidos por tests), y los atributos data-* de arrastre del componente de bloque. Los mapas de colores en hex hardcodeados (duplicados en dos componentes) se reemplazan por los tokens del design system, según la convención del repo de no hardcodear colores en componentes.

**Blocked by:** 03 (Modal de bloque — los hex maps viven en el modal y el componente de bloque que 03 reescribe; evita conflictos).

**Status:** ready-for-agent

- [ ] No queda ninguna referencia al composable de drag & drop, a `snapToSlot` ni a los atributos data-* de arrastre (la búsqueda de esos nombres no encuentra nada).
- [ ] Los componentes del cronograma no contienen literales hex: los colores salen de los tokens del design system.
- [ ] `npm run test`, `npm run build`, `npm run lint` y `npm run format:check` en verde.
