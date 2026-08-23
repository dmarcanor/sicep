import { useEffect, useMemo, useState } from "react";
import { api } from "../src/api";
import { usePinAction } from "../src/hooks/usePinAction";
import { useBusquedaDiferida } from "../src/hooks/useBusquedaDiferida";

const formInicial = {
  expedienteId: "",
  consejeroId: "",
  motivo: "",
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
  if (key === "enrevision") return "chip enrevision";
  if (key === "aprobado") return "chip aprobado";
  if (key === "observado") return "chip observado";
  return "pill default";
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

// El caso que devuelve la API anida el expediente y el consejero; la tabla
// trabaja con una fila plana.
function normalizarCaso(caso) {
  const expediente = caso.expediente || {};
  const consejero = caso.asignado_a || {};

  return {
    id: caso.id,
    codigo: caso.codigo,
    expedienteId: caso.expediente_id,
    expedienteCodigo: expediente.codigo || "—",
    nombres: expediente.nna_nombre || "—",
    sector: expediente.sector || "—",
    vulneracion: expediente.tipificacion || "Sin tipificar",
    prioridad: expediente.prioridad || "Media",
    fecha: (caso.created_at || "").slice(0, 10),
    asignacion: caso.tipo_asignacion || "Rotativa",
    consejeroId: consejero.id ?? null,
    asignadoA: consejero.display_name || consejero.name || "Sin asignar",
    despacho: consejero.position || "Consejería",
    observacion: caso.observaciones || caso.motivo || "Sin observación adicional.",
  };
}

export default function AsignacionCasosConsejeros() {
  const [consejeros, setConsejeros] = useState([]);
  const [casos, setCasos] = useState([]);
  const [expedientes, setExpedientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroConsejero, setFiltroConsejero] = useState("todos");
  const [modalManual, setModalManual] = useState(false);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [formNuevo, setFormNuevo] = useState(formInicial);
  const [consejeroManual, setConsejeroManual] = useState("");
  const [toast, setToast] = useState("");
  const [guardando, setGuardando] = useState(false);
  const { executeWithPin, PinModalWrapper } = usePinAction();

  const cargarDatos = async (search = "") => {
    try {
      const [casosData, usuariosData, expedientesData] = await Promise.all([
        api.getCasos(search.trim() ? { search: search.trim() } : {}),
        api.getUsuarios(),
        api.getExpedientes(),
      ]);

      // Sólo consejeros: el reparto y la carga se miden por consejería, y una
      // lista rotulada "consejeros" que incluía supervisores hacía ilegible
      // tanto el filtro como la distribución.
      setConsejeros(
        usuariosData
          .filter((u) => u.role === "consejero" && u.active)
          .map((u) => ({
            id: u.id,
            nombre: u.display_name || u.name,
            despacho: u.position || "Consejería",
          })),
      );

      setCasos(casosData.map(normalizarCaso));
      setExpedientes(expedientesData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  const busquedaDiferida = useBusquedaDiferida(busqueda);

  useEffect(() => {
    cargarDatos(busquedaDiferida);
  }, [busquedaDiferida]);

  // Se compara por id de usuario. Antes se comparaba el nombre contra el objeto
  // anidado que devuelve la API, así que el conteo siempre daba 0.
  const conteoConsejeros = useMemo(
    () =>
      consejeros.map((c) => ({
        ...c,
        total: casos.filter((caso) => caso.consejeroId === c.id).length,
      })),
    [consejeros, casos],
  );

  // Un expediente se asigna una sola vez: los ya repartidos salen de la lista.
  const expedientesSinAsignar = useMemo(() => {
    const asignados = new Set(casos.map((c) => c.expedienteId));
    return expedientes.filter((e) => !asignados.has(e.id));
  }, [expedientes, casos]);

  const casosFiltrados = useMemo(() => {
    return casos.filter((caso) => {
      const cumpleTipo = filtroTipo === "todos" || caso.asignacion === filtroTipo;
      const cumpleConsejero =
        filtroConsejero === "todos" || String(caso.consejeroId) === filtroConsejero;

      return cumpleTipo && cumpleConsejero;
    });
  }, [casos, filtroTipo, filtroConsejero]);

  const resumen = useMemo(() => {
    const cargas = consejeros.map((c) => casos.filter((caso) => caso.consejeroId === c.id).length);
    return {
      total: casos.length,
      rotativas: casos.filter((c) => c.asignacion === "Rotativa").length,
      manuales: casos.filter((c) => c.asignacion === "Manual").length,
      diferencia: cargas.length ? Math.max(...cargas) - Math.min(...cargas) : 0,
      pendientes: expedientesSinAsignar.length,
    };
  }, [casos, consejeros, expedientesSinAsignar]);

  const mostrarToast = (mensaje) => {
    setToast(mensaje);
    window.clearTimeout(window.__asigToast);
    window.__asigToast = window.setTimeout(() => setToast(""), 2800);
  };

  // Reparto rotativo: gana quien menos casos acumula.
  const consejeroConMenorCarga = () => {
    if (!consejeros.length) return null;

    return conteoConsejeros.reduce(
      (menor, actual) => (actual.total < menor.total ? actual : menor),
      conteoConsejeros[0],
    );
  };

  const asignarExpediente = async () => {
    if (!formNuevo.expedienteId) {
      mostrarToast("Seleccione el expediente que desea asignar.");
      return;
    }

    const manual = Boolean(formNuevo.consejeroId);
    const consejero = manual
      ? consejeros.find((c) => String(c.id) === String(formNuevo.consejeroId))
      : consejeroConMenorCarga();

    if (!consejero) {
      mostrarToast("No hay consejeros activos disponibles para asignar.");
      return;
    }

    setGuardando(true);

    try {
      await executeWithPin(
        (pin) =>
          api.createCaso(
            {
              expediente_id: Number(formNuevo.expedienteId),
              asignado_a: consejero.id,
              tipo_asignacion: manual ? "Manual" : "Rotativa",
              motivo:
                formNuevo.motivo.trim() ||
                (manual
                  ? `Asignado manualmente por la Presidencia a ${consejero.nombre}.`
                  : `Asignado automáticamente por equilibrio de carga a ${consejero.nombre}.`),
            },
            pin,
          ),
        "Asignar expediente",
      );

      await cargarDatos();
      setFormNuevo(formInicial);
      setModalNuevo(false);
      mostrarToast(`Expediente asignado a ${consejero.nombre}.`);
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        mostrarToast(error.message || "No se pudo asignar el expediente.");
      }
    } finally {
      setGuardando(false);
    }
  };

  const reasignar = async (caso, consejero, tipo) => {
    setGuardando(true);

    try {
      await executeWithPin(
        (pin) =>
          api.updateCaso(
            caso.id,
            {
              asignado_a: consejero.id,
              tipo_asignacion: tipo,
              observaciones:
                tipo === "Manual"
                  ? `Reasignado manualmente por la Presidencia a ${consejero.nombre}.`
                  : `Reasignado automáticamente por equilibrio de carga a ${consejero.nombre}.`,
            },
            pin,
          ),
        "Reasignar caso",
      );

      await cargarDatos();
      setModalManual(false);
      setModalDetalle(false);
      mostrarToast(`Caso ${caso.codigo} reasignado a ${consejero.nombre}.`);
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        mostrarToast(error.message || "No se pudo reasignar el caso.");
      }
    } finally {
      setGuardando(false);
    }
  };

  const abrirDetalle = (caso) => {
    setCasoSeleccionado(caso);
    setModalDetalle(true);
  };

  const abrirManual = (caso) => {
    setCasoSeleccionado(caso);
    setConsejeroManual(caso.consejeroId ? String(caso.consejeroId) : "");
    setModalManual(true);
  };

  const aplicarAsignacionManual = () => {
    const consejero = consejeros.find((c) => String(c.id) === String(consejeroManual));

    if (!casoSeleccionado || !consejero) {
      mostrarToast("Seleccione un consejero para reasignar.");
      return;
    }

    reasignar(casoSeleccionado, consejero, "Manual");
  };

  const reasignarAutomaticamente = (caso) => {
    const consejero = consejeroConMenorCarga();

    if (!consejero) {
      mostrarToast("No hay consejeros activos disponibles.");
      return;
    }

    reasignar(caso, consejero, "Rotativa");
  };

  return (
    <section className="modulo expedientes">
      <div className="expedientes-header">
        <div>
          <span className="expedientes-badge">Gestión operativa</span>
          <h2>Asignación de Casos a Consejeros</h2>
          <p>
            Aquí se decide <strong>qué consejero atiende cada expediente</strong>. El módulo no
            crea expedientes: reparte los que ya existen y deja ver cómo queda la carga de cada
            consejería. Use <em>Asignar expediente</em> para los que aún no tienen responsable, o
            <em> Reasignar</em> para cambiar el de un caso ya repartido.
          </p>
        </div>

        <button className="btn-primary" onClick={() => setModalNuevo(true)}>
          + Asignar expediente
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
          <div className="stat-subtitle">Expedientes con despacho definido</div>
        </article>

        <article className="stat-card amber">
          <div className="stat-top">
            <span className="stat-title">Sin asignar</span>
            <span className="stat-dot" />
          </div>
          <div className="stat-value">{resumen.pendientes}</div>
          <div className="stat-subtitle">Expedientes a la espera de consejero</div>
        </article>

        <article className="stat-card green">
          <div className="stat-top">
            <span className="stat-title">Asignación manual</span>
            <span className="stat-dot" />
          </div>
          <div className="stat-value">{resumen.manuales}</div>
          <div className="stat-subtitle">{resumen.rotativas} rotativas · brecha de carga {resumen.diferencia}</div>
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
                <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>{c.despacho}</div>
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#20354F" }}>
                  {c.total} casos · {porcentaje}%
                </div>
              </div>
            );
          })}

          {!conteoConsejeros.length ? (
            <div style={{ color: "var(--muted)" }}>No hay consejeros activos registrados.</div>
          ) : null}
        </div>
      </div>

      <div className="panel table-panel">
        <div className="barraFiltros filters">
          <input
            className="datatable-input"
            type="text"
            placeholder="Buscar por caso, expediente, NNA, sector o consejero..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select className="datatable-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="todos">Todas las asignaciones</option>
            <option value="Rotativa">Rotativa</option>
            <option value="Manual">Manual</option>
          </select>

          <select
            className="datatable-select"
            value={filtroConsejero}
            onChange={(e) => setFiltroConsejero(e.target.value)}
          >
            <option value="todos">Todos los consejeros</option>
            {consejeros.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="contenedorTabla table-wrap tabla-card">
          <table className="tabla-datos">
            <thead>
              <tr>
                <th>Caso</th>
                <th>Expediente</th>
                <th>Nombre del NNA</th>
                <th>Sector</th>
                <th>Vulneración</th>
                <th>Prioridad</th>
                <th>Asignación</th>
                <th>Consejero</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {casosFiltrados.map((caso) => (
                <tr
                  key={caso.id}
                  className="fila-clicable"
                  onClick={() => abrirDetalle(caso)}
                  title="Ver el detalle del caso"
                >
                  <td className="mono">{caso.codigo}</td>
                  <td className="mono">{caso.expedienteCodigo}</td>
                  <td>{caso.nombres}</td>
                  <td>{caso.sector}</td>
                  <td>{caso.vulneracion}</td>
                  <td>
                    <span className={getChipClass(caso.prioridad)}>{caso.prioridad}</span>
                  </td>
                  <td>
                    <span className={caso.asignacion === "Manual" ? "pill amber" : "pill blue"}>
                      {caso.asignacion}
                    </span>
                  </td>
                  <td>{caso.asignadoA}</td>
                  <td>{fechaBonita(caso.fecha)}</td>
                  <td>
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => abrirDetalle(caso)}>Ver</button>
                      <button onClick={() => abrirManual(caso)}>Reasignar</button>
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
                <span className="expedientes-badge">Asignación</span>
                <h3>Asignar un expediente a un consejero</h3>
                <p>
                  Si no elige consejero, el sistema entrega el expediente al despacho con menor carga de trabajo.
                </p>
              </div>
              <button className="btn-close" onClick={() => setModalNuevo(false)}>
                ✕
              </button>
            </div>

            <div className="form-nuevo-expediente">
              <div className="campo ancho">
                <label>Expediente *</label>
                <select
                  value={formNuevo.expedienteId}
                  onChange={(e) => setFormNuevo((p) => ({ ...p, expedienteId: e.target.value }))}
                >
                  <option value="">Seleccione un expediente sin asignar</option>
                  {expedientesSinAsignar.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.codigo} — {e.nna_nombre || "Sin NNA"} · {e.sector}
                    </option>
                  ))}
                </select>
                {!expedientesSinAsignar.length ? (
                  <small style={{ color: "var(--muted)" }}>
                    Todos los expedientes registrados ya tienen consejero asignado.
                  </small>
                ) : null}
              </div>

              <div className="campo">
                <label>Consejero</label>
                <select
                  value={formNuevo.consejeroId}
                  onChange={(e) => setFormNuevo((p) => ({ ...p, consejeroId: e.target.value }))}
                >
                  <option value="">Automática (menor carga)</option>
                  {consejeros.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nombre} — {c.despacho}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo ancho">
                <label>Motivo</label>
                <textarea
                  rows="3"
                  value={formNuevo.motivo}
                  onChange={(e) => setFormNuevo((p) => ({ ...p, motivo: e.target.value }))}
                  placeholder="Opcional. Si lo deja vacío se registra el criterio aplicado."
                />
              </div>
            </div>

            <div className="detalle-footer">
              <button className="btn-secondary" onClick={() => setModalNuevo(false)}>
                Cancelar
              </button>
              <button
                className="btn-primary small"
                onClick={asignarExpediente}
                disabled={guardando || !expedientesSinAsignar.length}
                style={{ marginLeft: 10 }}
              >
                {guardando ? "Asignando..." : "Asignar"}
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
                <p>La Presidencia puede intervenir sobre la distribución automática cuando el caso lo amerite.</p>
              </div>
              <button className="btn-close" onClick={() => setModalManual(false)}>
                ✕
              </button>
            </div>

            <div className="detalle-grid">
              <div className="detalle-card">
                <h4>Datos del caso</h4>
                <p><span className="detalle-label">Caso</span>{casoSeleccionado.codigo}</p>
                <p><span className="detalle-label">Expediente</span>{casoSeleccionado.expedienteCodigo}</p>
                <p><span className="detalle-label">NNA</span>{casoSeleccionado.nombres}</p>
                <p><span className="detalle-label">Vulneración</span>{casoSeleccionado.vulneracion}</p>
                <p><span className="detalle-label">Asignación actual</span>{casoSeleccionado.asignadoA}</p>
              </div>

              <div className="detalle-card">
                <h4>Selección de consejero</h4>
                <div className="campo">
                  <label>Consejero titular</label>
                  <select value={consejeroManual} onChange={(e) => setConsejeroManual(e.target.value)}>
                    <option value="">Seleccione un consejero</option>
                    {conteoConsejeros.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.nombre} — {c.total} casos
                      </option>
                    ))}
                  </select>
                </div>

                <div className="plantilla-box">
                  <strong style={{ display: "block", marginBottom: 6, color: "var(--navy)" }}>Criterio sugerido</strong>
                  <ul>
                    <li>Se respeta la carga equilibrada de trabajo.</li>
                    <li>La reasignación queda registrada en el historial del sistema.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="detalle-footer">
              <button className="btn-secondary" onClick={() => setModalManual(false)}>
                Cancelar
              </button>
              <button
                className="btn-primary small"
                onClick={aplicarAsignacionManual}
                disabled={guardando}
                style={{ marginLeft: 10 }}
              >
                {guardando ? "Guardando..." : "Confirmar reasignación"}
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

            <div className="detalle-grid">
              <div className="detalle-card">
                <h4>Información principal</h4>
                <p><span className="detalle-label">Expediente</span>{casoSeleccionado.expedienteCodigo}</p>
                <p><span className="detalle-label">NNA</span>{casoSeleccionado.nombres}</p>
                <p><span className="detalle-label">Sector</span>{casoSeleccionado.sector}</p>
                <p><span className="detalle-label">Vulneración</span>{casoSeleccionado.vulneracion}</p>
                <p>
                  <span className="detalle-label">Prioridad</span>
                  <span className={getChipClass(casoSeleccionado.prioridad)}>{casoSeleccionado.prioridad}</span>
                </p>
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
                  <button className="btn-secondary" disabled={guardando} onClick={() => abrirManual(casoSeleccionado)}>
                    Reasignar manual
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={guardando}
                    onClick={() => reasignarAutomaticamente(casoSeleccionado)}
                  >
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
