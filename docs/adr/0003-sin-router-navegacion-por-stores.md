# Sin router: navegación por stores (useUiStore.viewMode)

Decidimos no usar vue-router. La navegación se resuelve con un `viewMode` en `useUiStore` y `App.vue` renderiza la vista activa (TodayView, ArchivedView, SettingsView). Las vistas adicionales del dashboard se controlan desde el mismo store.

El motivo es que la app es una sola ventana de escritorio con pocas vistas estáticas y sin deep-linking interno; un router agregaría complejidad de configuración y convenciones sin valor real. La contrapartida es que no hay URLs, historial ni lazy-loading por ruta, lo cual es aceptable para una app Tauri local. Si en el futuro aparece una vista con estado profundo y vínculos internos, esto se revisa.
