<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\PasswordAlfanumerica;
use App\Support\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('display_name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        return response()->json($query->orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|email|max:255|unique:users',
            'password' => ['required', 'string', 'min:8', new PasswordAlfanumerica($request->username)],
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

        Auditoria::registrar(
            $request,
            'Creación de usuario',
            'usuarios',
            "Usuario '{$user->username}' creado",
            $user,
            Auditoria::creacion($user),
        );

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
            'password' => ['sometimes', 'string', 'min:8', new PasswordAlfanumerica($request->input('username', $user->username))],
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

        $cambios = Auditoria::actualizar($user, $datos);

        // Los valores nunca se guardan en el historial: sólo consta que cambiaron.
        if (array_key_exists('password', $datos)) {
            $cambios['password'] = [null, 'cambiada'];
        }

        if (array_key_exists('pin', $datos)) {
            $cambios['pin'] = [null, 'cambiado'];
        }

        Auditoria::registrar(
            $request,
            'Actualización de usuario',
            'usuarios',
            "Usuario '{$user->username}' actualizado",
            $user,
            $cambios,
        );

        return response()->json($user);
    }

}
