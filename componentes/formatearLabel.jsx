/**
 * Si el label termina en " *", separa el asterisco y lo envuelve en un
 * <span className="req"> para pintarlo de rojo. Esto evita tener que
 * escribir el span manualmente en cada formulario.
 */
export function formatearLabel(label) {
  if (typeof label === "string" && label.endsWith(" *")) {
    return (
      <>
        {label.slice(0, -2)}
        <span className="req"> *</span>
      </>
    );
  }
  return label;
}
