import { useEffect, useMemo, useState } from "react";
import "./css/HistorialSistema.css";
import { api } from "../src/api";

function formatearFecha(fecha) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-VE");
}

function formatearHora(fecha) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-VE", { hour: '2-digit', minute: '2-digit' });
}

function Pill({ children, tone = "default" }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function MiniCard({ title, value, subtitle, tone }) {
  return (
    <article className={`tarjetaResumen historial-card-summary ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </article>
  );
}

export default function HistorialSistema() {
  const [busqueda, setBusqueda] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("Todos");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setCargando(true);
      const data = await api.getHistorial();
      setHistorial(data);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setCargando(false);
    }
  };

  const registros = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    return historial.filter((item) => {
      const coincideTexto =
        !q ||
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(q);

      const coincideModulo =
        moduloFiltro === "Todos"
          ? true
          : item.modulo === moduloFiltro;

      const coincideTipo =
        tipoFiltro === "Todos"
          ? true
          : item.accion === tipoFiltro;

      return coincideTexto && coincideModulo && coincideTipo;
    });
  }, [busqueda, moduloFiltro, tipoFiltro, historial]);

  const resumen = useMemo(() => {
    return {
      total: historial.length,
      exitosos: historial.length,
      observaciones: 0,
      pendientes: 0,
    };
  }, [historial]);

  const modulos = ["Todos", ...new Set(historial.map((i) => i.modulo))];
  const tipos = ["Todos", ...new Set(historial.map((i) => i.accion))];

  return (
    <div className="modulo historial-modulo">
      <div className="cabeceraModulo">
        <div>
          <span className="plantillas-etiqueta">
          Historial del Sistema
          </span>

      

  
        </div>

{/*         <button className="botonSecundario">
          Exportar registro
        </button> */}
      </div>

      <div className="rejillaTarjetas historial-resumen">
        <MiniCard
          title="Total de eventos"
          value={resumen.total}
          subtitle="Acciones registradas"
          tone="blue"
        />

        <MiniCard
          title="Exitosos"
          value={resumen.exitosos}
          subtitle="Operaciones completadas"
          tone="green"
        />

        <MiniCard
          title="Observaciones"
          value={resumen.observaciones}
          subtitle="Requieren revisión"
          tone="amber"
        />

        <MiniCard
          title="Pendientes"
          value={resumen.pendientes}
          subtitle="Por completar"
          tone="teal"
        />
      </div>

      <div className="datatable-toolbar">
        <div className="toolbar-left">
          <span className="datatable-info">
            Mostrando <b>{registros.length}</b> registros
          </span>
        </div>

        <div className="toolbar-center">
          <input
            className="datatable-input"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar..."
          />

          <select
            className="datatable-select"
            value={moduloFiltro}
            onChange={(e) => setModuloFiltro(e.target.value)}
          >
            {modulos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            className="datatable-select"
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
          >
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-right">
{/*           <button className="btn-export">
            🗂️ PDF
          </button> */}
        </div>
      </div>

      <div className="panel">


  <div className="tablaContenedor">
    <table className="tablaDatos">
      <thead>
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Hora</th>
          <th>Módulo</th>
          <th>Acción</th>
          <th>Usuario</th>
          <th>Tipo</th>
          <th>Estado</th>
        </tr>
      </thead>

      <tbody>
        {registros.length === 0 ? (
          <tr>
            <td colSpan="8" className="sinRegistros">
              No existen registros para los filtros seleccionados.
            </td>
          </tr>
        ) : (
          registros.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>#{item.id}</strong>
              </td>

              <td>{formatearFecha(item.created_at)}</td>

              <td>{formatearHora(item.created_at)}</td>

              <td>
                <strong>{item.modulo}</strong>
              </td>

              <td
                style={{
                  minWidth: "350px",
                  maxWidth: "500px",
                }}
              >
                {item.accion}
              </td>

              <td>{item.usuario?.username || 'Sistema'}</td>

              <td>
                <Pill
                  tone={
                    item.accion.includes("Documento")
                      ? "blue"
                      : item.accion.includes("Reporte")
                      ? "purple"
                      : item.accion.includes("Configuración")
                      ? "amber"
                      : item.accion.includes("Bitácora")
                      ? "teal"
                      : "green"
                  }
                >
                  {item.registro_tipo || 'Acción'}
                </Pill>
              </td>

              <td>
                <Pill
                  tone={
                    item.estado === "Exitoso"
                      ? "green"
                      : item.estado === "Error"
                      ? "red"
                      : "amber"
                  }
                >
                  {item.estado || 'Exitoso'}
                </Pill>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
      borderTop: "1px solid rgba(148,163,184,.15)",
    }}
  >
    <span
      style={{
        fontSize: "13px",
        color: "#94a3b8",
      }}
    >
      Mostrando {registros.length} de {historial.length} registros
    </span>

    <div
      style={{
        display: "flex",
        gap: "8px",
      }}
    >
    
    </div>
  </div>
</div>
    </div>
  );
}