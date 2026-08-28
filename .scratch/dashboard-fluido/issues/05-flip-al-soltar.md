# 05: FLIP al soltar

**What to build:** al soltar un widget movido o redimensionado en modo edición, se acomoda visualmente con una animación suave (FLIP con `transform`, ~150-200ms, easing consistente), en lugar de un salto brusco. No reintroduce jank: solo anima `transform` en el compositor, nunca `left/top/width/height`.

**Blocked by:** 03 (necesita el render grid + gestos con snap al soltar).

**Status:** ready-for-agent

- [ ] Al soltar un drag o resize se aplica animación FLIP: medir antes, invertir con `transform`, animar a cero.
- [ ] La animación usa solo `transform` (compositor puro), nunca propiedades que fuercen layout.
- [ ] Duración y easing consistentes (~150-200ms), reutilizando el vocabulario de motion del proyecto y alineado con DESIGN.md (se agrega el token de easing si hace falta).
- [ ] Durante el gesto no hay transiciones (comportamiento actual preservado).
- [ ] El resize de ventana global no se ve afectado (sigue sin animación de layout por frame).
- [ ] Tests de `GridItemVue`/`DashboardView` siguen pasando (la animación no rompe el comportamiento vía props/emit).
- [ ] `npm run build` y `npm run test` pasan.
