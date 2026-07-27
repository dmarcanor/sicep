<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes_archivo', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();
            $table->foreignId('expediente_id')->constrained('expedientes');
            $table->foreignId('solicitante_id')->constrained('users');
            $table->text('documentos_solicitados');
            $table->enum('estatus', ['Pendiente', 'En proceso', 'Completado', 'Rechazado'])->default('Pendiente');
            $table->text('observaciones')->nullable();
            $table->timestamp('fecha_entrega')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_archivo');
    }
};
