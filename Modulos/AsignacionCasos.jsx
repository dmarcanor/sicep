import React, { useEffect, useMemo, useState } from "react";
import { api } from "../src/api";
import { usePinAction } from "../src/hooks/usePinAction";

const emptyForm = {
  codigo: "",
  nombres: "",
  sector: "",
  vulneracion: "",
  prioridad: "Media",
  observacion: "",
};

function normalizar(texto = "") {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getChipClass(valor = "") {
  const key = normalizar(valor).replace(/\s+/g, "");
  if (key === "alta") return "pill red";
  if (key === "media") return "pill amber";
  if (key === "baja") return "pill green";
  if (key === "registrado") return "chip registrado";
  if (key === "enrevision" || key === "enrevisión") return "chip enrevision";
  if (key === "aprobado") return "chip aprobado";
  if (key === "observado") return "chip observado";
  return "pill default";
}

function puntajeEspecialidad(caso, consejero) {
  const texto = normalizar(`${caso.vulneracion} ${caso.sector} ${caso.nombres}`);
  return consejero.especialidades.reduce((acc, item) => {
    return texto.includes(normalizar(item)) ? acc + 1 : acc;
  }, 0);
}

function fechaBonita(fechaISO) {
  if (!fechaISO) return "—";
  const fecha = new Date(`${fechaISO}T00:00:00`);
  return fecha.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getSiguienteRotativo(consejeros, asignaciones) {
  const carga = consejeros.map((c) => {
    const usados = asignaciones.filter((a) => a.consejeroId === c.id).length;
    return { ...c, usados };
  });

  const min = Math.min(...carga.map((c) => c.usados));
  return carga.filter((c) => c.usados === min);
}

export default function AsignacionCasosConsejeros() {
  const [consejeros, setConsejeros] = useState([]);
  const [casos, setCasos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroConsejero, setFiltroConsejero] = useState("todos");
  const [modalManual, setModalManual] = useState(false);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [formNuevo, setFormNuevo] = useState(emptyForm);
  const [consejeroManual, setConsejeroManual] = useState("");
  const [toast, setToast] = useState("");
  const { executeWithPin, PinModalWrapper } = usePinAction();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [casosData, usuariosData] = await Promise.all([
        api.getCasos(),
        api.getUsuarios(),
      ]);
      
      const consejerosData = usuariosData
        .filter(u => u.role === 'consejero' || u.role === 'supervisor')
        .map(u => ({
          id: u.id,
          nombre: u.display_name || u.name,
          despacho: u.position || 'Consejería',
          fuerte: '',
          especialidades: [],
          color: 'blue',
        }));
      
      setCasos(casosData);
      setConsejeros(consejerosData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const conteoConsejeros = useMemo(() => {
    return consejeros.map((c) => ({
      ...c,
      total: casos.filter((caso) => caso.asignadoA === c.nombre).length,
    }));
  }, [consejeros, casos]);

  const casosFiltrados = useMemo(() => {
    const q = normalizar(busqueda);
    return casos.filter((caso) => {
      const cumpleBusqueda =
        !q ||
        [caso.codigo, caso.nombres, caso.sector, caso.vulneracion, caso.asignadoA, caso.despacho]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const cumpleTipo =
        filtroTipo === "todos" || normalizar(caso.asignacion).replace(/\s+/g, "") === normalizar(filtroTipo).replace(/\s+/g, "");
      const cumpleConsejero =
        filtroConsejero === "todos" || caso.asignadoA === filtroConsejero;

      return cumpleBusqueda && cumpleTipo && cumpleConsejero;
    });
  }, [casos, busqueda, filtroTipo, filtroConsejero]);

  const resumen = useMemo(() => {
    const total = casos.length;
    const rotativas = casos.filter((c) => c.asignacion === "Rotativa").length;
    const manuales = casos.filter((c) => c.asignacion === "Manual").length;
    const equilibrio = consejeros.map((c) => casos.filter((caso) => caso.asignadoA === c.nombre).length);
    const max = Math.max(...equilibrio, 0);
    const min = Math.min(...equilibrio, 0);
    const diferencia = max - min;
    return { total, rotativas, manuales, diferencia };
  }, [casos, consejeros]);

  const mostrarToast = (mensaje) => {
    setToast(mensaje);
    window.clearTimeout(window.__asigToast);
    window.__asigToast = window.setTimeout(() => setToast(""), 2400);
  };

  const asignarAutomatica = (caso) => {
    const candidatos = getSiguienteRotativo(consejeros, casos);

    let ganador = candidatos[0];
    let mejorPuntaje = -1;

    candidatos.forEach((c) => {
      const puntaje = puntajeEspecialidad(caso, c);
      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        ganador = c;
      }
    });

    return ganador || consejeros[0];
  };

  const guardarCasoNuevo = () => {
    if (!formNuevo.codigo || !formNuevo.nombres || !formNuevo.sector || !formNuevo.vulneracion) {
      mostrarToast("Complete los campos obligatorios para continuar.");
      return;
    }

    const casoBase = {
      id: Date.now(),
      codigo: formNuevo.codigo,
      nombres: formNuevo.nombres,
      sector: formNuevo.sector,
      vulneracion: formNuevo.vulneracion,
      prioridad: formNuevo.prioridad,
      estado: "Registrado",
      fecha: new Date().toISOString().slice(0, 10),
      observacion: formNuevo.observacion || "Sin observación adicional.",
    };

    const consejeroElegido = asignarAutomatica(casoBase);

    const casoFinal = {
      ...casoBase,
      asignacion: "Rotativa",
      asignadoA: consejeroElegido.nombre,
      despacho: consejeroElegido.despacho,
      observacion:
        formNuevo.observacion ||
        `Asignado automáticamente por equilibrio de carga y afinidad temática a ${consejeroElegido.nombre}.`,
    };

    setCasos((prev) => [casoFinal, ...prev]);
    setFormNuevo(emptyForm);
    setModalNuevo(false);
    mostrarToast(`Caso ${casoFinal.codigo} asignado a ${consejeroElegido.nombre}.`);
  };

  const abrirDetalle = (caso) => {
    setCasoSeleccionado(caso);
    setModalDetalle(true);
  };

  const abrirManual = (caso) => {
    setCasoSeleccionado(caso);
    setConsejeroManual(caso.asignadoA || "");
    setModalManual(true);
  };

  const aplicarAsignacionManual = () => {
    if (!casoSeleccionado || !consejeroManual) {
      mostrarToast("Seleccione un consejero para reasignar.");
      return;
    }

    const consejero = consejeros.find((c) => c.nombre === consejeroManual);
    if (!consejero) return;

    setCasos((prev) =>
      prev.map((caso) =>
        caso.id === casoSeleccionado.id
          ? {
              ...caso,
              asignacion: "Manual",
              asignadoA: consejero.nombre,
              despacho: consejero.despacho,
              observacion: `Reasignado manualmente por la Presidencia a ${consejero.nombre}.`,
            }
          : caso
      )
    );

    setModalManual(false);
    mostrarToast(`Reasignado a ${consejero.nombre}.`);
  };

  const reasignarAutomaticamente = (caso) => {
    const consejero = asignarAutomatica(caso);
    setCasos((prev) =>
      prev.map((item) =>
        item.id === caso.id
          ? {
              ...item,
              asignacion: "Rotativa",
              asignadoA: consejero.nombre,
              despacho: consejero.despacho,
              observacion: `Asignado automáticamente según equilibrio de carga y especialidad a ${consejero.nombre}.`,
            }
          : item
      )
    );
    mostrarToast(`Caso ${caso.codigo} reasignado automáticamente.`);
  };

  return (
    <section className="modulo expedientes">
      <div className="expedientes-header">
        <div>
          <span className="expedientes-badge">Gestión operativa</span>
          <h2>Asignación de Casos a Consejeros</h2>
        </div>

        <button className="btn-primary" onClick={() => setModalNuevo(true)}>
          + Registrar y asignar caso
        </button>
      </div>

      {toast ? <div className="toast-exito">{toast}</div> : null}

      <div className="stats-grid">
        <article className="stat-card blue">
          <div className="stat-top">
            <span className="stat-title">Casos asignados</span>
            <span className="stat-dot" />
          </div>
          <div className="stat-value">{resumen.total}</div>
          <div className="stat-subtitle">Total de registros con despacho definido</div>
        </article>

        <article className="stat-card green">
          <div className="stat-top">
            <span className="stat-title">Asignaciones</span>
            <span className="stat-dot" />
          </div>
          <div className="stat-value">{resumen.manuales}</div>
          <div className="stat-subtitle">Asignaciones efectuadas</div>
        </article>

      </div>

      <div className="panel">
        <h3>Distribución por consejero</h3>

        <div className="flow">
          {conteoConsejeros.map((c, index) => {
            const porcentaje = casos.length ? Math.round((c.total / casos.length) * 100) : 0;
            return (
              <div key={c.id}>
                <span>{index + 1}</span>
                <strong>{c.nombre}</strong>
                <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>{c.fuerte}</div>
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#20354F" }}>
                  {c.total} casos · {porcentaje}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel table-panel">
        <div className="barraFiltros filters">
          <input
            className="datatable-input"
            type="text"
            placeholder="Buscar por código, nombre, sector o consejero..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select className="datatable-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="todos">Todas las asignaciones</option>
            <option value="Rotativa">Rotativa</option>
            <option value="Manual">Manual</option>
          </select>

          <select className="datatable-select" value={filtroConsejero} onChange={(e) => setFiltroConsejero(e.target.value)}>
            <option value="todos">Todos los consejeros</option>
            {consejeros.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="contenedorTabla table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre del NNA</th>
                <th>Sector</th>
                <th>Vulneración</th>
                <th>Prioridad</th>
                <th>Asignación</th>
                <th>Consejero</th>
                <th>Despacho</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {casosFiltrados.map((caso) => (
                <tr key={caso.id}>
                  <td className="mono">{caso.codigo}</td>
                  <td>{caso.nombres}</td>
                  <td>{caso.sector}</td>
                  <td>{caso.vulneracion}</td>
                  <td>
                    <span className={getChipClass(caso.prioridad)}>{caso.prioridad}</span>
                  </td>
                  <td>
                    <span className={caso.asignacion === "Manual" ? "pill amber" : "pill blue"}>{caso.asignacion}</span>
                  </td>
                  <td>{caso.asignadoA}</td>
                  <td>{caso.despacho}</td>
                  <td>{fechaBonita(caso.fecha)}</td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => abrirManual(caso)}>Asignar</button>
                    </div>
                  </td>
                </tr>
              ))}

              {!casosFiltrados.length ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>
                    No hay casos para los filtros aplicados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {modalNuevo ? (
        <div className="expedientes-modal-overlay" onClick={() => setModalNuevo(false)}>
          <div className="expedientes-modal modal-nuevo" onClick={(e) => e.stopPropagation()}>
            <div className="expedientes-modal-header">
              <div>
                <span className="expedientes-badge">Registro inmediato</span>
                <h3>Guardar y asignar caso automáticamente</h3>
                <p>Al guardar, el sistema evalúa carga de trabajo y afinidad temática para decidir el despacho receptor.</p>
              </div>
              <button className="btn-close" onClick={() => setModalNuevo(false)}>
                ✕
              </button>
            </div>

            <div className="form-nuevo-expediente">
              <div className="campo">
                <label>Código</label>
                <input
                  type="text"
                  value={formNuevo.codigo}
                  onChange={(e) => setFormNuevo((p) => ({ ...p, codigo: e.target.value }))}
                  placeholder="URD-2026-00015"
                />
              </div>

              <div className="campo">
                <label>Nombre del NNA</label>
                <input
                  type="text"
                  value={formNuevo.nombres}
                  onChange={(e) => setFormNuevo((p) => ({ ...p, nombres: e.target.value }))}
                  placeholder="Nombres y apellidos"
                />
              </div>

              <div className="campo">
                <label>Sector</label>
                <input
                  type="text"
                  value={formNuevo.sector}
                  onChange={(e) => setFormNuevo((p) => ({ ...p, sector: e.target.value }))}
                  placeholder="Sector o comunidad"
                />
              </div>

              <div className="campo">
                <label>Tipo de vulneración</label>
                <select value={formNuevo.vulneracion} onChange={(e) => setFormNuevo((p) => ({ ...p, vulneracion: e.target.value }))}>
                  <option value="">Seleccione</option>
                  <option value="Civil / Familiar">Civil / Familiar</option>
                  <option value="Integridad Física / Maltrato">Integridad Física / Maltrato</option>
                  <option value="Derecho a la Educación">Derecho a la Educación</option>
                  <option value="Negligencia">Negligencia</option>
                  <option value="Abuso">Abuso</option>
                </select>
              </div>

              <div className="campo">
                <label>Prioridad</label>
                <select value={formNuevo.prioridad} onChange={(e) => setFormNuevo((p) => ({ ...p, prioridad: e.target.value }))}>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              <div className="campo ancho">
                <label>Observación inicial</label>
                <textarea
                  rows="4"
                  value={formNuevo.observacion}
                  onChange={(e) => setFormNuevo((p) => ({ ...p, observacion: e.target.value }))}
                  placeholder="Notas de recepción para orientar la asignación."
                />
              </div>
            </div>

            <div className="detalle-footer">
              <button className="btn-secondary" onClick={() => setModalNuevo(false)}>
                Cancelar
              </button>
              <button className="btn-primary small" onClick={guardarCasoNuevo} style={{ marginLeft: 10 }}>
                Guardar y asignar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalManual && casoSeleccionado ? (
        <div className="expedientes-modal-overlay" onClick={() => setModalManual(false)}>
          <div className="expedientes-modal modal-nuevo" onClick={(e) => e.stopPropagation()}>
            <div className="expedientes-modal-header">
              <div>
                <span className="expedientes-badge">Asignación manual</span>
                <h3>Reasignar caso a un consejero específico</h3>
                <p>La Presidenta puede intervenir sobre la distribución automática cuando el análisis del caso lo amerite.</p>
              </div>
              <button className="btn-close" onClick={() => setModalManual(false)}>
                ✕
              </button>
            </div>

            <div className="detalle-grid">
              <div className="detalle-card">
                <h4>Datos del caso</h4>
                <p><span className="detalle-label">Código</span>{casoSeleccionado.codigo}</p>
                <p><span className="detalle-label">Nombre</span>{casoSeleccionado.nombres}</p>
                <p><span className="detalle-label">Vulneración</span>{casoSeleccionado.vulneracion}</p>
                <p><span className="detalle-label">Asignación actual</span>{casoSeleccionado.asignadoA}</p>
              </div>

              <div className="detalle-card">
                <h4>Selección de consejero</h4>
                <div className="campo">
                  <label>Consejero titular</label>
                  <select value={consejeroManual} onChange={(e) => setConsejeroManual(e.target.value)}>
                    <option value="">Seleccione un consejero</option>
                    {consejeros.map((c) => (
                      <option key={c.id} value={c.nombre}>
                        {c.nombre} — {c.fuerte}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="plantilla-box">
                  <strong style={{ display: "block", marginBottom: 6, color: "var(--navy)" }}>Criterio sugerido</strong>
                  <ul>
                    <li>Se respeta la carga equilibrada de trabajo.</li>
                    <li>Se prioriza la especialidad por materia.</li>
                    <li>La reasignación queda registrada en la trazabilidad del expediente.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="detalle-footer">
              <button className="btn-secondary" onClick={() => setModalManual(false)}>
                Cancelar
              </button>
              <button className="btn-primary small" onClick={aplicarAsignacionManual} style={{ marginLeft: 10 }}>
                Confirmar reasignación
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalDetalle && casoSeleccionado ? (
        <div className="expedientes-modal-overlay" onClick={() => setModalDetalle(false)}>
          <div className="expedientes-modal" onClick={(e) => e.stopPropagation()} style={{ width: "min(980px, 96vw)" }}>
            <div className="expedientes-modal-header">
              <div>
                <span className="expedientes-badge">Vista detallada</span>
                <h3>{casoSeleccionado.codigo}</h3>
                <p>Resumen del criterio de asignación aplicado al caso seleccionado.</p>
              </div>
              <button className="btn-close" onClick={() => setModalDetalle(false)}>
                ✕
              </button>
            </div>

            <div className="detalle-tabs">
              <div className="detalle-tab active">Asignación</div>
              <div className="detalle-tab">Trazabilidad</div>
              <div className="detalle-tab">Observaciones</div>
            </div>

            <div className="detalle-grid">
              <div className="detalle-card">
                <h4>Información principal</h4>
                <p><span className="detalle-label">Nombre</span>{casoSeleccionado.nombres}</p>
                <p><span className="detalle-label">Sector</span>{casoSeleccionado.sector}</p>
                <p><span className="detalle-label">Vulneración</span>{casoSeleccionado.vulneracion}</p>
                <p><span className="detalle-label">Prioridad</span><span className={getChipClass(casoSeleccionado.prioridad)}>{casoSeleccionado.prioridad}</span></p>
              </div>

              <div className="detalle-card">
                <h4>Despacho asignado</h4>
                <p><span className="detalle-label">Tipo de asignación</span>{casoSeleccionado.asignacion}</p>
                <p><span className="detalle-label">Consejero</span>{casoSeleccionado.asignadoA}</p>
                <p><span className="detalle-label">Despacho</span>{casoSeleccionado.despacho}</p>
                <p><span className="detalle-label">Fecha</span>{fechaBonita(casoSeleccionado.fecha)}</p>
              </div>
            </div>

            <div className="detalle-grid inferior">
              <div className="detalle-card">
                <h4>Observación de asignación</h4>
                <p className="detalle-texto">{casoSeleccionado.observacion}</p>
              </div>

              <div className="detalle-card">
                <h4>Acciones rápidas</h4>
                <div className="espejo-actions" style={{ marginTop: 12 }}>
                  <button className="btn-secondary" onClick={() => abrirManual(casoSeleccionado)}>
                    Reasignar manual
                  </button>
                  <button className="btn-secondary" onClick={() => reasignarAutomaticamente(casoSeleccionado)}>
                    Reasignar automática
                  </button>
                </div>
              </div>
            </div>

            <div className="detalle-footer">
              <button className="btn-primary small" onClick={() => setModalDetalle(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <PinModalWrapper />
    </section>
  );
}
