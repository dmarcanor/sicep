import { useCallback, useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import "./css/HistorialSistema.css";
import { api } from "../src/api";
import { estilosTabla } from "../src/tablaEstilos";
import { formatearFecha } from "../src/formato";
import { useBusquedaDiferida } from "../src/hooks/useBusquedaDiferida";

const TODOS = "Todos";

function horaDe(valor) {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
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

export default function HistorialSistema() {
  const [busqueda, setBusqueda] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState(TODOS);
  const [accionFiltro, setAccionFiltro] = useState(TODOS);
  const [estadoFiltro, setEstadoFiltro] = useState(TODOS);

  const [registros, setRegistros] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);
  const [resumen, setResumen] = useState({ total: 0, exitosos: 0, errores: 0, pendientes: 0 });
  const [opciones, setOpciones] = useState({ modulos: [], acciones: [], estados: [] });
  const [cargando, setCargando] = useState(true);

  const busquedaDiferida = useBusquedaDiferida(busqueda);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);

      const params = { pagina, por_pagina: porPagina };
      if (busquedaDiferida.trim()) params.search = busquedaDiferida.trim();
      if (moduloFiltro !== TODOS) params.modulo = moduloFiltro;
      if (accionFiltro !== TODOS) params.accion = accionFiltro;
      if (estadoFiltro !== TODOS) params.estado = estadoFiltro;

      const data = await api.getHistorial(params);

      setRegistros(data.datos ?? []);
      setTotal(data.total ?? 0);
      setResumen(data.resumen ?? { total: 0, exitosos: 0, errores: 0, pendientes: 0 });
      setOpciones(data.opciones ?? { modulos: [], acciones: [], estados: [] });
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setCargando(false);
    }
  }, [pagina, porPagina, busquedaDiferida, moduloFiltro, accionFiltro, estadoFiltro]);

  useEffect(() => {
    cargar();
  }, [cargar]);


  const columnas = [
    { name: "ID", selector: (r) => r.id, width: "90px", cell: (r) => <strong>#{r.id}</strong> },
    { name: "Fecha", selector: (r) => formatearFecha(r.created_at), width: "120px" },
    { name: "Hora", selector: (r) => horaDe(r.created_at), width: "90px" },
    { name: "Módulo", selector: (r) => r.modulo, width: "150px", cell: (r) => <strong>{r.modulo}</strong> },
    { name: "Acción", selector: (r) => r.accion, grow: 2, wrap: true },
    { name: "Usuario", selector: (r) => r.usuario?.username || "Sistema", width: "140px" },
    {
      name: "Tipo",
      width: "150px",
      cell: (r) => <Pill tone={tonoDeAccion(r.accion)}>{r.registro_tipo || "Acción"}</Pill>,
    },
    {
      name: "Estado",
      width: "120px",
      cell: (r) => (
        <Pill tone={r.estado === "Exitoso" ? "green" : r.estado === "Error" ? "red" : "amber"}>
          {r.estado || "Exitoso"}
        </Pill>
      ),
    },
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
          <p>Registro de todas las acciones realizadas en el sistema.</p>
        </div>
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
        highlightOnHover
        noDataComponent="No existen registros para los filtros seleccionados."
      />
    </div>
  );
}
