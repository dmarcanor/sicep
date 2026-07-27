<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expedientes', function (Blueprint $table) {
            $table->enum('tipificacion', [
                'Maltrato Físico',
                'Abuso Sexual',
                'Negligencia',
                'Acoso Escolar',
                'Trabajo Infantil',
                'Violencia Psicológica',
                'Abandono',
                'Explotación',
                'Otro'
            ])->nullable()->after('prioridad');
            $table->text('causa')->nullable()->after('tipificacion');
            $table->time('hora_registro')->nullable()->after('fecha');
        });
    }

    public function down(): void
    {
        Schema::table('expedientes', function (Blueprint $table) {
            $table->dropColumn(['tipificacion', 'causa', 'hora_registro']);
        });
    }
};
