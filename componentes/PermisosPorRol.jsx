import { useEffect, useState } from "react";
import { api } from "../src/api";
import { usePinAction } from "../src/hooks/usePinAction";

export default function PermisosPorRol() {
  const [permisos, setPermis] = useState({
    administrador: [],
    supervisor: [],
    consejero: [],
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const { executeWithPin } = usePinAction();

  const listaPermisos = [
    { id: "ver_expedientes", nombre: "Ver expedientes", descripcion: "Puede ver la lista de expedientes" },
    { id: "crear_expedientes", nombre: "Crear expedientes", descripcion: "Puede crear nuevos expedientes" },
    { id: "editar_expedientes", nombre: "Editar expedientes", descripcion: "Puede modificar expedientes existentes" },
    { id: "eliminar_expedientes", nombre: "Eliminar expedientes", descripcion: "Puede eliminar expedientes" },
    { id: "ver_usuarios", nombre: "Ver usuarios", descripcion: "Puede ver la lista de usuarios" },
    { id: "crear_usuarios", nombre: "Crear usuarios", descripcion: "Puede crear nuevos usuarios" },
    { id: "editar_usuarios", nombre: "Editar usuarios", descripcion: "Puede modificar usuarios" },
    { id: "eliminar_usuarios", nombre: "Eliminar usuarios", descripcion: "Puede eliminar usuarios" },
    { id: "ver_reportes", nombre: "Ver reportes", descripcion: "Puede acceder a los reportes" },
    { id: "ver_historial", nombre: "Ver historial", descripcion: "Puede ver el historial de auditoría" },
    { id: "configurar_sistema", nombre: "Configurar sistema", descripcion: "Puede modificar la configuración del sistema" },
    { id: "asignar_casos", nombre: "Asignar casos", descripcion: "Puede asignar casos a consejeros" },
    { id: "gestionar_plantillas", nombre: "Gestionar plantillas", descripcion: "Puede crear y editar plantillas" },
  ];

  useEffect(() => {
    cargarPermisos();
  }, []);

  const cargarPermisos = async () => {
    try {
      setCargando(true);
      const configs = await api.getConfiguracion({ categoria: "permisos" });
      
      const nuevosPermisos = {
        administrador: [],
        supervisor: [],
        consejero: [],
      };

      configs.forEach((config) => {
        if (config.clave === "permisos_administrador") {
          try {
            nuevosPermisos.administrador = JSON.parse(config.valor);
          } catch {
            nuevosPermisos.administrador = [];
          }
        } else if (config.clave === "permisos_supervisor") {
          try {
            nuevosPermisos.supervisor = JSON.parse(config.valor);
          } catch {
            nuevosPermisos.supervisor = [];
          }
        } else if (config.clave === "permisos_consejero") {
          try {
            nuevosPermisos.consejero = JSON.parse(config.valor);
          } catch {
            nuevosPermisos.consejero = [];
          }
        }
      });

      setPermisos(nuevosPermisos);
    } catch (error) {
      console.error("Error cargando permisos:", error);
    } finally {
      setCargando(false);
    }
  };

  const togglePermiso = (rol, permisoId) => {
    setPermisos((prev) => {
      const permisosRol = prev[rol] || [];
      const tienePermiso = permisosRol.includes(permisoId);
      
      return {
        ...prev,
        [rol]: tienePermiso
          ? permisosRol.filter((p) => p !== permisoId)
          : [...permisosRol, permisoId],
      };
    });
  };

  const guardarPermisos = async () => {
    try {
      setGuardando(true);
      await executeWithPin(async (pin) => {
        const cambios = [
          {
            clave: "permisos_administrador",
            valor: JSON.stringify(permisos.administrador),
          },
          {
            clave: "permisos_supervisor",
            valor: JSON.stringify(permisos.supervisor),
          },
          {
            clave: "permisos_consejero",
            valor: JSON.stringify(permisos.consejero),
          },
        ];

        await api.updateConfiguracionMultiple(cambios, pin);
      }, "Guardar Permisos");
      
      setMensaje("Permisos guardados correctamente");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        setMensaje(error.message || "Error al guardar permisos");
        setTimeout(() => setMensaje(""), 3000);
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
        <p>Active o desactive permisos específicos para cada rol</p>
        <button
          className="btn-primary"
          onClick={guardarPermisos}
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Guardar Permisos"}
        </button>
      </div>

      {mensaje && <div className="toast-exito">{mensaje}</div>}

      <div className="permisos-grid">
        {["administrador", "supervisor", "consejero"].map((rol) => (
          <div key={rol} className="permisos-rol">
            <h4 className="rol-titulo">
              {rol.charAt(0).toUpperCase() + rol.slice(1)}
            </h4>
            <div className="permisos-lista">
              {listaPermisos.map((permiso) => (
                <div key={permiso.id} className="permiso-item">
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      checked={permisos[rol]?.includes(permiso.id) || false}
                      onChange={() => togglePermiso(rol, permiso.id)}
                      className="switch-input"
                    />
                    <span className="switch-slider"></span>
                    <div className="permiso-info">
                      <strong>{permiso.nombre}</strong>
                      <small>{permiso.descripcion}</small>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
