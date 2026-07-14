function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function crear(tag, attrs = {}, hijos = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "className") el.className = v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  }
  for (const hijo of hijos) {
    el.append(typeof hijo === "string" ? document.createTextNode(hijo) : hijo);
  }
  return el;
}

function modal(titulo, contenido) {
  const overlay = crear("div", { className: "modal-overlay" }, [
    crear("div", { className: "modal" }, [
      crear("div", { className: "modal-header" }, [
        crear("h3", {}, [titulo]),
        crear("button", { className: "modal-cerrar", onClick: () => overlay.remove() }, ["×"])
      ]),
      crear("div", { className: "modal-body" }, [
        typeof contenido === "string" ? contenido : contenido
      ])
    ])
  ]);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.append(overlay);
  return { cerrar: () => overlay.remove() };
}
