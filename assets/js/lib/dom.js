/**
 * Helpers de manipulación del DOM.
 *
 * Interfaz principal:
 *   DOM.sel
 *   DOM.selTodos
 *   DOM.montar
 *   DOM.escapar
 *   DOM.delegar
 *   DOM.crear
 *   DOM.modal
 *
 * Compatibilidad global:
 *   $
 *   $$
 *   crear
 *   modal
 */
const DOM = (() => {
  'use strict';

  /**
   * Devuelve el primer elemento que coincide con el selector.
   */
  function sel(selector, raiz = document) {
    return raiz.querySelector(selector);
  }

  /**
   * Devuelve todos los elementos que coinciden
   * con el selector como arreglo.
   */
  function selTodos(selector, raiz = document) {
    return Array.from(
      raiz.querySelectorAll(selector)
    );
  }

  /**
   * Reemplaza el contenido de un nodo con HTML.
   *
   * contenedor puede ser:
   *   - Un selector.
   *   - Un elemento del DOM.
   */
  function montar(contenedor, html) {
    const nodo =
      typeof contenedor === 'string'
        ? sel(contenedor)
        : contenedor;

    if (nodo) {
      nodo.innerHTML = html;
    }

    return nodo;
  }

  /**
   * Escapa texto para interpolarlo de forma segura
   * dentro de una plantilla HTML.
   */
  function escapar(texto) {
    return String(texto ?? '').replace(
      /[&<>"']/g,
      (caracter) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[caracter])
    );
  }

  /**
   * Delegación de eventos.
   *
   * Escucha el evento en la raíz y ejecuta handler
   * cuando el elemento objetivo coincide con el selector.
   */
  function delegar(
    raiz,
    tipo,
    selector,
    handler
  ) {
    if (!raiz) {
      return;
    }

    raiz.addEventListener(
      tipo,
      (evento) => {
        const target = evento.target;

        if (!(target instanceof Element)) {
          return;
        }

        const objetivo =
          target.closest(selector);

        if (
          objetivo &&
          raiz.contains(objetivo)
        ) {
          handler(evento, objetivo);
        }
      }
    );
  }

  /**
   * Crea un elemento HTML.
   *
   * attrs admite:
   *   - className
   *   - dataset
   *   - style como objeto
   *   - eventos con prefijo "on"
   *   - propiedades comunes como value, checked, disabled
   *   - cualquier otro atributo HTML
   *
   * hijos puede contener:
   *   - Texto.
   *   - Nodos.
   *   - Números.
   *   - Arreglos de hijos.
   *   - null o undefined.
   */
  function crear(
    tag,
    attrs = {},
    hijos = []
  ) {
    const elemento =
      document.createElement(tag);

    Object.entries(attrs).forEach(
      ([clave, valor]) => {
        if (
          valor === null ||
          valor === undefined ||
          valor === false
        ) {
          return;
        }

        if (clave === 'className') {
          elemento.className =
            String(valor);

          return;
        }

        if (clave === 'dataset') {
          Object.entries(valor || {}).forEach(
            ([nombre, dato]) => {
              elemento.dataset[nombre] =
                String(dato);
            }
          );

          return;
        }

        if (
          clave === 'style' &&
          typeof valor === 'object'
        ) {
          Object.assign(
            elemento.style,
            valor
          );

          return;
        }

        if (
          clave.startsWith('on') &&
          typeof valor === 'function'
        ) {
          elemento.addEventListener(
            clave.slice(2).toLowerCase(),
            valor
          );

          return;
        }

        if (
          clave in elemento &&
          ![
            'list',
            'form',
            'type',
          ].includes(clave)
        ) {
          try {
            elemento[clave] = valor;
            return;
          } catch (_) {
            // Si no se puede asignar como propiedad,
            // se intenta como atributo.
          }
        }

        if (valor === true) {
          elemento.setAttribute(
            clave,
            ''
          );

          return;
        }

        elemento.setAttribute(
          clave,
          String(valor)
        );
      }
    );

    function agregarHijo(hijo) {
      if (
        hijo === null ||
        hijo === undefined ||
        hijo === false
      ) {
        return;
      }

      if (Array.isArray(hijo)) {
        hijo.forEach(agregarHijo);
        return;
      }

      if (hijo instanceof Node) {
        elemento.appendChild(hijo);
        return;
      }

      elemento.appendChild(
        document.createTextNode(
          String(hijo)
        )
      );
    }

    agregarHijo(hijos);

    return elemento;
  }

  /**
   * Crea y muestra un modal.
   *
   * contenido puede ser:
   *   - Un nodo del DOM.
   *   - Texto.
   *   - HTML si usarHTML es true.
   *
   * Devuelve:
   * {
   *   cerrar,
   *   overlay,
   *   contenido
   * }
   */
  function modal(
    titulo,
    contenido,
    opciones = {}
  ) {
    const {
      usarHTML = false,
      cerrarAlFondo = true,
      claseModal = '',
    } = opciones;

    const cuerpo =
      crear(
        'div',
        {
          className: 'modal-body',
        }
      );

    if (contenido instanceof Node) {
      cuerpo.appendChild(contenido);
    } else if (usarHTML) {
      cuerpo.innerHTML =
        String(contenido || '');
    } else {
      cuerpo.textContent =
        String(contenido || '');
    }

    const overlay =
      crear(
        'div',
        {
          className: 'modal-overlay',
        }
      );

    const ventana =
      crear(
        'div',
        {
          className:
            `modal ${claseModal}`.trim(),

          role: 'dialog',

          'aria-modal': 'true',

          'aria-label':
            String(titulo || 'Ventana modal'),
        },
        [
          crear(
            'div',
            {
              className: 'modal-header',
            },
            [
              crear(
                'h3',
                {},
                [
                  String(titulo || ''),
                ]
              ),

              crear(
                'button',
                {
                  type: 'button',
                  className: 'modal-cerrar',
                  'aria-label': 'Cerrar modal',
                  onClick: () => cerrar(),
                },
                ['×']
              ),
            ]
          ),

          cuerpo,
        ]
      );

    overlay.appendChild(ventana);

    function cerrar() {
      document.removeEventListener(
        'keydown',
        manejarEscape
      );

      overlay.remove();
    }

    function manejarEscape(evento) {
      if (evento.key === 'Escape') {
        cerrar();
      }
    }

    if (cerrarAlFondo) {
      overlay.addEventListener(
        'click',
        (evento) => {
          if (evento.target === overlay) {
            cerrar();
          }
        }
      );
    }

    document.addEventListener(
      'keydown',
      manejarEscape
    );

    document.body.appendChild(
      overlay
    );

    const botonCerrar =
      ventana.querySelector(
        '.modal-cerrar'
      );

    if (botonCerrar) {
      botonCerrar.focus();
    }

    return {
      cerrar,
      overlay,
      contenido: cuerpo,
    };
  }

  return {
    sel,
    selTodos,
    montar,
    escapar,
    delegar,
    crear,
    modal,
  };
})();

/* ============================================================
   Alias globales para compatibilidad con la otra rama
   ============================================================ */

/**
 * Equivalente a document.querySelector.
 */
function $(selector, raiz = document) {
  return DOM.sel(selector, raiz);
}

/**
 * Equivalente a document.querySelectorAll,
 * pero devuelve un arreglo.
 */
function $$(selector, raiz = document) {
  return DOM.selTodos(selector, raiz);
}

/**
 * Alias global de DOM.crear.
 */
function crear(tag, attrs = {}, hijos = []) {
  return DOM.crear(
    tag,
    attrs,
    hijos
  );
}

/**
 * Alias global de DOM.modal.
 */
function modal(
  titulo,
  contenido,
  opciones = {}
) {
  return DOM.modal(
    titulo,
    contenido,
    opciones
  );
}