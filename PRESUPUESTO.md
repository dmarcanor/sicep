# Presupuesto Completo - Sistema SICEP-NNA

## Metodología

- **Tarifa**: $3.50/hora
- **Sistema ya avanzado**, no desde cero
- **Plazo estimado**: 2-3 semanas (constante) / 4-5 semanas (parcial)

---

## Presupuesto Base

| # | Tarea | Horas | Costo |
|---|-------|-------|-------|
| 1 | Crear tabla NNA separada (migración, modelo, relaciones) | 6h | $21 |
| 2 | Agregar campos a expedientes (tipificación, causa, hora) | 3h | $10.50 |
| 3 | Implementar 2FA/PIN para acciones críticas | 6h | $21 |
| 4 | Mejorar validación de contraseñas | 1.5h | $5.25 |
| 5 | Agregar validación de permisos por rol | 5h | $17.50 |
| 6 | Conectar PanelPrincipal con API | 3h | $10.50 |
| 7 | Conectar Reportes con API | 6h | $21 |
| 8 | Conectar Usuarios con API | 4h | $14 |
| 9 | Conectar HistorialSistema con API | 2h | $7 |
| 10 | Conectar SolicitudArchivos con API | 3h | $10.50 |
| 11 | Conectar AsignacionCasos con API | 3h | $10.50 |
| 12 | Conectar Perfil con API | 1.5h | $5.25 |
| 13 | Implementar módulo de Configuración | 8h | $28 |
| 14 | Implementar permisos dinámicos por rol | 5h | $17.50 |
| 15 | Agregar validaciones (documento, fechas, teléfono, unicidad) | 4h | $14 |
| 16 | Implementar bloqueo/desbloqueo de usuarios | 2h | $7 |
| 17 | Completar historial de auditoría | 2h | $7 |
| | **SUBTOTAL BASE** | **66h** | **$231** |

---

## Módulo de Representantes - Elegir una opción

> **Problema actual**: Los datos del representante se escriben en cada expediente. Si una misma persona (ej: "Yolanda Rivas") tiene 3 NNA a cargo, sus datos aparecen 3 veces y podrían quedar diferentes en cada expediente. Se necesita una ficha única por representante, igual que para los NNA.

### Opción A - Solo corrección de base de datos

Se crea una tabla separada de representantes. Al registrar un expediente, se busca al representante por cédula: si ya existe se usa su ficha, si no, se crea una nueva. **No hay pantalla aparte** para gestionar representantes, todo se hace desde el formulario de expedientes.

- **Horas**: 3h
- **Costo**: $10.50
- **Ventaja**: Más económico, resuelve el problema de duplicación
- **Desventaja**: No se pueden ver ni editar representantes de forma independiente

### Opción B - Módulo completo de Representantes

Incluye todo lo de la Opción A **más** una pantalla dedicada donde se pueden:
- Listar y buscar todos los representantes registrados
- Ver qué NNA tiene cada representante a cargo
- Editar datos de contacto (teléfono, dirección)
- Agregar representantes nuevos sin necesidad de crear un expediente

- **Horas**: 6h
- **Costo**: $21
- **Ventaja**: Gestión completa e independiente de representantes
- **Desventaja**: Mayor costo

---

## Totales según opción elegida

| Opción | Subtotal Base | Representantes | **TOTAL** |
|--------|---------------|----------------|-----------|
| **Solo base de datos (A)** | $231 | $10.50 | **$241.50** |
| **Módulo completo (B)** | $231 | $21 | **$252** |
