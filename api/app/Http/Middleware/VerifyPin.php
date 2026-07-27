<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class VerifyPin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user->pin_configurado) {
            return response()->json([
                'message' => 'Debe configurar su PIN de seguridad antes de realizar esta acción',
                'pin_required' => true,
            ], 403);
        }

        $pin = $request->header('X-PIN') ?? $request->input('pin');

        if (!$pin) {
            return response()->json([
                'message' => 'PIN de seguridad requerido',
                'pin_required' => true,
            ], 401);
        }

        if (!Hash::check($pin, $user->pin)) {
            return response()->json([
                'message' => 'PIN de seguridad incorrecto',
            ], 401);
        }

        return $next($request);
    }
}
