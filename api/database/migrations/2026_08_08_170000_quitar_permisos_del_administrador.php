<?php

use App\Support\Permisos;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * El administrador deja de ser configurable: su definición es tener acceso
     * a todo. Mientras la fila existía, un administrador podía quitarse a sí
     * mismo el módulo de Configuración y quedarse sin forma de revertirlo.
     */
    public function up(): void
    {
        DB::table('configuraciones')
            ->where('clave', Permisos::clave(Permisos::ROL_TOTAL))
            ->delete();
    }

    public function down(): void
    {
        DB::table('configuraciones')->updateOrInsert(
            ['clave' => Permisos::clave(Permisos::ROL_TOTAL)],
            [
                'valor' => json_encode(Permisos::MODULOS),
                'tipo' => 'json',
                'categoria' => 'permisos',
                'descripcion' => 'Módulos visibles para el rol administrador',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
};
