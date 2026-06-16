/**
 * Módulo de autenticación — rol activo (cliente / administrador).
 *
 * El diseño no incluye inicio de sesión: el rol se determina por la
 * página actual a través del Router. Este módulo expone una interfaz
 * estable para que el resto del código consulte el rol sin acoplarse
 * a los detalles de navegación.
 *
 * Interfaz pública: rolActual, esAdmin, esCliente.
 */
const Auth = (() => {
  function rolActual() {
    return Router.rolActual();
  }

  const esAdmin = () => rolActual() === 'admin';
  const esCliente = () => rolActual() === 'cliente';

  return { rolActual, esAdmin, esCliente };
})();
