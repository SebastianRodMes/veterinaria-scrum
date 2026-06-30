/**
 * Validación de formularios.
 *
 * Interfaz pública:
 *   - validarCita(form, slotId)  → { campo: mensaje, ... }
 *   - validarRegistro(form)      → { campo: mensaje, ... }
 *   - validarLogin(form)         → { campo: mensaje, ... }
 * Cada función devuelve un objeto vacío cuando no hay errores.
 */
const Validacion = (() => {
  const REGEX_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const REGEX_TELEFONO = /^\+?[\d\s-]{8,}$/;
  const LARGO_MIN_PASSWORD = 6;

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

  /**
   * Valida el formulario de registro.
   * `form`: { nombre, email, password, password2, rol }.
   * `password2` (confirmación) es opcional; si viene, debe coincidir.
   * `rol` es opcional; si viene debe ser 'cliente' o 'admin'.
   */
  function validarRegistro(form) {
    const e = {};
    const f = form || {};

    if (!f.nombre || f.nombre.trim().length < 2) {
      e.nombre = 'Ingresa tu nombre';
    }

    if (f.rol != null && f.rol !== 'cliente' && f.rol !== 'admin') {
      e.rol = 'Selecciona un tipo de cuenta válido';
    }

    const email = (f.email || '').trim();
    if (!email) {
      e.email = 'Ingresa tu correo';
    } else if (!REGEX_EMAIL.test(email)) {
      e.email = 'Correo no válido';
    }

    if (!f.password || f.password.length < LARGO_MIN_PASSWORD) {
      e.password = `La contraseña debe tener al menos ${LARGO_MIN_PASSWORD} caracteres`;
    }

    if (f.password2 != null && f.password !== f.password2) {
      e.password2 = 'Las contraseñas no coinciden';
    }

    return e;
  }

  /**
   * Valida el formulario de inicio de sesión.
   * `form`: { email, password }.
   */
  function validarLogin(form) {
    const e = {};
    const f = form || {};

    const email = (f.email || '').trim();
    if (!email) {
      e.email = 'Ingresa tu correo';
    } else if (!REGEX_EMAIL.test(email)) {
      e.email = 'Correo no válido';
    }

    if (!f.password) {
      e.password = 'Ingresa tu contraseña';
    }

    return e;
  }

  return { validarCita, validarRegistro, validarLogin };
})();
