import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./css/Expedientes.css";
import { api } from "../src/api";
import { membretePDF, pieDePaginaPDF, hojaConMembrete } from "../src/exportar";
import { usePinAction } from "../src/hooks/usePinAction";
import { formatearFecha, hoyISO } from "../src/formato";
import { alertaLapso, useInstitucion } from "../src/institucion";
import { useBusquedaDiferida } from "../src/hooks/useBusquedaDiferida";
import { estilosTabla } from "../src/tablaEstilos";
import Campo from "../componentes/Campo";
import { AYUDAS_EXPEDIENTE } from "../src/ayudas";
import SelectorConAlta, {
  CAMPOS_NNA,
  CAMPOS_REPRESENTANTE,
  etiquetaNna,
  etiquetaRepresentante,
} from "../componentes/SelectorConAlta";

// Debe coincidir con el enum de la columna expedientes.estatus.
const ESTATUS_EXPEDIENTE = ["Registrado", "En revisión", "Aprobado", "Observado", "Cerrado"];

export default function Expedientes() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [ficha, setFicha] = useState(null);
  const [detalleVista, setDetalleVista] = useState("resumen");

  const [bitacoras, setBitacoras] = useState({});

  const [bitacoraForm, setBitacoraForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    nota: "",
  });

  const [detalleErrores, setDetalleErrores] = useState({});

  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState("");
  const [nuevoExpediente, setNuevoExpediente] = useState({
    fecha: "",
    hora_registro: "",
    nna_id: null,
    representante_id: null,
    sector: "",
    prioridad: "Media",
    tipificacion: "",
    causa: "",
  });
  const [erroresNuevo, setErroresNuevo] = useState({});

  const [expedientesAPI, setExpedientesAPI] = useState([]);
  const [representantes, setRepresentantes] = useState([]);
  const [nnas, setNnas] = useState([]);
  const { executeWithPin, PinModalWrapper } = usePinAction();

  // Suscribe el módulo a los ajustes: alertaLapso lee los umbrales de
  // Configuración → Sistema, y sin esto la columna seguía pintando los
  // valores que hubiera al montar la pantalla.
  useInstitucion();

  const [cambiandoEstatus, setCambiandoEstatus] = useState(false);
  const [errorEstatus, setErrorEstatus] = useState("");

  // El filtrado lo hace la API: antes se descargaba la lista completa y se
  // filtraba en memoria, lo que no aguanta un archivo real.
  const recargarExpedientes = () => {
    const params = {};
    const q = busqueda.trim();
    if (q) params.search = q;
    if (filtro !== "Todos") params.estatus = filtro;

    return api.getExpedientes(params).then(setExpedientesAPI).catch(console.error);
  };

  // El estatus es el ciclo de vida legal del expediente
  // (Registrado → En revisión → Aprobado / Observado → Cerrado).
  const cambiarEstatus = async (estatus) => {
    if (!ficha || estatus === ficha.estatus) return;

    setErrorEstatus("");
    setCambiandoEstatus(true);

    try {
      const actualizado = await executeWithPin(
        (pin) => api.updateExpediente(ficha.id, { estatus }, pin),
        "Cambiar estatus del expediente",
      );

      setFicha(actualizado);
      await recargarExpedientes();
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        setErrorEstatus(error.message || "No se pudo cambiar el estatus.");
      }
    } finally {
      setCambiandoEstatus(false);
    }
  };

  useEffect(() => {
    api.getRepresentantes().then(setRepresentantes).catch(console.error);
    api.getNna().then(setNnas).catch(console.error);
  }, []);

  const busquedaDiferida = useBusquedaDiferida(busqueda);

  useEffect(() => {
    const params = {};
    if (busquedaDiferida.trim()) params.search = busquedaDiferida.trim();
    if (filtro !== "Todos") params.estatus = filtro;
    api.getExpedientes(params).then(setExpedientesAPI).catch(console.error);
  }, [busquedaDiferida, filtro]);

  const expedientes = expedientesAPI;

  const cargarBitacora = (expedienteId) =>
    api.getBitacora(expedienteId)
      .then((entradas) => setBitacoras((prev) => ({ ...prev, [expedienteId]: entradas })))
      .catch(console.error);

  const abrirDetalle = (row) => {
    setFicha(row);
    cargarBitacora(row.id);
    setDetalleVista("resumen");
    setBitacoraForm({
      fecha: new Date().toISOString().slice(0, 10),
      nota: "",
    });
    setDetalleErrores({});
  };

  const cerrarDetalle = () => {
    setFicha(null);
    setDetalleErrores({});
    setDetalleVista("resumen");
  };

  // Las filas traen relaciones anidadas; se aplanan para que Excel/PDF no
  // reciban objetos.
  const filasExportables = () =>
    expedientes.map((e) => ({
      Expediente: e.codigo,
      Fecha: formatearFecha(e.fecha),
      NNA: e.nna_nombre || "",
      Representante: e.representante_nombre || "",
      Sector: e.sector,
      Estatus: e.estatus,
      Prioridad: e.prioridad,
      Tipificacion: e.tipificacion || "",
    }));

  const exportarExcel = () => {
    const ws = hojaConMembrete(filasExportables(), "REPORTE DE EXPEDIENTES URD");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expedientes");
    XLSX.writeFile(wb, "expedientes-urd.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF();

    const inicioY = membretePDF(doc, "REPORTE DE EXPEDIENTES URD");

    autoTable(doc, {
      startY: inicioY,
      head: [["Expediente", "Fecha", "NNA", "Representante", "Sector", "Estado", "Prioridad"]],
      body: filasExportables().map((e) => [
        e.Expediente,
        e.Fecha,
        e.NNA,
        e.Representante,
        e.Sector,
        e.Estatus,
        e.Prioridad,
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [24, 48, 78],
      },
    });

    pieDePaginaPDF(doc);

    doc.save("expedientes-urd.pdf");
  };

  const columnas = [
    {
      name: "Expediente",
      selector: (r) => r.codigo,
      sortable: true,
      width: "170px",
    },
    {
      name: "Fecha",
      selector: (r) => formatearFecha(r.fecha),
      sortable: true,
      width: "120px",
    },
    {
      name: "NNA",
      selector: (r) => r.nna_nombre || "",
      sortable: true,
    },
    {
      name: "Representante",
      selector: (r) => r.representante_nombre || "",
    },
    {
      name: "Sector",
      selector: (r) => r.sector,
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
    {
      name: "Lapso",
      cell: (r) => {
        const alerta = alertaLapso(r.fecha);
        if (!alerta || r.estatus === "Cerrado") return <span className="chip">—</span>;
        return <span className={`chip lapso-${alerta.nivel}`}>{alerta.texto}</span>;
      },
      width: "160px",
    },
    {
      name: "Prioridad",
      cell: (r) => (
        <span className={`chip prioridad-${r.prioridad.toLowerCase()}`}>
          {r.prioridad}
        </span>
      ),
      width: "120px",
    },
  ];

  const guardarBitacora = async () => {
    if (!ficha) return;

    const errores = {};
    if (!bitacoraForm.fecha) errores.fecha = true;
    if (!bitacoraForm.nota.trim()) errores.nota = true;

    setDetalleErrores(errores);

    if (Object.keys(errores).length > 0) {
      alert("Complete la fecha y la actuación antes de guardar.");
      return;
    }

    try {
      await executeWithPin(
        (pin) => api.createActuacion(
          ficha.id,
          { fecha: bitacoraForm.fecha, nota: bitacoraForm.nota.trim() },
          pin,
        ),
        "Registrar actuación en bitácora",
      );

      await cargarBitacora(ficha.id);
      setBitacoraForm({ fecha: hoyISO(), nota: "" });
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        alert(error.message || "No se pudo registrar la actuación.");
      }
    }
  };

  // Guarda en el expediente dónde está la carpeta física.
  const cambiarEstatusFisico = async (nuevoEstatus) => {
    if (!ficha || nuevoEstatus === ficha.estatus_fisico) return;

    try {
      const actualizado = await executeWithPin(
        (pin) => api.updateExpediente(ficha.id, { estatus_fisico: nuevoEstatus }, pin),
        "Mover el expediente físico",
      );
      setFicha(actualizado);
      await recargarExpedientes();
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        alert(error.message || "No se pudo actualizar el estatus físico.");
      }
    }
  };

  const manejarPdfResumen = async (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";

    if (!ficha || !archivo) return;

    if (archivo.type !== "application/pdf") {
      alert("Solo se permite cargar archivos PDF.");
      return;
    }

    try {
      const actualizado = await executeWithPin(
        (pin) => api.subirResumen(ficha.id, archivo, pin),
        "Cargar resumen del expediente",
      );
      setFicha(actualizado);
      await recargarExpedientes();
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        alert(error.message || "No se pudo cargar el resumen.");
      }
    }
  };

  const verPdfResumen = async () => {
    if (!ficha?.resumen_pdf_nombre) {
      alert("No hay PDF cargado para este expediente.");
      return;
    }

    try {
      // El archivo va protegido por sesión, así que se descarga y se abre
      // desde memoria en vez de apuntar el navegador a una URL.
      const blob = await api.descargarResumen(ficha.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      alert(error.message || "No se pudo abrir el resumen.");
    }
  };

  const quitarPdfResumen = async () => {
    if (!ficha?.resumen_pdf_nombre) return;
    if (!confirm("¿Retirar el resumen PDF de este expediente?")) return;

    try {
      const actualizado = await executeWithPin(
        (pin) => api.quitarResumen(ficha.id, pin),
        "Retirar resumen del expediente",
      );
      setFicha(actualizado);
      await recargarExpedientes();
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        alert(error.message || "No se pudo retirar el resumen.");
      }
    }
  };

  const generarPlantilla = (tipo) => {
    if (!ficha) return;

    const bitacoraActual = bitacoras[ficha.id] || [];
    const estatusActual = ficha.estatus_fisico || "Pendiente";
    const pdfActual = ficha.resumen_pdf_nombre || "No cargado";

    const doc = new jsPDF();

    const inicioY = membretePDF(doc, `PLANTILLA DE ${tipo.toUpperCase()}`, `Expediente ${ficha.codigo}`);

    doc.setFontSize(10);
    doc.text(`NNA: ${ficha.nna_nombre}`, 14, inicioY + 2);
    doc.text(`Representante: ${ficha.representante_nombre}`, 14, inicioY + 8);
    doc.text(`Sector: ${ficha.sector}`, 14, inicioY + 14);
    doc.text(`Estado actual: ${ficha.estatus}`, 14, inicioY + 20);
    doc.text(`Espejo digital: ${estatusActual}`, 14, inicioY + 26);
    doc.text(`PDF resumen: ${pdfActual}`, 14, inicioY + 32);

    autoTable(doc, {
      startY: inicioY + 40,
      head: [["Fecha", "Actuación"]],
      body: bitacoraActual.length
        ? bitacoraActual.map((b) => [b.fecha, b.nota])
        : [["Sin registros", "No se han cargado actuaciones en la bitácora"]],
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [24, 48, 78],
      },
    });

    pieDePaginaPDF(doc);
    doc.save(`${tipo.toLowerCase()}-${ficha.codigo}.pdf`);
    alert(`Documento "${tipo}" generado correctamente.`);
  };

  const abrirModalNuevo = () => {
    setNuevoExpediente({
      fecha: "",
      hora_registro: "",
      nna_id: null,
      representante_id: null,
      sector: "",
      prioridad: "Media",
      tipificacion: "",
      causa: "",
    });
    setErroresNuevo({});
    setMostrarModalNuevo(true);
  };

  const actualizarNuevo = (e) => {
    setNuevoExpediente((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const crearNna = async (datos) => {
    const creado = await executeWithPin(
      (pin) => api.createNna(datos, pin),
      "Registrar NNA"
    );
    setNnas((prev) => [...prev, creado]);
    return creado;
  };

  const crearRepresentante = async (datos) => {
    const creado = await executeWithPin(
      (pin) => api.createRepresentante(datos, pin),
      "Registrar representante"
    );
    setRepresentantes((prev) => [...prev, creado]);
    return creado;
  };

  const validarNuevoExpediente = () => {
    const errores = {};

    if (!nuevoExpediente.fecha) {
      errores.fecha = "Indique la fecha del expediente.";
    } else if (nuevoExpediente.fecha > hoyISO()) {
      errores.fecha = "La fecha del expediente no puede ser futura.";
    }

    if (!nuevoExpediente.nna_id) errores.nna_id = "Seleccione el NNA del expediente.";
    if (!nuevoExpediente.representante_id)
      errores.representante_id = "Seleccione el representante.";
    if (!nuevoExpediente.sector.trim()) errores.sector = "Indique el sector.";
    if (!nuevoExpediente.prioridad) errores.prioridad = "Seleccione la prioridad.";

    setErroresNuevo(errores);

    return Object.keys(errores).length === 0;
  };

  const registrarNuevoExpediente = async () => {
    if (!validarNuevoExpediente()) return;

    try {
      await executeWithPin(async (pin) => {
        const creado = await api.createExpediente(
          {
            fecha: nuevoExpediente.fecha,
            hora_registro: nuevoExpediente.hora_registro || null,
            nna_id: nuevoExpediente.nna_id,
            representante_id: nuevoExpediente.representante_id,
            sector: nuevoExpediente.sector.trim(),
            prioridad: nuevoExpediente.prioridad,
            tipificacion: nuevoExpediente.tipificacion || null,
            causa: nuevoExpediente.causa || null,
          },
          pin
        );

        await recargarExpedientes();
        setMostrarModalNuevo(false);
        setRegistroExitoso(`Expediente ${creado.codigo} registrado con éxito.`);
        setTimeout(() => setRegistroExitoso(""), 3000);
      }, "Crear Expediente");
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        alert(error.message || "Error al crear expediente");
      }
    }
  };

  const renderDetalle = () => {
    if (!ficha) return null;

    if (detalleVista === "resumen") {
      return (
        <div className="detalle-grid">
          <div className="detalle-card">
            <h4>Resumen general</h4>
            <p><b>Expediente:</b> {ficha.codigo}</p>
            <p><b>NNA:</b> {ficha.nna_nombre}</p>
            <p><b>Representante:</b> {ficha.representante_nombre}</p>
            <p><b>Sector:</b> {ficha.sector}</p>
          </div>

          <div className="detalle-card">
            <h4>Estado actual</h4>
            <p><b>Prioridad:</b> {ficha.prioridad}</p>
            <p><b>Fecha:</b> {formatearFecha(ficha.fecha)}</p>
            <p><b>Vista física:</b> {ficha.estatus_fisico || "Pendiente"}</p>

            <label className="detalle-estatus">
              <span><b>Estatus:</b></span>
              <select
                value={ficha.estatus}
                disabled={cambiandoEstatus}
                onChange={(e) => cambiarEstatus(e.target.value)}
              >
                {ESTATUS_EXPEDIENTE.map((estatus) => (
                  <option key={estatus} value={estatus}>{estatus}</option>
                ))}
              </select>
            </label>

            {errorEstatus && <p className="detalle-error">{errorEstatus}</p>}
          </div>
        </div>
      );
    }

    if (detalleVista === "bitacora") {
      return (
        <div className="detalle-card">
          <h4>Bitácora de actuaciones</h4>

          <div className="bitacora-form">
            <input
              type="date"
              max={hoyISO()}
              value={bitacoraForm.fecha}
              onChange={(e) =>
                setBitacoraForm((prev) => ({ ...prev, fecha: e.target.value }))
              }
              className={detalleErrores.fecha ? "error" : ""}
            />

            <textarea
              rows="3"
              placeholder="Ej. 07/06/2026 - Se emitió Boleta de Citación"
              value={bitacoraForm.nota}
              onChange={(e) =>
                setBitacoraForm((prev) => ({ ...prev, nota: e.target.value }))
              }
              className={detalleErrores.nota ? "error" : ""}
            />

            <button className="btn-primary small" onClick={guardarBitacora}>
              Guardar actuación
            </button>
          </div>

          <div className="timeline">
            {(bitacoras[ficha.id] || []).length === 0 ? (
              <div className="timeline-empty">
                No hay actuaciones registradas aún.
              </div>
            ) : (
              bitacoras[ficha.id].map((item) => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <strong>{formatearFecha(item.fecha)}</strong>
                    <span>{item.nota}</span>
                    {/* Quién firma la actuación importa: es un registro legal. */}
                    <small className="timeline-autor">
                      Registrada por {item.usuario?.display_name || item.usuario?.name || "—"}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (detalleVista === "espejo") {
      return (
        <div className="detalle-card">
          <h4>Espejo Digital</h4>

          <div className="estatus-fisico">
            <span className="detalle-label">Estatus físico actual</span>
            <strong>{ficha.estatus_fisico || "Pendiente"}</strong>
          </div>

          <div className="espejo-actions">
            <button
              className="btn-secondary"
              onClick={() => cambiarEstatusFisico("En Despacho")}
            >
              En Despacho
            </button>

            <button
              className="btn-secondary"
              onClick={() => cambiarEstatusFisico("En Archivo Central")}
            >
              En Archivo Central
            </button>
          </div>

          <div className="pdf-box">
            <span className="detalle-label">Resumen final PDF</span>
            <input type="file" accept="application/pdf" onChange={manejarPdfResumen} />
            <div className="pdf-row">
              <small>{ficha.resumen_pdf_nombre || "Sin archivo cargado"}</small>

              <div className="pdf-actions">
                <button className="btn-link" onClick={verPdfResumen}>Ver</button>
                <button className="btn-link" onClick={quitarPdfResumen}>Quitar</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="detalle-card">
        <h4>Plantillas de automatización</h4>
        <p className="detalle-texto">
          Genere documentos auto-cumplimentados a partir de los datos del expediente.
        </p>

        <div className="plantilla-actions">
          <button
            className="btn-secondary"
            onClick={() => generarPlantilla("Citación")}
          >
            Generar Citación
          </button>

          <button
            className="btn-secondary"
            onClick={() => generarPlantilla("Medida")}
          >
            Generar Medida
          </button>
        </div>

        <div className="plantilla-box">
          <span className="detalle-label">Contenido automático</span>
          <ul>
            <li>{ficha.nna_nombre}</li>
            <li>{ficha.representante_nombre}</li>
            <li>{ficha.sector}</li>
            <li>{ficha.estatus}</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="expedientes">
      <div className="expedientes-header">
        <div>
          <span className="expedientes-badge">Gestión de casos</span>
          <h2>Expedientes</h2>
          <p>Listado operativo de casos registrados para consulta, edición y seguimiento.</p>
        </div>

        <button className="btn-primary" onClick={abrirModalNuevo}>
          + Nuevo expediente
        </button>
      </div>

      {registroExitoso && (
        <div className="toast-exito">
          {registroExitoso}
        </div>
      )}

      <div className="datatable-toolbar">
        <div className="toolbar-left">
          <span className="datatable-info">
            Total: <b>{expedientes.length}</b> registros
          </span>
        </div>

        <div className="toolbar-center">
          <input
            className="datatable-input"
            placeholder="Buscar expediente, NNA, representante o sector..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            className="datatable-select"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            <option>Todos</option>
            {ESTATUS_EXPEDIENTE.map((estatus) => (
              <option key={estatus}>{estatus}</option>
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
        data={expedientes}
        pagination
        highlightOnHover
        pointerOnHover
        responsive
        onRowClicked={abrirDetalle}
      />

      {mostrarModalNuevo && (
        <div className="expedientes-modal-overlay" onClick={() => setMostrarModalNuevo(false)}>
          <div className="expedientes-modal modal-nuevo" onClick={(e) => e.stopPropagation()}>
            <div className="expedientes-modal-header">
              <div>
                <span className="expedientes-badge">Crear expediente</span>
                <h3>Nuevo expediente URD</h3>
                <p>Complete todos los campos antes de registrar.</p>
              </div>

              <button className="btn-close" onClick={() => setMostrarModalNuevo(false)}>
                ✕
              </button>
            </div>

            <div className="form-nuevo-expediente">
              <Campo
                label="Fecha *"
                ayuda={AYUDAS_EXPEDIENTE.fecha}
                error={erroresNuevo.fecha}
              >
                <input
                  type="date"
                  name="fecha"
                  value={nuevoExpediente.fecha}
                  onChange={actualizarNuevo}
                  max={hoyISO()}
                  className={erroresNuevo.fecha ? "error" : ""}
                />
                {erroresNuevo.fecha && (
                  <small style={{ color: "#c0392b", display: "block", marginTop: "4px" }}>
                    {erroresNuevo.fecha}
                  </small>
                )}
              </Campo>

              <Campo
                label="Prioridad *"
                ayuda={AYUDAS_EXPEDIENTE.prioridad}
                error={erroresNuevo.prioridad}
              >
                <select
                  name="prioridad"
                  value={nuevoExpediente.prioridad}
                  onChange={actualizarNuevo}
                  className={erroresNuevo.prioridad ? "error" : ""}
                >
                  <option value="">Seleccione</option>
                  <option>Baja</option>
                  <option>Media</option>
                  <option>Alta</option>
                </select>
              </Campo>

              <Campo
                label="Hora de Registro"
                ayuda={AYUDAS_EXPEDIENTE.hora_registro}
                error={erroresNuevo.hora_registro}
              >
                <input
                  type="time"
                  name="hora_registro"
                  value={nuevoExpediente.hora_registro || ""}
                  onChange={actualizarNuevo}
                />
              </Campo>

              <Campo
                label="Tipificación"
                ayuda={AYUDAS_EXPEDIENTE.tipificacion}
                error={erroresNuevo.tipificacion}
              >
                <select
                  name="tipificacion"
                  value={nuevoExpediente.tipificacion || ""}
                  onChange={actualizarNuevo}
                >
                  <option value="">Seleccione</option>
                  <option>Maltrato Físico</option>
                  <option>Abuso Sexual</option>
                  <option>Negligencia</option>
                  <option>Acoso Escolar</option>
                  <option>Trabajo Infantil</option>
                  <option>Violencia Psicológica</option>
                  <option>Abandono</option>
                  <option>Explotación</option>
                  <option>Otro</option>
                </select>
              </Campo>

              <Campo
                label="Causa"
                ayuda={AYUDAS_EXPEDIENTE.causa}
                error={erroresNuevo.causa}
                ancho
              >
                <textarea
                  name="causa"
                  value={nuevoExpediente.causa || ""}
                  onChange={actualizarNuevo}
                  rows={3}
                  placeholder="Describa la causa del expediente"
                />
              </Campo>

              <SelectorConAlta
                label="NNA *"
                value={nuevoExpediente.nna_id}
                onChange={(id) =>
                  setNuevoExpediente((prev) => ({ ...prev, nna_id: id }))
                }
                opciones={nnas}
                getEtiqueta={etiquetaNna}
                camposAlta={CAMPOS_NNA}
                onCrear={crearNna}
                error={erroresNuevo.nna_id}
                ayuda={AYUDAS_EXPEDIENTE.nna}
                placeholder="Seleccione un NNA"
                textoAlta="+ Nuevo NNA"
              />

              <SelectorConAlta
                label="Representante *"
                value={nuevoExpediente.representante_id}
                onChange={(id) =>
                  setNuevoExpediente((prev) => ({ ...prev, representante_id: id }))
                }
                opciones={representantes}
                getEtiqueta={etiquetaRepresentante}
                camposAlta={CAMPOS_REPRESENTANTE}
                onCrear={crearRepresentante}
                error={erroresNuevo.representante_id}
                ayuda={AYUDAS_EXPEDIENTE.representante}
                placeholder="Seleccione un representante"
                textoAlta="+ Nuevo representante"
              />

              <Campo
                label="Sector *"
                ayuda={AYUDAS_EXPEDIENTE.sector}
                error={erroresNuevo.sector}
                ancho
              >
                <input
                  name="sector"
                  value={nuevoExpediente.sector}
                  onChange={actualizarNuevo}
                  maxLength={60}
                  className={erroresNuevo.sector ? "error" : ""}
                  placeholder="Ej. Centro, Guariquén..."
                />
              </Campo>
            </div>

            <div className="detalle-footer">
              <button
                className="btn-secondary"
                onClick={() => setMostrarModalNuevo(false)}
              >
                Cancelar
              </button>

              <button
                className="btn-primary"
                onClick={registrarNuevoExpediente}
              >
                Registrar expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {ficha && (
        <div className="expedientes-modal-overlay" onClick={cerrarDetalle}>
          <div className="expedientes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="expedientes-modal-header">
              <div>
                <span className="expedientes-badge">Detalle del expediente</span>
                <h3>{ficha.codigo}</h3>
                <p>{ficha.nna_nombre} · {ficha.representante_nombre}</p>
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
                className={`detalle-tab ${detalleVista === "bitacora" ? "active" : ""}`}
                onClick={() => setDetalleVista("bitacora")}
              >
                Bitácora
              </button>

              <button
                className={`detalle-tab ${detalleVista === "espejo" ? "active" : ""}`}
                onClick={() => setDetalleVista("espejo")}
              >
                Espejo Digital
              </button>

              <button
                className={`detalle-tab ${detalleVista === "plantillas" ? "active" : ""}`}
                onClick={() => setDetalleVista("plantillas")}
              >
                Plantillas
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