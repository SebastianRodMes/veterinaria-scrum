/**
 * Validación de formularios.
 *
 * Interfaz pública: validarCita(form, slotId) → { campo: mensaje, ... }
 * Devuelve un objeto vacío cuando no hay errores.
 */
const Validacion = (() => {
  const REGEX_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const REGEX_TELEFONO = /^\+?[\d\s-]{8,}$/;

  function validarCita(form, slotId) {
    const e = {};
    const f = form || {};

    if (!f.cliente || f.cliente.trim().length < 2) {
      e.cliente = 'Ingresa el nombre del cliente';
    }

    const contacto = (f.contacto || '').trim();
    if (!contacto) {
      e.contacto = 'Ingresa un email o teléfono';
    } else if (!REGEX_EMAIL.test(contacto) && !REGEX_TELEFONO.test(contacto)) {
      e.contacto = 'Formato de email o teléfono no válido';
    }

    if (!f.mascota || f.mascota.trim().length < 1) {
      e.mascota = 'Ingresa el nombre de la mascota';
    }

    if (!f.motivo) {
      e.motivo = 'Selecciona un motivo';
    }

    if (!slotId) {
      e.slot = 'Selecciona un horario disponible en el calendario';
    }

    return e;
  }

  return { validarCita };
})();
