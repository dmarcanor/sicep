<?php

namespace App\Http\Middleware;

use App\Support\Permisos;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Aplica la matriz de Configuración → Permisos por rol.
 *
 * Va siempre junto a `role`, que es el techo fijo: `role` decide lo que un rol
 * puede llegar a hacer y esto decide lo que tiene habilitado ahora mismo. Sin
 * este middleware, quitar un módulo de la matriz sólo escondía el botón y la
 * API seguía sirviendo los datos.
 */
class CheckPermiso
{
    public function handle(Request $request, Closure $next, string $modulo): Response
    {
        $user = $request->user();

        if (!$user || !Permisos::permite($user->role, $modulo)) {
            return response()->json([
                'message' => 'El módulo no está habilitado para su rol',
                'modulo' => $modulo,
            ], 403);
        }

        return $next($request);
    }
}
