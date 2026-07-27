<?php

namespace Database\Seeders;

use App\Models\Expediente;
use App\Models\User;
use Illuminate\Database\Seeder;

class ExpedienteSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('username', 'admin')->first();

        $expedientes = [
            [
                'codigo' => 'SICEP-URD-000128',
                'fecha' => '2026-06-06',
                'nino' => 'María Fernanda Pérez',
                'representante' => 'Yolanda Rivas',
                'sector' => 'Centro',
                'estatus' => 'Registrado',
                'prioridad' => 'Alta',
                'registrado_por' => $admin->id,
            ],
            [
                'codigo' => 'SICEP-URD-000127',
                'fecha' => '2026-06-05',
                'nino' => 'José Luis González',
                'representante' => 'Carlos González',
                'sector' => 'Barrio Bolívar',
                'estatus' => 'En revisión',
                'prioridad' => 'Media',
                'registrado_por' => $admin->id,
            ],
            [
                'codigo' => 'SICEP-URD-000126',
                'fecha' => '2026-06-05',
                'nino' => 'Valeria Jiménez',
                'representante' => 'Ana Jiménez',
                'sector' => 'Guariquén',
                'estatus' => 'Aprobado',
                'prioridad' => 'Baja',
                'registrado_por' => $admin->id,
            ],
            [
                'codigo' => 'SICEP-URD-000125',
                'fecha' => '2026-06-04',
                'nino' => 'Samuel Ortega',
                'representante' => 'Marta Ortega',
                'sector' => 'El Muerto',
                'estatus' => 'Observado',
                'prioridad' => 'Alta',
                'registrado_por' => $admin->id,
            ],
            [
                'codigo' => 'SICEP-URD-000124',
                'fecha' => '2026-06-04',
                'nino' => 'Daniela Rojas',
                'representante' => 'Luis Rojas',
                'sector' => 'Centro',
                'estatus' => 'Registrado',
                'prioridad' => 'Media',
                'registrado_por' => $admin->id,
            ],
        ];

        foreach ($expedientes as $expediente) {
            Expediente::create($expediente);
        }
    }
}
