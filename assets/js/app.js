/**
 * Punto de entrada — inicializa la aplicación y renderiza la vista
 * correspondiente al rol activo (cliente / admin).
 *
 * La presentación vive aquí (templates + wiring de eventos); la lógica de
 * dominio queda en los módulos de `modules/` y la persistencia en `lib/storage.js`.
 */
(() => {
  'use strict';

  const CLINICA = 'Pet App';

  const TOKENS = [
    { var: '--color-primario', hex: '#0077b6' },
    { var: '--color-acento', hex: '#00b4d8' },
    { var: '--color-profundo', hex: '#03045e' },
    { var: '--estado-pendiente', hex: '#f0a500' },
    { var: '--estado-progreso', hex: '#00b4d8' },
    { var: '--estado-done', hex: '#16a34a' },
    { var: '--estado-cancelado', hex: '#ef4444' },
  ];

  const MOTIVOS = [
    'Consulta general',
    'Vacunación',
    'Control',
    'Emergencia',
    'Estética',
    'Cirugía',
  ];

  const FILTROS_CONSULTAS = [
    { estado: 'all', label: 'Todas' },
    { estado: 'pending', label: 'Pendientes' },
    { estado: 'in_progress', label: 'En Curso' },
    { estado: 'done', label: 'Completadas' },
    { estado: 'cancelado', label: 'Canceladas' },
  ];

  const e = DOM.escapar;

  /* ============================================================
     Estado de la vista cliente
     ============================================================ */

  const estado = {
    selectedSlotId: null,

    form: {
      cliente: '',
      contacto: '',
      mascota: '',
      motivo: '',
    },

    errors: {},

    modalOpen: false,
    modalData: null,

    tracking: {
      aviso: null,
    },

    resena: {
      consultaId: null,
      calificacion: 0,
      comentario: '',
      error: null,
    },

    requiereLogin: false,
  };

  /* ============================================================
     Estado de la vista administrador
     ============================================================ */

  const estadoAdmin = {
    confirmId: null,
    exito: null,
    filtroEstado: 'all',
    busqueda: '',
  };

  /* ============================================================
     Plantillas compartidas
     ============================================================ */

  function tplHeader() {
    return `
      <div class="contenedor app-header__inner">
        <div class="marca">
          <div class="logo">
            <span class="logo__almohadilla"></span>
            <span class="logo__dedo logo__dedo--1"></span>
            <span class="logo__dedo logo__dedo--2"></span>
            <span class="logo__dedo logo__dedo--3"></span>
          </div>

          <div class="marca__texto">
            <div class="marca__nombre">${e(CLINICA)}</div>
            <div class="marca__sub">
              Gestión de citas veterinarias
            </div>
          </div>
        </div>

        <div class="app-header__acciones">
          ${tplTema()}
          ${tplCuenta()}
        </div>
      </div>
    `;
  }

  /**
   * Botón para alternar el tema claro y oscuro.
   */
  function tplTema() {
    const oscuro = Tema.esOscuro();

    return `
      <button
        type="button"
        class="tema-toggle"
        data-tema-toggle
        aria-pressed="${oscuro}"
        title="${oscuro
          ? 'Cambiar a tema claro'
          : 'Cambiar a tema oscuro'}"
        aria-label="${oscuro
          ? 'Cambiar a tema claro'
          : 'Cambiar a tema oscuro'}"
      >
        ${oscuro ? '☀️' : '🌙'}
      </button>
    `;
  }

  /**
   * Información de la cuenta activa en el encabezado.
   */
  function tplCuenta() {
    const usuario = Auth.usuarioActual();

    if (Auth.esAdmin()) {
      if (!usuario) {
        return '';
      }

      return `
        <div class="cuenta-sesion">
          <span
            class="cuenta-sesion__nombre"
            title="${e(usuario.email)}"
          >
            👤 ${e(usuario.nombre || usuario.email)}
          </span>

          <span class="cuenta-sesion__rol">
            Administrador
          </span>

          <button
            type="button"
            class="cuenta-sesion__salir"
            data-cerrar-sesion
          >
            Cerrar sesión
          </button>
        </div>
      `;
    }

    if (!Auth.esCliente()) {
      return '';
    }

    if (usuario) {
      return `
        <div class="cuenta-sesion">
          <span
            class="cuenta-sesion__nombre"
            title="${e(usuario.email)}"
          >
            👤 ${e(usuario.nombre || usuario.email)}
          </span>

          <button
            type="button"
            class="cuenta-sesion__salir"
            data-cerrar-sesion
          >
            Cerrar sesión
          </button>
        </div>
      `;
    }

    return `
      <button
        type="button"
        class="cuenta-sesion__entrar"
        data-ir-cuenta
      >
        Iniciar sesión
      </button>
    `;
  }

  /**
   * Muestra los colores principales del sistema.
   */
  function tplTokens() {
    const items = TOKENS.map((token) => `
      <div class="token">
        <span
          class="token__swatch"
          style="background:${token.hex}"
        ></span>

        <div style="line-height:1.3;min-width:0;">
          <div class="token__nombre">
            ${e(token.var)}
          </div>

          <div class="token__hex">
            ${e(token.hex)}
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="contenedor">
        <div class="tokens">
          <div class="tokens__titulo">
            Sistema de color · variables de diseño
          </div>

          <div class="tokens__grid">
            ${items}
          </div>
        </div>
      </div>
    `;
  }

  /* ============================================================
     Vista del cliente
     ============================================================ */

  function tplSlot(slot) {
    let clase = 'slot slot--libre';

    if (!slot.available) {
      clase = 'slot slot--ocupado';
    } else if (slot.id === estado.selectedSlotId) {
      clase = 'slot slot--sel';
    }

    const atributo = slot.available
      ? `data-slot="${slot.id}"`
      : '';

    return `
      <button
        type="button"
        class="${clase}"
        ${atributo}
      >
        ${e(slot.time)}
      </button>
    `;
  }

  function tplHorarios() {
    const dias = Horarios.listarDias()
      .map((dia) => `
        <div class="dia">
          <div class="dia__head">
            <span class="dia__label">
              ${e(dia.label)}
            </span>

            <span class="dia__fecha">
              ${e(dia.date)}
            </span>
          </div>

          <div class="dia__slots">
            ${dia.slots.map(tplSlot).join('')}
          </div>
        </div>
      `)
      .join('');

    return `
      <section class="card horarios">
        <div class="seccion-head">
          <div>
            <h2 class="card__titulo">
              Horarios disponibles
            </h2>

            <p class="card__sub">
              Selecciona un bloque libre para agendar tu cita
            </p>
          </div>

          <div class="leyenda">
            <span>
              <i class="libre"></i>
              Libre
            </span>

            <span>
              <i class="sel"></i>
              Seleccionado
            </span>

            <span>
              <i class="ocupado"></i>
              Ocupado
            </span>
          </div>
        </div>

        <div class="dias-grid">
          ${dias}
        </div>
      </section>
    `;
  }

  function tplCampoError(campo) {
    const mensaje = estado.errors[campo];

    if (!mensaje) {
      return '';
    }

    return `
      <div
        class="campo__error"
        data-error-de="${campo}"
      >
        ⚠ ${e(mensaje)}
      </div>
    `;
  }

  function claseInput(campo) {
    return estado.errors[campo]
      ? 'campo__control campo__control--error'
      : 'campo__control';
  }

  function tplFormulario() {
    const formulario = estado.form;

    const opciones = [
      '<option value="">Selecciona…</option>',
      ...MOTIVOS.map((motivo) => `
        <option
          value="${e(motivo)}"
          ${formulario.motivo === motivo ? 'selected' : ''}
        >
          ${e(motivo)}
        </option>
      `),
    ].join('');

    const errorSlot = estado.errors.slot
      ? `
        <div
          class="alerta-slot"
          data-error-de="slot"
        >
          ⚠ ${e(estado.errors.slot)}
        </div>
      `
      : '';

    const avisoLogin = estado.requiereLogin
      ? `
        <div class="alerta-login">
          🔒 Debes iniciar sesión para agendar tu cita.

          <button
            type="button"
            class="cuenta-enlace"
            data-ir-cuenta
          >
            Iniciar sesión
          </button>
        </div>
      `
      : '';

    return `
      <div class="card">
        <h2 class="card__titulo">
          Datos de la cita
        </h2>

        <p class="card__sub">
          Completa la información del cliente y la mascota
        </p>

        <div class="cita-form__campos">
          <div class="campo">
            <label class="campo__label">
              Nombre del cliente
            </label>

            <input
              class="${claseInput('cliente')}"
              data-campo="cliente"
              value="${e(formulario.cliente)}"
              placeholder="Ej. María López"
            >

            ${tplCampoError('cliente')}
          </div>

          <div class="campo">
            <label class="campo__label">
              Email o teléfono
            </label>

            <input
              class="${claseInput('contacto')}"
              data-campo="contacto"
              value="${e(formulario.contacto)}"
              placeholder="correo@ejemplo.com · +506 8888 8888"
            >

            ${tplCampoError('contacto')}
          </div>

          <div class="cita-form__doble">
            <div class="campo">
              <label class="campo__label">
                Nombre de la mascota
              </label>

              <input
                class="${claseInput('mascota')}"
                data-campo="mascota"
                value="${e(formulario.mascota)}"
                placeholder="Ej. Toby"
              >

              ${tplCampoError('mascota')}
            </div>

            <div class="campo">
              <label class="campo__label">
                Motivo
              </label>

              <select
                class="${claseInput('motivo')}"
                data-campo="motivo"
              >
                ${opciones}
              </select>

              ${tplCampoError('motivo')}
            </div>
          </div>

          ${errorSlot}
          ${avisoLogin}

          <button
            type="button"
            class="btn-primario"
            data-submit
          >
            Confirmar cita
          </button>
        </div>
      </div>
    `;
  }

  function textoHorario() {
    const seleccionado = Horarios.buscarSlot(
      estado.selectedSlotId
    );

    return seleccionado
      ? `${seleccionado.day.label} · ${seleccionado.slot.time}`
      : 'Sin seleccionar';
  }

  function tplResumen() {
    const item = (icono, rotulo, valor, id) => `
      <div class="resumen__item">
        <div class="resumen__icono">
          ${icono}
        </div>

        <div>
          <div class="resumen__rotulo">
            ${rotulo}
          </div>

          <div
            class="resumen__valor"
            id="${id}"
          >
            ${e(valor)}
          </div>
        </div>
      </div>
    `;

    return `
      <div class="resumen">
        <div class="resumen__blob resumen__blob--1"></div>
        <div class="resumen__blob resumen__blob--2"></div>

        <div class="resumen__inner">
          <div class="resumen__eyebrow">
            RESUMEN DE TU RESERVA
          </div>

          <div class="resumen__lista">
            ${item(
              '🗓️',
              'Horario seleccionado',
              textoHorario(),
              'resumen-horario'
            )}

            ${item(
              '🐶',
              'Mascota',
              estado.form.mascota.trim() || '—',
              'resumen-mascota'
            )}

            ${item(
              '🩺',
              'Motivo',
              estado.form.motivo || '—',
              'resumen-motivo'
            )}
          </div>

          <div class="resumen__nota">
            Recibirás un recordatorio antes de tu cita.
            Recuerda llegar 10 minutos antes.
          </div>
        </div>
      </div>
    `;
  }

  function tplHero() {
    return `
      <section class="hero">
        <div>
          <div class="pill">
            🐾 RESERVA EN LÍNEA
          </div>

          <h1 class="hero__titulo">
            Agenda la cita de<br>
            tu mascota en minutos
          </h1>

          <p class="hero__texto">
            Consulta los horarios disponibles del veterinario,
            elige el bloque que prefieras y confirma tu cita al instante.
          </p>

          <div class="hero__stats">
            <div>
              <div class="hero__stat-num">
                +12k
              </div>

              <div class="hero__stat-lbl">
                mascotas atendidas
              </div>
            </div>

            <div class="hero__sep"></div>

            <div>
              <div class="hero__stat-num">
                4.9★
              </div>

              <div class="hero__stat-lbl">
                satisfacción
              </div>
            </div>
          </div>
        </div>

        <div class="hero__art">
          <div class="hero__circulo"></div>
          <div class="hero__floty hero__floty--1"></div>
          <div class="hero__floty hero__floty--2"></div>
          <div class="hero__floty hero__floty--3"></div>

          <div class="hero__huella">
            <span class="palma"></span>
            <span class="dedo dedo--1"></span>
            <span class="dedo dedo--2"></span>
            <span class="dedo dedo--3"></span>
            <span class="dedo dedo--4"></span>
          </div>
        </div>
      </section>
    `;
  }

  /**
 * Determina si la aplicación está mostrando la página principal.
 *
 * Esto evita mostrar los testimonios en cuenta.html.
 */
function esPaginaInicio() {
  const archivoActual = location.pathname
    .split('/')
    .pop()
    .toLowerCase();

  return archivoActual === '' || archivoActual === 'index.html';
}

/**
 * Convierte la fecha ISO de una reseña en una fecha legible.
 */
function formatearFechaTestimonio(valor) {
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('es-CR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(fecha);
}

/**
 * Genera cinco estrellas de lectura.
 */
function tplEstrellasTestimonio(calificacion) {
  const cantidad = Number(calificacion) || 0;

  return [1, 2, 3, 4, 5]
    .map((valor) => `
      <span
        class="testimonio__estrella${
          valor <= cantidad
            ? ' testimonio__estrella--activa'
            : ''
        }"
        aria-hidden="true"
      >
        ★
      </span>
    `)
    .join('');
}

/**
 * Tarjeta individual de una reseña publicada.
 */
function tplTarjetaTestimonio(resena) {
  const fecha = formatearFechaTestimonio(resena.fecha);

  return `
    <article class="testimonio-card">
      <div class="testimonio-card__head">
        <div
          class="testimonio__estrellas"
          aria-label="${resena.calificacion} de 5 estrellas"
        >
          ${tplEstrellasTestimonio(resena.calificacion)}
        </div>

        <span class="testimonio-card__calificacion">
          ${e(String(resena.calificacion))}.0
        </span>
      </div>

      <blockquote class="testimonio-card__comentario">
        “${e(resena.comentario)}”
      </blockquote>

      <div class="testimonio-card__persona">
        <div class="testimonio-card__avatar">
          🐾
        </div>

        <div>
          <div class="testimonio-card__cliente">
            ${e(resena.cliente || 'Cliente')}
          </div>

          <div class="testimonio-card__detalle">
            Mascota: ${e(resena.mascota || 'No indicada')}
          </div>
        </div>
      </div>

      ${
        fecha
          ? `
            <div class="testimonio-card__fecha">
              ${e(fecha)}
            </div>
          `
          : ''
      }
    </article>
  `;
}

/**
 * Sección pública de opiniones.
 *
 * Solo muestra reseñas publicadas y limita la vista
 * a las seis más recientes.
 */
  function tplTestimonios() {
    const resenas = Resenas
      .listarAprobadas()
      .slice(0, 6);

    /*
    * Si todavía no existen reseñas, la sección no aparece.
    */
    if (!resenas.length) {
      return '';
    }

    const promedio = Resenas.promedioAprobadas();
    const cantidad = Resenas.listarAprobadas().length;

    const etiquetaCantidad =
      cantidad === 1
        ? '1 reseña publicada'
        : `${cantidad} reseñas publicadas`;

    return `
      <section class="testimonios">
        <div class="testimonios__head">
          <div>
            <div class="pill">
              ⭐ EXPERIENCIAS REALES
            </div>

            <h2 class="testimonios__titulo">
              Opiniones de nuestros clientes
            </h2>

            <p class="testimonios__sub">
              Conoce la experiencia de otros dueños
              y sus mascotas en nuestra veterinaria.
            </p>
          </div>

          <div class="testimonios__resumen">
            <div class="testimonios__promedio">
              ${e(promedio.toFixed(1))}
              <span>★</span>
            </div>

            <div class="testimonios__cantidad">
              ${e(etiquetaCantidad)}
            </div>
          </div>
        </div>

        <div class="testimonios__grid">
          ${resenas.map(tplTarjetaTestimonio).join('')}
        </div>
      </section>
    `;
  }

  /* ============================================================
     Modales del cliente
     ============================================================ */

  function tplModal() {
    if (!estado.modalOpen || !estado.modalData) {
      return '';
    }

    const modal = estado.modalData;

    /* ------------------------------------------------------------
       Modal para crear una reseña
       ------------------------------------------------------------ */

    if (modal.tipo === 'resena_formulario') {
      const consulta = modal.cita;

      const estrellas = [1, 2, 3, 4, 5]
        .map((valor) => {
          const activa =
            valor <= estado.resena.calificacion;

          return `
            <button
              type="button"
              class="resena-estrella${
                activa
                  ? ' resena-estrella--activa'
                  : ''
              }"
              data-resena-estrella="${valor}"
              aria-label="${valor} estrella${
                valor === 1 ? '' : 's'
              }"
              aria-pressed="${activa}"
            >
              ★
            </button>
          `;
        })
        .join('');

      const error = estado.resena.error
        ? `
          <div
            class="resena-error"
            role="alert"
          >
            ⚠ ${e(estado.resena.error)}
          </div>
        `
        : '';

      return `
        <div
          class="modal-overlay"
          data-cerrar-modal
        >
          <div
            class="modal modal--form modal--resena"
            data-stop
          >
            <div class="modal__blob"></div>

            <div style="position:relative;">
              <h3 class="modal__titulo">
                Calificar servicio
              </h3>

              <p class="modal__texto">
                Comparte cómo fue la atención recibida
                por tu mascota.
              </p>

              <div class="modal__detalle resena-consulta">
                <div class="modal__fila">
                  <dt>🐾 Mascota</dt>
                  <dd>${e(consulta.mascota)}</dd>
                </div>

                <div class="modal__fila">
                  <dt>🩺 Motivo</dt>
                  <dd>${e(consulta.motivo)}</dd>
                </div>
              </div>

              <div class="resena-form">
                <div class="campo">
                  <span class="campo__label">
                    Calificación
                  </span>

                  <div
                    class="resena-estrellas"
                    role="group"
                    aria-label="Seleccionar calificación"
                  >
                    ${estrellas}
                  </div>
                </div>

                <div class="campo">
                  <label
                    class="campo__label"
                    for="comentario-resena"
                  >
                    Comentario
                  </label>

                  <textarea
                    id="comentario-resena"
                    class="campo__control resena-textarea"
                    data-resena-comentario
                    maxlength="${Resenas.MAX_COMENTARIO}"
                    placeholder="Escribe un comentario breve sobre la atención..."
                  >${e(estado.resena.comentario)}</textarea>

                  <div class="resena-contador">
                    <span data-resena-contador>
                      ${estado.resena.comentario.length}
                    </span>
                    /${Resenas.MAX_COMENTARIO}
                  </div>
                </div>

                ${error}
              </div>

              <button
                type="button"
                class="btn-primario"
                style="margin-top:18px;"
                data-enviar-resena
              >
                Enviar reseña
              </button>

              <button
                type="button"
                class="btn-secundario"
                data-cerrar-modal
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      `;
    }

    /* ------------------------------------------------------------
       Modal de reseña enviada correctamente
       ------------------------------------------------------------ */

    if (modal.tipo === 'resena_exito') {
      return `
        <div
          class="modal-overlay"
          data-cerrar-modal
        >
          <div
            class="modal"
            data-stop
          >
            <div class="modal__blob"></div>

            <div style="position:relative;">
              <div class="modal__check">
                ✓
              </div>

              <h3 class="modal__titulo">
                ¡Gracias por tu reseña!
              </h3>

              <p class="modal__texto">
                 Tu opinión fue publicada correctamente
                 y ya puede mostrarse como testimonio.
              </p>

              <button
                type="button"
                class="btn-primario btn-primario--plano"
                data-cerrar-modal
              >
                Entendido, cerrar
              </button>
            </div>
          </div>
        </div>
      `;
    }

    /* ------------------------------------------------------------
       Confirmación para cancelar una cita
       ------------------------------------------------------------ */

    if (modal.tipo === 'confirmar_cancelacion') {
      return `
        <div
          class="modal-overlay"
          data-cerrar-modal
        >
          <div
            class="modal"
            data-stop
          >
            <div
              class="modal__blob"
              style="
                background:
                linear-gradient(
                  135deg,
                  #fbbf24,
                  #d97706
                );
              "
            ></div>

            <div style="position:relative;">
              <div
                class="modal__check"
                style="color:#fbbf24;"
              >
                ⚠️
              </div>

              <h3 class="modal__titulo">
                ¿Cancelar cita?
              </h3>

              <p class="modal__texto">
                ¿Estás seguro de que deseas cancelar
                esta cita? Esta acción no se puede deshacer.
              </p>

              <div
                style="
                  display:flex;
                  gap:10px;
                  margin-top:22px;
                "
              >
                <button
                  type="button"
                  class="btn-secundario"
                  style="flex:1;"
                  data-cerrar-modal
                >
                  No, mantener
                </button>

                <button
                  type="button"
                  class="btn-primario btn-primario--plano"
                  style="
                    flex:1;
                    background:#ef4444;
                  "
                  data-ejecutar-cancelar="${modal.idConsulta}"
                >
                  Sí, cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    /* ------------------------------------------------------------
       Modal de cita reservada o cancelada
       ------------------------------------------------------------ */

    const consulta = modal.cita;
    const esCancelacion =
      modal.tipo === 'cancelacion';

    const titulo = esCancelacion
      ? '¡Cita cancelada!'
      : '¡Cita confirmada!';

    const texto = esCancelacion
      ? 'La cita fue cancelada exitosamente y el horario liberado.'
      : 'Tu reserva quedó registrada correctamente.';

    const icono = esCancelacion
      ? '✕'
      : '✓';

    const estiloFondo = esCancelacion
      ? `
        background:
        linear-gradient(
          135deg,
          #ef4444,
          #dc2626
        );
      `
      : '';

    const estiloTexto = esCancelacion
      ? 'color:#ef4444;'
      : '';

    const fila = (etiqueta, valor) => `
      <div class="modal__fila">
        <dt>${etiqueta}</dt>
        <dd>${e(valor)}</dd>
      </div>
    `;

    return `
      <div
        class="modal-overlay"
        data-cerrar-modal
      >
        <div
          class="modal"
          data-stop
        >
          <div
            class="modal__blob"
            style="${estiloFondo}"
          ></div>

          <div style="position:relative;">
            <div
              class="modal__check"
              style="${estiloTexto}"
            >
              ${icono}
            </div>

            <h3 class="modal__titulo">
              ${titulo}
            </h3>

            <p class="modal__texto">
              ${texto}
            </p>

            <div class="modal__detalle">
              ${fila('📅 Fecha', consulta.date)}
              ${fila('🕑 Hora', consulta.time)}
              ${fila('🐾 Mascota', consulta.mascota)}
              ${fila('🩺 Motivo', consulta.motivo)}
            </div>

            <button
              type="button"
              class="btn-primario btn-primario--plano"
              style="margin-top:22px;"
              data-cerrar-modal
            >
              Entendido, cerrar
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /* ============================================================
     Seguimiento de citas del cliente
     ============================================================ */

  function tplSeguimiento() {
    const usuario = Auth.usuarioActual();

    if (!usuario) {
      return `
        <section class="card seguimiento">
          <h2 class="card__titulo">
            Mis citas
          </h2>

          <p class="card__sub">
            Inicia sesión para ver y gestionar
            tus citas agendadas
          </p>

          <div class="seguimiento__vacio">
            <span>🔒</span>

            <p>
              Para ver tus citas necesitas una cuenta.
            </p>

            <button
              type="button"
              class="seguimiento__login-enlace"
              data-ir-cuenta
            >
              Iniciar sesión
            </button>
          </div>
        </section>
      `;
    }

    const citas = Consultas.listarPorUsuario(
      usuario.id
    );

    if (!citas.length) {
      const aviso = estado.tracking.aviso
        ? `
          <div
            class="
              seguimiento__aviso
              seguimiento__aviso--${
                estado.tracking.aviso.tipo === 'ok'
                  ? 'ok'
                  : 'error'
              }
            "
          >
            ${e(estado.tracking.aviso.mensaje)}
          </div>
        `
        : '';

      return `
        <section class="card seguimiento">
          <h2 class="card__titulo">
            Mis citas
          </h2>

          <p class="card__sub">
            Aquí aparecerán las citas que agendes
            con tu cuenta
          </p>

          ${aviso}

          <div class="seguimiento__vacio">
            <span>📅</span>

            <p>
              No tienes citas registradas aún.
              Selecciona un horario arriba para
              agendar tu primera cita.
            </p>
          </div>
        </section>
      `;
    }

    const item = (
      icono,
      rotulo,
      valor
    ) => `
      <div class="seguimiento__item">
        <div class="seguimiento__item-ico">
          ${icono}
        </div>

        <div>
          <div class="seguimiento__item-rotulo">
            ${rotulo}
          </div>

          <div class="seguimiento__item-valor">
            ${e(valor)}
          </div>
        </div>
      </div>
    `;

    const tarjetas = citas
      .map((consulta) => {
        const meta =
          Consultas.META[consulta.status] || {
            label: consulta.status,
            clase: consulta.status,
          };

        const acciones = [];

        /*
         * Una cita pendiente puede cancelarse.
         */
        if (consulta.status === 'pending') {
          acciones.push(`
            <button
              type="button"
              class="btn-cancelar"
              data-cancelar="${consulta.id}"
            >
              Cancelar cita
            </button>
          `);
        }

        /*
         * Una cita atendida puede calificarse.
         */
        if (consulta.status === 'done') {
          const resena =
            Resenas.buscarPorConsulta(
              consulta.id
            );

          if (!resena) {
            acciones.push(`
              <button
                type="button"
                class="btn-resena"
                data-resenar="${consulta.id}"
              >
                ★ Calificar servicio
              </button>
            `);
          } else {
            acciones.push(`
            <span
              class="
                resena-cita__estado
                resena-cita__estado--aprobada
              "
            >
              ★ Reseña publicada
            </span>
          `);
          }
        }

        const accionesHtml = acciones.length
          ? `
            <div class="seguimiento__acciones">
              ${acciones.join('')}
            </div>
          `
          : '';

        return `
          <div class="seguimiento__cita">
            <div
              style="
                display:flex;
                align-items:center;
                gap:10px;
                margin-bottom:6px;
              "
            >
              <span class="badge badge--${meta.clase}">
                <span class="badge__dot"></span>
                ${meta.label}
              </span>
            </div>

            <div class="seguimiento__detalle">
              ${item(
                '🐾',
                'Mascota',
                consulta.mascota
              )}

              ${item(
                '📅',
                'Fecha',
                consulta.date
              )}

              ${item(
                '🕑',
                'Hora',
                consulta.time
              )}

              ${item(
                '🩺',
                'Motivo',
                consulta.motivo
              )}
            </div>

            ${accionesHtml}
          </div>
        `;
      })
      .join('');

    const aviso = estado.tracking.aviso
      ? `
        <div
          class="
            seguimiento__aviso
            seguimiento__aviso--${
              estado.tracking.aviso.tipo === 'ok'
                ? 'ok'
                : 'error'
            }
          "
        >
          ${e(estado.tracking.aviso.mensaje)}
        </div>
      `
      : '';

    return `
      <section class="card seguimiento">
        <h2 class="card__titulo">
          Mis citas
        </h2>

        <p class="card__sub">
          Gestiona las citas agendadas
          con tu cuenta
        </p>

        ${aviso}

        <div class="seguimiento__lista">
          ${tarjetas}
        </div>
      </section>
    `;
  }

  function renderCliente() {
    DOM.montar('main', `
      <div class="contenedor app-main">
        ${tplHero()}

        ${esPaginaInicio() ? tplTestimonios() : ''}

        ${tplHorarios()}

        <section class="cita-grid">
          ${tplFormulario()}
          ${tplResumen()}
        </section>

        ${tplSeguimiento()}

        ${tplTokens()}
      </div>
    `);

    DOM.montar(
      '#capa-modal',
      tplModal()
    );
  }

  /* ============================================================
     Interacciones del cliente
     ============================================================ */

  function onInputCampo(campo, valor) {
    estado.form[campo] = valor;

    if (estado.errors[campo]) {
      delete estado.errors[campo];

      const input = DOM.sel(
        `[data-campo="${campo}"]`
      );

      if (input) {
        input.classList.remove(
          'campo__control--error'
        );
      }

      const error = DOM.sel(
        `[data-error-de="${campo}"]`
      );

      if (error) {
        error.remove();
      }
    }

    if (campo === 'mascota') {
      DOM.montar(
        '#resumen-mascota',
        e(valor.trim() || '—')
      );
    }

    if (campo === 'motivo') {
      DOM.montar(
        '#resumen-motivo',
        e(valor || '—')
      );
    }
  }

  function seleccionarSlot(id) {
    estado.selectedSlotId = id;

    delete estado.errors.slot;

    renderCliente();
  }

  function confirmarCita() {
    if (!Auth.sesionActiva()) {
      estado.requiereLogin = true;

      renderCliente();
      return;
    }

    const errores =
      Validacion.validarCita(
        estado.form,
        estado.selectedSlotId
      );

    if (Object.keys(errores).length) {
      estado.errors = errores;

      renderCliente();
      return;
    }

    const seleccion =
      Horarios.buscarSlot(
        estado.selectedSlotId
      );

    if (!seleccion) {
      estado.errors.slot =
        'Selecciona un horario disponible.';

      renderCliente();
      return;
    }

    const formulario = estado.form;
    const usuario = Auth.usuarioActual();

    Mascotas.registrar({
      nombre: formulario.mascota,
      motivo: formulario.motivo,
      usuarioId: usuario.id,
    });

    const consulta = Consultas.reservar({
      cliente: formulario.cliente,
      contacto: formulario.contacto,
      mascota: formulario.mascota,
      motivo: formulario.motivo,
      day: seleccion.day,
      slot: seleccion.slot,
      usuarioId: usuario.id,
    });

    Horarios.ocupar(
      seleccion.slot.id
    );

    const aviso =
      Notificaciones.crear(
        consulta
      );

    estado.modalData = {
      tipo: 'reserva',
      cita: aviso,
    };

    estado.modalOpen = true;
    estado.form = datosPrecargados();
    estado.selectedSlotId = null;
    estado.errors = {};
    estado.requiereLogin = false;

    renderCliente();
  }

  /**
   * Datos iniciales del formulario.
   */
  function datosPrecargados() {
    const usuario = Auth.usuarioActual();

    return {
      cliente: usuario
        ? usuario.nombre || ''
        : '',

      contacto: usuario
        ? usuario.email || ''
        : '',

      mascota: '',
      motivo: '',
    };
  }

  /**
   * Cierra cualquier modal de la vista cliente.
   */
  function cerrarModal() {
    estado.modalOpen = false;
    estado.modalData = null;

    estado.resena = {
      consultaId: null,
      calificacion: 0,
      comentario: '',
      error: null,
    };

    DOM.montar(
      '#capa-modal',
      ''
    );
  }

  /**
   * Abre el formulario para calificar una consulta.
   */
  function abrirResena(idConsulta) {
    const usuario = Auth.usuarioActual();

    const consulta =
      Consultas.listarPorUsuario(
        usuario ? usuario.id : null
      ).find(
        (item) =>
          item.id === idConsulta
      );

    if (
      !usuario ||
      !consulta ||
      consulta.status !== 'done'
    ) {
      estado.tracking.aviso = {
        tipo: 'error',
        mensaje:
          'Solo puedes calificar una consulta atendida de tu cuenta.',
      };

      renderCliente();
      return;
    }

    if (
      Resenas.existeParaConsulta(
        idConsulta
      )
    ) {
      estado.tracking.aviso = {
        tipo: 'error',
        mensaje:
          'Esta consulta ya tiene una reseña registrada.',
      };

      renderCliente();
      return;
    }

    estado.tracking.aviso = null;

    estado.resena = {
      consultaId: idConsulta,
      calificacion: 0,
      comentario: '',
      error: null,
    };

    estado.modalData = {
      tipo: 'resena_formulario',
      cita: consulta,
    };

    estado.modalOpen = true;

    renderCliente();
  }

  /**
   * Selecciona la cantidad de estrellas.
   */
  function seleccionarEstrella(valor) {
    estado.resena.calificacion =
      Number(valor);

    estado.resena.error = null;

    DOM.montar(
      '#capa-modal',
      tplModal()
    );
  }

  /**
   * Guarda temporalmente el comentario.
   */
  function actualizarComentarioResena(valor) {
    estado.resena.comentario =
      String(valor || '')
        .slice(
          0,
          Resenas.MAX_COMENTARIO
        );

    estado.resena.error = null;

    const contador = DOM.sel(
      '[data-resena-contador]'
    );

    if (contador) {
      contador.textContent =
        estado.resena.comentario.length;
    }
  }

  /**
   * Envía una nueva reseña.
   */
  function enviarResena() {
    const usuario =
      Auth.usuarioActual();

    const resultado =
      Resenas.crear({
        consultaId:
          estado.resena.consultaId,

        usuarioId:
          usuario
            ? usuario.id
            : null,

        calificacion:
          estado.resena.calificacion,

        comentario:
          estado.resena.comentario,
      });

    if (!resultado.ok) {
      estado.resena.error =
        resultado.error;

      DOM.montar(
        '#capa-modal',
        tplModal()
      );

      return;
    }

    estado.resena = {
      consultaId: null,
      calificacion: 0,
      comentario: '',
      error: null,
    };

    estado.modalData = {
      tipo: 'resena_exito',
      resena: resultado.resena,
    };

    estado.modalOpen = true;

    renderCliente();
  }

  /**
   * Solicita confirmación antes de cancelar.
   */
  function cancelarConsultaCliente(id) {
    estado.modalData = {
      tipo: 'confirmar_cancelacion',
      idConsulta: id,
    };

    estado.modalOpen = true;

    renderCliente();
  }

  /**
   * Ejecuta la cancelación de la cita.
   */
  function ejecutarCancelacion(id) {
    const cancelada =
      Consultas.cancelar(id);

    if (!cancelada) {
      estado.tracking.aviso = {
        tipo: 'error',
        mensaje:
          'Solo se pueden cancelar consultas en estado pendiente.',
      };

      renderCliente();
      return;
    }

    if (cancelada.slotId) {
      Horarios.desocupar(
        cancelada.slotId
      );
    }

    estado.tracking.aviso = null;

    estado.modalData = {
      tipo: 'cancelacion',
      cita: cancelada,
    };

    estado.modalOpen = true;

    renderCliente();
  }

  /**
   * Registra los eventos de la vista cliente.
   */
  function wireCliente() {
    const main = DOM.sel('main');
    const modal = DOM.sel('#capa-modal');

    main.addEventListener(
      'input',
      (evento) => {
        const campo =
          evento.target.closest(
            '[data-campo]'
          );

        if (campo) {
          onInputCampo(
            campo.getAttribute(
              'data-campo'
            ),
            campo.value
          );
        }
      }
    );

    main.addEventListener(
      'change',
      (evento) => {
        const campo =
          evento.target.closest(
            'select[data-campo]'
          );

        if (campo) {
          onInputCampo(
            campo.getAttribute(
              'data-campo'
            ),
            campo.value
          );
        }
      }
    );

    DOM.delegar(
      main,
      'click',
      '[data-slot]',
      (_evento, elemento) => {
        seleccionarSlot(
          elemento.getAttribute(
            'data-slot'
          )
        );
      }
    );

    DOM.delegar(
      main,
      'click',
      '[data-submit]',
      () => {
        confirmarCita();
      }
    );

    DOM.delegar(
      main,
      'click',
      '[data-cancelar]',
      (_evento, elemento) => {
        cancelarConsultaCliente(
          Number(
            elemento.getAttribute(
              'data-cancelar'
            )
          )
        );
      }
    );

    DOM.delegar(
      main,
      'click',
      '[data-resenar]',
      (_evento, elemento) => {
        abrirResena(
          Number(
            elemento.getAttribute(
              'data-resenar'
            )
          )
        );
      }
    );

    DOM.delegar(
      main,
      'click',
      '[data-ir-cuenta]',
      () => {
        Router.irACuenta();
      }
    );

    modal.addEventListener(
      'input',
      (evento) => {
        const comentario =
          evento.target.closest(
            '[data-resena-comentario]'
          );

        if (comentario) {
          actualizarComentarioResena(
            comentario.value
          );
        }
      }
    );

    modal.addEventListener(
      'click',
      (evento) => {
        const estrella =
          evento.target.closest(
            '[data-resena-estrella]'
          );

        if (estrella) {
          seleccionarEstrella(
            Number(
              estrella.getAttribute(
                'data-resena-estrella'
              )
            )
          );

          return;
        }

        if (
          evento.target.closest(
            '[data-enviar-resena]'
          )
        ) {
          enviarResena();
          return;
        }

        const botonCancelar =
          evento.target.closest(
            '[data-ejecutar-cancelar]'
          );

        if (botonCancelar) {
          ejecutarCancelacion(
            Number(
              botonCancelar.getAttribute(
                'data-ejecutar-cancelar'
              )
            )
          );

          return;
        }

       const botonCerrar =
          evento.target.closest(
            'button[data-cerrar-modal]'
          );

        if (botonCerrar) {
          cerrarModal();
          return;
        }

        if (
          evento.target.classList.contains(
            'modal-overlay'
          )
        ) {
          cerrarModal();
        }
      }
    );
  }

  /* ============================================================
     Vista del administrador
     ============================================================ */

  function tplFila(fila) {
    const meta =
      Consultas.META[fila.status];

    let accion;

    if (fila.status === 'pending') {
      accion = `
        <button
          type="button"
          class="btn-confirmar"
          data-confirmar="${fila.id}"
        >
          Confirmar
        </button>
      `;
    } else if (
      fila.status === 'cancelado'
    ) {
      accion = `
        <span class="badge badge--${meta.clase}">
          <span class="badge__dot"></span>
          ${meta.label}
        </span>
      `;
    } else {
      accion = `
        <button
          type="button"
          class="badge badge--${meta.clase}"
          data-cycle="${fila.id}"
          title="Cambiar estado"
        >
          <span class="badge__dot"></span>
          ${meta.label}
        </button>
      `;
    }

    return `
      <div class="tabla__fila">
        <div>
          <span class="tabla__cola">
            ${fila.queue}
          </span>
        </div>

        <div class="tabla__hora">
          ${e(fila.time)}
        </div>

        <div class="tabla__cliente">
          ${e(fila.cliente)}
        </div>

        <div class="tabla__mascota">
          <span class="tabla__mascota-ico">
            🐾
          </span>

          ${e(fila.mascota)}
        </div>

        <div class="tabla__motivo">
          ${e(fila.motivo)}
        </div>

        <div>
          ${accion}
        </div>
      </div>
    `;
  }

  function tplGrupo(grupo) {
    return `
      <div>
        <div class="tabla__grupo-head">
          <span class="tabla__grupo-fecha">
            ${e(grupo.date)}
          </span>

          <span class="tabla__grupo-linea"></span>

          <span class="tabla__grupo-count">
            ${grupo.count} citas
          </span>
        </div>

        ${grupo.rows
          .map(tplFila)
          .join('')}
      </div>
    `;
  }

  function tplFiltrosConsultas(
    totalFiltrado
  ) {
    const botones =
      FILTROS_CONSULTAS
        .map((filtro) => {
          const activo =
            estadoAdmin.filtroEstado ===
            filtro.estado;

          return `
            <button
              type="button"
              class="
                filtro-estado
                ${
                  activo
                    ? 'filtro-estado--activo'
                    : ''
                }
              "
              data-filtro-consultas="${filtro.estado}"
              aria-pressed="${activo}"
            >
              ${e(filtro.label)}
            </button>
          `;
        })
        .join('');

    return `
      <section
        class="admin-filtros"
        aria-label="Filtros de consultas"
      >
        <div class="admin-busqueda">
          <label
            class="campo__label"
            for="buscar-consultas"
          >
            Buscar consulta
          </label>

          <input
            class="
              campo__control
              admin-busqueda__input
            "
            id="buscar-consultas"
            data-buscar-consultas
            value="${e(
              estadoAdmin.busqueda
            )}"
            placeholder="Mascota o dueño"
            autocomplete="off"
          >
        </div>

        <div
          class="admin-filtros__acciones"
          role="group"
          aria-label="Filtrar por estado"
        >
          ${botones}
        </div>

        <div class="admin-filtros__total">
          ${totalFiltrado} visibles
        </div>
      </section>
    `;
  }

  function renderAdmin() {
    const contadores =
      Consultas.contadores();

    const filtros = {
      estado:
        estadoAdmin.filtroEstado,

      busqueda:
        estadoAdmin.busqueda,
    };

    const grupos =
      Consultas.agrupadasPorFecha(
        filtros
      );

    const totalFiltrado =
      grupos.reduce(
        (
          total,
          grupo
        ) =>
          total + grupo.count,
        0
      );

    const cuerpo = grupos.length
      ? grupos
          .map(tplGrupo)
          .join('')
      : `
        <div class="admin-vacio">
          No hay consultas que coincidan
          con el filtro.
        </div>
      `;

    DOM.montar('main', `
      <div class="contenedor app-main">
        <div class="admin-head">
          <div>
            <h1 class="admin-head__titulo">
              Panel de citas
            </h1>

            <p class="admin-head__sub">
              Cola de atención ordenada
              por fecha y hora (FIFO)
            </p>
          </div>

          <div class="contadores">
            <div class="contador">
              <span
                class="
                  contador__dot
                  contador__dot--pending
                "
              ></span>

              <span class="contador__num">
                ${contadores.pending}
              </span>

              <span class="contador__lbl">
                Pendientes
              </span>
            </div>

            <div class="contador">
              <span
                class="
                  contador__dot
                  contador__dot--confirmed
                "
              ></span>

              <span class="contador__num">
                ${contadores.confirmed}
              </span>

              <span class="contador__lbl">
                Confirmadas
              </span>
            </div>

            <div class="contador">
              <span
                class="
                  contador__dot
                  contador__dot--progreso
                "
              ></span>

              <span class="contador__num">
                ${contadores.in_progress}
              </span>

              <span class="contador__lbl">
                En progreso
              </span>
            </div>

            <div class="contador">
              <span
                class="
                  contador__dot
                  contador__dot--done
                "
              ></span>

              <span class="contador__num">
                ${contadores.done}
              </span>

              <span class="contador__lbl">
                Atendidas
              </span>
            </div>

            <div class="contador">
              <span
                class="
                  contador__dot
                  contador__dot--cancelado
                "
              ></span>

              <span class="contador__num">
                ${contadores.cancelado}
              </span>

              <span class="contador__lbl">
                Canceladas
              </span>
            </div>
          </div>
        </div>

        ${tplFiltrosConsultas(
          totalFiltrado
        )}

        <div class="tabla-wrap">
          <div class="tabla-scroll">
            <div class="tabla">
              <div class="tabla__head">
                <div>Cola</div>
                <div>Hora</div>
                <div>Cliente</div>
                <div>Mascota</div>
                <div>Motivo</div>
                <div>Estado</div>
              </div>

              ${cuerpo}
            </div>
          </div>
        </div>

        <p class="admin-ayuda">
          💡 Confirma las consultas pendientes
          para asignar fecha y hora de atención
          y avisar al cliente. Una vez confirmadas,
          toca el estado para avanzar el ciclo:
          Confirmada → En progreso → Atendida.
          El orden de cola refleja el ingreso
          FIFO por fecha y hora.
        </p>

        ${tplTokens()}
      </div>
    `);

    DOM.montar(
      '#capa-modal',
      tplModalAdmin()
    );
  }

  /* ============================================================
     Modal de confirmación del administrador
     ============================================================ */

  function tplModalAdmin() {
    if (
      estadoAdmin.confirmId !== null
    ) {
      return tplConfirmarForm();
    }

    if (estadoAdmin.exito) {
      return tplConfirmarExito();
    }

    return '';
  }

  function tplConfirmarForm() {
    const consulta =
      Consultas.listar().find(
        (item) =>
          item.id ===
          estadoAdmin.confirmId
      );

    if (!consulta) {
      return '';
    }

    const opciones =
      Horarios.listarDias()
        .map((dia) => `
          <option
            value="${dia.rank}"
            ${
              dia.rank === consulta.rank
                ? 'selected'
                : ''
            }
          >
            ${e(dia.label)} · ${e(dia.date)}
          </option>
        `)
        .join('');

    const fila = (
      etiqueta,
      valor
    ) => `
      <div class="modal__fila">
        <dt>${etiqueta}</dt>
        <dd>${e(valor)}</dd>
      </div>
    `;

    return `
      <div class="modal-overlay">
        <div class="modal modal--form">
          <div class="modal__blob"></div>

          <div style="position:relative;">
            <h3 class="modal__titulo">
              Confirmar consulta
            </h3>

            <p class="modal__texto">
              Revisa los datos y asigna
              la fecha y hora de atención.
            </p>

            <div class="modal__detalle">
              ${fila(
                '👤 Cliente',
                consulta.cliente
              )}

              ${fila(
                '📞 Contacto',
                consulta.contacto || '—'
              )}

              ${fila(
                '🐾 Mascota',
                consulta.mascota
              )}

              ${fila(
                '🩺 Motivo',
                consulta.motivo
              )}
            </div>

            <div class="confirmar-form">
              <div class="campo">
                <label class="campo__label">
                  Fecha de atención
                </label>

                <select
                  class="campo__control"
                  data-confirmar-fecha
                >
                  ${opciones}
                </select>
              </div>

              <div class="campo">
                <label class="campo__label">
                  Hora de atención
                </label>

                <input
                  class="campo__control"
                  type="time"
                  value="${e(consulta.time)}"
                  data-confirmar-hora
                >
              </div>
            </div>

            <button
              type="button"
              class="btn-primario"
              style="margin-top:22px;"
              data-confirmar-ok="${consulta.id}"
            >
              Confirmar cita
            </button>

            <button
              type="button"
              class="btn-secundario"
              data-cerrar-modal
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function tplConfirmarExito() {
    const consulta =
      estadoAdmin.exito;

    const fila = (
      etiqueta,
      valor
    ) => `
      <div class="modal__fila">
        <dt>${etiqueta}</dt>
        <dd>${e(valor)}</dd>
      </div>
    `;

    return `
      <div class="modal-overlay">
        <div class="modal">
          <div class="modal__blob"></div>

          <div style="position:relative;">
            <div class="modal__check">
              ✓
            </div>

            <h3 class="modal__titulo">
              ¡Consulta confirmada!
            </h3>

            <p class="modal__texto">
              Se notificó al cliente
              la fecha y hora de atención.
            </p>

            <div class="modal__detalle">
              ${fila(
                '📅 Fecha',
                consulta.date
              )}

              ${fila(
                '🕑 Hora',
                consulta.time
              )}

              ${fila(
                '🐾 Mascota',
                consulta.mascota
              )}

              ${fila(
                '👤 Cliente',
                consulta.cliente
              )}
            </div>

            <button
              type="button"
              class="
                btn-primario
                btn-primario--plano
              "
              style="margin-top:22px;"
              data-cerrar-modal
            >
              Entendido, cerrar
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function abrirConfirmar(id) {
    estadoAdmin.confirmId = id;
    estadoAdmin.exito = null;

    DOM.montar(
      '#capa-modal',
      tplModalAdmin()
    );
  }

  function confirmarConsulta(id) {
    const selectorFecha =
      DOM.sel(
        '[data-confirmar-fecha]'
      );

    const selectorHora =
      DOM.sel(
        '[data-confirmar-hora]'
      );

    const rank = selectorFecha
      ? Number(selectorFecha.value)
      : null;

    const dia =
      Horarios.listarDias().find(
        (item) =>
          item.rank === rank
      );

    const hora = selectorHora
      ? selectorHora.value
      : '';

    const actualizada =
      Consultas.confirmar(
        id,
        {
          date: dia
            ? dia.date
            : undefined,

          rank: dia
            ? dia.rank
            : undefined,

          time: hora || undefined,
        }
      );

    if (actualizada) {
      Notificaciones.crear(
        actualizada
      );
    }

    estadoAdmin.confirmId = null;
    estadoAdmin.exito = actualizada;

    renderAdmin();
  }

  function cerrarModalAdmin() {
    estadoAdmin.confirmId = null;
    estadoAdmin.exito = null;

    DOM.montar(
      '#capa-modal',
      ''
    );
  }

  function buscarConsultas(valor) {
    estadoAdmin.busqueda = valor;

    renderAdmin();

    const buscador =
      DOM.sel(
        '[data-buscar-consultas]'
      );

    if (buscador) {
      buscador.focus();

      buscador.setSelectionRange(
        buscador.value.length,
        buscador.value.length
      );
    }
  }

  function filtrarConsultas(
    nuevoEstado
  ) {
    estadoAdmin.filtroEstado =
      nuevoEstado;

    renderAdmin();
  }

  /**
   * Registra los eventos del panel administrativo.
   */
  function wireAdmin() {
    const main = DOM.sel('main');

    main.addEventListener(
      'input',
      (evento) => {
        const buscador =
          evento.target.closest(
            '[data-buscar-consultas]'
          );

        if (buscador) {
          buscarConsultas(
            buscador.value
          );
        }
      }
    );

    DOM.delegar(
      main,
      'click',
      '[data-cycle]',
      (_evento, elemento) => {
        Consultas.avanzarEstado(
          Number(
            elemento.getAttribute(
              'data-cycle'
            )
          )
        );

        renderAdmin();
      }
    );

    DOM.delegar(
      main,
      'click',
      '[data-filtro-consultas]',
      (_evento, elemento) => {
        filtrarConsultas(
          elemento.getAttribute(
            'data-filtro-consultas'
          )
        );
      }
    );

    DOM.delegar(
      main,
      'click',
      '[data-confirmar]',
      (_evento, elemento) => {
        abrirConfirmar(
          Number(
            elemento.getAttribute(
              'data-confirmar'
            )
          )
        );
      }
    );

    const modal =
      DOM.sel('#capa-modal');

    modal.addEventListener(
      'click',
      (evento) => {
        const botonConfirmar =
          evento.target.closest(
            '[data-confirmar-ok]'
          );

        if (botonConfirmar) {
          confirmarConsulta(
            Number(
              botonConfirmar.getAttribute(
                'data-confirmar-ok'
              )
            )
          );

          return;
        }

        if (
          evento.target.closest(
            '[data-cerrar-modal]'
          )
        ) {
          cerrarModalAdmin();
          return;
        }

        if (
          evento.target.classList.contains(
            'modal-overlay'
          )
        ) {
          cerrarModalAdmin();
        }
      }
    );
  }

  /* ============================================================
     Arranque de la aplicación
     ============================================================ */

  function init() {
    /*
     * El panel administrativo exige una sesión
     * con rol administrador.
     */
    if (
      Auth.esAdmin() &&
      (
        !Auth.sesionActiva() ||
        Auth.rolUsuario() !== 'admin'
      )
    ) {
      Router.irACuenta();
      return;
    }

    DOM.montar(
      'header',
      tplHeader()
    );

    DOM.sel('header')
      .classList
      .add('app-header');

    /*
     * Capa independiente para los modales.
     */
    if (!DOM.sel('#capa-modal')) {
      const capa =
        document.createElement('div');

      capa.id = 'capa-modal';

      document.body.appendChild(
        capa
      );
    }

    const header =
      DOM.sel('header');

    DOM.delegar(
      header,
      'click',
      '[data-ir-cuenta]',
      () => {
        Router.irACuenta();
      }
    );

    DOM.delegar(
      header,
      'click',
      '[data-cerrar-sesion]',
      () => {
        cerrarSesion();
      }
    );

    DOM.delegar(
      header,
      'click',
      '[data-tema-toggle]',
      () => {
        alternarTema();
      }
    );

    if (Auth.esAdmin()) {
      renderAdmin();
      wireAdmin();
    } else {
      estado.form =
        datosPrecargados();

      renderCliente();
      wireCliente();
    }
  }

  /**
   * Cierra la sesión activa.
   */
  function cerrarSesion() {
    Auth.cerrarSesion();
    location.reload();
  }

  /**
   * Alterna el tema y actualiza el encabezado.
   */
  function alternarTema() {
    Tema.alternar();

    DOM.montar(
      'header',
      tplHeader()
    );
  }

  document.addEventListener(
    'DOMContentLoaded',
    init
  );
})();
function initAdmin() {
  const main = $("main");
  if (!main) return;

  renderConsultas(main);
}

function renderConsultas(container) {
  container.innerHTML = "";

  const consultas = Consultas.listar();
  if (!consultas.length) {
    container.append(crear("p", { className: "vacio" }, ["No hay consultas registradas."]));
    return;
  }

  const tabla = crear("table", { className: "tabla-consultas" }, [
    crear("thead", {}, [
      crear("tr", {}, [
        crear("th", {}, ["Mascota"]),
        crear("th", {}, ["Fecha"]),
        crear("th", {}, ["Horario"]),
        crear("th", {}, ["Estado"]),
        crear("th", {}, ["Acciones"])
      ])
    ]),
    crear("tbody", {}, consultas.map(c => filaConsulta(c)))
  ]);

  container.append(tabla);
}

function filaConsulta(consulta) {
  const mascota = Mascotas.obtener(consulta.mascotaId);
  const nombreMascota = mascota ? mascota.nombre : "Desconocida";

  const badge = crear("span", {
    className: `badge badge-${consulta.estado}`
  }, [consulta.estado]);

  const acciones = crear("td", { className: "acciones" });

  if (consulta.estado !== "completado" && consulta.estado !== "cancelada") {
    acciones.append(
      crear("button", {
        className: "btn btn-sm btn-exito",
        onClick: () => abrirFormularioCompletado(consulta)
      }, ["Completar"])
    );
  }

  if (consulta.notasClinicas) {
    acciones.append(
      crear("button", {
        className: "btn btn-sm btn-info",
        onClick: () => verHistorial(consulta)
      }, ["Ver historial"])
    );
  }

  return crear("tr", {}, [
    crear("td", {}, [nombreMascota]),
    crear("td", {}, [consulta.fecha]),
    crear("td", {}, [consulta.horario]),
    crear("td", {}, [badge]),
    acciones
  ]);
}

function abrirFormularioCompletado(consulta) {
  const mascota = Mascotas.obtener(consulta.mascotaId);
  const nombreMascota = mascota ? mascota.nombre : "Desconocida";

  const form = crear("form", { className: "notas-form", onSubmit: (e) => {
    e.preventDefault();
    const peso = form.querySelector("[name=peso]").value;
    const sintomas = form.querySelector("[name=sintomas]").value;
    const diagnostico = form.querySelector("[name=diagnostico]").value;
    const tratamiento = form.querySelector("[name=tratamiento]").value;

    Consultas.completar(consulta.id, { peso, sintomas, diagnostico, tratamiento });
    m.cerrar();
    renderConsultas($("main"));
  }}, [
    crear("div", { className: "form-grupo" }, [
      crear("label", {}, ["Peso (kg)"]),
      crear("input", { type: "number", name: "peso", step: "0.1", min: "0", required: "required" })
    ]),
    crear("div", { className: "form-grupo" }, [
      crear("label", {}, ["Síntomas"]),
      crear("textarea", { name: "sintomas", rows: "3", required: "required" })
    ]),
    crear("div", { className: "form-grupo" }, [
      crear("label", {}, ["Diagnóstico"]),
      crear("textarea", { name: "diagnostico", rows: "3", required: "required" })
    ]),
    crear("div", { className: "form-grupo" }, [
      crear("label", {}, ["Tratamiento"]),
      crear("textarea", { name: "tratamiento", rows: "3", required: "required" })
    ]),
    crear("div", { className: "form-acciones" }, [
      crear("button", { type: "submit", className: "btn btn-exito" }, ["Guardar"]),
      crear("button", { type: "button", className: "btn btn-cancelar", onClick: () => m.cerrar() }, ["Cancelar"])
    ])
  ]);

  const m = modal(`Completar consulta — ${nombreMascota}`, form);
}

function verHistorial(consulta) {
  const historial = Consultas.historialMascota(consulta.mascotaId);
  const mascota = Mascotas.obtener(consulta.mascotaId);
  const nombreMascota = mascota ? mascota.nombre : "Desconocida";

  const lista = crear("div", { className: "historial-lista" }, historial.map(c => {
    const nc = c.notasClinicas;
    return crear("div", { className: "historial-entrada" }, [
      crear("div", { className: "historial-fecha" }, [`${c.fecha} — ${c.horario}`]),
      crear("div", { className: "historial-campo" }, [
        crear("strong", {}, ["Peso: "]),
        nc.peso, " kg"
      ]),
      crear("div", { className: "historial-campo" }, [
        crear("strong", {}, ["Síntomas: "]),
        nc.sintomas
      ]),
      crear("div", { className: "historial-campo" }, [
        crear("strong", {}, ["Diagnóstico: "]),
        nc.diagnostico
      ]),
      crear("div", { className: "historial-campo" }, [
        crear("strong", {}, ["Tratamiento: "]),
        nc.tratamiento
      ])
    ]);
  }));

  modal(`Historial clínico — ${nombreMascota}`, lista);
}

document.addEventListener("DOMContentLoaded", initAdmin);
