/**
 * Tema visual — preferencia de tema claro / oscuro.
 *
 * La preferencia se persiste vía Storage (clave 'tema') y se aplica como
 * atributo `data-tema` sobre el elemento <html>. Las reglas de
 * `assets/css/tema-oscuro.css` reaccionan a `html[data-tema="oscuro"]`.
 *
 * Este archivo se carga en el <head> (antes de pintar el body) y aplica el
 * tema guardado de inmediato, evitando el parpadeo claro→oscuro al cargar.
 *
 * Interfaz pública: actual, esOscuro, aplicar, establecer, alternar.
 */
const Tema = (() => {
  const CLAVE = 'tema';
  const CLARO = 'claro';
  const OSCURO = 'oscuro';

  /** Tema guardado ('claro' por defecto). */
  function actual() {
    return Storage.leer(CLAVE, CLARO) === OSCURO ? OSCURO : CLARO;
  }

  const esOscuro = () => actual() === OSCURO;

  /** Aplica un tema (o el actual) al atributo data-tema de <html>. */
  function aplicar(tema) {
    const t = tema === OSCURO ? OSCURO : CLARO;
    document.documentElement.setAttribute('data-tema', t);
    return t;
  }

  /** Guarda la preferencia y la aplica. Devuelve el tema resultante. */
  function establecer(tema) {
    const t = tema === OSCURO ? OSCURO : CLARO;
    Storage.guardar(CLAVE, t);
    return aplicar(t);
  }

  /** Alterna entre claro y oscuro. Devuelve el tema resultante. */
  function alternar() {
    return establecer(esOscuro() ? CLARO : OSCURO);
  }

  // Aplica el tema guardado al cargar (en el <head>, antes del primer pintado).
  aplicar(actual());

  return { actual, esOscuro, aplicar, establecer, alternar, CLARO, OSCURO };
})();
