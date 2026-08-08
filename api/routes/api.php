<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CasoController;
use App\Http\Controllers\Api\ConfiguracionController;
use App\Http\Controllers\Api\ExpedienteController;
use App\Http\Controllers\Api\HistorialController;
use App\Http\Controllers\Api\NnaController;
use App\Http\Controllers\Api\PanelController;
use App\Http\Controllers\Api\PlantillaController;
use App\Http\Controllers\Api\RepresentanteController;
use App\Http\Controllers\Api\ReporteController;
use App\Http\Controllers\Api\SolicitudArchivoController;
use App\Http\Controllers\Api\UsuarioController;
use Illuminate\Support\Facades\Route;

// El expediente es la fuente legal del caso: el sistema no expone borrado en
// ninguna capa. Un registro sólo cambia de estatus (incluido "Cerrado").
// No declarar rutas DELETE es lo que hace cumplir esa regla.

// Única ruta sin control de rol: todavía no hay usuario autenticado.
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::middleware('role:administrador,supervisor,consejero')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/me/permisos', [AuthController::class, 'permisos']);

        Route::post('/pin/setup', [AuthController::class, 'setupPin']);
        Route::post('/pin/verify', [AuthController::class, 'verifyPin']);
        Route::post('/pin/change', [AuthController::class, 'changePin']);

        Route::get('/panel', [PanelController::class, 'index']);

        // Las lecturas no llevan verify.pin: el PIN protege acciones, no consultas.
        Route::get('/nna', [NnaController::class, 'index']);
        Route::get('/nna/verificar/{documento}', [NnaController::class, 'verificarDocumento']);
        Route::get('/nna/{nna}', [NnaController::class, 'show']);

        Route::get('/representantes', [RepresentanteController::class, 'index']);
        Route::get('/representantes/buscar/{cedula}', [RepresentanteController::class, 'buscarPorCedula']);
        Route::get('/representantes/{representante}', [RepresentanteController::class, 'show']);

        Route::get('/expedientes', [ExpedienteController::class, 'index']);
        Route::get('/expedientes/{expediente}', [ExpedienteController::class, 'show']);

        Route::get('/solicitudes', [SolicitudArchivoController::class, 'index']);
        Route::get('/solicitudes/{solicitud}', [SolicitudArchivoController::class, 'show']);

        Route::middleware('verify.pin')->group(function () {
            Route::put('/profile', [AuthController::class, 'updateProfile']);

            Route::post('/nna', [NnaController::class, 'store']);
            Route::put('/nna/{nna}', [NnaController::class, 'update']);

            Route::post('/representantes', [RepresentanteController::class, 'store']);
            Route::put('/representantes/{representante}', [RepresentanteController::class, 'update']);

            Route::post('/expedientes', [ExpedienteController::class, 'store']);
            Route::put('/expedientes/{expediente}', [ExpedienteController::class, 'update']);

            Route::post('/solicitudes', [SolicitudArchivoController::class, 'store']);
            Route::put('/solicitudes/{solicitud}', [SolicitudArchivoController::class, 'update']);
        });
    });

    Route::middleware('role:administrador,supervisor')->group(function () {
        Route::get('/casos', [CasoController::class, 'index']);
        Route::get('/casos/{caso}', [CasoController::class, 'show']);

        Route::get('/plantillas', [PlantillaController::class, 'index']);
        Route::get('/plantillas/{plantilla}', [PlantillaController::class, 'show']);

        Route::get('/historial', [HistorialController::class, 'index']);
        Route::get('/reportes', [ReporteController::class, 'index']);

        Route::middleware('verify.pin')->group(function () {
            Route::post('/casos', [CasoController::class, 'store']);
            Route::put('/casos/{caso}', [CasoController::class, 'update']);

            Route::post('/plantillas', [PlantillaController::class, 'store']);
            Route::put('/plantillas/{plantilla}', [PlantillaController::class, 'update']);
        });
    });

    Route::middleware('role:administrador')->group(function () {
        Route::get('/usuarios', [UsuarioController::class, 'index']);
        Route::get('/usuarios/{user}', [UsuarioController::class, 'show']);

        Route::get('/configuracion', [ConfiguracionController::class, 'index']);
        Route::get('/configuracion/categoria/{categoria}', [ConfiguracionController::class, 'obtenerPorCategoria']);
        Route::get('/configuracion/{clave}', [ConfiguracionController::class, 'show']);

        Route::middleware('verify.pin')->group(function () {
            Route::post('/usuarios', [UsuarioController::class, 'store']);
            Route::put('/usuarios/{user}', [UsuarioController::class, 'update']);

            Route::put('/configuracion/{clave}', [ConfiguracionController::class, 'update']);
            Route::post('/configuracion/multiple', [ConfiguracionController::class, 'updateMultiple']);
        });
    });
});
