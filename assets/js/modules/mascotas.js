/**
 * Módulo de mascotas.
 *
 * Conserva la funcionalidad existente:
 *   - Registrar nombre, motivo y usuarioId.
 *
 * Agrega la funcionalidad de la otra rama:
 *   - Identificador único.
 *   - Especie.
 *   - Raza.
 *   - clienteId.
 *   - Obtener una mascota por id.
 *
 * Interfaz pública:
 *   registrar, listar, obtener.
 */
const Mascotas = (() => {
  'use strict';

  const CLAVE = 'mascotas';

  /**
   * Genera un identificador único para una mascota.
   */
  function generarId() {
    return `m${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Normaliza una mascota almacenada.
   *
   * Esto permite seguir usando registros antiguos
   * que todavía no tenían id, especie, raza o clienteId.
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
        mascota.id ||
        generarId(),

      nombre:
        String(mascota.nombre || '').trim(),

      motivo:
        String(mascota.motivo || '').trim(),

      especie:
        String(mascota.especie || '').trim(),

      raza:
        String(mascota.raza || '').trim(),

      usuarioId,
      clienteId,
    };
  }

  /**
   * Guarda el listado completo de mascotas.
   */
  function persistir(mascotas) {
    Storage.guardar(CLAVE, mascotas);
  }

  /**
   * Devuelve todas las mascotas registradas.
   */
  function listar() {
    const almacenadas = Storage.leer(CLAVE, []);

    if (!Array.isArray(almacenadas)) {
      persistir([]);
      return [];
    }

    let huboCambios = false;

    const normalizadas = almacenadas.map((mascota) => {
      const normalizada = normalizar(mascota);

      if (
        !mascota.id ||
        mascota.usuarioId === undefined ||
        mascota.clienteId === undefined ||
        mascota.especie === undefined ||
        mascota.raza === undefined
      ) {
        huboCambios = true;
      }

      return normalizada;
    });

    if (huboCambios) {
      persistir(normalizadas);
    }

    return normalizadas;
  }

  /**
   * Obtiene una mascota por su identificador.
   */
  function obtener(id) {
    const mascotaId = String(id || '');

    return (
      listar().find(
        (mascota) =>
          String(mascota.id) === mascotaId
      ) || null
    );
  }

  /**
   * Registra una mascota.
   *
   * Admite ambos formatos:
   *
   * Formato actual:
   * {
   *   nombre,
   *   motivo,
   *   usuarioId
   * }
   *
   * Formato de la otra rama:
   * {
   *   nombre,
   *   especie,
   *   raza,
   *   clienteId
   * }
   */
  function registrar(datos = {}) {
    const usuarioId =
      datos.usuarioId != null
        ? datos.usuarioId
        : datos.clienteId != null
          ? datos.clienteId
          : null;

    const mascota = {
      id:
        datos.id ||
        generarId(),

      nombre:
        String(datos.nombre || '').trim(),

      motivo:
        String(datos.motivo || '').trim(),

      especie:
        String(datos.especie || '').trim(),

      raza:
        String(datos.raza || '').trim(),

      usuarioId,

      clienteId:
        datos.clienteId != null
          ? datos.clienteId
          : usuarioId,
    };

    const mascotas = listar();

    mascotas.push(mascota);

    persistir(mascotas);

    return mascota;
  }

  return {
    registrar,
    listar,
    obtener,
  };
})();