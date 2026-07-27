<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('historial', function (Blueprint $table) {
            $table->enum('estado', ['Exitoso', 'Error', 'Pendiente'])->default('Exitoso')->after('detalles');
        });
    }

    public function down(): void
    {
        Schema::table('historial', function (Blueprint $table) {
            $table->dropColumn('estado');
        });
    }
};
