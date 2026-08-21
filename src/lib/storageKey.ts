/**
 * Migra una clave de localStorage legada ("habitos.*") a su equivalente
 * nueva ("aeon.*"). Si la clave nueva aún no existe pero la vieja sí,
 * copia el valor bajo la clave nueva. No elimina la vieja, para que un
 * rollback de versión no pierda la config previa.
 */
export function migrateStorageKey(legacyKey: string, currentKey: string): void {
  try {
    if (localStorage.getItem(currentKey) != null) return;
    const legacyValue = localStorage.getItem(legacyKey);
    if (legacyValue != null) {
      localStorage.setItem(currentKey, legacyValue);
    }
  } catch {
    // En entornos sin localStorage (SSR/tests) no hacemos nada.
  }
}