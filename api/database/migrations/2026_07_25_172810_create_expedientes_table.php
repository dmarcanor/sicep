<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expedientes', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();
            $table->date('fecha');
            $table->string('nino');
            $table->string('representante');
            $table->string('sector');
            $table->enum('estatus', ['Registrado', 'En revisión', 'Aprobado', 'Observado', 'Cerrado'])->default('Registrado');
            $table->enum('prioridad', ['Alta', 'Media', 'Baja'])->default('Media');
            $table->text('observaciones')->nullable();
            $table->foreignId('registrado_por')->constrained('users');
            $table->foreignId('asignado_a')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expedientes');
    }
};
