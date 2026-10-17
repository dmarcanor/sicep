import { useCallback, useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import "./css/HistorialSistema.css";
import { api } from "../src/api";
import { estilosTabla } from "../src/tablaEstilos";
import { formatearFecha, hoyISO } from "../src/formato";
import { useBusquedaDiferida } from "../src/hooks/useBusquedaDiferida";

const TODOS = "Todos";

function horaDe(valor) {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function nombreDe(usuario) {
  return usuario?.display_name || usuario?.name || usuario?.username || "Sistema";
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

function tonoDeAccion(accion = "") {
  if (accion.includes("Documento")) return "blue";
  if (accion.includes("Reporte")) return "purple";
  if (accion.includes("Configuración")) return "amber";
  if (accion.includes("Bitácora") || accion.includes("Actuación")) return "teal";
  return "green";
}

// Resumen corto para la tabla: "Estatus: Registrado → Aprobado".
function resumenCambios(cambios = []) {
  if (!cambios.length) return <span className="historial-sin-detalle">Sin detalle</span>;

  const visibles = cambios.slice(0, 2).map((c) => (
    <div key={c.id}>
      <strong>{c.campo}:</strong> {c.valor_anterior ?? "—"} → {c.valor_nuevo ?? "—"}
    </div>
  ));

  return (
    <>
      {visibles}
      {cambios.length > 2 && <small>y {cambios.length - 2} más</small>}
    </>
  );
}

// Campo por campo: qué valor tenía y cuál quedó. Sin esto el historial sólo
// decía que algo cambió.
function DetalleCambios({ data }) {
  const cambios = data.cambios ?? [];

  if (cambios.length === 0) {
    return (
      <div className="historial-sin-cambios">
        Sin detalle de cambios registrado para esta acción.
        {data.detalles ? <p>{data.detalles}</p> : null}
      </div>
    );
  }

  return (
    <table className="historial-cambios">
      <thead>
        <tr>
          <th>Campo</th>
          <th>Valor anterior</th>
          <th>Valor nuevo</th>
        </tr>
      </thead>
      <tbody>
        {cambios.map((cambio) => (
          <tr key={cambio.id}>
            <td><strong>{cambio.campo}</strong></td>
            <td>{cambio.valor_anterior ?? "—"}</td>
            <td>{cambio.valor_nuevo ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function HistorialSistema() {
  const [busqueda, setBusqueda] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState(TODOS);
  const [accionFiltro, setAccionFiltro] = useState(TODOS);
  const [estadoFiltro, setEstadoFiltro] = useState(TODOS);
  const [usuarioFiltro, setUsuarioFiltro] = useState(TODOS);

  const [registros, setRegistros] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);
  const [resumen, setResumen] = useState({ total: 0, exitosos: 0, errores: 0, pendientes: 0 });
  const [opciones, setOpciones] = useState({ modulos: [], acciones: [], estados: [], usuarios: [] });
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);

  const busquedaDiferida = useBusquedaDiferida(busqueda);

  const construirFiltros = useCallback(() => {
    const params = {};
    if (busquedaDiferida.trim()) params.search = busquedaDiferida.trim();
    if (moduloFiltro !== TODOS) params.modulo = moduloFiltro;
    if (accionFiltro !== TODOS) params.accion = accionFiltro;
    if (estadoFiltro !== TODOS) params.estado = estadoFiltro;
    if (usuarioFiltro !== TODOS) params.usuario_id = usuarioFiltro;
    return params;
  }, [busquedaDiferida, moduloFiltro, accionFiltro, estadoFiltro, usuarioFiltro]);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);

      const data = await api.getHistorial({ ...construirFiltros(), pagina, por_pagina: porPagina });

      setRegistros(data.datos ?? []);
      setTotal(data.total ?? 0);
      setResumen(data.resumen ?? { total: 0, exitosos: 0, errores: 0, pendientes: 0 });
      setOpciones(data.opciones ?? { modulos: [], acciones: [], estados: [], usuarios: [] });
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setCargando(false);
    }
  }, [pagina, porPagina, construirFiltros]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const exportar = async () => {
    try {
      setExportando(true);
      const blob = await api.exportarHistorial(construirFiltros());
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `historial-${hoyISO()}.csv`;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message || "No se pudo exportar el historial.");
    } finally {
      setExportando(false);
    }
  };

  const columnas = [
    { name: "ID", selector: (r) => r.id, width: "90px", cell: (r) => <strong>#{r.id}</strong> },
    { name: "Fecha", selector: (r) => formatearFecha(r.created_at), width: "120px" },
    { name: "Hora", selector: (r) => horaDe(r.created_at), width: "110px" },
    { name: "Usuario", selector: (r) => nombreDe(r.usuario), width: "170px", wrap: true },
    { name: "Acción", selector: (r) => r.accion, grow: 2, wrap: true },
    { name: "Módulo", selector: (r) => r.modulo, width: "140px", cell: (r) => <strong>{r.modulo}</strong> },
    {
      name: "Registro",
      selector: (r) => r.referencia ?? "",
      width: "200px",
      wrap: true,
      cell: (r) => (r.referencia ? (
        <Pill tone={tonoDeAccion(r.accion)}>{r.referencia}</Pill>
      ) : "—"),
    },
    {
      name: "Qué cambió",
      grow: 2,
      wrap: true,
      cell: (r) => resumenCambios(r.cambios),
    },
    {
      name: "Estado",
      width: "110px",
      cell: (r) => (
        <Pill tone={r.estado === "Exitoso" ? "green" : r.estado === "Error" ? "red" : "amber"}>
          {r.estado || "Exitoso"}
        </Pill>
      ),
    },
    { name: "Detalles", selector: (r) => r.detalles ?? "", grow: 3, wrap: true },
  ];

  const filtrar = (aplicar) => (valor) => {
    aplicar(valor);
    setPagina(1);
  };

  const selector = (valor, alCambiar, valores, etiqueta) => (
    <select className="datatable-select" value={valor} onChange={(e) => alCambiar(e.target.value)}>
      <option value={TODOS}>{etiqueta}</option>
      {valores.map((v) => (
        <option key={v} value={v}>{v}</option>
      ))}
    </select>
  );

  return (
    <div className="modulo historial-modulo">
      <div className="cabeceraModulo">
        <div>
          <span className="plantillas-etiqueta">Historial del Sistema</span>
          <p>Quién hizo cada acción, cuándo, desde qué equipo y qué cambió campo por campo.</p>
        </div>
        <button className="btn-secondary" onClick={exportar} disabled={exportando}>
          {exportando ? "Exportando..." : "Exportar CSV"}
        </button>
      </div>

      <div className="rejillaTarjetas historial-resumen">
        <MiniCard title="Total de eventos" value={resumen.total} subtitle="Coinciden con el filtro" tone="blue" />
        <MiniCard title="Exitosos" value={resumen.exitosos} subtitle="Operaciones completadas" tone="green" />
        <MiniCard title="Con error" value={resumen.errores} subtitle="Rechazadas por el sistema" tone="amber" />
        <MiniCard title="Pendientes" value={resumen.pendientes} subtitle="Por completar" tone="teal" />
      </div>

      <div className="datatable-toolbar">
        <div className="toolbar-center">
          <input
            className="datatable-input"
            value={busqueda}
            onChange={(e) => filtrar(setBusqueda)(e.target.value)}
            placeholder="Buscar por acción, módulo, detalle o usuario..."
          />

          {selector(moduloFiltro, filtrar(setModuloFiltro), opciones.modulos, "Todos los módulos")}
          {selector(accionFiltro, filtrar(setAccionFiltro), opciones.acciones, "Todas las acciones")}
          {selector(estadoFiltro, filtrar(setEstadoFiltro), opciones.estados, "Todos los estados")}

          <select
            className="datatable-select"
            value={usuarioFiltro}
            onChange={(e) => filtrar(setUsuarioFiltro)(e.target.value)}
          >
            <option value={TODOS}>Todos los usuarios</option>
            {opciones.usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.name || u.username}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        customStyles={estilosTabla}
        columns={columnas}
        data={registros}
        progressPending={cargando}
        pagination
        paginationServer
        paginationTotalRows={total}
        paginationDefaultPage={pagina}
        paginationPerPage={porPagina}
        paginationRowsPerPageOptions={[25, 50, 100]}
        onChangePage={setPagina}
        onChangeRowsPerPage={(nuevo, paginaActual) => {
          setPorPagina(nuevo);
          setPagina(paginaActual);
        }}
        expandableRows
        expandableRowsComponent={DetalleCambios}
        highlightOnHover
        noDataComponent="No existen registros para los filtros seleccionados."
      />
    </div>
  );
}
