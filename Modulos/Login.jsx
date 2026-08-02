import { useState } from "react";

import Perfil from "./Perfil";
import Usuarios from "./Usuarios";
import RecepcionURD from "./RecepcionURD";
import Expedientes from "./Expedientes";
import Reportes from "./Reportes";
import Configuracion from "./Configuracion";
import PanelPrincipal from "./PanelPrincipal";
import Plantillas from "./Plantillas";
import HistorialSistema from "./HistorialSistema";

import "../src/App.css";


const usuariosValidos = [
  { usuario: "admin", clave: "1234", rol: "admin" },
  { usuario: "urc", clave: "urc2026", rol: "operador" },
];



const MODULOS = {
  principal: PanelPrincipal,
  urd: RecepcionURD,
  expedientes: Expedientes,
  usuarios: Usuarios,
  reportes: Reportes,
  plantillas: Plantillas,
  historial: HistorialSistema,
  configuracion: Configuracion,
};


export default function SistemaInstitucional() {
  const [usuario, setUsuario] = useState(null);

  const [loginData, setLoginData] = useState({
    user: "",
    pass: "",
  });

  const [panelLateralAbierto, setPanelLateralAbierto] = useState(true);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [moduloActivo, setModuloActivo] = useState("urd");
  const [verPerfil, setVerPerfil] = useState(false);


  if (!usuario) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>SICEP - NNA</h2>

          <input
            placeholder="Usuario"
            onChange={(e) =>
              setLoginData({ ...loginData, user: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Clave"
            onChange={(e) =>
              setLoginData({ ...loginData, pass: e.target.value })
            }
          />

          <button
            onClick={() => {
              const found = usuariosValidos.find(
                (u) =>
                  u.usuario === loginData.user &&
                  u.clave === loginData.pass
              );

              if (found) {
                setUsuario(found);
                setModuloActivo("principal");
              } else {
                alert("Credenciales incorrectas");
              }
            }}
          >
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  const cambiarModulo = (m) => {
    setModuloActivo(m);
    setVerPerfil(false);
    setMenuUsuarioAbierto(false);
  };

  const abrirPerfil = () => {
    setVerPerfil(true);
    setMenuUsuarioAbierto(false);
  };


  const renderizarModulo = () => {
    if (verPerfil) {
      return (
        <Perfil
          usuarioBase={{
            nombre: "Usuario",
            apellido: "Sistema",
            correo: "admin@sicep.com",
            telefono: "0000000000",
            cargo: usuario.rol,
          }}
        />
      );
    }

    const Componente = MODULOS[moduloActivo] || PanelPrincipal;

    if (moduloActivo === "expedientes") {
      return <Componente />;
    }

    if (moduloActivo === "urd") {
      return <Componente irAModulo={cambiarModulo} />;
    }

    if (moduloActivo === "principal") {
      return <Componente irAModulo={cambiarModulo} />;
    }

    return <Componente />;
  };


  return (
    <div className="envolturaAplicacion">
      
      <aside className={`sidebar ${panelLateralAbierto ? "" : "collapsed"}`}>
        <div className="brand">
          <img
            src={logoSicep}
            alt="Logo SICEP-NNA"
            className="brand-logo"
          />
        </div>

        <nav className="nav">
          {Object.keys(MODULOS).map((key) => (
            <button
              key={key}
              className={`nav-item ${
                moduloActivo === key ? "active" : ""
              }`}
              onClick={() => cambiarModulo(key)}
            >
              <span className="nav-ico">📁</span>
              <span className="nav-txt">{key.toUpperCase()}</span>
            </button>
          ))}
        </nav>
      </aside>

      
      <main
        className={`contenidoPrincipal ${
          panelLateralAbierto ? "" : "contraido"
        }`}
      >
        
        <header className="header">
          <button
            className="icon-btn"
            onClick={() => setPanelLateralAbierto((v) => !v)}
          >
            ☰
          </button>

          <div className="title-block">
            <div className="system-name">SICEP-NNA</div>
            <div className="module-name">{moduloActivo}</div>
          </div>

          <div className="header-right">
            <div className="user-menu-wrap">
              <button
                className="user-btn"
                onClick={() => setMenuUsuarioAbierto((v) => !v)}
              >
                👤
              </button>

              {menuUsuarioAbierto && (
                <div className="user-menu">
                  <button onClick={abrirPerfil}>Perfil</button>
                  <button onClick={() => setUsuario(null)}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        
        <section className="areaModulo">{renderizarModulo()}</section>
      </main>
    </div>
  );
}