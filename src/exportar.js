import * as XLSX from "xlsx";
import { ajuste } from "./institucion";
// Va incrustado en el paquete, no pedido a la red: los PDF se generan en el
// navegador y tienen que salir con el escudo aunque el equipo esté sin señal.
import logo from "../img/logo-documento.png?inline";

/**
 * Membrete institucional para todo lo que sale del sistema.
 *
 * Un listado impreso o una hoja de cálculo salen del despacho y acaban en un
 * expediente o en manos de otro organismo: sin membrete no se sabe quién los
 * emitió. Los textos vienen de Configuración, de modo que si la institución
 * cambia de nombre o de municipio, cambian todos los documentos a la vez.
 */

/** El mismo escudo, para las vistas de impresión que se arman en HTML. */
export const LOGO = logo;

const ALTO_BANDA = 22;
const ALTO_LOGO = 16;
const ANCHO_LOGO = ALTO_LOGO * (220 / 156);
const MARGEN = 14;
const TEXTO_X = MARGEN + ANCHO_LOGO + 5;

/** Dibuja la banda superior con el escudo y el título. Devuelve la Y donde seguir. */
export function membretePDF(doc, titulo, subtitulo = "") {
  doc.setFillColor(24, 48, 78);
  doc.rect(0, 0, 210, ALTO_BANDA, "F");

  doc.addImage(logo, "PNG", MARGEN, (ALTO_BANDA - ALTO_LOGO) / 2, ANCHO_LOGO, ALTO_LOGO);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(ajuste("membrete_subtitulo").toUpperCase(), TEXTO_X, 9.5, { maxWidth: 210 - TEXTO_X - MARGEN });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(ajuste("membrete_titulo"), TEXTO_X, 14.5, { maxWidth: 210 - TEXTO_X - MARGEN });
  doc.text(`Municipio ${ajuste("municipio")} - Estado ${ajuste("estado")}`, TEXTO_X, 18.5);

  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(titulo, 14, ALTO_BANDA + 10);

  let y = ALTO_BANDA + 10;

  if (subtitulo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(75, 85, 99);
    doc.text(subtitulo, 14, y + 6);
    y += 6;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(90, 106, 127);
  doc.text(`Emitido el ${new Date().toLocaleString("es-VE")}`, 14, y + 6);

  doc.setTextColor(31, 41, 55);
  return y + 12;
}

/** Pie con la dirección y el contacto, en todas las páginas. */
export function pieDePaginaPDF(doc) {
  const total = doc.internal.getNumberOfPages();
  const contacto = [ajuste("direccion_institucion"), ajuste("telefono_institucion"), ajuste("email_institucion")]
    .filter(Boolean)
    .join(" · ");

  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 130, 145);
    doc.text(contacto, 14, 288, { maxWidth: 165 });
    doc.text(`${i}/${total}`, 196, 288, { align: "right" });
  }
}

/** Hoja de Excel con el membrete encima de los datos. */
export function hojaConMembrete(datos, titulo) {
  const cabecera = [
    [ajuste("membrete_titulo")],
    [ajuste("membrete_subtitulo")],
    [ajuste("membrete_tercero")],
    [ajuste("direccion_institucion")],
    [],
    [titulo],
    [`Emitido el ${new Date().toLocaleString("es-VE")}`],
    [],
  ];

  const hoja = XLSX.utils.aoa_to_sheet(cabecera);
  XLSX.utils.sheet_add_json(hoja, datos, { origin: -1 });

  // Ancho suficiente para que el membrete no salga cortado.
  hoja["!cols"] = [{ wch: 42 }, ...Array(8).fill({ wch: 20 })];
  return hoja;
}
