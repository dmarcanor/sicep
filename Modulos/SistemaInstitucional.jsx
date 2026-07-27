import { useEffect, useMemo, useState } from "react";
import Perfil from "./Perfil";
import Usuarios from "./Usuarios";
import "../src/App.css";
import "./css/PanelPrincipal.css";

import RecepcionURD from "./RecepcionURD";
import Expedientes from "./Expedientes";
import SolicitudArchivos from "./SolicitudArchivos";
import Reportes from "./Reportes";
import Configuracion from "./Configuracion";
import PanelPrincipal from "./PanelPrincipal";
import Plantillas from "./Plantillas";
import HistorialSistema from "./HistorialSistema";
import AsignacionCasos from "./AsignacionCasos";
import Nna from "./Nna";
import Representantes from "./Representantes";
import logoSicep from "../img/logo.png";
import { api, getAuthToken, setPinConfigurado } from "../src/api";

const PERMISOS = {
  administrador: [
    "principal",
    "urd",
    "nna",
    "representantes",
    "expedientes",
    "solicitudArchivos",
    "usuarios",
    "reportes",
    "plantillas",
    "historial",
    "asignacionCasos",
    "configuracion",
  ],
  supervisor: [
    "principal",
    "urd",
    "nna",
    "representantes",
    "expedientes",
    "solicitudArchivos",
    "reportes",
    "historial",
    "asignacionCasos",
  ],
  consejero: ["principal", "urd", "nna", "representantes", "expedientes", "solicitudArchivos"],
};
const TITULOS_MODULOS = {
  principal: "Panel Principal",

  urd: "Recepción",
  nna: "NNA",
  representantes: "Representantes",
  expedientes: "Expedientes",
  asignacionCasos: "Asignación de Casos",
  solicitudArchivos: "Solicitud de Archivos",

  usuarios: "Usuarios",

  reportes: "Reportes",
  plantillas: "Plantillas",
  historial: "Historial",
  configuracion: "Configuración",
};
const ICONOS_MODULOS = {
  principal: "🏛️",
  urd: "🧾",
  nna: "👶",
  representantes: "👨‍👩‍👧",
  expedientes: "🗂️",
  solicitudArchivos: "📦",
  usuarios: "👥",
  reportes: "📊",
  plantillas: "📄",
  historial: "🕘",
  configuracion: "⚙️",
  asignacionCasos: "⚖️"
};

const expedientesBase = [
  {
    id: "SICEP-URD-000128",
    fecha: "2026-06-06",
    nino: "María Fernanda Pérez",
    representante: "Yolanda Rivas",
    sector: "Centro",
    estatus: "Registrado",
    prioridad: "Alta",
  },
  {
    id: "SICEP-URD-000127",
    fecha: "2026-06-05",
    nino: "José Luis González",
    representante: "Carlos González",
    sector: "Barrio Bolívar",
    estatus: "En revisión",
    prioridad: "Media",
  },
  {
    id: "SICEP-URD-000126",
    fecha: "2026-06-05",
    nino: "Valeria Jiménez",
    representante: "Ana Jiménez",
    sector: "Guariquén",
    estatus: "Aprobado",
    prioridad: "Baja",
  },
  {
    id: "SICEP-URD-000125",
    fecha: "2026-06-04",
    nino: "Samuel Ortega",
    representante: "Marta Ortega",
    sector: "El Muerto",
    estatus: "Observado",
    prioridad: "Alta",
  },
  {
    id: "SICEP-URD-000124",
    fecha: "2026-06-04",
    nino: "Daniela Rojas",
    representante: "Luis Rojas",
    sector: "Centro",
    estatus: "Registrado",
    prioridad: "Media",
  },
];

function Pill({ children, tone = "default" }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function StatCard({ title, value, subtitle, tone }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-top">
        <span className="stat-title">{title}</span>
        <span className="stat-dot" />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-subtitle">{subtitle}</div>
    </article>
  );
}

function BarraLateral({ abierta, moduloActivo, cambiarModulo, rol }) {
  const modulosVisibles = Object.keys(TITULOS_MODULOS).filter((modulo) =>
    PERMISOS[rol]?.includes(modulo)
  );

  return (
    <aside className={`sidebar ${abierta ? "" : "collapsed"}`}>
{/*       <div className="brand">
        <div className="brand-badge">SICEP-NNA</div>
        <div className="brand-text">
          <h1>Sistema de Protección</h1>
          <span>URD · Municipio Benítez</span>
        </div>
      </div> */}
      
        <div className="brand">
          <img
            src={logoSicep}
            alt="Logo SICEP-NNA"
            className="brand-logo"
          />
        </div>
      <nav className="nav">
        {modulosVisibles.map((modulo) => (
          <button
            key={modulo}
            className={`nav-item ${moduloActivo === modulo ? "active" : ""}`}
            onClick={() => cambiarModulo(modulo)}
          >
            <span className="nav-ico">{ICONOS_MODULOS[modulo]}</span>
            <span className="nav-txt">{TITULOS_MODULOS[modulo]}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function EncabezadoSuperior({
  abrirPanel,
  moduloActivo,
  menuUsuarioAbierto,
  alternarMenuUsuario,
  abrirPerfil,
  cerrarSesion,
  usuario,
}) {
  const tituloModulo = TITULOS_MODULOS[moduloActivo] || "Configuración";

  const rolVisible =
    usuario?.rol === "administrador"
      ? "Administrador"
      : usuario?.rol === "supervisor"
      ? "Supervisor"
      : usuario?.rol === "consejero"
      ? "Consejero"
      : "Usuario";

  return (
    <header className="header">
      <div className="header-left">
        <button className="icon-btn" onClick={abrirPanel}>
          ☰
        </button>

        <div className="title-block">
          <div className="system-name">SICEP-NNA | Municipio Benítez</div>
          <div className="module-name">
            Dashboard administrativo de expedientes
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-chip">
          <span className="chip-dot" />
          {tituloModulo}
        </div>

        <div className="header-chip" title="Rol activo">
          <span className="chip-dot" />
          {rolVisible}
        </div>

        <div className="user-menu-wrap">
          <button className="user-btn" onClick={alternarMenuUsuario}>
            👤
          </button>

          {menuUsuarioAbierto && (
            <div className="user-menu">
              <button onClick={abrirPerfil}>Editar perfil</button>
              <button onClick={cerrarSesion}>Cerrar sesión</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function SistemaInstitucional() {
  const [panelLateralAbierto, setPanelLateralAbierto] = useState(true);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [moduloActivo, setModuloActivo] = useState("principal");
  const [verPerfil, setVerPerfil] = useState(false);

  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState("login");

  const [loginData, setLoginData] = useState({
    user: "",
    pass: "",
  });

  const rolUsuario = usuario?.rol || null;

  const puedeVerModulo = (modulo, rol = rolUsuario) => {
    return !!PERMISOS[rol]?.includes(modulo);
  };

  const moduloInicialPermitido = useMemo(() => {
    if (!rolUsuario) return "principal";
    return puedeVerModulo("principal", rolUsuario) ? "principal" : "urd";
  }, [rolUsuario]);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getMe().then(user => {
        setUsuario(user);
        setVista("app");
        setModuloActivo("principal");
      }).catch(() => {
        localStorage.removeItem("sicep_user");
      });
    }
  }, []);

  useEffect(() => {
    if (vista !== "app") return;

    if (!puedeVerModulo(moduloActivo)) {
      setModuloActivo(moduloInicialPermitido);
    }
  }, [moduloActivo, vista, rolUsuario, moduloInicialPermitido]);

  const cambiarModulo = (nuevoModulo) => {
    if (!puedeVerModulo(nuevoModulo)) {
      alert("Acceso denegado para su nivel de usuario");
      return;
    }

    setModuloActivo(nuevoModulo);
    setVerPerfil(false);
    setMenuUsuarioAbierto(false);
  };

  const abrirPerfil = () => {
    setVerPerfil(true);
    setMenuUsuarioAbierto(false);
  };

  const cerrarSesion = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    setUsuario(null);
    setVista("login");
    setVerPerfil(false);
    setMenuUsuarioAbierto(false);
    setModuloActivo("principal");
    localStorage.removeItem("sicep_user");
  };

  if (vista === "login") {
    return (
      <div className="login-root">
        <div className="login-bg">
          <div className="bg-overlay" />
          <div className="bg-shapes">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="login-shell">
          <div className="login-info">

            <div className="brand">
          <img
            src={logoSicep}
            alt="Logo SICEP-NNA"
            className="brand-logo"
          />
        </div>

            <div style={{ display: "grid", gap: "10px", marginTop: "22px" }}>
              <div className="login-role-card">
                <strong>Consejero</strong>
                <span>URD, expedientes y panel principal</span>
              </div>
              <div className="login-role-card">
                <strong>Supervisor</strong>
                <span>URD, expedientes, reportes e historial</span>
              </div>
              <div className="login-role-card">
                <strong>Administrador</strong>
                <span>Acceso total al sistema</span>
              </div>
            </div>

            <div className="institution-footer">
              LOPNNA · República Bolivariana · Sistema Oficial de Gestión Social
            </div>
          </div>

          <div className="login-panel">
            <div className="login-head">
              <div className="login-badge">ACCESO RESTRINGIDO</div>
              <h1 style={{ letterSpacing: "0px" }}>
                Ingreso al Sistema
              </h1>             
               <p>Autenticación institucional obligatoria</p>
            </div>

            <div className="login-form">
              <label>Usuario</label>
              <input
                placeholder="Código institucional"
                onChange={(e) =>
                  setLoginData({ ...loginData, user: e.target.value })
                }
              />

              <label>Clave de acceso</label>
              <input
                type="password"
                placeholder="••••••••••"
                onChange={(e) =>
                  setLoginData({ ...loginData, pass: e.target.value })
                }
              />

              <button
                className="login-btn"
                onClick={async () => {
                  try {
                    const data = await api.login(loginData.user, loginData.pass);
                    setUsuario(data.user);
                    setPinConfigurado(data.user.pin_configurado);
                    setModuloActivo("principal");
                    setVista("app");
                  } catch (error) {
                    alert("Credenciales inválidas");
                  }
                }}
              >
                Acceder al sistema
              </button>
            </div>

            <div className="login-secure-note">
              🔒 Conexión segura · Registro auditado · Uso institucional exclusivo
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderizarModulo = () => {
    if (verPerfil) {
      return (
        <Perfil
          usuarioBase={{
            nombre: usuario?.nombreVisible || "Usuario",
            apellido: "Sistema",
            correo: `${usuario?.usuario || "admin"}@sicep.com`,
            telefono: "0000000000",
            cargo:
              usuario?.rol === "administrador"
                ? "Administrador"
                : usuario?.rol === "supervisor"
                ? "Supervisor"
                : usuario?.rol === "consejero"
                ? "Consejero"
                : "Usuario",
          }}
        />
      );
    }

    switch (moduloActivo) {
      case "principal":
        return <PanelPrincipal irAModulo={cambiarModulo} />;

      case "urd":
        return <RecepcionURD irAModulo={cambiarModulo} />;

      case "nna":
        return <Nna />;

      case "representantes":
        return <Representantes />;

      case "expedientes":
        return <Expedientes expedientesBase={expedientesBase} />;

      case "solicitudArchivos":
        return <SolicitudArchivos />;

      case "usuarios":
        return <Usuarios />;

      case "reportes":
        return <Reportes />;

      case "plantillas":
        return <Plantillas />;

      case "historial":
        return <HistorialSistema />;

      case "configuracion":
        return <Configuracion />;
        case "asignacionCasos":
        return <AsignacionCasos />;

      default:
        return <PanelPrincipal irAModulo={cambiarModulo} />;
    }
  };

  return (
    <div className="envolturaAplicacion">
      <BarraLateral
        abierta={panelLateralAbierto}
        moduloActivo={moduloActivo}
        cambiarModulo={cambiarModulo}
        rol={rolUsuario}
      />

      <main
        className={`contenidoPrincipal ${
          panelLateralAbierto ? "" : "contraido"
        }`}
      >
        <EncabezadoSuperior
          abrirPanel={() => setPanelLateralAbierto((v) => !v)}
          moduloActivo={moduloActivo}
          menuUsuarioAbierto={menuUsuarioAbierto}
          alternarMenuUsuario={() => setMenuUsuarioAbierto((v) => !v)}
          abrirPerfil={abrirPerfil}
          cerrarSesion={cerrarSesion}
          usuario={usuario}
        />

        <section className="areaModulo">{renderizarModulo()}</section>
      </main>
    </div>
  );
}