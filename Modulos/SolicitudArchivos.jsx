import { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./css/Expedientes.css";
import { api } from "../src/api";
import { membretePDF, pieDePaginaPDF, hojaConMembrete } from "../src/exportar";
import { hoyISO } from "../src/formato";
import { estilosTabla } from "../src/tablaEstilos";
import { usePinAction } from "../src/hooks/usePinAction";
import { useBusquedaDiferida } from "../src/hooks/useBusquedaDiferida";

// Debe coincidir con el enum de solicitudes_archivo.estatus.
const ESTATUS_ARCHIVO = [
  "Pendiente",
  "Disponible",
  "Reservado",
  "Prestado",
  "Devuelto",
  "En consulta",
  "Extraviado",
  "En digitalización",
];

const estadoOpciones = ["Todos", ...ESTATUS_ARCHIVO];

const tiposMovimiento = [
  "Préstamo",
  "Devolución",
  "Traslado",
  "Consulta",
  "Observación",
];

const crearUbicacionTexto = (u = {}) =>
  [u.archivo, u.estante && `Estante ${u.estante}`, u.nivel && `Nivel ${u.nivel}`, u.caja && `Caja ${u.caja}`]
    .filter(Boolean)
    .join(" > ") || "Sin ubicación";

const formInicialSolicitud = {
  expedienteId: "",
  caso: "",
  solicitante: "",
  cargo: "",
  motivo: "",
  fechaSolicitud: new Date().toISOString().slice(0, 10),
  fechaPrestamo: "",
  fechaDevolucion: "",
  estatus: "Disponible",
  ubicacion: {
    archivo: "",
    estante: "",
    nivel: "",
    caja: "",
  },
};

// La API guarda la ubicación en columnas planas y el expediente como relación;
// la tabla y la ficha trabajan con la forma anidada de siempre.
const normalizarSolicitud = (s) => ({
  idApi: s.id,
  id: s.codigo,
  expedienteId: s.expediente_id,
  expediente: s.expediente?.codigo || "—",
  caso: s.caso || "",
  nna: s.expediente?.nna_nombre || "",
  representante: s.expediente?.representante_nombre || "",
  solicitante: s.solicitante_nombre || s.solicitante?.display_name || s.solicitante?.name || "",
  cargo: s.cargo || "",
  motivo: s.motivo || "",
  fechaSolicitud: s.fecha_solicitud || (s.created_at || "").slice(0, 10),
  fechaPrestamo: s.fecha_prestamo || "",
  fechaDevolucion: s.fecha_devolucion || "",
  estatus: s.estatus,
  ubicacion: {
    archivo: s.ubicacion_archivo || "",
    estante: s.ubicacion_estante || "",
    nivel: s.ubicacion_nivel || "",
    caja: s.ubicacion_caja || "",
  },
});

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  background: "rgba(18, 33, 53, 0.56)",
  backdropFilter: "blur(3px)",
  WebkitBackdropFilter: "blur(3px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const modalStyle = {
  width: "min(860px, 96vw)",
  maxHeight: "calc(100vh - 40px)",
  overflowY: "auto",
  boxSizing: "border-box",
};

export default function SolicitudArchivos() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [ficha, setFicha] = useState(null);
  const [detalleVista, setDetalleVista] = useState("resumen");

  const [movimientos, setMovimientos] = useState({});
  const [historialUbicacion, setHistorialUbicacion] = useState({});

  const [movimientoForm, setMovimientoForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    tipo: "Préstamo",
    descripcion: "",
  });

  const [ubicacionForm, setUbicacionForm] = useState({
    archivo: "",
    estante: "",
    nivel: "",
    caja: "",
    observacion: "",
  });

  const [erroresDetalle, setErroresDetalle] = useState({});
  const { executeWithPin, PinModalWrapper } = usePinAction();

  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [nuevoPaso, setNuevoPaso] = useState(1);
  const [registroExitoso, setRegistroExitoso] = useState("");
  const [nuevaSolicitud, setNuevaSolicitud] = useState(formInicialSolicitud);
  const [erroresNuevo, setErroresNuevo] = useState({});

  const [solicitudesBase, setSolicitudesBase] = useState([]);
  const [expedientes, setExpedientes] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const cargarSolicitudes = async (search = "") => {
    try {
      const data = await api.getSolicitudes(search.trim() ? { search: search.trim() } : {});
      return data.map(normalizarSolicitud);
    } catch (error) {
      console.error("Error cargando solicitudes:", error);
      return [];
    }
  };

  const recargar = async (search = busquedaDiferida) =>
    setSolicitudesBase(await cargarSolicitudes(search));

  const busquedaDiferida = useBusquedaDiferida(busqueda);

  useEffect(() => {
    api.getExpedientes().then(setExpedientes).catch(console.error);
  }, []);

  useEffect(() => {
    recargar(busquedaDiferida);
  }, [busquedaDiferida]);

  const solicitudes = useMemo(() => {
    return solicitudesBase.filter((item) => {
      const q = busqueda.toLowerCase().trim();
      const ubicacionTexto = crearUbicacionTexto(item.ubicacion || {});
      const texto = [
        item.id,
        item.expediente,
        item.caso,
        item.nna,
        item.representante,
        item.solicitante,
        item.cargo,
        item.motivo,
        item.estatus,
        ubicacionTexto,
      ]
        .join(" ")
        .toLowerCase();

      const coincideBusqueda = !q || texto.includes(q);
      const coincideFiltro = filtro === "Todos" ? true : item.estatus === filtro;

      return coincideBusqueda && coincideFiltro;
    });
  }, [busqueda, filtro, solicitudesBase]);

  const abrirDetalle = (row) => {
    setFicha(row);
    setDetalleVista("resumen");
    setMovimientoForm({
      fecha: new Date().toISOString().slice(0, 10),
      tipo: "Préstamo",
      descripcion: "",
    });
    setUbicacionForm({
      archivo: row.ubicacion?.archivo || "",
      estante: row.ubicacion?.estante || "",
      nivel: row.ubicacion?.nivel || "",
      caja: row.ubicacion?.caja || "",
      observacion: "",
    });
    setErroresDetalle({});
  };

  const cerrarDetalle = () => {
    setFicha(null);
    setDetalleVista("resumen");
    setErroresDetalle({});
  };

  const exportarExcel = () => {
    const data = solicitudes.map((item) => ({
      ID: item.id,
      Expediente: item.expediente,
      Caso: item.caso,
      NNA: item.nna,
      Representante: item.representante,
      Solicitante: item.solicitante,
      Cargo: item.cargo,
      Motivo: item.motivo,
      "Fecha Solicitud": item.fechaSolicitud,
      "Fecha Préstamo": item.fechaPrestamo || "",
      "Fecha Devolución": item.fechaDevolucion || "",
      Estatus: item.estatus,
      Ubicación: crearUbicacionTexto(item.ubicacion || {}),
    }));

    const ws = hojaConMembrete(data, "REPORTE DE SOLICITUD DE ARCHIVOS");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SolicitudArchivos");
    XLSX.writeFile(wb, "solicitud-archivos.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF();

    const inicioY = membretePDF(doc, "REPORTE DE SOLICITUD DE ARCHIVOS");

    autoTable(doc, {
      startY: inicioY,
      head: [["ID", "Expediente", "Solicitante", "Estatus", "Ubicación"]],
      body: solicitudes.map((item) => [
        item.id,
        item.expediente,
        item.solicitante,
        item.estatus,
        crearUbicacionTexto(item.ubicacion || {}),
      ]),
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [24, 48, 78],
      },
    });

    pieDePaginaPDF(doc);

    doc.save("solicitud-archivos.pdf");
  };

  const columnas = [
    {
      name: "Solicitud",
      selector: (r) => r.id,
      sortable: true,
      width: "160px",
    },
    {
      name: "Expediente",
      selector: (r) => r.expediente,
      sortable: true,
      width: "150px",
    },
    {
      name: "Caso",
      selector: (r) => r.caso,
      sortable: true,
    },
    {
      name: "Solicitante",
      selector: (r) => r.solicitante,
      sortable: true,
    },
    {
      name: "Ubicación física",
      cell: (r) => <span>{crearUbicacionTexto(r.ubicacion || {})}</span>,
      grow: 2,
    },
    {
      name: "Estatus",
      cell: (r) => (
        <span className={`chip ${r.estatus.toLowerCase().replace(/\s+/g, "")}`}>
          {r.estatus}
        </span>
      ),
      width: "150px",
    },
  ];

  const validarPaso1 = () => {
    const errores = {};
    if (!nuevaSolicitud.expedienteId) errores.expedienteId = true;
    if (!nuevaSolicitud.caso.trim()) errores.caso = true;
    if (!nuevaSolicitud.solicitante.trim()) errores.solicitante = true;
    if (!nuevaSolicitud.fechaSolicitud) errores.fechaSolicitud = true;
    if (!nuevaSolicitud.estatus.trim()) errores.estatus = true;

    setErroresNuevo(errores);
    return Object.keys(errores).length === 0;
  };

  const validarPaso2 = () => {
    const errores = {};
    if (!nuevaSolicitud.cargo.trim()) errores.cargo = true;
    if (!nuevaSolicitud.motivo.trim()) errores.motivo = true;
    if (!nuevaSolicitud.ubicacion.archivo.trim()) errores.ubicacionArchivo = true;
    if (!nuevaSolicitud.ubicacion.estante.trim()) errores.ubicacionEstante = true;
    if (!nuevaSolicitud.ubicacion.nivel.trim()) errores.ubicacionNivel = true;
    if (!nuevaSolicitud.ubicacion.caja.trim()) errores.ubicacionCaja = true;

    setErroresNuevo((prev) => ({ ...prev, ...errores }));
    return Object.keys(errores).length === 0;
  };

  const guardarMovimiento = () => {
    if (!ficha) return;

    const errores = {};
    if (!movimientoForm.fecha) errores.movFecha = true;
    if (!movimientoForm.tipo) errores.movTipo = true;
    if (!movimientoForm.descripcion.trim()) errores.movDescripcion = true;

    setErroresDetalle(errores);

    if (Object.keys(errores).length > 0) {
      alert("Complete la fecha, el tipo y la descripción del movimiento.");
      return;
    }

    const nuevaEntrada = {
      fecha: movimientoForm.fecha,
      tipo: movimientoForm.tipo,
      descripcion: movimientoForm.descripcion.trim(),
    };

    setMovimientos((prev) => ({
      ...prev,
      [ficha.id]: [...(prev[ficha.id] || []), nuevaEntrada],
    }));

    if (movimientoForm.tipo === "Préstamo") {
      guardarCambios(
        { estatus: "Prestado", fecha_prestamo: movimientoForm.fecha },
        "Registrar préstamo",
      );
    } else if (movimientoForm.tipo === "Devolución") {
      guardarCambios(
        { estatus: "Devuelto", fecha_devolucion: movimientoForm.fecha },
        "Registrar devolución",
      );
    }

    setMovimientoForm({
      fecha: new Date().toISOString().slice(0, 10),
      tipo: "Préstamo",
      descripcion: "",
    });

    alert("Movimiento registrado con éxito.");
  };

  const actualizarUbicacion = async () => {
    if (!ficha) return;

    const errores = {};
    if (!ubicacionForm.archivo.trim()) errores.ubicacionArchivo = true;
    if (!ubicacionForm.estante.trim()) errores.ubicacionEstante = true;
    if (!ubicacionForm.nivel.trim()) errores.ubicacionNivel = true;
    if (!ubicacionForm.caja.trim()) errores.ubicacionCaja = true;

    setErroresDetalle(errores);

    if (Object.keys(errores).length > 0) {
      alert("Complete la ubicación física del expediente.");
      return;
    }

    const nuevaUbicacion = {
      archivo: ubicacionForm.archivo.trim(),
      estante: ubicacionForm.estante.trim(),
      nivel: ubicacionForm.nivel.trim(),
      caja: ubicacionForm.caja.trim(),
    };

    const registroUbicacion = {
      fecha: new Date().toISOString().slice(0, 10),
      observacion: ubicacionForm.observacion.trim(),
      ubicacionTexto: crearUbicacionTexto(nuevaUbicacion),
    };

    const guardada = await guardarCambios(
      {
        ubicacion_archivo: nuevaUbicacion.archivo,
        ubicacion_estante: nuevaUbicacion.estante,
        ubicacion_nivel: nuevaUbicacion.nivel,
        ubicacion_caja: nuevaUbicacion.caja,
      },
      "Actualizar ubicación física",
    );

    if (!guardada) return;

    setHistorialUbicacion((prev) => ({
      ...prev,
      [ficha.id]: [...(prev[ficha.id] || []), registroUbicacion],
    }));

    setUbicacionForm((prev) => ({ ...prev, observacion: "" }));
  };

  const registrarEstatus = (nuevoEstatus) => {
    guardarCambios({ estatus: nuevoEstatus }, `Marcar como ${nuevoEstatus}`);
  };

  const expedienteElegido = useMemo(
    () => expedientes.find((e) => String(e.id) === String(nuevaSolicitud.expedienteId)) || null,
    [expedientes, nuevaSolicitud.expedienteId],
  );

  const abrirModalNuevo = () => {
    setNuevaSolicitud(formInicialSolicitud);
    setErroresNuevo({});
    setNuevoPaso(1);
    setMostrarModalNuevo(true);
  };

  const actualizarNuevaSolicitud = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("ubicacion.")) {
      const campo = name.split(".")[1];
      setNuevaSolicitud((prev) => ({
        ...prev,
        ubicacion: {
          ...prev.ubicacion,
          [campo]: value,
        },
      }));
      return;
    }

    setNuevaSolicitud((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const avanzarPaso = () => {
    if (validarPaso1()) setNuevoPaso(2);
  };

  const retrocederPaso = () => {
    setNuevoPaso(1);
  };

  const registrarNuevaSolicitud = async () => {
    if (!validarPaso1() || !validarPaso2()) return;

    const existePrestado = solicitudesBase.some(
      (item) =>
        item.expedienteId === Number(nuevaSolicitud.expedienteId) && item.estatus === "Prestado"
    );

    if (existePrestado) {
      alert("Este expediente actualmente se encuentra prestado.");
      return;
    }

    const carga = {
      expediente_id: Number(nuevaSolicitud.expedienteId),
      caso: nuevaSolicitud.caso.trim(),
      solicitante_nombre: nuevaSolicitud.solicitante.trim(),
      cargo: nuevaSolicitud.cargo.trim(),
      motivo: nuevaSolicitud.motivo.trim(),
      estatus: nuevaSolicitud.estatus,
      fecha_solicitud: nuevaSolicitud.fechaSolicitud,
      fecha_prestamo:
        nuevaSolicitud.estatus === "Prestado" ? nuevaSolicitud.fechaSolicitud : null,
      ubicacion_archivo: nuevaSolicitud.ubicacion.archivo.trim(),
      ubicacion_estante: nuevaSolicitud.ubicacion.estante.trim(),
      ubicacion_nivel: nuevaSolicitud.ubicacion.nivel.trim(),
      ubicacion_caja: nuevaSolicitud.ubicacion.caja.trim(),
    };

    setGuardando(true);

    try {
      const creada = await executeWithPin(
        (pin) => api.createSolicitud(carga, pin),
        "Registrar solicitud de archivo",
      );

      await recargar();
      setMostrarModalNuevo(false);
      setRegistroExitoso(`Solicitud ${creada.codigo} registrada con éxito.`);
      setTimeout(() => setRegistroExitoso(""), 4000);
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        alert(error.message || "No se pudo registrar la solicitud.");
      }
    } finally {
      setGuardando(false);
    }
  };

  // Toda modificación de la ficha viaja por la misma vía para que el estado en
  // pantalla no se separe de lo guardado.
  const guardarCambios = async (cambios, titulo) => {
    if (!ficha) return false;

    setGuardando(true);

    try {
      const actualizada = await executeWithPin(
        (pin) => api.updateSolicitud(ficha.idApi, cambios, pin),
        titulo,
      );

      setFicha(normalizarSolicitud(actualizada));
      await recargar();
      return true;
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        alert(error.message || "No se pudo guardar el cambio.");
      }
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const renderDetalle = () => {
    if (!ficha) return null;

    if (detalleVista === "resumen") {
      return (
        <div className="detalle-grid">
          <div className="detalle-card">
            <h4>Resumen general</h4>
            <p><b>Solicitud:</b> {ficha.id}</p>
            <p><b>Expediente:</b> {ficha.expediente}</p>
            <p><b>Caso:</b> {ficha.caso}</p>
            <p><b>NNA:</b> {ficha.nna}</p>
            <p><b>Representante:</b> {ficha.representante}</p>
          </div>

          <div className="detalle-card">
            <h4>Estado actual</h4>
            <p><b>Estatus:</b> {ficha.estatus}</p>
            <p><b>Solicitante:</b> {ficha.solicitante}</p>
            <p><b>Cargo:</b> {ficha.cargo}</p>
            <p><b>Fecha solicitud:</b> {ficha.fechaSolicitud}</p>
            <p><b>Ubicación física:</b> {crearUbicacionTexto(ficha.ubicacion || {})}</p>
          </div>
        </div>
      );
    }

    if (detalleVista === "movimientos") {
      return (
        <div className="detalle-card">
          <h4>Movimientos de archivo</h4>

          <div className="bitacora-form">
            <input
              type="date"
              max={hoyISO()}
              value={movimientoForm.fecha}
              onChange={(e) => setMovimientoForm((prev) => ({ ...prev, fecha: e.target.value }))}
              className={erroresDetalle.movFecha ? "error" : ""}
            />

            <select
              value={movimientoForm.tipo}
              onChange={(e) => setMovimientoForm((prev) => ({ ...prev, tipo: e.target.value }))}
              className={erroresDetalle.movTipo ? "error" : ""}
            >
              {tiposMovimiento.map((tipo) => (
                <option key={tipo}>{tipo}</option>
              ))}
            </select>

            <textarea
              rows="3"
              placeholder="Ej. Se entrega para revisión jurídica..."
              value={movimientoForm.descripcion}
              onChange={(e) => setMovimientoForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              className={erroresDetalle.movDescripcion ? "error" : ""}
            />

            <button className="btn-primary small" onClick={guardarMovimiento}>
              Registrar movimiento
            </button>
          </div>

          <div className="timeline">
            {(movimientos[ficha.id] || []).length === 0 ? (
              <div className="timeline-empty">
                No hay movimientos registrados aún.
              </div>
            ) : (
              movimientos[ficha.id].map((item, index) => (
                <div key={`${item.fecha}-${item.tipo}-${index}`} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <strong>{item.fecha} · {item.tipo}</strong>
                    <span>{item.descripcion}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (detalleVista === "ubicacion") {
      return (
        <div className="detalle-card">
          <h4>Ubicación física exacta</h4>

          <div className="estatus-fisico">
            <span className="detalle-label">Ubicación actual</span>
            <strong>{crearUbicacionTexto(ficha.ubicacion || {})}</strong>
          </div>

          <div className="form-nuevo-expediente">
            <div className="campo">
              <label>Archivo *</label>
              <input
                value={ubicacionForm.archivo}
                onChange={(e) => setUbicacionForm((prev) => ({ ...prev, archivo: e.target.value }))}
                className={erroresDetalle.ubicacionArchivo ? "error" : ""}
                placeholder="Archivo Central"
              />
            </div>

            <div className="campo">
              <label>Estante *</label>
              <input
                value={ubicacionForm.estante}
                onChange={(e) => setUbicacionForm((prev) => ({ ...prev, estante: e.target.value }))}
                className={erroresDetalle.ubicacionEstante ? "error" : ""}
                placeholder="B"
              />
            </div>

            <div className="campo">
              <label>Nivel *</label>
              <input
                value={ubicacionForm.nivel}
                onChange={(e) => setUbicacionForm((prev) => ({ ...prev, nivel: e.target.value }))}
                className={erroresDetalle.ubicacionNivel ? "error" : ""}
                placeholder="3"
              />
            </div>

            <div className="campo">
              <label>Caja *</label>
              <input
                value={ubicacionForm.caja}
                onChange={(e) => setUbicacionForm((prev) => ({ ...prev, caja: e.target.value }))}
                className={erroresDetalle.ubicacionCaja ? "error" : ""}
                placeholder="12"
              />
            </div>

    {/*             <div className="campo ancho">
                <label>Observación</label>
                <textarea
                    rows="3"
                    value={ubicacionForm.observacion}
                    onChange={(e) => setUbicacionForm((prev) => ({ ...prev, observacion: e.target.value }))}
                    placeholder="Ej. Reubicado por reorganización de archivo"
                />
                </div> */}
          </div>

          <div className="espejo-actions">
            <button className="btn-secondary" onClick={() => registrarEstatus("Disponible")}>Disponible</button>
            <button className="btn-secondary" onClick={() => registrarEstatus("Prestado")}>Prestado</button>
            <button className="btn-secondary" onClick={() => registrarEstatus("Reservado")}>Reservado</button>
          </div>

          <button className="btn-primary" onClick={actualizarUbicacion} style={{ marginTop: 12 }}>
            Actualizar ubicación
          </button>
        </div>
      );
    }

    if (detalleVista === "historial") {
      const ubicHist = historialUbicacion[ficha.id] || [];
      const movHist = movimientos[ficha.id] || [];

      return (
        <div className="detalle-card">
          <h4>Historial completo</h4>

          <div className="timeline">
            {movHist.length === 0 && ubicHist.length === 0 ? (
              <div className="timeline-empty">No hay historial registrado aún.</div>
            ) : (
              <>
                {movHist.map((item, index) => (
                  <div key={`mov-${item.fecha}-${index}`} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <strong>{item.fecha} · {item.tipo}</strong>
                      <span>{item.descripcion}</span>
                    </div>
                  </div>
                ))}

                {ubicHist.map((item, index) => (
                  <div key={`ubi-${item.fecha}-${index}`} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <strong>{item.fecha} · Ubicación actualizada</strong>
                      <span>{item.ubicacionTexto}</span>
                      {item.observacion && <span>{item.observacion}</span>}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="expedientes">
      <div className="expedientes-header">
        <div>
          <span className="expedientes-badge">Gestión de archivos</span>
          <h2>Solicitud de Archivos</h2>
          <p>Control de solicitudes, ubicación física, préstamo y seguimiento de expedientes institucionales.</p>
        </div>

        <button className="btn-primary" onClick={abrirModalNuevo}>
          + Nueva solicitud
        </button>
      </div>

      {registroExitoso && <div className="toast-exito">{registroExitoso}</div>}

      <div className="datatable-toolbar">
        <div className="toolbar-left">
          <span className="datatable-info">
            Total: <b>{solicitudes.length}</b> registros
          </span>
        </div>

        <div className="toolbar-center">
          <input
            className="datatable-input"
            placeholder="Buscar solicitud, expediente, solicitante, caso o ubicación..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select className="datatable-select" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            {estadoOpciones.map((opcion) => (
              <option key={opcion}>{opcion}</option>
            ))}
          </select>
        </div>

        <div className="toolbar-right">
          <button className="btn-export" onClick={exportarExcel}>📊 Excel</button>
          <button className="btn-export" onClick={exportarPDF}>🧾 PDF</button>
        </div>
      </div>

      <DataTable
        customStyles={estilosTabla}
        columns={columnas}
        data={solicitudes}
        pagination
        highlightOnHover
        pointerOnHover
        responsive
        onRowClicked={abrirDetalle}
      />

      {mostrarModalNuevo && (
        <div style={overlayStyle} onClick={() => setMostrarModalNuevo(false)}>
          <div
            className="expedientes-modal modal-nuevo"
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="expedientes-modal-header">
              <div style={{ display: "grid", gap: 8 }}>
                <span className="expedientes-badge">Crear solicitud</span>
                <h3>Nueva solicitud de archivo</h3>
                <p>
                  Registre primero lo básico y luego la ubicación física para mantener una experiencia más clara.
                </p>
              </div>

              <button className="btn-close" onClick={() => setMostrarModalNuevo(false)}>
                ✕
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <span className={`chip ${nuevoPaso === 1 ? "registrado" : "observado"}`}>Paso 1 · Datos básicos</span>
              <span className={`chip ${nuevoPaso === 2 ? "registrado" : "observado"}`}>Paso 2 · Ubicación y detalle</span>
            </div>

            {nuevoPaso === 1 ? (
              <div className="form-nuevo-expediente">
                <div className="campo ancho">
                  <label>Expediente *</label>
                  <select
                    name="expedienteId"
                    value={nuevaSolicitud.expedienteId}
                    onChange={actualizarNuevaSolicitud}
                    className={erroresNuevo.expedienteId ? "error" : ""}
                  >
                    <option value="">Seleccione un expediente</option>
                    {expedientes.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.codigo} — {e.nna_nombre || "Sin NNA"} · {e.sector}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: "var(--muted)" }}>
                    El código de la solicitud lo asigna el sistema al guardar.
                  </small>
                </div>

                <div className="campo ">
                  <label>Caso *</label>
                  <input
                    name="caso"
                    value={nuevaSolicitud.caso}
                    onChange={actualizarNuevaSolicitud}
                    className={erroresNuevo.caso ? "error" : ""}
                    placeholder="Protección Integral"
                  />
                </div>
                <div className="campo">
                  <label>Estatus *</label>
                  <select
                    name="estatus"
                    value={nuevaSolicitud.estatus}
                    onChange={actualizarNuevaSolicitud}
                    className={erroresNuevo.estatus ? "error" : ""}
                  >
                    {ESTATUS_ARCHIVO.map((e) => (
                      <option key={e}>{e}</option>
                    ))}
                  </select>
                </div>

                <div className="campo">
                  <label>Solicitante *</label>
                  <input
                    name="solicitante"
                    value={nuevaSolicitud.solicitante}
                    onChange={actualizarNuevaSolicitud}
                    className={erroresNuevo.solicitante ? "error" : ""}
                    placeholder="Nombre del usuario"
                  />
                </div>

                <div className="campo">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    name="fechaSolicitud"
                    max={hoyISO()}
                    value={nuevaSolicitud.fechaSolicitud}
                    onChange={actualizarNuevaSolicitud}
                    className={erroresNuevo.fechaSolicitud ? "error" : ""}
                  />
                </div>


              </div>
            ) : (
              <div className="form-nuevo-expediente">
                <div className="campo ">
                  <label>NNA</label>
                  <input
                    value={expedienteElegido?.nna_nombre || ""}
                    readOnly
                    placeholder="Se toma del expediente seleccionado"
                  />
                </div>

                <div className="campo ">
                  <label>Representante</label>
                  <input
                    value={expedienteElegido?.representante_nombre || ""}
                    readOnly
                    placeholder="Se toma del expediente seleccionado"
                  />
                </div>

                <div className="campo">
                  <label>Cargo *</label>
                  <input
                    name="cargo"
                    value={nuevaSolicitud.cargo}
                    onChange={actualizarNuevaSolicitud}
                    className={erroresNuevo.cargo ? "error" : ""}
                    placeholder="Abogada, Asistente Social..."
                  />
                </div>

                <div className="campo">
                  <label>Archivo *</label>
                  <input
                    name="ubicacion.archivo"
                    value={nuevaSolicitud.ubicacion.archivo}
                    onChange={actualizarNuevaSolicitud}
                    className={erroresNuevo.ubicacionArchivo ? "error" : ""}
                    placeholder="Archivo Central"
                  />
                </div>

                <div className="campo">
                  <label>Estante *</label>
                  <input
                    name="ubicacion.estante"
                    value={nuevaSolicitud.ubicacion.estante}
                    onChange={actualizarNuevaSolicitud}
                    className={erroresNuevo.ubicacionEstante ? "error" : ""}
                    placeholder="B"
                  />
                </div>

                <div className="campo">
                  <label>Nivel *</label>
                  <input
                    name="ubicacion.nivel"
                    value={nuevaSolicitud.ubicacion.nivel}
                    onChange={actualizarNuevaSolicitud}
                    className={erroresNuevo.ubicacionNivel ? "error" : ""}
                    placeholder="3"
                  />
                </div>

                <div className="campo">
                  <label>Caja *</label>
                  <input
                    name="ubicacion.caja"
                    value={nuevaSolicitud.ubicacion.caja}
                    onChange={actualizarNuevaSolicitud}
                    className={erroresNuevo.ubicacionCaja ? "error" : ""}
                    placeholder="12"
                  />
                </div>

                <div className="campo ">
                  <label>Motivo *</label>
                  <textarea
                    name="motivo"
                    rows="3"
                    value={nuevaSolicitud.motivo}
                    onChange={actualizarNuevaSolicitud}
                    className={erroresNuevo.motivo ? "error" : ""}
                    placeholder="Explique la razón de la solicitud..."
                  />
                </div>
              </div>
            )}

            <div className="detalle-footer">
              <button
                className="btn-secondary"
                onClick={() => setMostrarModalNuevo(false)}
              >
                Cancelar
              </button>

              {nuevoPaso === 1 ? (
                <button className="btn-primary" onClick={avanzarPaso}>
                  Siguiente
                </button>
              ) : (
                <>
                  <button className="btn-secondary" onClick={retrocederPaso}>
                    Atrás
                  </button>
                  <button
                    className="btn-primary"
                    onClick={registrarNuevaSolicitud}
                    disabled={guardando}
                  >
                    {guardando ? "Registrando..." : "Registrar solicitud"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {ficha && (
        <div style={overlayStyle} onClick={cerrarDetalle}>
          <div
            className="expedientes-modal"
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="expedientes-modal-header">
              <div>
                <span className="expedientes-badge">Detalle de archivo</span>
                <h3>{ficha.id}</h3>
                <p>{ficha.expediente} · {ficha.solicitante}</p>
              </div>

              <button className="btn-close" onClick={cerrarDetalle}>✕</button>
            </div>

            <div className="detalle-tabs">
              <button
                className={`detalle-tab ${detalleVista === "resumen" ? "active" : ""}`}
                onClick={() => setDetalleVista("resumen")}
              >
                Resumen
              </button>

              <button
                className={`detalle-tab ${detalleVista === "movimientos" ? "active" : ""}`}
                onClick={() => setDetalleVista("movimientos")}
              >
                Movimientos
              </button>

              <button
                className={`detalle-tab ${detalleVista === "ubicacion" ? "active" : ""}`}
                onClick={() => setDetalleVista("ubicacion")}
              >
                Ubicación física
              </button>

              <button
                className={`detalle-tab ${detalleVista === "historial" ? "active" : ""}`}
                onClick={() => setDetalleVista("historial")}
              >
                Historial
              </button>
            </div>

            {renderDetalle()}

            <div className="detalle-footer">
              <button className="btn-secondary" onClick={cerrarDetalle}>
                Cerrar caso
              </button>
            </div>
          </div>
        </div>
      )}

      <PinModalWrapper />
    </div>
  );
}