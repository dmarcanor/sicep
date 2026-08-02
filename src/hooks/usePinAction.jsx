import { useState, useCallback } from "react";
import PinModal from "../../componentes/PinModal";
import PinSetupModal from "../../componentes/PinSetupModal";
import { getPinConfigurado, setPinConfigurado } from "../api";

export function usePinAction() {
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pinConfigurado, setPinConfiguradoState] = useState(getPinConfigurado());

  const executeWithPin = useCallback(async (action, title = "Confirmar acción") => {
    const hasPin = getPinConfigurado();
    
    if (!hasPin) {
      // Si no tiene PIN, mostrar modal de configuración
      return new Promise((resolve, reject) => {
        setPendingAction({ action, resolve, reject, title });
        setShowPinSetupModal(true);
      });
    }

    // Si tiene PIN, mostrar modal de verificación
    return new Promise((resolve, reject) => {
      setPendingAction({ action, resolve, reject, title });
      setShowPinModal(true);
    });
  }, []);

  const handlePinConfirm = async (pin) => {
    if (!pendingAction) return;

    try {
      const result = await pendingAction.action(pin);
      setShowPinModal(false);
      setPendingAction(null);
      pendingAction.resolve(result);
    } catch (error) {
      // Si el error es que el PIN no está configurado, mostrar modal de configuración
      if (error.message === 'PIN_NOT_CONFIGURED') {
        setShowPinModal(false);
        setShowPinSetupModal(true);
        return;
      }
      setShowPinModal(false);
      setPendingAction(null);
      pendingAction.reject(error);
    }
  };

  const handlePinCancel = () => {
    if (pendingAction) {
      pendingAction.reject(new Error("Acción cancelada"));
      setPendingAction(null);
    }
  };

  const handlePinSetupSuccess = async () => {
    setPinConfigurado(true);
    setPinConfiguradoState(true);
    setShowPinSetupModal(false);
    
    // Después de configurar el PIN, ejecutar la acción pendiente
    if (pendingAction) {
      setShowPinModal(true);
    }
  };

  // Memoizado: una identidad nueva en cada render desmonta PinModal y borra el
  // PIN que el usuario esté escribiendo si el componente padre se re-renderiza.
  const PinModalWrapper = useCallback(() => (
    <>
      <PinModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          handlePinCancel();
        }}
        onConfirm={handlePinConfirm}
        title={pendingAction?.title || "Confirmar acción"}
      />
      <PinSetupModal
        isOpen={showPinSetupModal}
        onClose={() => {
          setShowPinSetupModal(false);
          handlePinCancel();
        }}
        onSuccess={handlePinSetupSuccess}
      />
    </>
  ), [showPinModal, showPinSetupModal, pendingAction]);

  return {
    executeWithPin,
    PinModalWrapper,
    pinConfigurado,
  };
}
