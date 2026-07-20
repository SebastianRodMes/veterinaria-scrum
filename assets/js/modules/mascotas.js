/**
 * Módulo de mascotas.
 *
 * Compatibilidad con ambas ramas:
 *   - id
 *   - nombre
 *   - motivo
 *   - especie
 *   - raza
 *   - usuarioId
 *   - clienteId
 *
 * Interfaz pública:
 *   - registrar
 *   - listar
 *   - obtener
 */
const Mascotas = (() => {
  'use strict';

  const CLAVE = 'mascotas';

  /**
   * Genera un identificador único para una mascota.
   */
  function generarId() {
    const aleatorio = Math.floor(
      Math.random() * 100000
    );

    return `m${Date.now()}${aleatorio}`;
  }

  /**
   * Compara identificadores numéricos o de texto.
   */
  function mismoId(valorA, valorB) {
    return String(valorA) === String(valorB);
  }

  /**
   * Normaliza una mascota proveniente de cualquiera
   * de las dos ramas.
   */
  function normalizar(mascota = {}) {
    const usuarioId =
      mascota.usuarioId != null
        ? mascota.usuarioId
        : mascota.clienteId != null
          ? mascota.clienteId
          : null;

    const clienteId =
      mascota.clienteId != null
        ? mascota.clienteId
        : usuarioId;

    return {
      ...mascota,

      id:
        mascota.id != null
          ? mascota.id
          : generarId(),

      nombre: String(
        mascota.nombre || ''
      ).trim(),

      motivo: String(
        mascota.motivo || ''
      ).trim(),

      especie: String(
        mascota.especie || ''
      ).trim(),

      raza: String(
        mascota.raza || ''
      ).trim(),

      usuarioId,
      clienteId,
    };
  }

  /**
   * Guarda la colección completa de mascotas.
   */
  function persistir(mascotas) {
    return Storage.guardar(
      CLAVE,
      mascotas
    );
  }

  /**
   * Devuelve todas las mascotas normalizadas.
   *
   * También actualiza registros antiguos que no
   * tenían los campos incorporados posteriormente.
   */
  function listar() {
    const almacenadas =
      typeof Storage.listar === 'function'
        ? Storage.listar(CLAVE)
        : Storage.leer(CLAVE, []);

    if (!Array.isArray(almacenadas)) {
      persistir([]);
      return [];
    }

    let huboCambios = false;

    const normalizadas = almacenadas.map(
      (mascota) => {
        const normalizada =
          normalizar(mascota);

        if (
          JSON.stringify(normalizada) !==
          JSON.stringify(mascota)
        ) {
          huboCambios = true;
        }

        return normalizada;
      }
    );

    if (huboCambios) {
      persistir(normalizadas);
    }

    return normalizadas;
  }

  /**
   * Obtiene una mascota por su identificador.
   */
  function obtener(id) {
    if (id === null || id === undefined) {
      return null;
    }

    return (
      listar().find(
        (mascota) =>
          mismoId(mascota.id, id)
      ) || null
    );
  }

  /**
   * Registra una mascota.
   *
   * Formato utilizado por la rama actual:
   * {
   *   nombre,
   *   motivo,
   *   usuarioId
   * }
   *
   * Formato utilizado por la otra rama:
   * {
   *   nombre,
   *   especie,
   *   raza,
   *   clienteId
   * }
   *
   * Si se proporciona un id existente, actualiza
   * el registro sin perder sus propiedades anteriores.
   */
  function registrar(datos = {}) {
    const mascotas = listar();

    const id =
      datos.id != null
        ? datos.id
        : generarId();

    const indice = mascotas.findIndex(
      (mascota) =>
        mismoId(mascota.id, id)
    );

    const datosAnteriores =
      indice >= 0
        ? mascotas[indice]
        : {};

    const mascota = normalizar({
      ...datosAnteriores,
      ...datos,
      id,
    });

    if (indice >= 0) {
      mascotas[indice] = mascota;
    } else {
      mascotas.push(mascota);
    }

    const guardado =
      persistir(mascotas);

    return guardado
      ? mascota
      : null;
  }

  return {
    registrar,
    listar,
    obtener,
  };
})();