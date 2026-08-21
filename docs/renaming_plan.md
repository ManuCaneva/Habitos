# Plan de Renombramiento Seguro: Hábitos ➔ AEON (Solo Interfaz y Nombres de Usuario)

Para evitar la pérdida de datos de los usuarios, evitar reiniciar sus configuraciones de pantalla/tema, y prevenir problemas con integraciones de terceros (como el Google Calendar OAuth), mantendremos todos los identificadores internos, nombres de base de datos y claves de almacenamiento intactos. 

Solo cambiaremos lo que el usuario ve directamente en la interfaz y en el nombre del instalador/aplicación.

---

## Cambios a Realizar

### 1. Nombres y Títulos del Sistema

#### [tauri.conf.json](file:///home/goya/Escritorio/habitos/src-tauri/tauri.conf.json)
* **Línea 3**: Cambiar `"productName": "Hábitos"` a `"productName": "AEON"`. Esto cambiará el nombre de la aplicación empaquetada e instalada en el sistema operativo.
* **Línea 15**: Cambiar `"title": "Hábitos"` a `"title": "AEON"`. Esto cambiará el título de la ventana principal de la aplicación.

#### [index.html](file:///home/goya/Escritorio/habitos/index.html)
* **Línea 9**: Cambiar `<title>Hábitos</title>` a `<title>AEON</title>`. Esto actualiza el título del documento HTML de la aplicación web.

---

### 2. Interfaz de Usuario (UI)

#### [Sidebar.vue](file:///home/goya/Escritorio/habitos/src/components/layout/Sidebar.vue)
* **Línea 40**: Cambiar el texto estático `Hábitos` a `AEON` en el encabezado de la barra lateral.

---

### 3. CI/CD y Documentación de Desarrollo

#### [.github/workflows/release.yml](file:///home/goya/Escritorio/habitos/.github/workflows/release.yml)
* **Línea 99**: Cambiar `releaseName: 'Hábitos v__VERSION__'` a `'AEON v__VERSION__'` para que las compilaciones automatizadas en GitHub lleven el nombre correcto.

#### [README.md](file:///home/goya/Escritorio/habitos/README.md) y [AGENTS.md](file:///home/goya/Escritorio/habitos/AGENTS.md)
* Actualizar las referencias que describen el nombre de la aplicación para que coincidan con **AEON**, pero documentando claramente que, por razones de compatibilidad e historial, la base de datos se mantiene en `habitos.sqlite` y el almacenamiento local bajo claves `habitos.*`.

---

## 🛡️ Lo que NO se modificará (Seguridad de datos)
* **Base de datos**: Se mantiene en `habitos.sqlite` dentro de la carpeta de datos de la app.
* **Configuración del usuario (`localStorage`)**: Se mantienen las claves `habitos.theme`, `habitos.viewMode` y `habitos-dashboard-layout` para que no se pierdan las configuraciones de tema y la distribución de los widgets.
* **Metadata de Rust (`Cargo.toml`)**: Se mantiene el paquete como `habitos` e `habitos_lib` para evitar problemas con caché compilada o URLs de callback configuradas en el proveedor OAuth de Google Calendar.
