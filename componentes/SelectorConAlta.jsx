import { useState } from "react";

export const CAMPOS_NNA = [
  { name: "documento_identidad", label: "Documento", required: true, placeholder: "V-31234567" },
  { name: "nombres", label: "Nombres", required: true },
  { name: "apellidos", label: "Apellidos", required: true },
  { name: "fecha_nacimiento", label: "Fecha de nacimiento", type: "date", required: true },
  { name: "sexo", label: "Sexo", type: "select", required: true, options: ["Masculino", "Femenino"] },
  { name: "lugar_nacimiento", label: "Lugar de nacimiento" },
];

export const CAMPOS_REPRESENTANTE = [
  { name: "cedula", label: "Cédula", required: true, placeholder: "V-12345678" },
  { name: "nombres", label: "Nombres", required: true },
  { name: "apellidos", label: "Apellidos", required: true },
  { name: "telefono", label: "Teléfono", placeholder: "0414-1234567" },
  { name: "direccion", label: "Dirección" },
];

export const etiquetaNna = (nna) =>
  `${nna.nombres} ${nna.apellidos}${nna.documento_identidad ? ` — ${nna.documento_identidad}` : ""}`;

export const etiquetaRepresentante = (rep) =>
  `${rep.nombres} ${rep.apellidos}${rep.cedula ? ` — ${rep.cedula}` : ""}`;

const vacio = (campos) =>
  campos.reduce((acc, campo) => ({ ...acc, [campo.name]: "" }), {});

export default function SelectorConAlta({
  label,
  value,
  onChange,
  opciones = [],
  getEtiqueta,
  camposAlta = [],
  onCrear,
  error = false,
  placeholder = "Seleccione",
  textoAlta = "+ Nuevo",
  ancho = true,
}) {
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState(() => vacio(camposAlta));
  const [faltantes, setFaltantes] = useState({});
  const [errorAlta, setErrorAlta] = useState("");
  const [guardando, setGuardando] = useState(false);

  const actualizar = (e) => {
    const { name, value: v } = e.target;
    setDatos((prev) => ({ ...prev, [name]: v }));
    setFaltantes((prev) => ({ ...prev, [name]: false }));
  };

  const cerrarAlta = () => {
    setAbierto(false);
    setDatos(vacio(camposAlta));
    setFaltantes({});
    setErrorAlta("");
  };

  const guardar = async () => {
    const pendientes = {};
    camposAlta.forEach((campo) => {
      if (campo.required && !String(datos[campo.name] ?? "").trim()) {
        pendientes[campo.name] = true;
      }
    });

    if (Object.keys(pendientes).length > 0) {
      setFaltantes(pendientes);
      setErrorAlta("Complete los campos obligatorios.");
      return;
    }

    setGuardando(true);
    setErrorAlta("");

    try {
      const creado = await onCrear(datos);
      // Sin id no hay nada que seleccionar; dejamos el panel abierto con los datos
      // para que el usuario no tenga que reescribirlos.
      if (creado?.id) {
        onChange(creado.id);
        cerrarAlta();
      } else {
        setErrorAlta("No se recibió el registro creado.");
      }
    } catch (err) {
      setErrorAlta(err?.message || "No se pudo crear el registro.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={ancho ? "campo ancho" : "campo"}>
      <label>{label}</label>

      <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
        <select
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : null)
          }
          className={error ? "error" : ""}
          style={{ flex: 1 }}
        >
          <option value="">{placeholder}</option>
          {opciones.map((opcion) => (
            <option key={opcion.id} value={opcion.id}>
              {getEtiqueta(opcion)}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => (abierto ? cerrarAlta() : setAbierto(true))}
          style={{ whiteSpace: "nowrap" }}
        >
          {abierto ? "Cancelar" : textoAlta}
        </button>
      </div>

      {abierto && (
        <div
          style={{
            marginTop: "10px",
            padding: "12px",
            border: "1px solid #d8dee8",
            borderRadius: "8px",
            background: "#f7f9fc",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
          }}
        >
          {camposAlta.map((campo) => (
            <div key={campo.name} className="campo">
              <label style={{ fontSize: "12px" }}>
                {campo.label}
                {campo.required ? " *" : ""}
              </label>

              {campo.type === "select" ? (
                <select
                  name={campo.name}
                  value={datos[campo.name] ?? ""}
                  onChange={actualizar}
                  className={faltantes[campo.name] ? "error" : ""}
                >
                  <option value="">Seleccione</option>
                  {(campo.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={campo.name}
                  type={campo.type || "text"}
                  value={datos[campo.name] ?? ""}
                  onChange={actualizar}
                  placeholder={campo.placeholder || ""}
                  className={faltantes[campo.name] ? "error" : ""}
                />
              )}
            </div>
          ))}

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <span style={{ color: "#c0392b", fontSize: "13px" }}>
              {errorAlta}
            </span>

            <button
              type="button"
              className="btn-primary"
              onClick={guardar}
              disabled={guardando}
            >
              {guardando ? "Guardando..." : "Guardar y seleccionar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
