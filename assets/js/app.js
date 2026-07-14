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
