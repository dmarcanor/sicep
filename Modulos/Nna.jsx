import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../src/api";
import { usePinAction } from "../src/hooks/usePinAction";
import { formatearFecha, fechaParaInput } from "../src/formato";
import { estilosTabla } from "../src/tablaEstilos";
import Campo from "../componentes/Campo";
import { AYUDAS_NNA } from "../src/ayudas";
import "./css/Expedientes.css";

export default function Nna() {
  const [nna, setNna] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nnaSeleccionado, setNnaSeleccionado] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errores, setErrores] = useState({});
  const { executeWithPin, PinModalWrapper } = usePinAction();

  const [form, setForm] = useState({
    documento_identidad: "",
    nombres: "",
    apellidos: "",
    fecha_nacimiento: "",
    sexo: "",
    lugar_nacimiento: "",
    observaciones: "",
  });

  useEffect(() => {
    cargarNna();
  }, []);

  const cargarNna = async () => {
    try {
      setCargando(true);
      const data = await api.getNna();
      setNna(data);
    } catch (error) {
      console.error("Error cargando NNA:", error);
    } finally {
      setCargando(false);
    }
  };

  const nnaFiltrado = nna.filter((item) => {
    const q = busqueda.toLowerCase();
    return (
      item.nombres.toLowerCase().includes(q) ||
      item.apellidos.toLowerCase().includes(q) ||
      item.documento_identidad.toLowerCase().includes(q)
    );
  });

  const validarDocumento = (documento) => {
    // Formato venezolano: V-12345678 o E-12345678
    const regex = /^[VE]-?\d{6,8}$/i;
    return regex.test(documento);
  };

  const validarFechaNacimiento = (fecha) => {
    if (!fecha) return false;
    const fechaNacimiento = new Date(fecha);
    const hoy = new Date();
    return fechaNacimiento <= hoy;
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!form.documento_identidad.trim()) {
      nuevosErrores.documento_identidad = "El documento es obligatorio";
    } else if (!validarDocumento(form.documento_identidad)) {
      nuevosErrores.documento_identidad = "Formato inválido (V-12345678 o E-12345678)";
    } else if (
      // Al editar, el propio registro no cuenta como duplicado de sí mismo.
      nna.some(
        (n) =>
          n.documento_identidad === form.documento_identidad.trim() &&
          n.id !== nnaSeleccionado?.id
      )
    ) {
      nuevosErrores.documento_identidad = "Este documento ya está registrado";
    }

    if (!form.nombres.trim()) {
      nuevosErrores.nombres = "Los nombres son obligatorios";
    }

    if (!form.apellidos.trim()) {
      nuevosErrores.apellidos = "Los apellidos son obligatorios";
    }

    if (!form.fecha_nacimiento) {
      nuevosErrores.fecha_nacimiento = "La fecha de nacimiento es obligatoria";
    } else if (!validarFechaNacimiento(form.fecha_nacimiento)) {
      nuevosErrores.fecha_nacimiento = "La fecha no puede ser futura";
    }

    if (!form.sexo) {
      nuevosErrores.sexo = "El sexo es obligatorio";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const abrirNuevo = () => {
    setForm({
      documento_identidad: "",
      nombres: "",
      apellidos: "",
      fecha_nacimiento: "",
      sexo: "",
      lugar_nacimiento: "",
      observaciones: "",
    });
    setNnaSeleccionado(null);
    setMostrarModal(true);
  };

  const abrirEdicion = (item) => {
    setForm({
      documento_identidad: item.documento_identidad || "",
      nombres: item.nombres || "",
      apellidos: item.apellidos || "",
      // <input type="date"> exige YYYY-MM-DD: cualquier otro formato lo deja vacío.
      fecha_nacimiento: fechaParaInput(item.fecha_nacimiento),
      sexo: item.sexo || "",
      lugar_nacimiento: item.lugar_nacimiento || "",
      observaciones: item.observaciones || "",
    });
    setNnaSeleccionado(item);
    setMostrarModal(true);
  };

  const abrirDetalle = async (item) => {
    setNnaSeleccionado(item);
    setMostrarDetalle(true);

    // El listado solo trae el conteo; los expedientes asociados vienen del
    // detalle, así que se pide aparte para poder mostrarlos.
    try {
      setNnaSeleccionado(await api.getNnaById(item.id));
    } catch (error) {
      console.error("Error cargando el detalle del NNA:", error);
    }
  };

  const guardar = async () => {
    if (!validar()) return;

    try {
      if (nnaSeleccionado) {
        await executeWithPin(async (pin) => {
          await api.updateNna(nnaSeleccionado.id, form, pin);
        }, "Editar NNA");
      } else {
        await executeWithPin(async (pin) => {
          await api.createNna(form, pin);
        }, "Crear NNA");
      }
      await cargarNna();
      setMostrarModal(false);
      setErrores({});
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        alert(error.message || "Error al guardar");
      }
    }
  };

  // Se exporta lo que hay en pantalla, con el filtro de búsqueda ya aplicado.
  const filasExportables = () =>
    nnaFiltrado.map((n) => ({
      Documento: n.documento_identidad,
      Nombres: n.nombres,
      Apellidos: n.apellidos,
      "Fecha de nacimiento": formatearFecha(n.fecha_nacimiento),
      Sexo: n.sexo,
      "Lugar de nacimiento": n.lugar_nacimiento || "",
      Expedientes: n.expedientes_count ?? 0,
    }));

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filasExportables());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NNA");
    XLSX.writeFile(wb, "nna.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("REGISTRO DE NIÑOS, NIÑAS Y ADOLESCENTES", 14, 14);

    autoTable(doc, {
      startY: 22,
      head: [["Documento", "Nombres", "Apellidos", "F. nacimiento", "Sexo", "Expedientes"]],
      body: filasExportables().map((n) => [
        n.Documento,
        n.Nombres,
        n.Apellidos,
        n["Fecha de nacimiento"],
        n.Sexo,
        n.Expedientes,
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [24, 48, 78] },
    });

    doc.save("nna.pdf");
  };

  const columnas = [
    { name: "Documento", selector: (r) => r.documento_identidad, sortable: true },
    { name: "Nombres", selector: (r) => r.nombres, sortable: true },
    { name: "Apellidos", selector: (r) => r.apellidos, sortable: true },
    {
      name: "Fecha Nac.",
      selector: (r) => r.fecha_nacimiento || "",
      format: (r) => formatearFecha(r.fecha_nacimiento),
      sortable: true,
    },
    { name: "Sexo", selector: (r) => r.sexo },
    {
      name: "Expedientes",
      selector: (r) => r.expedientes_count ?? 0,
    },
    {
      name: "Acciones",
      cell: (row) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-secondary" onClick={() => abrirDetalle(row)}>
            Ver
          </button>
          <button className="btn-secondary" onClick={() => abrirEdicion(row)}>
            Editar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="modulo">
      <div className="cabeceraModulo">
        <div>
          <h2>Gestión de NNA</h2>
          <p>Registro y consulta de Niños, Niñas y Adolescentes</p>
        </div>
        <button className="botonPrimario" onClick={abrirNuevo}>
          + Nuevo NNA
        </button>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o documento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="inputBusqueda"
        />

        <div className="toolbar-right">
          <button className="btn-export" onClick={exportarExcel}>📊 Excel</button>
          <button className="btn-export" onClick={exportarPDF}>🧾 PDF</button>
        </div>
      </div>

      <DataTable
        customStyles={estilosTabla}
        columns={columnas}
        data={nnaFiltrado}
        progressPending={cargando}
        pagination
        highlightOnHover
        noDataComponent="No hay NNA registrados"
      />

      {mostrarModal && (
        <div className="expedientes-modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="expedientes-modal modal-nuevo" onClick={(e) => e.stopPropagation()}>
            <div className="expedientes-modal-header">
              <div>
                <span className="expedientes-badge">Registro de NNA</span>
                <h3>{nnaSeleccionado ? "Editar NNA" : "Nuevo NNA"}</h3>
                <p>
                  Datos del niño, niña o adolescente. Los campos marcados con{" "}
                  <b>*</b> son obligatorios.
                </p>
              </div>

              <button className="btn-close" onClick={() => setMostrarModal(false)}>
                ✕
              </button>
            </div>

            <div className="form-nuevo-expediente">
              <Campo
                label="Documento de Identidad *"
                ayuda={AYUDAS_NNA.documento_identidad}
                error={errores.documento_identidad}
              >
                <input
                  type="text"
                  value={form.documento_identidad}
                  onChange={(e) => {
                    setForm({ ...form, documento_identidad: e.target.value });
                    setErrores({ ...errores, documento_identidad: "" });
                  }}
                  placeholder="V-12345678"
                  className={errores.documento_identidad ? "error" : ""}
                />
              </Campo>

              <Campo
                label="Nombres *"
                ayuda={AYUDAS_NNA.nombres}
                error={errores.nombres}
              >
                <input
                  type="text"
                  value={form.nombres}
                  onChange={(e) => {
                    setForm({ ...form, nombres: e.target.value });
                    setErrores({ ...errores, nombres: "" });
                  }}
                  className={errores.nombres ? "error" : ""}
                />
              </Campo>

              <Campo
                label="Apellidos *"
                ayuda={AYUDAS_NNA.apellidos}
                error={errores.apellidos}
              >
                <input
                  type="text"
                  value={form.apellidos}
                  onChange={(e) => {
                    setForm({ ...form, apellidos: e.target.value });
                    setErrores({ ...errores, apellidos: "" });
                  }}
                  className={errores.apellidos ? "error" : ""}
                />
              </Campo>

              <Campo
                label="Fecha de Nacimiento *"
                ayuda={AYUDAS_NNA.fecha_nacimiento}
                error={errores.fecha_nacimiento}
              >
                <input
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e) => {
                    setForm({ ...form, fecha_nacimiento: e.target.value });
                    setErrores({ ...errores, fecha_nacimiento: "" });
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  className={errores.fecha_nacimiento ? "error" : ""}
                />
              </Campo>

              <Campo
                label="Sexo *"
                ayuda={AYUDAS_NNA.sexo}
                error={errores.sexo}
              >
                <select
                  value={form.sexo}
                  onChange={(e) => {
                    setForm({ ...form, sexo: e.target.value });
                    setErrores({ ...errores, sexo: "" });
                  }}
                  className={errores.sexo ? "error" : ""}
                >
                  <option value="">Seleccione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </Campo>

              <Campo
                label="Lugar de Nacimiento"
                ayuda={AYUDAS_NNA.lugar_nacimiento}
                error={errores.lugar_nacimiento}
              >
                <input
                  type="text"
                  value={form.lugar_nacimiento}
                  onChange={(e) => setForm({ ...form, lugar_nacimiento: e.target.value })}
                />
              </Campo>

              <Campo
                label="Observaciones"
                ayuda={AYUDAS_NNA.observaciones}
                error={errores.observaciones}
                ancho
              >
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  rows={3}
                />
              </Campo>
            </div>

            <div className="detalle-footer">
              <button className="btn-secondary" onClick={() => setMostrarModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={guardar}>
                {nnaSeleccionado ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarDetalle && nnaSeleccionado && (
        <div className="expedientes-modal-overlay" onClick={() => setMostrarDetalle(false)}>
          <div className="expedientes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="expedientes-modal-header">
              <div>
                <span className="expedientes-badge">Detalle de NNA</span>
                <h3>
                  {nnaSeleccionado.nombres} {nnaSeleccionado.apellidos}
                </h3>
                <p>{nnaSeleccionado.documento_identidad}</p>
              </div>

              <button className="btn-close" onClick={() => setMostrarDetalle(false)}>
                ✕
              </button>
            </div>

            <div className="detalle-grid">
              <div>
                <strong>Documento:</strong>
                <p>{nnaSeleccionado.documento_identidad}</p>
              </div>
              <div>
                <strong>Nombre Completo:</strong>
                <p>{nnaSeleccionado.nombres} {nnaSeleccionado.apellidos}</p>
              </div>
              <div>
                <strong>Fecha de Nacimiento:</strong>
                <p>{formatearFecha(nnaSeleccionado.fecha_nacimiento)}</p>
              </div>
              <div>
                <strong>Sexo:</strong>
                <p>{nnaSeleccionado.sexo}</p>
              </div>
              <div>
                <strong>Lugar de Nacimiento:</strong>
                <p>{nnaSeleccionado.lugar_nacimiento || "No registrado"}</p>
              </div>
              <div>
                <strong>Observaciones:</strong>
                <p>{nnaSeleccionado.observaciones || "Sin observaciones"}</p>
              </div>
            </div>

            {nnaSeleccionado.expedientes && nnaSeleccionado.expedientes.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h4>Expedientes Asociados ({nnaSeleccionado.expedientes.length})</h4>
                <div className="tabla-scroll">
                <table className="tabla-simple">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Prioridad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nnaSeleccionado.expedientes.map((exp) => (
                      <tr key={exp.id}>
                        <td>{exp.codigo}</td>
                        <td>{formatearFecha(exp.fecha)}</td>
                        <td>{exp.estatus}</td>
                        <td>{exp.prioridad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            <div className="detalle-footer">
              <button className="btn-secondary" onClick={() => setMostrarDetalle(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <PinModalWrapper />
    </div>
  );
}
