import { useState } from "react";
import { api } from "../src/api";
import logoSicep from "../img/logo.png";

export default function RecuperarPassword({ onVolver, onExito }) {
  const [paso, setPaso] = useState(1);
  const [username, setUsername] = useState("");
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordRepetir, setPasswordRepetir] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const buscarPreguntas = async () => {
    if (!username.trim()) {
      setError("Indique su nombre de usuario.");
      return;
    }

    setCargando(true);
    setError("");

    try {
      const data = await api.obtenerPreguntas(username);
      setPreguntas(data.preguntas);
      setPaso(2);
    } catch (err) {
      setError(err.message || "No se pudieron obtener las preguntas de seguridad.");
    } finally {
      setCargando(false);
    }
  };

  const enviarRecuperacion = async () => {
    // Validar que todas las preguntas tengan respuesta
    const todasRespondidas = preguntas.every((p) => respuestas[p.id]?.trim());
    if (!todasRespondidas) {
      setError("Responda todas las preguntas de seguridad.");
      return;
    }

    // Validar contraseña
    if (passwordNueva.length < 8) {
      setError(`La contraseña debe tener al menos 8 caracteres (tiene ${passwordNueva.length}).`);
      return;
    }
    if (!/[A-Za-z]/.test(passwordNueva) || !/[0-9]/.test(passwordNueva)) {
      setError("La contraseña debe combinar letras y números.");
      return;
    }
    if (passwordNueva !== passwordRepetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    setError("");

    try {
      const respuestasArray = preguntas.map((p) => ({
        pregunta_id: p.id,
        respuesta: respuestas[p.id],
      }));

      await api.recuperarPassword(username, respuestasArray, passwordNueva);
      setPaso(3);
    } catch (err) {
      setError(err.message || "No se pudo recuperar la contraseña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-bg">
        <div className="bg-overlay" />
        <div className="bg-shapes">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="login-shell">
        <div className="login-info">
          <div className="brand">
            <img src={logoSicep} alt="Logo SICEP-NNA" className="brand-logo" />
          </div>

          <div style={{ display: "grid", gap: "10px", marginTop: "22px" }}>
            <div className="login-role-card">
              <strong>Recuperación de Contraseña</strong>
              <span>Sistema de seguridad con preguntas personales</span>
            </div>
          </div>

          <div className="institution-footer">
            LOPNNA · República Bolivariana · Sistema Oficial de Gestión Social
          </div>
        </div>

        <div className="login-panel">
          <div className="login-head">
            <div className="login-badge">RECUPERACIÓN</div>
            <h1 style={{ letterSpacing: "0px" }}>
              {paso === 1 && "Verificar Identidad"}
              {paso === 2 && "Responder Preguntas"}
              {paso === 3 && "Contraseña Actualizada"}
            </h1>
            <p>
              {paso === 1 && "Ingrese su usuario para continuar"}
              {paso === 2 && "Responda sus preguntas de seguridad"}
              {paso === 3 && "Ya puede iniciar sesión con su nueva contraseña"}
            </p>
          </div>

          <div className="login-form">
            {paso === 1 && (
              <>
                <label>Usuario</label>
                <input
                  placeholder="Código institucional"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarPreguntas()}
                  autoFocus
                />
              </>
            )}

            {paso === 2 && (
              <>
                {preguntas.map((p) => (
                  <div key={p.id}>
                    <label>{p.pregunta}</label>
                    <input
                      type="text"
                      value={respuestas[p.id] || ""}
                      onChange={(e) =>
                        setRespuestas({ ...respuestas, [p.id]: e.target.value })
                      }
                      autoFocus
                    />
                  </div>
                ))}

                <label style={{ marginTop: "1rem" }}>Nueva contraseña</label>
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres, letras y números"
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                />

                <label>Repetir nueva contraseña</label>
                <input
                  type="password"
                  placeholder="Repita la contraseña"
                  value={passwordRepetir}
                  onChange={(e) => setPasswordRepetir(e.target.value)}
                />
              </>
            )}

            {paso === 3 && (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
                <p style={{ fontSize: "1.1rem", fontWeight: "500" }}>
                  Su contraseña ha sido actualizada correctamente
                </p>
              </div>
            )}

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            {paso < 3 && (
              <button
                className="login-btn"
                onClick={paso === 1 ? buscarPreguntas : enviarRecuperacion}
                disabled={cargando}
              >
                {cargando
                  ? "Procesando..."
                  : paso === 1
                  ? "Continuar"
                  : "Actualizar contraseña"}
              </button>
            )}

            {paso === 3 && (
              <button className="login-btn" onClick={onExito}>
                Ir al inicio de sesión
              </button>
            )}

            {paso < 3 && (
              <button
                className="login-btn"
                style={{ background: "transparent", color: "#64748b", marginTop: "0.5rem" }}
                onClick={onVolver}
                disabled={cargando}
              >
                ← Volver al inicio de sesión
              </button>
            )}
          </div>

          <div className="login-secure-note">
            🔒 Conexión segura · Registro auditado · Uso institucional exclusivo
          </div>
        </div>
      </div>
    </div>
  );
}
