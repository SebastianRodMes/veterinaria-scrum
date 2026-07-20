/**
 * Módulo de consultas — citas, estados y notas clínicas.
 *
 * Conserva la estructura actual del proyecto:
 *   - pending
 *   - confirmed
 *   - in_progress
 *   - done
 *   - cancelado
 *
 * También acepta los nombres usados por la otra rama:
 *   - pendiente
 *   - confirmado
 *   - en_progreso
 *   - completado
 *   - cancelada
 *
 * Funcionalidades:
 *   - Reservar consultas.
 *   - Confirmar consultas.
 *   - Cancelar consultas.
 *   - Cambiar y avanzar estados.
 *   - Filtrar y agrupar consultas.
 *   - Completar una consulta con notas clínicas.
 *   - Consultar el historial clínico de una mascota.
 *
 * Interfaz pública:
 *   META,
 *   reservar,
 *   listar,
 *   obtener,
 *   listarPorUsuario,
 *   confirmar,
 *   completar,
 *   cancelar,
 *   cambiarEstado,
 *   avanzarEstado,
 *   filtrar,
 *   agrupadasPorFecha,
 *   historialMascota,
 *   contadores.
 */
const Consultas = (() => {
  'use strict';

  const CLAVE = 'consultas';
  const CLAVE_SEMBRADO = 'consultas-sembradas';

  const META = {
    pending: {
      label: 'Pendiente',
      clase: 'pending',
    },

    confirmed: {
      label: 'Confirmada',
      clase: 'confirmed',
    },

    in_progress: {
      label: 'En progreso',
      clase: 'in_progress',
    },

    done: {
      label: 'Atendida',
      clase: 'done',
    },

    cancelado: {
      label: 'Cancelada',
      clase: 'cancelado',
    },
  };

  const SIGUIENTE_ESTADO = {
    pending: 'in_progress',
    confirmed: 'in_progress',
    in_progress: 'done',
    done: 'done',
    cancelado: 'cancelado',
  };

  const MAPA_ESTADOS = {
    pending: 'pending',
    pendiente: 'pending',

    confirmed: 'confirmed',
    confirmado: 'confirmed',
    confirmada: 'confirmed',

    in_progress: 'in_progress',
    en_progreso: 'in_progress',
    'en progreso': 'in_progress',

    done: 'done',
    completado: 'done',
    completada: 'done',
    atendida: 'done',

    cancelado: 'cancelado',
    cancelada: 'cancelado',
    canceled: 'cancelado',
    cancelled: 'cancelado',
  };

  const SEMILLA = [
    {
      id: 1,
      date: 'Lun 16 Jun',
      rank: 1,
      time: '09:00',
      cliente: 'María López',
      mascota: 'Toby',
      mascotaId: null,
      motivo: 'Vacunación',
      status: 'done',
      usuarioId: null,
      notasClinicas: null,
    },
    {
      id: 2,
      date: 'Lun 16 Jun',
      rank: 1,
      time: '10:30',
      cliente: 'Carlos Ruiz',
      mascota: 'Luna',
      mascotaId: null,
      motivo: 'Control',
      status: 'in_progress',
      usuarioId: null,
      notasClinicas: null,
    },
    {
      id: 3,
      date: 'Lun 16 Jun',
      rank: 1,
      time: '11:00',
      cliente: 'Ana Torres',
      mascota: 'Max',
      mascotaId: null,
      motivo: 'Consulta general',
      status: 'pending',
      usuarioId: null,
      notasClinicas: null,
    },
    {
      id: 4,
      date: 'Mar 17 Jun',
      rank: 2,
      time: '09:00',
      cliente: 'Jorge Díaz',
      mascota: 'Kira',
      mascotaId: null,
      motivo: 'Estética',
      status: 'pending',
      usuarioId: null,
      notasClinicas: null,
    },
    {
      id: 5,
      date: 'Mar 17 Jun',
      rank: 2,
      time: '16:30',
      cliente: 'Lucía Vega',
      mascota: 'Rocky',
      mascotaId: null,
      motivo: 'Emergencia',
      status: 'pending',
      usuarioId: null,
      notasClinicas: null,
    },
  ];

  /**
   * Genera un identificador para una nueva consulta.
   */
  function generarId() {
    return Date.now();
  }

  /**
   * Convierte cualquier variante de estado
   * al formato utilizado actualmente.
   */
  function normalizarEstado(estado) {
    const valor = String(estado || '')
      .trim()
      .toLowerCase();

    return MAPA_ESTADOS[valor] || 'pending';
  }

  /**
   * Convierte textos para realizar comparaciones
   * sin distinguir mayúsculas ni tildes.
   */
  function normalizarTexto(texto) {
    return String(texto || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Compara identificadores numéricos o de texto.
   */
  function mismoId(valorA, valorB) {
    return String(valorA) === String(valorB);
  }

  /**
   * Guarda la colección completa de consultas.
   */
  function persistir(consultas) {
    Storage.guardar(CLAVE, consultas);
  }

  /**
   * Crea los registros iniciales solamente
   * cuando todavía no se ha sembrado el módulo.
   */
  function asegurarSembrado() {
    if (!Storage.leer(CLAVE_SEMBRADO, false)) {
      const existentes = Storage.leer(CLAVE, []);

      if (!Array.isArray(existentes) || !existentes.length) {
        Storage.guardar(CLAVE, SEMILLA);
      }

      Storage.guardar(CLAVE_SEMBRADO, true);
    }
  }

  /**
   * Normaliza una consulta de cualquiera de las dos ramas.
   */
  function normalizarConsulta(consulta = {}, indice = 0) {
    const status = normalizarEstado(
      consulta.status != null
        ? consulta.status
        : consulta.estado
    );

    const date = String(
      consulta.date != null
        ? consulta.date
        : consulta.fecha || ''
    ).trim();

    const time = String(
      consulta.time != null
        ? consulta.time
        : consulta.horario || ''
    ).trim();

    const id =
      consulta.id != null
        ? consulta.id
        : generarId() + indice;

    return {
      ...consulta,

      id,

      date,
      fecha: date,

      rank:
        consulta.rank != null
          ? Number(consulta.rank)
          : 0,

      time,
      horario: time,

      slotId:
        consulta.slotId != null
          ? consulta.slotId
          : null,

      cliente: String(
        consulta.cliente || ''
      ).trim(),

      contacto: String(
        consulta.contacto || ''
      ).trim(),

      mascota: String(
        consulta.mascota || ''
      ).trim(),

      mascotaId:
        consulta.mascotaId != null
          ? consulta.mascotaId
          : null,

      motivo: String(
        consulta.motivo || ''
      ).trim(),

      status,

      /*
       * Se conserva también el nombre de campo usado
       * en la rama del compañero para compatibilidad.
       */
      estado: estadoExterno(status),

      usuarioId:
        consulta.usuarioId != null
          ? consulta.usuarioId
          : consulta.clienteId != null
            ? consulta.clienteId
            : null,

      notasClinicas:
        consulta.notasClinicas || null,
    };
  }

  /**
   * Devuelve el estado con el nombre usado
   * por la implementación alternativa.
   */
  function estadoExterno(status) {
    const estados = {
      pending: 'pendiente',
      confirmed: 'confirmado',
      in_progress: 'en_progreso',
      done: 'completado',
      cancelado: 'cancelada',
    };

    return estados[status] || status;
  }

  /**
   * Obtiene todas las consultas normalizadas.
   *
   * También admite filtros:
   * {
   *   estado,
   *   status,
   *   mascotaId,
   *   usuarioId,
   *   busqueda
   * }
   */
  function listar(filtros = {}) {
    asegurarSembrado();

    const almacenadas = Storage.leer(CLAVE, []);

    if (!Array.isArray(almacenadas)) {
      persistir([]);
      return [];
    }

    const normalizadas = almacenadas.map(
      normalizarConsulta
    );

    const huboCambios = normalizadas.some(
      (consulta, indice) =>
        JSON.stringify(consulta) !==
        JSON.stringify(almacenadas[indice])
    );

    if (huboCambios) {
      persistir(normalizadas);
    }

    let resultado = normalizadas;

    const estadoFiltro =
      filtros.status != null
        ? filtros.status
        : filtros.estado;

    if (
      estadoFiltro &&
      estadoFiltro !== 'all'
    ) {
      const estadoNormalizado =
        normalizarEstado(estadoFiltro);

      resultado = resultado.filter(
        (consulta) =>
          consulta.status === estadoNormalizado
      );
    }

    if (filtros.mascotaId != null) {
      resultado = resultado.filter(
        (consulta) =>
          mismoId(
            consulta.mascotaId,
            filtros.mascotaId
          )
      );
    }

    if (filtros.usuarioId != null) {
      resultado = resultado.filter(
        (consulta) =>
          mismoId(
            consulta.usuarioId,
            filtros.usuarioId
          )
      );
    }

    if (filtros.busqueda) {
      const termino =
        normalizarTexto(filtros.busqueda);

      resultado = resultado.filter(
        (consulta) => {
          const campos = [
            consulta.mascota,
            consulta.cliente,
            consulta.motivo,
          ].map(normalizarTexto);

          return campos.some(
            (valor) =>
              valor.includes(termino)
          );
        }
      );
    }

    return resultado;
  }

  /**
   * Busca una consulta por su identificador.
   */
  function obtener(id) {
    return (
      listar().find(
        (consulta) =>
          mismoId(consulta.id, id)
      ) || null
    );
  }

  /**
   * Crea una consulta pendiente.
   *
   * Admite el formato actual:
   * {
   *   cliente,
   *   contacto,
   *   mascota,
   *   motivo,
   *   day,
   *   slot,
   *   usuarioId,
   *   mascotaId
   * }
   *
   * Y el formato de la otra rama:
   * {
   *   mascotaId,
   *   fecha,
   *   horario
   * }
   */
  function reservar(datos = {}) {
    const consultas = listar();

    const day = datos.day || {};
    const slot = datos.slot || {};

    const date = String(
      day.date != null
        ? day.date
        : datos.date != null
          ? datos.date
          : datos.fecha || ''
    ).trim();

    const time = String(
      slot.time != null
        ? slot.time
        : datos.time != null
          ? datos.time
          : datos.horario || ''
    ).trim();

    const nueva = normalizarConsulta({
      id:
        datos.id != null
          ? datos.id
          : generarId(),

      date,

      rank:
        day.rank != null
          ? day.rank
          : datos.rank != null
            ? datos.rank
            : 0,

      time,

      slotId:
        slot.id != null
          ? slot.id
          : datos.slotId != null
            ? datos.slotId
            : null,

      cliente:
        datos.cliente || '',

      contacto:
        datos.contacto || '',

      mascota:
        datos.mascota || '',

      mascotaId:
        datos.mascotaId != null
          ? datos.mascotaId
          : null,

      motivo:
        datos.motivo || '',

      status: 'pending',

      usuarioId:
        datos.usuarioId != null
          ? datos.usuarioId
          : datos.clienteId != null
            ? datos.clienteId
            : null,

      notasClinicas: null,
    });

    consultas.push(nueva);
    persistir(consultas);

    return nueva;
  }

  /**
   * Confirma una consulta y permite reasignar
   * fecha, posición y hora.
   */
  function confirmar(
    id,
    {
      date,
      fecha,
      rank,
      time,
      horario,
    } = {}
  ) {
    let actualizada = null;

    const consultas = listar().map(
      (consulta) => {
        if (!mismoId(consulta.id, id)) {
          return consulta;
        }

        const nuevaFecha =
          date != null
            ? date
            : fecha != null
              ? fecha
              : consulta.date;

        const nuevaHora =
          time != null
            ? time
            : horario != null
              ? horario
              : consulta.time;

        actualizada = normalizarConsulta({
          ...consulta,

          status: 'confirmed',

          date: nuevaFecha,

          rank:
            rank != null
              ? rank
              : consulta.rank,

          time: nuevaHora,
        });

        return actualizada;
      }
    );

    if (actualizada) {
      persistir(consultas);
    }

    return actualizada;
  }

  /**
   * Cambia directamente el estado de una consulta.
   *
   * Admite estados en español o inglés.
   */
  function cambiarEstado(id, nuevoEstado) {
    const estadoNormalizado =
      normalizarEstado(nuevoEstado);

    let actualizada = null;

    const consultas = listar().map(
      (consulta) => {
        if (!mismoId(consulta.id, id)) {
          return consulta;
        }

        actualizada = normalizarConsulta({
          ...consulta,
          status: estadoNormalizado,
        });

        return actualizada;
      }
    );

    if (actualizada) {
      persistir(consultas);
    }

    return actualizada;
  }

  /**
   * Avanza el estado siguiendo el flujo actual.
   */
  function avanzarEstado(id) {
    let actualizada = null;

    const consultas = listar().map(
      (consulta) => {
        if (!mismoId(consulta.id, id)) {
          return consulta;
        }

        const siguiente =
          SIGUIENTE_ESTADO[
            consulta.status
          ] || consulta.status;

        actualizada = normalizarConsulta({
          ...consulta,
          status: siguiente,
        });

        return actualizada;
      }
    );

    if (actualizada) {
      persistir(consultas);
    }

    /*
     * Se conserva el retorno anterior para no romper
     * el código actual del panel administrativo.
     */
    return consultas;
  }

  /**
   * Completa una consulta y registra sus notas clínicas.
   */
  function completar(
    id,
    notasClinicas = {}
  ) {
    let actualizada = null;

    const consultas = listar().map(
      (consulta) => {
        if (!mismoId(consulta.id, id)) {
          return consulta;
        }

        actualizada = normalizarConsulta({
          ...consulta,

          status: 'done',

          notasClinicas: {
            peso: String(
              notasClinicas.peso || ''
            ).trim(),

            sintomas: String(
              notasClinicas.sintomas || ''
            ).trim(),

            diagnostico: String(
              notasClinicas.diagnostico || ''
            ).trim(),

            tratamiento: String(
              notasClinicas.tratamiento || ''
            ).trim(),

            fechaRegistro:
              notasClinicas.fechaRegistro ||
              new Date().toISOString(),
          },
        });

        return actualizada;
      }
    );

    if (!actualizada) {
      return null;
    }

    persistir(consultas);

    return actualizada;
  }

  /**
   * Cancela únicamente una consulta pendiente.
   */
  function cancelar(id) {
    const consulta = obtener(id);

    if (
      !consulta ||
      consulta.status !== 'pending'
    ) {
      return null;
    }

    return cambiarEstado(
      id,
      'cancelado'
    );
  }

  /**
   * Filtra consultas utilizando estado y búsqueda.
   */
  function filtrar({
    estado = 'all',
    busqueda = '',
    mascotaId = null,
    usuarioId = null,
  } = {}) {
    return listar({
      estado,
      busqueda,
      mascotaId,
      usuarioId,
    });
  }

  /**
   * Agrupa las consultas por posición de fecha
   * y las ordena por hora.
   */
  function agrupadasPorFecha(
    filtros = {}
  ) {
    const consultas = filtrar(filtros);

    const grupos = new Map();

    consultas.forEach((consulta) => {
      const clave =
        consulta.rank ||
        consulta.date ||
        'sin-fecha';

      if (!grupos.has(clave)) {
        grupos.set(clave, []);
      }

      grupos.get(clave).push(consulta);
    });

    return [...grupos.entries()]
      .sort(([claveA], [claveB]) => {
        if (
          typeof claveA === 'number' &&
          typeof claveB === 'number'
        ) {
          return claveA - claveB;
        }

        return String(claveA).localeCompare(
          String(claveB)
        );
      })
      .map(([, elementos]) => {
        const rows = elementos
          .sort((a, b) =>
            String(a.time || '').localeCompare(
              String(b.time || '')
            )
          )
          .map((consulta, indice) => ({
            ...consulta,
            queue: indice + 1,
          }));

        return {
          date:
            rows[0]?.date ||
            'Fecha no indicada',

          count: rows.length,

          rows,
        };
      });
  }

  /**
   * Devuelve las consultas asociadas
   * a una cuenta de usuario.
   */
  function listarPorUsuario(usuarioId) {
    if (usuarioId == null) {
      return [];
    }

    return listar().filter(
      (consulta) =>
        mismoId(
          consulta.usuarioId,
          usuarioId
        )
    );
  }

  /**
   * Devuelve el historial clínico por mascota.
   *
   * Primero intenta identificar la mascota por mascotaId.
   * Si no existe, también acepta:
   *   - Una consulta.
   *   - El nombre de la mascota.
   */
  function historialMascota(
    mascotaIdONombre,
    usuarioId = null
  ) {
    let mascotaId = null;
    let nombreMascota = '';
    let propietarioId = usuarioId;

    if (
      mascotaIdONombre &&
      typeof mascotaIdONombre === 'object'
    ) {
      mascotaId =
        mascotaIdONombre.mascotaId != null
          ? mascotaIdONombre.mascotaId
          : null;

      nombreMascota =
        mascotaIdONombre.mascota || '';

      if (
        propietarioId == null &&
        mascotaIdONombre.usuarioId != null
      ) {
        propietarioId =
          mascotaIdONombre.usuarioId;
      }
    } else {
      const consultaPorId = listar().find(
        (consulta) =>
          consulta.mascotaId != null &&
          mismoId(
            consulta.mascotaId,
            mascotaIdONombre
          )
      );

      if (consultaPorId) {
        mascotaId = mascotaIdONombre;
        nombreMascota =
          consultaPorId.mascota || '';
      } else {
        nombreMascota =
          String(
            mascotaIdONombre || ''
          );
      }
    }

    const nombreNormalizado =
      normalizarTexto(nombreMascota);

    return listar()
      .filter((consulta) => {
        if (
          consulta.status !== 'done' ||
          !consulta.notasClinicas
        ) {
          return false;
        }

        if (
          propietarioId != null &&
          !mismoId(
            consulta.usuarioId,
            propietarioId
          )
        ) {
          return false;
        }

        if (
          mascotaId != null &&
          consulta.mascotaId != null
        ) {
          return mismoId(
            consulta.mascotaId,
            mascotaId
          );
        }

        return (
          nombreNormalizado &&
          normalizarTexto(
            consulta.mascota
          ) === nombreNormalizado
        );
      })
      .sort((a, b) => {
        const fechaA =
          a.notasClinicas
            ?.fechaRegistro || '';

        const fechaB =
          b.notasClinicas
            ?.fechaRegistro || '';

        return fechaB.localeCompare(
          fechaA
        );
      });
  }

  /**
   * Devuelve la cantidad de consultas
   * agrupadas por estado.
   */
  function contadores() {
    const resultado = {
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      done: 0,
      cancelado: 0,
    };

    listar().forEach((consulta) => {
      if (
        Object.prototype.hasOwnProperty.call(
          resultado,
          consulta.status
        )
      ) {
        resultado[consulta.status]++;
      }
    });

    return resultado;
  }

  return {
    META,

    reservar,
    listar,
    obtener,
    listarPorUsuario,

    confirmar,
    completar,
    cancelar,
    cambiarEstado,
    avanzarEstado,

    filtrar,
    agrupadasPorFecha,
    historialMascota,
    contadores,
  };
})();
