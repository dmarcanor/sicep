import { useEffect, useState } from "react";

/** Milisegundos de espera tras la última pulsación antes de consultar. */
export const ESPERA_MS = 350;

/**
 * Difiere el término de búsqueda para no lanzar una consulta por pulsación.
 *
 * Es un "debounce de cola": cada tecla cancela el temporizador anterior, así
 * que la petición sale una sola vez, cuando el usuario lleva ESPERA_MS sin
 * escribir. Al vaciar la caja no se espera: devolver el listado completo es
 * inmediato y así no queda la sensación de que el filtro se ha quedado pegado.
 */
export function useBusquedaDiferida(termino, espera = ESPERA_MS) {
  const [diferido, setDiferido] = useState(termino);

  useEffect(() => {
    const t = setTimeout(() => setDiferido(termino), termino ? espera : 0);
    return () => clearTimeout(t);
  }, [termino, espera]);

  return diferido;
}
