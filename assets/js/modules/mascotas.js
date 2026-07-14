const Mascotas = {
  obtener(id) {
    return Storage.listar("mascotas").find(m => m.id === id) || null;
  },

  listar() {
    return Storage.listar("mascotas");
  },

  registrar(datos) {
    const mascota = {
      id: "m" + Date.now(),
      nombre: datos.nombre,
      especie: datos.especie,
      raza: datos.raza || "",
      clienteId: datos.clienteId
    };
    return Storage.guardarItem("mascotas", mascota.id, mascota);
  }
};
