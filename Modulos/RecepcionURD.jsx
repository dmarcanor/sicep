import { useState } from "react";
import "./css/RecepcionURD.css";

export default function RecepcionURD() {
  const [errores, setErrores] = useState({});

  
  const [reincidencia, setReincidencia] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [aceptaRevision, setAceptaRevision] = useState(false);

  
  const [estadoSimulado, setEstadoSimulado] = useState("auto");
  

  const [formulario, setFormulario] = useState({
    documento: "",
    nombres: "",
    apellidos: "",
    fechaNacimiento: "",
    sexo: "",
    discapacidad: "",
    cedulaRepresentante: "",
    parentesco: "",
    nombresRepresentante: "",
    apellidosRepresentante: "",
    telefono: "",
    sector: "",
    direccion: "",
  });

  const actualizar = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  
  const verificarDocumento = () => {
    if (!formulario.documento.trim()) {
      setErrores((prev) => ({ ...prev, documento: true }));
      return;
    }

    if (estadoSimulado === "auto") {
      const detectado = formulario.documento.endsWith("5");

      setReincidencia(detectado);
      setMostrarModal(detectado);
      setAceptaRevision(false);

      if (!detectado) {
/*         alert("✔ No se encontraron expedientes previos");
 */      }

      return;
    }

    if (estadoSimulado === "reincidente") {
      setReincidencia(true);
      setMostrarModal(true);
      setAceptaRevision(false);
      return;
    }

    setReincidencia(false);
    setMostrarModal(false);
    setAceptaRevision(false);

  };

  const validar = () => {
    const nuevosErrores = {};

    if (!formulario.documento.trim()) nuevosErrores.documento = true;
    if (!formulario.nombres.trim()) nuevosErrores.nombres = true;
    if (!formulario.apellidos.trim()) nuevosErrores.apellidos = true;
    if (!formulario.fechaNacimiento) nuevosErrores.fechaNacimiento = true;
    if (!formulario.sexo) nuevosErrores.sexo = true;
    if (!formulario.cedulaRepresentante.trim())
      nuevosErrores.cedulaRepresentante = true;
    if (!formulario.nombresRepresentante.trim())
      nuevosErrores.nombresRepresentante = true;
    if (!formulario.telefono.trim()) nuevosErrores.telefono = true;

    
    if (reincidencia && !aceptaRevision) {
      alert("Debe confirmar revisión del caso reincidente");
      return false;
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const registrar = () => {
    if (!validar()) return;
    alert("Expediente registrado correctamente");
  };

  return (
    <div className="recepcion-urd">

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content alerta-reincidencia">
            <h3>⚠️ Alerta de Reincidencia</h3>

            <p>
              Este NNA posee expedientes previos registrados.
              Evaluar la severidad de la medida.
            </p>

            <label className="checkbox-alerta">
 {/*              <input
                type="checkbox"
                checked={aceptaRevision}
                onChange={(e) => setAceptaRevision(e.target.checked)}
              /> 
              Confirmo r */} <p>Se sugiere Revisión del historial del caso</p> 
              
             </label>

            <button
              className="btn-mini"
              onClick={() => setMostrarModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      
      <div className="recepcion-header">
        <div>
          <span className="recepcion-badge">Recepción Inicial</span>

          <h2>Recepción y Control de Ingresos</h2>

          <p>
            Registro institucional para la apertura de expedientes de niños,
            niñas y adolescentes.
          </p>
        </div>

 {/*        <button className="recepcion-btn-secundario">
          📋 Ver Histórico
        </button> */}
      </div>

      
      {reincidencia && (
        <div className="alerta-banner">
          ⚠️ Alerta de Reincidencia: Este NNA posee expedientes previos registrados.
        </div>
      )}

      
      <div className="recepcion-resumen">
        <div className="recepcion-kpi">
          <span>Código provisional</span>
          <strong>URD-2026-00487</strong>
        </div>

        <div className="recepcion-kpi">
          <span>Fecha de ingreso</span>
          <strong>06/06/2026</strong>
        </div>

        <div className="recepcion-kpi">
          <span>Estado</span>
          <strong className="estado-activo">Recepción</strong>
        </div>
      </div>

      
      <div className="recepcion-grid">

        
        <div className="recepcion-panel">
          <h3>Datos del Niño, Niña o Adolescente</h3>

          <div className="recepcion-form">
            <div className="campo ancho">
              <label>Documento *</label>

              <div className="inline">
                <input
                  name="documento"
                  value={formulario.documento}
                  onChange={actualizar}
                  className={errores.documento ? "error" : ""}
                  placeholder="Acta o documento"
                />

                <button
                  className="btn-mini"
                  onClick={verificarDocumento}
                >
                  Verificar
                </button>

                <label className="mini-toggle-reincidencia">
                  <input
                    type="checkbox"
                    checked={estadoSimulado === "reincidente"}
                    onChange={(e) =>
                      setEstadoSimulado(
                        e.target.checked ? "reincidente" : "libre"
                      )
                    }
                  />
                  <span>
                    {estadoSimulado === "reincidente"
                      ? ""
                      : ""}
                  </span>
                </label>
              </div>
            </div>

            <div className="campo">
              <label>Nombres *</label>
              <input
                name="nombres"
                value={formulario.nombres}
                onChange={actualizar}
                className={errores.nombres ? "error" : ""}
              />
            </div>

            <div className="campo">
              <label>Apellidos *</label>
              <input
                name="apellidos"
                value={formulario.apellidos}
                onChange={actualizar}
                className={errores.apellidos ? "error" : ""}
              />
            </div>

            <div className="campo">
              <label>Fecha de nacimiento *</label>
              <input
                type="date"
                name="fechaNacimiento"
                value={formulario.fechaNacimiento}
                onChange={actualizar}
                className={errores.fechaNacimiento ? "error" : ""}
              />
            </div>

            <div className="campo">
              <label>Sexo *</label>
              <select
                name="sexo"
                value={formulario.sexo}
                onChange={actualizar}
                className={errores.sexo ? "error" : ""}
              >
                <option value="">Seleccione</option>
                <option>Masculino</option>
                <option>Femenino</option>
              </select>
            </div>
          </div>
        </div>

        
        <div className="recepcion-panel">
          <h3>Datos del Representante</h3>

          <div className="recepcion-form">
            <div className="campo">
              <label>Cédula *</label>
              <input
                name="cedulaRepresentante"
                value={formulario.cedulaRepresentante}
                onChange={actualizar}
                className={errores.cedulaRepresentante ? "error" : ""}
              />
            </div>

            <div className="campo">
              <label>Nombres *</label>
              <input
                name="nombresRepresentante"
                value={formulario.nombresRepresentante}
                onChange={actualizar}
                className={errores.nombresRepresentante ? "error" : ""}
              />
            </div>

            <div className="campo">
              <label>Teléfono *</label>
              <input
                name="telefono"
                value={formulario.telefono}
                onChange={actualizar}
                className={errores.telefono ? "error" : ""}
              />
            </div>
          </div>
        </div>
      </div>

      
      {reincidencia && (
        <div className="sugerencia-ponente">
          Asignación sugerida: <b>Consejero Luis Pérez</b> (menor carga actual)
        </div>
      )}

      <div className="recepcion-footer">
{/*         <button className="recepcion-btn-secundario">
          Guardar borrador
        </button>
 */}
        <button
          className="recepcion-btn-principal"
          onClick={registrar}
        >
          Registrar Caso y Generar Expediente
        </button>
      </div>
    </div>
  );
}