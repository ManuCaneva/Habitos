# 02: Ventana visible auto-ajustable end-to-end

**What to build:** La grilla del cronograma se ajusta sola a los bloques. La Ventana visible se calcula en el store (getter de dominio en TypeScript): sin slots muestra el default (06:00–23:00); con slots, abraza desde el más temprano hasta el más tardío redondeado hacia afuera a horas enteras, y se expande en ambos extremos a medida que se agregan bloques más tempranos o más tardíos. Sin mínimo artificial de horas: con un bloque corto la grilla se ve grande (efecto lupa). El modal de configuración pierde los campos "Desde/Hasta" y queda solo con la granularidad, que pasa a ser zoom puramente visual de las filas (los minutos siguen libres: 15:50 no se redondea). La Ventana visible nunca se persiste: es derivada, no setting.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Tests del getter con fixtures (db mockeado): vacío → 06:00–23:00; slot 15:50–18:05 → 15:00–19:00; slot 18:10–20:25 → 18:00–21:00; ambos en días distintos → 15:00–21:00; slot exacto 15:00–16:00 → 15:00–16:00; expansión al agregar un slot más temprano y uno más tardío.
- [x] La grilla renderiza sus filas y etiquetas a partir del getter (no de settings "Desde/Hasta").
- [x] El modal de configuración solo ofrece granularidad 15/30/60; no quedan rastros de "Desde/Hasta" en la UI.
- [x] `npm run test` y `npm run build` en verde; `npm run test:perf` en verde (presupuesto del dashboard).
