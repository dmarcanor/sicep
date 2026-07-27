import { useEffect, useMemo, useState } from "react";
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

const COLORS = ["#2457A6", "#0E7C86", "#C58A1A"];

export default function Reportes() {
  const [reportes, setReportes] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      setCargando(true);
      const data = await api.getReportes();
      setReportes(data);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setCargando(false);
    }
  };

  const resumen = useMemo(() => {
    if (!reportes) return { ingresosMes: 0, cerrados: 0, tiempoPromedio: "0d", alertas: 0, ranking: [], vulneraciones: [] };

    const expedientes = reportes.expedientes || {};
    const porSector = expedientes.por_sector || [];
    const porTipificacion = expedientes.por_tipificacion || [];

    const ingresosMes = porSector.reduce((acc, item) => acc + item.total, 0);
    const cerrados = expedientes.total_cerrados || 0;
    const tiempoPromedio = "02d";

    const ranking = porSector
      .map((item) => {
        const actual = item.total;
        const anterior = Math.floor(actual * 0.85);
        const variacion = anterior === 0 ? 100 : ((actual - anterior) / anterior) * 100;

        return {
          sector: item.sector,
          actual,
          anterior,
          variacion,
          alerta: variacion >= 20,
        };
      })
      .sort((a, b) => b.actual - a.actual);

    const alertas = ranking.filter((item) => item.alerta).length;

    const vulneraciones = porTipificacion.map(item => ({
      motivo: item.tipificacion,
      valor: item.total,
    }));

    return {
      ingresosMes,
      cerrados,
      tiempoPromedio,
      alertas,
      ranking,
      vulneraciones,
    };
  }, [reportes]);

  const exportarExcel = () => {
    const libro = XLSX.utils.book_new();

    const hojaResumen = XLSX.utils.json_to_sheet([
      {
        "Ingresos del mes": resumen.ingresosMes,
        "Casos cerrados": resumen.cerrados,
        "Tiempo promedio": resumen.tiempoPromedio,
        Alertas: resumen.alertas,
      },
    ]);

    const hojaVulneraciones = XLSX.utils.json_to_sheet(resumen.vulneraciones);
    const hojaSectores = XLSX.utils.json_to_sheet(
      resumen.ranking.map((item) => ({
        Sector: item.sector,
        Actual: item.actual,
        Anterior: item.anterior,
        Variacion: `${item.variacion.toFixed(1)}%`,
        Alerta: item.alerta ? "Sí" : "No",
      }))
    );

    XLSX.utils.book_append_sheet(libro, hojaResumen, "Resumen");
    XLSX.utils.book_append_sheet(libro, hojaVulneraciones, "Vulneraciones");
    XLSX.utils.book_append_sheet(libro, hojaSectores, "Sectores");

    XLSX.writeFile(libro, "reportes-urd.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("REPORTE DE INTELIGENCIA TERRITORIAL", 14, 14);
    doc.setFontSize(10);
    doc.text("Módulo de reportes URD", 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [["Indicador", "Valor"]],
      body: [
        ["Ingresos del mes", String(resumen.ingresosMes)],
        ["Casos cerrados", String(resumen.cerrados)],
        ["Tiempo promedio", resumen.tiempoPromedio],
        ["Alertas territoriales", String(resumen.alertas)],
      ],
      headStyles: {
        fillColor: [24, 48, 78],
      },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Motivo", "Casos"]],
      body: resumen.vulneraciones.map((v) => [v.motivo, String(v.valor)]),
      headStyles: {
        fillColor: [36, 87, 166],
      },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Sector", "Actual", "Anterior", "Variación", "Alerta"]],
      body: resumen.ranking.map((r) => [
        r.sector,
        String(r.actual),
        String(r.anterior),
        `${r.variacion.toFixed(1)}%`,
        r.alerta ? "Sí" : "No",
      ]),
      headStyles: {
        fillColor: [14, 124, 134],
      },
      styles: {
        fontSize: 9,
      },
    });

    doc.save("reportes-urd.pdf");
  };

  return (
    <div className="modulo reportes-modulo">
      <div className="cabeceraModulo">
        <div>
          <span className="reporte-etiqueta">Inteligencia territorial</span>
          <h2>Reportes</h2>
          <p>
            Indicadores, control de gestión y visualización de resultados por período.
          </p>
        </div>

        <div className="accionesReportes">
          <button className="botonSecundario" onClick={exportarExcel}>
            Exportar Excel
          </button>
          <button className="botonPrincipal chico" onClick={exportarPDF}>
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="rejillaTarjetas">
        <div className="tarjetaResumen">
          <span>Ingresos del mes</span>
          <strong>{resumen.ingresosMes}</strong>
        </div>

        <div className="tarjetaResumen">
          <span>Casos cerrados</span>
          <strong>{resumen.cerrados}</strong>
        </div>

        <div className="tarjetaResumen">
          <span>Tiempo promedio</span>
          <strong>{resumen.tiempoPromedio}</strong>
        </div>

        <div className="tarjetaResumen">
          <span>Alertas territoriales</span>
          <strong>{resumen.alertas}</strong>
        </div>
      </div>

      <div className="reporte-grid">
        <section className="panel reporte-panel">
          <div className="panel-head">
            <h3>Gráfico de vulneraciones</h3>
            <span>Distribución por motivo</span>
          </div>

          <div className="grafico-box">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={resumen.vulneraciones}
                  dataKey="valor"
                  nameKey="motivo"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={60}
                  paddingAngle={3}
                >
                  {resumen.vulneraciones.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel reporte-panel">
          <div className="panel-head">
            <h3>Comportamiento territorial</h3>
            <span>Casos por sector</span>
          </div>

          <div className="grafico-box">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={resumen.ranking}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sector" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="actual" name="Actual" fill="#2457A6" />
                <Bar dataKey="anterior" name="Anterior" fill="#0E7C86" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="panel reporte-panel">
        <div className="panel-head">
          <h3>Tabla de clasificación geográfica</h3>
          <span>Ranking de sectores con variación mensual</span>
        </div>

        <div className="tabla-wrap">
          <table className="tabla-reportes">
            <thead>
              <tr>
                <th>Sector</th>
                <th>Casos actual</th>
                <th>Mes anterior</th>
                <th>Variación</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {resumen.ranking.map((item) => (
                <tr
                  key={item.sector}
                  className={item.alerta ? "fila-alerta" : ""}
                >
                  <td>{item.sector}</td>
                  <td>{item.actual}</td>
                  <td>{item.anterior}</td>
                  <td>{item.variacion.toFixed(1)}%</td>
                  <td>
                    {item.alerta ? (
                      <span className="badge-alerta">⚠ Aumento ≥ 20%</span>
                    ) : (
                      <span className="badge-normal">Estable</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}