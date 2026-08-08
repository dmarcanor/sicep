<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // firstOrCreate por username: el contenedor ejecuta los seeders en cada
        // arranque, y volver a crearlos reventaría por el correo único.
        $usuarios = [
            ['username' => 'admin', 'role' => 'administrador', 'nombre' => 'Administrador', 'phone' => '0000000000'],
            ['username' => 'supervisor', 'role' => 'supervisor', 'nombre' => 'Supervisor', 'phone' => '0000000001'],
            ['username' => 'consejero', 'role' => 'consejero', 'nombre' => 'Consejero', 'phone' => '0000000002'],
        ];

        foreach ($usuarios as $usuario) {
            User::firstOrCreate(
                ['username' => $usuario['username']],
                [
                    'name' => $usuario['nombre'],
                    'email' => "{$usuario['username']}@sicep.com",
                    'password' => Hash::make('12345678'),
                    'role' => $usuario['role'],
                    'display_name' => $usuario['nombre'],
                    'phone' => $usuario['phone'],
                    'position' => $usuario['nombre'],
                    'active' => true,
                    'pin' => Hash::make('1234'),
                    'pin_configurado' => true,
                ]
            );
        }
    }
}
