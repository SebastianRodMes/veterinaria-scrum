/**
 * localStorage wrapper — única puerta de acceso a persistencia.
 *
 * Todos los módulos deben utilizar este objeto en lugar
 * de acceder directamente a localStorage.
 *
 * Métodos disponibles:
 *   - leer
 *   - obtener
 *   - guardar
 *   - listar
 *   - guardarItem
 *   - eliminar
 *
 * Las claves nuevas se almacenan con el prefijo "vet:".
 * También se pueden leer datos antiguos guardados sin prefijo.
 */
const Storage = (() => {
  'use strict';

  const PREFIJO = 'vet:';

  /**
   * Normaliza la clave recibida.
   */
  function normalizarClave(clave) {
    return String(clave ?? '').trim();
  }

  /**
   * Construye la clave utilizada actualmente.
   *
   * Evita duplicar el prefijo cuando se recibe,
   * por ejemplo, "vet:consultas".
   */
  function claveCompleta(clave) {
    const valor = normalizarClave(clave);

    return valor.startsWith(PREFIJO)
      ? valor
      : `${PREFIJO}${valor}`;
  }

  /**
   * Devuelve la versión antigua de una clave,
   * sin el prefijo "vet:".
   */
  function claveAnterior(clave) {
    const valor = normalizarClave(clave);

    return valor.startsWith(PREFIJO)
      ? valor.slice(PREFIJO.length)
      : valor;
  }

  /**
   * Convierte un contenido JSON almacenado.
   */
  function convertirJSON(crudo, porDefecto) {
    if (crudo === null) {
      return porDefecto;
    }

    try {
      return JSON.parse(crudo);
    } catch (_) {
      return porDefecto;
    }
  }

  /**
   * Lee una clave almacenada.
   *
   * Primero busca la clave actual con prefijo.
   * Si no existe, busca la clave antigua sin prefijo.
   *
   * Cuando encuentra datos antiguos, crea además una
   * copia utilizando el formato nuevo.
   */
  function leer(clave, porDefecto = null) {
    try {
      const claveNueva = claveCompleta(clave);

      const crudoNuevo =
        localStorage.getItem(claveNueva);

      if (crudoNuevo !== null) {
        return convertirJSON(
          crudoNuevo,
          porDefecto
        );
      }

      const claveVieja =
        claveAnterior(clave);

      const crudoAnterior =
        localStorage.getItem(claveVieja);

      if (crudoAnterior === null) {
        return porDefecto;
      }

      const valorAnterior =
        convertirJSON(
          crudoAnterior,
          porDefecto
        );

      /*
       * Migra silenciosamente los datos antiguos
       * al formato con prefijo.
       */
      try {
        localStorage.setItem(
          claveNueva,
          JSON.stringify(valorAnterior)
        );
      } catch (_) {
        /*
         * La lectura sigue siendo válida aunque
         * la migración no pueda realizarse.
         */
      }

      return valorAnterior;
    } catch (_) {
      return porDefecto;
    }
  }

  /**
   * Alias de leer compatible con la otra rama.
   */
  function obtener(
    clave,
    porDefecto = null
  ) {
    return leer(
      clave,
      porDefecto
    );
  }

  /**
   * Guarda cualquier valor serializable.
   *
   * Los nuevos datos siempre se guardan con
   * el prefijo "vet:".
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
   * Si la clave no existe o el contenido no es
   * un arreglo, devuelve un arreglo vacío.
   */
  function listar(clave) {
    const valor = leer(
      clave,
      []
    );

    return Array.isArray(valor)
      ? valor
      : [];
  }

  /**
   * Inserta o actualiza un elemento dentro
   * de una colección.
   *
   * Si encuentra el mismo identificador:
   *   - Conserva las propiedades anteriores.
   *   - Sobrescribe solamente las nuevas.
   *
   * Si no existe:
   *   - Agrega el elemento a la colección.
   */
  function guardarItem(
    clave,
    id,
    item = {}
  ) {
    const items = listar(clave);

    const identificador =
      item.id !== null &&
      item.id !== undefined
        ? item.id
        : id;

    const indice = items.findIndex(
      (elemento) =>
        String(elemento.id) ===
        String(identificador)
    );

    let resultado;

    if (indice >= 0) {
      resultado = {
        ...items[indice],
        ...item,
        id: identificador,
      };

      items[indice] = resultado;
    } else {
      resultado = {
        ...item,
        id: identificador,
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
   * Elimina tanto la clave nueva con prefijo
   * como la versión antigua sin prefijo.
   */
  function eliminar(clave) {
    try {
      localStorage.removeItem(
        claveCompleta(clave)
      );

      localStorage.removeItem(
        claveAnterior(clave)
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