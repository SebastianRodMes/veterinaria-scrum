/**
 * Módulo de autenticación — rol activo y cuentas de cliente.
 *
 * Dos responsabilidades:
 *   1. Rol activo (cliente / administrador): se determina por la página
 *      actual a través del Router. El resto del código consulta el rol
 *      sin acoplarse a los detalles de navegación.
 *   2. Cuentas de cliente: registro e inicio de sesión con correo y
 *      contraseña. Los usuarios y la sesión activa se persisten vía
 *      Storage; las citas se asocian a la cuenta a través del id del
 *      usuario que inició sesión.
 *
 * Nota: app sin backend; las contraseñas se guardan en localStorage en
 * texto plano. No es un esquema seguro, solo cumple el alcance del demo.
 *
 * Interfaz pública: rolActual, esAdmin, esCliente,
 *                   registrar, iniciarSesion, cerrarSesion,
 *                   usuarioActual, sesionActiva, rolUsuario.
 */
const Auth = (() => {
  const CLAVE_USUARIOS = 'usuarios';
  const CLAVE_SESION = 'sesion';
  const ROLES = ['cliente', 'admin'];
  const ROL_DEFECTO = 'cliente';

  /* ===================== Rol activo ===================== */

  function rolActual() {
    return Router.rolActual();
  }

  const esAdmin = () => rolActual() === 'admin';
  const esCliente = () => rolActual() === 'cliente';

  /* ===================== Cuentas de cliente ===================== */

  function listarUsuarios() {
    return Storage.leer(CLAVE_USUARIOS, []);
  }

  function normalizarEmail(email) {
    return (email || '').trim().toLowerCase();
  }

  function buscarPorEmail(email) {
    const correo = normalizarEmail(email);
    return listarUsuarios().find((u) => u.email === correo) || null;
  }

  function normalizarRol(rol) {
    return ROLES.indexOf(rol) !== -1 ? rol : ROL_DEFECTO;
  }

  /**
   * Registra una cuenta nueva. El correo es único (no distingue mayúsculas).
   * `datos`: { nombre, email, password, rol }.
   * `rol` es 'cliente' o 'admin' (default 'cliente').
   * Devuelve { ok: true, usuario } o { ok: false, error }.
   */
  function registrar({ nombre, email, password, rol } = {}) {
    const correo = normalizarEmail(email);
    if (buscarPorEmail(correo)) {
      return { ok: false, error: 'Ya existe una cuenta con ese correo' };
    }
    const usuario = {
      id: Date.now(),
      nombre: (nombre || '').trim(),
      email: correo,
      password: password || '',
      rol: normalizarRol(rol),
    };
    const usuarios = listarUsuarios();
    usuarios.push(usuario);
    Storage.guardar(CLAVE_USUARIOS, usuarios);
    return { ok: true, usuario };
  }

  /**
   * Valida credenciales y, si son correctas, guarda la sesión activa.
   * Devuelve { ok: true, usuario } o { ok: false, error }.
   */
  function iniciarSesion(email, password) {
    const usuario = buscarPorEmail(email);
    if (!usuario || usuario.password !== (password || '')) {
      return { ok: false, error: 'Correo o contraseña incorrectos' };
    }
    Storage.guardar(CLAVE_SESION, usuario.id);
    return { ok: true, usuario };
  }

  /** Cierra la sesión activa. */
  function cerrarSesion() {
    Storage.eliminar(CLAVE_SESION);
  }

  /** Devuelve el usuario de la sesión activa, o null si no hay sesión. */
  function usuarioActual() {
    const id = Storage.leer(CLAVE_SESION, null);
    if (id == null) return null;
    return listarUsuarios().find((u) => u.id === id) || null;
  }

  const sesionActiva = () => usuarioActual() !== null;

  /**
   * Rol de la cuenta con sesión activa ('cliente' o 'admin').
   * Cae a 'cliente' si no hay sesión o si el usuario no tiene rol guardado.
   */
  function rolUsuario() {
    const u = usuarioActual();
    return u ? normalizarRol(u.rol) : ROL_DEFECTO;
  }

  return {
    rolActual, esAdmin, esCliente,
    registrar, iniciarSesion, cerrarSesion, usuarioActual, sesionActiva, rolUsuario,
  };
})();
