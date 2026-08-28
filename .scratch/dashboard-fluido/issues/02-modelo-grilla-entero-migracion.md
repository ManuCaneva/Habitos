# 02: Modelo de grilla entero + migración

**What to build:** el layout del dashboard pasa de porcentajes flotantes a enteros sobre una grilla 12×10, con migración automática de los layouts guardados. El usuario no ve ningún cambio visual todavía (los widgets siguen renderizándose en píxeles como hoy), pero sus layouts personalizados (actuales y legacy) se migran sin pérdida de posiciones ni tamaños.

**Blocked by:** None (can start immediately).

**Status:** done (implementado junto con 03)

- [x] `LayoutItem` pasa a enteros `{ i, x, y, w, h, minW?, minH?, maxW?, maxH? }`, con `x`/`w` sobre 12 columnas (0..12) y `y`/`h` sobre 10 filas (0..10); `COLS = 12`, `ROWS = 10` como constantes del dominio.
- [x] La colisión es aritmética de enteros (`x < other.x + other.w && ...`), sin epsilon de punto flotante.
- [x] `moveTo`/`resizeTo`/`addWidget`/`removeWidget`/`resetLayout` operan en enteros con las mismas reglas de colisión y clamping que hoy.
- [x] Los defaults de los widgets se redefinen en celdas enteras (incluido el `minW`/`minH` del cronograma semanal, que hoy es 0.4 = no alineado).
- [x] La migración del layout guardado (`aeon-dashboard-layout` y legacy `habitos-dashboard-layout`) redondea a la celda más cercana (`round(percent * 12/10)`), con clamping al contenedor.
- [x] Tras el redondeo, si dos items quedan solapados se reubica el segundo con `findFreePosition` manteniendo su tamaño.
- [x] El layout legacy pre-branding (enteros 12×10) migra directamente a enteros sin paso intermedio.
- [x] Los tests unitarios del store pasan en enteros (reemplazando los casos en porcentajes), y cubren: redondeo, clamping, colisiones post-redondeo, migración legacy, y las operaciones del store.
- [x] `npm run build` y `npm run test` pasan; el dashboard se ve idéntico al estado previo.
