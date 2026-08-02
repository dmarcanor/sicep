<?php

namespace Database\Seeders;

use App\Models\Expediente;
use App\Models\Nna;
use App\Models\Representante;
use App\Models\User;
use Illuminate\Database\Seeder;

class ExpedienteSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('username', 'admin')->first();

        // Los expedientes referencian al NNA y al representante por documento, no por
        // nombre: NnaSeeder y RepresentanteSeeder deben correr antes que este.
        $expedientes = [
            [
                'codigo' => 'SICEP-URD-000128',
                'fecha' => '2026-06-06',
                'documento_nna' => 'V-31234567',
                'cedula_representante' => 'V-12345678',
                'sector' => 'Centro',
                'estatus' => 'Registrado',
                'prioridad' => 'Alta',
            ],
            [
                'codigo' => 'SICEP-URD-000127',
                'fecha' => '2026-06-05',
                'documento_nna' => 'V-32345678',
                'cedula_representante' => 'V-87654321',
                'sector' => 'Barrio Bolívar',
                'estatus' => 'En revisión',
                'prioridad' => 'Media',
            ],
            [
                'codigo' => 'SICEP-URD-000126',
                'fecha' => '2026-06-05',
                'documento_nna' => 'V-33456789',
                'cedula_representante' => 'V-11223344',
                'sector' => 'Guariquén',
                'estatus' => 'Aprobado',
                'prioridad' => 'Baja',
            ],
            [
                'codigo' => 'SICEP-URD-000125',
                'fecha' => '2026-06-04',
                'documento_nna' => 'V-34567890',
                'cedula_representante' => 'V-55667788',
                'sector' => 'El Muerto',
                'estatus' => 'Observado',
                'prioridad' => 'Alta',
            ],
            [
                'codigo' => 'SICEP-URD-000124',
                'fecha' => '2026-06-04',
                'documento_nna' => 'V-35678901',
                'cedula_representante' => 'V-99887766',
                'sector' => 'Centro',
                'estatus' => 'Registrado',
                'prioridad' => 'Media',
            ],
        ];

        foreach ($expedientes as $datos) {
            $nna = Nna::where('documento_identidad', $datos['documento_nna'])->first();
            $representante = Representante::where('cedula', $datos['cedula_representante'])->first();

            if (! $nna || ! $representante) {
                continue;
            }

            Expediente::firstOrCreate(
                ['codigo' => $datos['codigo']],
                [
                    'nna_id' => $nna->id,
                    'representante_id' => $representante->id,
                    'fecha' => $datos['fecha'],
                    'sector' => $datos['sector'],
                    'estatus' => $datos['estatus'],
                    'prioridad' => $datos['prioridad'],
                    'registrado_por' => $admin->id,
                ]
            );
        }
    }
}
