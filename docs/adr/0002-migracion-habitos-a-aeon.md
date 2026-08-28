# Migración automática de habitos.sqlite a aeon.sqlite

Decidimos renombrar la app de "Hábitos" a "AEON" y, en consecuencia, mover la base de datos de `habitos.sqlite` a `aeon.sqlite`. Para no perder datos de instalaciones existentes, la primera ejecución posterior al renombrado migra automáticamente el archivo viejo (incluyendo sus archivos WAL/SHM) al nuevo nombre si el nuevo no existe todavía.

El motivo es que renombrar la app sin migrar la DB habría tirado el historial de todos los usuarios existentes. La migración es unidireccional: una vez que `aeon.sqlite` existe, ya no se lee `habitos.sqlite`.
