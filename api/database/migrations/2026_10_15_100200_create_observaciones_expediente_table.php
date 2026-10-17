<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Observaciones de la secretaría sobre un expediente. Son notas: no tienen
     * estado y sólo se añaden, como la bitácora.
     */
    public function up(): void
    {
        Schema::create('observaciones_expediente', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expediente_id')->constrained('expedientes')->onDelete('restrict');
            $table->foreignId('usuario_id')->constrained('users');
            $table->text('texto');
            $table->timestamps();

            $table->index(['expediente_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('observaciones_expediente');
    }
};
