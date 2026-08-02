import { useEffect, useState } from "react";
import "./css/RecepcionURD.css";
import { api } from "../src/api";
import { usePinAction } from "../src/hooks/usePinAction";
import { formatearFecha } from "../src/formato";
import SelectorConAlta, {
  CAMPOS_NNA,
  CAMPOS_REPRESENTANTE,
  etiquetaNna,
  etiquetaRepresentante,
} from "../componentes/SelectorConAlta";

const hoy = () => new Date().toISOString().slice(0, 10);

export default function RecepcionURD() {
  const [errores, setErrores] = useState({});

  const [reincidencia, setReincidencia] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [nnas, setNnas] = useState([]);
  const [representantes, setRepresentantes] = useState([]);
  const [registrando, setRegistrando] = useState(false);
  const [ultimoCodigo, setUltimoCodigo] = useState("");

  const { executeWithPin, PinModalWrapper } = usePinAction();

  const [formulario, setFormulario] = useState({
    nna_id: null,
    representante_id: null,
    fecha: hoy(),
    sector: "",
    prioridad: "Media",
    tipificacion: "",
    causa: "",
  });

  useEffect(() => {
    api.getNna().then(setNnas).catch(console.error);
    api.getRepresentantes().then(setRepresentantes).catch(console.error);
  }, []);

  const actualizar = (e) => {
    setFormulario((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrores((prev) => ({ ...prev, [e.target.name]: false }));
  };

  // La reincidencia se evalúa contra el historial real del NNA seleccionado.
  const seleccionarNna = async (id) => {
    setFormulario((prev) => ({ ...prev, nna_id: id }));
    setErrores((prev) => ({ ...prev, nna_id: false }));
    setReincidencia(null);
    setMostrarModal(false);

    if (!id) return;

    const nna = nnas.find((n) => n.id === id);
    if (!nna?.documento_identidad) return;

    try {
      const resultado = await api.verificarDocumentoNna(nna.documento_identidad);

      if (resultado?.tiene_historial) {
        setReincidencia(resultado);
        setMostrarModal(true);
      }
    } catch (error) {
      console.error("Error verificando reincidencia:", error);
    }
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

  const validar = () => {
    const nuevosErrores = {};

    if (!formulario.nna_id) nuevosErrores.nna_id = true;
    if (!formulario.representante_id) nuevosErrores.representante_id = true;
    if (!formulario.fecha) nuevosErrores.fecha = true;
    if (!formulario.sector.trim()) nuevosErrores.sector = true;
    if (!formulario.prioridad) nuevosErrores.prioridad = true;

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const registrar = async () => {
    if (!validar()) return;

    setRegistrando(true);

    try {
      await executeWithPin(async (pin) => {
        const creado = await api.createExpediente(
          {
            nna_id: formulario.nna_id,
            representante_id: formulario.representante_id,
            fecha: formulario.fecha,
            sector: formulario.sector.trim(),
            prioridad: formulario.prioridad,
            tipificacion: formulario.tipificacion || null,
            causa: formulario.causa || null,
          },
          pin
        );

        setUltimoCodigo(creado.codigo);
        setFormulario({
          nna_id: null,
          representante_id: null,
          fecha: hoy(),
          sector: "",
          prioridad: "Media",
          tipificacion: "",
          causa: "",
        });
        setReincidencia(null);
      }, "Registrar expediente");
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        alert(error.message || "Error al registrar el expediente");
      }
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="recepcion-urd">
      <PinModalWrapper />

      {mostrarModal && reincidencia && (
        <div className="modal-overlay">
          <div className="modal-content alerta-reincidencia">
            <h3>⚠️ Alerta de Reincidencia</h3>

            <p>
              Este NNA posee {reincidencia.cantidad_expedientes} expediente(s)
              previo(s) registrado(s). Evaluar la severidad de la medida.
            </p>

            <label className="checkbox-alerta">
              <p>Se sugiere Revisión del historial del caso</p>
            </label>

            <button className="btn-mini" onClick={() => setMostrarModal(false)}>
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
      </div>

      {reincidencia?.tiene_historial && (
        <div className="alerta-banner">
          ⚠️ Alerta de Reincidencia: Este NNA posee{" "}
          {reincidencia.cantidad_expedientes} expediente(s) previo(s)
          registrado(s).
        </div>
      )}

      {ultimoCodigo && (
        <div className="alerta-banner" style={{ background: "#e7f6ec", color: "#1d6f42" }}>
          ✔ Expediente {ultimoCodigo} registrado correctamente.
        </div>
      )}

      <div className="recepcion-resumen">
        <div className="recepcion-kpi">
          <span>Código de expediente</span>
          <strong>Se genera al registrar</strong>
        </div>

        <div className="recepcion-kpi">
          <span>Fecha de ingreso</span>
          <strong>{formatearFecha(formulario.fecha)}</strong>
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
            <SelectorConAlta
              label="NNA *"
              value={formulario.nna_id}
              onChange={seleccionarNna}
              opciones={nnas}
              getEtiqueta={etiquetaNna}
              camposAlta={CAMPOS_NNA}
              onCrear={crearNna}
              error={errores.nna_id}
              placeholder="Seleccione un NNA"
              textoAlta="+ Nuevo NNA"
            />
          </div>
        </div>

        <div className="recepcion-panel">
          <h3>Datos del Representante</h3>

          <div className="recepcion-form">
            <SelectorConAlta
              label="Representante *"
              value={formulario.representante_id}
              onChange={(id) =>
                setFormulario((prev) => ({ ...prev, representante_id: id }))
              }
              opciones={representantes}
              getEtiqueta={etiquetaRepresentante}
              camposAlta={CAMPOS_REPRESENTANTE}
              onCrear={crearRepresentante}
              error={errores.representante_id}
              placeholder="Seleccione un representante"
              textoAlta="+ Nuevo representante"
            />
          </div>
        </div>

        <div className="recepcion-panel">
          <h3>Datos del Caso</h3>

          <div className="recepcion-form">
            <div className="campo">
              <label>Fecha *</label>
              <input
                type="date"
                name="fecha"
                value={formulario.fecha}
                onChange={actualizar}
                className={errores.fecha ? "error" : ""}
              />
            </div>

            <div className="campo">
              <label>Sector *</label>
              <input
                name="sector"
                value={formulario.sector}
                onChange={actualizar}
                className={errores.sector ? "error" : ""}
                placeholder="Ej. Centro, Guariquén..."
              />
            </div>

            <div className="campo">
              <label>Prioridad *</label>
              <select
                name="prioridad"
                value={formulario.prioridad}
                onChange={actualizar}
                className={errores.prioridad ? "error" : ""}
              >
                <option>Baja</option>
                <option>Media</option>
                <option>Alta</option>
              </select>
            </div>

            <div className="campo">
              <label>Tipificación</label>
              <select
                name="tipificacion"
                value={formulario.tipificacion}
                onChange={actualizar}
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
                value={formulario.causa}
                onChange={actualizar}
                rows={3}
                placeholder="Describa la causa del expediente"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="recepcion-footer">
        <button
          className="recepcion-btn-principal"
          onClick={registrar}
          disabled={registrando}
        >
          {registrando
            ? "Registrando..."
            : "Registrar Caso y Generar Expediente"}
        </button>
      </div>
    </div>
  );
}
