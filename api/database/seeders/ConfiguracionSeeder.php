<?php

namespace Database\Seeders;

use App\Models\Configuracion;
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
            
            // Jefatura
            ['clave' => 'jefe_nombre', 'valor' => 'Nombre del Jefe(a)', 'tipo' => 'texto', 'categoria' => 'jefatura', 'descripcion' => 'Nombre completo del jefe de la institución'],
            ['clave' => 'jefe_cargo', 'valor' => 'Presidente del Consejo de Protección', 'tipo' => 'texto', 'categoria' => 'jefatura', 'descripcion' => 'Cargo oficial del jefe'],
            ['clave' => 'jefe_firma', 'valor' => 'Firma Autorizada', 'tipo' => 'texto', 'categoria' => 'jefatura', 'descripcion' => 'Texto o imagen de firma'],
            
            // Logo
            ['clave' => 'logo_url', 'valor' => '/img/logo.png', 'tipo' => 'texto', 'categoria' => 'apariencia', 'descripcion' => 'Ruta del logo institucional'],
            ['clave' => 'logo_secundario_url', 'valor' => '', 'tipo' => 'texto', 'categoria' => 'apariencia', 'descripcion' => 'Ruta del logo secundario'],
            
            // Colores
            ['clave' => 'color_primario', 'valor' => '#1e3a8a', 'tipo' => 'color', 'categoria' => 'apariencia', 'descripcion' => 'Color primario de la interfaz'],
            ['clave' => 'color_secundario', 'valor' => '#3b82f6', 'tipo' => 'color', 'categoria' => 'apariencia', 'descripcion' => 'Color secundario de la interfaz'],
            ['clave' => 'color_acento', 'valor' => '#f59e0b', 'tipo' => 'color', 'categoria' => 'apariencia', 'descripcion' => 'Color de acento'],
            
            // Permisos por rol (JSON)
            ['clave' => 'permisos_administrador', 'valor' => json_encode(['ver_expedientes', 'crear_expedientes', 'editar_expedientes', 'eliminar_expedientes', 'ver_usuarios', 'crear_usuarios', 'editar_usuarios', 'eliminar_usuarios', 'ver_reportes', 'ver_historial', 'configurar_sistema', 'asignar_casos', 'gestionar_plantillas']), 'tipo' => 'json', 'categoria' => 'permisos', 'descripcion' => 'Permisos del rol administrador'],
            ['clave' => 'permisos_supervisor', 'valor' => json_encode(['ver_expedientes', 'crear_expedientes', 'editar_expedientes', 'ver_usuarios', 'ver_reportes', 'ver_historial', 'asignar_casos', 'gestionar_plantillas']), 'tipo' => 'json', 'categoria' => 'permisos', 'descripcion' => 'Permisos del rol supervisor'],
            ['clave' => 'permisos_consejero', 'valor' => json_encode(['ver_expedientes', 'crear_expedientes', 'editar_expedientes']), 'tipo' => 'json', 'categoria' => 'permisos', 'descripcion' => 'Permisos del rol consejero'],
            
            // Configuración del sistema
            ['clave' => 'dias_alerta_verde', 'valor' => '20', 'tipo' => 'numero', 'categoria' => 'sistema', 'descripcion' => 'Días para alerta verde (LOPNNA)'],
            ['clave' => 'dias_alerta_amarillo', 'valor' => '21', 'tipo' => 'numero', 'categoria' => 'sistema', 'descripcion' => 'Días para alerta amarillo (LOPNNA)'],
            ['clave' => 'dias_alerta_rojo', 'valor' => '25', 'tipo' => 'numero', 'categoria' => 'sistema', 'descripcion' => 'Días para alerta rojo (LOPNNA)'],
            ['clave' => 'max_intentos_login', 'valor' => '5', 'tipo' => 'numero', 'categoria' => 'seguridad', 'descripcion' => 'Máximo de intentos de login fallidos'],
            ['clave' => 'tiempo_sesion_minutos', 'valor' => '60', 'tipo' => 'numero', 'categoria' => 'seguridad', 'descripcion' => 'Tiempo de sesión en minutos'],
        ];

        foreach ($configuraciones as $config) {
            Configuracion::create($config);
        }
    }
}
