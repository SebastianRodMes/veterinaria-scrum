/**
 * localStorage wrapper — única puerta de acceso a persistencia.
 * Los módulos de dominio no deben usar localStorage directamente.
 *
 * Interfaz pública: leer, guardar, eliminar.
 */
const Storage = (() => {
  const PREFIJO = 'vet:';

  function leer(clave, porDefecto = null) {
    try {
      const crudo = localStorage.getItem(PREFIJO + clave);
      return crudo == null ? porDefecto : JSON.parse(crudo);
    } catch (_) {
      return porDefecto;
    }
  }

  function guardar(clave, valor) {
    try {
      localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
      return true;
    } catch (_) {
      return false;
    }
  }

  function eliminar(clave) {
    localStorage.removeItem(PREFIJO + clave);
  }

  return { leer, guardar, eliminar };
})();
