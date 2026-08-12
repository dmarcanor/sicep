import { useEffect, useState } from "react";
import { api } from "./api";

/**
 * Ajustes institucionales (datos de la institución, membrete y lapsos).
 *
 * Se guardan en un único sitio del módulo porque los consume tanto React como
 * los generadores de PDF de Plantillas, que son funciones sueltas y no pueden
 * usar hooks.
 */

// Sirven mientras la petición está en vuelo y si una clave se quedara vacía.
export const POR_DEFECTO = {
  nombre_institucion: "Consejo de Protección de Niños, Niñas y Adolescentes",
  nombre_corto: "CPNNA",
  municipio: "Benítez",
  estado: "Sucre",
  membrete_titulo: "REPÚBLICA BOLIVARIANA DE VENEZUELA",
  membrete_subtitulo: "CONSEJO DE PROTECCIÓN DE NIÑOS, NIÑAS Y ADOLESCENTES",
  membrete_tercero: "MUNICIPIO BENÍTEZ - ESTADO SUCRE",
  direccion_institucion: "El Pilar, Municipio Benítez, Estado Sucre",
  telefono_institucion: "",
  email_institucion: "",
  dias_alerta_amarillo: "21",
  dias_alerta_rojo: "25",
};

let valores = { ...POR_DEFECTO };
const oyentes = new Set();

/** Lectura síncrona, para los generadores de PDF. */
export function ajuste(clave, alterno) {
  const valor = valores[clave];
  return valor === undefined || valor === null || valor === "" ? (alterno ?? POR_DEFECTO[clave] ?? "") : valor;
}

export function ajusteNumero(clave) {
  const n = Number.parseInt(ajuste(clave), 10);
  return Number.isFinite(n) ? n : Number.parseInt(POR_DEFECTO[clave], 10);
}


export async function cargarInstitucion() {
  try {
    const data = await api.getInstitucion();
    valores = { ...POR_DEFECTO, ...data };
  } catch (error) {
    console.error("Error cargando los ajustes institucionales:", error);
    valores = { ...POR_DEFECTO };
  }

  oyentes.forEach((avisar) => avisar(valores));
  return valores;
}

export function institucionActual() {
  return valores;
}

export function useInstitucion() {
  const [actuales, setActuales] = useState(valores);

  useEffect(() => {
    const avisar = (nuevos) => setActuales({ ...nuevos });
    oyentes.add(avisar);
    return () => oyentes.delete(avisar);
  }, []);

  return actuales;
}

/**
 * Semáforo de lapsos legales (LOPNNA). Dos umbrales de Configuración →
 * Sistema bastan: por debajo del amarillo es verde, entre ambos amarillo y a
 * partir del rojo, vencido.
 */
export function alertaLapso(fechaISO) {
  if (!fechaISO) return null;

  const inicio = new Date(`${String(fechaISO).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(inicio.getTime())) return null;

  const dias = Math.floor((Date.now() - inicio.getTime()) / 86400000);
  const rojo = ajusteNumero("dias_alerta_rojo");
  const amarillo = ajusteNumero("dias_alerta_amarillo");

  if (dias >= rojo) return { nivel: "rojo", dias, texto: `${dias} d · lapso vencido` };
  if (dias >= amarillo) return { nivel: "amarillo", dias, texto: `${dias} d · por vencer` };
  return { nivel: "verde", dias, texto: `${dias} d · en lapso` };
}
