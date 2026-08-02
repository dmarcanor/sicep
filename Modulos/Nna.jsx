import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { api } from "../src/api";
import { usePinAction } from "../src/hooks/usePinAction";
import { formatearFecha, fechaParaInput } from "../src/formato";
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
    } else if (!nnaSeleccionado && nna.some(n => n.documento_identidad === form.documento_identidad)) {
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

  const abrirDetalle = (item) => {
    setNnaSeleccionado(item);
    setMostrarDetalle(true);
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
      selector: (r) => r.expedientes?.length || 0,
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
      </div>

      <DataTable
        columns={columnas}
        data={nnaFiltrado}
        progressPending={cargando}
        pagination
        highlightOnHover
        striped
        noDataComponent="No hay NNA registrados"
      />

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <h3>{nnaSeleccionado ? "Editar NNA" : "Nuevo NNA"}</h3>

            <div className="form-grid">
              <div className="campo">
                <label>Documento de Identidad *</label>
                <input
                  type="text"
                  value={form.documento_identidad}
                  onChange={(e) => {
                    setForm({ ...form, documento_identidad: e.target.value });
                    setErrores({ ...errores, documento_identidad: "" });
                  }}
                  disabled={!!nnaSeleccionado}
                  placeholder="V-12345678"
                  className={errores.documento_identidad ? "error" : ""}
                />
                {errores.documento_identidad && (
                  <span className="error-message">{errores.documento_identidad}</span>
                )}
              </div>

              <div className="campo">
                <label>Nombres *</label>
                <input
                  type="text"
                  value={form.nombres}
                  onChange={(e) => {
                    setForm({ ...form, nombres: e.target.value });
                    setErrores({ ...errores, nombres: "" });
                  }}
                  className={errores.nombres ? "error" : ""}
                />
                {errores.nombres && (
                  <span className="error-message">{errores.nombres}</span>
                )}
              </div>

              <div className="campo">
                <label>Apellidos *</label>
                <input
                  type="text"
                  value={form.apellidos}
                  onChange={(e) => {
                    setForm({ ...form, apellidos: e.target.value });
                    setErrores({ ...errores, apellidos: "" });
                  }}
                  className={errores.apellidos ? "error" : ""}
                />
                {errores.apellidos && (
                  <span className="error-message">{errores.apellidos}</span>
                )}
              </div>

              <div className="campo">
                <label>Fecha de Nacimiento *</label>
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
                {errores.fecha_nacimiento && (
                  <span className="error-message">{errores.fecha_nacimiento}</span>
                )}
              </div>

              <div className="campo">
                <label>Sexo *</label>
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
                {errores.sexo && (
                  <span className="error-message">{errores.sexo}</span>
                )}
              </div>

              <div className="campo">
                <label>Lugar de Nacimiento</label>
                <input
                  type="text"
                  value={form.lugar_nacimiento}
                  onChange={(e) => setForm({ ...form, lugar_nacimiento: e.target.value })}
                />
              </div>

              <div className="campo ancho">
                <label>Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-actions">
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
        <div className="modal-overlay" onClick={() => setMostrarDetalle(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
            <h3>Detalle de NNA</h3>

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
            )}

            <div className="modal-actions">
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
