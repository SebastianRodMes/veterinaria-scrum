/**
 * Módulo de consultas — CRUD, estados y transiciones.
 *
 * Una consulta es la cita agendada por un cliente para su mascota.
 * Estados: pending → in_progress → done (cíclico desde el panel admin).
 * Se persiste vía Storage; sembrado inicial la primera vez.
 *
 * Interfaz pública: META, reservar, listar, avanzarEstado,
 *                   agrupadasPorFecha, contadores.
 */
const Consultas = (() => {
  const CLAVE = 'consultas';
  const CLAVE_SEMBRADO = 'consultas-sembradas';

  // Metadatos de presentación por estado (etiqueta + clase CSS del badge).
  const META = {
    pending:     { label: 'Pendiente',   clase: 'pending' },
    in_progress: { label: 'En progreso', clase: 'in_progress' },
    done:        { label: 'Atendida',    clase: 'done' },
  };

  const SIGUIENTE_ESTADO = { pending: 'in_progress', in_progress: 'done', done: 'pending' };

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

  function listar() {
    asegurarSembrado();
    return Storage.leer(CLAVE, []);
  }

  function persistir(consultas) {
    Storage.guardar(CLAVE, consultas);
  }

  /**
   * Crea una consulta pendiente.
   * `datos`: { cliente, contacto, mascota, motivo, day, slot }
   * Devuelve la consulta creada.
   */
  function reservar({ cliente, contacto, mascota, motivo, day, slot }) {
    const consultas = listar();
    const nueva = {
      id: Date.now(),
      date: day.date,
      rank: day.rank,
      time: slot.time,
      cliente: (cliente || '').trim(),
      contacto: (contacto || '').trim(),
      mascota: (mascota || '').trim(),
      motivo,
      status: 'pending',
    };
    consultas.push(nueva);
    persistir(consultas);
    return nueva;
  }

  /** Avanza el estado de una consulta de forma cíclica. */
  function avanzarEstado(id) {
    const consultas = listar().map((c) =>
      c.id === id ? { ...c, status: SIGUIENTE_ESTADO[c.status] } : c
    );
    persistir(consultas);
    return consultas;
  }

  /**
   * Agrupa las consultas por fecha (rank) y, dentro de cada grupo, las
   * ordena por hora ascendente formando la cola FIFO numerada.
   * Devuelve [{ date, count, rows: [{ ...consulta, queue }] }].
   */
  function agrupadasPorFecha() {
    const consultas = listar();
    const ranks = [...new Set(consultas.map((c) => c.rank))].sort((a, b) => a - b);
    return ranks.map((rk) => {
      const rows = consultas
        .filter((c) => c.rank === rk)
        .sort((a, b) => a.time.localeCompare(b.time))
        .map((c, i) => ({ ...c, queue: i + 1 }));
      return { date: rows[0].date, count: rows.length, rows };
    });
  }

  /** Conteo por estado: { pending, in_progress, done }. */
  function contadores() {
    const acc = { pending: 0, in_progress: 0, done: 0 };
    listar().forEach((c) => { acc[c.status]++; });
    return acc;
  }

  return { META, reservar, listar, avanzarEstado, agrupadasPorFecha, contadores };
})();
