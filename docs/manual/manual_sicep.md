# Manual del Sistema SICEP-NNA

Sistema de Control de Expedientes del Consejo de Protección de Niños, Niñas y Adolescentes (CPNNA), municipio Benítez, estado Sucre.

Este manual describe el sistema completo: la arquitectura, los roles, cada módulo y caso de uso, todas las rutas de la API, los controladores, los modelos, los servicios, la base de datos, la seguridad, la auditoría, la configuración, las pruebas y las limitaciones conocidas.

Documentos relacionados en la carpeta `docs/`:

- `analisis_base_de_datos.md`: detalle de cada tabla y columna.
- `modelo_relacional.png` y `.pdf`: diagrama entidad-relación.
- `casos_de_uso.md`: catálogo de los 49 casos de uso.
- `casos_de_uso/`: diagramas de casos de uso por rol y módulo.

---

## Índice

1. [Introducción](#1-introducción)
2. [Arquitectura](#2-arquitectura)
3. [Roles y permisos](#3-roles-y-permisos)
4. [Instalación y operación](#4-instalación-y-operación)
5. [Módulos y casos de uso](#5-módulos-y-casos-de-uso)
6. [Referencia de la API](#6-referencia-de-la-api)
7. [Controladores](#7-controladores)
8. [Modelos](#8-modelos)
9. [Base de datos](#9-base-de-datos)
10. [Middleware, reglas y servicios](#10-middleware-reglas-y-servicios)
11. [Frontend](#11-frontend)
12. [Seguridad](#12-seguridad)
13. [Auditoría e historial](#13-auditoría-e-historial)
14. [Configuración del sistema](#14-configuración-del-sistema)
15. [Pruebas](#15-pruebas)
16. [Limitaciones conocidas](#16-limitaciones-conocidas)
17. [Glosario](#17-glosario)

---

## 1. Introducción

### 1.1 Propósito

SICEP-NNA registra la atención de niños, niñas y adolescentes desde su recepción hasta el cierre de su expediente. Cubre:

- el registro del NNA y de su representante;
- la apertura de expedientes con código correlativo;
- la asignación de casos a consejeros;
- la bitácora de actuaciones, las observaciones de la secretaría y el resumen final en PDF;
- la preparación, emisión y descarga de documentos oficiales a partir de plantillas;
- las solicitudes de archivo físico;
- los reportes estadísticos;
- un historial completo de cada cambio, con el usuario, la fecha y el valor anterior y nuevo.

### 1.2 Usuarios del sistema

| Rol | Descripción |
|---|---|
| Administrador | Acceso total. Gestiona usuarios, permisos y configuración. |
| Supervisor (secretaría) | Recibe y registra casos, observa expedientes, asigna casos, cambia el estatus físico y gestiona el PDF resumen. No modifica el contenido de los expedientes. |
| Consejero | Atiende los casos que se le asignan. Modifica el expediente, registra actuaciones y emite documentos de sus casos. |

### 1.3 Convenciones de este manual

- **Ruta:** dirección HTTP de la API, siempre precedida por `/api`.
- **Permiso:** módulo de la matriz de permisos que debe estar concedido al rol.
- **PIN:** número de 4 a 6 dígitos que confirma las acciones críticas. Se envía en la cabecera `X-PIN`.
- **Propiedad:** regla que limita una acción al consejero asignado al caso, al redactor de un documento o al administrador. Se aplica siempre, sin importar la matriz de permisos.

---

## 2. Arquitectura

### 2.1 Componentes

El sistema se compone de tres servicios de Docker, definidos en `compose.yaml`:

| Servicio | Imagen | Función |
|---|---|---|
| `db` | `mariadb:11` | Base de datos `sicep`. Expuesta solo en `127.0.0.1` para conexiones locales o por túnel. |
| `api` | Construida desde `api/Dockerfile` | Backend en Laravel 13 sobre PHP 8.4-FPM, servido por nginx y gestionado por supervisord. Ejecuta migraciones y seeders al arrancar. |
| `web` | Construida desde `Dockerfile` de la raíz | Compila el frontend con Node 22 y Vite, y lo sirve con nginx. Redirige `/api` hacia el servicio `api`. |

### 2.2 Flujo de una petición

1. El navegador carga la aplicación desde `web` (puerto 8080 por defecto).
2. Las llamadas de la interfaz van a `/api/...` en el mismo origen, en `src/api.js` (constante `API_BASE = '/api'`).
3. nginx de `web` reenvía `/api` al servicio `api`, con cabeceras de IP y protocolo.
4. Laravel procesa la petición a través de los middleware de la ruta: autenticación con Sanctum, rol, permiso y, si corresponde, PIN.
5. El controlador valida los datos, aplica las reglas de propiedad, escribe en la base de datos y registra la acción en el historial.
6. La respuesta vuelve en JSON.

### 2.3 Autenticación

- **Token de API:** Laravel Sanctum. Al iniciar sesión se crea un token personal (`auth-token`) que el frontend guarda en `localStorage` con la clave `auth_token`.
- **Cabecera:** cada petición autenticada envía `Authorization: Bearer <token>`.
- **Cierre de sesión:** `POST /api/logout` revoca el token actual.
- **Sin vencimiento de token:** el token no caduca en el servidor (`config/sanctum.php`, `expiration = null`). El cierre por inactividad de 60 minutos es solo del frontend (sección 12).

### 2.4 Verificación por PIN

Las acciones críticas exigen el PIN del usuario que las realiza:

- el frontend muestra un diálogo y envía el PIN en la cabecera `X-PIN`;
- el middleware `VerifyPin` comprueba que el usuario tenga PIN configurado, que la cabecera exista, que no haya demasiados intentos y que el PIN coincida;
- los intentos fallidos se registran en el historial.

### 2.5 Arquitectura de capas del backend

```
Rutas (routes/api.php)
  → Middleware (autenticación, rol, permiso, PIN)
    → Controladores (app/Http/Controllers/Api)
      → Reglas de propiedad (app/Support/Jurisdiccion.php)
      → Validación (request->validate, PasswordAlfanumerica)
      → Modelos Eloquent (app/Models)
      → Auditoría (app/Support/Auditoria.php) → historial + historial_cambios
    → Respuesta JSON
```

---

## 3. Roles y permisos

### 3.1 Roles

El campo `users.role` admite tres valores: `administrador`, `supervisor` y `consejero`. Cualquier otro valor se rechaza en la API.

### 3.2 Matriz de permisos

Los módulos se conceden por rol desde **Configuración → Permisos por rol**. La matriz se guarda en la tabla `configuraciones`, con la clave `permisos_<rol>`.

| Módulo | Clave interna | Administrador | Supervisor (predeterminado) | Consejero (predeterminado) |
|---|---|---|---|---|
| Panel principal | `principal` | Sí | Sí | Sí |
| Recepción (URD) | `urd` | Sí | Sí | Sí |
| NNA | `nna` | Sí | Sí | Sí |
| Representantes | `representantes` | Sí | Sí | Sí |
| Expedientes | `expedientes` | Sí | Sí | Sí |
| Solicitudes de archivo | `solicitudArchivos` | Sí | Sí | Sí |
| Asignación de casos | `asignacionCasos` | Sí | Sí | No |
| Plantillas y documentos | `plantillas` | Sí | No | No |
| Reportes | `reportes` | Sí | Sí | No |
| Historial | `historial` | Sí | Sí | No |
| Usuarios | `usuarios` | Sí | No | No |
| Configuración | `configuracion` | Sí | No | No |

Notas sobre la matriz:

- El administrador tiene todos los módulos siempre (`Permisos::ROL_TOTAL`). No aparece en la matriz para evitar que se quite el acceso a sí mismo.
- `principal` se concede siempre a los roles configurables (`Permisos::MODULO_BASE`).
- Si el valor guardado de un rol no es utilizable, se usan los predeterminados. Nunca queda una lista vacía.
- El módulo `urd` no tiene rutas propias: trabaja sobre las de NNA, representantes y expedientes.

### 3.3 Reglas de propiedad

Estas reglas se aplican además de la matriz, y están en `app/Support/Jurisdiccion.php`:

| Acción | Quién puede |
|---|---|
| Editar el contenido de un expediente (datos, estatus) | Administrador o consejero con un caso asignado en ese expediente |
| Cambiar el estatus físico del expediente | Administrador, consejero asignado o supervisor |
| Subir o quitar el PDF resumen | Administrador, consejero asignado o supervisor |
| Registrar una actuación en la bitácora | Administrador o consejero asignado |
| Registrar una observación | Administrador o supervisor |
| Asignar o reasignar un caso | Administrador o supervisor |
| Editar o emitir un documento | Quien lo redactó, administrador o consejero asignado al expediente del documento |
| Descartar un borrador | Quien lo redactó o administrador |

El supervisor **no** puede cambiar datos ni el estatus del expediente: la actualización de expedientes solo le permite enviar `estatus_fisico`.

### 3.4 Comprobaciones en cada petición

1. **Autenticación** (`auth:sanctum`): debe haber un token válido.
2. **Rol** (`role:...`): el rol debe estar en la lista de roles conocidos del sistema.
3. **Permiso** (`permiso:<módulo>`): la matriz debe conceder el módulo al rol. Si no, responde 403.
4. **PIN** (`verify.pin`): solo en las rutas que lo exigen.
5. **Propiedad:** dentro del controlador, cuando la acción lo requiere.

---

## 4. Instalación y operación

### 4.1 Requisitos

- Docker y Docker Compose.
- Un archivo `.env` en la raíz del proyecto, a partir de `.env.docker.example`.

### 4.2 Variables de entorno principales

Estas son las variables que lee `compose.yaml`. Los valores reales están en `.env` y no se documentan aquí.

| Variable | Uso |
|---|---|
| `APP_KEY` | Clave de cifrado de Laravel. Obligatoria para arrancar la API. |
| `APP_ENV`, `APP_DEBUG`, `APP_URL` | Entorno, depuración y URL pública. |
| `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Base de datos y usuario de la aplicación. |
| `DB_ROOT_PASSWORD` | Contraseña de root de MariaDB (solo para el servicio `db`). |
| `DB_PORT_HOST` | Puerto local de MariaDB (por defecto 3306). |
| `WEB_PORT` | Puerto del frontend (por defecto 8080). |
| `LOG_LEVEL` | Nivel de registro (por defecto `warning`). |

Generar la clave de la aplicación:

```bash
echo "base64:$(openssl rand -base64 32)"
```

### 4.3 Puesta en marcha

```bash
docker compose up -d --build
```

Al arrancar, el contenedor `api` (`docker/entrypoint.sh`):

1. espera a que MariaDB responda (hasta 120 segundos);
2. ejecuta `php artisan migrate --force`;
3. ejecuta `php artisan db:seed --force`;
4. genera la caché de configuración y de rutas;
5. inicia nginx y PHP-FPM mediante supervisord.

Los seeders usan `firstOrCreate`: se ejecutan en cada arranque sin sobrescribir los cambios del administrador.

### 4.4 Comandos útiles

```bash
docker compose ps                         # estado de los servicios
docker compose logs -f api                # registros de la API
docker compose exec api php artisan migrate:status
docker compose run --rm api php artisan ... # herramientas de Laravel
```

### 4.5 Usuarios iniciales

Los seeders crean tres usuarios con PIN `1234` y estas contraseñas:

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `12345678adm` | administrador |
| `supervisor` | `12345678sup` | supervisor |
| `consejero` | `12345678con` | consejero |

Estas contraseñas son de desarrollo. Deben cambiarse antes de usar el sistema con datos reales.

### 4.6 Copias de seguridad

No hay procedimiento automatizado documentado en el repositorio. Se recomienda respaldar el volumen `db_data` y el volumen `api_storage` (donde se guardan los PDF resumen).

---

## 5. Módulos y casos de uso

Cada módulo describe su propósito, quién puede usarlo, sus casos de uso y las rutas que los implementan. Los códigos (UC01 a UC56) coinciden con `casos_de_uso.md`.

### 5.1 Cuenta y acceso

**Propósito:** entrar y salir del sistema, y gestionar la cuenta propia.

**Actores:** todos los roles.

| Código | Caso de uso | Reglas |
|---|---|---|
| UC01 | Iniciar sesión | Credenciales de usuario y contraseña. Tras 5 intentos fallidos se bloquea el par usuario/IP durante 60 segundos. |
| UC02 | Cerrar sesión | Revoca el token. También ocurre automáticamente tras 60 minutos sin actividad (frontend). |
| UC03 | Ver panel principal | Pantalla de inicio. Muestra totales y pendientes (ver 5.2). |
| UC04 | Configurar PIN inicial | Obligatorio antes de confirmar cualquier acción crítica. |
| UC05 | Cambiar PIN | Requiere el PIN actual. Solo numérico, de 4 a 6 dígitos. |
| UC06 | Editar perfil propio | Nombre, correo, teléfono y cargo. Requiere PIN. |
| UC07 | Cambiar contraseña propia | Requiere la contraseña actual y el PIN. La nueva debe combinar letras y números y no contener el nombre de usuario. |
| UC08 | Consultar institución | Datos del membrete que aparecen en los documentos. |

**Rutas:** `POST /api/login`, `POST /api/logout`, `GET /api/me`, `GET /api/me/permisos`, `PUT /api/profile`, `POST /api/me/password`, `POST /api/pin/setup`, `POST /api/pin/verify`, `POST /api/pin/change`, `GET /api/institucion`.

**Pantalla:** `Modulos/Perfil.jsx` (perfil, contraseña y PIN). Inicio de sesión en `Modulos/SistemaInstitucional.jsx`.

### 5.2 Panel principal

**Propósito:** resumen al entrar al sistema.

**Actores:** todos los roles con el módulo `principal`.

**Contenido de la respuesta** (`PanelController@index`):

- total de expedientes y los 5 más recientes, con quién los registró;
- expedientes agrupados por estatus;
- total de casos y casos pendientes;
- total de solicitudes de archivo y solicitudes pendientes.

**Ruta:** `GET /api/panel`. **Pantalla:** `Modulos/PanelPrincipal.jsx`.

### 5.3 Recepción, NNA y representantes

**Propósito:** registrar a la persona atendida (NNA) y a su representante, antes de abrir un expediente.

**Actores:** administrador, supervisor, consejero.

| Código | Caso de uso | Reglas |
|---|---|---|
| UC10 | Registrar NNA | Documento de identidad único. Requiere PIN. |
| UC11 | Editar NNA | Requiere PIN. |
| UC12 | Verificar NNA por documento | Indica si ya tiene expedientes (reincidencia). |
| UC13 | Registrar representante | Cédula única. Requiere PIN. |
| UC14 | Editar representante | Requiere PIN. |
| UC15 | Buscar representante por cédula | Consulta rápida al abrir un expediente. |

**Rutas NNA:** `GET /api/nna`, `POST /api/nna`, `GET /api/nna/verificar/{documento}`, `GET /api/nna/{nna}`, `PUT /api/nna/{nna}`.

**Rutas representantes:** `GET /api/representantes`, `POST /api/representantes`, `GET /api/representantes/buscar/{cedula}`, `GET /api/representantes/{representante}`, `PUT /api/representantes/{representante}`.

**Pantallas:** `Modulos/RecepcionURD.jsx`, `Modulos/Nna.jsx`, `Modulos/Representantes.jsx`.

### 5.4 Expedientes

**Propósito:** es el registro legal central. Cada expediente tiene un código correlativo `SICEP-URD-000001`, un NNA, un representante y un estatus.

**Actores:** todos los roles con el módulo `expedientes`, con las restricciones de la sección 3.3.

| Código | Caso de uso | Reglas |
|---|---|---|
| UC16 | Registrar expediente | Requiere PIN. Asigna el código correlativo. |
| UC17 | Consultar expedientes | Búsqueda por código, NNA, representante, estatus, prioridad, tipificación o sector. |
| UC18 | Editar datos del expediente | Administrador o consejero asignado. Requiere PIN. |
| UC19 | Cambiar estatus del expediente | Registrado, En revisión, Aprobado, Observado o Cerrado. Administrador o consejero asignado. |
| UC20 | Cambiar estatus físico | En Despacho o En Archivo Central. Administrador, consejero asignado o supervisor. |
| UC21 | Subir PDF resumen | Máximo 10 MB, solo PDF. Sustituye el anterior. |
| UC22 | Consultar PDF resumen | Descarga protegida por sesión. |
| UC23 | Quitar PDF resumen | El expediente se conserva. |
| UC24 | Registrar actuación en bitácora | Administrador o consejero asignado. Requiere PIN. |
| UC25 | Consultar bitácora | Actuaciones en orden cronológico. |
| UC26 | Registrar observación | Administrador o supervisor. Se guarda en el expediente y en la bitácora con el mismo texto, en una sola transacción. |
| UC27 | Consultar observaciones | Lista de observaciones con autor y fecha. |

**Rutas:** `GET /api/expedientes`, `POST /api/expedientes`, `GET /api/expedientes/{expediente}`, `PUT /api/expedientes/{expediente}`, `GET` y `POST /api/expedientes/{expediente}/bitacora`, `GET` y `POST /api/expedientes/{expediente}/observaciones`, `GET`, `POST` y `DELETE /api/expedientes/{expediente}/resumen`.

**Pantalla:** `Modulos/Expedientes.jsx`, con las pestañas Resumen, Bitácora, Observaciones, Espejo Digital y Plantillas.

**Estatus del expediente:** `Registrado` (inicial), `En revisión`, `Aprobado`, `Observado`, `Cerrado`. Al pasar a `Cerrado` se guarda `cerrado_en`; al salir de ese estatus, se borra.

**Estatus físico:** `Pendiente` (inicial), `En Despacho`, `En Archivo Central`.

**Prioridad:** `Alta`, `Media` (inicial), `Baja`.

**Tipificación:** Maltrato Físico, Abuso Sexual, Negligencia, Acoso Escolar, Trabajo Infantil, Violencia Psicológica, Abandono, Explotación u Otro.

### 5.5 Asignación de casos

**Propósito:** repartir los expedientes entre los consejeros. Un caso une un expediente con un consejero responsable.

**Actores:** administrador y supervisor (asignar y reasignar). Ver consultas en la tabla.

| Código | Caso de uso | Reglas |
|---|---|---|
| UC30 | Asignar caso a consejero | Reparto rotativo (menor carga) o manual. Solo administrador o supervisor. Requiere PIN. |
| UC31 | Reasignar caso | Cambia `asignado_a`. Solo administrador o supervisor. Requiere PIN. |
| UC32 | Actualizar estatus del caso | Pendiente, En proceso, Resuelto o Cerrado. Requiere PIN. |
| UC33 | Consultar casos | Filtros por estatus y consejero. |
| UC34 | Consultar lista de consejeros | Solo consejeros activos, sin datos de cuenta. |

**Rutas:** `GET /api/casos`, `POST /api/casos`, `GET /api/casos/consejeros`, `GET /api/casos/{caso}`, `PUT /api/casos/{caso}`.

**Pantalla:** `Modulos/AsignacionCasos.jsx`. Carga los casos, los consejeros y los expedientes por separado: si una fuente falla, las demás siguen mostrándose.

### 5.6 Solicitudes de archivo

**Propósito:** pedir y seguir el préstamo de expedientes físicos del archivo.

**Actores:** todos los roles con el módulo `solicitudArchivos`.

| Código | Caso de uso | Reglas |
|---|---|---|
| UC35 | Crear solicitud de archivo | Código `SOL-`. Requiere PIN. |
| UC36 | Actualizar solicitud de archivo | Estatus, fechas y ubicación física. Requiere PIN. |
| UC37 | Consultar solicitudes de archivo | Lista y detalle. |

**Rutas:** `GET /api/solicitudes`, `POST /api/solicitudes`, `GET /api/solicitudes/{solicitud}`, `PUT /api/solicitudes/{solicitud}`.

**Estatus:** Pendiente (inicial), En proceso, Completado, Rechazado, Disponible, Reservado, Prestado, Devuelto, En consulta, Extraviado, En digitalización.

**Pantalla:** `Modulos/SolicitudArchivos.jsx`.

### 5.7 Plantillas y documentos

**Propósito:** redactar documentos oficiales a partir de plantillas, emitirlos con PIN y dejar constancia de cada salida.

**Actores:** administrador por defecto. Otros roles pueden recibir el módulo desde la matriz; las reglas de propiedad se aplican igual.

| Código | Caso de uso | Reglas |
|---|---|---|
| UC40 | Gestionar plantillas | Crear y editar. Requiere PIN. |
| UC41 | Consultar plantillas | Catálogo de plantillas activas. |
| UC42 | Crear borrador de documento | Basado en una plantilla y, opcionalmente, en un expediente. Requiere PIN. |
| UC43 | Editar borrador | Redactor, administrador o consejero asignado al expediente. Requiere PIN. |
| UC44 | Emitir documento | Convierte el borrador en `Emitido`. Irreversible. Requiere PIN. |
| UC45 | Descargar o imprimir | Cada salida se registra en el historial, aunque el documento ya esté emitido. |
| UC46 | Descartar borrador | Redactor o administrador. Los emitidos no se pueden descartar. Requiere PIN. |

**Rutas:** `GET /api/plantillas`, `POST /api/plantillas`, `GET /api/plantillas/{plantilla}`, `PUT /api/plantillas/{plantilla}`, `GET /api/documentos`, `POST /api/documentos`, `PUT /api/documentos/{documento}`, `DELETE /api/documentos/{documento}`, `POST /api/documentos/{documento}/emitir`, `POST /api/documentos/{documento}/descarga`.

**Estados del documento:** `Borrador` (inicial) y `Emitido`.

**Pantalla:** `Modulos/Plantillas.jsx`. Los PDF se generan en el navegador con jsPDF y jspdf-autotable, usando el membrete de la configuración.

### 5.8 Reportes

**Propósito:** estadísticas por periodo, tipificación y sector.

**Actores:** administrador y supervisor por defecto.

| Código | Caso de uso | Reglas |
|---|---|---|
| UC47 | Consultar reportes | Filtros de periodo, tipificación y sector. |

**Ruta:** `GET /api/reportes`. Parámetros opcionales: `desde`, `hasta` (no anterior a `desde`), `tipificacion`, `sector`.

**Contenido de la respuesta** (`ReporteController@index`): periodo consultado, filtros disponibles, expedientes (total, cerrados, por estatus, prioridad, sector y tipificación), resolución (expedientes cerrados y días promedio hasta el cierre), casos y solicitudes agrupados por estatus.

**Pantalla:** `Modulos/Reportes.jsx`.

### 5.9 Historial

**Propósito:** saber quién hizo cada acción, cuándo, desde qué equipo, qué registro afectó y qué cambió.

**Actores:** administrador y supervisor por defecto.

| Código | Caso de uso | Reglas |
|---|---|---|
| UC50 | Consultar historial | Filtros por usuario, fecha, módulo, acción, estado y tipo de registro. Paginado en el servidor. |
| UC51 | Ver línea de tiempo de un registro | Todo lo ocurrido con un registro. En un expediente incluye sus observaciones y su bitácora. |
| UC52 | Exportar historial a CSV | Una línea por cada campo cambiado. Compatible con Excel (separador `;`, BOM UTF-8). |

**Rutas:** `GET /api/historial`, `GET /api/historial/registro/{tipo}/{id}`, `GET /api/historial/exportar`.

**Tipos de registro aceptados en la línea de tiempo:** Expediente, Nna, Representante, Documento, Caso, SolicitudArchivo, Plantilla, User, Configuracion.

**Referencia legible:** cada entrada muestra el código o nombre del registro afectado (`referencia`), y los valores de claves foráneas se muestran como nombres (sección 13).

**Pantalla:** `Modulos/HistorialSistema.jsx`. La línea de tiempo por registro existe en la API, pero no tiene pantalla propia.

### 5.10 Usuarios

**Propósito:** crear y administrar las cuentas.

**Actores:** administrador.

| Código | Caso de uso | Reglas |
|---|---|---|
| UC53 | Gestionar usuarios | Crear, editar, habilitar o deshabilitar. Requiere PIN. El nombre de usuario y la cédula no pueden repetirse. |
| UC54 | Cambiar contraseña de otro usuario | Campo opcional en la edición. Si queda vacío, no cambia. |

**Rutas:** `GET /api/usuarios`, `POST /api/usuarios`, `GET /api/usuarios/{user}`, `PUT /api/usuarios/{user}`.

**Pantalla:** `Modulos/Usuarios.jsx`.

### 5.11 Configuración

**Propósito:** ajustes del sistema, membrete, contacto, umbrales y matriz de permisos.

**Actores:** administrador.

| Código | Caso de uso | Reglas |
|---|---|---|
| UC55 | Configurar permisos por rol | Qué módulos ve cada rol (matriz). Requiere PIN. |
| UC56 | Configurar parámetros del sistema | Umbrales, membrete y datos de contacto. Requiere PIN. |

**Rutas:** `GET /api/configuracion`, `GET /api/configuracion/categoria/{categoria}`, `GET /api/configuracion/{clave}`, `PUT /api/configuracion/{clave}`, `POST /api/configuracion/multiple`.

**Pantalla:** `Modulos/Configuracion.jsx`, con la matriz de `componentes/PermisosPorRol.jsx`.

---

## 6. Referencia de la API

Todas las rutas empiezan por `/api`. Salvo `POST /api/login`, todas exigen un token de Sanctum válido y un rol conocido. La columna "Módulo" indica el permiso que la matriz debe conceder. La columna "Requiere PIN" indica si la petición debe incluir la cabecera `X-PIN`.

Además de las reglas de propiedad de la sección 3.3, algunas rutas aplican reglas internas que el listado no muestra; se describen en las secciones de cada módulo.

| Método | Ruta | Módulo (permiso) | Requiere PIN | Controlador@método |
|---|---|---|---|---|
| `GET` | `/api/casos` | asignacionCasos | No | `CasoController@index` |
| `POST` | `/api/casos` | asignacionCasos | Sí | `CasoController@store` |
| `GET` | `/api/casos/consejeros` | asignacionCasos | No | `CasoController@consejeros` |
| `GET` | `/api/casos/{caso}` | asignacionCasos | No | `CasoController@show` |
| `PUT` | `/api/casos/{caso}` | asignacionCasos | Sí | `CasoController@update` |
| `GET` | `/api/configuracion` | configuracion | No | `ConfiguracionController@index` |
| `GET` | `/api/configuracion/categoria/{categoria}` | configuracion | No | `ConfiguracionController@obtenerPorCategoria` |
| `POST` | `/api/configuracion/multiple` | configuracion | Sí | `ConfiguracionController@updateMultiple` |
| `GET` | `/api/configuracion/{clave}` | configuracion | No | `ConfiguracionController@show` |
| `PUT` | `/api/configuracion/{clave}` | configuracion | Sí | `ConfiguracionController@update` |
| `GET` | `/api/documentos` | plantillas | No | `DocumentoController@index` |
| `POST` | `/api/documentos` | plantillas | Sí | `DocumentoController@store` |
| `DELETE` | `/api/documentos/{documento}` | plantillas | Sí | `DocumentoController@destroy` |
| `PUT` | `/api/documentos/{documento}` | plantillas | Sí | `DocumentoController@update` |
| `POST` | `/api/documentos/{documento}/descarga` | plantillas | Sí | `DocumentoController@registrarDescarga` |
| `POST` | `/api/documentos/{documento}/emitir` | plantillas | Sí | `DocumentoController@emitir` |
| `GET` | `/api/expedientes` | expedientes | No | `ExpedienteController@index` |
| `POST` | `/api/expedientes` | expedientes | Sí | `ExpedienteController@store` |
| `GET` | `/api/expedientes/{expediente}` | expedientes | No | `ExpedienteController@show` |
| `PUT` | `/api/expedientes/{expediente}` | expedientes | Sí | `ExpedienteController@update` |
| `GET` | `/api/expedientes/{expediente}/bitacora` | expedientes | No | `BitacoraController@index` |
| `POST` | `/api/expedientes/{expediente}/bitacora` | expedientes | Sí | `BitacoraController@store` |
| `GET` | `/api/expedientes/{expediente}/observaciones` | expedientes | No | `ObservacionExpedienteController@index` |
| `POST` | `/api/expedientes/{expediente}/observaciones` | expedientes | Sí | `ObservacionExpedienteController@store` |
| `DELETE` | `/api/expedientes/{expediente}/resumen` | expedientes | Sí | `ResumenExpedienteController@destroy` |
| `GET` | `/api/expedientes/{expediente}/resumen` | expedientes | No | `ResumenExpedienteController@show` |
| `POST` | `/api/expedientes/{expediente}/resumen` | expedientes | Sí | `ResumenExpedienteController@store` |
| `GET` | `/api/historial` | historial | No | `HistorialController@index` |
| `GET` | `/api/historial/exportar` | historial | No | `HistorialController@exportar` |
| `GET` | `/api/historial/registro/{tipo}/{id}` | historial | No | `HistorialController@porRegistro` |
| `GET` | `/api/institucion` | — | No | `ConfiguracionController@institucion` |
| `POST` | `/api/login` | — | No | `AuthController@login` |
| `POST` | `/api/logout` | — | No | `AuthController@logout` |
| `GET` | `/api/me` | — | No | `AuthController@me` |
| `POST` | `/api/me/password` | — | Sí | `AuthController@changePassword` |
| `GET` | `/api/me/permisos` | — | No | `AuthController@permisos` |
| `GET` | `/api/nna` | nna | No | `NnaController@index` |
| `POST` | `/api/nna` | nna | Sí | `NnaController@store` |
| `GET` | `/api/nna/verificar/{documento}` | nna | No | `NnaController@verificarDocumento` |
| `GET` | `/api/nna/{nna}` | nna | No | `NnaController@show` |
| `PUT` | `/api/nna/{nna}` | nna | Sí | `NnaController@update` |
| `GET` | `/api/panel` | principal | No | `PanelController@index` |
| `POST` | `/api/pin/change` | — | No | `AuthController@changePin` |
| `POST` | `/api/pin/setup` | — | No | `AuthController@setupPin` |
| `POST` | `/api/pin/verify` | — | No | `AuthController@verifyPin` |
| `GET` | `/api/plantillas` | plantillas | No | `PlantillaController@index` |
| `POST` | `/api/plantillas` | plantillas | Sí | `PlantillaController@store` |
| `GET` | `/api/plantillas/{plantilla}` | plantillas | No | `PlantillaController@show` |
| `PUT` | `/api/plantillas/{plantilla}` | plantillas | Sí | `PlantillaController@update` |
| `PUT` | `/api/profile` | — | Sí | `AuthController@updateProfile` |
| `GET` | `/api/reportes` | reportes | No | `ReporteController@index` |
| `GET` | `/api/representantes` | representantes | No | `RepresentanteController@index` |
| `POST` | `/api/representantes` | representantes | Sí | `RepresentanteController@store` |
| `GET` | `/api/representantes/buscar/{cedula}` | representantes | No | `RepresentanteController@buscarPorCedula` |
| `GET` | `/api/representantes/{representante}` | representantes | No | `RepresentanteController@show` |
| `PUT` | `/api/representantes/{representante}` | representantes | Sí | `RepresentanteController@update` |
| `GET` | `/api/solicitudes` | solicitudArchivos | No | `SolicitudArchivoController@index` |
| `POST` | `/api/solicitudes` | solicitudArchivos | Sí | `SolicitudArchivoController@store` |
| `GET` | `/api/solicitudes/{solicitud}` | solicitudArchivos | No | `SolicitudArchivoController@show` |
| `PUT` | `/api/solicitudes/{solicitud}` | solicitudArchivos | Sí | `SolicitudArchivoController@update` |
| `GET` | `/api/usuarios` | usuarios | No | `UsuarioController@index` |
| `POST` | `/api/usuarios` | usuarios | Sí | `UsuarioController@store` |
| `GET` | `/api/usuarios/{user}` | usuarios | No | `UsuarioController@show` |
| `PUT` | `/api/usuarios/{user}` | usuarios | Sí | `UsuarioController@update` |

---

## 7. Controladores

Todos están en `app/Http/Controllers/Api/` y extienden `App\Http\Controllers\Controller`.

| Controlador | Responsabilidad | Métodos |
|---|---|---|
| `AuthController` | Sesión, perfil, PIN y contraseña propia | `login`, `logout`, `me`, `permisos`, `updateProfile`, `setupPin`, `verifyPin`, `changePin`, `changePassword`; privado `perfil`, `registrar` |
| `PanelController` | Resumen del panel principal | `index` |
| `NnaController` | Registro y consulta de NNA | `index`, `store`, `verificarDocumento`, `show`, `update` |
| `RepresentanteController` | Registro y consulta de representantes | `index`, `store`, `buscarPorCedula`, `show`, `update` |
| `ExpedienteController` | Expedientes y su ciclo de vida | `index`, `store`, `show`, `update` |
| `BitacoraController` | Actuaciones de la bitácora | `index`, `store` |
| `ObservacionExpedienteController` | Observaciones de la secretaría | `index`, `store` |
| `ResumenExpedienteController` | PDF resumen del expediente | `store`, `show`, `destroy`; privados `exigirEdicion`, `borrarArchivo`, `registrar` |
| `CasoController` | Asignación de casos y lista de consejeros | `index`, `consejeros`, `store`, `show`, `update` |
| `SolicitudArchivoController` | Solicitudes de archivo | `index`, `store`, `show`, `update` |
| `PlantillaController` | Plantillas | `index`, `store`, `show`, `update` |
| `DocumentoController` | Borradores y documentos emitidos | `index`, `store`, `update`, `emitir`, `registrarDescarga`, `destroy`; privados `validar`, `exigirModificacion`, `rechazarSiEmitido` |
| `ReporteController` | Estadísticas | `index`; privados para cada bloque |
| `HistorialController` | Consulta, línea de tiempo y exportación del historial | `index`, `porRegistro`, `exportar`; privados `anotarReferencias`, `resolverValores`, `etiqueta`, `consultaFiltrada`, `resumen`, `opciones` |
| `UsuarioController` | Gestión de cuentas | `index`, `store`, `show`, `update` |
| `ConfiguracionController` | Configuración y membrete | `index`, `show`, `update`, `updateMultiple`, `institucion`, `obtenerPorCategoria` |

---

## 8. Modelos

Todos están en `app/Models/`. Los nombres de tabla y columnas están en `analisis_base_de_datos.md`.

| Modelo | Tabla | Relaciones | Notas |
|---|---|---|---|
| `User` | `users` | — | Atributos asignables: nombre, correo, contraseña, usuario, rol, nombre visible, teléfono, cargo, PIN, PIN configurado y activo. Oculta contraseña, token y PIN. |
| `Nna` | `nna` | `expedientes` (hasMany) | Documento de identidad único. |
| `Representante` | `representantes` | `expedientes` (hasMany); atributo `nombre_completo` | Cédula única. |
| `Expediente` | `expedientes` | `nna`, `representante`, `registradoPor` (belongsTo); `bitacoras`, `casos`, `observacionesExpediente`, `solicitudesArchivo` (hasMany) | Atributos calculados `nna_nombre` y `representante_nombre`. `fecha` y `cerrado_en` tienen formato propio. |
| `Bitacora` | `bitacoras` | `expediente`, `usuario` (belongsTo) | `fecha` sin hora. |
| `Caso` | `casos` | `expediente`, `asignadoA`, `asignadoPor` (belongsTo) | Código `CASO-`. |
| `SolicitudArchivo` | `solicitudes_archivo` | `expediente`, `solicitante` (belongsTo) | Código `SOL-`. |
| `Plantilla` | `plantillas` | `creadoPor` (belongsTo) | Atributo `activa`. |
| `Documento` | `documentos` | `expediente` (belongsTo), `creadoPor` (belongsTo) | `datos` se guarda como array (cast JSON). |
| `ObservacionExpediente` | `observaciones_expediente` | `expediente`, `usuario` (belongsTo) | Sin estado. |
| `Historial` | `historial` | `usuario` (belongsTo); `cambios` (hasMany) | Inmutable: al actualizar o eliminar lanza `LogicException`. |
| `HistorialCambio` | `historial_cambios` | `historial` (belongsTo) | Sin `updated_at`. |
| `Configuracion` | `configuraciones` | — | Métodos estáticos `obtener`, `establecer` y `obtenerTodas`. |

---

## 9. Base de datos

### 9.1 Resumen

- Motor: MariaDB 11. Base `sicep`.
- 13 tablas de negocio y 9 tablas técnicas de Laravel (sesiones, colas, caché, tokens, reseteo de contraseña y migraciones).
- Todas las claves foráneas tienen `ON DELETE RESTRICT`: no se puede borrar un registro que tenga hijos.
- El diagrama entidad-relación y el detalle de cada columna están en `docs/modelo_relacional.*` y `docs/analisis_base_de_datos.md`.

### 9.2 Tablas de negocio

| Tabla | Propósito |
|---|---|
| `users` | Cuentas de usuario |
| `nna` | Niños, niñas y adolescentes |
| `representantes` | Representantes legales |
| `expedientes` | Expediente central, con código correlativo |
| `bitacoras` | Actuaciones del expediente |
| `observaciones_expediente` | Observaciones de la secretaría |
| `casos` | Asignación de un expediente a un consejero |
| `solicitudes_archivo` | Préstamos de expedientes físicos |
| `plantillas` | Formatos de documento |
| `documentos` | Borradores y documentos emitidos |
| `historial` | Registro de acciones |
| `historial_cambios` | Cambios campo por campo de cada acción |
| `configuraciones` | Parámetros del sistema y la matriz de permisos |

### 9.3 Claves foráneas

Las 17 claves foráneas están en el diagrama. Hay además tres referencias sin clave foránea:

- `historial.registro_id`: apunta a tablas distintas según `registro_tipo` (relación polimórfica).
- `historial_cambios.valor_anterior` y `valor_nuevo`: guardan IDs cuando el campo es clave foránea. Se muestran como nombres al leer (sección 13.4).
- `sessions.user_id`: sin clave foránea.

### 9.4 Migraciones

Están en `api/database/migrations/`. Las más recientes del trabajo de esta fase:

- `2026_10_15_100000_create_historial_cambios_table.php`
- `2026_10_15_100100_add_indices_to_historial_table.php`
- `2026_10_15_100200_create_observaciones_expediente_table.php`

---

## 10. Middleware, reglas y servicios

### 10.1 Middleware

| Alias | Clase | Función |
|---|---|---|
| `role` | `App\Http\Middleware\CheckRole` | Comprueba que el rol del usuario esté en la lista de roles de la ruta. Responde 403. |
| `permiso` | `App\Http\Middleware\CheckPermiso` | Comprueba la matriz con `Permisos::permite`. Responde 403. |
| `verify.pin` | `App\Http\Middleware\VerifyPin` | Exige el PIN en `X-PIN`. Sin PIN configurado responde 403. Sin cabecera o con PIN incorrecto, 401. Tras 5 fallos en 60 segundos, 429. Registra el fallo en el historial. |
| `auth:sanctum` | Laravel | Exige un token válido. |

### 10.2 Reglas y servicios de `app/Support/`

| Clase | Función |
|---|---|
| `Jurisdiccion` | Reglas de propiedad de la sección 3.3. |
| `Permisos` | Matriz de módulos, roles configurables, valores predeterminados y `permite`. |
| `Auditoria` | Registra acciones y cambios campo por campo. Ver sección 13. |
| `ValoresHistorial` | Convierte claves foráneas del historial en nombres legibles. Ver sección 13.4. |
| `Correlativo` | Crea registros con código correlativo (`SICEP-URD-`, `CASO-`, `SOL-`) de forma segura frente a concurrencia. |
| `IntentosPin` | Cuenta los intentos fallidos de PIN por usuario: máximo 5, ventana de 60 segundos. |
| `Institucion` | Lee la configuración del membrete y la devuelve agrupada por categorías (`general`, `membrete`, `contacto`, `sistema`). |

### 10.3 Reglas de validación

| Regla | Ubicación | Función |
|---|---|---|
| `PasswordAlfanumerica` | `app/Rules/` | Exige letras y números, y que la contraseña no contenga el nombre de usuario. Se usa al crear o cambiar contraseñas. |

El PIN no usa esta regla: solo admite dígitos, de 4 a 6, con `regex:/^[0-9]+$/`.

---

## 11. Frontend

### 11.1 Tecnología

React 19 con Vite 8. Dependencias de producción: `react-data-table-component` (tablas), `jspdf` y `jspdf-autotable` (PDF), `xlsx` (hojas de cálculo) y `recharts` (gráficos).

### 11.2 Estructura

| Carpeta | Contenido |
|---|---|
| `src/` | `App.jsx`, `main.jsx`, `api.js` (cliente de la API), `exportar.js` (PDF), `formato.js` (fechas y números), `institucion.js` (membrete), `tablaEstilos.js`, `ayudas.js`, `hooks/` |
| `Modulos/` | Una pantalla por módulo (sección 5) y `SistemaInstitucional.jsx`, que contiene el inicio de sesión, el menú y el control de inactividad |
| `componentes/` | Componentes compartidos: `Campo`, `PinModal`, `PinSetupModal`, `SelectorConAlta`, `PermisosPorRol`, `StatCard`, `entradas` |

### 11.3 Cliente de la API (`src/api.js`)

- Constante `API_BASE = '/api'`.
- Funciones `getHeaders(pin, opciones)`: añaden `Authorization` y `X-PIN` cuando corresponde.
- Un método por operación (por ejemplo `getExpedientes`, `updateExpediente`, `createObservacion`, `getHistorial`, `exportarHistorial`, `changePassword`).
- `handleResponse` convierte los errores en excepciones con el mensaje del servidor.
- Estado de sesión en `localStorage`: `auth_token`, `pin_configurado` y `sicep_user`.

### 11.4 Confirmación con PIN

El hook `src/hooks/usePinAction` abre el diálogo `PinModal` antes de cada acción crítica y pasa el PIN a la función de la API. Si el usuario cancela, se lanza el error "Acción cancelada", que las pantallas ignoran.

### 11.5 Permisos en la interfaz

La interfaz oculta o deshabilita controles según el rol, pero **no es una medida de seguridad**: el servidor aplica las mismas reglas. Por ejemplo, el supervisor no puede cambiar el estatus del expediente (control deshabilitado) y el servidor también lo rechaza.

---

## 12. Seguridad

| Aspecto | Implementación |
|---|---|
| Transporte | Nginx de `web` sirve la aplicación y reenvía `/api` internamente. En producción, Caddy termina el TLS delante (según los comentarios de `docker/web.conf`). |
| Contraseñas | Hash con Laravel. Deben combinar letras y números y no contener el nombre de usuario. |
| PIN | Hash. Solo numérico, de 4 a 6 dígitos. Se pide para confirmar acciones. |
| Intentos de inicio de sesión | Máximo 5 fallos por usuario e IP en 60 segundos (`RateLimiter`). |
| Intentos de PIN | Máximo 5 fallos por usuario en 60 segundos (`IntentosPin`). |
| Tokens | Sanctum. Se revocan al cerrar sesión. No caducan en el servidor. |
| Inactividad | Cierre automático de sesión en el frontend tras 60 minutos sin actividad (`MINUTOS_INACTIVIDAD`). El servidor no lo valida. |
| Cabeceras HTTP | `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`. |
| Archivos | Los PDF resumen se guardan en el disco `local` (privado) y se sirven solo por la API. |
| Historial | Inmutable. Las contraseñas y los PIN nunca se guardan en él. |
| Trazabilidad | Cada escritura registra usuario, IP y fecha. Ver sección 13. |
| Base de datos | Solo accesible desde la red de Docker, y en el host solo en `127.0.0.1`. |

---

## 13. Auditoría e historial

### 13.1 Qué se registra

Cada acción que modifica datos, y cada evento de seguridad, genera una entrada en `historial`:

- inicio y cierre de sesión, y los intentos fallidos;
- cambios de perfil, PIN y contraseña;
- creación y edición de NNA, representantes, expedientes, casos, solicitudes, plantillas, documentos, usuarios y configuración;
- observaciones, actuaciones, PDF resumen;
- emisión, descarga o impresión y descarte de documentos;
- PIN incorrecto en una acción protegida.

Cada entrada guarda: usuario, acción, módulo, tipo y ID del registro, detalle en texto, estado (`Exitoso`, `Error` o `Pendiente`), IP y fecha.

### 13.2 Cambios campo por campo

Las modificaciones se guardan en `historial_cambios`: un renglón por campo, con el valor anterior y el nuevo. Al crear un registro se guardan sus valores iniciales. Al eliminar, sus últimos valores.

### 13.3 Servicio `Auditoria`

Todas las escrituras usan `App\Support\Auditoria`:

- `actualizar(modelo, datos)`: asigna los datos, calcula los cambios y guarda.
- `diferencias(modelo)`: calcula los cambios antes de guardar.
- `creacion(modelo)` y `eliminacion(modelo)`: valores iniciales y finales.
- `registrar(request, accion, modulo, detalle, registro, cambios, estado, usuario)`: escribe la entrada y sus cambios en una transacción.

Campos excluidos: `password`, `pin` y `remember_token`. Los campos de tipo lista se aplanan con notación de punto (`datos.campo`).

### 13.4 Valores legibles (`ValoresHistorial`)

Las claves foráneas se muestran como nombres, no como IDs:

| Campo | Se muestra como |
|---|---|
| `asignado_a`, `asignado_por`, `creado_por`, `registrado_por`, `solicitante_id`, `usuario_id` | Nombre visible del usuario, o su nombre completo |
| `expediente_id` | Código del expediente |
| `nna_id` | Nombre y apellido del NNA |
| `representante_id` | Nombre y apellido del representante |

Si el registro referenciado ya no existe, se muestra `Eliminado (ID n)`. La resolución se hace al leer, así que también corrige el historial anterior.

Una prueba (`test_todas_las_claves_foraneas_del_esquema_tienen_nombre_en_el_historial`) revisa que toda clave foránea de la base de datos tenga regla de nombre. Si se añade una nueva, la prueba falla hasta que se registre en `ValoresHistorial::CAMPOS`.

### 13.5 Consultas y exportación

- `GET /api/historial` pagina en el servidor (25 por defecto, máximo 100) y devuelve resumen y opciones de filtro.
- `GET /api/historial/registro/{tipo}/{id}` devuelve la línea de tiempo en orden cronológico.
- `GET /api/historial/exportar` devuelve un CSV con una línea por campo cambiado.

---

## 14. Configuración del sistema

### 14.1 Tabla `configuraciones`

Cada parámetro tiene clave, valor, tipo (`texto` o `numero`), categoría y descripción. Los seeders crean estos valores iniciales:

| Categoría | Claves |
|---|---|
| `general` | `nombre_institucion`, `nombre_corto`, `municipio`, `estado` |
| `membrete` | `membrete_titulo`, `membrete_subtitulo`, `membrete_tercero` |
| `contacto` | `direccion_institucion`, `telefono_institucion`, `email_institucion` |
| `sistema` | `dias_alerta_amarillo` (21), `dias_alerta_rojo` (25) |
| `permisos` (tipo `json`) | `permisos_supervisor`, `permisos_consejero`: módulos visibles por rol, generados por el seeder |

Los valores de los seeders no se sobrescriben en los arranques posteriores (`firstOrCreate`).

### 14.2 Umbrales de lapso

`dias_alerta_amarillo` y `dias_alerta_rojo` marcan en el listado de expedientes los casos próximos a vencer o vencidos. Se leen desde la configuración en el frontend.

### 14.3 Parámetros no utilizados

Existe una clave `tiempo_sesion_minutos` en una migración antigua. El frontend usa un valor fijo (60 minutos) y no la lee. Ver sección 16.

---

## 15. Pruebas

### 15.1 Suite

Archivo principal: `api/tests/Feature/ReglasDeAccesoTest.php`, con 21 pruebas que cubren:

- reglas de acceso por rol y propiedad (expedientes, bitácora, casos, documentos, observaciones);
- restricciones del supervisor (sin contenido, con estatus físico);
- contraseñas y PIN (reglas, cambio propio y de otros);
- inmutabilidad del historial y redacción de contraseñas;
- línea de tiempo, exportación CSV y referencias;
- nombres en el historial y cobertura de claves foráneas;
- lista de consejeros sin datos de cuenta.

### 15.2 Ejecución

Las pruebas usan MySQL (algunas migraciones son específicas de MySQL):

```bash
docker compose exec api php artisan test
```

En el último resultado registrado, las 21 pruebas de ese archivo pasan. `ExampleTest` falla porque pide la ruta `/`, que la API no define (ver sección 16).

### 15.3 Compilación del frontend

```bash
npm ci
npm run build
```

---

## 16. Limitaciones conocidas

| Tema | Situación |
|---|---|
| Inactividad | El cierre de sesión por 60 minutos solo ocurre en el navegador. El token no caduca en el servidor, y cerrar la pestaña sin cerrar sesión deja el token válido. |
| `tiempo_sesion_minutos` | La clave existe en la configuración, pero no la lee ningún código. |
| Línea de tiempo | La API existe, pero no hay pantalla propia para ver la historia de un expediente o persona. |
| Observaciones y `observaciones` | `expedientes.observaciones` es un campo de texto del expediente, distinto de las observaciones de la secretaría. Conviene decidir cuál se usa. |
| Casos duplicados | La base de datos no impide asignar dos casos al mismo expediente. La pantalla lo evita, pero solo a nivel de interfaz. |
| Roles | `users.role` es texto libre en la base de datos. La validación de roles está en la aplicación. |
| Documentos | `documentos.datos` es un campo de texto largo, sin normalizar. |
| Eliminación | Existen rutas `DELETE` para borradores de documentos y para el PDF resumen. Los documentos emitidos no se eliminan, y el expediente no tiene ruta de borrado. |
| Migración antigua | `2026_08_02_180000_drop_legacy_name_columns_from_expedientes` usa sintaxis de MySQL. No puede ejecutarse en SQLite. |
| Usuarios existentes | Los seeders no cambian contraseñas de usuarios ya creados. |
| Prueba de ejemplo | `ExampleTest` falla. Debe eliminarse o adaptarse. |
| Verificación manual | Las pantallas del frontend no están cubiertas por pruebas automáticas. |

---

## 17. Glosario

| Término | Significado |
|---|---|
| NNA | Niño, niña o adolescente atendido. |
| Expediente | Registro legal de la atención a un NNA. Tiene código `SICEP-URD-000000`. |
| Representante | Persona responsable legal del NNA. |
| Bitácora | Lista de actuaciones del expediente, con fecha, texto y autor. |
| Observación | Nota de la secretaría sobre un expediente. Se guarda también en la bitácora. |
| Caso | Asignación de un expediente a un consejero. Código `CASO-000000`. |
| Consejero asignado | Consejero responsable de un caso. Tiene derecho a modificar el expediente. |
| Secretaría | Rol supervisor. |
| URD | Unidad de Recepción del Documento. Módulo de registro inicial. |
| Plantilla | Formato de documento con datos variables. |
| Documento | Acto redactado a partir de una plantilla. Puede ser borrador o emitido. |
| Emitir | Convertir un borrador en documento oficial. Irreversible. |
| PIN | Número de 4 a 6 dígitos que confirma acciones críticas. |
| Espejo digital | Vista del estatus físico del expediente y su PDF resumen. |
| Historial | Registro inmutable de todas las acciones del sistema. |
| Jurisdicción | Reglas que limitan una acción al consejero asignado, al redactor o al administrador. |
| Sanctum | Biblioteca de Laravel para tokens de API. |
