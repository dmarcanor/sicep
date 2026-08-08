// react-data-table-component v8 se configura sobre todo con variables CSS
// (ver .rdt_table en src/tablas.css): allí van tamaños, colores y separadores.
// Aquí queda solo lo que no tiene variable propia.
//
// Uso:  <DataTable columns={...} data={...} customStyles={estilosTabla} />

export const estilosTabla = {
  tableWrapper: {
    style: {
      border: "1px solid var(--line-2)",
      borderRadius: "16px",
      overflow: "hidden",
      background: "#fff",
    },
  },
  headCells: {
    style: {
      fontWeight: 700,
      color: "var(--navy)",
    },
  },
};
