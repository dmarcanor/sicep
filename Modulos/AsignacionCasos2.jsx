import React, { useMemo, useState } from "react";

/* =======================
   CONSEJEROS
======================= */
const CONSEJEROS = [
  {
    id: 1,
    nombre: "Consejera Ana Pérez",
    despacho: "Consejería I",
    fuerte: "Civil / Familiar",
    especialidades: ["civil", "familiar"],
  },
  {
    id: 2,
    nombre: "Consejero Luis Gómez",
    despacho: "Consejería II",
    fuerte: "Maltrato / Integridad Física",
    especialidades: ["maltrato", "integridad", "fisica"],
  },
  {
    id: 3,
    nombre: "Consejera María Rodríguez",
    despacho: "Consejería III",
    fuerte: "Educación / Colectivo",
    especialidades: ["educacion", "colectiva"],
  },
];

/* =======================
   CASOS
======================= */
const CASOS = [
  {
    id: 1,
    codigo: "URD-001",
    nombres: "Valeria Hernández",
    sector: "La Florida",
    vulneracion: "Maltrato",
    prioridad: "Alta",
    asignacion: "Rotativa",
    asignadoA: "Consejero Luis Gómez",
    despacho: "Consejería II",
    fecha: "2026-06-10",
  },
];

/* =======================
   UTILIDADES
======================= */
const normalizar = (t = "") =>
  t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function scoreEspecialidad(caso, consejero) {
  const txt = normalizar(`${caso.vulneracion} ${caso.sector}`);
  return consejero.especialidades.filter((e) =>
    txt.includes(normalizar(e))
  ).length;
}

function consejerosMenorCarga(consejeros, casos) {
  const data = consejeros.map((c) => ({
    ...c,
    total: casos.filter((x) => x.asignadoA === c.nombre).length,
  }));

  const min = Math.min(...data.map((d) => d.total));
  return data.filter((d) => d.total === min);
}

/* =======================
   COMPONENTE
======================= */
export default function AsignacionCasosConsejeros() {
  const [casos, setCasos] = useState(CASOS);

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroConsejero, setFiltroConsejero] = useState("todos");

  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalManual, setModalManual] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);

  const [casoSel, setCasoSel] = useState(null);
  const [consejeroManual, setConsejeroManual] = useState("");

  const [form, setForm] = useState({
    codigo: "",
    nombres: "",
    sector: "",
    vulneracion: "",
    prioridad: "Media",
  });

  /* =======================
     FILTROS
  ======================= */
  const casosFiltrados = useMemo(() => {
    const q = normalizar(busqueda);

    return casos.filter((c) => {
      const matchBusqueda =
        !q ||
        `${c.codigo} ${c.nombres} ${c.sector} ${c.vulneracion} ${c.asignadoA}`
          .toLowerCase()
          .includes(q);

      const matchTipo =
        filtroTipo === "todos" || c.asignacion === filtroTipo;

      const matchConsejero =
        filtroConsejero === "todos" ||
        c.asignadoA === filtroConsejero;

      return matchBusqueda && matchTipo && matchConsejero;
    });
  }, [casos, busqueda, filtroTipo, filtroConsejero]);

  /* =======================
     ASIGNACIÓN AUTOMÁTICA
  ======================= */
  const asignarAutomatico = (caso) => {
    const candidatos = consejerosMenorCarga(CONSEJEROS, casos);

    let mejor = candidatos[0];
    let max = -1;

    candidatos.forEach((c) => {
      const score = scoreEspecialidad(caso, c);
      if (score > max) {
        max = score;
        mejor = c;
      }
    });

    return mejor;
  };

  /* =======================
     GUARDAR CASO
  ======================= */
  const guardarCaso = () => {
    if (!form.codigo || !form.nombres || !form.vulneracion) return;

    const base = {
      id: Date.now(),
      ...form,
      fecha: new Date().toISOString().slice(0, 10),
    };

    const c = asignarAutomatico(base);

    const final = {
      ...base,
      asignacion: "Rotativa",
      asignadoA: c.nombre,
      despacho: c.despacho,
    };

    setCasos([final, ...casos]);
    setModalNuevo(false);
  };

  /* =======================
     MANUAL
  ======================= */
  const abrirManual = (caso) => {
    setCasoSel(caso);
    setConsejeroManual(caso.asignadoA);
    setModalManual(true);
  };

  const confirmarManual = () => {
    const c = CONSEJEROS.find((x) => x.nombre === consejeroManual);
    if (!c) return;

    setCasos((prev) =>
      prev.map((x) =>
        x.id === casoSel.id
          ? {
              ...x,
              asignacion: "Manual",
              asignadoA: c.nombre,
              despacho: c.despacho,
            }
          : x
      )
    );

    setModalManual(false);
  };

  /* =======================
     UI
  ======================= */
  return (
    <section className="modulo expedientes">

      {/* HEADER */}
      <div className="expedientes-header">
        <div>
          <span className="expedientes-badge">Gestión operativa</span>
          <h2>Asignación de Casos</h2>
          <p>Rotativa, manual y por especialidad.</p>
        </div>

        <button className="btn-primary" onClick={() => setModalNuevo(true)}>
          + Nuevo caso
        </button>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <article className="stat-card blue">
          <div className="stat-value">{casos.length}</div>
          <div className="stat-subtitle">Total</div>
        </article>

        <article className="stat-card amber">
          <div className="stat-value">
            {casos.filter((c) => c.asignacion === "Rotativa").length}
          </div>
          <div className="stat-subtitle">Rotativa</div>
        </article>

        <article className="stat-card green">
          <div className="stat-value">
            {casos.filter((c) => c.asignacion === "Manual").length}
          </div>
          <div className="stat-subtitle">Manual</div>
        </article>
      </div>

      {/* FILTROS */}
      <div className="panel table-panel">
        <div className="barraFiltros">

          <input
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="Rotativa">Rotativa</option>
            <option value="Manual">Manual</option>
          </select>

          <select
            value={filtroConsejero}
            onChange={(e) => setFiltroConsejero(e.target.value)}
          >
            <option value="todos">Consejeros</option>
            {CONSEJEROS.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>

        </div>

        {/* TABLA */}
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Vulneración</th>
              <th>Asignación</th>
              <th>Consejero</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {casosFiltrados.map((c) => (
              <tr key={c.id}>
                <td>{c.codigo}</td>
                <td>{c.nombres}</td>
                <td>{c.vulneracion}</td>
                <td>{c.asignacion}</td>
                <td>{c.asignadoA}</td>
                <td>
                  <button onClick={() => abrirManual(c)}>
                    Manual
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL NUEVO */}
      {modalNuevo && (
        <div className="expedientes-modal-overlay">
          <div className="expedientes-modal">

            <h3>Nuevo caso</h3>

            <input
              placeholder="Código"
              onChange={(e) =>
                setForm({ ...form, codigo: e.target.value })
              }
            />

            <input
              placeholder="Nombre"
              onChange={(e) =>
                setForm({ ...form, nombres: e.target.value })
              }
            />

            <input
              placeholder="Sector"
              onChange={(e) =>
                setForm({ ...form, sector: e.target.value })
              }
            />

            <select
              onChange={(e) =>
                setForm({ ...form, vulneracion: e.target.value })
              }
            >
              <option>Maltrato</option>
              <option>Civil / Familiar</option>
              <option>Educación</option>
            </select>

            <button className="btn-primary" onClick={guardarCaso}>
              Guardar
            </button>

          </div>
        </div>
      )}

      {/* MODAL MANUAL */}
      {modalManual && casoSel && (
        <div className="expedientes-modal-overlay">
          <div className="expedientes-modal">

            <h3>Asignación manual</h3>

            <select
              value={consejeroManual}
              onChange={(e) => setConsejeroManual(e.target.value)}
            >
              {CONSEJEROS.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>

            <button
              className="btn-primary"
              onClick={confirmarManual}
            >
              Confirmar
            </button>

          </div>
        </div>
      )}

    </section>
  );
}