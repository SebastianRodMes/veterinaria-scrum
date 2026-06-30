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
    { var: '--color-primario',   hex: '#0077b6' },
    { var: '--color-acento',     hex: '#00b4d8' },
    { var: '--color-profundo',   hex: '#03045e' },
    { var: '--estado-pendiente', hex: '#f0a500' },
    { var: '--estado-progreso',  hex: '#00b4d8' },
    { var: '--estado-done',      hex: '#16a34a' },
    { var: '--estado-cancelada', hex: '#e0457b' },
  ];

  const MOTIVOS = ['Consulta general', 'Vacunación', 'Control', 'Emergencia', 'Estética', 'Cirugía'];

  const FILTROS_CONSULTAS = [
    { estado: 'all', label: 'Todas' },
    { estado: 'pending', label: 'Pendientes' },
    { estado: 'in_progress', label: 'En Curso' },
    { estado: 'done', label: 'Completadas' },
    { estado: 'canceled', label: 'Canceladas' },
  ];

  const e = DOM.escapar;

  // Estado de la vista cliente (efímero, salvo lo que se persiste al reservar).
  const estado = {
    selectedSlotId: null,
    form: { cliente: '', contacto: '', mascota: '', motivo: '' },
    errors: {},
    modalOpen: false,
    confirm: null,
  };

  // Estado de la vista admin (efímero): consulta abierta en el modal de
  // confirmación y, tras confirmar, el aviso de éxito.
  const estadoAdmin = { confirmId: null, exito: null, filtroEstado: 'all', busqueda: '' };

  /* ===================== Plantillas compartidas ===================== */

  function tplHeader() {
    const rol = Auth.rolActual();
    const act = (r) => 'tab' + (rol === r ? ' tab--activo' : '');
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
            <div class="marca__sub">Gestión de citas veterinarias</div>
          </div>
        </div>
        <div class="tabs">
          <button type="button" class="${act('cliente')}" data-ir="cliente">Cliente</button>
          <button type="button" class="${act('admin')}" data-ir="admin">Admin</button>
        </div>
      </div>`;
  }

  function tplTokens() {
    const items = TOKENS.map((t) => `
      <div class="token">
        <span class="token__swatch" style="background:${t.hex}"></span>
        <div style="line-height:1.3;min-width:0;">
          <div class="token__nombre">${e(t.var)}</div>
          <div class="token__hex">${e(t.hex)}</div>
        </div>
      </div>`).join('');
    return `
      <div class="contenedor">
        <div class="tokens">
          <div class="tokens__titulo">Sistema de color · variables de diseño</div>
          <div class="tokens__grid">${items}</div>
        </div>
      </div>`;
  }

  /* ===================== Vista CLIENTE ===================== */

  function tplSlot(slot) {
    let clase = 'slot slot--libre';
    if (!slot.available) clase = 'slot slot--ocupado';
    else if (slot.id === estado.selectedSlotId) clase = 'slot slot--sel';
    const attr = slot.available ? ` data-slot="${slot.id}"` : '';
    return `<button type="button" class="${clase}"${attr}>${e(slot.time)}</button>`;
  }

  function tplHorarios() {
    const dias = Horarios.listarDias().map((d) => `
      <div class="dia">
        <div class="dia__head">
          <span class="dia__label">${e(d.label)}</span>
          <span class="dia__fecha">${e(d.date)}</span>
        </div>
        <div class="dia__slots">${d.slots.map(tplSlot).join('')}</div>
      </div>`).join('');

    return `
      <section class="card horarios">
        <div class="seccion-head">
          <div>
            <h2 class="card__titulo">Horarios disponibles</h2>
            <p class="card__sub">Selecciona un bloque libre para agendar tu cita</p>
          </div>
          <div class="leyenda">
            <span><i class="libre"></i>Libre</span>
            <span><i class="sel"></i>Seleccionado</span>
            <span><i class="ocupado"></i>Ocupado</span>
          </div>
        </div>
        <div class="dias-grid">${dias}</div>
      </section>`;
  }

  function tplCampoError(campo) {
    const msg = estado.errors[campo];
    return msg
      ? `<div class="campo__error" data-error-de="${campo}">⚠ ${e(msg)}</div>`
      : '';
  }

  function claseInput(campo) {
    return 'campo__control' + (estado.errors[campo] ? ' campo__control--error' : '');
  }

  function tplFormulario() {
    const f = estado.form;
    const opciones = ['<option value="">Selecciona…</option>']
      .concat(MOTIVOS.map((m) =>
        `<option value="${e(m)}"${f.motivo === m ? ' selected' : ''}>${e(m)}</option>`))
      .join('');

    const errSlot = estado.errors.slot
      ? `<div class="alerta-slot" data-error-de="slot">⚠ ${e(estado.errors.slot)}</div>` : '';

    return `
      <div class="card">
        <h2 class="card__titulo">Datos de la cita</h2>
        <p class="card__sub">Completa la información del cliente y la mascota</p>
        <div class="cita-form__campos">
          <div class="campo">
            <label class="campo__label">Nombre del cliente</label>
            <input class="${claseInput('cliente')}" data-campo="cliente" value="${e(f.cliente)}" placeholder="Ej. María López">
            ${tplCampoError('cliente')}
          </div>
          <div class="campo">
            <label class="campo__label">Email o teléfono</label>
            <input class="${claseInput('contacto')}" data-campo="contacto" value="${e(f.contacto)}" placeholder="correo@ejemplo.com  ·  +51 999 888 777">
            ${tplCampoError('contacto')}
          </div>
          <div class="cita-form__doble">
            <div class="campo">
              <label class="campo__label">Nombre de la mascota</label>
              <input class="${claseInput('mascota')}" data-campo="mascota" value="${e(f.mascota)}" placeholder="Ej. Toby">
              ${tplCampoError('mascota')}
            </div>
            <div class="campo">
              <label class="campo__label">Motivo</label>
              <select class="${claseInput('motivo')}" data-campo="motivo">${opciones}</select>
              ${tplCampoError('motivo')}
            </div>
          </div>
          ${errSlot}
          <button type="button" class="btn-primario" data-submit>Confirmar cita</button>
        </div>
      </div>`;
  }

  function textoHorario() {
    const sel = Horarios.buscarSlot(estado.selectedSlotId);
    return sel ? `${sel.day.label} · ${sel.slot.time}` : 'Sin seleccionar';
  }

  function tplResumen() {
    const item = (icono, rotulo, valor, id) => `
      <div class="resumen__item">
        <div class="resumen__icono">${icono}</div>
        <div>
          <div class="resumen__rotulo">${rotulo}</div>
          <div class="resumen__valor" id="${id}">${e(valor)}</div>
        </div>
      </div>`;
    return `
      <div class="resumen">
        <div class="resumen__blob resumen__blob--1"></div>
        <div class="resumen__blob resumen__blob--2"></div>
        <div class="resumen__inner">
          <div class="resumen__eyebrow">RESUMEN DE TU RESERVA</div>
          <div class="resumen__lista">
            ${item('🗓️', 'Horario seleccionado', textoHorario(), 'resumen-horario')}
            ${item('🐶', 'Mascota', estado.form.mascota.trim() || '—', 'resumen-mascota')}
            ${item('🩺', 'Motivo', estado.form.motivo || '—', 'resumen-motivo')}
          </div>
          <div class="resumen__nota">Recibirás un recordatorio antes de tu cita. Recuerda llegar 10 minutos antes.</div>
        </div>
      </div>`;
  }

  function tplHero() {
    return `
      <section class="hero">
        <div>
          <div class="pill">🐾 RESERVA EN LÍNEA</div>
          <h1 class="hero__titulo">Agenda la cita de<br>tu mascota en minutos</h1>
          <p class="hero__texto">Consulta los horarios disponibles del veterinario, elige el bloque que prefieras y confirma tu cita al instante.</p>
          <div class="hero__stats">
            <div><div class="hero__stat-num">+12k</div><div class="hero__stat-lbl">mascotas atendidas</div></div>
            <div class="hero__sep"></div>
            <div><div class="hero__stat-num">4.9★</div><div class="hero__stat-lbl">satisfacción</div></div>
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
      </section>`;
  }

  function tplModal() {
    if (!estado.modalOpen || !estado.confirm) return '';
    const c = estado.confirm;
    const fila = (et, val) => `
      <div class="modal__fila"><dt>${et}</dt><dd>${e(val)}</dd></div>`;
    return `
      <div class="modal-overlay" data-cerrar-modal>
        <div class="modal" data-stop>
          <div class="modal__blob"></div>
          <div style="position:relative;">
            <div class="modal__check">✓</div>
            <h3 class="modal__titulo">¡Cita confirmada!</h3>
            <p class="modal__texto">Tu reserva quedó registrada correctamente.</p>
            <div class="modal__detalle">
              ${fila('📅 Fecha', c.date)}
              ${fila('🕑 Hora', c.time)}
              ${fila('🐾 Mascota', c.mascota)}
              ${fila('🩺 Motivo', c.motivo)}
            </div>
            <button type="button" class="btn-primario btn-primario--plano" style="margin-top:22px;" data-cerrar-modal>Entendido, cerrar</button>
          </div>
        </div>
      </div>`;
  }

  function renderCliente() {
    DOM.montar('main', `
      <div class="contenedor app-main">
        ${tplHero()}
        ${tplHorarios()}
        <section class="cita-grid">
          ${tplFormulario()}
          ${tplResumen()}
        </section>
        ${tplTokens()}
      </div>`);
    DOM.montar('#capa-modal', tplModal());
  }

  /* ----- Interacciones cliente ----- */

  function onInputCampo(campo, valor) {
    estado.form[campo] = valor;
    // Limpia el error visual del campo en vivo.
    if (estado.errors[campo]) {
      delete estado.errors[campo];
      const input = DOM.sel(`[data-campo="${campo}"]`);
      if (input) input.classList.remove('campo__control--error');
      const err = DOM.sel(`[data-error-de="${campo}"]`);
      if (err) err.remove();
    }
    // Actualiza el resumen en vivo.
    if (campo === 'mascota') DOM.montar('#resumen-mascota', e(valor.trim() || '—'));
    if (campo === 'motivo')  DOM.montar('#resumen-motivo', e(valor || '—'));
  }

  function seleccionarSlot(id) {
    estado.selectedSlotId = id;
    delete estado.errors.slot;
    renderCliente();
  }

  function confirmarCita() {
    const errors = Validacion.validarCita(estado.form, estado.selectedSlotId);
    if (Object.keys(errors).length) {
      estado.errors = errors;
      renderCliente();
      return;
    }
    const sel = Horarios.buscarSlot(estado.selectedSlotId);
    const f = estado.form;

    Mascotas.registrar({ nombre: f.mascota, motivo: f.motivo });
    const consulta = Consultas.reservar({
      cliente: f.cliente, contacto: f.contacto, mascota: f.mascota,
      motivo: f.motivo, day: sel.day, slot: sel.slot,
    });
    Horarios.ocupar(sel.slot.id);
    const aviso = Notificaciones.crear(consulta);

    estado.confirm = aviso;
    estado.modalOpen = true;
    estado.form = { cliente: '', contacto: '', mascota: '', motivo: '' };
    estado.selectedSlotId = null;
    estado.errors = {};
    renderCliente();
  }

  function cerrarModal() {
    estado.modalOpen = false;
    estado.confirm = null;
    DOM.montar('#capa-modal', '');
  }

  function wireCliente() {
    const main = DOM.sel('main');
    const modal = DOM.sel('#capa-modal');

    main.addEventListener('input', (ev) => {
      const t = ev.target.closest('[data-campo]');
      if (t) onInputCampo(t.getAttribute('data-campo'), t.value);
    });
    main.addEventListener('change', (ev) => {
      const t = ev.target.closest('select[data-campo]');
      if (t) onInputCampo(t.getAttribute('data-campo'), t.value);
    });
    DOM.delegar(main, 'click', '[data-slot]', (_ev, el) => seleccionarSlot(el.getAttribute('data-slot')));
    DOM.delegar(main, 'click', '[data-submit]', () => confirmarCita());

    modal.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-cerrar-modal]')) { cerrarModal(); return; }
      if (ev.target.closest('[data-stop]')) ev.stopPropagation();
    });
  }

  /* ===================== Vista ADMIN ===================== */

  function tplFila(row) {
    const meta = Consultas.META[row.status];
    // Las pendientes ofrecen la acción de confirmar; el resto muestra el
    // badge cíclico para avanzar el ciclo de atención.
    const accion = row.status === 'pending'
      ? `<button type="button" class="btn-confirmar" data-confirmar="${row.id}">Confirmar</button>`
      : `<button type="button" class="badge badge--${meta.clase}" data-cycle="${row.id}" title="Cambiar estado">
            <span class="badge__dot"></span>${meta.label}
          </button>`;
    return `
      <div class="tabla__fila">
        <div><span class="tabla__cola">${row.queue}</span></div>
        <div class="tabla__hora">${e(row.time)}</div>
        <div class="tabla__cliente">${e(row.cliente)}</div>
        <div class="tabla__mascota"><span class="tabla__mascota-ico">🐾</span>${e(row.mascota)}</div>
        <div class="tabla__motivo">${e(row.motivo)}</div>
        <div>${accion}</div>
      </div>`;
  }

  function tplGrupo(group) {
    return `
      <div>
        <div class="tabla__grupo-head">
          <span class="tabla__grupo-fecha">${e(group.date)}</span>
          <span class="tabla__grupo-linea"></span>
          <span class="tabla__grupo-count">${group.count} citas</span>
        </div>
        ${group.rows.map(tplFila).join('')}
      </div>`;
  }

  function tplFiltrosConsultas(totalFiltrado) {
    const botones = FILTROS_CONSULTAS.map((filtro) => {
      const activo = estadoAdmin.filtroEstado === filtro.estado;
      return `
        <button type="button" class="filtro-estado${activo ? ' filtro-estado--activo' : ''}"
          data-filtro-consultas="${filtro.estado}" aria-pressed="${activo}">
          ${e(filtro.label)}
        </button>`;
    }).join('');

    return `
      <section class="admin-filtros" aria-label="Filtros de consultas">
        <div class="admin-busqueda">
          <label class="campo__label" for="buscar-consultas">Buscar consulta</label>
          <input class="campo__control admin-busqueda__input" id="buscar-consultas"
            data-buscar-consultas value="${e(estadoAdmin.busqueda)}"
            placeholder="Mascota o due&ntilde;o" autocomplete="off">
        </div>
        <div class="admin-filtros__acciones" role="group" aria-label="Filtrar por estado">
          ${botones}
        </div>
        <div class="admin-filtros__total">${totalFiltrado} visibles</div>
      </section>`;
  }

  function renderAdmin() {
    const c = Consultas.contadores();
    const filtros = {
      estado: estadoAdmin.filtroEstado,
      busqueda: estadoAdmin.busqueda,
    };
    const grupos = Consultas.agrupadasPorFecha(filtros);
    const totalFiltrado = grupos.reduce((total, grupo) => total + grupo.count, 0);
    const cuerpo = grupos.length
      ? grupos.map(tplGrupo).join('')
      : '<div class="admin-vacio">No hay consultas que coincidan con el filtro.</div>';

    DOM.montar('main', `
      <div class="contenedor app-main">
        <div class="admin-head">
          <div>
            <h1 class="admin-head__titulo">Panel de citas</h1>
            <p class="admin-head__sub">Cola de atención ordenada por fecha y hora (FIFO)</p>
          </div>
          <div class="contadores">
            <div class="contador"><span class="contador__dot contador__dot--pending"></span><span class="contador__num">${c.pending}</span><span class="contador__lbl">Pendientes</span></div>
            <div class="contador"><span class="contador__dot contador__dot--confirmed"></span><span class="contador__num">${c.confirmed}</span><span class="contador__lbl">Confirmadas</span></div>
            <div class="contador"><span class="contador__dot contador__dot--progreso"></span><span class="contador__num">${c.in_progress}</span><span class="contador__lbl">En progreso</span></div>
            <div class="contador"><span class="contador__dot contador__dot--done"></span><span class="contador__num">${c.done}</span><span class="contador__lbl">Atendidas</span></div>
            <div class="contador"><span class="contador__dot contador__dot--canceled"></span><span class="contador__num">${c.canceled}</span><span class="contador__lbl">Canceladas</span></div>
          </div>
        </div>
        ${tplFiltrosConsultas(totalFiltrado)}
        <div class="tabla-wrap">
          <div class="tabla-scroll">
            <div class="tabla">
              <div class="tabla__head">
                <div>Cola</div><div>Hora</div><div>Cliente</div><div>Mascota</div><div>Motivo</div><div>Estado</div>
              </div>
              ${cuerpo}
            </div>
          </div>
        </div>
        <p class="admin-ayuda">💡 Confirma las consultas pendientes para asignar fecha y hora de atención y avisar al cliente. Una vez confirmadas, toca el estado para avanzar el ciclo: Confirmada → En progreso → Atendida. El orden de cola refleja el ingreso (FIFO) por fecha y hora.</p>
        ${tplTokens()}
      </div>`);
    DOM.montar('#capa-modal', tplModalAdmin());
  }

  /* ----- Modal de confirmación (admin) ----- */

  function tplModalAdmin() {
    if (estadoAdmin.confirmId != null) return tplConfirmarForm();
    if (estadoAdmin.exito) return tplConfirmarExito();
    return '';
  }

  function tplConfirmarForm() {
    const c = Consultas.listar().find((x) => x.id === estadoAdmin.confirmId);
    if (!c) return '';
    const opciones = Horarios.listarDias().map((d) =>
      `<option value="${d.rank}"${d.rank === c.rank ? ' selected' : ''}>${e(d.label)} · ${e(d.date)}</option>`
    ).join('');
    const fila = (et, val) => `<div class="modal__fila"><dt>${et}</dt><dd>${e(val)}</dd></div>`;
    return `
      <div class="modal-overlay">
        <div class="modal modal--form">
          <div class="modal__blob"></div>
          <div style="position:relative;">
            <h3 class="modal__titulo">Confirmar consulta</h3>
            <p class="modal__texto">Revisa los datos y asigna la fecha y hora de atención.</p>
            <div class="modal__detalle">
              ${fila('👤 Cliente', c.cliente)}
              ${fila('📞 Contacto', c.contacto || '—')}
              ${fila('🐾 Mascota', c.mascota)}
              ${fila('🩺 Motivo', c.motivo)}
            </div>
            <div class="confirmar-form">
              <div class="campo">
                <label class="campo__label">Fecha de atención</label>
                <select class="campo__control" data-confirmar-fecha>${opciones}</select>
              </div>
              <div class="campo">
                <label class="campo__label">Hora de atención</label>
                <input class="campo__control" type="time" value="${e(c.time)}" data-confirmar-hora>
              </div>
            </div>
            <button type="button" class="btn-primario" style="margin-top:22px;" data-confirmar-ok="${c.id}">Confirmar cita</button>
            <button type="button" class="btn-secundario" data-cerrar-modal>Cancelar</button>
          </div>
        </div>
      </div>`;
  }

  function tplConfirmarExito() {
    const c = estadoAdmin.exito;
    const fila = (et, val) => `<div class="modal__fila"><dt>${et}</dt><dd>${e(val)}</dd></div>`;
    return `
      <div class="modal-overlay">
        <div class="modal">
          <div class="modal__blob"></div>
          <div style="position:relative;">
            <div class="modal__check">✓</div>
            <h3 class="modal__titulo">¡Consulta confirmada!</h3>
            <p class="modal__texto">Se notificó al cliente la fecha y hora de atención.</p>
            <div class="modal__detalle">
              ${fila('📅 Fecha', c.date)}
              ${fila('🕑 Hora', c.time)}
              ${fila('🐾 Mascota', c.mascota)}
              ${fila('👤 Cliente', c.cliente)}
            </div>
            <button type="button" class="btn-primario btn-primario--plano" style="margin-top:22px;" data-cerrar-modal>Entendido, cerrar</button>
          </div>
        </div>
      </div>`;
  }

  function abrirConfirmar(id) {
    estadoAdmin.confirmId = id;
    estadoAdmin.exito = null;
    DOM.montar('#capa-modal', tplModalAdmin());
  }

  function confirmarConsulta(id) {
    const sel = DOM.sel('[data-confirmar-fecha]');
    const horaInput = DOM.sel('[data-confirmar-hora]');
    const rank = sel ? Number(sel.value) : null;
    const dia = Horarios.listarDias().find((d) => d.rank === rank);
    const time = horaInput ? horaInput.value : '';

    const actualizada = Consultas.confirmar(id, {
      date: dia ? dia.date : undefined,
      rank: dia ? dia.rank : undefined,
      time: time || undefined,
    });
    if (actualizada) Notificaciones.crear(actualizada);

    estadoAdmin.confirmId = null;
    estadoAdmin.exito = actualizada;
    renderAdmin();
  }

  function cerrarModalAdmin() {
    estadoAdmin.confirmId = null;
    estadoAdmin.exito = null;
    DOM.montar('#capa-modal', '');
  }

  function buscarConsultas(valor) {
    estadoAdmin.busqueda = valor;
    renderAdmin();
    const buscador = DOM.sel('[data-buscar-consultas]');
    if (buscador) {
      buscador.focus();
      buscador.setSelectionRange(buscador.value.length, buscador.value.length);
    }
  }

  function filtrarConsultas(estado) {
    estadoAdmin.filtroEstado = estado;
    renderAdmin();
  }

  function wireAdmin() {
    const main = DOM.sel('main');
    main.addEventListener('input', (ev) => {
      const buscador = ev.target.closest('[data-buscar-consultas]');
      if (buscador) buscarConsultas(buscador.value);
    });
    DOM.delegar(main, 'click', '[data-cycle]', (_ev, el) => {
      Consultas.avanzarEstado(Number(el.getAttribute('data-cycle')));
      renderAdmin();
    });
    DOM.delegar(main, 'click', '[data-filtro-consultas]', (_ev, el) =>
      filtrarConsultas(el.getAttribute('data-filtro-consultas')));
    DOM.delegar(main, 'click', '[data-confirmar]', (_ev, el) =>
      abrirConfirmar(Number(el.getAttribute('data-confirmar'))));

    const modal = DOM.sel('#capa-modal');
    modal.addEventListener('click', (ev) => {
      const ok = ev.target.closest('[data-confirmar-ok]');
      if (ok) { confirmarConsulta(Number(ok.getAttribute('data-confirmar-ok'))); return; }
      if (ev.target.closest('[data-cerrar-modal]')) { cerrarModalAdmin(); return; }
      // Clic en el fondo (overlay) cierra; clic dentro del modal no.
      if (ev.target.classList.contains('modal-overlay')) cerrarModalAdmin();
    });
  }

  /* ===================== Arranque ===================== */

  function init() {
    DOM.montar('header', tplHeader());
    DOM.sel('header').classList.add('app-header');

    // Capa dedicada al modal (fuera del flujo del main).
    if (!DOM.sel('#capa-modal')) {
      const capa = document.createElement('div');
      capa.id = 'capa-modal';
      document.body.appendChild(capa);
    }

    // Conmutador de rol en el header.
    DOM.delegar(DOM.sel('header'), 'click', '[data-ir]', (_ev, el) => {
      el.getAttribute('data-ir') === 'admin' ? Router.irAAdmin() : Router.irACliente();
    });

    if (Auth.esAdmin()) {
      renderAdmin();
      wireAdmin();
    } else {
      renderCliente();
      wireCliente();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
