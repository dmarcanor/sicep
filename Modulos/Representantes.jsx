import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../src/api";
import { usePinAction } from "../src/hooks/usePinAction";
import { formatearFecha } from "../src/formato";
import Campo from "../componentes/Campo";
import { AYUDAS_REPRESENTANTE } from "../src/ayudas";
import "./css/Expedientes.css";
import "./css/Representantes.css";

export default function Representantes() {
  const [representantes, setRepresentantes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [representanteSeleccionado, setRepresentanteSeleccionado] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errores, setErrores] = useState({});
  const { executeWithPin, PinModalWrapper } = usePinAction();

  const [form, setForm] = useState({
    cedula: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    direccion: "",
    email: "",
    profesion: "",
    lugar_trabajo: "",
  });

  useEffect(() => {
    cargarRepresentantes();
  }, []);

  const cargarRepresentantes = async () => {
    try {
      setCargando(true);
      const data = await api.getRepresentantes();
      setRepresentantes(data);
    } catch (error) {
      console.error("Error cargando representantes:", error);
    } finally {
      setCargando(false);
    }
  };

  const representantesFiltrados = representantes.filter((item) => {
    const q = busqueda.toLowerCase();
    return (
      item.nombres.toLowerCase().includes(q) ||
      item.apellidos.toLowerCase().includes(q) ||
      item.cedula.toLowerCase().includes(q)
    );
  });

  const validarCedula = (cedula) => {
    const regex = /^[VE]-?\d{6,8}$/i;
    return regex.test(cedula);
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!form.cedula.trim()) {
      nuevosErrores.cedula = "La cédula es obligatoria";
    } else if (!validarCedula(form.cedula)) {
      nuevosErrores.cedula = "Formato inválido (V-12345678 o E-12345678)";
    } else if (
      // Al editar, el propio registro no cuenta como duplicado de sí mismo.
      representantes.some(
        (r) => r.cedula === form.cedula.trim() && r.id !== representanteSeleccionado?.id
      )
    ) {
      nuevosErrores.cedula = "Esta cédula ya está registrada";
    }

    if (!form.nombres.trim()) {
      nuevosErrores.nombres = "Los nombres son obligatorios";
    }

    if (!form.apellidos.trim()) {
      nuevosErrores.apellidos = "Los apellidos son obligatorios";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nuevosErrores.email = "Email inválido";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Se exporta lo que hay en pantalla, con el filtro de búsqueda ya aplicado.
  const filasExportables = () =>
    representantesFiltrados.map((r) => ({
      Cedula: r.cedula,
      Nombres: r.nombres,
      Apellidos: r.apellidos,
      Telefono: r.telefono || "",
      Email: r.email || "",
      Direccion: r.direccion || "",
      Profesion: r.profesion || "",
      "Lugar de trabajo": r.lugar_trabajo || "",
      Expedientes: r.expedientes_count || 0,
    }));

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filasExportables());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Representantes");
    XLSX.writeFile(wb, "representantes.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("REGISTRO DE REPRESENTANTES LEGALES", 14, 14);

    autoTable(doc, {
      startY: 22,
      head: [["Cédula", "Nombres", "Apellidos", "Teléfono", "Email", "Expedientes"]],
      body: filasExportables().map((r) => [
        r.Cedula,
        r.Nombres,
        r.Apellidos,
        r.Telefono,
        r.Email,
        r.Expedientes,
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [24, 48, 78] },
    });

    doc.save("representantes.pdf");
  };

  const abrirNuevo = () => {
    setForm({
      cedula: "",
      nombres: "",
      apellidos: "",
      telefono: "",
      direccion: "",
      email: "",
      profesion: "",
      lugar_trabajo: "",
    });
    setRepresentanteSeleccionado(null);
    setErrores({});
    setMostrarModal(true);
  };

  const abrirEdicion = (item) => {
    setForm({
      cedula: item.cedula || "",
      nombres: item.nombres || "",
      apellidos: item.apellidos || "",
      telefono: item.telefono || "",
      direccion: item.direccion || "",
      email: item.email || "",
      profesion: item.profesion || "",
      lugar_trabajo: item.lugar_trabajo || "",
    });
    setRepresentanteSeleccionado(item);
    setErrores({});
    setMostrarModal(true);
  };

  const abrirDetalle = async (item) => {
    setRepresentanteSeleccionado(item);
    setMostrarDetalle(true);

    // El listado solo trae el conteo; los expedientes asociados vienen del
    // detalle, así que se pide aparte para poder mostrarlos.
    try {
      setRepresentanteSeleccionado(await api.getRepresentante(item.id));
    } catch (error) {
      console.error("Error cargando el detalle del representante:", error);
    }
  };

  const guardar = async () => {
    if (!validar()) return;

    try {
      if (representanteSeleccionado) {
        await executeWithPin(async (pin) => {
          await api.updateRepresentante(representanteSeleccionado.id, form, pin);
        }, "Editar Representante");
      } else {
        await executeWithPin(async (pin) => {
          await api.createRepresentante(form, pin);
        }, "Crear Representante");
      }
      await cargarRepresentantes();
      setMostrarModal(false);
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        alert(error.message || "Error al guardar");
      }
    }
  };

  if (cargando) {
    return <div className="modulo">Cargando representantes...</div>;
  }

  return (
    <div className="modulo">
      <div className="cabeceraModulo">
        <div>
          <h2>Gestión de Representantes</h2>
          <p>Registro y consulta de representantes legales</p>
        </div>
        <button className="botonPrimario" onClick={abrirNuevo}>
          + Nuevo Representante
        </button>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o cédula..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="inputBusqueda"
        />

        <div className="toolbar-right">
          <button className="btn-export" onClick={exportarExcel}>📊 Excel</button>
          <button className="btn-export" onClick={exportarPDF}>🧾 PDF</button>
        </div>
      </div>

      <div className="tabla-container">
        <table className="tabla">
          <thead>
            <tr>
              <th>Cédula</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Expedientes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {representantesFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7" className="sinRegistros">
                  No hay representantes registrados
                </td>
              </tr>
            ) : (
              representantesFiltrados.map((rep) => (
                <tr key={rep.id}>
                  <td>{rep.cedula}</td>
                  <td>{rep.nombres}</td>
                  <td>{rep.apellidos}</td>
                  <td>{rep.telefono || "-"}</td>
                  <td>{rep.email || "-"}</td>
                  <td>
                    <span className="badge">
                      {rep.expedientes_count || 0}
                    </span>
                  </td>
                  <td>
                    <div className="acciones">
                      <button
                        className="btn-secondary"
                        onClick={() => abrirDetalle(rep)}
                      >
                        Ver
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => abrirEdicion(rep)}
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="expedientes-modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="expedientes-modal modal-nuevo" onClick={(e) => e.stopPropagation()}>
            <div className="expedientes-modal-header">
              <div>
                <span className="expedientes-badge">Registro de representante</span>
                <h3>{representanteSeleccionado ? "Editar Representante" : "Nuevo Representante"}</h3>
                <p>
                  Datos del representante legal. Los campos marcados con <b>*</b>{" "}
                  son obligatorios.
                </p>
              </div>

              <button className="btn-close" onClick={() => setMostrarModal(false)}>
                ✕
              </button>
            </div>

            <div className="form-nuevo-expediente">
              <Campo
                label="Cédula *"
                ayuda={AYUDAS_REPRESENTANTE.cedula}
                error={errores.cedula}
              >
                <input
                  type="text"
                  value={form.cedula}
                  onChange={(e) => {
                    setForm({ ...form, cedula: e.target.value });
                    setErrores({ ...errores, cedula: "" });
                  }}
                  placeholder="V-12345678"
                  className={errores.cedula ? "error" : ""}
                />
              </Campo>

              <Campo
                label="Nombres *"
                ayuda={AYUDAS_REPRESENTANTE.nombres}
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
                ayuda={AYUDAS_REPRESENTANTE.apellidos}
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
                label="Teléfono"
                ayuda={AYUDAS_REPRESENTANTE.telefono}
                error={errores.telefono}
              >
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="0414-1234567"
                />
              </Campo>

              <Campo
                label="Email"
                ayuda={AYUDAS_REPRESENTANTE.email}
                error={errores.email}
              >
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setErrores({ ...errores, email: "" });
                  }}
                  className={errores.email ? "error" : ""}
                />
              </Campo>

              <Campo
                label="Profesión"
                ayuda={AYUDAS_REPRESENTANTE.profesion}
                error={errores.profesion}
              >
                <input
                  type="text"
                  value={form.profesion}
                  onChange={(e) => setForm({ ...form, profesion: e.target.value })}
                />
              </Campo>

              <Campo
                label="Dirección"
                ayuda={AYUDAS_REPRESENTANTE.direccion}
                error={errores.direccion}
                ancho
              >
                <textarea
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  rows={2}
                />
              </Campo>

              <Campo
                label="Lugar de Trabajo"
                ayuda={AYUDAS_REPRESENTANTE.lugar_trabajo}
                error={errores.lugar_trabajo}
                ancho
              >
                <input
                  type="text"
                  value={form.lugar_trabajo}
                  onChange={(e) => setForm({ ...form, lugar_trabajo: e.target.value })}
                />
              </Campo>
            </div>

            <div className="detalle-footer">
              <button className="btn-secondary" onClick={() => setMostrarModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={guardar}>
                {representanteSeleccionado ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarDetalle && representanteSeleccionado && (
        <div className="expedientes-modal-overlay" onClick={() => setMostrarDetalle(false)}>
          <div className="expedientes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="expedientes-modal-header">
              <div>
                <span className="expedientes-badge">Detalle del representante</span>
                <h3>
                  {representanteSeleccionado.nombres}{" "}
                  {representanteSeleccionado.apellidos}
                </h3>
                <p>{representanteSeleccionado.cedula}</p>
              </div>

              <button className="btn-close" onClick={() => setMostrarDetalle(false)}>
                ✕
              </button>
            </div>

            <div className="detalle-grid">
              <div>
                <strong>Cédula:</strong>
                <p>{representanteSeleccionado.cedula}</p>
              </div>
              <div>
                <strong>Nombre Completo:</strong>
                <p>{representanteSeleccionado.nombres} {representanteSeleccionado.apellidos}</p>
              </div>
              <div>
                <strong>Teléfono:</strong>
                <p>{representanteSeleccionado.telefono || "No registrado"}</p>
              </div>
              <div>
                <strong>Email:</strong>
                <p>{representanteSeleccionado.email || "No registrado"}</p>
              </div>
              <div>
                <strong>Profesión:</strong>
                <p>{representanteSeleccionado.profesion || "No registrada"}</p>
              </div>
              <div>
                <strong>Lugar de Trabajo:</strong>
                <p>{representanteSeleccionado.lugar_trabajo || "No registrado"}</p>
              </div>
              <div className="ancho">
                <strong>Dirección:</strong>
                <p>{representanteSeleccionado.direccion || "No registrada"}</p>
              </div>
            </div>

            {representanteSeleccionado.expedientes && representanteSeleccionado.expedientes.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h4>Expedientes Asociados ({representanteSeleccionado.expedientes.length})</h4>
                <div className="tabla-scroll">
                <table className="tabla-simple">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>NNA</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Prioridad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {representanteSeleccionado.expedientes.map((exp) => (
                      <tr key={exp.id}>
                        <td>{exp.codigo}</td>
                        <td>{exp.nna_nombre}</td>
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
