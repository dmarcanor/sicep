<?php

namespace Database\Seeders;

use App\Models\Representante;
use Illuminate\Database\Seeder;

class RepresentanteSeeder extends Seeder
{
    public function run(): void
    {
        $representantes = [
            [
                'cedula' => 'V-12345678',
                'nombres' => 'Yolanda',
                'apellidos' => 'Rivas',
                'telefono' => '0414-1234567',
                'direccion' => 'Calle Principal, Centro',
                'email' => 'yolanda.rivas@email.com',
                'profesion' => 'Docente',
                'lugar_trabajo' => 'U.E. Benítez',
            ],
            [
                'cedula' => 'V-87654321',
                'nombres' => 'Carlos',
                'apellidos' => 'González',
                'telefono' => '0424-9876543',
                'direccion' => 'Av. Bolívar, Barrio Bolívar',
                'email' => 'carlos.gonzalez@email.com',
                'profesion' => 'Ingeniero',
                'lugar_trabajo' => 'Alcaldía de Aragua de Barcelona',
            ],
            [
                'cedula' => 'V-11223344',
                'nombres' => 'Ana',
                'apellidos' => 'Jiménez',
                'telefono' => '0412-5556677',
                'direccion' => 'Calle 5, Guariquén',
                'email' => 'ana.jimenez@email.com',
                'profesion' => 'Enfermera',
                'lugar_trabajo' => 'Hospital Central',
            ],
            [
                'cedula' => 'V-55667788',
                'nombres' => 'Marta',
                'apellidos' => 'Ortega',
                'telefono' => '0416-1122334',
                'direccion' => 'Sector El Muerto',
                'email' => 'marta.ortega@email.com',
                'profesion' => 'Ama de casa',
                'lugar_trabajo' => null,
            ],
            [
                'cedula' => 'V-99887766',
                'nombres' => 'Luis',
                'apellidos' => 'Rojas',
                'telefono' => '0426-9988776',
                'direccion' => 'Calle 10, Centro',
                'email' => 'luis.rojas@email.com',
                'profesion' => 'Comerciante',
                'lugar_trabajo' => 'Autoempleado',
            ],
        ];

        foreach ($representantes as $representante) {
            Representante::firstOrCreate(
                ['cedula' => $representante['cedula']],
                $representante
            );
        }
    }
}
