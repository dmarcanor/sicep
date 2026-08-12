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
            [
                'codigo' => 'SICEP-URD-000129',
                'fecha' => '2026-08-08',
                'documento_nna' => 'V-36789012',
                'cedula_representante' => 'V-13456789',
                'sector' => 'El Pilar',
                'estatus' => 'Registrado',
                'prioridad' => 'Alta',
                'tipificacion' => 'Maltrato Físico',
                'causa' => 'Denuncia de vecinos por castigos físicos reiterados.',
            ],
            [
                'codigo' => 'SICEP-URD-000130',
                'fecha' => '2026-08-06',
                'documento_nna' => 'V-37890123',
                'cedula_representante' => 'V-14567890',
                'sector' => 'Guariquén',
                'estatus' => 'Registrado',
                'prioridad' => 'Media',
                'tipificacion' => 'Negligencia',
                'causa' => 'Inasistencia escolar prolongada sin justificación.',
            ],
            [
                'codigo' => 'SICEP-URD-000131',
                'fecha' => '2026-08-03',
                'documento_nna' => 'V-38901234',
                'cedula_representante' => 'V-15678901',
                'sector' => 'Aragua de Barcelona',
                'estatus' => 'En revisión',
                'prioridad' => 'Alta',
                'tipificacion' => 'Trabajo Infantil',
                'causa' => 'Adolescente laborando en jornada nocturna.',
            ],
            [
                'codigo' => 'SICEP-URD-000132',
                'fecha' => '2026-07-28',
                'documento_nna' => 'V-39012345',
                'cedula_representante' => 'V-16789012',
                'sector' => 'El Pilar',
                'estatus' => 'En revisión',
                'prioridad' => 'Media',
                'tipificacion' => 'Violencia Psicológica',
                'causa' => 'Remisión del plantel por cambios conductuales.',
            ],
            [
                'codigo' => 'SICEP-URD-000133',
                'fecha' => '2026-07-21',
                'documento_nna' => 'V-40123456',
                'cedula_representante' => 'V-17890123',
                'sector' => 'Barrio Bolívar',
                'estatus' => 'Observado',
                'prioridad' => 'Media',
                'tipificacion' => 'Acoso Escolar',
                'causa' => 'Hostigamiento reiterado por compañeros de aula.',
            ],
            [
                'codigo' => 'SICEP-URD-000134',
                'fecha' => '2026-07-20',
                'documento_nna' => 'V-41234567',
                'cedula_representante' => 'V-18901234',
                'sector' => 'El Muerto',
                'estatus' => 'En revisión',
                'prioridad' => 'Baja',
                'tipificacion' => 'Negligencia',
                'causa' => 'Falta de control médico y de vacunación.',
            ],
            [
                'codigo' => 'SICEP-URD-000135',
                'fecha' => '2026-07-10',
                'documento_nna' => 'V-42345678',
                'cedula_representante' => 'V-19012345',
                'sector' => 'Centro',
                'estatus' => 'Aprobado',
                'prioridad' => 'Alta',
                'tipificacion' => 'Abandono',
                'causa' => 'Permanencia del niño con terceros sin autorización.',
            ],
            [
                'codigo' => 'SICEP-URD-000136',
                'fecha' => '2026-07-02',
                'documento_nna' => 'V-43456789',
                'cedula_representante' => 'V-20123456',
                'sector' => 'Guariquén',
                'estatus' => 'Observado',
                'prioridad' => 'Alta',
                'tipificacion' => 'Otro',
                'causa' => 'Solicitud de medida de protección por riesgo del entorno.',
            ],
            [
                'codigo' => 'SICEP-URD-000137',
                'fecha' => '2026-06-24',
                'documento_nna' => 'V-44567890',
                'cedula_representante' => 'V-21234567',
                'sector' => 'El Pilar',
                'estatus' => 'Cerrado',
                'prioridad' => 'Baja',
                'tipificacion' => 'Negligencia',
                'causa' => 'Caso conciliado entre las partes.',
            ],
            [
                'codigo' => 'SICEP-URD-000138',
                'fecha' => '2026-06-18',
                'documento_nna' => 'V-45678901',
                'cedula_representante' => 'V-22345678',
                'sector' => 'Barrio Bolívar',
                'estatus' => 'Aprobado',
                'prioridad' => 'Media',
                'tipificacion' => 'Violencia Psicológica',
                'causa' => 'Exposición a conflictos familiares reiterados.',
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
                    'tipificacion' => $datos['tipificacion'] ?? null,
                    'causa' => $datos['causa'] ?? null,
                    'registrado_por' => $admin->id,
                ]
            );
        }
    }
}
