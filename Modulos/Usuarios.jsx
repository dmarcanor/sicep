import { useEffect, useState } from "react";
import "./css/Usuarios.css";
import { api } from "../src/api";
import { usePinAction } from "../src/hooks/usePinAction";
import Campo from "../componentes/Campo";
import { useBusquedaDiferida } from "../src/hooks/useBusquedaDiferida";

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

// Reflejan las reglas de UsuarioController@store; si cambian allí, cambian aquí.
const AYUDAS = {
  name: "Nombre y apellido completos.",
  username: "Único en el sistema. Es el nombre con el que inicia sesión.",
  email: "Debe ser un correo válido y único, ej. usuario@dominio.com",
  password: "Mínimo 8 caracteres.",
  pin: "Entre 4 y 6 dígitos numéricos. Se pedirá para confirmar acciones críticas.",
  phone: "Opcional. Formato venezolano: 0414-1234567 o +58 414 1234567.",
  position: "Opcional. Ej. Consejero de Protección.",
};

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_TELEFONO =
  /^(\+58|0)?(414|424|412|426|416|212|244|243|283|234|235|273|275|277|278|291|293|295)\d{7}$/;

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



  const cargarUsuarios = async (search = "", rol = filtroRol) => {
    try {
      setCargando(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (rol && rol !== "Todos") params.role = rol.toLowerCase();
      const data = await api.getUsuarios(params);
      setUsuarios(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const busquedaDiferida = useBusquedaDiferida(busqueda);

  useEffect(() => {
    cargarUsuarios(busquedaDiferida, filtroRol);
  }, [busquedaDiferida, filtroRol]);

  const usuariosFiltrados = usuarios;

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

    setErrores((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
  };

  const validar = () => {
    const err = {};

    if (!form.name.trim()) err.name = "Indique el nombre completo.";
    if (!form.username.trim()) err.username = "Indique el nombre de usuario.";

    if (!form.email.trim()) {
      err.email = "Indique el correo electrónico.";
    } else if (!RE_EMAIL.test(form.email.trim())) {
      err.email = "El correo no es válido. Ej. usuario@dominio.com";
    }

    if (!form.id) {
      if (!form.password.trim()) {
        err.password = "Indique una contraseña.";
      } else if (form.password.length < 8) {
        err.password = `La contraseña debe tener al menos 8 caracteres (tiene ${form.password.length}).`;
      }

      const pin = form.pin.trim();
      if (!pin) {
        err.pin = "Indique el PIN de seguridad.";
      } else if (!/^\d+$/.test(pin)) {
        err.pin = "El PIN solo admite dígitos numéricos.";
      } else if (pin.length < 4 || pin.length > 6) {
        err.pin = `El PIN debe tener entre 4 y 6 dígitos (tiene ${pin.length}).`;
      }
    }

    if (!form.role.trim()) err.role = "Seleccione un rol.";

    if (form.phone && !RE_TELEFONO.test(form.phone.replace(/[\s-]/g, ""))) {
      err.phone = "Teléfono no válido. Use 0414-1234567 o +58 414 1234567.";
    }

    setErrores(err);

    if (Object.keys(err).length > 0) {
      setMensaje("Revise los campos marcados en rojo.");
      setTimeout(() => setMensaje(""), 4000);
      return false;
    }

    return true;
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
      if (error.message === "Acción cancelada") return;

      // El backend valida lo mismo que el formulario; si algo se escapa (unicidad
      // de usuario o correo) se marca el campo en vez de un aviso genérico.
      if (error.errors) {
        const porCampo = {};
        Object.entries(error.errors).forEach(([campo, mensajes]) => {
          porCampo[campo] = mensajes[0];
        });
        setErrores(porCampo);
        setMensaje("Revise los campos marcados en rojo.");
      } else {
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
                <p>
                  Defina datos, rol y condición de acceso del usuario. Los
                  campos marcados con <b>*</b> son obligatorios.
                </p>
              </div>

              <button className="btn-close" onClick={cerrarModal}>
                ✕
              </button>
            </div>

            <div className="form-nuevo-expediente">
              <Campo label="Nombre completo *" ayuda={AYUDAS.name} error={errores.name}>
                <input
                  name="name"
                  value={form.name}
                  onChange={actualizarForm}
                  className={errores.name ? "error" : ""}
                />
              </Campo>

              <Campo label="Usuario *" ayuda={AYUDAS.username} error={errores.username}>
                <input
                  name="username"
                  value={form.username}
                  onChange={actualizarForm}
                  className={errores.username ? "error" : ""}
                />
              </Campo>

              <Campo label="Correo *" ayuda={AYUDAS.email} error={errores.email}>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={actualizarForm}
                  className={errores.email ? "error" : ""}
                />
              </Campo>

              {!form.id && (
                <>
                  <Campo
                    label="Contraseña *"
                    ayuda={AYUDAS.password}
                    error={errores.password}
                  >
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={actualizarForm}
                      className={errores.password ? "error" : ""}
                    />
                  </Campo>

                  <Campo label="PIN de Seguridad *" ayuda={AYUDAS.pin} error={errores.pin}>
                    <input
                      name="pin"
                      type="password"
                      maxLength={6}
                      inputMode="numeric"
                      value={form.pin}
                      onChange={actualizarForm}
                      placeholder="4-6 dígitos numéricos"
                      className={errores.pin ? "error" : ""}
                    />
                  </Campo>
                </>
              )}

              <Campo label="Rol *" error={errores.role}>
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
              </Campo>

              <Campo label="Teléfono" ayuda={AYUDAS.phone} error={errores.phone}>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={actualizarForm}
                  placeholder="0414-1234567"
                  className={errores.phone ? "error" : ""}
                />
              </Campo>

              <Campo label="Cargo" ayuda={AYUDAS.position} error={errores.position}>
                <input
                  name="position"
                  value={form.position}
                  onChange={actualizarForm}
                />
              </Campo>

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