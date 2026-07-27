import { useState } from "react";
import { api } from "../src/api";

export default function PinSetupModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!pin || pin.length < 4 || pin.length > 6) {
      setError("El PIN debe tener entre 4 y 6 dígitos");
      return;
    }

    if (!/^\d+$/.test(pin)) {
      setError("El PIN solo puede contener números");
      return;
    }

    if (pin !== confirmPin) {
      setError("Los PINs no coinciden");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.setupPin(pin);
      onSuccess();
      setPin("");
      setConfirmPin("");
    } catch (err) {
      setError(err.message || "Error al configurar PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPin("");
    setConfirmPin("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
        <h3>🔐 Configurar PIN de Seguridad</h3>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Para realizar esta acción, debe configurar un PIN de seguridad de 4 a 6 dígitos. 
          Este PIN se usará para confirmar acciones delicadas en el futuro.
        </p>
        
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>
            Nuevo PIN *
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError("");
            }}
            placeholder="4-6 dígitos numéricos"
            maxLength={6}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "18px",
              textAlign: "center",
              letterSpacing: "8px",
            }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>
            Confirmar PIN *
          </label>
          <input
            type="password"
            value={confirmPin}
            onChange={(e) => {
              setConfirmPin(e.target.value);
              setError("");
            }}
            placeholder="Confirme su PIN"
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
          />
        </div>

        {error && (
          <p style={{ color: "red", marginBottom: "15px", fontSize: "14px" }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button className="btn-secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Configurando..." : "Configurar PIN"}
          </button>
        </div>
      </div>
    </div>
  );
}
