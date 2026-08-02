<?php

use Illuminate\Support\Facades\Route;

// El catch-all del SPA no debe tragarse /api/*: sin esta exclusión, una ruta de
// API inexistente termina en un error de file_get_contents en vez de un 404.
Route::get('/{any?}', function () {
    $indice = public_path('index.html');

    abort_unless(
        file_exists($indice),
        404,
        'El build del frontend no está publicado en api/public.'
    );

    return response(file_get_contents($indice))
        ->header('Content-Type', 'text/html');
})->where('any', '^(?!api(/|$)).*$');
