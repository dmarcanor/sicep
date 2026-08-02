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

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    
    Route::post('/pin/setup', [AuthController::class, 'setupPin']);
    Route::post('/pin/verify', [AuthController::class, 'verifyPin']);
    Route::post('/pin/change', [AuthController::class, 'changePin']);

    Route::get('/panel', [PanelController::class, 'index']);

    Route::apiResource('/nna', NnaController::class)->only(['index', 'show']);
    Route::get('/nna/verificar/{documento}', [NnaController::class, 'verificarDocumento']);
    
    Route::apiResource('/representantes', RepresentanteController::class);
    Route::get('/representantes/buscar/{cedula}', [RepresentanteController::class, 'buscarPorCedula']);
    
    Route::get('/expedientes', [ExpedienteController::class, 'index']);
    Route::get('/expedientes/{expediente}', [ExpedienteController::class, 'show']);

    Route::get('/solicitudes', [SolicitudArchivoController::class, 'index']);
    Route::get('/solicitudes/{solicitud}', [SolicitudArchivoController::class, 'show']);

    // Las lecturas no llevan verify.pin: el PIN protege acciones, no consultas.
    Route::middleware('role:administrador,supervisor')->group(function () {
        Route::get('/casos', [CasoController::class, 'index']);
        Route::get('/casos/{caso}', [CasoController::class, 'show']);

        Route::get('/plantillas', [PlantillaController::class, 'index']);
        Route::get('/plantillas/{plantilla}', [PlantillaController::class, 'show']);
    });

    Route::middleware('role:administrador')->group(function () {
        Route::get('/usuarios', [UsuarioController::class, 'index']);
        Route::get('/usuarios/{user}', [UsuarioController::class, 'show']);

        Route::get('/configuracion', [ConfiguracionController::class, 'index']);
        Route::get('/configuracion/categoria/{categoria}', [ConfiguracionController::class, 'obtenerPorCategoria']);
        Route::get('/configuracion/{clave}', [ConfiguracionController::class, 'show']);
    });

    Route::middleware('verify.pin')->group(function () {
        Route::post('/expedientes', [ExpedienteController::class, 'store']);
        Route::put('/expedientes/{expediente}', [ExpedienteController::class, 'update']);
        
        Route::post('/casos', [CasoController::class, 'store']);
        Route::put('/casos/{caso}', [CasoController::class, 'update']);
        
        Route::post('/solicitudes', [SolicitudArchivoController::class, 'store']);
        Route::put('/solicitudes/{solicitud}', [SolicitudArchivoController::class, 'update']);
        
        Route::post('/representantes', [RepresentanteController::class, 'store']);
        Route::put('/representantes/{representante}', [RepresentanteController::class, 'update']);

        Route::post('/nna', [NnaController::class, 'store']);
        Route::put('/nna/{nna}', [NnaController::class, 'update']);
    });
    
    Route::middleware(['verify.pin', 'role:administrador,supervisor'])->group(function () {
        Route::delete('/expedientes/{expediente}', [ExpedienteController::class, 'destroy']);
        
        Route::post('/plantillas', [PlantillaController::class, 'store']);
        Route::put('/plantillas/{plantilla}', [PlantillaController::class, 'update']);
        Route::delete('/plantillas/{plantilla}', [PlantillaController::class, 'destroy']);
        
        Route::delete('/representantes/{representante}', [RepresentanteController::class, 'destroy']);
        Route::delete('/nna/{nna}', [NnaController::class, 'destroy']);
    });
    
    Route::middleware(['verify.pin', 'role:administrador'])->group(function () {
        Route::post('/usuarios', [UsuarioController::class, 'store']);
        Route::put('/usuarios/{user}', [UsuarioController::class, 'update']);
        Route::delete('/usuarios/{user}', [UsuarioController::class, 'destroy']);
        
        Route::put('/configuracion/{clave}', [ConfiguracionController::class, 'update']);
        Route::post('/configuracion/multiple', [ConfiguracionController::class, 'updateMultiple']);
    });

    Route::middleware('role:administrador,supervisor')->group(function () {
        Route::get('/historial', [HistorialController::class, 'index']);
        Route::get('/reportes', [ReporteController::class, 'index']);
    });
});
