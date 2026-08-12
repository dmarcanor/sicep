<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Dos umbrales describen por completo un semáforo de tres colores: por
     * debajo del primero es verde, entre ambos amarillo y a partir del segundo
     * rojo. `dias_alerta_verde` no aportaba un tercer estado, sólo cambiaba el
     * texto, y su etiqueta prometía algo que no hacía.
     *
     * Sólo se reescriben las descripciones: los valores que haya ajustado la
     * institución se respetan.
     */
    public function up(): void
    {
        DB::table('configuraciones')->where('clave', 'dias_alerta_verde')->delete();

        DB::table('configuraciones')->where('clave', 'dias_alerta_amarillo')->update([
            'descripcion' => 'Días para marcar el expediente en amarillo (por vencer)',
            'updated_at' => now(),
        ]);

        DB::table('configuraciones')->where('clave', 'dias_alerta_rojo')->update([
            'descripcion' => 'Días para marcar el expediente en rojo (lapso vencido)',
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('configuraciones')->updateOrInsert(
            ['clave' => 'dias_alerta_verde'],
            [
                'valor' => '20',
                'tipo' => 'numero',
                'categoria' => 'sistema',
                'descripcion' => 'Días para alerta verde (LOPNNA)',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        DB::table('configuraciones')->where('clave', 'dias_alerta_amarillo')
            ->update(['descripcion' => 'Días para alerta amarillo (LOPNNA)', 'updated_at' => now()]);
        DB::table('configuraciones')->where('clave', 'dias_alerta_rojo')
            ->update(['descripcion' => 'Días para alerta rojo (LOPNNA)', 'updated_at' => now()]);
    }
};
