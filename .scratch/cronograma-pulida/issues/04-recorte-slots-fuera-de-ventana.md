# 04: Recorte visual de slots fuera de la Ventana visible

**What to build:** Un slot que sobresale del rango visible del día se recorta en el borde de la grilla en vez de desaparecer sin explicación. Con la Ventana visible auto-ajustable esto solo puede ocurrir en transiciones, pero la regla pasa a ser de clipping: el bloque se dibuja parcialmente hasta el borde, nunca se oculta por filtrado. Reemplaza el filtro actual que descarta slots fuera de rango.

**Blocked by:** 02 (Ventana visible auto-ajustable — el filtro que se reemplaza vive en la misma zona de la grilla).

**Status:** done

- [x] Test del grid con un slot que cruza el borde de la Ventana visible: el bloque se renderiza recortado (altura parcial hasta el borde), no desaparece.
- [x] Un slot íntegramente dentro de la ventana se dibuja igual que antes (tests existentes del grid en verde).
- [x] `npm run test` y `npm run build` en verde; `npm run test:perf` en verde.
