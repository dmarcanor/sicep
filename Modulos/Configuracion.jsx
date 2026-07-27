import { useEffect, useState } from "react";
import { api } from "../src/api";
import { usePinAction } from "../src/hooks/usePinAction";
import PermisosPorRol from "../componentes/PermisosPorRol";
import "./css/Configuracion.css";

export default function Configuracion() {
  const [configuraciones, setConfiguraciones] = useState({});
  const [categoriaActiva, setCategoriaActiva] = useState("general");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const { executeWithPin, PinModalWrapper } = usePinAction();

  const categorias = [
    { id: "general", nombre: "General", icono: "🏢" },
    { id: "membrete", nombre: "Membrete", icono: "📄" },
    { id: "contacto", nombre: "Contacto", icono: "📞" },
    { id: "jefatura", nombre: "Jefatura", icono: "👔" },
    { id: "apariencia", nombre: "Apariencia", icono: "🎨" },
    { id: "permisos", nombre: "Permisos por Rol", icono: "🔐" },
    { id: "sistema", nombre: "Sistema", icono: "⚙️" },
    { id: "seguridad", nombre: "Seguridad", icono: "🛡️" },
  ];

  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  const cargarConfiguraciones = async () => {
    try {
      setCargando(true);
      const data = await api.getConfiguracion();
      const configMap = {};
      data.forEach((config) => {
        configMap[config.clave] = config;
      });
      setConfiguraciones(configMap);
    } catch (error) {
      console.error("Error cargando configuraciones:", error);
    } finally {
      setCargando(false);
    }
  };

  const actualizarValor = (clave, valor) => {
    setConfiguraciones((prev) => ({
      ...prev,
      [clave]: { ...prev[clave], valor },
    }));
  };

  const guardarCambios = async () => {
    const configsCategoria = Object.values(configuraciones).filter(
      (c) => c.categoria === categoriaActiva
    );

    const cambios = configsCategoria.map((c) => ({
      clave: c.clave,
      valor: c.valor,
    }));

    try {
      setGuardando(true);
      await executeWithPin(async (pin) => {
        await api.updateConfiguracionMultiple(cambios, pin);
      }, "Guardar Configuración");
      setMensaje("Configuración guardada correctamente");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        setMensaje(error.message || "Error al guardar configuración");
        setTimeout(() => setMensaje(""), 3000);
      }
    } finally {
      setGuardando(false);
    }
  };

  const renderCampo = (config) => {
    if (!config) return null;

    switch (config.tipo) {
      case "color":
        return (
          <div className="config-campo" key={config.clave}>
            <label>{config.descripcion || config.clave}</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={config.valor || "#000000"}
                onChange={(e) => actualizarValor(config.clave, e.target.value)}
              />
              <input
                type="text"
                value={config.valor || ""}
                onChange={(e) => actualizarValor(config.clave, e.target.value)}
                placeholder="#000000"
              />
            </div>
          </div>
        );

      case "numero":
        return (
          <div className="config-campo" key={config.clave}>
            <label>{config.descripcion || config.clave}</label>
            <input
              type="number"
              value={config.valor || ""}
              onChange={(e) => actualizarValor(config.clave, e.target.value)}
            />
          </div>
        );

      case "json":
        let jsonValue = "";
        try {
          const parsed = JSON.parse(config.valor || "[]");
          jsonValue = parsed.join(", ");
        } catch {
          jsonValue = config.valor || "";
        }

        return (
          <div className="config-campo" key={config.clave}>
            <label>{config.descripcion || config.clave}</label>
            <textarea
              value={jsonValue}
              onChange={(e) => {
                const valores = e.target.value.split(",").map((v) => v.trim());
                actualizarValor(config.clave, JSON.stringify(valores));
              }}
              rows={4}
              placeholder="Separar permisos con comas"
            />
            <small className="config-help">
              Separe los permisos con comas
            </small>
          </div>
        );

      default:
        return (
          <div className="config-campo" key={config.clave}>
            <label>{config.descripcion || config.clave}</label>
            <input
              type="text"
              value={config.valor || ""}
              onChange={(e) => actualizarValor(config.clave, e.target.value)}
            />
          </div>
        );
    }
  };

  const renderCategoria = () => {
    if (categoriaActiva === "permisos") {
      return <PermisosPorRol />;
    }

    const configsCategoria = Object.values(configuraciones).filter(
      (c) => c.categoria === categoriaActiva
    );

    if (configsCategoria.length === 0) {
      return <p className="config-vacio">No hay configuraciones en esta categoría</p>;
    }

    return configsCategoria.map((config) => renderCampo(config));
  };

  if (cargando) {
    return (
      <div className="modulo">
        <div className="cabeceraModulo">
          <h2>Configuración del Sistema</h2>
        </div>
        <p>Cargando configuraciones...</p>
      </div>
    );
  }

  return (
    <div className="modulo config-modulo">
      <div className="cabeceraModulo">
        <div>
          <h2>Configuración del Sistema</h2>
          <p>Administre los parámetros generales del sistema</p>
        </div>
        <button
          className="btn-primary"
          onClick={guardarCambios}
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      {mensaje && <div className="toast-exito">{mensaje}</div>}

      <div className="config-layout">
        <aside className="config-sidebar">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              className={`config-categoria-btn ${
                categoriaActiva === cat.id ? "active" : ""
              }`}
              onClick={() => setCategoriaActiva(cat.id)}
            >
              <span className="config-icono">{cat.icono}</span>
              <span className="config-nombre">{cat.nombre}</span>
            </button>
          ))}
        </aside>

        <main className="config-content">
          <div className="config-header">
            <h3>
              {categorias.find((c) => c.id === categoriaActiva)?.nombre}
            </h3>
          </div>

          <div className="config-form">{renderCategoria()}</div>
        </main>
      </div>

      <PinModalWrapper />
    </div>
  );
}
