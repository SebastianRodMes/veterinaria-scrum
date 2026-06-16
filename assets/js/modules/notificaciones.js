/**
 * Módulo de notificaciones — avisos al cliente sobre su consulta.
 *
 * Al confirmarse una reserva se genera una notificación con la fecha,
 * hora, mascota y motivo (el detalle que muestra el modal de confirmación).
 * Se persisten vía Storage para poder listarlas más adelante.
 *
 * Interfaz pública: crear, listar.
 */
const Notificaciones = (() => {
  const CLAVE = 'notificaciones';

  function listar() {
    return Storage.leer(CLAVE, []);
  }

  /**
   * Crea la notificación de confirmación a partir de una consulta.
   * Devuelve el aviso { date, time, mascota, motivo } para el modal.
   */
  function crear(consulta) {
    const aviso = {
      consultaId: consulta.id,
      date: consulta.date,
      time: consulta.time,
      mascota: consulta.mascota,
      motivo: consulta.motivo,
      leida: false,
    };
    const todas = listar();
    todas.push(aviso);
    Storage.guardar(CLAVE, todas);
    return aviso;
  }

  return { crear, listar };
})();
