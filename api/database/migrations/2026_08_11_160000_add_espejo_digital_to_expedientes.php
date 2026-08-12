<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Espejo digital: dónde está el expediente en papel y el PDF con su
     * resumen final. Ambas cosas vivían en el estado de React, así que los
     * botones y el archivo cargado desaparecían al recargar la pantalla.
     */
    public function up(): void
    {
        Schema::table('expedientes', function (Blueprint $table) {
            $table->enum('estatus_fisico', ['Pendiente', 'En Despacho', 'En Archivo Central'])
                ->default('Pendiente')
                ->after('estatus');

            // La ruta queda en disco (volumen del contenedor), no en la base.
            $table->string('resumen_pdf_ruta')->nullable()->after('observaciones');
            $table->string('resumen_pdf_nombre')->nullable()->after('resumen_pdf_ruta');
        });
    }

    public function down(): void
    {
        Schema::table('expedientes', function (Blueprint $table) {
            $table->dropColumn(['estatus_fisico', 'resumen_pdf_ruta', 'resumen_pdf_nombre']);
        });
    }
};
