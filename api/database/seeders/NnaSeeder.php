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
            [
                'documento_identidad' => 'V-36789012',
                'nombres' => 'Andrés Eduardo',
                'apellidos' => 'Salazar Mata',
                'fecha_nacimiento' => '2011-09-08',
                'sexo' => 'Masculino',
                'lugar_nacimiento' => 'El Pilar',
            ],
            [
                'documento_identidad' => 'V-37890123',
                'nombres' => 'Génesis Carolina',
                'apellidos' => 'Bermúdez Lara',
                'fecha_nacimiento' => '2013-02-25',
                'sexo' => 'Femenino',
                'lugar_nacimiento' => 'Guariquén',
            ],
            [
                'documento_identidad' => 'V-38901234',
                'nombres' => 'Jesús Alberto',
                'apellidos' => 'Marcano Ruiz',
                'fecha_nacimiento' => '2009-06-17',
                'sexo' => 'Masculino',
                'lugar_nacimiento' => 'Aragua de Barcelona',
            ],
            [
                'documento_identidad' => 'V-39012345',
                'nombres' => 'Anyelis Victoria',
                'apellidos' => 'Farías Guzmán',
                'fecha_nacimiento' => '2015-12-03',
                'sexo' => 'Femenino',
                'lugar_nacimiento' => 'El Pilar',
            ],
            [
                'documento_identidad' => 'V-40123456',
                'nombres' => 'Luis Fernando',
                'apellidos' => 'Betancourt Silva',
                'fecha_nacimiento' => '2010-04-11',
                'sexo' => 'Masculino',
                'lugar_nacimiento' => 'Barrio Bolívar',
            ],
            [
                'documento_identidad' => 'V-41234567',
                'nombres' => 'Yorgelis Andreína',
                'apellidos' => 'Cedeño Patiño',
                'fecha_nacimiento' => '2012-08-29',
                'sexo' => 'Femenino',
                'lugar_nacimiento' => 'El Muerto',
            ],
            [
                'documento_identidad' => 'V-42345678',
                'nombres' => 'Kevin Josué',
                'apellidos' => 'Quijada Moreno',
                'fecha_nacimiento' => '2016-01-19',
                'sexo' => 'Masculino',
                'lugar_nacimiento' => 'Centro',
            ],
            [
                'documento_identidad' => 'V-43456789',
                'nombres' => 'Scarlet Nazareth',
                'apellidos' => 'Idrogo Campos',
                'fecha_nacimiento' => '2014-07-06',
                'sexo' => 'Femenino',
                'lugar_nacimiento' => 'Guariquén',
            ],
            [
                'documento_identidad' => 'V-44567890',
                'nombres' => 'Ángel Gabriel',
                'apellidos' => 'Nieves Carvajal',
                'fecha_nacimiento' => '2017-10-22',
                'sexo' => 'Masculino',
                'lugar_nacimiento' => 'El Pilar',
            ],
            [
                'documento_identidad' => 'V-45678901',
                'nombres' => 'Nathalia Isabel',
                'apellidos' => 'Zabala Fuentes',
                'fecha_nacimiento' => '2018-03-14',
                'sexo' => 'Femenino',
                'lugar_nacimiento' => 'Barrio Bolívar',
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
