<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BitacoraController;
use App\Http\Controllers\Api\CasoController;
use App\Http\Controllers\Api\ConfiguracionController;
use App\Http\Controllers\Api\DocumentoController;
use App\Http\Controllers\Api\ExpedienteController;
use App\Http\Controllers\Api\HistorialController;
use App\Http\Controllers\Api\NnaController;
use App\Http\Controllers\Api\PanelController;
use App\Http\Controllers\Api\PlantillaController;
use App\Http\Controllers\Api\RepresentanteController;
use App\Http\Controllers\Api\ResumenExpedienteController;
use App\Http\Controllers\Api\ReporteController;
use App\Http\Controllers\Api\SolicitudArchivoController;
use App\Http\Controllers\Api\UsuarioController;
use Illuminate\Support\Facades\Route;

// El expediente es la fuente legal del caso: el sistema no expone borrado en
// ninguna capa. Un registro sólo cambia de estatus (incluido "Cerrado").
// No declarar rutas DELETE es lo que hace cumplir esa regla.
//
// Control de acceso:
//   role:    exige una sesión con un rol conocido del sistema.
//   permiso: la matriz de Configuración → Permisos por rol, que es quien
//            decide módulo a módulo y se puede cambiar en caliente.
// Cualquier módulo puede concederse a cualquier rol: lo que distingue a los
// roles son sus valores de partida, no un techo fijo.
//
// El módulo "urd" (Recepción) no aparece aquí porque no tiene endpoints
// propios: trabaja sobre los de nna, representantes y expedientes.

// Única ruta sin control de rol: todavía no hay usuario autenticado.
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'role:administrador,supervisor,consejero'])->group(function () {

    // La cuenta propia no depende de ningún módulo.
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/me/permisos', [AuthController::class, 'permisos']);
    Route::get('/institucion', [ConfiguracionController::class, 'institucion']);

    Route::post('/pin/setup', [AuthController::class, 'setupPin']);
    Route::post('/pin/verify', [AuthController::class, 'verifyPin']);
    Route::post('/pin/change', [AuthController::class, 'changePin']);

    Route::middleware('verify.pin')->put('/profile', [AuthController::class, 'updateProfile']);

    Route::middleware('permiso:principal')->get('/panel', [PanelController::class, 'index']);

    // Las lecturas no llevan verify.pin: el PIN protege acciones, no consultas.
    Route::middleware('permiso:nna')->group(function () {
        Route::get('/nna', [NnaController::class, 'index']);
        Route::get('/nna/verificar/{documento}', [NnaController::class, 'verificarDocumento']);
        Route::get('/nna/{nna}', [NnaController::class, 'show']);

        Route::middleware('verify.pin')->group(function () {
            Route::post('/nna', [NnaController::class, 'store']);
            Route::put('/nna/{nna}', [NnaController::class, 'update']);
        });
    });

    Route::middleware('permiso:representantes')->group(function () {
        Route::get('/representantes', [RepresentanteController::class, 'index']);
        Route::get('/representantes/buscar/{cedula}', [RepresentanteController::class, 'buscarPorCedula']);
        Route::get('/representantes/{representante}', [RepresentanteController::class, 'show']);

        Route::middleware('verify.pin')->group(function () {
            Route::post('/representantes', [RepresentanteController::class, 'store']);
            Route::put('/representantes/{representante}', [RepresentanteController::class, 'update']);
        });
    });

    Route::middleware('permiso:expedientes')->group(function () {
        Route::get('/expedientes', [ExpedienteController::class, 'index']);
        Route::get('/expedientes/{expediente}', [ExpedienteController::class, 'show']);
        Route::get('/expedientes/{expediente}/bitacora', [BitacoraController::class, 'index']);
        Route::get('/expedientes/{expediente}/resumen', [ResumenExpedienteController::class, 'show']);

        Route::middleware('verify.pin')->group(function () {
            Route::post('/expedientes', [ExpedienteController::class, 'store']);
            Route::put('/expedientes/{expediente}', [ExpedienteController::class, 'update']);
            Route::post('/expedientes/{expediente}/bitacora', [BitacoraController::class, 'store']);
            Route::post('/expedientes/{expediente}/resumen', [ResumenExpedienteController::class, 'store']);
            Route::delete('/expedientes/{expediente}/resumen', [ResumenExpedienteController::class, 'destroy']);
        });
    });

    Route::middleware('permiso:solicitudArchivos')->group(function () {
        Route::get('/solicitudes', [SolicitudArchivoController::class, 'index']);
        Route::get('/solicitudes/{solicitud}', [SolicitudArchivoController::class, 'show']);

        Route::middleware('verify.pin')->group(function () {
            Route::post('/solicitudes', [SolicitudArchivoController::class, 'store']);
            Route::put('/solicitudes/{solicitud}', [SolicitudArchivoController::class, 'update']);
        });
    });

    Route::middleware('permiso:asignacionCasos')->group(function () {
        Route::get('/casos', [CasoController::class, 'index']);
        Route::get('/casos/{caso}', [CasoController::class, 'show']);

        Route::middleware('verify.pin')->group(function () {
            Route::post('/casos', [CasoController::class, 'store']);
            Route::put('/casos/{caso}', [CasoController::class, 'update']);
        });
    });

    Route::middleware('permiso:plantillas')->group(function () {
        Route::get('/plantillas', [PlantillaController::class, 'index']);
        Route::get('/plantillas/{plantilla}', [PlantillaController::class, 'show']);

        // Borradores y documentos emitidos desde el catálogo de formatos.
        Route::get('/documentos', [DocumentoController::class, 'index']);

        Route::middleware('verify.pin')->group(function () {
            Route::post('/plantillas', [PlantillaController::class, 'store']);
            Route::put('/plantillas/{plantilla}', [PlantillaController::class, 'update']);

            Route::post('/documentos', [DocumentoController::class, 'store']);
            Route::put('/documentos/{documento}', [DocumentoController::class, 'update']);
            Route::delete('/documentos/{documento}', [DocumentoController::class, 'destroy']);
            Route::post('/documentos/{documento}/emitir', [DocumentoController::class, 'emitir']);
            Route::post('/documentos/{documento}/descarga', [DocumentoController::class, 'registrarDescarga']);
        });
    });

    Route::middleware('permiso:historial')->get('/historial', [HistorialController::class, 'index']);
    Route::middleware('permiso:reportes')->get('/reportes', [ReporteController::class, 'index']);

    Route::middleware('permiso:usuarios')->group(function () {
        Route::get('/usuarios', [UsuarioController::class, 'index']);
        Route::get('/usuarios/{user}', [UsuarioController::class, 'show']);

        Route::middleware('verify.pin')->group(function () {
            Route::post('/usuarios', [UsuarioController::class, 'store']);
            Route::put('/usuarios/{user}', [UsuarioController::class, 'update']);
        });
    });

    Route::middleware('permiso:configuracion')->group(function () {
        Route::get('/configuracion', [ConfiguracionController::class, 'index']);
        Route::get('/configuracion/categoria/{categoria}', [ConfiguracionController::class, 'obtenerPorCategoria']);
        Route::get('/configuracion/{clave}', [ConfiguracionController::class, 'show']);

        Route::middleware('verify.pin')->group(function () {
            Route::put('/configuracion/{clave}', [ConfiguracionController::class, 'update']);
            Route::post('/configuracion/multiple', [ConfiguracionController::class, 'updateMultiple']);
        });
    });
});
