<?php

namespace Database\Seeders;

use App\Models\Configuracion;
use App\Support\Permisos;
use Illuminate\Database\Seeder;

class ConfiguracionSeeder extends Seeder
{
    public function run(): void
    {
        $configuraciones = [
            // Configuración general
            ['clave' => 'nombre_institucion', 'valor' => 'Consejo de Protección de Niños, Niñas y Adolescentes', 'tipo' => 'texto', 'categoria' => 'general', 'descripcion' => 'Nombre oficial de la institución'],
            ['clave' => 'nombre_corto', 'valor' => 'CPNNA', 'tipo' => 'texto', 'categoria' => 'general', 'descripcion' => 'Nombre corto o acrónimo'],
            ['clave' => 'municipio', 'valor' => 'Benítez', 'tipo' => 'texto', 'categoria' => 'general', 'descripcion' => 'Municipio donde opera'],
            ['clave' => 'estado', 'valor' => 'Sucre', 'tipo' => 'texto', 'categoria' => 'general', 'descripcion' => 'Estado donde opera'],
            
            // Membrete
            ['clave' => 'membrete_titulo', 'valor' => 'REPÚBLICA BOLIVARIANA DE VENEZUELA', 'tipo' => 'texto', 'categoria' => 'membrete', 'descripcion' => 'Título del membrete'],
            ['clave' => 'membrete_subtitulo', 'valor' => 'CONSEJO DE PROTECCIÓN DE NIÑOS, NIÑAS Y ADOLESCENTES', 'tipo' => 'texto', 'categoria' => 'membrete', 'descripcion' => 'Subtítulo del membrete'],
            ['clave' => 'membrete_tercero', 'valor' => 'MUNICIPIO BENÍTEZ - ESTADO SUCRE', 'tipo' => 'texto', 'categoria' => 'membrete', 'descripcion' => 'Tercera línea del membrete'],
            
            // Datos de contacto
            ['clave' => 'direccion_institucion', 'valor' => 'El Pilar, Municipio Benítez, Estado Sucre', 'tipo' => 'texto', 'categoria' => 'contacto', 'descripcion' => 'Dirección física de la institución'],
            ['clave' => 'telefono_institucion', 'valor' => '(0244) 000-0000', 'tipo' => 'texto', 'categoria' => 'contacto', 'descripcion' => 'Teléfono de contacto'],
            ['clave' => 'email_institucion', 'valor' => 'contacto@cpnna.gob.ve', 'tipo' => 'texto', 'categoria' => 'contacto', 'descripcion' => 'Correo electrónico institucional'],
            
            
            
            
            // Configuración del sistema
            ['clave' => 'dias_alerta_amarillo', 'valor' => '21', 'tipo' => 'numero', 'categoria' => 'sistema', 'descripcion' => 'Días para marcar el expediente en amarillo (por vencer)'],
            ['clave' => 'dias_alerta_rojo', 'valor' => '25', 'tipo' => 'numero', 'categoria' => 'sistema', 'descripcion' => 'Días para marcar el expediente en rojo (lapso vencido)'],
        ];

        // Los módulos visibles por rol viven en la misma tabla, pero su lista
        // canónica está en App\Support\Permisos para que API y menú coincidan.
        foreach (Permisos::PREDETERMINADOS as $rol => $modulos) {
            $configuraciones[] = [
                'clave' => Permisos::clave($rol),
                'valor' => json_encode($modulos),
                'tipo' => 'json',
                'categoria' => 'permisos',
                'descripcion' => "Módulos visibles para el rol {$rol}",
            ];
        }

        foreach ($configuraciones as $config) {
            Configuracion::firstOrCreate(['clave' => $config['clave']], $config);
        }
    }
}
