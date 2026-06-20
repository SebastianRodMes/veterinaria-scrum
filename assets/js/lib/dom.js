/**
 * Helpers de manipulación del DOM.
 *
 * Interfaz pública: sel, selTodos, montar, escapar, delegar.
 */
const DOM = (() => {
  const sel = (selector, raiz = document) => raiz.querySelector(selector);
  const selTodos = (selector, raiz = document) => Array.from(raiz.querySelectorAll(selector));

  /** Reemplaza el contenido de un nodo con HTML. */
  function montar(contenedor, html) {
    const nodo = typeof contenedor === 'string' ? sel(contenedor) : contenedor;
    if (nodo) nodo.innerHTML = html;
    return nodo;
  }

  /** Escapa texto para interpolarlo de forma segura en HTML. */
  function escapar(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  /**
   * Delegación de eventos: escucha en `raiz` y dispara `handler`
   * cuando el target coincide con `selector` (vía atributo data).
   */
  function delegar(raiz, tipo, selector, handler) {
    raiz.addEventListener(tipo, (e) => {
      const objetivo = e.target.closest(selector);
      if (objetivo && raiz.contains(objetivo)) handler(e, objetivo);
    });
  }

  return { sel, selTodos, montar, escapar, delegar };
})();
