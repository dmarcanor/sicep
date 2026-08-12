<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // No hay pantalla de login servida por Laravel: sin esto, una petición
        // sin sesión intentaba redirigir a la ruta 'login' inexistente y salía
        // un 500 en vez de un 401.
        $middleware->redirectGuestsTo(fn () => null);

        $middleware->alias([
            'verify.pin' => \App\Http\Middleware\VerifyPin::class,
            'role' => \App\Http\Middleware\CheckRole::class,
            'permiso' => \App\Http\Middleware\CheckPermiso::class,
        ]);

        // Tras el nginx del contenedor web, sin esto el historial guardaría la
        // IP de la red de Docker en vez de la del funcionario. Se confía sólo
        // en rangos privados: una X-Forwarded-For de fuera no se acepta.
        $middleware->trustProxies(at: [
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
