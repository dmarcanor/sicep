// La API serializa las fechas con el cast 'date' de Eloquent, que produce ISO
// completo (2026-06-06T00:00:00.000000Z); en pantalla solo interesa el día.
export const formatearFecha = (valor) => {
  if (!valor) return "";

  const soloFecha = String(valor).slice(0, 10);
  const [anio, mes, dia] = soloFecha.split("-");

  if (!anio || !mes || !dia) return String(valor);

  return `${dia}/${mes}/${anio}`;
};

// Para inputs <input type="date">, que exigen YYYY-MM-DD.
export const fechaParaInput = (valor) =>
  valor ? String(valor).slice(0, 10) : "";

// Fecha de hoy en el huso del navegador. toISOString() da la fecha UTC, que en
// Venezuela (UTC-4) ya es la de mañana a partir de las 20:00 y dejaría pasar
// como "hoy" un día que aún no ha llegado.
export const hoyISO = () => {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
