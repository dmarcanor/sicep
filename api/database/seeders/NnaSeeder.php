<?php

namespace Database\Seeders;

use App\Models\Nna;
use Illuminate\Database\Seeder;

class NnaSeeder extends Seeder
{
    public function run(): void
    {
        $nnas = [
            [
                'documento_identidad' => 'V-31234567',
                'nombres' => 'María Fernanda',
                'apellidos' => 'Pérez',
                'fecha_nacimiento' => '2012-03-14',
                'sexo' => 'Femenino',
                'lugar_nacimiento' => 'Aragua de Barcelona',
            ],
            [
                'documento_identidad' => 'V-32345678',
                'nombres' => 'José Luis',
                'apellidos' => 'González',
                'fecha_nacimiento' => '2010-07-22',
                'sexo' => 'Masculino',
                'lugar_nacimiento' => 'Aragua de Barcelona',
            ],
            [
                'documento_identidad' => 'V-33456789',
                'nombres' => 'Valeria',
                'apellidos' => 'Jiménez',
                'fecha_nacimiento' => '2014-11-02',
                'sexo' => 'Femenino',
                'lugar_nacimiento' => 'Guariquén',
            ],
            [
                'documento_identidad' => 'V-34567890',
                'nombres' => 'Samuel',
                'apellidos' => 'Ortega',
                'fecha_nacimiento' => '2009-01-30',
                'sexo' => 'Masculino',
                'lugar_nacimiento' => 'El Muerto',
            ],
            [
                'documento_identidad' => 'V-35678901',
                'nombres' => 'Daniela',
                'apellidos' => 'Rojas',
                'fecha_nacimiento' => '2013-05-18',
                'sexo' => 'Femenino',
                'lugar_nacimiento' => 'Aragua de Barcelona',
            ],
        ];

        foreach ($nnas as $nna) {
            Nna::firstOrCreate(
                ['documento_identidad' => $nna['documento_identidad']],
                $nna
            );
        }
    }
}
