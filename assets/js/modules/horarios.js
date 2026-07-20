/**
 * Módulo de horarios — disponibilidad y franjas horarias.
 *
 * Encapsula el catálogo de días y franjas (slots) de la veterinaria y
 * qué franjas están ocupadas. La ocupación se persiste vía Storage, de
 * modo que una reserva del cliente bloquea el bloque también al recargar.
 *
 * Interfaz pública: listarDias, buscarSlot, ocupar.
 */
const Horarios = (() => {
  const CLAVE_OCUPADOS = 'slots-ocupados';

  // Catálogo base de disponibilidad (franjas marcadas como ocupadas de fábrica).
  const DIAS = [
    { key: 'd1', label: 'Hoy', date: 'Lun 16 Jun', rank: 1, slots: [
      { id: 'd1-9',    time: '09:00', baseOcupado: false },
      { id: 'd1-930',  time: '09:30', baseOcupado: true  },
      { id: 'd1-10',   time: '10:00', baseOcupado: false },
      { id: 'd1-1030', time: '10:30', baseOcupado: false },
      { id: 'd1-11',   time: '11:00', baseOcupado: true  },
      { id: 'd1-12',   time: '12:00', baseOcupado: false },
    ]},
    { key: 'd2', label: 'Mañana', date: 'Mar 17 Jun', rank: 2, slots: [
      { id: 'd2-9',    time: '09:00', baseOcupado: false },
      { id: 'd2-10',   time: '10:00', baseOcupado: false },
      { id: 'd2-1030', time: '10:30', baseOcupado: true  },
      { id: 'd2-16',   time: '16:00', baseOcupado: false },
      { id: 'd2-1630', time: '16:30', baseOcupado: false },
      { id: 'd2-17',   time: '17:00', baseOcupado: false },
    ]},
    { key: 'd3', label: 'Miércoles', date: 'Mié 18 Jun', rank: 3, slots: [
      { id: 'd3-11',   time: '11:00', baseOcupado: false },
      { id: 'd3-12',   time: '12:00', baseOcupado: false },
      { id: 'd3-15',   time: '15:00', baseOcupado: true  },
      { id: 'd3-1530', time: '15:30', baseOcupado: false },
      { id: 'd3-16',   time: '16:00', baseOcupado: false },
      { id: 'd3-1730', time: '17:30', baseOcupado: false },
    ]},
  ];

  function ocupados() {
    return Storage.leer(CLAVE_OCUPADOS, []);
  }

  function estaDisponible(slot, reservados) {
    return !slot.baseOcupado && !reservados.includes(slot.id);
  }

  /** Devuelve los días con cada franja resuelta a { id, time, available }. */
  function listarDias() {
    const reservados = ocupados();
    return DIAS.map((d) => ({
      key: d.key, label: d.label, date: d.date, rank: d.rank,
      slots: d.slots.map((sl) => ({
        id: sl.id, time: sl.time, available: estaDisponible(sl, reservados),
      })),
    }));
  }

  /** Localiza una franja por id, devolviendo { day, slot } o null. */
  function buscarSlot(slotId) {
    if (!slotId) return null;
    for (const d of DIAS) {
      const slot = d.slots.find((s) => s.id === slotId);
      if (slot) {
        return {
          day: { key: d.key, label: d.label, date: d.date, rank: d.rank },
          slot: { id: slot.id, time: slot.time },
        };
      }
    }
    return null;
  }

  /** Marca una franja como ocupada de forma persistente. */
  function ocupar(slotId) {
    const reservados = ocupados();
    if (!reservados.includes(slotId)) {
      reservados.push(slotId);
      Storage.guardar(CLAVE_OCUPADOS, reservados);
    }
  }

  /** Libera una franja previamente ocupada (al cancelar una consulta). */
  function desocupar(slotId) {
    if (!slotId) return;
    const reservados = ocupados().filter((id) => id !== slotId);
    Storage.guardar(CLAVE_OCUPADOS, reservados);
  }

  return { listarDias, buscarSlot, ocupar, desocupar };
})();
