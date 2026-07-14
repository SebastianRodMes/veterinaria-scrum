const Storage = {
  obtener(clave) {
    const raw = localStorage.getItem(clave);
    return raw ? JSON.parse(raw) : null;
  },

  guardar(clave, datos) {
    localStorage.setItem(clave, JSON.stringify(datos));
  },

  listar(clave) {
    return this.obtener(clave) || [];
  },

  guardarItem(clave, id, item) {
    const items = this.listar(clave);
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...item };
    } else {
      items.push(item);
    }
    this.guardar(clave, items);
    return idx >= 0 ? items[idx] : item;
  }
};
