# SICEP-NNA - Sistema de Protección de Niños, Niñas y Adolescentes

## Arquitectura

Este proyecto combina una aplicación React (frontend) con Laravel 13 (backend API) y MariaDB (base de datos).

### Estructura

```
lopna/
├── api/                    # Laravel 13 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   └── Models/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/api.php
│   └── .env
├── Modulos/                # Componentes React
├── src/
│   ├── api.js             # Cliente API
│   └── main.jsx
├── vite.config.js
└── package.json
```

## Configuración Actual

### Backend (Laravel 13)
- **Puerto**: 8000
- **Base de datos**: MariaDB (puerto 3306)
- **Autenticación**: Laravel Sanctum (tokens Bearer)

### Frontend (React + Vite)
- **Puerto**: 5173 (desarrollo)
- **Proxy API**: `/api/*` → `http://localhost:8000`

## Usuarios de Prueba

| Usuario    | Contraseña | Rol              |
|------------|------------|------------------|
| admin      | 1234       | administrador    |
| supervisor | 1234       | supervisor       |
| consejero  | 1234       | consejero        |

## Iniciar el Sistema

### 1. Iniciar MariaDB
```bash
docker start sicep-mariadb
```

### 2. Iniciar Laravel API
```bash
cd api
php artisan serve --host=0.0.0.0 --port=8000
```

### 3. Iniciar React (desarrollo)
```bash
npm run dev
```

### 4. Acceder
- **Frontend**: http://localhost:5173
- **API**: http://localhost:8000/api

## Endpoints API

### Autenticación
- `POST /api/login` - Iniciar sesión
- `POST /api/logout` - Cerrar sesión
- `GET /api/me` - Obtener usuario actual
- `PUT /api/profile` - Actualizar perfil

### Módulos
- `GET/POST /api/expedientes` - Expedientes
- `GET/POST /api/casos` - Casos
- `GET/POST /api/plantillas` - Plantillas
- `GET/POST /api/solicitudes` - Solicitudes de archivo
- `GET/POST /api/usuarios` - Usuarios
- `GET /api/historial` - Historial
- `GET /api/reportes` - Reportes
- `GET /api/panel` - Panel principal

## Estado de Integración

### Completado ✓
- [x] Laravel 13 instalado
- [x] MariaDB configurado
- [x] Migraciones creadas (usuarios, expedientes, casos, plantillas, solicitudes, historial)
- [x] Seeders con datos de prueba
- [x] Autenticación con Sanctum
- [x] API endpoints para todos los módulos
- [x] Cliente API en React (`src/api.js`)
- [x] Login integrado con backend
- [x] Proxy configurado en Vite

### Pendiente
- [ ] Actualizar componentes React para usar API en lugar de datos mock
  - [ ] PanelPrincipal
  - [ ] RecepcionURD
  - [ ] Usuarios
  - [ ] Reportes
  - [ ] Plantillas
  - [ ] HistorialSistema
  - [ ] AsignacionCasos
  - [ ] SolicitudArchivos
  - [ ] Configuracion
  - [ ] Perfil

## Comandos Útiles

### Laravel
```bash
cd api
php artisan migrate:fresh --seed    # Resetear BD
php artisan db:seed                 # Ejecutar seeders
php artisan route:list              # Ver rutas
php artisan make:model ModelName -m # Crear modelo + migración
```

### React
```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run preview    # Preview de build
```

### Docker
```bash
docker start sicep-mariadb    # Iniciar BD
docker stop sicep-mariadb     # Detener BD
docker ps                     # Ver contenedores
```

## Notas

- El frontend actualmente usa datos mock en algunos componentes
- La autenticación ya está completamente integrada con el backend
- Los tokens se guardan en localStorage
- El proxy de Vite redirige todas las peticiones `/api/*` al backend
