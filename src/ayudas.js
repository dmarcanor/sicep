// Leyendas de los formularios, en un solo sitio para que digan lo mismo en
// todas las pantallas donde se piden los mismos datos (por ejemplo el alta de
// NNA aparece tanto en su módulo como en el alta rápida de un expediente).
//
// Deben reflejar las reglas reales de los controladores: si cambia una
// validación en api/app/Http/Controllers/Api, cambia también aquí.

export const AYUDAS_NNA = {
  documento_identidad:
    "Cédula o documento del NNA. Formato V-12345678 o E-12345678. Único en el sistema.",
  nombres: "Nombres tal como aparecen en el documento.",
  apellidos: "Apellidos tal como aparecen en el documento.",
  fecha_nacimiento: "No puede ser una fecha futura.",
  sexo: "Según el documento de identidad.",
  lugar_nacimiento: "Opcional. Ciudad o localidad de nacimiento.",
  observaciones:
    "Opcional. Datos relevantes del NNA: condición de salud, discapacidad, etc.",
};

export const AYUDAS_REPRESENTANTE = {
  cedula:
    "Cédula del representante. Formato V-12345678 o E-12345678. Única en el sistema.",
  nombres: "Nombres tal como aparecen en la cédula.",
  apellidos: "Apellidos tal como aparecen en la cédula.",
  telefono: "Opcional. Formato venezolano: 0414-1234567.",
  email: "Opcional. Debe ser un correo válido, ej. persona@dominio.com",
  profesion: "Opcional. Ej. Docente, Comerciante.",
  direccion: "Opcional. Dirección de habitación.",
  lugar_trabajo: "Opcional. Institución o empresa donde labora.",
};

export const AYUDAS_EXPEDIENTE = {
  nna: "Busque por nombres, apellidos o documento. Si no existe, regístrelo con “+ Nuevo NNA”.",
  representante:
    "Busque por nombres, apellidos o cédula. Si no existe, regístrelo con “+ Nuevo representante”.",
  fecha: "Fecha de ingreso del caso. No puede ser futura.",
  hora_registro: "Opcional. Si se deja vacía se usa la hora actual.",
  sector: "Sector o comunidad donde ocurrieron los hechos. Ej. Centro, Guariquén.",
  prioridad: "Alta para casos que requieren atención inmediata.",
  tipificacion: "Opcional. Tipo de vulneración detectada en la recepción.",
  causa: "Opcional. Descripción breve de los hechos que motivan el expediente.",
  estatus: "El expediente se abre siempre como Registrado.",
};
