<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Historial;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Credenciales inválidas',
            ], 401);
        }

        if (!$user->active) {
            return response()->json([
                'message' => 'Usuario inactivo',
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        Historial::create([
            'usuario_id' => $user->id,
            'accion' => 'Inicio de sesión',
            'modulo' => 'auth',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'display_name' => $user->display_name,
                'rol' => $user->role,
                'email' => $user->email,
                'pin_configurado' => $user->pin_configurado,
            ],
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Cierre de sesión',
            'modulo' => 'auth',
            'ip_address' => $request->ip(),
        ]);

        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'display_name' => $user->display_name,
            'rol' => $user->role,
            'email' => $user->email,
            'phone' => $user->phone,
            'position' => $user->position,
            'pin_configurado' => $user->pin_configurado,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'display_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'sometimes|string|max:20',
            'position' => 'sometimes|string|max:255',
        ]);

        $user->update($request->only(['name', 'display_name', 'email', 'phone', 'position']));

        Historial::create([
            'usuario_id' => $user->id,
            'accion' => 'Actualización de perfil',
            'modulo' => 'perfil',
            'ip_address' => $request->ip(),
        ]);

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

        Historial::create([
            'usuario_id' => $user->id,
            'accion' => 'Configuración de PIN',
            'modulo' => 'auth',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'PIN configurado correctamente']);
    }

    public function verifyPin(Request $request)
    {
        $request->validate([
            'pin' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($request->pin, $user->pin)) {
            return response()->json([
                'message' => 'PIN incorrecto',
                'valid' => false,
            ], 401);
        }

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
            return response()->json([
                'message' => 'PIN actual incorrecto',
            ], 401);
        }

        $user->update([
            'pin' => Hash::make($request->pin_nuevo),
        ]);

        Historial::create([
            'usuario_id' => $user->id,
            'accion' => 'Cambio de PIN',
            'modulo' => 'auth',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'PIN cambiado correctamente']);
    }
}
