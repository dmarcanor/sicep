# Análisis de la base de datos SICEP-NNA

Motor: MariaDB 11 (contenedor `db` de `compose.yaml`). Base: `sicep`.
Generado a partir de `information_schema` en la base en ejecución.
Se excluyen las tablas técnicas del framework (sesiones, colas, caché, tokens y migraciones).

Totales: 13 tablas, 144 columnas, 17 claves foráneas, 27 entradas de índice.

## Relaciones (claves foráneas)

| Tabla hija | Columna | Tabla padre | Columna | ON DELETE | ON UPDATE |
|---|---|---|---|---|---|
| `bitacoras` | `expediente_id` | `expedientes` | `id` | RESTRICT | RESTRICT |
| `bitacoras` | `usuario_id` | `users` | `id` | RESTRICT | RESTRICT |
| `casos` | `asignado_a` | `users` | `id` | RESTRICT | RESTRICT |
| `casos` | `expediente_id` | `expedientes` | `id` | RESTRICT | RESTRICT |
| `casos` | `asignado_por` | `users` | `id` | RESTRICT | RESTRICT |
| `documentos` | `expediente_id` | `expedientes` | `id` | RESTRICT | RESTRICT |
| `documentos` | `creado_por` | `users` | `id` | RESTRICT | RESTRICT |
| `expedientes` | `nna_id` | `nna` | `id` | RESTRICT | RESTRICT |
| `expedientes` | `representante_id` | `representantes` | `id` | RESTRICT | RESTRICT |
| `expedientes` | `registrado_por` | `users` | `id` | RESTRICT | RESTRICT |
| `historial` | `usuario_id` | `users` | `id` | RESTRICT | RESTRICT |
| `historial_cambios` | `historial_id` | `historial` | `id` | RESTRICT | RESTRICT |
| `observaciones_expediente` | `usuario_id` | `users` | `id` | RESTRICT | RESTRICT |
| `observaciones_expediente` | `expediente_id` | `expedientes` | `id` | RESTRICT | RESTRICT |
| `plantillas` | `creado_por` | `users` | `id` | RESTRICT | RESTRICT |
| `solicitudes_archivo` | `solicitante_id` | `users` | `id` | RESTRICT | RESTRICT |
| `solicitudes_archivo` | `expediente_id` | `expedientes` | `id` | RESTRICT | RESTRICT |

Relaciones sin clave foránea real (referencias lógicas):

- `historial.registro_id` apunta a distintas tablas según `historial.registro_tipo` (relación polimórfica).
- `historial_cambios.valor_anterior` y `valor_nuevo` guardan IDs cuando el campo es una clave foránea (ver `ValoresHistorial`).

## Tablas de negocio

### `bitacoras`

Filas aproximadas: 4

| Columna | Tipo | Nulo | Valor por defecto | Clave | Notas |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned | No | — | PK | auto_increment |
| `expediente_id` | bigint(20) unsigned | No | — | FK → `expedientes.id` (ON DELETE RESTRICT) | — |
| `usuario_id` | bigint(20) unsigned | No | — | FK → `users.id` (ON DELETE RESTRICT) | — |
| `fecha` | date | No | — | — | — |
| `nota` | text | No | — | — | — |
| `created_at` | timestamp | Sí | NULL | — | — |
| `updated_at` | timestamp | Sí | NULL | — | — |

Índices:
- `bitacoras_expediente_id_fecha_index` (normal) sobre `expediente_id,fecha`
- `bitacoras_usuario_id_foreign` (normal) sobre `usuario_id`

### `casos`

Filas aproximadas: 2

| Columna | Tipo | Nulo | Valor por defecto | Clave | Notas |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned | No | — | PK | auto_increment |
| `codigo` | varchar(255) | No | — | UNIQUE | — |
| `expediente_id` | bigint(20) unsigned | No | — | FK → `expedientes.id` (ON DELETE RESTRICT) | — |
| `asignado_a` | bigint(20) unsigned | No | — | FK → `users.id` (ON DELETE RESTRICT) | — |
| `asignado_por` | bigint(20) unsigned | No | — | FK → `users.id` (ON DELETE RESTRICT) | — |
| `tipo_asignacion` | enum('Rotativa','Manual') | No | 'Rotativa' | — | — |
| `motivo` | text | Sí | NULL | — | — |
| `estatus` | enum('Pendiente','En proceso','Resuelto','Cerrado') | No | 'Pendiente' | — | — |
| `observaciones` | text | Sí | NULL | — | — |
| `created_at` | timestamp | Sí | NULL | — | — |
| `updated_at` | timestamp | Sí | NULL | — | — |

Índices:
- `casos_asignado_a_foreign` (normal) sobre `asignado_a`
- `casos_asignado_por_foreign` (normal) sobre `asignado_por`
- `casos_codigo_unique` (único) sobre `codigo`
- `casos_expediente_id_foreign` (normal) sobre `expediente_id`

### `configuraciones`

Filas aproximadas: 14

| Columna | Tipo | Nulo | Valor por defecto | Clave | Notas |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned | No | — | PK | auto_increment |
| `clave` | varchar(255) | No | — | UNIQUE | — |
| `valor` | text | Sí | NULL | — | — |
| `tipo` | varchar(255) | No | 'texto' | — | — |
| `categoria` | varchar(255) | No | 'general' | — | — |
| `descripcion` | text | Sí | NULL | — | — |
| `created_at` | timestamp | Sí | NULL | — | — |
| `updated_at` | timestamp | Sí | NULL | — | — |

Índices:
- `configuraciones_clave_unique` (único) sobre `clave`

### `documentos`

Filas aproximadas: 0

| Columna | Tipo | Nulo | Valor por defecto | Clave | Notas |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned | No | — | PK | auto_increment |
| `expediente_id` | bigint(20) unsigned | Sí | NULL | FK → `expedientes.id` (ON DELETE RESTRICT) | — |
| `creado_por` | bigint(20) unsigned | No | — | FK → `users.id` (ON DELETE RESTRICT) | — |
| `plantilla` | varchar(255) | No | — | — | — |
| `titulo` | varchar(255) | No | — | — | — |
| `datos` | longtext | No | — | — | — |
| `estado` | enum('Borrador','Emitido') | No | 'Borrador' | — | — |
| `emitido_en` | timestamp | Sí | NULL | — | — |
| `created_at` | timestamp | Sí | NULL | — | — |
| `updated_at` | timestamp | Sí | NULL | — | — |

Índices:
- `documentos_creado_por_foreign` (normal) sobre `creado_por`
- `documentos_expediente_id_estado_index` (normal) sobre `expediente_id,estado`

### `expedientes`

Filas aproximadas: 15

| Columna | Tipo | Nulo | Valor por defecto | Clave | Notas |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned | No | — | PK | auto_increment |
| `nna_id` | bigint(20) unsigned | No | — | FK → `nna.id` (ON DELETE RESTRICT) | — |
| `representante_id` | bigint(20) unsigned | No | — | FK → `representantes.id` (ON DELETE RESTRICT) | — |
| `codigo` | varchar(255) | No | — | UNIQUE | — |
| `fecha` | date | No | — | — | — |
| `hora_registro` | time | Sí | NULL | — | — |
| `sector` | varchar(255) | No | — | — | — |
| `estatus` | enum('Registrado','En revisión','Aprobado','Observado','Cerrado') | No | 'Registrado' | — | — |
| `estatus_fisico` | enum('Pendiente','En Despacho','En Archivo Central') | No | 'Pendiente' | — | — |
| `cerrado_en` | timestamp | Sí | NULL | — | — |
| `prioridad` | enum('Alta','Media','Baja') | No | 'Media' | — | — |
| `tipificacion` | enum('Maltrato Físico','Abuso Sexual','Negligencia','Acoso Escolar','Trabajo Infantil','Violencia Psicológica','Abandono','Explotación','Otro') | Sí | NULL | — | — |
| `causa` | text | Sí | NULL | — | — |
| `observaciones` | text | Sí | NULL | — | — |
| `resumen_pdf_ruta` | varchar(255) | Sí | NULL | — | — |
| `resumen_pdf_nombre` | varchar(255) | Sí | NULL | — | — |
| `registrado_por` | bigint(20) unsigned | No | — | FK → `users.id` (ON DELETE RESTRICT) | — |
| `created_at` | timestamp | Sí | NULL | — | — |
| `updated_at` | timestamp | Sí | NULL | — | — |

Índices:
- `expedientes_codigo_unique` (único) sobre `codigo`
- `expedientes_nna_id_foreign` (normal) sobre `nna_id`
- `expedientes_registrado_por_foreign` (normal) sobre `registrado_por`
- `expedientes_representante_id_foreign` (normal) sobre `representante_id`

### `historial`

Filas aproximadas: 50

| Columna | Tipo | Nulo | Valor por defecto | Clave | Notas |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned | No | — | PK | auto_increment |
| `usuario_id` | bigint(20) unsigned | No | — | FK → `users.id` (ON DELETE RESTRICT) | — |
| `accion` | varchar(255) | No | — | — | — |
| `modulo` | varchar(255) | No | — | — | — |
| `registro_tipo` | varchar(255) | Sí | NULL | índice | — |
| `registro_id` | bigint(20) unsigned | Sí | NULL | — | — |
| `detalles` | text | Sí | NULL | — | — |
| `estado` | enum('Exitoso','Error','Pendiente') | No | 'Exitoso' | — | — |
| `ip_address` | varchar(255) | Sí | NULL | — | — |
| `created_at` | timestamp | Sí | NULL | índice | — |
| `updated_at` | timestamp | Sí | NULL | — | — |

Índices:
- `historial_created_at_index` (normal) sobre `created_at`
- `historial_registro_tipo_registro_id_index` (normal) sobre `registro_tipo,registro_id`
- `historial_usuario_id_foreign` (normal) sobre `usuario_id`

### `historial_cambios`

Filas aproximadas: 21

| Columna | Tipo | Nulo | Valor por defecto | Clave | Notas |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned | No | — | PK | auto_increment |
| `historial_id` | bigint(20) unsigned | No | — | FK → `historial.id` (ON DELETE RESTRICT) | — |
| `campo` | varchar(255) | No | — | — | — |
| `valor_anterior` | text | Sí | NULL | — | — |
| `valor_nuevo` | text | Sí | NULL | — | — |
| `created_at` | timestamp | No | current_timestamp() | — | — |

Índices:
- `historial_cambios_historial_id_foreign` (normal) sobre `historial_id`

### `nna`

Filas aproximadas: 15

| Columna | Tipo | Nulo | Valor por defecto | Clave | Notas |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned | No | — | PK | auto_increment |
| `documento_identidad` | varchar(255) | No | — | UNIQUE | — |
| `nombres` | varchar(255) | No | — | — | — |
| `apellidos` | varchar(255) | No | — | — | — |
| `fecha_nacimiento` | date | No | — | — | — |
| `sexo` | enum('Masculino','Femenino') | No | — | — | — |
| `lugar_nacimiento` | varchar(255) | Sí | NULL | — | — |
| `observaciones` | text | Sí | NULL | — | — |
| `created_at` | timestamp | Sí | NULL | — | — |
| `updated_at` | timestamp | Sí | NULL | — | — |

Índices:
- `nna_documento_identidad_unique` (único) sobre `documento_identidad`

### `observaciones_expediente`

Filas aproximadas: 0

| Columna | Tipo | Nulo | Valor por defecto | Clave | Notas |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned | No | — | PK | auto_increment |
| `expediente_id` | bigint(20) unsigned | No | — | FK → `expedientes.id` (ON DELETE RESTRICT) | — |
| `usuario_id` | bigint(20) unsigned | No | — | FK → `users.id` (ON DELETE RESTRICT) | — |
| `texto` | text | No | — | — | — |
| `created_at` | timestamp | Sí | NULL | — | — |
| `updated_at` | timestamp | Sí | NULL | — | — |

Índices:
- `observaciones_expediente_expediente_id_created_at_index` (normal) sobre `expediente_id,created_at`
- `observaciones_expediente_usuario_id_foreign` (normal) sobre `usuario_id`

### `plantillas`

Filas aproximadas: 0

| Columna | Tipo | Nulo | Valor por defecto | Clave | Notas |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned | No | — | PK | auto_increment |
| `nombre` | varchar(255) | No | — | — | — |
| `tipo` | varchar(255) | No | — | — | — |
| `contenido` | text | No | — | — | — |
| `creado_por` | bigint(20) unsigned | No | — | FK → `users.id` (ON DELETE RESTRICT) | — |
| `activa` | tinyint(1) | No | 1 | — | — |
| `created_at` | timestamp | Sí | NULL | — | — |
| `updated_at` | timestamp | Sí | NULL | — | — |

Índices:
- `plantillas_creado_por_foreign` (normal) sobre `creado_por`

### `representantes`

Filas aproximadas: 15

| Columna | Tipo | Nulo | Valor por defecto | Clave | Notas |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned | No | — | PK | auto_increment |
| `cedula` | varchar(255) | No | — | UNIQUE | — |
| `nombres` | varchar(255) | No | — | — | — |
| `apellidos` | varchar(255) | No | — | — | — |
| `telefono` | varchar(255) | Sí | NULL | — | — |
| `direccion` | varchar(255) | Sí | NULL | — | — |
| `email` | varchar(255) | Sí | NULL | — | — |
| `profesion` | varchar(255) | Sí | NULL | — | — |
| `lugar_trabajo` | varchar(255) | Sí | NULL | — | — |
| `created_at` | timestamp | Sí | NULL | — | — |
| `updated_at` | timestamp | Sí | NULL | — | — |

Índices:
- `representantes_cedula_unique` (único) sobre `cedula`

### `solicitudes_archivo`

Filas aproximadas: 0

| Columna | Tipo | Nulo | Valor por defecto | Clave | Notas |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned | No | — | PK | auto_increment |
| `codigo` | varchar(255) | No | — | UNIQUE | — |
| `expediente_id` | bigint(20) unsigned | No | — | FK → `expedientes.id` (ON DELETE RESTRICT) | — |
| `solicitante_id` | bigint(20) unsigned | No | — | FK → `users.id` (ON DELETE RESTRICT) | — |
| `solicitante_nombre` | varchar(255) | Sí | NULL | — | — |
| `cargo` | varchar(255) | Sí | NULL | — | — |
| `caso` | varchar(255) | Sí | NULL | — | — |
| `motivo` | text | Sí | NULL | — | — |
| `fecha_solicitud` | date | Sí | NULL | — | — |
| `fecha_prestamo` | date | Sí | NULL | — | — |
| `fecha_devolucion` | date | Sí | NULL | — | — |
| `ubicacion_archivo` | varchar(255) | Sí | NULL | — | — |
| `ubicacion_estante` | varchar(255) | Sí | NULL | — | — |
| `ubicacion_nivel` | varchar(255) | Sí | NULL | — | — |
| `ubicacion_caja` | varchar(255) | Sí | NULL | — | — |
| `documentos_solicitados` | text | Sí | NULL | — | — |
| `estatus` | enum('Pendiente','En proceso','Completado','Rechazado','Disponible','Reservado','Prestado','Devuelto','En consulta','Extraviado','En digitalización') | No | 'Pendiente' | — | — |
| `observaciones` | text | Sí | NULL | — | — |
| `fecha_entrega` | timestamp | Sí | NULL | — | — |
| `created_at` | timestamp | Sí | NULL | — | — |
| `updated_at` | timestamp | Sí | NULL | — | — |

Índices:
- `solicitudes_archivo_codigo_unique` (único) sobre `codigo`
- `solicitudes_archivo_expediente_id_foreign` (normal) sobre `expediente_id`
- `solicitudes_archivo_solicitante_id_foreign` (normal) sobre `solicitante_id`

### `users` (Usuarios)

Filas aproximadas: 3

| Columna | Nombre en español | Tipo | Nulo | Valor por defecto | Clave | Notas |
|---|---|---|---|---|---|---|
| `id` | Id | bigint(20) unsigned | No | — | PK | auto_increment |
| `name` | Nombre completo | varchar(255) | No | — | — | — |
| `username` | Nombre de usuario | varchar(255) | No | — | UNIQUE | — |
| `role` | Rol | varchar(255) | No | 'consejero' | — | — |
| `display_name` | Nombre para mostrar | varchar(255) | Sí | NULL | — | — |
| `email` | Correo electrónico | varchar(255) | No | — | UNIQUE | — |
| `email_verified_at` | Correo verificado el | timestamp | Sí | NULL | — | — |
| `password` | Contraseña | varchar(255) | No | — | — | — |
| `pin` | PIN | varchar(255) | Sí | NULL | — | — |
| `pin_configurado` | PIN configurado | tinyint(1) | No | 0 | — | — |
| `remember_token` | Token de sesión recordada | varchar(100) | Sí | NULL | — | — |
| `created_at` | Creado el | timestamp | Sí | NULL | — | — |
| `updated_at` | Actualizado el | timestamp | Sí | NULL | — | — |
| `phone` | Teléfono | varchar(255) | Sí | NULL | — | — |
| `position` | Cargo | varchar(255) | Sí | NULL | — | — |
| `active` | Activo | tinyint(1) | No | 1 | — | — |

Índices:
- `users_email_unique` (único) sobre `email`
- `users_username_unique` (único) sobre `username`
