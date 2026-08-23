import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { ajuste } from "../src/institucion";
import { LOGO, membretePDF, pieDePaginaPDF } from "../src/exportar";
import { api } from "../src/api";
import { formatearFecha, hoyISO } from "../src/formato";
import "./css/Plantillas.css";
import { usePinAction } from "../src/hooks/usePinAction";

const CATALOGO_PLANTILLAS = [
  {
    id: "registro_general",
    titulo: "Registro General de Expediente",
    descripcion: "Carátula institucional con solicitud, requerido, NNA, motivo y remisión.",
    referencia: "Formato base de expediente",
    icono: "📁",
  },
  {
    id: "constancia_solicitud",
    titulo: "Constancia de Solicitud o Petición",
    descripcion: "Constancia formal de comparecencia y exposición de hechos.",
    referencia: "Uso institucional",
    icono: "📝",
  },
  {
    id: "registro_casos",
    titulo: "Registro de Casos",
    descripcion: "Ficha de datos de los NNA, representantes, resumen del caso y decisiones.",
    referencia: "Control de caso",
    icono: "🗂️",
  },
  {
    id: "opinion_nna",
    titulo: "Opinión de NNA",
    descripcion: "Formato para la manifestación del niño, niña o adolescente.",
    referencia: "Art. 80 LOPNNA",
    icono: "🧒",
  },
  {
    id: "acta_conciliatoria",
    titulo: "Acta Conciliatoria",
    descripcion: "Acta de acuerdos entre las partes.",
    referencia: "Conciliación institucional",
    icono: "🤝",
  },
  {
    id: "citacion",
    titulo: "Citación",
    descripcion: "Citación formal con expediente, fecha, hora y asunto.",
    referencia: "Despacho del Consejo",
    icono: "📨",
  },
  {
    id: "medida_proteccion",
    titulo: "Medida de Protección",
    descripcion: "Resolución con fundamento legal y derecho garantizado.",
    referencia: "Arts. 125, 126 y 270 LOPNNA",
    icono: "🛡️",
  },
  {
    id: "notificacion",
    titulo: "Notificación",
    descripcion: "Notificación administrativa para comparecencia y pruebas.",
    referencia: "Art. 297 LOPNNA",
    icono: "📣",
  },
  {
    id: "constancia",
    titulo: "Constancia",
    descripcion: "Constancia de asistencia o comparecencia a la sede administrativa.",
    referencia: "Soporte administrativo",
    icono: "✅",
  },
  {
    id: "certificacion_copias",
    titulo: "Certificación de Copias",
    descripcion: "Certificación de copias fieles y exactas del expediente.",
    referencia: "Cotejo documental",
    icono: "📄",
  },
];

function limpiar(valor) {
  return String(valor || "").replace(/\s+/g, " ").trim();
}

// El día de quien redacta, no el de UTC: de noche en Venezuela no coinciden.
const fechaPorDefecto = hoyISO;

/*
 * Se compara por componentes de la cadena, sin construir un Date: "2018-03-14"
 * se interpreta como medianoche UTC, y en Venezuela eso cae en el día anterior,
 * con lo que la edad bailaba un día alrededor del cumpleaños.
 */
function edadEnAnios(fechaNacimiento) {
  const [anio, mes, dia] = String(fechaNacimiento || "").slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return "";

  const [hoyAnio, hoyMes, hoyDia] = fechaPorDefecto().split("-").map(Number);

  let edad = hoyAnio - anio;
  if (hoyMes < mes || (hoyMes === mes && hoyDia < dia)) edad -= 1;

  return edad >= 0 ? String(edad) : "";
}

const UNIDADES = [
  "", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez",
  "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho",
  "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro",
  "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve", "treinta",
  "treinta y uno",
];

/** Día del mes en letras, que es como lo piden las actas y constancias. */
function diaEnLetras(dia) {
  return UNIDADES[Number(dia)] || "";
}

/** Año en letras para el siglo en curso: "dos mil veintiséis". */
function anioEnLetras(anio) {
  const n = Number(anio);
  if (!Number.isInteger(n) || n < 2000 || n > 2099) return "";
  const resto = n - 2000;
  return resto === 0 ? "dos mil" : `dos mil ${UNIDADES[resto] || ""}`.trim();
}

const nombreCompleto = (p) => limpiar([p?.nombres, p?.apellidos].filter(Boolean).join(" "));

const dosDigitos = (n) => String(n).padStart(2, "0");

const horaLocal = (fecha) => `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;

/**
 * Hora en que se recibió el caso.
 *
 * Vale la que anotó quien atendió. Si no la hay sirve la de creación del
 * registro —en UTC, hay que leerla en local o se desplaza cuatro horas—, pero
 * sólo cuando el registro se creó el mismo día del expediente: si el caso se
 * tecleó semanas después, esa hora no describe la recepción y es preferible
 * dejar la casilla vacía a fechar el acta con una hora ajena.
 */
function horaDelExpediente(expediente) {
  const anotada = String(expediente?.hora_registro || "").slice(0, 5);
  if (anotada) return anotada;

  if (!expediente?.created_at) return "";
  const creado = new Date(expediente.created_at);
  if (Number.isNaN(creado.getTime())) return "";

  const diaCreacion = `${creado.getFullYear()}-${dosDigitos(creado.getMonth() + 1)}-${dosDigitos(creado.getDate())}`;
  return diaCreacion === String(expediente.fecha || "").slice(0, 10) ? horaLocal(creado) : "";
}

/** El acta dice "siendo las 11:21 de la mañana": el turno sale de la propia hora. */
function turnoDeHora(hora) {
  const texto = String(hora || "").trim();
  if (!texto) return "";

  const h = Number(texto.slice(0, 2));
  if (!Number.isInteger(h)) return "";
  if (h < 12) return "mañana";
  if (h < 19) return "tarde";
  return "noche";
}

const nacionalidadDe = (documento) => {
  const inicial = String(documento || "").trim().charAt(0).toUpperCase();
  if (inicial === "V") return "Venezolana";
  if (inicial === "E") return "Extranjera";
  return "";
};

/**
 * Rellena el formulario con todo lo que el expediente ya sabe.
 *
 * Estas plantillas repiten los mismos datos —el NNA, su representante, el
 * código del caso— en decenas de casillas, y transcribirlos a mano en cada
 * documento es donde aparecen los errores. Lo que el expediente no contiene
 * (folios, lapsos, acuerdos, la narrativa de cada acto) se deja en blanco a
 * propósito: inventarlo sería peor que dejarlo vacío.
 */
function semillaDeExpediente(expediente, usuario) {
  if (!expediente) return {};

  const nna = expediente.nna || {};
  const rep = expediente.representante || {};
  const nombreNna = nombreCompleto(nna) || limpiar(expediente.nna_nombre);
  const nombreRep = nombreCompleto(rep) || limpiar(expediente.representante_nombre);

  const entrada = String(expediente.fecha || "").slice(0, 10).split("-");
  const [hoyAnio, hoyMes, hoyDia] = fechaPorDefecto().split("-");
  const horaRecepcion = horaDelExpediente(expediente);

  const funcionario = limpiar(usuario?.display_name || usuario?.name);
  const nacimiento = [nna.lugar_nacimiento, formatearFecha(nna.fecha_nacimiento)]
    .filter(Boolean)
    .join(", ");

  return {
    codigoURD: limpiar(expediente.codigo),
    expedienteCertificacion: limpiar(expediente.codigo),
    sector: limpiar(expediente.sector),
    lugar: ajuste("direccion_institucion"),
    hora: horaRecepcion,
    turno: turnoDeHora(horaRecepcion),

    nna: nombreNna,
    nnaGeneral: nombreNna,
    nnaProtegido: nombreNna,
    constanciaNna: nombreNna,
    ciNna: limpiar(nna.documento_identidad),
    sexo: limpiar(nna.sexo),
    edad: edadEnAnios(nna.fecha_nacimiento),
    lugarNacimiento: nacimiento,

    representante: nombreRep,
    requerido: nombreRep,
    solicitante: nombreRep,
    comparecientes: nombreRep,
    nombreCiudadano: nombreRep,
    ciudadanoCitacion: nombreRep,
    notificadoA: nombreRep,
    constanciaCiudadano: nombreRep,
    cedulaRepresentante: limpiar(rep.cedula),
    ciComparecientes: limpiar(rep.cedula),
    ciCiudadano: limpiar(rep.cedula),
    constanciaCI: limpiar(rep.cedula),
    nacionalidad: nacionalidadDe(rep.cedula),
    telefono: limpiar(rep.telefono),
    domicilio: limpiar(rep.direccion),
    direccionHabitacion: limpiar(rep.direccion),
    direccionRepresentante: limpiar(rep.direccion),
    profesion: limpiar(rep.profesion),
    lugarTrabajo: limpiar(rep.lugar_trabajo),
    condicionNotificado: nombreRep ? "Representante" : "",

    motivo: limpiar(expediente.tipificacion),
    resumenCaso: limpiar(expediente.causa),
    relato: limpiar(expediente.causa),
    observaciones: limpiar(expediente.observaciones),
    fechaEntradaDia: entrada[2] || "",
    fechaEntradaMes: entrada[1] || "",
    fechaEntradaAnio: entrada[0] || "",
    autoFecha: formatearFecha(expediente.fecha),
    terminadoEnFecha: formatearFecha(expediente.cerrado_en),

    fechaDocumento: fechaPorDefecto(),

    /*
     * El acta de comparecencia dice "En esta fecha D/M/A, siendo las HH:MM":
     * las dos mitades describen el mismo momento, la recepción del caso, así
     * que la fecha va emparejada con `hora`. Ponerle hoy dejaría el acta
     * fechada un día y con la hora de otro.
     */
    fechaDia: entrada[2] || hoyDia,
    fechaMes: entrada[1] || hoyMes,
    fechaAnio: entrada[0] || hoyAnio,
    horaActa: horaLocal(new Date()),
    fechaActa: hoyDia,
    mesActa: hoyMes,
    anioActa: hoyAnio,
    diaMedida: hoyDia,
    mesMedida: hoyMes,
    anioMedida: hoyAnio,
    diaCertificacion: hoyDia,
    mesCertificacion: hoyMes,
    anioCertificacion: hoyAnio,
    diaConstancia: hoyDia,
    mesConstancia: hoyMes,
    anioConstancia: hoyAnio,
    diaLiteralConstancia: diaEnLetras(hoyDia),
    anioLiteralConstancia: anioEnLetras(hoyAnio),
    ciudadConstancia: ajuste("municipio"),
    lugarNotificacion: ajuste("direccion_institucion"),

    consejero: funcionario,
    suscribenMedida: funcionario,
    suscribenCertificacion: funcionario,
  };
}

function construirDocumento(tipo, form, expedienteActivo) {
  const codigo = limpiar(form.codigoURD || expedienteActivo?.codigo || "URD-2026-XXXX");
  const nna = limpiar(form.nna || expedienteActivo?.nna_nombre || "________________");
  const fecha = form.fechaDocumento || fechaPorDefecto();
  const lugar = limpiar(form.lugar || ajuste("direccion_institucion"));
  const hora = limpiar(form.hora || "________");

  // Membrete tomado de Configuración → Membrete / General.
  const membrete = [
    ajuste("membrete_titulo"),
    ajuste("membrete_subtitulo"),
    ajuste("membrete_tercero"),
  ].filter(Boolean).join("\n");

  const firmaConsejo = [
    `POR ${ajuste("membrete_subtitulo")}`,
    "",
    "__________________          _________________            ____________________",
    "MSc. Arleana Millán           Abg. Dimas Díaz            Abg. Francis Malavé",
    "Consejera de PNNA            Consejero de PNNA        Consejero de PNNA",
  ].join("\n");

  if (tipo === "registro_general") {
    return {
      titulo: "REGISTRO GENERAL DE EXPEDIENTE",
      subtitulo: "Carátula institucional del expediente administrativo.",
      cuerpo: [
        membrete,
        "",
        `Exp. N° ${codigo}`,
        `Solicitante(s): ${limpiar(form.solicitante || "________________")}`,
        `Requerido(s): ${limpiar(form.requerido || "________________")}`,
        `Niño(s), Niña(s) y Adolescente(s): ${limpiar(form.nnaGeneral || nna)}`,
        `Motivo(s): ${limpiar(form.motivos || form.motivo || "________________")}`,
        "",
        ajuste("membrete_subtitulo"),
        `Fecha de entrada: Día ${limpiar(form.fechaEntradaDia || "___")} Mes: ${limpiar(
          form.fechaEntradaMes || "________"
        )} Año ${limpiar(form.fechaEntradaAnio || "________")}`,
        `Remitido de: ${limpiar(form.remitidoDe || "________________")}`,
        `Remitido a: ${limpiar(form.remitidoA || "________________")}`,
        `Terminado en fecha: ${limpiar(form.terminadoEnFecha || "________________")}`,
      ].join("\n"),
    };
  }

  if (tipo === "constancia_solicitud") {
    return {
      titulo: "CONSTANCIA DE SOLICITUD O PETICIÓN",
      subtitulo: "Documento de comparecencia y formulación de denuncia.",
      cuerpo: [
        membrete,
        "",
        `En esta fecha ${limpiar(form.fechaDia || "__")}/${limpiar(
          form.fechaMes || "__"
        )}/${limpiar(form.fechaAnio || "____")}, siendo las ${hora} de la ${limpiar(
          form.turno || "________"
        )}, se presentó ante ${ajuste('nombre_institucion')}, del Municipio ${ajuste('municipio')}, Estado ${ajuste('estado')}, el (la) ciudadano(a): ${limpiar(
          form.nombreCiudadano || form.solicitante || "________________"
        )}, con el fin de formular una denuncia.`,
        "",
        `Al efecto, legalmente juramentado(a), dijo llamarse como queda escrito, ser de nacionalidad ${limpiar(
          form.nacionalidad || "________________"
        )}, titular de la cédula de identidad N° ${limpiar(
          form.ciCiudadano || "________________"
        )}, domiciliado(a) en: ${limpiar(form.domicilio || "________________")}, Estado Civil: ${limpiar(
          form.estadoCivil || "________________"
        )}, de Profesión u Oficio: ${limpiar(form.profesion || "________________")}, Lugar de Trabajo: ${limpiar(
          form.lugarTrabajo || "________________"
        )}, Teléfono: ${limpiar(form.telefono || "________________")}.`,
        "",
        "Afirmó proceder sinceramente en este acto y en consecuencia expuso:",
        limpiar(form.relato || "______________________________________"),
        "",
        `Solicitante: ${limpiar(form.nombreCiudadano || "________________")}     Consejero(a) Receptor(a): ${limpiar(
          form.consejero || "________________"
        )}     C.I.: ${limpiar(form.ciConsejero || "________________")}`,
        "Huella Dactilar: __________________",
      ].join("\n"),
    };
  }

  if (tipo === "registro_casos") {
    return {
      titulo: "REGISTRO DE CASOS",
      subtitulo: "Ficha integral de atención y seguimiento del caso.",
      cuerpo: [
        membrete,
        "",
        "DATOS DE LOS NIÑOS, NIÑAS Y ADOLESCENTES",
        `Nombres y apellidos: ${limpiar(form.nna || "________________")}`,
        `Lugar y fecha de nacimiento: ${limpiar(form.lugarNacimiento || "________________")}, Edad: ${limpiar(
          form.edad || "____"
        )}`,
        `Sexo: ${limpiar(form.sexo || "________")}     C.I.: ${limpiar(
          form.ciNna || "________________"
        )}     Nivel educativo: ${limpiar(form.nivelEducativo || "________________")}`,
        `Institución donde cursa estudios: ${limpiar(form.institucion || "________________")}`,
        `Dirección de habitación: ${limpiar(form.direccionHabitacion || "________________")}`,
        "",
        "DATOS DEL PADRE, MADRE O REPRESENTANTE",
        `Nombres y apellidos de la madre o representante: ${limpiar(form.representante || "________________")}`,
        `C.I.: ${limpiar(form.cedulaRepresentante || "________________")}     Edad: ${limpiar(
          form.edadRepresentante || "____"
        )}`,
        `Condición laboral: ${limpiar(form.condicionLaboral || "________________")}`,
        `Lugar de trabajo: ${limpiar(form.lugarTrabajo || "________________")}`,
        `Dirección de habitación: ${limpiar(form.direccionRepresentante || "________________")}`,
        `Teléfono: ${limpiar(form.telefono || "________________")}`,
        "",
        `La presente amenaza, violación o infracción de derecho fue conocida por este Consejo mediante: ${limpiar(
          form.mecanismoConocimiento || "Denuncia / Oficio / Averiguaciones"
        )}.`,
        "",
        "Resumen del caso:",
        limpiar(form.resumenCaso || "______________________________________"),
        "",
        `Medidas tomadas: ${limpiar(form.medidasTomadas || "________________")}`,
        `Decisión: ${limpiar(form.decision || "________________")}`,
        `Observaciones: ${limpiar(form.observaciones || "________________")}`,
        `Documentos que se anexan: ${limpiar(form.documentosAnexos || "________________")}`,
      ].join("\n"),
    };
  }

  if (tipo === "opinion_nna") {
    return {
      titulo: "OPINIÓN DE NIÑO, NIÑA O ADOLESCENTE",
      subtitulo: "Manifestación libre de opinión conforme al artículo 80 LOPNNA.",
      cuerpo: [
        membrete,
        "",
        `En esta fecha ${limpiar(form.fechaDia || "__")}/${limpiar(
          form.fechaMes || "__"
        )}/${limpiar(form.fechaAnio || "____")}, siendo las ${hora} de la ${limpiar(
          form.turno || "________"
        )}, se presentó ante ${ajuste('nombre_institucion')}, del Municipio ${ajuste('municipio')}, Estado ${ajuste('estado')}, el niño(a): ${limpiar(
          form.nna || "________________"
        )}, titular de la cédula de identidad N° ${limpiar(form.ciNna || "________________")}, de ${limpiar(
          form.edad || "____"
        )} años de edad, de nacionalidad ${limpiar(
          form.nacionalidad || "________________"
        )}, estudiante del ${limpiar(form.nivelEducativo || "________________")}, en la institución: ${limpiar(
          form.institucion || "________________"
        )}, domiciliado(a) en: ${limpiar(form.direccionHabitacion || "________________")}.`,
        "",
        "De conformidad con el artículo 80 de la Ley Orgánica para la Protección de Niños, Niñas y Adolescentes, expone lo siguiente:",
        limpiar(form.opinion || "______________________________________"),
        "",
        `Niño(a): ${limpiar(form.nna || "________________")}        Consejero(a): ${limpiar(
          form.consejero || "________________"
        )}`,
        "Huella Dactilar: __________________",
      ].join("\n"),
    };
  }

  if (tipo === "acta_conciliatoria") {
    return {
      titulo: "ACTA CONCILIATORIA",
      subtitulo: "Acta de acuerdos suscrita por las partes ante el Consejo.",
      cuerpo: [
        membrete,
        "",
        `En el día de hoy ${limpiar(form.fechaActa || "__")}/${limpiar(
          form.mesActa || "__"
        )}/${limpiar(form.anioActa || "____")}; siendo las ${limpiar(form.horaActa || hora)}, en el Despacho de ${ajuste('nombre_institucion')} del Municipio ${ajuste('municipio')}, Estado ${ajuste('estado')}, estando presentes los suscritos ciudadanos(as): ${limpiar(
          form.comparecientes || "________________"
        )}, titulares de la cédula de identidad N° ${limpiar(
          form.ciComparecientes || "________________"
        )}, respectivamente.`,
        "",
        `Acuerdan los siguientes: ${limpiar(form.acuerdos || "________________")}`,
        "",
        "Ambas partes firman y manifiestan conformidad con lo establecido en esta acta.",
        "",
        firmaConsejo,
      ].join("\n"),
    };
  }

  if (tipo === "citacion") {
    return {
      titulo: "CITACIÓN",
      subtitulo: "Citación formal para comparecencia ante el despacho.",
      cuerpo: [
        membrete,
        "",
        `N° de Citación: ${limpiar(form.nroCitacion || "____________")}`,
        `${lugar}, ${formatearFecha(fecha)}`,
        "",
        `CIUDADANO(A): ${limpiar(form.ciudadanoCitacion || form.requerido || "________________")}`,
        "",
        `Se le informa que debe comparecer ante el despacho de ${ajuste('nombre_institucion')} del Municipio ${ajuste('municipio')}, Estado ${ajuste('estado')}, el día ${limpiar(
          form.fechaCitacion || "__/__/____"
        )}, hora: ${limpiar(
          form.horaCitacion || "________"
        )}, para dar contestación a la solicitud formulada en relación a: ${limpiar(
          form.relacionCitacion || form.motivo || "________________"
        )}. De conformidad con lo establecido en la Ley Orgánica para la Protección de Niños, Niñas y Adolescentes.`,
        "",
        "Sírvase firmar abajo, con indicación del día y hora en prueba de haber sido citado.",
        "",
        "Notificado:",
        "Firma: _________________________",
        "Fecha: _________________________",
        `Expediente N° ${codigo}`,
        "Hora: __________________________",
        "Nota: Presentar la citación al momento de su comparecencia.",
        "",
        "___________________________",
        "Consejero(a) de PNNA",
        `Dirección: ${ajuste("direccion_institucion")}.`,
      ].join("\n"),
    };
  }

  if (tipo === "medida_proteccion") {
    return {
      titulo: "MEDIDA DE PROTECCIÓN",
      subtitulo: "Resolución administrativa de protección a favor del NNA.",
      cuerpo: [
        membrete,
        "",
        `N° ${limpiar(form.numeroMedida || "_____________")}`,
        "",
        "MEDIDA DE PROTECCIÓN",
        "",
        `Quienes suscriben: ${limpiar(
          form.suscribenMedida ||
            "ARLEANA MILLÁN DOMÍNGUEZ, DIMAS DÍAZ RODRÍGUEZ y FRANCIS JOSÉ MALAVÉ"
        )}, venezolanos, mayores de edad, titulares de la cédula de identidad N° ${limpiar(
          form.ciSuscriben ||
            "16.398.605, 5.423.178 y 5.880.275"
        )}, en nuestro carácter de Consejeros de Protección de Niño o Niña y Adolescentes del Municipio ${ajuste('municipio')} - Estado ${ajuste('estado')}, haciendo uso de los deberes y atribuciones legales conferidas en la Ley Orgánica para la Protección de Niños, Niñas y Adolescentes (LOPNNA), artículo 126 y 160 literal “b”, se procede a dictar las siguientes Medidas de Protección a favor del(los) Niño(s), Niña(s) o Adolescente(s):`,
        "",
        limpiar(form.nnaProtegido || form.nna || "________________"),
        "",
        `La Medida de Protección dictada por este Consejo consiste en: ${limpiar(form.medidaDictada || "________________")}`,
        "",
        `Para garantizar el Derecho a: ${limpiar(form.derechoGarantizado || "________________")}`,
        "",
        `De conformidad con los artículos ${limpiar(form.articulosMedida || "125 y 126")}, de la Ley Orgánica para la Protección de Niños, Niñas y Adolescentes (LOPNNA).`,
        "",
        `Observaciones: ${limpiar(form.observacionesMedida || "________________")}`,
        "",
        "El incumplimiento de esta medida de protección ocasionará sanciones legales establecidas en el artículo 270 de la LOPNNA. Contra esta medida se puede ejercer recurso de reconsideración ante este Consejo de Protección.",
        "",
        `Así lo decimos a los ${limpiar(form.diaMedida || "__")} días del mes de ${limpiar(form.mesMedida || "________")} del año ${limpiar(form.anioMedida || "________")}.`,
        "",
        firmaConsejo,
      ].join("\n"),
    };
  }

  if (tipo === "notificacion") {
    return {
      titulo: "NOTIFICACIÓN",
      subtitulo: "Acto de notificación para comparecencia y presentación de razones o pruebas.",
      cuerpo: [
        membrete,
        "",
        `${lugar}, ${limpiar(form.fechaNotificacion || "______ de ____________ del ________")}.`,
        "",
        "NOTIFICACIÓN",
        "",
        `SE HACE SABER A: ${limpiar(form.notificadoA || "________________")}, en su condición de ${limpiar(
          form.condicionNotificado || "________________"
        )}, que este Consejo de Protección de Niños, Niñas y Adolescentes, por auto de fecha ${limpiar(
          form.autoFecha || "________________"
        )}, ordenó su notificación a los fines de que concurra a esta Sede Administrativa, ubicada en: ${ajuste('direccion_institucion')}, en un lapso de ${limpiar(
          form.lapsoNotificacion || "CINCO (05) DÍAS HÁBILES"
        )} siguiente al recibido de esta notificación, en horas comprendidas de 8:00 am a 12:00 pm, para que, de conformidad con lo previsto en el artículo 297 de la LOPNNA, proceda a presentar RAZONES O PRUEBAS en el procedimiento administrativo que cursa por ante esta Sede, según consta en expediente signado con el N° ${codigo}, de nomenclatura interna de este Consejo de Protección.`,
        "",
        `Se autoriza suficientemente para el acto de la entrega de la presente notificación al(la) ciudadano(a): ${limpiar(
          form.autorizadoA || "________________"
        )}, C.I. N° ${limpiar(form.ciAutorizado || "________________")}, para que cumpla con lo aquí ordenado.`,
        "",
        firmaConsejo,
        "",
        `EL(LA) NOTIFICADO(A): ${limpiar(form.notificadoA || "________________")}`,
        `LUGAR Y FECHA: ${limpiar(form.lugarNotificacion || "________________")}`,
        `HORA: ${limpiar(form.horaNotificacion || "________________")}`,
      ].join("\n"),
    };
  }

  if (tipo === "constancia") {
    return {
      titulo: "CONSTANCIA",
      subtitulo: "Constancia de asistencia o comparecencia ante la sede administrativa.",
      cuerpo: [
        membrete,
        "",
        "CONSTANCIA",
        "",
        `${ajuste('nombre_institucion')} del Municipio ${ajuste('municipio')}, Estado ${ajuste('estado')}, hace constar por medio de la presente que el(la) ciudadano(a): ${limpiar(
          form.constanciaCiudadano || form.nombreCiudadano || "________________"
        )}, titular de la cédula de identidad N° ${limpiar(
          form.constanciaCI || form.ciCiudadano || "________________"
        )}, asistió a esta Sede Administrativa a fin de tratar asunto relacionado con el Niño, Niña o Adolescente: ${limpiar(
          form.constanciaNna || form.nna || "________________"
        )}.`,
        "",
        `Constancia que se expide a petición de la parte interesada, en la ciudad ${limpiar(
          form.ciudadConstancia || "__________"
        )}, a los ${limpiar(form.diaConstancia || "___")} (${limpiar(
          form.diaLiteralConstancia || "___"
        )}) días del mes de ${limpiar(form.mesConstancia || "__________")} de dos mil ${limpiar(
          form.anioConstancia || "________"
        )} (${limpiar(form.anioLiteralConstancia || "____")}).`,
        "",
        firmaConsejo,
      ].join("\n"),
    };
  }

  return {
    titulo: "CERTIFICACIÓN DE COPIAS",
    subtitulo: "Certificación de copias fieles y exactas del expediente.",
    cuerpo: [
      membrete,
      "",
      "CERTIFICACIÓN DE COPIAS",
      "",
      `Quienes suscriben: ${limpiar(
        form.suscribenCertificacion ||
          "ARLEANA MILLÁN DOMÍNGUEZ, DIMAS DÍAZ RODRÍGUEZ y FRANCIS JOSÉ MALAVÉ"
      )}, venezolanos, mayores de edad, titulares de la cédula de identidad N° ${limpiar(
        form.ciSuscribenCertificacion ||
          "16.398.605, 5.423.178 y 5.880.275"
      )}, en nuestro carácter de Consejeros de Protección de Niños, Niñas y Adolescentes del Municipio ${ajuste('municipio')} – Estado ${ajuste('estado')}, hacemos constar y certificamos que las copias que anteceden son fieles y exactas de sus originales, que reposan en el expediente signado bajo el número ${limpiar(
        form.expedienteCertificacion || codigo
      )}, constante de ${limpiar(form.foliosCertificacion || "________")} (${limpiar(
        form.foliosCertificacionLiteral || "________"
      )}) folios útiles, nomenclatura de este CPNNA.`,
      "",
      `Copias que se expiden, a los ${limpiar(form.diaCertificacion || "__")} días del mes de ${limpiar(
        form.mesCertificacion || "__________"
      )} del ${limpiar(form.anioCertificacion || "________")}.`,
      "",
      firmaConsejo,
    ].join("\n"),
  };
}

function escribirPDFPorBloques(doc, texto, startX, startY, maxWidth, lineHeight) {
  const lineas = texto.split("\n");
  let y = startY;

  const pageHeight = 287;
  const bottomMargin = 20;

  lineas.forEach((linea) => {
    const limpio = linea === "" ? " " : linea;
    const partes = doc.splitTextToSize(limpio, maxWidth);
    partes.forEach((parte) => {
      if (y > pageHeight - bottomMargin) {
        doc.addPage();
        y = 20;
      }
      doc.text(parte, startX, y);
      y += lineHeight;
    });
    y += 1.5;
  });

  return y;
}

function generarPDFDocumento({ titulo, subtitulo, cuerpo, expediente, plantillaId }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const trasMembrete = membretePDF(doc, titulo || "PLANTILLA", subtitulo);

  doc.setDrawColor(220, 228, 238);
  doc.line(14, trasMembrete, 196, trasMembrete);

  const encabezado = [
    `Expediente: ${expediente?.id || "URD-2026-XXXX"}`,
    `Plantilla: ${plantillaId || ""}`,
    `Fecha de emisión: ${new Date().toLocaleDateString("es-VE")}`,
  ].join("   |   ");

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(90, 106, 127);
  doc.text(encabezado, 14, trasMembrete + 6);

  doc.setTextColor(31, 41, 55);
  doc.setFont("times", "normal");
  doc.setFontSize(11);

  const yFinal = escribirPDFPorBloques(doc, cuerpo || "", 14, trasMembrete + 17, 182, 5.9);

  const firmaY = Math.min(yFinal + 10, 260);
  doc.setDrawColor(24, 48, 78);
  doc.line(14, firmaY, 86, firmaY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text("Funcionario responsable", 14, firmaY + 5);

  doc.setFontSize(8);
  doc.text("Documento generado automáticamente por el sistema institucional.", 14, 280);

  pieDePaginaPDF(doc);
  doc.save(`${plantillaId || "plantilla"}-${expediente?.id || "expediente"}.pdf`);
}

function abrirVistaImpresion({ titulo, subtitulo, cuerpo, expediente, plantillaId }) {
  if (typeof window === "undefined") return;

  const ventana = window.open("", "_blank", "width=900,height=700");
  if (!ventana) {
    alert("No fue posible abrir la vista de impresión.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${titulo || "Plantilla"}</title>
        <style>
          @page { margin: 18mm 16mm; }
          * { box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #1f2937;
            margin: 0;
            padding: 0;
            line-height: 1.55;
          }
          .header {
            background: #18304E;
            color: white;
            padding: 14px 18px 12px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .header img {
            height: 46px;
            width: auto;
          }
          .header .line1 {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: .2px;
          }
          .header .line2 {
            font-size: 11px;
            opacity: .92;
          }
          h1 {
            font-size: 18px;
            margin: 0 0 6px;
            color: #18304E;
          }
          .subtitulo {
            font-size: 12px;
            color: #5a6a7f;
            margin-bottom: 12px;
          }
          .meta {
            font-size: 11px;
            color: #52657b;
            margin-bottom: 16px;
            padding: 10px 12px;
            background: #f8fafc;
            border: 1px solid #dce4ee;
            border-radius: 10px;
          }
          .meta div { margin-bottom: 2px; }
          .contenido {
            white-space: pre-wrap;
            font-size: 13px;
            color: #24384e;
          }
          .firma {
            margin-top: 26px;
            width: 42%;
            border-top: 1px solid #18304E;
            padding-top: 5px;
            font-size: 11px;
            color: #52657b;
          }
          .footer {
            margin-top: 18px;
            padding-top: 10px;
            border-top: 1px solid #dce4ee;
            font-size: 10px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${LOGO}" alt="" />
          <div>
            <div class="line1">${ajuste("membrete_titulo")}</div>
            <div class="line2">${ajuste("membrete_subtitulo")} · ${ajuste("membrete_tercero")}</div>
          </div>
        </div>

        <h1>${titulo || "PLANTILLA"}</h1>
        <div class="subtitulo">${subtitulo || ""}</div>

        <div class="meta">
          <div><b>Expediente:</b> ${expediente?.id || "URD-2026-XXXX"}</div>
          <div><b>Plantilla:</b> ${plantillaId || ""}</div>
          <div><b>Fecha de emisión:</b> ${new Date().toLocaleDateString("es-VE")}</div>
        </div>

        <div class="contenido">${cuerpo || ""}</div>

        <div class="firma">Funcionario responsable</div>

        <div class="footer">Documento generado automáticamente por el sistema institucional.</div>

        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 250);
          };
        </script>
      </body>
    </html>
  `;

  ventana.document.write(html);
  ventana.document.close();
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  options = [],
  rows = 4,
  ancho = false,
}) {
  return (
    <div className={`campo ${ancho ? "ancho" : ""}`}>
      <label>{label}</label>

      {type === "textarea" ? (
        <textarea
          className="plantillas-textarea"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
        />
      ) : type === "select" ? (
        <select className="plantillas-input" name={name} value={value} onChange={onChange}>
          {options.map((op) => (
            <option key={op.value ?? op} value={op.value ?? op}>
              {op.label ?? op}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="plantillas-input"
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

/** Formulario en blanco. Se reconstruye en cada llamada para que la fecha
 *  del documento sea la de hoy y no la del arranque de la sesión. */
function formularioVacio() {
  return {
    codigoURD: "",
    fechaDocumento: fechaPorDefecto(),
    lugar: "",
    hora: "",
    solicitante: "",
    requerido: "",
    nna: "",
    nnaGeneral: "",
    motivo: "",
    motivos: "",
    remitidoDe: "",
    remitidoA: "",
    terminadoEnFecha: "",
    fechaEntradaDia: "",
    fechaEntradaMes: "",
    fechaEntradaAnio: "",
    nombreCiudadano: "",
    nacionalidad: "",
    ciCiudadano: "",
    domicilio: "",
    estadoCivil: "",
    profesion: "",
    lugarTrabajo: "",
    telefono: "",
    relato: "",
    consejero: "",
    ciConsejero: "",
    fechaDia: "",
    fechaMes: "",
    fechaAnio: "",
    turno: "",
    horaActa: "",
    edad: "",
    sexo: "",
    ciNna: "",
    nivelEducativo: "",
    institucion: "",
    direccionHabitacion: "",
    opinion: "",
    fechaActa: "",
    mesActa: "",
    anioActa: "",
    comparecientes: "",
    ciComparecientes: "",
    acuerdos: "",
    nroCitacion: "",
    ciudadanoCitacion: "",
    fechaCitacion: "",
    horaCitacion: "",
    relacionCitacion: "",
    numeroMedida: "",
    suscribenMedida: "",
    ciSuscriben: "",
    nnaProtegido: "",
    medidaDictada: "",
    derechoGarantizado: "",
    articulosMedida: "125 y 126",
    observacionesMedida: "",
    diaMedida: "",
    mesMedida: "",
    anioMedida: "",
    notificadoA: "",
    condicionNotificado: "",
    autoFecha: "",
    lapsoNotificacion: "CINCO (05) DÍAS HÁBILES",
    autorizadoA: "",
    ciAutorizado: "",
    lugarNotificacion: "",
    fechaNotificacion: "",
    horaNotificacion: "",
    constanciaCiudadano: "",
    constanciaCI: "",
    constanciaNna: "",
    ciudadConstancia: "",
    diaConstancia: "",
    diaLiteralConstancia: "",
    mesConstancia: "",
    anioConstancia: "",
    anioLiteralConstancia: "",
    suscribenCertificacion:
      "ARLEANA MILLÁN DOMÍNGUEZ, DIMAS DÍAZ RODRÍGUEZ y FRANCIS JOSÉ MALAVÉ",
    ciSuscribenCertificacion: "16.398.605, 5.423.178 y 5.880.275",
    expedienteCertificacion: "",
    foliosCertificacion: "",
    foliosCertificacionLiteral: "",
    diaCertificacion: "",
    mesCertificacion: "",
    anioCertificacion: "",
    lugarNacimiento: "",
    condicionLaboral: "",
    medidaTomada: "",
    resumenCaso: "",
    medidasTomadas: "",
    decision: "",
    observaciones: "",
    documentosAnexos: "",
    mecanismoConocimiento: "",
    edadRepresentante: "",
    instituto: "",
    direccionRepresentante: "",
  };
}

export default function Plantillas() {
  const [plantillaActiva, setPlantillaActiva] = useState("registro_general");
  const [expedienteActivo, setExpedienteActivo] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [borradores, setBorradores] = useState([]);
  const [vista, setVista] = useState("editor");
  const { executeWithPin, PinModalWrapper } = usePinAction();

  const [formulario, setFormulario] = useState(formularioVacio);

  const [expedientes, setExpedientes] = useState([]);
  const [documentoId, setDocumentoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState("");

  const avisar = (texto) => {
    setAviso(texto);
    setTimeout(() => setAviso(""), 5000);
  };

  const recargarBorradores = () =>
    api.getDocumentos({ estado: "Borrador" }).then(setBorradores).catch(console.error);

  useEffect(() => {
    api.getExpedientes().then(setExpedientes).catch(console.error);
    api.getMe().then(setUsuario).catch(console.error);
    recargarBorradores();
  }, []);

  /*
   * El llenado ocurre al elegir el expediente, no en un efecto sobre él: al
   * abrir un borrador guardado también se fija el expediente, y un efecto
   * habría machacado con la semilla los datos que el borrador traía escritos.
   */
  const elegirExpediente = (id) => {
    const elegido = expedientes.find((x) => String(x.id) === String(id)) ?? null;
    setExpedienteActivo(elegido);
    if (!elegido) return;

    const semilla = semillaDeExpediente(elegido, usuario);
    setFormulario((prev) => {
      const siguiente = { ...prev };
      // Sólo se escribe lo que el expediente sabe: una casilla sin origen en
      // los datos conserva lo que el usuario haya puesto.
      for (const [campo, valor] of Object.entries(semilla)) {
        if (valor) siguiente[campo] = valor;
      }
      return siguiente;
    });
  };

  const documento = useMemo(
    () => construirDocumento(plantillaActiva, formulario, expedienteActivo),
    [plantillaActiva, formulario, expedienteActivo]
  );

  const actualizar = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validar = () => {
    const faltantes = [];

    if (!formulario.codigoURD.trim()) faltantes.push("Código URD");
    if (!formulario.nna.trim()) faltantes.push("NNA");

    if (plantillaActiva === "registro_general") {
      if (!formulario.solicitante.trim()) faltantes.push("Solicitante");
      if (!formulario.requerido.trim()) faltantes.push("Requerido");
      if (!formulario.motivo.trim()) faltantes.push("Motivo");
      if (!formulario.remitidoDe.trim()) faltantes.push("Remitido de");
      if (!formulario.remitidoA.trim()) faltantes.push("Remitido a");
    }

    if (plantillaActiva === "constancia_solicitud") {
      if (!formulario.nombreCiudadano.trim()) faltantes.push("Ciudadano solicitante");
      if (!formulario.ciudadanoCitacion?.trim()) {
        // no aplica
      }
      if (!formulario.nacionalidad.trim()) faltantes.push("Nacionalidad");
      if (!formulario.ciCiudadano.trim()) faltantes.push("Cédula");
      if (!formulario.domicilio.trim()) faltantes.push("Domicilio");
      if (!formulario.relato.trim()) faltantes.push("Relato");
    }

    if (plantillaActiva === "registro_casos") {
      if (!formulario.representante.trim()) faltantes.push("Representante");
      if (!formulario.resumenCaso.trim()) faltantes.push("Resumen del caso");
      if (!formulario.medidasTomadas.trim()) faltantes.push("Medidas tomadas");
      if (!formulario.decision.trim()) faltantes.push("Decisión");
    }

    if (plantillaActiva === "opinion_nna") {
      if (!formulario.opinion.trim()) faltantes.push("Opinión");
      if (!formulario.edad.trim()) faltantes.push("Edad");
      if (!formulario.institucion.trim()) faltantes.push("Institución");
    }

    if (plantillaActiva === "acta_conciliatoria") {
      if (!formulario.comparecientes.trim()) faltantes.push("Comparecientes");
      if (!formulario.acuerdos.trim()) faltantes.push("Acuerdos");
    }

    if (plantillaActiva === "citacion") {
      if (!formulario.ciudadanoCitacion.trim()) faltantes.push("Ciudadano citado");
      if (!formulario.fechaCitacion.trim()) faltantes.push("Fecha de citación");
      if (!formulario.horaCitacion.trim()) faltantes.push("Hora de citación");
      if (!formulario.relacionCitacion.trim()) faltantes.push("Relación");
    }

    if (plantillaActiva === "medida_proteccion") {
      if (!formulario.nnaProtegido.trim()) faltantes.push("NNA protegido");
      if (!formulario.medidaDictada.trim()) faltantes.push("Medida dictada");
      if (!formulario.derechoGarantizado.trim()) faltantes.push("Derecho garantizado");
    }

    if (plantillaActiva === "notificacion") {
      if (!formulario.notificadoA.trim()) faltantes.push("Notificado");
      if (!formulario.condicionNotificado.trim()) faltantes.push("Condición");
      if (!formulario.autoFecha.trim()) faltantes.push("Auto de fecha");
    }

    if (plantillaActiva === "constancia") {
      if (!formulario.constanciaCiudadano.trim()) faltantes.push("Ciudadano");
      if (!formulario.constanciaCI.trim()) faltantes.push("Cédula");
      if (!formulario.constanciaNna.trim()) faltantes.push("NNA");
    }

    if (plantillaActiva === "certificacion_copias") {
      if (!formulario.expedienteCertificacion.trim()) faltantes.push("Expediente");
      if (!formulario.foliosCertificacion.trim()) faltantes.push("Folios");
    }

    if (plantillaActiva === "medida_proteccion" && !formulario.numeroMedida.trim()) {
      faltantes.push("Número de medida");
    }

    if (plantillaActiva === "notificacion" && !formulario.lapsoNotificacion.trim()) {
      faltantes.push("Lapso de notificación");
    }

    if (plantillaActiva === "citacion" && !formulario.nroCitacion.trim()) {
      faltantes.push("Número de citación");
    }

    if (faltantes.length > 0) {
      alert(`Complete los campos obligatorios: ${faltantes.join(", ")}.`);
      return false;
    }

    return true;
  };

  const cuerpoDelDocumento = () => ({
    expediente_id: expedienteActivo?.id ?? null,
    plantilla: plantillaActiva,
    titulo: documento.titulo,
    datos: formulario,
  });

  const guardarBorrador = async () => {
    if (!validar()) return;

    setGuardando(true);
    try {
      const guardado = await executeWithPin(
        (pin) => api.guardarDocumento(cuerpoDelDocumento(), pin, documentoId),
        documentoId ? "Actualizar borrador" : "Guardar borrador",
      );
      await recargarBorradores();

      /*
       * Se suelta también el documentoId. Vaciar el formulario dejando el
       * módulo atado al borrador recién guardado haría que el siguiente
       * "Guardar" lo sobrescribiera con las casillas en blanco.
       */
      setFormulario(formularioVacio());
      setExpedienteActivo(null);
      setDocumentoId(null);
      avisar(`Borrador guardado. Queda en la pestaña Borradores (${guardado.titulo}).`);
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        alert(error.message || "No se pudo guardar el borrador.");
      }
    } finally {
      setGuardando(false);
    }
  };

  /**
   * Un PDF legal sale del despacho: se confirma con PIN y queda registrado.
   * Si aún no se había guardado, se guarda y se emite en el mismo paso.
   */
  const emitirYRegistrar = async (medio) => {
    const guardado = await executeWithPin(async (pin) => {
      let doc = documentoId
        ? await api.guardarDocumento(cuerpoDelDocumento(), pin, documentoId)
        : await api.guardarDocumento(cuerpoDelDocumento(), pin);

      if (doc.estado !== "Emitido") {
        doc = await api.emitirDocumento(doc.id, pin);
      }

      await api.registrarDescarga(doc.id, medio, pin);
      return doc;
    }, medio === "impresion" ? "Imprimir documento" : "Descargar documento en PDF");

    setDocumentoId(guardado.id);
    await recargarBorradores();
    return guardado;
  };

  const descargarPDF = async () => {
    if (!validar()) return;

    try {
      await emitirYRegistrar("pdf");
    } catch (error) {
      if (error.message === "Acción cancelada") return;
      alert(error.message || "No se pudo registrar la emisión del documento.");
      return;
    }

    generarPDFDocumento({
      titulo: documento.titulo,
      subtitulo: documento.subtitulo,
      cuerpo: documento.cuerpo,
      expediente: { id: formulario.codigoURD },
      plantillaId: plantillaActiva,
    });
  };

  const imprimir = async () => {
    if (!validar()) return;

    try {
      await emitirYRegistrar("impresion");
    } catch (error) {
      if (error.message === "Acción cancelada") return;
      alert(error.message || "No se pudo registrar la impresión.");
      return;
    }

    abrirVistaImpresion({
      titulo: documento.titulo,
      subtitulo: documento.subtitulo,
      cuerpo: documento.cuerpo,
      expediente: { id: formulario.codigoURD },
      plantillaId: plantillaActiva,
    });
  };

  const cargarBorrador = (item) => {
    setPlantillaActiva(item.plantilla);
    setFormulario((prev) => ({ ...prev, ...(item.datos || {}) }));
    setDocumentoId(item.estado === "Emitido" ? null : item.id);
    if (item.expediente) setExpedienteActivo(item.expediente);
    setVista("editor");
  };

  const eliminarBorrador = async (id) => {
    if (!confirm("¿Descartar este borrador?")) return;

    try {
      await executeWithPin((pin) => api.descartarBorrador(id, pin), "Descartar borrador");
      if (documentoId === id) setDocumentoId(null);
      await recargarBorradores();
    } catch (error) {
      if (error.message !== "Acción cancelada") {
        alert(error.message || "No se pudo descartar el borrador.");
      }
    }
  };

  const referenciaActual =
    CATALOGO_PLANTILLAS.find((i) => i.id === plantillaActiva)?.referencia || "";

  const camposVisibles = useMemo(() => {
    const base = [
      { name: "codigoURD", label: "Expediente N°", type: "text", placeholder: "URD-2026-0001" },
      { name: "fechaDocumento", label: "Fecha de documento", type: "date" },
      { name: "lugar", label: "Lugar de emisión", type: "text", placeholder: ajuste("direccion_institucion") },
      { name: "hora", label: "Hora", type: "text", placeholder: "________" },
    ];

    if (plantillaActiva === "registro_general") {
      return [
        ...base,
        { name: "solicitante", label: "Solicitante(s)", type: "text" },
        { name: "requerido", label: "Requerido(s)", type: "text" },
        { name: "nnaGeneral", label: "Niños, Niñas y Adolescentes", type: "textarea", ancho: true },
        { name: "motivo", label: "Motivo(s)", type: "text" },
        { name: "fechaEntradaDia", label: "Fecha de entrada - Día", type: "text" },
        { name: "fechaEntradaMes", label: "Fecha de entrada - Mes", type: "text" },
        { name: "fechaEntradaAnio", label: "Fecha de entrada - Año", type: "text" },
        { name: "remitidoDe", label: "Remitido de", type: "text" },
        { name: "remitidoA", label: "Remitido a", type: "text" },
        { name: "terminadoEnFecha", label: "Terminado en fecha", type: "text" },
      ];
    }

    if (plantillaActiva === "constancia_solicitud") {
      return [
        ...base,
        { name: "fechaDia", label: "Día", type: "text" },
        { name: "fechaMes", label: "Mes", type: "text" },
        { name: "fechaAnio", label: "Año", type: "text" },
        { name: "turno", label: "Hora / turno", type: "text" },
        { name: "nombreCiudadano", label: "Ciudadano(a)", type: "text" },
        { name: "nacionalidad", label: "Nacionalidad", type: "text" },
        { name: "ciCiudadano", label: "Cédula de identidad", type: "text" },
        { name: "domicilio", label: "Domicilio", type: "text" },
        { name: "estadoCivil", label: "Estado civil", type: "text" },
        { name: "profesion", label: "Profesión u oficio", type: "text" },
        { name: "lugarTrabajo", label: "Lugar de trabajo", type: "text" },
        { name: "telefono", label: "Teléfono", type: "text" },
        { name: "relato", label: "Exposición", type: "textarea", ancho: true, rows: 6 },
        { name: "consejero", label: "Consejero(a) receptor(a)", type: "text" },
        { name: "ciConsejero", label: "C.I. Consejero(a)", type: "text" },
      ];
    }

    if (plantillaActiva === "registro_casos") {
      return [
        ...base,
        { name: "lugarNacimiento", label: "Lugar y fecha de nacimiento", type: "text" },
        { name: "edad", label: "Edad", type: "text" },
        { name: "sexo", label: "Sexo", type: "text" },
        { name: "ciNna", label: "C.I. del NNA", type: "text" },
        { name: "nivelEducativo", label: "Nivel educativo", type: "text" },
        { name: "institucion", label: "Institución donde cursa estudios", type: "text" },
        { name: "direccionHabitacion", label: "Dirección de habitación", type: "text" },
        { name: "representante", label: "Madre / Padre / Representante", type: "text" },
        { name: "cedulaRepresentante", label: "C.I. representante", type: "text" },
        { name: "edadRepresentante", label: "Edad representante", type: "text" },
        { name: "condicionLaboral", label: "Condición laboral", type: "text" },
        { name: "lugarTrabajo", label: "Lugar de trabajo", type: "text" },
        { name: "direccionRepresentante", label: "Dirección representante", type: "text" },
        { name: "mecanismoConocimiento", label: "Medio de conocimiento", type: "text" },
        { name: "resumenCaso", label: "Resumen del caso", type: "textarea", ancho: true, rows: 5 },
        { name: "medidasTomadas", label: "Medidas tomadas", type: "textarea", ancho: true, rows: 3 },
        { name: "decision", label: "Decisión", type: "textarea", ancho: true, rows: 3 },
        { name: "observaciones", label: "Observaciones", type: "textarea", ancho: true, rows: 3 },
        { name: "documentosAnexos", label: "Documentos que se anexan", type: "textarea", ancho: true, rows: 3 },
      ];
    }

    if (plantillaActiva === "opinion_nna") {
      return [
        ...base,
        { name: "fechaDia", label: "Día", type: "text" },
        { name: "fechaMes", label: "Mes", type: "text" },
        { name: "fechaAnio", label: "Año", type: "text" },
        { name: "turno", label: "Hora / turno", type: "text" },
        { name: "edad", label: "Edad", type: "text" },
        { name: "nacionalidad", label: "Nacionalidad", type: "text" },
        { name: "nivelEducativo", label: "Estudia en", type: "text" },
        { name: "institucion", label: "Institución", type: "text" },
        { name: "direccionHabitacion", label: "Domicilio", type: "text" },
        { name: "opinion", label: "Opinión", type: "textarea", ancho: true, rows: 7 },
        { name: "consejero", label: "Consejero(a)", type: "text" },
      ];
    }

    if (plantillaActiva === "acta_conciliatoria") {
      return [
        ...base,
        { name: "fechaActa", label: "Día", type: "text" },
        { name: "horaActa", label: "Hora del acto", type: "text" },
        { name: "mesActa", label: "Mes", type: "text" },
        { name: "anioActa", label: "Año", type: "text" },
        { name: "comparecientes", label: "Comparecientes", type: "text", ancho: true },
        { name: "ciComparecientes", label: "Cédulas", type: "text", ancho: true },
        { name: "acuerdos", label: "Acuerdos", type: "textarea", ancho: true, rows: 6 },
      ];
    }

    if (plantillaActiva === "citacion") {
      return [
        ...base,
        { name: "nroCitacion", label: "N° de citación", type: "text" },
        { name: "ciudadanoCitacion", label: "Ciudadano(a)", type: "text", ancho: true },
        { name: "fechaCitacion", label: "Fecha de comparecencia", type: "text" },
        { name: "horaCitacion", label: "Hora", type: "text" },
        { name: "relacionCitacion", label: "Relación / asunto", type: "text", ancho: true },
      ];
    }

    if (plantillaActiva === "medida_proteccion") {
      return [
        ...base,
        { name: "numeroMedida", label: "N°", type: "text" },
        { name: "suscribenMedida", label: "Consejeros que suscriben", type: "text", ancho: true },
        { name: "ciSuscriben", label: "Cédulas", type: "text", ancho: true },
        { name: "nnaProtegido", label: "NNA protegido", type: "text", ancho: true },
        { name: "medidaDictada", label: "Medida dictada", type: "textarea", ancho: true, rows: 4 },
        { name: "derechoGarantizado", label: "Derecho garantizado", type: "text", ancho: true },
        { name: "articulosMedida", label: "Artículos aplicables", type: "text" },
        { name: "observacionesMedida", label: "Observaciones", type: "textarea", ancho: true, rows: 3 },
        { name: "diaMedida", label: "Día", type: "text" },
        { name: "mesMedida", label: "Mes", type: "text" },
        { name: "anioMedida", label: "Año", type: "text" },
      ];
    }

    if (plantillaActiva === "notificacion") {
      return [
        ...base,
        { name: "fechaNotificacion", label: "Fecha", type: "text" },
        { name: "notificadoA", label: "A quién se notifica", type: "text", ancho: true },
        { name: "condicionNotificado", label: "Condición", type: "text" },
        { name: "autoFecha", label: "Auto de fecha", type: "text" },
        { name: "lapsoNotificacion", label: "Lapso", type: "text" },
        { name: "autorizadoA", label: "Autorizado para entrega", type: "text" },
        { name: "ciAutorizado", label: "C.I. autorizado", type: "text" },
        { name: "lugarNotificacion", label: "Lugar y fecha", type: "text", ancho: true },
        { name: "horaNotificacion", label: "Hora", type: "text" },
      ];
    }

    if (plantillaActiva === "constancia") {
      return [
        ...base,
        { name: "constanciaCiudadano", label: "Ciudadano(a)", type: "text", ancho: true },
        { name: "constanciaCI", label: "Cédula", type: "text" },
        { name: "constanciaNna", label: "NNA", type: "text", ancho: true },
        { name: "ciudadConstancia", label: "Ciudad", type: "text" },
        { name: "diaConstancia", label: "Día", type: "text" },
        { name: "diaLiteralConstancia", label: "Día literal", type: "text" },
        { name: "mesConstancia", label: "Mes", type: "text" },
        { name: "anioConstancia", label: "Año", type: "text" },
        { name: "anioLiteralConstancia", label: "Año literal", type: "text" },
      ];
    }

    return [
      ...base,
      { name: "suscribenCertificacion", label: "Quienes suscriben", type: "text", ancho: true },
      { name: "ciSuscribenCertificacion", label: "Cédulas", type: "text", ancho: true },
      { name: "expedienteCertificacion", label: "Expediente", type: "text" },
      { name: "foliosCertificacion", label: "Folios útiles", type: "text" },
      { name: "foliosCertificacionLiteral", label: "Folios en letras", type: "text" },
      { name: "diaCertificacion", label: "Día", type: "text" },
      { name: "mesCertificacion", label: "Mes", type: "text" },
      { name: "anioCertificacion", label: "Año", type: "text" },
    ];
  }, [plantillaActiva]);

  return (
    <div className="modulo plantillas-modulo">
      <div className="cabeceraModulo">
        <div>
          <span className="plantillas-etiqueta">Automatización administrativa</span>
          <h2>Plantillas</h2>
          <p>Elija el expediente y el formato: los datos del caso y el membrete se cargan solos.</p>
        </div>

        <div className="plantillas-acciones-cabecera">
          {/* Elegir el expediente es lo que dispara el auto-llenado. Antes
              dependía de que otro módulo lo hubiera dejado en el navegador. */}
          <label className="plantillas-selector">
            Expediente
            <select
              value={expedienteActivo?.id ?? ""}
              onChange={(e) => elegirExpediente(e.target.value)}
            >
              <option value="">Sin expediente</option>
              {expedientes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.codigo} — {e.nna_nombre || "Sin NNA"}
                </option>
              ))}
            </select>
          </label>

          <button className="botonPrincipal chico" onClick={guardarBorrador} disabled={guardando}>
            {guardando ? "Guardando..." : documentoId ? "Actualizar borrador" : "Guardar borrador"}
          </button>
        </div>
      </div>

      {aviso ? <div className="plantillas-aviso">{aviso}</div> : null}

      <div className="plantillas-layout">
        <section className="panel plantillas-catalogo">
          <div className="panel-head">
            <h3>Catálogo de documentos</h3>
            <span>Seleccione el formato a redactar</span>
          </div>

          <div className="catalogo-grid">
            {CATALOGO_PLANTILLAS.map((item) => (
              <button
                key={item.id}
                className={`plantilla-card ${plantillaActiva === item.id ? "active" : ""}`}
                onClick={() => {
                  setPlantillaActiva(item.id);
                  setVista("editor");
                }}
              >
                <div className="plantilla-ico">{item.icono}</div>
                <div className="plantilla-card-body">
                  <strong>{item.titulo}</strong>
                  <span>{item.descripcion}</span>
                  <small>{item.referencia}</small>
                </div>
              </button>
            ))}
          </div>

          <div className="expediente-activo">
            <span className="detalle-label">Expediente fuente</span>
            {expedienteActivo ? (
              <div className="expediente-mini">
                <strong>{expedienteActivo.codigo}</strong>
                <span>{expedienteActivo.nna_nombre}</span>
                <small>{expedienteActivo.representante_nombre}</small>
              </div>
            ) : (
              <div className="expediente-vacio">No hay expediente activo cargado.</div>
            )}
          </div>

          <div className="borradores-locales">
            <div className="panel-head">
              <h3>Borradores locales</h3>
              <span>{borradores.length} guardados</span>
            </div>

            <div className="draft-list">
              {borradores.length === 0 ? (
                <div className="draft-empty">No hay borradores guardados.</div>
              ) : (
                borradores.map((item) => (
                  <div key={item.id} className="draft-item">
                    <div>
                      <strong>{item.titulo}</strong>
                      <span>
                        {item.expediente?.codigo || "Sin expediente"}
                        {item.creado_por?.display_name ? ` · ${item.creado_por.display_name}` : ""}
                      </span>
                    </div>

                    <div className="draft-actions">
                      <button className="btn-link" onClick={() => cargarBorrador(item)}>
                        Abrir
                      </button>
                      <button className="btn-link" onClick={() => eliminarBorrador(item.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="panel plantillas-editor">
          <div className="panel-head">
            <div>
              <h3>{documento.titulo}</h3>
              <span>{referenciaActual}</span>
            </div>

{/*             <div className="plantillas-botones">
              <button className="botonSecundario" onClick={() => setVista("editor")}>
                Editor
              </button>
              <button className="botonSecundario" onClick={() => setVista("historial")}>
                Historial
              </button>
            </div> */}
          </div>

          <div className="editor-grid">
            {camposVisibles.map((campo) => (
              <Field
                key={campo.name}
                label={campo.label}
                name={campo.name}
                value={formulario[campo.name] ?? ""}
                onChange={actualizar}
                type={campo.type}
                placeholder={campo.placeholder}
                options={campo.options}
                rows={campo.rows}
                ancho={campo.ancho}
              />
            ))}
          </div>

          <div className="preview-shell">
            <div className="panel-head">
              <div>
                <h3>Vista previa automática</h3>
                <span>Texto legal prellenado con membrete institucional</span>
              </div>
            </div>

            <pre className="plantillas-preview">
              {documento?.titulo || ""}
              {"\n"}
              {documento?.subtitulo || ""}
              {"\n\n"}
              {documento?.cuerpo || ""}
            </pre>

            <div className="preview-actions">
              <button className="botonSecundario" onClick={imprimir}>
                Imprimir
              </button>
              <button className="botonSecundario" onClick={descargarPDF}>
                Descargar PDF
              </button>
{/*               <button className="botonSecundario" onClick={() => setVista("historial")}>
                Ver historial
              </button> */}
            </div>
          </div>
        </section>
      </div>

      {vista === "historial" && (
        <section className="panel historial-panel">
          <div className="panel-head">
            <h3>Historial local</h3>
            <span>Documentos guardados en este equipo</span>
          </div>

          <div className="historial-grid">
            {borradores.length === 0 ? (
              <div className="draft-empty">No hay documentos guardados.</div>
            ) : (
              borradores.map((item) => (
                <div key={item.id} className="historial-card">
                  <strong>{item.titulo}</strong>
                  <span>{item.expediente?.codigoURD || ""}</span>
                  <small>{new Date(item.fechaCreacion).toLocaleString("es-VE")}</small>
                  <div className="draft-actions">
                    <button className="btn-link" onClick={() => cargarBorrador(item)}>
                      Abrir
                    </button>
                    <button className="btn-link" onClick={() => eliminarBorrador(item.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <PinModalWrapper />
    </div>
  );
}