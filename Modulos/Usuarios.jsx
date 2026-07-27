import { useEffect, useMemo, useState } from "react";
import "./css/Usuarios.css";
import { api } from "../src/api";
import { usePinAction } from "../src/hooks/usePinAction";

const formVacio = {
  id: null,
  name: "",
  username: "",
  email: "",
  password: "",
  pin: "",
  role: "consejero",
  display_name: "",
  phone: "",
  position: "",
  active: true,
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("Todos");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState(formVacio);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const { executeWithPin, PinModalWrapper } = usePinAction();

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const q = busqueda.toLowerCase().trim();

      const coincideBusqueda =
        !q ||
        `${u.name} ${u.username} ${u.email} ${u.role}`
          .toLowerCase()
          .includes(q);

      const coincideRol = filtroRol === "Todos" ? true : u.role === filtroRol;

      return coincideBusqueda && coincideRol;
    });
  }, [usuarios, busqueda, filtroRol]);

  const abrirNuevo = () => {
    setForm(formVacio);
    setErrores({});
    setMostrarModal(true);
  };

  const abrirEdicion = (usuario) => {
    setForm(usuario);
    setErrores({});
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setErrores({});
    setForm(formVacio);
  };

  const actualizarForm = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validar = () => {
    const err = {};

    if (!form.name.trim()) err.name = true;
    if (!form.username.trim()) err.username = true;
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      err.email = true;
    }
    if (!form.id) {
      if (!form.password.trim()) err.password = true;
      if (!form.pin.trim() || form.pin.length < 4 || form.pin.length > 6 || !/^\d+$/.test(form.pin)) {
        err.pin = true;
      }
    }
    if (!form.role.trim()) err.role = true;
    
    // Validación de teléfono venezolano
    if (form.phone && !/^(\+58|0)?(414|424|412|426|416|212|244|243|283|234|235|273|275|277|278|291|293|295)\d{7}$/.test(form.phone.replace(/[\s-]/g, ''))) {
      err.phone = true;
    }

    setErrores(err);
    return Object.keys(err).length === 0;
  };

  const guardarUsuario = async () => {
    if (!validar()) return;

    try {
      if (form.id) {
        await executeWithPin(async (pin) => {
          await api.updateUsuario(form.id, form, pin);
        }, "Actualizar Usuario");
        setMensaje("Usuario actualizado correctamente");
      } else {
        await executeWithPin(async (pin) => {
          await api.createUsuario(form, pin);
        }, "Crear Usuario");
        setMensaje("Usuario creado correctamente");
      }
      await cargarUsuarios();
      cerrarModal();
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        setMensaje(error.message || "Error al guardar usuario");
      }
    }
  };

  const cambiarHabilitado = async (id) => {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;

    try {
      await executeWithPin(async (pin) => {
        await api.updateUsuario(id, { ...usuario, active: !usuario.active }, pin);
      }, "Cambiar Estado de Usuario");
      await cargarUsuarios();
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        console.error('Error al cambiar estado:', error);
      }
    }
  };

  const eliminarUsuario = async (id) => {
    const confirmar = confirm("¿Desea eliminar este usuario?");
    if (!confirmar) return;

    try {
      await executeWithPin(async (pin) => {
        await api.deleteUsuario(id, pin);
      }, "Eliminar Usuario");
      await cargarUsuarios();
      setMensaje("Usuario eliminado correctamente");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        setMensaje(error.message || "Error al eliminar usuario");
      }
    }
  };

  return (
    <div className="usuarios">
      <div className="usuarios-header">
        <div>
          <span className="usuarios-badge">Administración</span>
          <h2>Gestión de usuarios</h2>
          <p>Control de acceso, roles y habilitación del personal autorizado.</p>
        </div>

        <button className="btn-primary" onClick={abrirNuevo}>
          + Nuevo usuario
        </button>
      </div>

      {mensaje && <div className="toast-exito">{mensaje}</div>}

      <div className="usuarios-toolbar">
        <input
          className="datatable-input"
          placeholder="Buscar por nombre, usuario, correo o rol..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          className="datatable-select"
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
        >
          <option>Todos</option>
          <option>Administrador</option>
          <option>Supervisor</option>
          <option>Consejero</option>
        </select>

        <span className="datatable-info">
          Total: <b>{usuariosFiltrados.length}</b> usuarios
        </span>
      </div>

      <div className="usuarios-card">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Acceso</th>
              <th>Último acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="usuarios-vacio">
                  No existen usuarios con los criterios seleccionados.
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="usuario-nombre">
                      <strong>{u.name}</strong>
                      <small>@{u.username}</small>
                    </div>
                  </td>

                  <td>{u.email}</td>

                  <td>
                    <span className={`chip rol-${u.role.toLowerCase()}`}>
                      {u.role}
                    </span>
                  </td>

                  <td>
                    <span className={`chip ${u.active ? "activo" : "inactivo"}`}>
                      {u.active ? "Habilitado" : "Deshabilitado"}
                    </span>
                  </td>

                  <td>{u.created_at ? new Date(u.created_at).toLocaleString() : "Sin registro"}</td>

                  <td>
                    <div className="usuarios-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => abrirEdicion(u)}
                      >
                        Editar
                      </button>

                      <button
                        className="btn-secondary"
                        onClick={() => cambiarHabilitado(u.id)}
                      >
                        {u.active ? "Deshabilitar" : "Habilitar"}
                      </button>

{/*                       <button
                        className="btn-link"
                        onClick={() => eliminarUsuario(u.id)}
                      >
                        Eliminar
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="expedientes-modal-overlay" onClick={cerrarModal}>
          <div className="expedientes-modal modal-usuarios" onClick={(e) => e.stopPropagation()}>
            <div className="expedientes-modal-header">
              <div>
                <span className="usuarios-badge">Acceso al sistema</span>
                <h3>{form.id ? "Editar usuario" : "Nuevo usuario"}</h3>
                <p>Defina datos, rol y condición de acceso del usuario.</p>
              </div>

              <button className="btn-close" onClick={cerrarModal}>
                ✕
              </button>
            </div>

            <div className="form-nuevo-expediente">
              <div className="campo">
                <label>Nombre completo *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={actualizarForm}
                  className={errores.name ? "error" : ""}
                />
              </div>

              <div className="campo">
                <label>Usuario *</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={actualizarForm}
                  className={errores.username ? "error" : ""}
                />
              </div>

              <div className="campo">
                <label>Correo *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={actualizarForm}
                  className={errores.email ? "error" : ""}
                />
              </div>

              {!form.id && (
                <>
                  <div className="campo">
                    <label>Contraseña *</label>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={actualizarForm}
                      className={errores.password ? "error" : ""}
                    />
                  </div>

                  <div className="campo">
                    <label>PIN de Seguridad *</label>
                    <input
                      name="pin"
                      type="password"
                      maxLength={6}
                      value={form.pin}
                      onChange={actualizarForm}
                      placeholder="4-6 dígitos numéricos"
                      className={errores.pin ? "error" : ""}
                    />
                  </div>
                </>
              )}

              <div className="campo">
                <label>Rol *</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={actualizarForm}
                  className={errores.role ? "error" : ""}
                >
                  <option value="administrador">Administrador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="consejero">Consejero</option>
                </select>
              </div>

              <div className="campo">
                <label>Teléfono</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={actualizarForm}
                />
              </div>

              <div className="campo">
                <label>Cargo</label>
                <input
                  name="position"
                  value={form.position}
                  onChange={actualizarForm}
                />
              </div>

              <div className="campo">
                <label>Estado</label>
                <select
                  name="active"
                  value={form.active ? "true" : "false"}
                  onChange={(e) =>
                    actualizarForm({
                      target: {
                        name: "active",
                        value: e.target.value === "true",
                      },
                    })
                  }
                >
                  <option value="true">Habilitado</option>
                  <option value="false">Deshabilitado</option>
                </select>
              </div>
            </div>

            <div className="detalle-footer">
              <button className="btn-secondary" onClick={cerrarModal}>
                Cancelar
              </button>

              <button className="btn-primary" onClick={guardarUsuario}>
                {form.id ? "Actualizar" : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PinModalWrapper />
    </div>
  );
}