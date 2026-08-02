import { useState } from "react";
import "./css/PinModal.css";
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
    <div className="pin-modal-overlay" onClick={handleClose}>
      <div className="pin-modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>🔐 Configurar PIN de Seguridad</h3>
        <p className="pin-modal-descripcion">
          Para realizar esta acción, debe configurar un PIN de seguridad de 4 a 6
          dígitos. Este PIN se usará para confirmar acciones delicadas en el futuro.
        </p>

        <div className="pin-modal-campo">
          <label>Nuevo PIN *</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError("");
            }}
            placeholder="4-6 dígitos numéricos"
            maxLength={6}
            inputMode="numeric"
            autoFocus
          />
        </div>

        <div className="pin-modal-campo">
          <label>Confirmar PIN *</label>
          <input
            type="password"
            value={confirmPin}
            onChange={(e) => {
              setConfirmPin(e.target.value);
              setError("");
            }}
            placeholder="Confirme su PIN"
            maxLength={6}
            inputMode="numeric"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
        </div>

        {error && <p className="pin-modal-error">{error}</p>}

        <div className="pin-modal-acciones">
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
