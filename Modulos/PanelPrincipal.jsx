import { useEffect, useMemo, useState } from "react";
import StatCard from "../componentes/StatCard";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./css/PanelPrincipal.css";
import { api } from "../src/api";

import AsignacionCasos from "./AsignacionCasos";


const calcularDias = (fechaStr) => {
  const hoy = new Date();
  const fecha = new Date(fechaStr);
  return Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
};


const BadgeDias = ({ dias }) => {
  if (dias < 20) {
    return <span className="badge verde">🟢 {dias} días</span>;
  }

  if (dias >= 21 && dias <= 24) {
    return <span className="badge amarillo">🟡 {dias} días</span>;
  }

  return <span className="badge rojo parpadeo">🔴 {dias} días</span>;
};

export default function PanelPrincipal() {
  const [tipoActivo, setTipoActivo] = useState("registrados");
  const [busqueda, setBusqueda] = useState("");
  const [fichaAbierta, setFichaAbierta] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const data = await api.getExpedientes();
      setExpedientes(data);
    } catch (error) {
      console.error('Error cargando expedientes:', error);
    } finally {
      setCargando(false);
    }
  };

  const datosBase = useMemo(() => {
    const mapeo = {
      registrados: expedientes.filter(e => e.estatus === 'Registrado'),
      revision: expedientes.filter(e => e.estatus === 'En revisión'),
      aprobados: expedientes.filter(e => e.estatus === 'Aprobado'),
      observados: expedientes.filter(e => e.estatus === 'Observado'),
    };

    if (tipoActivo === "todos") {
      return expedientes;
    }

    return mapeo[tipoActivo] || [];
  }, [tipoActivo, expedientes]);

  
  const datosConDias = useMemo(() => {
    return datosBase.map((item) => ({
      ...item,
      dias: calcularDias(item.fecha),
    }));
  }, [datosBase]);

  const datosFiltrados = useMemo(() => {
    return datosConDias.filter((item) =>
      Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  }, [busqueda, datosConDias]);

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(datosFiltrados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registros");
    XLSX.writeFile(wb, `${tipoActivo}-URD.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text(`REPORTE URD - ${tipoActivo.toUpperCase()}`, 14, 10);

    autoTable(doc, {
      head: [["Código", "Nombre", "Representante", "Estado", "Fecha", "Sector", "Días"]],
      body: datosFiltrados.map((d) => [
        d.codigo,
        d.nino,
        d.representante,
        d.estatus,
        d.fecha,
        d.sector,
        d.dias,
      ]),
    });

    doc.save(`${tipoActivo}-URD.pdf`);
  };

  const columnas = [
    { name: "Código", selector: (r) => r.codigo, sortable: true },
    { name: "Nombre", selector: (r) => r.nino, sortable: true },
    { name: "Representante", selector: (r) => r.representante },
    { name: "Estado", selector: (r) => r.estatus, sortable: true },
    { name: "Fecha", selector: (r) => r.fecha, sortable: true },

    
    {
      name: "Días",
      selector: (r) => r.dias,
      sortable: true,
      cell: (row) => <BadgeDias dias={row.dias} />,
    },
  ];

  const conteo = useMemo(
    () => ({
      totalGeneral: expedientes.length,
      registrados: expedientes.filter(e => e.estatus === 'Registrado').length,
      revision: expedientes.filter(e => e.estatus === 'En revisión').length,
      aprobados: expedientes.filter(e => e.estatus === 'Aprobado').length,
      observados: expedientes.filter(e => e.estatus === 'Observado').length,
      filtrados: datosFiltrados.length,
    }),
    [expedientes, datosFiltrados]
  );

  return (
    <div className="panel-principal">

      
      <section className="stats-grid">

        <div onClick={() => setTipoActivo("todos")}>
          <StatCard titulo="Total General" valor={conteo.totalGeneral} tono="purple" />
        </div>

        <div onClick={() => setTipoActivo("registrados")}>
          <StatCard titulo="Registrados" valor={conteo.registrados} tono="blue" />
        </div>

        <div onClick={() => setTipoActivo("revision")}>
          <StatCard titulo="En Revisión" valor={conteo.revision} tono="teal" />
        </div>

        <div onClick={() => setTipoActivo("aprobados")}>
          <StatCard titulo="Aprobados" valor={conteo.aprobados} tono="green" />
        </div>

        <div onClick={() => setTipoActivo("observados")}>
          <StatCard titulo="Observados" valor={conteo.observados} tono="amber" />
        </div>

      </section>

      
      <div className="datatable-toolbar">

        <div className="toolbar-left">
          <span className="datatable-info">
            Mostrando <b>{conteo.filtrados}</b> registros
          </span>
        </div>

        <div className="toolbar-center">
          <input
            className="datatable-input"
            placeholder="Buscar expediente, representante, sector o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="toolbar-right">
          <button className="btn-export" onClick={exportarExcel}>📊 Excel</button>
          <button className="btn-export" onClick={exportarPDF}>🧾 PDF</button>
        </div>

      </div>

      
      <DataTable
        columns={columnas}
        data={datosFiltrados}
        pagination
        responsive
        dense
        striped
        highlightOnHover
        pointerOnHover
        paginationPerPage={10}
        paginationRowsPerPageOptions={[10, 20, 50, 100]}
        onRowClicked={(row) => setFichaAbierta(row)}
      />

      
      {fichaAbierta && (
        <div className="modal-overlay" onClick={() => setFichaAbierta(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📁 Ficha de Expediente</h3>

            <p><b>Código:</b> {fichaAbierta.codigo}</p>
            <p><b>Nombre:</b> {fichaAbierta.nino}</p>
            <p><b>Representante:</b> {fichaAbierta.representante}</p>
            <p><b>Estado:</b> {fichaAbierta.estatus}</p>
            <p><b>Fecha:</b> {fichaAbierta.fecha}</p>
            <p><b>Sector:</b> {fichaAbierta.sector}</p>
            <p><b>Días:</b> {fichaAbierta.dias}</p>
          </div>
        </div>
      )}

    </div>
  );
}