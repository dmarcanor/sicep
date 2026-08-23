import { useEffect, useState } from "react";
import "./css/Perfil.css";
import { api } from "../src/api";
import { usePinAction } from "../src/hooks/usePinAction";
import { EntradaDigitos, EntradaTelefono } from "../componentes/entradas";

export default function Perfil({ usuarioBase }) {

  const [perfil, setPerfil] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
  });

  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const { executeWithPin, PinModalWrapper } = usePinAction();

  const [pines, setPines] = useState({ actual: "", nuevo: "", repetir: "" });
  const [errorPin, setErrorPin] = useState("");
  const [cambiandoPin, setCambiandoPin] = useState(false);

  const cambiarPin = async () => {
    if (pines.nuevo.length < 4 || pines.nuevo.length > 6) {
      setErrorPin("El PIN nuevo debe tener entre 4 y 6 dígitos.");
      return;
    }
    if (pines.nuevo !== pines.repetir) {
      setErrorPin("El PIN nuevo y su repetición no coinciden.");
      return;
    }
    if (!pines.actual) {
      setErrorPin("Indique su PIN actual.");
      return;
    }

    setErrorPin("");
    setCambiandoPin(true);

    try {
      await api.changePin(pines.actual, pines.nuevo);
      setPines({ actual: "", nuevo: "", repetir: "" });
      setMensaje("PIN actualizado correctamente");
      setTimeout(() => setMensaje(""), 4000);
    } catch (error) {
      setErrorPin(error.message || "No se pudo cambiar el PIN.");
    } finally {
      setCambiandoPin(false);
    }
  };

  
  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const data = await api.getMe();
      setPerfil({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        position: data.position || "",
      });
    } catch (error) {
      console.error("Error cargando perfil:", error);
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setPerfil((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validar = () => {
    const err = {};

    if (!perfil.name.trim()) err.name = true;
    
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(perfil.email)) err.email = true;

    if (!perfil.phone.trim()) err.phone = true;

    setErrores(err);

    return Object.keys(err).length === 0;
  };

  const guardarPerfil = async () => {
    if (!validar()) return;

    try {
      await executeWithPin(async (pin) => {
        await api.updateProfile(perfil, pin);
      }, "Actualizar Perfil");
      setMensaje("Perfil actualizado correctamente.");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        setMensaje(error.message || "Error al actualizar perfil");
        setTimeout(() => setMensaje(""), 3000);
      }
    }
  };

  const resetPerfil = async () => {
    await cargarPerfil();
    setErrores({});
  };

  return (
    <div className="perfil">

      
      <div className="perfil-header">
        <div>
          <span className="perfil-badge">Configuración</span>
          <h2>Editar Perfil</h2>
          <p>Actualiza la información personal del usuario del sistema.</p>
        </div>

        <div className="perfil-actions-top">
          <button className="btn-secondary" onClick={resetPerfil}>
            Restablecer
          </button>

          <button className="btn-primary" onClick={guardarPerfil}>
            Guardar cambios
          </button>
        </div>
      </div>

      
      {mensaje && <div className="toast-exito">{mensaje}</div>}

      <div className="perfil-card">
        <h3>PIN de seguridad</h3>
        <p className="perfil-nota">
          Con este PIN se confirman las acciones delicadas: registrar o aprobar
          un expediente y descargar un documento legal. Es personal: cámbielo si
          todavía usa el que le entregaron.
        </p>

        <div className="perfil-grid">
          <div className="campo">
            <label>PIN actual *</label>
            <EntradaDigitos
              value={pines.actual}
              maxLength={6}
              onChange={(v) => setPines((p) => ({ ...p, actual: v }))}
              className={errorPin ? "error" : ""}
              placeholder="••••"
            />
          </div>

          <div className="campo">
            <label>PIN nuevo *</label>
            <EntradaDigitos
              value={pines.nuevo}
              maxLength={6}
              onChange={(v) => setPines((p) => ({ ...p, nuevo: v }))}
              className={errorPin ? "error" : ""}
              placeholder="4 a 6 dígitos"
            />
          </div>

          <div className="campo">
            <label>Repetir PIN nuevo *</label>
            <EntradaDigitos
              value={pines.repetir}
              maxLength={6}
              onChange={(v) => setPines((p) => ({ ...p, repetir: v }))}
              className={errorPin ? "error" : ""}
            />
          </div>
        </div>

        {errorPin && <small className="campo-error">{errorPin}</small>}

        <div className="perfil-actions-top">
          <button className="btn-primary" onClick={cambiarPin} disabled={cambiandoPin}>
            {cambiandoPin ? "Cambiando..." : "Cambiar PIN"}
          </button>
        </div>
      </div>

      
      <div className="perfil-card">

        <div className="perfil-grid">

          <div className="campo ancho">
            <label>Nombre completo *</label>
            <input
              name="name"
              value={perfil.name}
              onChange={manejarCambio}
              className={errores.name ? "error" : ""}
            />
          </div>

          <div className="campo ancho">
            <label>Correo *</label>
            <input
              name="email"
              value={perfil.email}
              onChange={manejarCambio}
              className={errores.email ? "error" : ""}
            />
          </div>

          <div className="campo">
            <label>Teléfono *</label>
            <EntradaTelefono
              value={perfil.phone}
              onChange={(valor) => manejarCambio({ target: { name: "phone", value: valor } })}
              className={errores.phone ? "error" : ""}
            />
          </div>

          <div className="campo">
            <label>Cargo</label>
            <input
              name="position"
              value={perfil.position}
              onChange={manejarCambio}
            />
          </div>

        </div>

        
        <div className="perfil-preview">
          <h4>Vista previa</h4>

          <div className="preview-box">
            <p><b>Nombre:</b> {perfil.name}</p>
            <p><b>Correo:</b> {perfil.email}</p>
            <p><b>Teléfono:</b> {perfil.phone}</p>
            <p><b>Cargo:</b> {perfil.position}</p>
          </div>
        </div>

      </div>

      <PinModalWrapper />
    </div>
  );
}
