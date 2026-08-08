<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * El módulo distingue el reparto automático por carga del que decide la
     * Presidencia (spec: "Asignación manual o automática"). Sin columna, esa
     * distinción vivía sólo en memoria y se perdía al recargar.
     */
    public function up(): void
    {
        Schema::table('casos', function (Blueprint $table) {
            $table->enum('tipo_asignacion', ['Rotativa', 'Manual'])
                ->default('Rotativa')
                ->after('asignado_por');
        });
    }

    public function down(): void
    {
        Schema::table('casos', function (Blueprint $table) {
            $table->dropColumn('tipo_asignacion');
        });
    }
};
