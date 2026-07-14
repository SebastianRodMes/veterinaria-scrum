/**
 * localStorage wrapper — única puerta de acceso a persistencia.
 *
 * Todos los módulos deben utilizar este objeto en lugar
 * de acceder directamente a localStorage.
 *
 * Compatibilidad:
 *   - leer / guardar / eliminar
 *   - obtener / listar / guardarItem
 *
 * Todas las claves se almacenan con el prefijo "vet:".
 */
const Storage = (() => {
  'use strict';

  const PREFIJO = 'vet:';

  /**
   * Construye la clave real utilizada en localStorage.
   */
  function claveCompleta(clave) {
    return PREFIJO + String(clave || '');
  }

  /**
   * Lee una clave almacenada.
   *
   * Devuelve porDefecto cuando:
   *   - La clave no existe.
   *   - El contenido no es JSON válido.
   *   - Ocurre un error de acceso.
   */
  function leer(clave, porDefecto = null) {
    try {
      const crudo = localStorage.getItem(
        claveCompleta(clave)
      );

      if (crudo == null) {
        return porDefecto;
      }

      return JSON.parse(crudo);
    } catch (_) {
      return porDefecto;
    }
  }

  /**
   * Alias compatible con la otra rama.
   */
  function obtener(clave) {
    return leer(clave, null);
  }

  /**
   * Guarda cualquier valor serializable.
   *
   * Devuelve true si se guardó correctamente
   * y false si ocurrió un error.
   */
  function guardar(clave, valor) {
    try {
      localStorage.setItem(
        claveCompleta(clave),
        JSON.stringify(valor)
      );

      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Devuelve una colección almacenada.
   *
   * Si la clave no existe o no contiene un arreglo,
   * devuelve un arreglo vacío.
   */
  function listar(clave) {
    const valor = leer(clave, []);

    return Array.isArray(valor)
      ? valor
      : [];
  }

  /**
   * Inserta o actualiza un elemento dentro de una colección.
   *
   * - Si ya existe un elemento con el mismo id,
   *   mezcla sus propiedades.
   * - Si no existe, agrega un nuevo elemento.
   *
   * Devuelve el elemento finalmente almacenado
   * o null si no fue posible guardar.
   */
  function guardarItem(clave, id, item = {}) {
    const items = listar(clave);

    const indice = items.findIndex(
      (elemento) =>
        String(elemento.id) === String(id)
    );

    let resultado;

    if (indice >= 0) {
      resultado = {
        ...items[indice],
        ...item,
        id:
          item.id != null
            ? item.id
            : items[indice].id,
      };

      items[indice] = resultado;
    } else {
      resultado = {
        ...item,
        id:
          item.id != null
            ? item.id
            : id,
      };

      items.push(resultado);
    }

    const guardado = guardar(
      clave,
      items
    );

    return guardado
      ? resultado
      : null;
  }

  /**
   * Elimina una clave completa.
   */
  function eliminar(clave) {
    try {
      localStorage.removeItem(
        claveCompleta(clave)
      );

      return true;
    } catch (_) {
      return false;
    }
  }

  return {
    leer,
    obtener,
    guardar,
    listar,
    guardarItem,
    eliminar,
  };
})();