/**
 * Navegación cliente-side simple entre vistas dentro de cada rol.
 *
 * El conmutador Cliente/Admin alterna entre las dos páginas del sitio
 * (index.html y admin.html). El rol activo se deriva de la página actual,
 * declarado en `<body data-rol="...">`.
 *
 * Interfaz pública: rolActual, irACliente, irAAdmin.
 */
const Router = (() => {
  function rolActual() {
    return document.body.getAttribute('data-rol') || 'cliente';
  }

  function irACliente() {
    if (rolActual() !== 'cliente') location.href = 'index.html';
  }

  function irAAdmin() {
    if (rolActual() !== 'admin') location.href = 'admin.html';
  }

  return { rolActual, irACliente, irAAdmin };
})();
