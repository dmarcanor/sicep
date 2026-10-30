import "./css/Campo.css";
import { formatearLabel } from "./formatearLabel.jsx";

/**
 * Campo de formulario con su leyenda.
 *
 * Debajo del control se muestra siempre la ayuda (qué se espera del campo) y,
 * cuando la validación falla, esa ayuda se sustituye por el motivo concreto en
 * rojo. Así el usuario sabe el requisito antes de escribir, no solo después de
 * equivocarse.
 *
 *   <Campo label="Correo *" ayuda={AYUDAS.email} error={errores.email}>
 *     <input ... />
 *   </Campo>
 */
export default function Campo({ label, ayuda, error, ancho = false, children }) {
  return (
    <div className={ancho ? "campo ancho" : "campo"}>
      <label>{formatearLabel(label)}</label>
      {children}
      {error ? (
        <small className="campo-error">{error}</small>
      ) : (
        ayuda && <small className="campo-ayuda">{ayuda}</small>
      )}
    </div>
  );
}
