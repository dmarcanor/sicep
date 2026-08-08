import { useEffect, useMemo, useRef, useState } from "react";
import "./css/Campo.css";
import "./css/SelectorConAlta.css";

// Sin acentos y en minúsculas: quien busca "perez" debe encontrar "Pérez".
const normalizar = (texto) =>
  String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const MAX_VISIBLES = 50;

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
  ayuda = "",
  placeholder = "Seleccione",
  textoAlta = "+ Nuevo",
  ancho = true,
}) {
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState(() => vacio(camposAlta));
  const [faltantes, setFaltantes] = useState({});
  const [errorAlta, setErrorAlta] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [consulta, setConsulta] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const contenedorRef = useRef(null);

  const seleccionada = opciones.find((o) => o.id === value) || null;

  const coincidencias = useMemo(() => {
    const q = normalizar(consulta).trim();
    if (!q) return opciones.slice(0, MAX_VISIBLES);

    // Cada palabra debe aparecer en algún punto de la etiqueta, así "perez maria"
    // encuentra igual que "maria perez".
    const palabras = q.split(/\s+/);
    return opciones
      .filter((o) => {
        const texto = normalizar(getEtiqueta(o));
        return palabras.every((p) => texto.includes(p));
      })
      .slice(0, MAX_VISIBLES);
  }, [consulta, opciones, getEtiqueta]);

  const totalCoincidencias = useMemo(() => {
    const q = normalizar(consulta).trim();
    if (!q) return opciones.length;
    const palabras = q.split(/\s+/);
    return opciones.filter((o) => {
      const texto = normalizar(getEtiqueta(o));
      return palabras.every((p) => texto.includes(p));
    }).length;
  }, [consulta, opciones, getEtiqueta]);

  // Cerrar al pulsar fuera del componente.
  useEffect(() => {
    if (!listaAbierta) return undefined;

    const alPulsarFuera = (e) => {
      if (!contenedorRef.current?.contains(e.target)) setListaAbierta(false);
    };

    document.addEventListener("mousedown", alPulsarFuera);
    return () => document.removeEventListener("mousedown", alPulsarFuera);
  }, [listaAbierta]);

  const elegir = (opcion) => {
    onChange(opcion.id);
    setConsulta("");
    setListaAbierta(false);
  };

  const limpiar = () => {
    onChange(null);
    setConsulta("");
    setListaAbierta(false);
  };

  const alTeclear = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!listaAbierta) {
        setListaAbierta(true);
        return;
      }
      setIndiceActivo((prev) => {
        const siguiente = e.key === "ArrowDown" ? prev + 1 : prev - 1;
        if (siguiente < 0) return coincidencias.length - 1;
        if (siguiente >= coincidencias.length) return 0;
        return siguiente;
      });
      return;
    }

    if (e.key === "Enter" && listaAbierta) {
      e.preventDefault();
      const opcion = coincidencias[indiceActivo];
      if (opcion) elegir(opcion);
      return;
    }

    if (e.key === "Escape") {
      setListaAbierta(false);
      setConsulta("");
    }
  };

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

      <div
        ref={contenedorRef}
        style={{ display: "flex", gap: "8px", alignItems: "stretch" }}
      >
        <div className="selector-busqueda">
          <input
            type="text"
            role="combobox"
            aria-expanded={listaAbierta}
            autoComplete="off"
            className={error ? "error" : ""}
            placeholder={placeholder}
            value={
              listaAbierta
                ? consulta
                : seleccionada
                  ? getEtiqueta(seleccionada)
                  : ""
            }
            onChange={(e) => {
              setConsulta(e.target.value);
              setIndiceActivo(0);
              setListaAbierta(true);
            }}
            onFocus={() => {
              setConsulta("");
              setIndiceActivo(0);
              setListaAbierta(true);
            }}
            onKeyDown={alTeclear}
          />

          {seleccionada && !listaAbierta && (
            <button
              type="button"
              className="selector-limpiar"
              onClick={limpiar}
              title="Quitar selección"
            >
              ✕
            </button>
          )}

          {listaAbierta && (
            <ul className="selector-lista">
              {coincidencias.length === 0 ? (
                <li className="selector-vacio">
                  Sin resultados para “{consulta}”.
                </li>
              ) : (
                coincidencias.map((opcion, i) => (
                  <li
                    key={opcion.id}
                    className={`selector-opcion ${i === indiceActivo ? "activa" : ""}`}
                    // onMouseDown: se adelanta al blur del input, que si no
                    // cerraría la lista antes de registrar el clic.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      elegir(opcion);
                    }}
                    onMouseEnter={() => setIndiceActivo(i)}
                  >
                    {getEtiqueta(opcion)}
                  </li>
                ))
              )}

              {totalCoincidencias > coincidencias.length && (
                <li className="selector-conteo">
                  Mostrando {coincidencias.length} de {totalCoincidencias}. Afine
                  la búsqueda para ver el resto.
                </li>
              )}
            </ul>
          )}
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => (abierto ? cerrarAlta() : setAbierto(true))}
          style={{ whiteSpace: "nowrap" }}
        >
          {abierto ? "Cancelar" : textoAlta}
        </button>
      </div>

      {error ? (
        <small className="campo-error">{error}</small>
      ) : (
        ayuda && !abierto && <small className="campo-ayuda">{ayuda}</small>
      )}

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
