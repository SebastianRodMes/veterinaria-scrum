/**
 * Módulo de consultas — CRUD, estados y transiciones.
 *
 * Una consulta es la cita agendada por un cliente para su mascota.
 * Estados: pending → confirmed → in_progress → done; una consulta pendiente
 * también puede quedar cancelada por el cliente.
 *   - El admin confirma una consulta pendiente (confirmar), fijando la
 *     fecha/hora de atención y notificando al cliente.
 *   - Una vez confirmada, el ciclo de atención avanza con avanzarEstado.
 *   - El cliente puede cancelar una consulta pendiente (cancelar).
 * Se persiste vía Storage; sembrado inicial la primera vez.
 *
 * Interfaz pública: META, reservar, listar, listarPorUsuario, confirmar,
 *                   cancelar, avanzarEstado, filtrar, agrupadasPorFecha,
 *                   contadores.
 */
const Consultas = (() => {
  const CLAVE = 'consultas';
  const CLAVE_SEMBRADO = 'consultas-sembradas';

  // Metadatos de presentación por estado (etiqueta + clase CSS del badge).
  const META = {
    pending:     { label: 'Pendiente',   clase: 'pending' },
    confirmed:   { label: 'Confirmada',  clase: 'confirmed' },
    in_progress: { label: 'En progreso', clase: 'in_progress' },
    done:        { label: 'Atendida',    clase: 'done' },
    cancelado:   { label: 'Cancelada',   clase: 'cancelado' },
  };

  // Ciclo de atención posterior a la confirmación. El panel admin no hace
  // avanzar canceladas; se deja estable para evitar estados indefinidos.
  const SIGUIENTE_ESTADO = {
    pending: 'in_progress',
    confirmed: 'in_progress',
    in_progress: 'done',
    done: 'pending',
    cancelado: 'cancelado',
  };

  const SEMILLA = [
    { id: 1, date: 'Lun 16 Jun', rank: 1, time: '09:00', cliente: 'María López', mascota: 'Toby',  motivo: 'Vacunación',       status: 'done' },
    { id: 2, date: 'Lun 16 Jun', rank: 1, time: '10:30', cliente: 'Carlos Ruiz', mascota: 'Luna',  motivo: 'Control',          status: 'in_progress' },
    { id: 3, date: 'Lun 16 Jun', rank: 1, time: '11:00', cliente: 'Ana Torres',  mascota: 'Max',   motivo: 'Consulta general', status: 'pending' },
    { id: 4, date: 'Mar 17 Jun', rank: 2, time: '09:00', cliente: 'Jorge Díaz',  mascota: 'Kira',  motivo: 'Estética',         status: 'pending' },
    { id: 5, date: 'Mar 17 Jun', rank: 2, time: '16:30', cliente: 'Lucía Vega',  mascota: 'Rocky', motivo: 'Emergencia',       status: 'pending' },
  ];

  function asegurarSembrado() {
    if (!Storage.leer(CLAVE_SEMBRADO, false)) {
      Storage.guardar(CLAVE, SEMILLA);
      Storage.guardar(CLAVE_SEMBRADO, true);
    }
  }

  function persistir(consultas) {
    Storage.guardar(CLAVE, consultas);
  }

  function normalizarConsulta(consulta) {
    return consulta.status === 'canceled'
      ? { ...consulta, status: 'cancelado' }
      : consulta;
  }

  function listar() {
    asegurarSembrado();
    const consultas = Storage.leer(CLAVE, []);
    const normalizadas = consultas.map(normalizarConsulta);
    const cambio = normalizadas.some((consulta, i) => consulta !== consultas[i]);
    if (cambio) persistir(normalizadas);
    return normalizadas;
  }

  function normalizarTexto(texto) {
    return String(texto || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function coincideEstado(consulta, estado) {
    return !estado || estado === 'all' || consulta.status === estado;
  }

  function coincideBusqueda(consulta, busqueda) {
    const termino = normalizarTexto(busqueda);
    if (!termino) return true;

    // El dueño de la mascota se guarda en la consulta como cliente.
    const camposBuscables = [
      consulta.mascota,
      consulta.cliente,
    ].map(normalizarTexto);

    return camposBuscables.some((valor) => valor.includes(termino));
  }

  function filtrar({ estado = 'all', busqueda = '' } = {}) {
    return listar().filter((consulta) =>
      coincideEstado(consulta, estado) && coincideBusqueda(consulta, busqueda)
    );
  }

  /**
   * Crea una consulta pendiente.
   * `datos`: { cliente, contacto, mascota, motivo, day, slot, usuarioId }
   * `usuarioId` (opcional) asocia la cita a la cuenta del cliente.
   * Devuelve la consulta creada.
   */
  function reservar({ cliente, contacto, mascota, motivo, day, slot, usuarioId }) {
    const consultas = listar();
    const nueva = {
      id: Date.now(),
      date: day.date,
      rank: day.rank,
      time: slot.time,
      slotId: slot.id || null,
      cliente: (cliente || '').trim(),
      contacto: (contacto || '').trim(),
      mascota: (mascota || '').trim(),
      motivo,
      status: 'pending',
      usuarioId: usuarioId != null ? usuarioId : null,
    };
    consultas.push(nueva);
    persistir(consultas);
    return nueva;
  }

  /**
   * Confirma una consulta pendiente: la pasa a estado 'confirmed' y, si se
   * indican, reasigna la fecha/hora de atención elegidas por el admin.
   * `datos` (opcional): { date, rank, time }.
   * Devuelve la consulta actualizada o null si el id no existe.
   */
  function confirmar(id, { date, rank, time } = {}) {
    let actualizada = null;
    const consultas = listar().map((c) => {
      if (c.id !== id) return c;
      actualizada = {
        ...c,
        status: 'confirmed',
        date: date != null ? date : c.date,
        rank: rank != null ? rank : c.rank,
        time: time != null ? time : c.time,
      };
      return actualizada;
    });
    persistir(consultas);
    return actualizada;
  }

  /** Avanza el estado de una consulta de forma cíclica. */
  function avanzarEstado(id) {
    const consultas = listar().map((c) =>
      c.id === id ? { ...c, status: SIGUIENTE_ESTADO[c.status] || c.status } : c
    );
    persistir(consultas);
    return consultas;
  }

  /**
   * Agrupa las consultas por fecha (rank) y, dentro de cada grupo, las
   * ordena por hora ascendente formando la cola FIFO numerada.
   * Devuelve [{ date, count, rows: [{ ...consulta, queue }] }].
   */
  function agrupadasPorFecha(filtros = {}) {
    const consultas = filtrar(filtros);
    const ranks = [...new Set(consultas.map((c) => c.rank))].sort((a, b) => a - b);
    return ranks.map((rk) => {
      const rows = consultas
        .filter((c) => c.rank === rk)
        .sort((a, b) => a.time.localeCompare(b.time))
        .map((c, i) => ({ ...c, queue: i + 1 }));
      return { date: rows[0].date, count: rows.length, rows };
    });
  }

  /** Devuelve las consultas asociadas a un usuario (por su id de cuenta). */
  function listarPorUsuario(usuarioId) {
    if (usuarioId == null) return [];
    return listar().filter((c) => c.usuarioId === usuarioId);
  }

  /** Conteo por estado: { pending, confirmed, in_progress, done, cancelado }. */
  function contadores() {
    const acc = { pending: 0, confirmed: 0, in_progress: 0, done: 0, cancelado: 0 };
    listar().forEach((c) => {
      if (Object.prototype.hasOwnProperty.call(acc, c.status)) acc[c.status]++;
    });
    return acc;
  }

  /**
   * Cancela una consulta pendiente: la pasa a estado 'cancelado'.
   * Solo se permite si la consulta existe y está en estado 'pending'.
   * Devuelve la consulta actualizada o null si el id no existe o no
   * cumple la condición.
   */
  function cancelar(id) {
    const consultas = listar();
    const consulta = consultas.find((c) => c.id === id);
    if (!consulta || consulta.status !== 'pending') return null;
    consulta.status = 'cancelado';
    persistir(consultas);
    return consulta;
  }

  return {
    META,
    reservar,
    listar,
    listarPorUsuario,
    confirmar,
    cancelar,
    avanzarEstado,
    filtrar,
    agrupadasPorFecha,
    contadores,
  };
})();
