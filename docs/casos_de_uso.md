# Casos de uso del sistema SICEP-NNA

Actores: **Administrador** (A); **Supervisor (secretaría)** (S); **Consejero** (C).

Los permisos de la secretaría y el consejero son los predeterminados. Pueden cambiarse desde Configuración → Permisos por rol. Las reglas de propiedad (consejero asignado, redactor del documento) se aplican siempre, sin importar la matriz.

## Acceso y cuenta propia

| Código | Caso de uso | Actores | Reglas | PIN |
|---|---|---|---|---|
| UC01 | Iniciar sesión | Administrador, Supervisor (secretaría), Consejero | Credenciales de usuario y contraseña. Tras 5 intentos fallidos se bloquea por un minuto. | No |
| UC02 | Cerrar sesión | Administrador, Supervisor (secretaría), Consejero | Cierre manual o automático por inactividad de 60 minutos. | No |
| UC03 | Ver panel principal | Administrador, Supervisor (secretaría), Consejero | Pantalla de inicio tras iniciar sesión. | No |
| UC04 | Configurar PIN inicial | Administrador, Supervisor (secretaría), Consejero | Obligatorio antes de confirmar cualquier acción crítica. | No |
| UC05 | Cambiar PIN | Administrador, Supervisor (secretaría), Consejero | Requiere el PIN actual. Solo numérico, de 4 a 6 dígitos. | No |
| UC06 | Editar perfil propio | Administrador, Supervisor (secretaría), Consejero | Nombre, correo, teléfono y cargo. Requiere PIN. | Sí |
| UC07 | Cambiar contraseña propia | Administrador, Supervisor (secretaría), Consejero | Requiere la contraseña actual y el PIN. Debe combinar letras y números. | Sí |
| UC08 | Consultar institución (membrete) | Administrador, Supervisor (secretaría), Consejero | Datos que aparecen en los documentos. | No |

## Recepción, NNA y expedientes

| Código | Caso de uso | Actores | Reglas | PIN |
|---|---|---|---|---|
| UC10 | Registrar NNA | Administrador, Supervisor (secretaría), Consejero | Documento de identidad único. | Sí |
| UC11 | Editar NNA | Administrador, Supervisor (secretaría), Consejero | Requiere PIN. | Sí |
| UC12 | Verificar NNA por documento | Administrador, Supervisor (secretaría), Consejero | Indica si ya tiene expedientes (reincidencia). | No |
| UC13 | Registrar representante | Administrador, Supervisor (secretaría), Consejero | Cédula única. | Sí |
| UC14 | Editar representante | Administrador, Supervisor (secretaría), Consejero | Requiere PIN. | Sí |
| UC15 | Buscar representante por cédula | Administrador, Supervisor (secretaría), Consejero | Consulta rápida al registrar un expediente. | No |
| UC16 | Registrar expediente | Administrador, Supervisor (secretaría), Consejero | Código correlativo SICEP-URD-000000. Requiere PIN. | Sí |
| UC17 | Consultar expedientes | Administrador, Supervisor (secretaría), Consejero | Búsqueda por código, NNA, representante, estatus o prioridad. | No |
| UC18 | Editar datos del expediente | Administrador, Consejero | Solo administrador o consejero asignado al caso. | Sí |
| UC19 | Cambiar estatus del expediente | Administrador, Consejero | Registrado, En revisión, Aprobado, Observado o Cerrado. Solo administrador o consejero asignado. | Sí |
| UC20 | Cambiar estatus físico | Administrador, Supervisor (secretaría), Consejero | En Despacho o En Archivo Central. | Sí |
| UC21 | Subir PDF resumen | Administrador, Supervisor (secretaría), Consejero | Máximo 10 MB. Sustituye el anterior. | Sí |
| UC22 | Consultar PDF resumen | Administrador, Supervisor (secretaría), Consejero | Descarga protegida por sesión. | No |
| UC23 | Quitar PDF resumen | Administrador, Supervisor (secretaría), Consejero | El expediente se conserva. | Sí |
| UC24 | Registrar actuación en bitácora | Administrador, Consejero | Solo administrador o consejero asignado. | Sí |
| UC25 | Consultar bitácora | Administrador, Supervisor (secretaría), Consejero | Actuaciones en orden cronológico. | No |
| UC26 | Registrar observación | Administrador, Supervisor (secretaría) | Queda en el expediente y en la bitácora, con el mismo texto. | Sí |
| UC27 | Consultar observaciones | Administrador, Supervisor (secretaría), Consejero | Lista de observaciones del expediente. | No |

## Asignación de casos y solicitudes de archivo

| Código | Caso de uso | Actores | Reglas | PIN |
|---|---|---|---|---|
| UC30 | Asignar caso a consejero | Administrador, Supervisor (secretaría) | Reparto rotativo o manual. Solo administrador o supervisor. | Sí |
| UC31 | Reasignar caso | Administrador, Supervisor (secretaría) | Cambia el consejero responsable. | Sí |
| UC32 | Actualizar estatus del caso | Administrador, Supervisor (secretaría) | Pendiente, En proceso, Resuelto o Cerrado. | Sí |
| UC33 | Consultar casos | Administrador, Supervisor (secretaría) | Filtros por estatus y consejero. | No |
| UC34 | Consultar lista de consejeros | Administrador, Supervisor (secretaría) | Solo consejeros activos, sin datos de cuenta. | No |
| UC35 | Crear solicitud de archivo | Administrador, Supervisor (secretaría), Consejero | Préstamo o consulta de expediente físico. | Sí |
| UC36 | Actualizar solicitud de archivo | Administrador, Supervisor (secretaría), Consejero | Estatus, fechas y ubicación física. | Sí |
| UC37 | Consultar solicitudes de archivo | Administrador, Supervisor (secretaría), Consejero | Lista y detalle. | No |

## Plantillas, documentos y reportes

| Código | Caso de uso | Actores | Reglas | PIN |
|---|---|---|---|---|
| UC40 | Gestionar plantillas | Administrador | Crear y editar. Otros roles pueden recibir el módulo desde Configuración → Permisos. | Sí |
| UC41 | Consultar plantillas | Administrador | Catálogo de formatos activos. | No |
| UC42 | Crear borrador de documento | Administrador | Basado en una plantilla y, opcionalmente, en un expediente. | Sí |
| UC43 | Editar borrador de documento | Administrador, Consejero | Quien lo redactó, el administrador o el consejero asignado al expediente. | Sí |
| UC44 | Emitir documento | Administrador, Consejero | Convierte el borrador en acto oficial. Irreversible. Requiere PIN. | Sí |
| UC45 | Descargar o imprimir documento | Administrador | Cada salida queda registrada en el historial. | No |
| UC46 | Descartar borrador | Administrador | Quien lo redactó o el administrador. Los emitidos no se eliminan. | Sí |
| UC47 | Consultar reportes | Supervisor (secretaría) | Módulo de reportes. | No |

## Historial y administración

| Código | Caso de uso | Actores | Reglas | PIN |
|---|---|---|---|---|
| UC50 | Consultar historial | Administrador, Supervisor (secretaría) | Filtros por usuario, fecha, módulo, acción y estado. | No |
| UC51 | Ver línea de tiempo de un registro | Administrador, Supervisor (secretaría) | Todo lo ocurrido con un expediente, persona, caso, etc. | No |
| UC52 | Exportar historial a CSV | Administrador, Supervisor (secretaría) | Una línea por cada campo cambiado. | No |
| UC53 | Gestionar usuarios | Administrador | Crear, editar, habilitar o deshabilitar cuentas. Requiere PIN. | Sí |
| UC54 | Cambiar contraseña de otro usuario | Administrador | Desde la edición de usuario. Campo opcional. | Sí |
| UC55 | Configurar permisos por rol | Administrador | Qué módulos ve cada rol. | Sí |
| UC56 | Configurar parámetros del sistema | Administrador | Umbrales, membrete y otros ajustes. | Sí |
