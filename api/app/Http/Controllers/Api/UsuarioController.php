<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Historial;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function index()
    {
        return response()->json(User::orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'pin' => 'required|string|min:4|max:6|regex:/^[0-9]+$/',
            'role' => 'required|in:administrador,supervisor,consejero',
            'display_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'position' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'pin' => Hash::make($request->pin),
            'pin_configurado' => true,
            'role' => $request->role,
            'display_name' => $request->display_name ?? $request->name,
            'phone' => $request->phone,
            'position' => $request->position,
            'active' => true,
        ]);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Creación de usuario',
            'modulo' => 'usuarios',
            'registro_tipo' => 'User',
            'registro_id' => $user->id,
            'detalles' => "Usuario '{$user->username}' creado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        // Sólo los campos validados. Con $request->all() entraba también "pin",
        // que es asignable y no se hashea aquí: un PIN en texto plano deja al
        // usuario sin poder confirmar ninguna acción.
        $datos = $request->validate([
            'name' => 'sometimes|string|max:255',
            'username' => 'sometimes|string|max:255|unique:users,username,' . $user->id,
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'role' => 'sometimes|in:administrador,supervisor,consejero',
            'display_name' => 'sometimes|nullable|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'position' => 'sometimes|nullable|string|max:255',
            'active' => 'sometimes|boolean',
            'pin' => 'sometimes|string|min:4|max:6|regex:/^[0-9]+$/',
        ]);

        if (isset($datos['password'])) {
            $datos['password'] = Hash::make($datos['password']);
        }

        if (isset($datos['pin'])) {
            $datos['pin'] = Hash::make($datos['pin']);
            $datos['pin_configurado'] = true;
        }

        $user->update($datos);

        Historial::create([
            'usuario_id' => $request->user()->id,
            'accion' => 'Actualización de usuario',
            'modulo' => 'usuarios',
            'registro_tipo' => 'User',
            'registro_id' => $user->id,
            'detalles' => "Usuario '{$user->username}' actualizado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json($user);
    }

}
