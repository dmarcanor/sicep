import { useState, useCallback } from "react";
import PinModal from "../componentes/PinModal";
import PinSetupModal from "../componentes/PinSetupModal";
import { getAuthToken, getPinConfigurado, setPinConfigurado } from "../src/api";

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
    if (pendingAction) {
      try {
        const result = await pendingAction.action(pin);
        pendingAction.resolve(result);
      } catch (error) {
        // Si el error es que el PIN no está configurado, mostrar modal de configuración
        if (error.message === 'PIN_NOT_CONFIGURED') {
          setShowPinModal(false);
          setShowPinSetupModal(true);
          return;
        }
        pendingAction.reject(error);
      }
      setPendingAction(null);
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

  const PinModalWrapper = () => (
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
  );

  return {
    executeWithPin,
    PinModalWrapper,
    pinConfigurado,
  };
}
