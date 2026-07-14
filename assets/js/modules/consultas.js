const Consultas = {
  listar(filtros = {}) {
    let consultas = Storage.listar("consultas");
    if (filtros.estado) {
      consultas = consultas.filter(c => c.estado === filtros.estado);
    }
    if (filtros.mascotaId) {
      consultas = consultas.filter(c => c.mascotaId === filtros.mascotaId);
    }
    return consultas;
  },

  obtener(id) {
    return Storage.listar("consultas").find(c => c.id === id) || null;
  },

  completar(id, notasClinicas) {
    return Storage.guardarItem("consultas", id, {
      estado: "completado",
      notasClinicas: {
        peso: notasClinicas.peso,
        sintomas: notasClinicas.sintomas,
        diagnostico: notasClinicas.diagnostico,
        tratamiento: notasClinicas.tratamiento,
        fechaRegistro: new Date().toISOString()
      }
    });
  },

  historialMascota(mascotaId) {
    return this.listar({ estado: "completado" })
      .filter(c => c.mascotaId === mascotaId)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  },

  reservar(datos) {
    const consulta = {
      id: "c" + Date.now(),
      mascotaId: datos.mascotaId,
      fecha: datos.fecha,
      horario: datos.horario,
      estado: "pendiente",
      notasClinicas: null
    };
    return Storage.guardarItem("consultas", consulta.id, consulta);
  },

  cambiarEstado(id, estado) {
    return Storage.guardarItem("consultas", id, { estado });
  }
};
