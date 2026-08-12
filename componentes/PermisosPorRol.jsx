import { useEffect, useState } from "react";
import { api } from "../src/api";
import { usePinAction } from "../src/hooks/usePinAction";

// El administrador no se configura: por definición tiene todos los módulos.
const ROLES = ["supervisor", "consejero"];

// Deben coincidir con App\Support\Permisos::MODULOS del backend.
const MODULOS = [
  { id: "principal", nombre: "Panel Principal", descripcion: "Pantalla de inicio con los indicadores del despacho" },
  { id: "urd", nombre: "Recepción URD", descripcion: "Registro inicial en recepción. Requiere también NNA, Representantes y Expedientes" },
  { id: "nna", nombre: "Gestión de NNA", descripcion: "Fichas de niños, niñas y adolescentes" },
  { id: "representantes", nombre: "Representantes", descripcion: "Fichas de los representantes legales" },
  { id: "expedientes", nombre: "Expedientes", descripcion: "Listado, seguimiento y cambio de estatus" },
  { id: "solicitudArchivos", nombre: "Solicitud de Archivos", descripcion: "Pedidos de documentos al archivo físico" },
  { id: "asignacionCasos", nombre: "Asignación de Casos", descripcion: "Reparto de expedientes entre consejeros" },
  { id: "plantillas", nombre: "Plantillas", descripcion: "Formatos de citaciones, actas y medidas" },
  { id: "reportes", nombre: "Reportes", descripcion: "Estadísticas y gráficos de gestión" },
  { id: "historial", nombre: "Historial del Sistema", descripcion: "Auditoría de todas las acciones" },
  { id: "usuarios", nombre: "Usuarios", descripcion: "Alta, edición y habilitación del personal" },
  { id: "configuracion", nombre: "Configuración", descripcion: "Parámetros del sistema y esta misma matriz" },
];

// El panel principal es la pantalla de aterrizaje: el backend lo concede
// siempre, así que aquí se muestra fijo para no prometer algo que no se aplica.
const MODULO_BASE = "principal";

const vacio = { supervisor: [], consejero: [] };

export default function PermisosPorRol() {
  const [permisos, setPermisos] = useState(vacio);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const { executeWithPin, PinModalWrapper } = usePinAction();

  useEffect(() => {
    let vigente = true;

    const cargarPermisos = async () => {
      try {
        setCargando(true);
        const configs = await api.getConfiguracion({ categoria: "permisos" });

        const cargados = { ...vacio };
        ROLES.forEach((rol) => {
          const config = configs.find((c) => c.clave === `permisos_${rol}`);
          try {
            const lista = JSON.parse(config?.valor ?? "[]");
            cargados[rol] = Array.isArray(lista) ? lista : [];
          } catch {
            cargados[rol] = [];
          }
        });

        if (vigente) setPermisos(cargados);
      } catch (error) {
        console.error("Error cargando permisos:", error);
        if (vigente) setMensaje("No se pudieron cargar los permisos.");
      } finally {
        if (vigente) setCargando(false);
      }
    };

    cargarPermisos();
    return () => {
      vigente = false;
    };
  }, []);

  const togglePermiso = (rol, moduloId) => {
    setPermisos((prev) => {
      const actuales = prev[rol] || [];
      return {
        ...prev,
        [rol]: actuales.includes(moduloId)
          ? actuales.filter((m) => m !== moduloId)
          : [...actuales, moduloId],
      };
    });
  };

  const guardarPermisos = async () => {
    try {
      setGuardando(true);
      await executeWithPin(async (pin) => {
        await api.updateConfiguracionMultiple(
          ROLES.map((rol) => ({
            clave: `permisos_${rol}`,
            valor: JSON.stringify(permisos[rol] || []),
          })),
          pin,
        );
      }, "Guardar Permisos");

      setMensaje("Permisos guardados. Se aplican de inmediato, sin volver a entrar.");
      setTimeout(() => setMensaje(""), 4000);
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        setMensaje(error.message || "Error al guardar permisos");
        setTimeout(() => setMensaje(""), 4000);
      }
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <p>Cargando permisos...</p>;
  }

  return (
    <div className="permisos-container">
      <div className="permisos-header">
        <h3>Control de Permisos por Rol</h3>
        <p>
          Todos los módulos pueden concederse a cualquier rol; lo que cambia
          de partida es qué trae activado cada uno. Se aplica al menú y también
          a la API: un módulo desactivado deja de responder.
        </p>
        <p className="permisos-nota">
          El rol <strong>Administrador</strong> no se configura: siempre tiene
          acceso a todo.
        </p>
        <button className="btn-primary" onClick={guardarPermisos} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar Permisos"}
        </button>
      </div>

      {mensaje && <div className="toast-exito">{mensaje}</div>}

      <div className="permisos-grid">
        {ROLES.map((rol) => {
          return (
            <div key={rol} className="permisos-rol">
              <h4 className="rol-titulo">{rol.charAt(0).toUpperCase() + rol.slice(1)}</h4>
              <div className="permisos-lista">
                {MODULOS.map((modulo) => {
                  const fijo = modulo.id === MODULO_BASE;

                  return (
                    <div key={modulo.id} className="permiso-item">
                      <label className="switch-label">
                        <input
                          type="checkbox"
                          checked={fijo || (permisos[rol] || []).includes(modulo.id)}
                          disabled={fijo}
                          onChange={() => togglePermiso(rol, modulo.id)}
                          className="switch-input"
                        />
                        <span className="switch-slider"></span>
                        <div className="permiso-info">
                          <strong>{modulo.nombre}</strong>
                          <small>{fijo ? "Siempre disponible" : modulo.descripcion}</small>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <PinModalWrapper />
    </div>
  );
}
