import { useState } from "react";
import { api } from "../src/api";

export default function PinModal({ isOpen, onClose, onConfirm, title = "Confirmar acción" }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!pin || pin.length < 4 || pin.length > 6) {
      setError("El PIN debe tener entre 4 y 6 dígitos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.verifyPin(pin);
      if (response.valid) {
        setPin("");
        // Cerrar aquí llamaría a onClose (cancelación) antes de que onConfirm
        // termine, rechazando la promesa de la acción ya en curso: el cierre lo
        // hace usePinAction cuando la acción resuelve.
        await onConfirm(pin);
      } else {
        setError("PIN incorrecto");
      }
    } catch (err) {
      setError(err.message || "PIN incorrecto");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPin("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
        <h3>🔐 {title}</h3>
        <p>Ingrese su PIN de seguridad para confirmar esta acción.</p>
        
        <div style={{ margin: "20px 0" }}>
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError("");
            }}
            placeholder="Ingrese su PIN"
            maxLength={6}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "18px",
              textAlign: "center",
              letterSpacing: "8px",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            autoFocus
          />
          {error && (
            <p style={{ color: "red", marginTop: "8px", fontSize: "14px" }}>{error}</p>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button className="btn-secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Verificando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
