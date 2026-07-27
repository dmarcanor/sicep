<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('casos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();
            $table->foreignId('expediente_id')->constrained('expedientes');
            $table->foreignId('asignado_a')->constrained('users');
            $table->foreignId('asignado_por')->constrained('users');
            $table->text('motivo')->nullable();
            $table->enum('estatus', ['Pendiente', 'En proceso', 'Resuelto', 'Cerrado'])->default('Pendiente');
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('casos');
    }
};
