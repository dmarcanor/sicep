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
            [
                'cedula' => 'V-13456789',
                'nombres' => 'Rosa Amelia',
                'apellidos' => 'Salazar',
                'telefono' => '0414-2233445',
                'direccion' => 'Calle Sucre, El Pilar',
                'email' => 'rosa.salazar@email.com',
                'profesion' => 'Costurera',
                'lugar_trabajo' => 'Taller propio',
            ],
            [
                'cedula' => 'V-14567890',
                'nombres' => 'Pedro Ramón',
                'apellidos' => 'Bermúdez',
                'telefono' => '0424-3344556',
                'direccion' => 'Sector Guariquén, vía principal',
                'email' => 'pedro.bermudez@email.com',
                'profesion' => 'Agricultor',
                'lugar_trabajo' => 'Finca La Esperanza',
            ],
            [
                'cedula' => 'V-15678901',
                'nombres' => 'Carmen Josefina',
                'apellidos' => 'Marcano',
                'telefono' => '0412-4455667',
                'direccion' => 'Av. Miranda, Aragua de Barcelona',
                'email' => 'carmen.marcano@email.com',
                'profesion' => 'Maestra',
                'lugar_trabajo' => 'E.B. Simón Rodríguez',
            ],
            [
                'cedula' => 'V-16789012',
                'nombres' => 'José Gregorio',
                'apellidos' => 'Farías',
                'telefono' => '0426-5566778',
                'direccion' => 'Calle Bolívar, El Pilar',
                'email' => 'jose.farias@email.com',
                'profesion' => 'Albañil',
                'lugar_trabajo' => 'Autoempleado',
            ],
            [
                'cedula' => 'V-17890123',
                'nombres' => 'Maritza Coromoto',
                'apellidos' => 'Betancourt',
                'telefono' => '0416-6677889',
                'direccion' => 'Barrio Bolívar, casa 45',
                'email' => 'maritza.betancourt@email.com',
                'profesion' => 'Ama de casa',
                'lugar_trabajo' => null,
            ],
            [
                'cedula' => 'V-18901234',
                'nombres' => 'Douglas Antonio',
                'apellidos' => 'Cedeño',
                'telefono' => '0414-7788990',
                'direccion' => 'Sector El Muerto',
                'email' => 'douglas.cedeno@email.com',
                'profesion' => 'Pescador',
                'lugar_trabajo' => 'Puerto de El Pilar',
            ],
            [
                'cedula' => 'V-19012345',
                'nombres' => 'Yubisay del Valle',
                'apellidos' => 'Quijada',
                'telefono' => '0424-8899001',
                'direccion' => 'Calle Comercio, Centro',
                'email' => 'yubisay.quijada@email.com',
                'profesion' => 'Enfermera',
                'lugar_trabajo' => 'Ambulatorio de El Pilar',
            ],
            [
                'cedula' => 'V-20123456',
                'nombres' => 'Freddy Rafael',
                'apellidos' => 'Idrogo',
                'telefono' => '0412-9900112',
                'direccion' => 'Guariquén, calle 3',
                'email' => 'freddy.idrogo@email.com',
                'profesion' => 'Chofer',
                'lugar_trabajo' => 'Línea de transporte municipal',
            ],
            [
                'cedula' => 'V-21234567',
                'nombres' => 'Neida Margarita',
                'apellidos' => 'Nieves',
                'telefono' => '0426-1122334',
                'direccion' => 'Calle La República, El Pilar',
                'email' => 'neida.nieves@email.com',
                'profesion' => 'Comerciante',
                'lugar_trabajo' => 'Bodega La Fe',
            ],
            [
                'cedula' => 'V-22345678',
                'nombres' => 'Wilmer Alexander',
                'apellidos' => 'Zabala',
                'telefono' => '0416-2233446',
                'direccion' => 'Barrio Bolívar, sector alto',
                'email' => 'wilmer.zabala@email.com',
                'profesion' => 'Electricista',
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
