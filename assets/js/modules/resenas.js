/**
 * Módulo de reseñas y testimonios.
 *
 * Permite que un cliente califique una consulta atendida mediante:
 *   - Una puntuación de 1 a 5 estrellas.
 *   - Un comentario breve de hasta 300 caracteres.
 *
 * Reglas principales:
 *   - Solo se puede reseñar una consulta con estado "done".
 *   - La consulta debe pertenecer al cliente que envía la reseña.
 *   - Solo puede existir una reseña por consulta.
 *   - Las reseñas nuevas quedan pendientes de aprobación.
 *   - Solo las reseñas aprobadas se muestran como testimonios públicos.
 *
 * Persistencia:
 *   - Las reseñas se guardan mediante Storage en localStorage.
 *
 * Interfaz pública:
 *   META,
 *   crear,
 *   listar,
 *   listarPorUsuario,
 *   listarPendientes,
 *   listarAprobadas,
 *   buscarPorId,
 *   buscarPorConsulta,
 *   existeParaConsulta,
 *   aprobar,
 *   ocultar,
 *   eliminar,
 *   promedioAprobadas,
 *   contadores.
 */
const Resenas = (() => {
  'use strict';

  const CLAVE = 'resenas';
  const MAX_COMENTARIO = 300;

  const ESTADOS_VALIDOS = [
    'pendiente',
    'aprobada',
    'oculta',
  ];

  const META = {
    pendiente: {
      label: 'Pendiente',
      clase: 'pending',
    },
    aprobada: {
      label: 'Aprobada',
      clase: 'done',
    },
    oculta: {
      label: 'Oculta',
      clase: 'cancelado',
    },
  };

  /**
   * Devuelve una copia normalizada de una reseña.
   */
  function normalizarResena(resena = {}) {
    const calificacion = Number(resena.calificacion);

    /*
    * Compatibilidad con reseñas creadas anteriormente:
    * las reseñas que quedaron pendientes pasan automáticamente
    * a estado aprobado/publicado.
    */
    let estadoNormalizado = resena.estado;

    if (estadoNormalizado === 'pendiente') {
        estadoNormalizado = 'aprobada';
    }

    if (!ESTADOS_VALIDOS.includes(estadoNormalizado)) {
        estadoNormalizado = 'aprobada';
    }

    return {
        ...resena,
        id: Number(resena.id),
        consultaId: Number(resena.consultaId),
        usuarioId: Number(resena.usuarioId),

        calificacion: Number.isInteger(calificacion)
        ? calificacion
        : 0,

        comentario: String(resena.comentario || '').trim(),
        cliente: String(resena.cliente || '').trim(),
        mascota: String(resena.mascota || '').trim(),

        estado: estadoNormalizado,

        fecha: resena.fecha || new Date().toISOString(),
    };
    }

  /**
   * Guarda todas las reseñas.
   */
  function persistir(resenas) {
    Storage.guardar(CLAVE, resenas);
  }

  /**
   * Devuelve todas las reseñas almacenadas.
   */
  function listar() {
    const almacenadas = Storage.leer(CLAVE, []);

    if (!Array.isArray(almacenadas)) {
      persistir([]);
      return [];
    }

    const normalizadas = almacenadas.map(normalizarResena);

    const huboCambios = normalizadas.some((resena, indice) => {
      return JSON.stringify(resena) !== JSON.stringify(almacenadas[indice]);
    });

    if (huboCambios) {
      persistir(normalizadas);
    }

    return normalizadas;
  }

  /**
   * Busca una reseña por su identificador.
   */
  function buscarPorId(id) {
    const resenaId = Number(id);

    return listar().find((resena) => resena.id === resenaId) || null;
  }

  /**
   * Busca la reseña asociada a una consulta.
   */
  function buscarPorConsulta(consultaId) {
    const idConsulta = Number(consultaId);

    return listar().find(
      (resena) => resena.consultaId === idConsulta
    ) || null;
  }

  /**
   * Indica si una consulta ya tiene una reseña.
   */
  function existeParaConsulta(consultaId) {
    return buscarPorConsulta(consultaId) !== null;
  }

  /**
   * Devuelve las reseñas creadas por un usuario.
   */
  function listarPorUsuario(usuarioId) {
    const idUsuario = Number(usuarioId);

    if (!Number.isFinite(idUsuario)) {
      return [];
    }

    return listar().filter(
      (resena) => resena.usuarioId === idUsuario
    );
  }

  /**
   * Devuelve las reseñas pendientes de moderación.
   */
  function listarPendientes() {
    return listar()
      .filter((resena) => resena.estado === 'pendiente')
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  /**
   * Devuelve las reseñas aprobadas que pueden mostrarse públicamente.
   */
  function listarAprobadas() {
    return listar()
      .filter((resena) => resena.estado === 'aprobada')
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  /**
   * Valida los datos necesarios para crear una reseña.
   *
   * Devuelve:
   *   { ok: true, consulta }
   *
   * o:
   *   { ok: false, error }
   */
  function validarCreacion({
    consultaId,
    usuarioId,
    calificacion,
    comentario,
  } = {}) {
    const idConsulta = Number(consultaId);
    const idUsuario = Number(usuarioId);
    const estrellas = Number(calificacion);
    const texto = String(comentario || '').trim();

    if (!Number.isFinite(idConsulta)) {
      return {
        ok: false,
        error: 'La consulta seleccionada no es válida.',
      };
    }

    if (!Number.isFinite(idUsuario)) {
      return {
        ok: false,
        error: 'Debes iniciar sesión para enviar una reseña.',
      };
    }

    const consulta = Consultas.listar().find(
      (item) => item.id === idConsulta
    );

    if (!consulta) {
      return {
        ok: false,
        error: 'La consulta no existe.',
      };
    }

    if (consulta.status !== 'done') {
      return {
        ok: false,
        error: 'Solo puedes calificar una consulta que ya fue atendida.',
      };
    }

    if (Number(consulta.usuarioId) !== idUsuario) {
      return {
        ok: false,
        error: 'Esta consulta no pertenece al usuario actual.',
      };
    }

    if (existeParaConsulta(idConsulta)) {
      return {
        ok: false,
        error: 'Esta consulta ya tiene una reseña registrada.',
      };
    }

    if (
      !Number.isInteger(estrellas) ||
      estrellas < 1 ||
      estrellas > 5
    ) {
      return {
        ok: false,
        error: 'Selecciona una calificación de 1 a 5 estrellas.',
      };
    }

    if (!texto) {
      return {
        ok: false,
        error: 'Escribe un comentario sobre la atención recibida.',
      };
    }

    if (texto.length > MAX_COMENTARIO) {
      return {
        ok: false,
        error: `El comentario no puede superar los ${MAX_COMENTARIO} caracteres.`,
      };
    }

    return {
      ok: true,
      consulta,
      datos: {
        consultaId: idConsulta,
        usuarioId: idUsuario,
        calificacion: estrellas,
        comentario: texto,
      },
    };
  }

  /**
   * Crea una nueva reseña.
   *
   * datos:
   * {
   *   consultaId,
   *   usuarioId,
   *   calificacion,
   *   comentario
   * }
   *
   * Devuelve:
   *   { ok: true, resena }
   *
   * o:
   *   { ok: false, error }
   */
  function crear(datos = {}) {
    const validacion = validarCreacion(datos);

    if (!validacion.ok) {
      return validacion;
    }

    const consulta = validacion.consulta;
    const datosValidados = validacion.datos;

    const nuevaResena = {
      id: Date.now(),
      consultaId: datosValidados.consultaId,
      usuarioId: datosValidados.usuarioId,
      cliente: String(consulta.cliente || '').trim(),
      mascota: String(consulta.mascota || '').trim(),
      calificacion: datosValidados.calificacion,
      comentario: datosValidados.comentario,
      fecha: new Date().toISOString(),
      estado: 'aprobada',
    };

    const resenas = listar();
    resenas.push(nuevaResena);
    persistir(resenas);

    return {
      ok: true,
      resena: nuevaResena,
    };
  }

  /**
   * Cambia el estado de una reseña.
   */
  function cambiarEstado(id, nuevoEstado) {
    const resenaId = Number(id);

    if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
      return null;
    }

    let actualizada = null;

    const resenas = listar().map((resena) => {
      if (resena.id !== resenaId) {
        return resena;
      }

      actualizada = {
        ...resena,
        estado: nuevoEstado,
      };

      return actualizada;
    });

    if (!actualizada) {
      return null;
    }

    persistir(resenas);
    return actualizada;
  }

  /**
   * Aprueba una reseña para mostrarla como testimonio.
   */
  function aprobar(id) {
    return cambiarEstado(id, 'aprobada');
  }

  /**
   * Oculta una reseña para que no sea pública.
   */
  function ocultar(id) {
    return cambiarEstado(id, 'oculta');
  }

  /**
   * Elimina definitivamente una reseña.
   */
  function eliminar(id) {
    const resenaId = Number(id);
    const resenas = listar();

    const existe = resenas.some(
      (resena) => resena.id === resenaId
    );

    if (!existe) {
      return false;
    }

    const actualizadas = resenas.filter(
      (resena) => resena.id !== resenaId
    );

    persistir(actualizadas);
    return true;
  }

  /**
   * Calcula el promedio de las reseñas aprobadas.
   *
   * Devuelve 0 si todavía no existen reseñas aprobadas.
   */
  function promedioAprobadas() {
    const aprobadas = listarAprobadas();

    if (!aprobadas.length) {
      return 0;
    }

    const total = aprobadas.reduce(
      (acumulado, resena) => acumulado + resena.calificacion,
      0
    );

    return Number((total / aprobadas.length).toFixed(1));
  }

  /**
   * Devuelve el conteo de reseñas por estado.
   */
  function contadores() {
    const resultado = {
      pendiente: 0,
      aprobada: 0,
      oculta: 0,
      total: 0,
    };

    listar().forEach((resena) => {
      resultado.total++;

      if (
        Object.prototype.hasOwnProperty.call(
          resultado,
          resena.estado
        )
      ) {
        resultado[resena.estado]++;
      }
    });

    return resultado;
  }

  return {
    META,
    MAX_COMENTARIO,
    crear,
    listar,
    listarPorUsuario,
    listarPendientes,
    listarAprobadas,
    buscarPorId,
    buscarPorConsulta,
    existeParaConsulta,
    aprobar,
    ocultar,
    eliminar,
    promedioAprobadas,
    contadores,
  };
})();