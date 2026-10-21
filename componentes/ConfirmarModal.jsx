import React from 'react';
import './css/ConfirmarModal.css';

export default function ConfirmarModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titulo = "Confirmar acción", 
  mensaje, 
  tipo = "warning" // warning, danger, info
}) {
  if (!isOpen) return null;

  const iconos = {
    warning: '⚠️',
    danger: '⛔',
    info: 'ℹ️'
  };

  return (
    <div className="confirmar-overlay" onClick={onClose}>
      <div className="confirmar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirmar-header">
          <span className={`confirmar-icon ${tipo}`}>{iconos[tipo]}</span>
          <h3>{titulo}</h3>
        </div>
        
        <div className="confirmar-body">
          <p>{mensaje}</p>
        </div>
        
        <div className="confirmar-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className={`btn-primary ${tipo}`} onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
