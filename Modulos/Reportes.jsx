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
import { formatearFecha, hoyISO } from "../src/formato";

// Una por tipificación: con tres se repetían y dos motivos distintos salían
// del mismo color.
const COLORS = [
  "#2457A6", "#0E7C86", "#C58A1A", "#8E44AD", "#C0392B",
  "#16A085", "#D35400", "#2C3E50", "#7F8C8D",
];

const primerDiaDelMes = () => `${hoyISO().slice(0, 7)}-01`;

const VACIO = {
  periodo: { desde: "", hasta: "", dias: 0 },
  expedientes: { total: 0, total_cerrados: 0, por_tipificacion: [], por_estatus: [], por_prioridad: [], por_sector: [] },
  resolucion: { expedientes_cerrados: 0, dias_promedio: null },
  casos: { total: 0, por_estatus: [] },
  solicitudes: { total: 0, por_estatus: [] },
};

export default function Reportes() {
  const [desde, setDesde] = useState(primerDiaDelMes);
  const [hasta, setHasta] = useState(hoyISO);
  const [datos, setDatos] = useState(VACIO);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setDatos(await api.getReportes({ desde, hasta }));
    } catch (error) {
      console.error("Error cargando reportes:", error);
    } finally {
      setCargando(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const { expedientes, resolucion, periodo, casos, solicitudes } = datos;

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

    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet([{
      "Desde": periodo.desde,
      "Hasta": periodo.hasta,
      "Expedientes del período": expedientes.total,
      "Cerrados en el período": expedientes.total_cerrados,
      "Tiempo promedio de resolución": textoPromedio,
      "Expedientes en la media": resolucion.expedientes_cerrados,
    }]), "Resumen");

    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(vulneraciones), "Vulneraciones");
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(
      sectores.map((s) => ({ Sector: s.sector, Casos: s.total })),
    ), "Sectores");

    XLSX.writeFile(libro, `reportes-${periodo.desde}_${periodo.hasta}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("REPORTE DE GESTIÓN", 14, 14);
    doc.setFontSize(10);
    doc.text(`Período: ${formatearFecha(periodo.desde)} a ${formatearFecha(periodo.hasta)}`, 14, 20);

    autoTable(doc, {
      startY: 28,
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

    doc.save(`reportes-${periodo.desde}_${periodo.hasta}.pdf`);
  };

  return (
    <div className="modulo reportes-modulo">
      <div className="cabeceraModulo">
        <div>
          <span className="reporte-etiqueta">Inteligencia territorial</span>
          <h2>Reportes</h2>
          <p>Indicadores calculados sobre el período seleccionado.</p>
        </div>

        <div className="accionesReportes">
          <button className="botonSecundario" onClick={exportarExcel}>Exportar Excel</button>
          <button className="botonPrincipal chico" onClick={exportarPDF}>Exportar PDF</button>
        </div>
      </div>

      <div className="datatable-toolbar reporte-periodo">
        <label>
          Desde
          <input type="date" className="datatable-input" value={desde} max={hasta}
                 onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" className="datatable-input" value={hasta} min={desde} max={hoyISO()}
                 onChange={(e) => setHasta(e.target.value)} />
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
