/**
 * Página de cuenta — registro e inicio de sesión del cliente.
 *
 * Presentación (templates + wiring) de la página `cuenta.html`. La lógica
 * de cuentas vive en `modules/auth.js` y la validación en `lib/validacion.js`.
 *
 * Flujo: el cliente crea una cuenta (se guarda el usuario) y luego inicia
 * sesión (se guarda la sesión activa y se redirige a `index.html`, donde
 * el formulario de reservas aparece con sus datos precargados).
 */
(() => {
  'use strict';

  const CLINICA = 'Pet App';
  const e = DOM.escapar;

  // Modo activo del panel: 'login' o 'registro'.
  const estado = {
    modo: 'login',
    login: { email: '', password: '' },
    registro: { nombre: '', email: '', password: '', password2: '', rol: 'cliente' },
    errors: {},
    aviso: null, // { tipo: 'ok' | 'error', texto }
  };

  /* ===================== Plantillas ===================== */

  function tplHeader() {
    return `
      <div class="contenedor app-header__inner">
        <a class="marca marca--enlace" data-ir-inicio href="index.html">
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
        </a>
        <div class="app-header__acciones">
          ${tplTema()}
          <a class="cuenta-volver" data-ir-inicio href="index.html">← Volver al inicio</a>
        </div>
      </div>`;
  }

  /** Botón conmutador de tema claro / oscuro. */
  function tplTema() {
    const oscuro = Tema.esOscuro();
    return `
      <button type="button" class="tema-toggle" data-tema-toggle
              aria-pressed="${oscuro}"
              title="${oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}"
              aria-label="${oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}">
        ${oscuro ? '☀️' : '🌙'}
      </button>`;
  }

  function tplCampo(zona, campo, etiqueta, attrs) {
    const valor = estado[zona][campo];
    const clase = 'campo__control' + (estado.errors[campo] ? ' campo__control--error' : '');
    const err = estado.errors[campo]
      ? `<div class="campo__error" data-error-de="${campo}">⚠ ${e(estado.errors[campo])}</div>`
      : '';
    return `
      <div class="campo">
        <label class="campo__label">${etiqueta}</label>
        <input class="${clase}" data-zona="${zona}" data-campo="${campo}" value="${e(valor)}" ${attrs}>
        ${err}
      </div>`;
  }

  function tplAviso() {
    if (!estado.aviso) return '';
    const a = estado.aviso;
    return `<div class="cuenta-aviso cuenta-aviso--${a.tipo}">${e(a.texto)}</div>`;
  }

  function tplLogin() {
    return `
      <form class="cuenta-form" data-form="login" novalidate>
        ${tplCampo('login', 'email', 'Correo electrónico', 'type="email" placeholder="correo@ejemplo.com" autocomplete="email"')}
        ${tplCampo('login', 'password', 'Contraseña', 'type="password" placeholder="••••••••" autocomplete="current-password"')}
        ${tplAviso()}
        <button type="submit" class="btn-primario">Iniciar sesión</button>
      </form>
      <p class="cuenta-pie">
        ¿No tienes cuenta?
        <button type="button" class="cuenta-enlace" data-modo="registro">Regístrate</button>
      </p>`;
  }

  function tplSelectRol() {
    const valor = estado.registro.rol;
    const opt = (v, txt) => `<option value="${v}"${valor === v ? ' selected' : ''}>${txt}</option>`;
    const err = estado.errors.rol
      ? `<div class="campo__error" data-error-de="rol">⚠ ${e(estado.errors.rol)}</div>`
      : '';
    return `
      <div class="campo">
        <label class="campo__label">Tipo de cuenta</label>
        <select class="campo__control" data-zona="registro" data-campo="rol">
          ${opt('cliente', 'Cliente (dueño de mascota)')}
          ${opt('admin', 'Administrador (clínica)')}
        </select>
        ${err}
      </div>`;
  }

  function tplRegistro() {
    return `
      <form class="cuenta-form" data-form="registro" novalidate>
        ${tplCampo('registro', 'nombre', 'Nombre completo', 'type="text" placeholder="Ej. María López" autocomplete="name"')}
        ${tplCampo('registro', 'email', 'Correo electrónico', 'type="email" placeholder="correo@ejemplo.com" autocomplete="email"')}
        ${tplSelectRol()}
        ${tplCampo('registro', 'password', 'Contraseña', 'type="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password"')}
        ${tplCampo('registro', 'password2', 'Repite la contraseña', 'type="password" placeholder="••••••••" autocomplete="new-password"')}
        ${tplAviso()}
        <button type="submit" class="btn-primario">Crear cuenta</button>
      </form>
      <p class="cuenta-pie">
        ¿Ya tienes cuenta?
        <button type="button" class="cuenta-enlace" data-modo="login">Inicia sesión</button>
      </p>`;
  }

  function render() {
    const esLogin = estado.modo === 'login';
    const tab = (modo, txt) =>
      `<button type="button" class="tab${estado.modo === modo ? ' tab--activo' : ''}" data-modo="${modo}">${txt}</button>`;

    DOM.montar('main', `
      <div class="contenedor cuenta-main">
        <section class="cuenta-card card">
          <div class="cuenta-card__cabecera">
            <div class="pill">🐾 ACCESO DE CLIENTES</div>
            <h1 class="cuenta-card__titulo">${esLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h1>
            <p class="cuenta-card__sub">${esLogin
              ? 'Inicia sesión para agendar la cita de tu mascota con tus datos guardados.'
              : 'Regístrate para asociar tus mascotas y tus citas a tu cuenta.'}</p>
          </div>
          <div class="tabs cuenta-tabs">
            ${tab('login', 'Iniciar sesión')}
            ${tab('registro', 'Crear cuenta')}
          </div>
          ${esLogin ? tplLogin() : tplRegistro()}
        </section>
      </div>`);
  }

  /* ===================== Interacciones ===================== */

  function cambiarModo(modo) {
    if (estado.modo === modo) return;
    estado.modo = modo;
    estado.errors = {};
    estado.aviso = null;
    render();
  }

  function onInput(zona, campo, valor) {
    estado[zona][campo] = valor;
    if (estado.errors[campo]) {
      delete estado.errors[campo];
      const input = DOM.sel(`[data-zona="${zona}"][data-campo="${campo}"]`);
      if (input) input.classList.remove('campo__control--error');
      const err = DOM.sel(`[data-error-de="${campo}"]`);
      if (err) err.remove();
    }
  }

  function enviarLogin() {
    estado.aviso = null;
    const errors = Validacion.validarLogin(estado.login);
    if (Object.keys(errors).length) {
      estado.errors = errors;
      render();
      return;
    }
    const res = Auth.iniciarSesion(estado.login.email, estado.login.password);
    if (!res.ok) {
      estado.errors = {};
      estado.aviso = { tipo: 'error', texto: res.error };
      render();
      return;
    }
    // Sesión guardada: redirige según el rol de la cuenta.
    if (res.usuario.rol === 'admin') Router.irAAdmin();
    else Router.irACliente();
  }

  function enviarRegistro() {
    estado.aviso = null;
    const errors = Validacion.validarRegistro(estado.registro);
    if (Object.keys(errors).length) {
      estado.errors = errors;
      render();
      return;
    }
    const res = Auth.registrar(estado.registro);
    if (!res.ok) {
      estado.errors = { email: res.error };
      render();
      return;
    }
    // Usuario creado: pasamos al login con el correo precargado para que
    // inicie sesión (paso que guarda la sesión activa).
    const correo = res.usuario.email;
    estado.modo = 'login';
    estado.login = { email: correo, password: '' };
    estado.registro = { nombre: '', email: '', password: '', password2: '', rol: 'cliente' };
    estado.errors = {};
    estado.aviso = { tipo: 'ok', texto: '¡Cuenta creada! Inicia sesión para continuar.' };
    render();
  }

  function wire() {
    const header = DOM.sel('header');
    const main = DOM.sel('main');

    DOM.delegar(header, 'click', '[data-ir-inicio]', (ev) => {
      ev.preventDefault();
      Router.irACliente();
    });
    DOM.delegar(header, 'click', '[data-tema-toggle]', () => {
      Tema.alternar();
      DOM.montar('header', tplHeader());
    });

    main.addEventListener('input', (ev) => {
      const t = ev.target.closest('input[data-campo]');
      if (t) onInput(t.getAttribute('data-zona'), t.getAttribute('data-campo'), t.value);
    });
    main.addEventListener('change', (ev) => {
      const t = ev.target.closest('select[data-campo]');
      if (t) onInput(t.getAttribute('data-zona'), t.getAttribute('data-campo'), t.value);
    });
    DOM.delegar(main, 'click', '[data-modo]', (_ev, el) => cambiarModo(el.getAttribute('data-modo')));
    main.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const form = ev.target.closest('[data-form]');
      if (!form) return;
      form.getAttribute('data-form') === 'login' ? enviarLogin() : enviarRegistro();
    });
  }

  function init() {
    // Si ya hay sesión activa, no tiene sentido pedir acceso: a la landing.
    if (Auth.sesionActiva()) {
      Router.irACliente();
      return;
    }
    DOM.montar('header', tplHeader());
    DOM.sel('header').classList.add('app-header');

    // Permite abrir directamente la pestaña de registro con ?modo=registro.
    if (location.search.indexOf('modo=registro') !== -1) estado.modo = 'registro';

    render();
    wire();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
