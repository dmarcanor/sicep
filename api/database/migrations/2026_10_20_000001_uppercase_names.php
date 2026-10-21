<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Actualizar nombres y apellidos de NNA
        DB::statement('UPDATE nna SET nombres = UPPER(nombres), apellidos = UPPER(apellidos)');
        
        // Actualizar nombres y apellidos de representantes
        DB::statement('UPDATE representantes SET nombres = UPPER(nombres), apellidos = UPPER(apellidos)');
        
        // Actualizar nombres de usuarios
        DB::statement('UPDATE users SET name = UPPER(name), display_name = UPPER(display_name) WHERE display_name IS NOT NULL');
    }

    public function down(): void
    {
        // No se puede revertir automáticamente ya que no sabemos el caso original
    }
};
