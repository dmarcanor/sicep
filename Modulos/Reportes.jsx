import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./css/Reportes.css";
import { api } from "../src/api";
import { membretePDF, pieDePaginaPDF, hojaConMembrete } from "../src/exportar";
import { formatearFecha, hoyISO } from "../src/formato";

// Una por tipificación: con tres se repetían y dos motivos distintos salían
// del mismo color.
const COLORS = [
  "#2457A6", "#0E7C86", "#C58A1A", "#8E44AD", "#C0392B",
  "#16A085", "#D35400", "#2C3E50", "#7F8C8D",
];

const primerDiaDelMes = () => `${hoyISO().slice(0, 7)}-01`;

// Se cuenta en UTC a partir del día local ya resuelto por hoyISO: restar sobre
// una fecha local y volver a serializar corre el día en husos al este.
const restarDias = (n) => {
  const d = new Date(`${hoyISO()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

/**
 * Atajos de período. El consejo no razona en fechas sueltas sino en cortes
 * ("lo del día", "la quincena"), así que se ofrecen hechos y el rango libre
 * queda para lo que no encaje en ninguno.
 */
const PRESETS = {
  diario: { etiqueta: "Diario", rango: () => [hoyISO(), hoyISO()] },
  semanal: { etiqueta: "Semanal", rango: () => [restarDias(6), hoyISO()] },
  quincenal: { etiqueta: "Quincenal", rango: () => [restarDias(14), hoyISO()] },
  mensual: { etiqueta: "Mensual", rango: () => [primerDiaDelMes(), hoyISO()] },
};

const VACIO = {
  periodo: { desde: "", hasta: "", dias: 0 },
  filtros: { tipificacion: null, sector: null, tipificaciones: [], sectores: [] },
  expedientes: { total: 0, total_cerrados: 0, por_tipificacion: [], por_estatus: [], por_prioridad: [], por_sector: [] },
  resolucion: { expedientes_cerrados: 0, dias_promedio: null },
  casos: { total: 0, por_estatus: [] },
  solicitudes: { total: 0, por_estatus: [] },
};

export default function Reportes() {
  const [desde, setDesde] = useState(primerDiaDelMes);
  const [hasta, setHasta] = useState(hoyISO);
  const [preset, setPreset] = useState("mensual");
  const [tipificacion, setTipificacion] = useState("");
  const [sector, setSector] = useState("");
  const [datos, setDatos] = useState(VACIO);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      // Sobre la forma vacía, no en su lugar: si la API contesta sin alguna
      // sección, el módulo debe salir incompleto, no en blanco.
      setDatos({ ...VACIO, ...(await api.getReportes({ desde, hasta, tipificacion, sector })) });
    } catch (error) {
      console.error("Error cargando reportes:", error);
    } finally {
      setCargando(false);
    }
  }, [desde, hasta, tipificacion, sector]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const aplicarPreset = (clave) => {
    setPreset(clave);
    if (PRESETS[clave]) {
      const [d, h] = PRESETS[clave].rango();
      setDesde(d);
      setHasta(h);
    }
  };

  // Mover una fecha a mano deja de ser un atajo: el selector lo refleja.
  const fijarFecha = (setter) => (valor) => {
    setter(valor);
    setPreset("personalizado");
  };

  const { expedientes, resolucion, periodo, casos, solicitudes, filtros } = datos;

  const alcance = [
    tipificacion ? `Vulneración: ${tipificacion}` : null,
    sector ? `Sector: ${sector}` : null,
  ].filter(Boolean).join(" · ") || "Todas las vulneraciones y sectores";

  const vulneraciones = (expedientes.por_tipificacion || []).map((i) => ({
    motivo: i.tipificacion,
    valor: i.total,
  }));

  const promedio = resolucion.dias_promedio;
  const textoPromedio = promedio === null ? "Sin datos" : `${promedio} d`;

  const sectores = (expedientes.por_sector || []).map((s) => ({
    sector: s.sector,
    total: s.total,
  }));

  const exportarExcel = () => {
    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(libro, hojaConMembrete([{
      "Desde": periodo.desde,
      "Hasta": periodo.hasta,
      "Alcance": alcance,
      "Expedientes del período": expedientes.total,
      "Cerrados en el período": expedientes.total_cerrados,
      "Tiempo promedio de resolución": textoPromedio,
      "Expedientes en la media": resolucion.expedientes_cerrados,
    }], "REPORTE DE GESTIÓN"), "Resumen");

    XLSX.utils.book_append_sheet(libro, hojaConMembrete(vulneraciones, "VULNERACIONES POR MOTIVO"), "Vulneraciones");
    XLSX.utils.book_append_sheet(libro, hojaConMembrete(
      sectores.map((s) => ({ Sector: s.sector, Casos: s.total })), "EXPEDIENTES POR SECTOR",
    ), "Sectores");

    XLSX.writeFile(libro, `reportes-${periodo.desde}_${periodo.hasta}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();

    const inicioY = membretePDF(
      doc,
      "REPORTE DE GESTIÓN",
      `Período: ${formatearFecha(periodo.desde)} a ${formatearFecha(periodo.hasta)} · ${alcance}`,
    );

    autoTable(doc, {
      startY: inicioY,
      head: [["Indicador", "Valor"]],
      body: [
        ["Expedientes del período", String(expedientes.total)],
        ["Cerrados en el período", String(expedientes.total_cerrados)],
        ["Tiempo promedio de resolución", textoPromedio],
        ["Expedientes considerados en la media", String(resolucion.expedientes_cerrados)],
      ],
      headStyles: { fillColor: [24, 48, 78] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Motivo", "Casos"]],
      body: vulneraciones.map((v) => [v.motivo, String(v.valor)]),
      headStyles: { fillColor: [36, 87, 166] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Sector", "Casos"]],
      body: sectores.map((s) => [s.sector, String(s.total)]),
      headStyles: { fillColor: [14, 124, 134] },
      styles: { fontSize: 9 },
    });

    pieDePaginaPDF(doc);
    doc.save(`reportes-${periodo.desde}_${periodo.hasta}.pdf`);
  };

  return (
    <div className="modulo reportes-modulo">
      <div className="cabeceraModulo">
        <div>
          <span className="reporte-etiqueta">Inteligencia territorial</span>
          <h2>Reportes</h2>
          <p>Indicadores calculados sobre el período y el alcance seleccionados.</p>
          <p className="reporte-alcance">{alcance}</p>
        </div>

        <div className="accionesReportes">
          <button className="botonSecundario" onClick={exportarExcel}>Exportar Excel</button>
          <button className="botonPrincipal chico" onClick={exportarPDF}>Exportar PDF</button>
        </div>
      </div>

      <div className="datatable-toolbar reporte-periodo">
        <label>
          Período
          <select className="datatable-select" value={preset}
                  onChange={(e) => aplicarPreset(e.target.value)}>
            {Object.entries(PRESETS).map(([clave, p]) => (
              <option key={clave} value={clave}>{p.etiqueta}</option>
            ))}
            <option value="personalizado">Personalizado</option>
          </select>
        </label>

        <label>
          Desde
          <input type="date" className="datatable-input" value={desde} max={hasta}
                 onChange={(e) => fijarFecha(setDesde)(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" className="datatable-input" value={hasta} min={desde} max={hoyISO()}
                 onChange={(e) => fijarFecha(setHasta)(e.target.value)} />
        </label>

        <label>
          Vulneración
          <select className="datatable-select" value={tipificacion}
                  onChange={(e) => setTipificacion(e.target.value)}>
            <option value="">Todas</option>
            {(filtros.tipificaciones || []).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label>
          Sector
          <select className="datatable-select" value={sector}
                  onChange={(e) => setSector(e.target.value)}>
            <option value="">Todos</option>
            {(filtros.sectores || []).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <span className="datatable-info">
          {periodo.dias} día(s){cargando ? " · cargando…" : ""}
        </span>
      </div>

      <div className="rejillaTarjetas">
        <div className="tarjetaResumen">
          <span>Expedientes del período</span>
          <strong>{expedientes.total}</strong>
        </div>

        <div className="tarjetaResumen">
          <span>Cerrados en el período</span>
          <strong>{expedientes.total_cerrados}</strong>
        </div>

        <div className="tarjetaResumen">
          <span>Tiempo promedio de resolución</span>
          <strong>{textoPromedio}</strong>
          <small>{resolucion.expedientes_cerrados} expediente(s) en la media</small>
        </div>

        <div className="tarjetaResumen">
          <span>Casos asignados</span>
          <strong>{casos.total}</strong>
        </div>

        <div className="tarjetaResumen">
          <span>Solicitudes de archivo</span>
          <strong>{solicitudes.total}</strong>
        </div>
      </div>

      <div className="reporte-grid">
        <section className="panel reporte-panel">
          <div className="panel-head">
            <h3>Gráfico de vulneraciones</h3>
            <span>Distribución por motivo</span>
          </div>

          <div className="grafico-box">
            {vulneraciones.length === 0 ? (
              <p className="reporte-vacio">Sin expedientes tipificados en este período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={vulneraciones} dataKey="valor" nameKey="motivo"
                       cx="50%" cy="50%" outerRadius={110} innerRadius={60} paddingAngle={3}>
                    {vulneraciones.map((entry, index) => (
                      <Cell key={entry.motivo} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="panel reporte-panel">
          <div className="panel-head">
            <h3>Comportamiento territorial</h3>
            <span>Expedientes por sector</span>
          </div>

          <div className="grafico-box">
            {sectores.length === 0 ? (
              <p className="reporte-vacio">Sin expedientes en este período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={sectores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" name="Expedientes" fill="#2457A6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

    </div>
  );
}
