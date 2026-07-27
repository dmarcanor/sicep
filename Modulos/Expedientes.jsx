import { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./css/Expedientes.css";
import { api } from "../src/api";
import { usePinAction } from "../src/hooks/usePinAction";

export default function Expedientes({ expedientesBase = [] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [ficha, setFicha] = useState(null);
  const [detalleVista, setDetalleVista] = useState("resumen");

  const [bitacoras, setBitacoras] = useState({});
  const [estatusFisico, setEstatusFisico] = useState({});
  const [pdfResumenes, setPdfResumenes] = useState({});

  const [bitacoraForm, setBitacoraForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    nota: "",
  });

  const [detalleErrores, setDetalleErrores] = useState({});

  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState("");
  const [nuevoExpediente, setNuevoExpediente] = useState({
    id: "",
    fecha: "",
    hora_registro: "",
    nino: "",
    representante: "",
    cedula_representante: "",
    sector: "",
    estatus: "Registrado",
    prioridad: "Media",
    tipificacion: "",
    causa: "",
  });
  const [erroresNuevo, setErroresNuevo] = useState({});

  const [expedientesManual, setExpedientesManual] = useState([]);
  const [expedientesAPI, setExpedientesAPI] = useState([]);
  const [representantes, setRepresentantes] = useState([]);
  const { executeWithPin, PinModalWrapper } = usePinAction();

  useEffect(() => {
    api.getExpedientes().then(data => {
      setExpedientesAPI(data);
    }).catch(console.error);

    api.getRepresentantes().then(data => {
      setRepresentantes(data);
    }).catch(console.error);
  }, []);

  const expedientesBaseCombinado = useMemo(() => {
    return [...expedientesAPI, ...expedientesBase, ...expedientesManual];
  }, [expedientesAPI, expedientesBase, expedientesManual]);

  const expedientes = useMemo(() => {
    return expedientesBaseCombinado.filter((item) => {
      const q = busqueda.toLowerCase().trim();
      const coincideBusqueda =
        !q || Object.values(item).join(" ").toLowerCase().includes(q);

      const coincideFiltro = filtro === "Todos" ? true : item.estatus === filtro;

      return coincideBusqueda && coincideFiltro;
    });
  }, [busqueda, filtro, expedientesBaseCombinado]);

  const abrirDetalle = (row) => {
    setFicha(row);
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

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(expedientes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expedientes");
    XLSX.writeFile(wb, "expedientes-urd.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("REPORTE DE EXPEDIENTES URD", 14, 14);

    autoTable(doc, {
      startY: 22,
      head: [["ID", "Fecha", "NNA", "Representante", "Sector", "Estado", "Prioridad"]],
      body: expedientes.map((e) => [
        e.id,
        e.fecha,
        e.nino,
        e.representante,
        e.sector,
        e.estatus,
        e.prioridad,
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [24, 48, 78],
      },
    });

    doc.save("expedientes-urd.pdf");
  };

  const columnas = [
    {
      name: "Expediente",
      selector: (r) => r.id,
      sortable: true,
      width: "170px",
    },
    {
      name: "Fecha",
      selector: (r) => r.fecha,
      sortable: true,
      width: "120px",
    },
    {
      name: "NNA",
      selector: (r) => r.nino,
      sortable: true,
    },
    {
      name: "Representante",
      selector: (r) => r.representante,
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
      name: "Prioridad",
      cell: (r) => (
        <span className={`chip prioridad-${r.prioridad.toLowerCase()}`}>
          {r.prioridad}
        </span>
      ),
      width: "120px",
    },
  ];

  const guardarBitacora = () => {
    if (!ficha) return;

    const errores = {};
    if (!bitacoraForm.fecha) errores.fecha = true;
    if (!bitacoraForm.nota.trim()) errores.nota = true;

    setDetalleErrores(errores);

    if (Object.keys(errores).length > 0) {
      alert("Complete la fecha y la actuación antes de guardar.");
      return;
    }

    const nuevaEntrada = {
      fecha: bitacoraForm.fecha,
      nota: bitacoraForm.nota.trim(),
    };

    setBitacoras((prev) => ({
      ...prev,
      [ficha.id]: [...(prev[ficha.id] || []), nuevaEntrada],
    }));

    setBitacoraForm({
      fecha: new Date().toISOString().slice(0, 10),
      nota: "",
    });

    alert("Bitácora guardada con éxito.");
  };

  const cambiarEstatusFisico = (nuevoEstatus) => {
    if (!ficha) return;

    setEstatusFisico((prev) => ({
      ...prev,
      [ficha.id]: nuevoEstatus,
    }));

    alert(`Cambio exitoso: expediente físico actualizado a "${nuevoEstatus}".`);
  };

  const manejarPdfResumen = (e) => {
    if (!ficha) return;

    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (archivo.type !== "application/pdf") {
      alert("Solo se permite cargar archivos PDF.");
      return;
    }

    const url = URL.createObjectURL(archivo);

    setPdfResumenes((prev) => ({
      ...prev,
      [ficha.id]: {
        nombre: archivo.name,
        url,
      },
    }));

    alert("Resumen PDF cargado correctamente.");
  };

  const verPdfResumen = () => {
    if (!ficha) return;

    const pdf = pdfResumenes[ficha.id];
    if (!pdf?.url) {
      alert("No hay PDF cargado para este expediente.");
      return;
    }

    window.open(pdf.url, "_blank", "noopener,noreferrer");
  };

  const quitarPdfResumen = () => {
    if (!ficha) return;

    setPdfResumenes((prev) => {
      const copia = { ...prev };
      delete copia[ficha.id];
      return copia;
    });

    alert("PDF eliminado del expediente.");
  };

  const generarPlantilla = (tipo) => {
    if (!ficha) return;

    const bitacoraActual = bitacoras[ficha.id] || [];
    const estatusActual = estatusFisico[ficha.id] || "Pendiente";
    const pdfActual = pdfResumenes[ficha.id]?.nombre || "No cargado";

    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text(`PLANTILLA DE ${tipo.toUpperCase()}`, 14, 14);

    doc.setFontSize(10);
    doc.text(`Expediente: ${ficha.id}`, 14, 24);
    doc.text(`NNA: ${ficha.nino}`, 14, 30);
    doc.text(`Representante: ${ficha.representante}`, 14, 36);
    doc.text(`Sector: ${ficha.sector}`, 14, 42);
    doc.text(`Estado actual: ${ficha.estatus}`, 14, 48);
    doc.text(`Espejo digital: ${estatusActual}`, 14, 54);
    doc.text(`PDF resumen: ${pdfActual}`, 14, 60);

    autoTable(doc, {
      startY: 70,
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

    doc.save(`${tipo.toLowerCase()}-${ficha.id}.pdf`);
    alert(`Documento "${tipo}" generado correctamente.`);
  };

  const abrirModalNuevo = () => {
    setNuevoExpediente({
      id: "",
      fecha: "",
      nino: "",
      representante: "",
      sector: "",
      estatus: "Registrado",
      prioridad: "Media",
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

  const validarNuevoExpediente = () => {
    const errores = {};

    if (!nuevoExpediente.id.trim()) errores.id = true;
    if (!nuevoExpediente.fecha) errores.fecha = true;
    if (!nuevoExpediente.nino.trim()) errores.nino = true;
    if (!nuevoExpediente.representante.trim()) errores.representante = true;
    if (!nuevoExpediente.sector.trim()) errores.sector = true;
    if (!nuevoExpediente.estatus.trim()) errores.estatus = true;
    if (!nuevoExpediente.prioridad.trim()) errores.prioridad = true;

    setErroresNuevo(errores);

    return Object.keys(errores).length === 0;
  };

  const registrarNuevoExpediente = async () => {
    if (!validarNuevoExpediente()) return;

    try {
      await executeWithPin(async (pin) => {
        const expedienteCreado = {
          ...nuevoExpediente,
          id: nuevoExpediente.id.trim(),
          fecha: nuevoExpediente.fecha,
          nino: nuevoExpediente.nino.trim(),
          representante: nuevoExpediente.representante.trim(),
          cedula_representante: nuevoExpediente.cedula_representante?.trim() || "",
          sector: nuevoExpediente.sector.trim(),
          estatus: nuevoExpediente.estatus.trim(),
          prioridad: nuevoExpediente.prioridad.trim(),
        };

        await api.createExpediente(expedienteCreado, pin);
        setExpedientesManual((prev) => [expedienteCreado, ...prev]);
        setMostrarModalNuevo(false);
        setRegistroExitoso(`Expediente ${expedienteCreado.id} registrado con éxito.`);
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
            <p><b>Expediente:</b> {ficha.id}</p>
            <p><b>NNA:</b> {ficha.nino}</p>
            <p><b>Representante:</b> {ficha.representante}</p>
            <p><b>Sector:</b> {ficha.sector}</p>
          </div>

          <div className="detalle-card">
            <h4>Estado actual</h4>
            <p><b>Estatus:</b> {ficha.estatus}</p>
            <p><b>Prioridad:</b> {ficha.prioridad}</p>
            <p><b>Fecha:</b> {ficha.fecha}</p>
            <p><b>Vista física:</b> {estatusFisico[ficha.id] || "Pendiente"}</p>
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
              bitacoras[ficha.id].map((item, index) => (
                <div key={`${item.fecha}-${index}`} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <strong>{item.fecha}</strong>
                    <span>{item.nota}</span>
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
            <strong>{estatusFisico[ficha.id] || "Pendiente"}</strong>
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
              <small>{pdfResumenes[ficha.id]?.nombre || "Sin archivo cargado"}</small>

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
            <li>{ficha.nino}</li>
            <li>{ficha.representante}</li>
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
            <option>Registrado</option>
            <option>En revisión</option>
            <option>Aprobado</option>
            <option>Observado</option>
          </select>
        </div>

        <div className="toolbar-right">
          <button className="btn-export" onClick={exportarExcel}>📊 Excel</button>
          <button className="btn-export" onClick={exportarPDF}>🧾 PDF</button>
        </div>
      </div>

      <DataTable
        columns={columnas}
        data={expedientes}
        pagination
        highlightOnHover
        pointerOnHover
        responsive
        dense
        striped
        onRowClicked={abrirDetalle}
        customStyles={{
          headCells: {
            style: {
              fontSize: "12px",
              fontWeight: 700,
              color: "#41556E",
              backgroundColor: "#F4F8FD",
            },
          },
          cells: {
            style: {
              fontSize: "12px",
              color: "#223043",
            },
          },
        }}
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
              <div className="campo">
                <label>Código de expediente *</label>
                <input
                  name="id"
                  value={nuevoExpediente.id}
                  onChange={actualizarNuevo}
                  className={erroresNuevo.id ? "error" : ""}
                  placeholder="URD-2026-000130"
                />
              </div>

              <div className="campo">
                <label>Fecha *</label>
                <input
                  type="date"
                  name="fecha"
                  value={nuevoExpediente.fecha}
                  onChange={actualizarNuevo}
                  className={erroresNuevo.fecha ? "error" : ""}
                />
              </div>

              <div className="campo">
                <label>Estatus *</label>
                <select
                  name="estatus"
                  value={nuevoExpediente.estatus}
                  onChange={actualizarNuevo}
                  className={erroresNuevo.estatus ? "error" : ""}
                >
                  <option value="">Seleccione</option>
                  <option>Registrado</option>
                  <option>En revisión</option>
                  <option>Aprobado</option>
                  <option>Observado</option>
                </select>
              </div>

              <div className="campo">
                <label>Prioridad *</label>
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
              </div>

              <div className="campo">
                <label>Hora de Registro</label>
                <input
                  type="time"
                  name="hora_registro"
                  value={nuevoExpediente.hora_registro || ""}
                  onChange={actualizarNuevo}
                />
              </div>

              <div className="campo">
                <label>Tipificación</label>
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
              </div>

              <div className="campo ancho">
                <label>Causa</label>
                <textarea
                  name="causa"
                  value={nuevoExpediente.causa || ""}
                  onChange={actualizarNuevo}
                  rows={3}
                  placeholder="Describa la causa del expediente"
                />
              </div>

              <div className="campo ">
                <label>NNA *</label>
                <input
                  name="nino"
                  value={nuevoExpediente.nino}
                  onChange={actualizarNuevo}
                  className={erroresNuevo.nino ? "error" : ""}
                  placeholder="Nombre completo del NNA"
                />
              </div>

              <div className="campo ">
                <label>Representante *</label>
                <input
                  name="representante"
                  value={nuevoExpediente.representante}
                  onChange={actualizarNuevo}
                  className={erroresNuevo.representante ? "error" : ""}
                  placeholder="Nombre completo del representante"
                />
              </div>

              <div className="campo ">
                <label>Cédula del Representante</label>
                <input
                  name="cedula_representante"
                  value={nuevoExpediente.cedula_representante || ""}
                  onChange={actualizarNuevo}
                  placeholder="V-12345678"
                />
              </div>

              <div className="campo ancho">
                <label>Sector *</label>
                <input
                  name="sector"
                  value={nuevoExpediente.sector}
                  onChange={actualizarNuevo}
                  className={erroresNuevo.sector ? "error" : ""}
                  placeholder="Ej. Centro, Guariquén..."
                />
              </div>
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
                <h3>{ficha.id}</h3>
                <p>{ficha.nino} · {ficha.representante}</p>
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