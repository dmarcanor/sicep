<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Momento en que el expediente pasó a "Cerrado".
     *
     * Sin esta marca no hay forma honesta de calcular el tiempo medio de
     * resolución: `updated_at` cambia con cualquier edición posterior, así que
     * usarlo daría una media que se mueve sola.
     */
    public function up(): void
    {
        Schema::table('expedientes', function (Blueprint $table) {
            $table->timestamp('cerrado_en')->nullable()->after('estatus_fisico');
        });

        // Los ya cerrados no dejaron rastro de cuándo se cerraron. Se toma
        // updated_at como mejor aproximación disponible y se deja constancia:
        // a partir de ahora la marca es exacta.
        DB::table('expedientes')
            ->where('estatus', 'Cerrado')
            ->whereNull('cerrado_en')
            ->update(['cerrado_en' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        Schema::table('expedientes', function (Blueprint $table) {
            $table->dropColumn('cerrado_en');
        });
    }
};
