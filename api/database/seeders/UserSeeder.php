<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Administrador',
            'username' => 'admin',
            'email' => 'admin@sicep.com',
            'password' => Hash::make('12345678'),
            'role' => 'administrador',
            'display_name' => 'Administrador',
            'phone' => '0000000000',
            'position' => 'Administrador',
            'active' => true,
            'pin' => Hash::make('1234'),
            'pin_configurado' => true,
        ]);

        User::create([
            'name' => 'Supervisor',
            'username' => 'supervisor',
            'email' => 'supervisor@sicep.com',
            'password' => Hash::make('12345678'),
            'role' => 'supervisor',
            'display_name' => 'Supervisor',
            'phone' => '0000000001',
            'position' => 'Supervisor',
            'active' => true,
            'pin' => Hash::make('1234'),
            'pin_configurado' => true,
        ]);

        User::create([
            'name' => 'Consejero',
            'username' => 'consejero',
            'email' => 'consejero@sicep.com',
            'password' => Hash::make('12345678'),
            'role' => 'consejero',
            'display_name' => 'Consejero',
            'phone' => '0000000002',
            'position' => 'Consejero',
            'active' => true,
            'pin' => Hash::make('1234'),
            'pin_configurado' => true,
        ]);
    }
}
