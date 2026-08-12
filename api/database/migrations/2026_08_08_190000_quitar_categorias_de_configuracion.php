<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const CATEGORIAS = ['apariencia', 'seguridad', 'jefatura'];

    /**
     * Se retiran tres categorías de Configuración por no aportar al trabajo
     * diario del despacho. Lo que sí hacía falta se conserva como constante:
     * el bloqueo por intentos de login, el cierre de sesión por inactividad y
     * la línea de firma de los documentos siguen funcionando, sólo que ya no
     * se ajustan desde la pantalla.
     */
    public function up(): void
    {
        DB::table('configuraciones')->whereIn('categoria', self::CATEGORIAS)->delete();
    }

    public function down(): void
    {
        $filas = [
            ['clave' => 'jefe_nombre', 'valor' => 'Nombre del Jefe(a)', 'tipo' => 'texto', 'categoria' => 'jefatura', 'descripcion' => 'Nombre completo del jefe de la institución'],
            ['clave' => 'jefe_cargo', 'valor' => 'Presidente del Consejo de Protección', 'tipo' => 'texto', 'categoria' => 'jefatura', 'descripcion' => 'Cargo oficial del jefe'],
            ['clave' => 'jefe_firma', 'valor' => 'Firma Autorizada', 'tipo' => 'texto', 'categoria' => 'jefatura', 'descripcion' => 'Texto o imagen de firma'],
            ['clave' => 'logo_url', 'valor' => '/img/logo.png', 'tipo' => 'texto', 'categoria' => 'apariencia', 'descripcion' => 'Ruta del logo institucional'],
            ['clave' => 'logo_secundario_url', 'valor' => '', 'tipo' => 'texto', 'categoria' => 'apariencia', 'descripcion' => 'Ruta del logo secundario'],
            ['clave' => 'color_primario', 'valor' => '#1e3a8a', 'tipo' => 'color', 'categoria' => 'apariencia', 'descripcion' => 'Color primario de la interfaz'],
            ['clave' => 'color_secundario', 'valor' => '#3b82f6', 'tipo' => 'color', 'categoria' => 'apariencia', 'descripcion' => 'Color secundario de la interfaz'],
            ['clave' => 'color_acento', 'valor' => '#f59e0b', 'tipo' => 'color', 'categoria' => 'apariencia', 'descripcion' => 'Color de acento'],
            ['clave' => 'max_intentos_login', 'valor' => '5', 'tipo' => 'numero', 'categoria' => 'seguridad', 'descripcion' => 'Máximo de intentos de login fallidos'],
            ['clave' => 'tiempo_sesion_minutos', 'valor' => '60', 'tipo' => 'numero', 'categoria' => 'seguridad', 'descripcion' => 'Tiempo de sesión en minutos'],
        ];

        foreach ($filas as $fila) {
            DB::table('configuraciones')->updateOrInsert(
                ['clave' => $fila['clave']],
                $fila + ['created_at' => now(), 'updated_at' => now()],
            );
        }
    }
};
