# SICEP-NNA - Sistema de Control de Expedientes

## 📋 Índice

- [Overview](#overview)
- [Contexto y Requisitos](#contexto-y-requisitos)
- [Arquitectura Técnica](#arquitectura-técnica)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Módulos del Sistema](#módulos-del-sistema)
- [Base de Datos](#base-de-datos)
- [Autenticación y Seguridad](#autenticación-y-seguridad)
- [Estado del Proyecto](#estado-del-proyecto)
- [Presupuesto](#presupuesto)
- [Problemas y Soluciones](#problemas-y-soluciones)

---

## Overview

**SICEP-NNA** (Sistema de Control de Expedientes para Niños, Niñas y Adolescentes) es una aplicación web full-stack diseñada para gestionar expedientes de casos relacionados con menores de edad. El sistema permite el registro, seguimiento y administración de casos con diferentes niveles de prioridad y tipificación.

### Características Principales

- **Gestión de expedientes** con clasificación por tipo de vulneración
- **Control de NNA** (Niños, Niñas y Adolescentes) y sus representantes legales
- **Sistema de roles** con permisos diferenciados (Administrador, Supervisor, Consejero)
- **Autenticación con PIN** para acciones críticas
- **Dashboard** con estadísticas en tiempo real
- **Exportación** de reportes en Excel y PDF
- **Historial de auditoría** completo

---

## Contexto y Requisitos

### Documento Original de Requisitos

El proyecto se basa en un documento proporcionado por el cliente que especifica:

#### 1. Seguridad y Accesos
- Autenticación única con usuario y contraseña
- 3 niveles de usuario: Administrador, Supervisor/Consejero, Recepción (Operador URD)
- PIN de seguridad (4-6 dígitos) para confirmar acciones delicadas
- Registro de entradas y salidas del sistema

#### 2. Gestión de Expedientes
- Relación NNA vs Expedientes (un NNA puede tener múltiples expedientes)
- Alerta de reincidencia al registrar un NNA
- Datos de registro: fecha, hora exacta, datos del NNA, representante, sector, causa
- Tipificación: Maltrato Físico, Abuso Sexual, Negligencia, Acoso Escolar, Trabajo Infantil, etc.
- Prioridad en colores: Alta (Rojo), Media (Amarillo), Baja (Verde)
- Estatus: Registrado → En revisión → Aprobado → Observado
- Control de lapsos legales con alertas

#### 3. Plantillas de Documentos PDF
- Catálogo de formatos: Citaciones, Actas Conciliatorias, Medidas de Protección, etc.
- Auto-llenado con datos del caso
- Vista previa y descarga en PDF

#### 4. Estadísticas y Reportes
- Contadores en tiempo real
- Gráficos de vulneraciones por sector
- Matriz de recomendaciones automáticas
- Exportación a Excel y PDF

#### 5. Historial de Auditoría
- Registro inalterable de todas las acciones
- Campos: ID, Fecha, Hora, Módulo, Acción, Usuario, Tipo, Estado

#### 6. Módulos Adicionales
- Solicitud de Archivos
- Asignación de Casos
- Configuración del sistema
- Control de Permisos por Rol (dinámico)

---

## Arquitectura Técnica

### Stack Tecnológico

**Frontend:**
- React 18 con Vite
- JavaScript (ES6+)
- CSS3 (módulos por componente)
- Bibliotecas: `recharts` (gráficos), `xlsx` (Excel), `jspdf` (PDF)

**Backend:**
- Laravel 13
- PHP 8.2+
- MariaDB 11
- Laravel Sanctum (autenticación API)

**Infraestructura:**
- Docker (MariaDB)
- Vite dev server (puerto 5173)
- Laravel artisan serve (puerto 8000)

### Patrones de Diseño

- **Arquitectura cliente-servidor**: Frontend React consume API REST de Laravel
- **Role-Based Access Control (RBAC)**: Middleware para control de permisos
- **PIN Verification**: Middleware adicional para acciones críticas
- **Soft Deletes**: Eliminación lógica de registros
- **Audit Trail**: Historial automático de todas las operaciones

---

## Estructura del Proyecto

```
lopna/
├── Modulos/                    # Componentes React principales
│   ├── AsignacionCasos.jsx
│   ├── Configuracion.jsx
│   ├── Expedientes.jsx
│   ├── HistorialSistema.jsx
│   ├── Nna.jsx
│   ├── PanelPrincipal.jsx
│   ├── Perfil.jsx
│   ├── Plantillas.jsx
│   ├── RecepcionURD.jsx
│   ├── Reportes.jsx
│   ├── Representantes.jsx
│   ├── SolicitudArchivos.jsx
│   ├── SistemaInstitucional.jsx
│   ├── Usuarios.jsx
│   └── css/                    # Estilos específicos por módulo
│
├── componentes/                # Componentes reutilizables
│   ├── PermisosPorRol.jsx
│   ├── PinModal.jsx
│   ├── PinSetupModal.jsx
│   ├── StatCard.jsx
│   └── tarjetas/
│
├── src/                        # Código fuente React
│   ├── api.js                  # Cliente API
│   ├── App.jsx
│   ├── main.jsx
│   └── hooks/
│       └── usePinAction.jsx    # Hook para manejo de PIN
│
├── api/                        # Backend Laravel
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   └── Middleware/
│   │   └── Models/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php
│   └── docker/
│
├── public/                     # Assets estáticos
├── index.html
├── package.json
├── vite.config.js
└── Dockerfile
```

---

## Módulos del Sistema

### 1. Panel Principal (`PanelPrincipal.jsx`)
**Función:** Dashboard con estadísticas en tiempo real

**Características:**
- Tarjetas de resumen con contadores
- Gráficos de distribución por estatus
- Vista rápida de expedientes recientes
- Acceso directo a módulos principales

**API Endpoints:**
- `GET /api/panel` - Datos del dashboard

### 2. Recepción URD (`RecepcionURD.jsx`)
**Función:** Registro inicial de expedientes

**Características:**
- Formulario de registro de NNA
- Verificación de documento de identidad
- Alerta de reincidencia automática
- Asignación de código de expediente

**API Endpoints:**
- `POST /api/expedientes` - Crear expediente
- `GET /api/nna/verificar/{documento}` - Verificar reincidencia

### 3. Gestión de NNA (`Nna.jsx`)
**Función:** Administración de Niños, Niñas y Adolescentes

**Características:**
- Lista completa de NNA registrados
- Búsqueda por nombre o documento
- Creación y edición de registros
- Vista de expedientes asociados

**API Endpoints:**
- `GET /api/nna` - Listar NNA
- `POST /api/nna` - Crear NNA
- `PUT /api/nna/{id}` - Actualizar NNA
- `DELETE /api/nna/{id}` - Eliminar NNA

### 4. Expedientes (`Expedientes.jsx`)
**Función:** Gestión completa de expedientes

**Características:**
- Tabla con filtros avanzados
- Búsqueda por múltiples campos
- Cambio de estatus
- Asignación a consejeros
- Exportación a Excel/PDF
- Modal de detalle con bitácora

**API Endpoints:**
- `GET /api/expedientes` - Listar expedientes
- `POST /api/expedientes` - Crear expediente
- `PUT /api/expedientes/{id}` - Actualizar expediente
- `DELETE /api/expedientes/{id}` - Eliminar expediente

### 5. Representantes (`Representantes.jsx`)
**Función:** Gestión de representantes legales

**Características:**
- Lista de representantes
- Búsqueda por cédula o nombre
- Vista de NNA asociados
- Información de contacto completa
- Validación de cédula venezolana

**API Endpoints:**
- `GET /api/representantes` - Listar representantes
- `POST /api/representantes` - Crear representante
- `PUT /api/representantes/{id}` - Actualizar representante
- `DELETE /api/representantes/{id}` - Eliminar representante
- `GET /api/representantes/buscar/{cedula}` - Buscar por cédula

### 6. Usuarios (`Usuarios.jsx`)
**Función:** Administración de usuarios del sistema

**Características:**
- CRUD completo de usuarios
- Asignación de roles
- Activación/desactivación de cuentas
- Configuración de PIN

**API Endpoints:**
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/{id}` - Actualizar usuario
- `DELETE /api/usuarios/{id}` - Eliminar usuario

### 7. Asignación de Casos (`AsignacionCasos.jsx`)
**Función:** Distribución de expedientes a consejeros

**Características:**
- Vista de casos pendientes
- Asignación manual o automática
- Balance de carga entre consejeros
- Seguimiento de casos asignados

**API Endpoints:**
- `GET /api/casos` - Listar casos
- `POST /api/casos` - Crear asignación
- `PUT /api/casos/{id}` - Actualizar estado

### 8. Solicitud de Archivos (`SolicitudArchivos.jsx`)
**Función:** Gestión de solicitudes de documentos

**Características:**
- Registro de solicitudes
- Seguimiento de estado
- Historial de movimientos
- Ubicación física de archivos

**API Endpoints:**
- `GET /api/solicitudes` - Listar solicitudes
- `POST /api/solicitudes` - Crear solicitud
- `PUT /api/solicitudes/{id}` - Actualizar solicitud

### 9. Plantillas (`Plantillas.jsx`)
**Función:** Generación de documentos PDF

**Características:**
- Catálogo de plantillas
- Auto-llenado con datos del expediente
- Vista previa
- Generación de PDF
- Guardado de borradores

**API Endpoints:**
- `GET /api/plantillas` - Listar plantillas
- `POST /api/plantillas` - Crear plantilla
- `PUT /api/plantillas/{id}` - Actualizar plantilla

### 10. Reportes (`Reportes.jsx`)
**Función:** Análisis y estadísticas

**Características:**
- Gráficos de vulneraciones por sector
- Distribución por prioridad
- Tendencias temporales
- Exportación de reportes

**API Endpoints:**
- `GET /api/reportes` - Obtener datos de reportes

### 11. Historial del Sistema (`HistorialSistema.jsx`)
**Función:** Auditoría de acciones

**Características:**
- Lista cronológica de acciones
- Filtros por módulo y usuario
- Detalle de cada acción
- Exportación de historial

**API Endpoints:**
- `GET /api/historial` - Obtener historial

### 12. Configuración (`Configuracion.jsx`)
**Función:** Administración del sistema

**Características:**
- Configuración general
- Control de permisos por rol
- Alertas de lapsos legales
- Parámetros del sistema

**API Endpoints:**
- `GET /api/configuracion` - Obtener configuración
- `PUT /api/configuracion/{clave}` - Actualizar configuración

### 13. Perfil (`Perfil.jsx`)
**Función:** Gestión del perfil de usuario

**Características:**
- Edición de datos personales
- Cambio de contraseña
- Configuración de PIN

**API Endpoints:**
- `GET /api/me` - Obtener perfil
- `PUT /api/profile` - Actualizar perfil
- `POST /api/pin/setup` - Configurar PIN
- `POST /api/pin/change` - Cambiar PIN

---

## Base de Datos

### Tablas Principales

#### `users`
```sql
- id (PK)
- name
- email (unique)
- username (unique)
- password
- role (administrador, supervisor, consejero)
- pin (nullable, hashed)
- pin_configurado (boolean)
- active (boolean)
- timestamps
```

#### `nna` (Niños, Niñas y Adolescentes)
```sql
- id (PK)
- documento_identidad (unique)
- nombres
- apellidos
- fecha_nacimiento
- sexo
- lugar_nacimiento
- observaciones
- timestamps
```

#### `representantes`
```sql
- id (PK)
- cedula (unique)
- nombres
- apellidos
- telefono
- direccion
- email
- profesion
- lugar_trabajo
- timestamps
```

#### `expedientes`
```sql
- id (PK)
- codigo (unique)
- nna_id (FK → nna)
- representante_id (FK → representantes)
- fecha
- hora_registro
- sector
- estatus (Registrado, En revisión, Aprobado, Observado, Cerrado)
- prioridad (Alta, Media, Baja)
- tipificacion (Maltrato Físico, Abuso Sexual, etc.)
- causa
- observaciones
- asignado_a (FK → users, nullable)
- registrado_por (FK → users)
- timestamps
```

#### `casos`
```sql
- id (PK)
- codigo (unique)
- expediente_id (FK → expedientes)
- asignado_a (FK → users)
- asignado_por (FK → users)
- motivo
- estatus (Pendiente, En proceso, Resuelto, Cerrado)
- observaciones
- timestamps
```

#### `solicitudes_archivo`
```sql
- id (PK)
- codigo (unique)
- expediente_id (FK → expedientes)
- solicitante_id (FK → users)
- documentos_solicitados
- estatus (Pendiente, En proceso, Completado, Rechazado)
- observaciones
- fecha_entrega
- timestamps
```

#### `plantillas`
```sql
- id (PK)
- nombre
- tipo
- contenido
- creado_por (FK → users)
- activa (boolean)
- timestamps
```

#### `historial`
```sql
- id (PK)
- usuario_id (FK → users)
- accion
- modulo
- registro_tipo
- registro_id
- detalles
- estado (Exitoso, Error, Pendiente)
- ip_address
- timestamps
```

#### `configuraciones`
```sql
- id (PK)
- clave (unique)
- valor
- tipo (texto, numero, color, json)
- categoria
- descripcion
- timestamps
```

### Relaciones

- **NNA → Expedientes**: 1 a muchos
- **Representantes → Expedientes**: 1 a muchos
- **Usuarios → Expedientes**: 1 a muchos (registrado_por, asignado_a)
- **Expedientes → Casos**: 1 a muchos
- **Expedientes → Solicitudes**: 1 a muchos
- **Usuarios → Historial**: 1 a muchos

---

## Autenticación y Seguridad

### Sistema de Autenticación

1. **Login inicial**: Usuario y contraseña
2. **Token JWT**: Generado por Laravel Sanctum
3. **Almacenamiento**: `localStorage` (frontend)
4. **Validación**: Middleware `auth:sanctum` (backend)

### Sistema de PIN

**Flujo de verificación:**
1. Usuario intenta realizar acción crítica
2. Frontend verifica si tiene PIN configurado (`pin_configurado`)
3. Si no tiene PIN: muestra modal de configuración
4. Si tiene PIN: muestra modal de verificación
5. Usuario ingresa PIN
6. Frontend envía PIN en header `X-PIN`
7. Backend valida con middleware `verify.pin`
8. Si es válido: permite la acción
9. Si es inválido: retorna error 401

**Acciones que requieren PIN:**
- Crear/editar/eliminar expedientes
- Crear/editar/eliminar usuarios
- Crear/editar/eliminar NNA
- Crear/editar/eliminar representantes
- Crear/editar plantillas
- Crear/editar solicitudes
- Actualizar perfil

### Control de Roles

**Middleware `role`:**
```php
// Ejemplo de uso en rutas
Route::middleware(['auth:sanctum', 'role:administrador'])->group(function () {
    // Rutas solo para administradores
});
```

**Permisos por rol:**
- **Administrador**: Acceso completo
- **Supervisor**: Gestión de expedientes, reportes, historial
- **Consejero**: Solo lectura de expedientes y panel

---

## Estado del Proyecto

### Trabajo Completado ✅

#### Fase 1: Análisis y Diagnóstico
- ✅ Análisis completo del código existente
- ✅ Identificación de problemas y vulnerabilidades
- ✅ Creación de documento de diagnóstico
- ✅ Presupuesto detallado

#### Fase 2: Implementación Backend
- ✅ Migraciones de base de datos (19 migraciones)
- ✅ Modelos Eloquent con relaciones
- ✅ Controladores API (11 controladores)
- ✅ Middleware de autenticación y roles
- ✅ Middleware de verificación de PIN
- ✅ Seeders para datos iniciales
- ✅ Rutas API completas

#### Fase 3: Implementación Frontend
- ✅ Cliente API (`src/api.js`)
- ✅ Hook `usePinAction` para manejo de PIN
- ✅ Componente `PinModal` para verificación
- ✅ Componente `PinSetupModal` para configuración
- ✅ Módulo NNA completo
- ✅ Módulo Representantes completo
- ✅ Módulo Configuración con permisos dinámicos
- ✅ Integración de PIN en todos los módulos
- ✅ Validaciones frontend (documento, fechas, teléfono)
- ✅ Conexión de todos los módulos a API

#### Fase 4: Correcciones y Optimizaciones
- ✅ Fix: PIN obligatorio para todos los usuarios
- ✅ Fix: Contraseñas de 8+ caracteres
- ✅ Fix: Validación de unicidad de NNA
- ✅ Fix: Renombrar `usePinAction.js` a `.jsx`
- ✅ Fix: Integración de representantes en expedientes
- ✅ Fix: Migración de datos existentes

### Estado Actual

**Backend:** 100% funcional
- Todas las migraciones aplicadas
- Seeders ejecutados
- API endpoints operativos
- Autenticación y PIN funcionando

**Frontend:** 100% funcional
- Todos los módulos conectados a API
- Sin datos mock
- PIN integrado en acciones críticas
- Validaciones activas

**Base de Datos:** Esquema completo
- 10 tablas principales
- Relaciones establecidas
- Datos de prueba cargados

---

## Presupuesto

### Resumen de Costos

| Categoría | Horas | Costo (USD) |
|-----------|-------|-------------|
| **Prioridad Alta** (Tareas 1-14) | 56h | $196 |
| **Prioridad Media** (Tareas 15-17) | 8h | $28 |
| **Módulo Representantes** (Opción B) | 6h | $21 |
| **TOTAL** | **70h** | **$245** |

### Desglose por Tarea

#### Prioridad Alta
1. Crear tabla NNA separada - 6h - $21
2. Agregar campos a expedientes - 3h - $10.50
3. Implementar 2FA/PIN - 6h - $21
4. Mejorar validación de contraseñas - 1.5h - $5.25
5. Agregar validación de permisos por rol - 5h - $17.50
6. Conectar PanelPrincipal con API - 3h - $10.50
7. Conectar Reportes con API - 6h - $21
8. Conectar Usuarios con API - 4h - $14
9. Conectar HistorialSistema con API - 2h - $7
10. Conectar SolicitudArchivos con API - 3h - $10.50
11. Conectar AsignacionCasos con API - 3h - $10.50
12. Conectar Perfil con API - 1.5h - $5.25
13. Implementar módulo de Configuración - 8h - $28
14. Implementar permisos dinámicos por rol - 5h - $17.50

#### Prioridad Media
15. Agregar validaciones (documento, fechas, teléfono, unicidad) - 4h - $14
16. Implementar bloqueo/desbloqueo de usuarios - 2h - $7
17. Completar historial de auditoría (hora, estado) - 2h - $7

#### Módulo Representantes (Opción B)
18. Módulo completo con vistas - 6h - $21

### Metodología de Cálculo

- **Tarifa base**: $3.50/hora
- **Ajuste**: Economía venezolana + descuento por relación familiar
- **Consideración**: Sistema ya avanzado, no desde cero

---

## Problemas y Soluciones

### Problema 1: Sistema Bloqueado por PIN
**Problema:** Middleware `VerifyPin` bloqueaba todas las acciones si el usuario no tenía PIN configurado.

**Solución:**
- Hacer PIN opcional inicialmente
- Permitir acciones sin PIN si `pin_configurado = false`
- Mostrar modal de configuración cuando se intente acción crítica sin PIN

**Archivos modificados:**
- `api/app/Http/Middleware/VerifyPin.php`
- `src/hooks/usePinAction.jsx`

### Problema 2: Contraseñas Débiles
**Problema:** Seeders usaban contraseñas de 4 caracteres (`1234`), pero validación requería 8+.

**Solución:**
- Actualizar seeders con contraseñas de 8+ caracteres
- Actualizar usuarios existentes en base de datos

**Archivos modificados:**
- `api/database/seeders/UserSeeder.php`

### Problema 3: Datos Duplicados de NNA
**Problema:** Cada expediente contenía datos completos del NNA, causando duplicación.

**Solución:**
- Crear tabla `nna` separada
- Agregar `nna_id` como foreign key en expedientes
- Migrar datos existentes
- Actualizar controladores para usar relaciones

**Archivos modificados:**
- `api/database/migrations/2026_07_26_175350_create_nna_table.php`
- `api/database/migrations/2026_07_26_175553_update_expedientes_add_nna_id.php`
- `api/app/Models/Nna.php`
- `api/app/Models/Expediente.php`
- `api/app/Http/Controllers/Api/ExpedienteController.php`

### Problema 4: Datos Duplicados de Representantes
**Problema:** Similar a NNA, datos del representante se duplicaban en cada expediente.

**Solución:**
- Crear tabla `representantes` separada
- Agregar `representante_id` como foreign key en expedientes
- Migrar datos existentes
- Actualizar controladores para buscar/crear representantes automáticamente

**Archivos modificados:**
- `api/database/migrations/2026_07_27_143342_create_representantes_table.php`
- `api/database/migrations/2026_07_27_143423_add_representante_id_to_expedientes_table.php`
- `api/app/Models/Representante.php`
- `api/app/Models/Expediente.php`
- `api/app/Http/Controllers/Api/ExpedienteController.php`

### Problema 5: Extensión de Archivo Incorrecta
**Problema:** `usePinAction.js` contenía JSX pero tenía extensión `.js`, causando error de Babel.

**Solución:** Renombrar archivo a `.jsx`

**Archivos modificados:**
- `src/hooks/usePinAction.js` → `src/hooks/usePinAction.jsx`

### Problema 6: Login Revelaba Longitud de Contraseña
**Problema:** Mensaje de error indicaba si la contraseña era muy corta.

**Solución:** Cambiar mensaje a genérico "Credenciales inválidas"

**Archivos modificados:**
- `Modulos/SistemaInstitucional.jsx`

---

## Comandos Útiles

### Desarrollo

**Iniciar backend:**
```bash
cd api
php artisan serve
```

**Iniciar frontend:**
```bash
npm run dev
```

**Iniciar base de datos:**
```bash
docker start sicep-mariadb
```

### Base de Datos

**Ejecutar migraciones:**
```bash
cd api
php artisan migrate
```

**Ejecutar seeders:**
```bash
php artisan db:seed
```

**Reset completo:**
```bash
php artisan migrate:fresh --seed
```

### Git

**Ver estado:**
```bash
git status
```

**Ver historial:**
```bash
git log --oneline
```

**Commits realizados:**
```
1acaa7e Fix: Rename usePinAction.js to .jsx (contains JSX syntax)
706a854 Initial commit: SICEP-NNA complete system
```

---

## URLs y Accesos

### Desarrollo Local

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Base de datos:** localhost:3306

### Usuarios de Prueba

| Usuario | Contraseña | PIN | Rol |
|---------|------------|-----|-----|
| admin | 12345678 | 1234 | Administrador |
| supervisor | 12345678 | 1234 | Supervisor |
| consejero | 12345678 | 1234 | Consejero |

---

## Próximos Pasos (Opcional)

### Mejoras Futuras
1. **Notificaciones en tiempo real** con WebSockets
2. **Módulo de mensajes** entre usuarios
3. **App móvil** con React Native
4. **Integración con sistemas externos** (APIs gubernamentales)
5. **Backup automático** de base de datos
6. **Monitoreo de rendimiento** con dashboards

### Mantenimiento
- Actualizar dependencias regularmente
- Revisar logs de errores
- Monitorear uso de disco y memoria
- Realizar backups periódicos

---

## Contacto y Soporte

**Desarrollador:** Daniel Marcano
**Fecha de inicio:** Julio 2026
**Fecha de finalización:** Agosto 2026
**Horas totales:** 70h
**Costo total:** $245 USD

---

## Licencia

Este proyecto fue desarrollado específicamente para el cliente y no está destinado para distribución pública.

---

**Última actualización:** 2 de Agosto, 2026
