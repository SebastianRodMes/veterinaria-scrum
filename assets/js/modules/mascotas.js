/**
 * Módulo de mascotas — registro y datos de mascotas.
 *
 * Según el alcance acordado, la mascota se reduce a lo básico:
 * nombre + motivo de la atención. El registro se persiste vía Storage.
 *
 * Interfaz pública: registrar, listar.
 */
const Mascotas = (() => {
  const CLAVE = 'mascotas';

  function listar() {
    return Storage.leer(CLAVE, []);
  }

  /** Registra una mascota ({ nombre, motivo }) y devuelve el registro. */
  function registrar({ nombre, motivo }) {
    const registro = {
      nombre: (nombre || '').trim(),
      motivo: motivo || '',
    };
    const todas = listar();
    todas.push(registro);
    Storage.guardar(CLAVE, todas);
    return registro;
  }

  return { registrar, listar };
})();
