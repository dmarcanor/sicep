<?php

namespace App\Http\Middleware;

use App\Models\Historial;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Support\IntentosPin;
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

        // Sólo por cabecera: el cuerpo de POST /usuarios ya lleva un campo "pin"
        // que es el del usuario que se está creando, no el de quien confirma.
        $pin = $request->header('X-PIN');

        if (!$pin) {
            return response()->json([
                'message' => 'PIN de seguridad requerido',
                'pin_required' => true,
            ], 401);
        }

        if (IntentosPin::bloqueado($user->id)) {
            return response()->json([
                'message' => 'Demasiados intentos con PIN incorrecto. Espere '
                    . IntentosPin::segundosRestantes($user->id) . ' segundos antes de reintentar.',
            ], 429);
        }

        if (!Hash::check($pin, $user->pin)) {
            IntentosPin::registrarFallo($user->id);

            Historial::create([
                'usuario_id' => $user->id,
                'accion' => 'PIN de seguridad incorrecto',
                'modulo' => $request->segment(2) ?? 'auth',
                'estado' => 'Error',
                'detalles' => 'Acción rechazada: ' . $request->method() . ' ' . $request->path(),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'PIN de seguridad incorrecto',
                // Distingue este 401 del de sesión vencida: el cliente sólo
                // debe avisar, no cerrar la sesión por un PIN mal tecleado.
                'pin_invalido' => true,
            ], 401);
        }

        IntentosPin::limpiar($user->id);

        return $next($request);
    }
}
