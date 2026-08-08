<?php

use App\Support\Permisos;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * La matriz de permisos guardaba acciones sueltas (ver_expedientes,
     * crear_usuarios…) que ninguna capa leía. Ahora expresa qué módulos ve cada
     * rol, que es lo que el menú y la API consultan, así que hay que reescribir
     * los valores existentes: los antiguos no corresponden a ningún módulo.
     */
    public function up(): void
    {
        // 'valor' es varchar(255) y estas listas son JSON: quedaba muy justo.
        Schema::table('configuraciones', function (Blueprint $table) {
            $table->text('valor')->nullable()->change();
        });

        foreach (Permisos::PREDETERMINADOS as $rol => $modulos) {
            $clave = Permisos::clave($rol);

            $atributos = [
                'valor' => json_encode($modulos),
                'tipo' => 'json',
                'categoria' => 'permisos',
                'descripcion' => "Módulos visibles para el rol {$rol}",
                'updated_at' => now(),
            ];

            $existe = DB::table('configuraciones')->where('clave', $clave)->exists();

            if ($existe) {
                DB::table('configuraciones')->where('clave', $clave)->update($atributos);
                continue;
            }

            DB::table('configuraciones')->insert($atributos + [
                'clave' => $clave,
                'created_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('configuraciones')
            ->where('categoria', 'permisos')
            ->delete();

        Schema::table('configuraciones', function (Blueprint $table) {
            $table->string('valor')->nullable()->change();
        });
    }
};
