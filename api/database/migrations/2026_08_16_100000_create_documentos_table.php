<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Documentos generados desde Plantillas: citaciones, actas, medidas.
     *
     * Los borradores vivían en el localStorage del navegador, así que quien
     * empezaba una citación en un equipo no podía terminarla en otro y nadie
     * más veía lo emitido. Se guarda el formulario (`datos`), no el PDF: el
     * documento se vuelve a componer con la plantilla y el membrete vigentes.
     *
     * Un borrador se puede retirar mientras lo sea; una vez emitido queda,
     * porque a partir de ahí es una actuación del expediente.
     */
    public function up(): void
    {
        Schema::create('documentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expediente_id')->nullable()->constrained('expedientes')->onDelete('restrict');
            $table->foreignId('creado_por')->constrained('users');

            $table->string('plantilla');   // identificador del catálogo
            $table->string('titulo');
            $table->json('datos');
            $table->enum('estado', ['Borrador', 'Emitido'])->default('Borrador');
            $table->timestamp('emitido_en')->nullable();

            $table->timestamps();
            $table->index(['expediente_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documentos');
    }
};
