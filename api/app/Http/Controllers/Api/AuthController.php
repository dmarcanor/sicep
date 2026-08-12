<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Historial;
use App\Models\User;
use App\Support\IntentosPin;
use App\Support\Permisos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    private const VENTANA_BLOQUEO = 60;
    private const MAXIMO_INTENTOS = 5;

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $llave = 'login:' . Str::lower($request->username) . '|' . $request->ip();
        $maximo = self::MAXIMO_INTENTOS;

        if (RateLimiter::tooManyAttempts($llave, $maximo)) {
            return response()->json([
                'message' => 'Demasiados intentos fallidos. Espere '
                    . RateLimiter::availableIn($llave) . ' segundos antes de reintentar.',
            ], 429);
        }

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($llave, self::VENTANA_BLOQUEO);

            // Sólo se puede dejar rastro si el usuario existe: historial.usuario_id
            // es una clave foránea obligatoria.
            if ($user) {
                $this->registrar($user->id, 'Intento de inicio de sesión fallido', $request, 'Error');
            }

            return response()->json([
                'message' => 'Credenciales inválidas',
            ], 401);
        }

        if (!$user->active) {
            $this->registrar($user->id, 'Inicio de sesión rechazado: cuenta deshabilitada', $request, 'Error');

            return response()->json([
                'message' => 'Su cuenta está deshabilitada. Contacte al administrador del sistema.',
                'cuenta_deshabilitada' => true,
            ], 403);
        }

        RateLimiter::clear($llave);

        $token = $user->createToken('auth-token')->plainTextToken;

        $this->registrar($user->id, 'Inicio de sesión', $request);

        return response()->json([
            'user' => $this->perfil($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $this->registrar($request->user()->id, 'Cierre de sesión', $request);

        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada']);
    }

    public function me(Request $request)
    {
        return response()->json($this->perfil($request->user()));
    }

    /**
     * Los módulos vigentes del rol. El frontend la consulta en cada carga para
     * que un cambio en la matriz de permisos se aplique sin volver a entrar.
     */
    public function permisos(Request $request)
    {
        $rol = $request->user()->role;

        return response()->json([
            'rol' => $rol,
            'modulos' => Permisos::delRol($rol),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $datos = $request->validate([
            'name' => 'sometimes|string|max:255',
            'display_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'sometimes|nullable|string|max:20',
            'position' => 'sometimes|nullable|string|max:255',
        ]);

        $user->update($datos);

        $this->registrar($user->id, 'Actualización de perfil', $request, 'Exitoso', 'perfil');

        return response()->json(['message' => 'Perfil actualizado']);
    }

    public function setupPin(Request $request)
    {
        $request->validate([
            'pin' => 'required|string|min:4|max:6|regex:/^[0-9]+$/',
        ]);

        $user = $request->user();

        $user->update([
            'pin' => Hash::make($request->pin),
            'pin_configurado' => true,
        ]);

        $this->registrar($user->id, 'Configuración de PIN', $request);

        return response()->json(['message' => 'PIN configurado correctamente']);
    }

    public function verifyPin(Request $request)
    {
        $request->validate([
            'pin' => 'required|string',
        ]);

        $user = $request->user();

        // Mismo contador que el middleware: es el otro camino para probar PINes.
        if (IntentosPin::bloqueado($user->id)) {
            return response()->json([
                'message' => 'Demasiados intentos con PIN incorrecto. Espere '
                    . IntentosPin::segundosRestantes($user->id) . ' segundos antes de reintentar.',
                'valid' => false,
            ], 429);
        }

        if (!Hash::check($request->pin, $user->pin)) {
            IntentosPin::registrarFallo($user->id);
            $this->registrar($user->id, 'Verificación de PIN fallida', $request, 'Error');

            return response()->json([
                'message' => 'PIN incorrecto',
                'valid' => false,
                'pin_invalido' => true,
            ], 401);
        }

        IntentosPin::limpiar($user->id);

        return response()->json([
            'message' => 'PIN válido',
            'valid' => true,
        ]);
    }

    public function changePin(Request $request)
    {
        $request->validate([
            'pin_actual' => 'required|string',
            'pin_nuevo' => 'required|string|min:4|max:6|regex:/^[0-9]+$/',
        ]);

        $user = $request->user();

        if (!Hash::check($request->pin_actual, $user->pin)) {
            $this->registrar($user->id, 'Cambio de PIN fallido', $request, 'Error');

            return response()->json([
                'message' => 'PIN actual incorrecto',
                'pin_invalido' => true,
            ], 401);
        }

        $user->update([
            'pin' => Hash::make($request->pin_nuevo),
            'pin_configurado' => true,
        ]);

        $this->registrar($user->id, 'Cambio de PIN', $request);

        return response()->json(['message' => 'PIN cambiado correctamente']);
    }

    private function perfil(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'display_name' => $user->display_name,
            'rol' => $user->role,
            'email' => $user->email,
            'phone' => $user->phone,
            'position' => $user->position,
            'pin_configurado' => $user->pin_configurado,
            'modulos' => Permisos::delRol($user->role),
        ];
    }

    private function registrar(
        int $usuarioId,
        string $accion,
        Request $request,
        string $estado = 'Exitoso',
        string $modulo = 'auth',
    ): void {
        Historial::create([
            'usuario_id' => $usuarioId,
            'accion' => $accion,
            'modulo' => $modulo,
            'estado' => $estado,
            'ip_address' => $request->ip(),
        ]);
    }
}
