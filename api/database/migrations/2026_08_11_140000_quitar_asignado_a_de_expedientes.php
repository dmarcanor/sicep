<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * El responsable de un expediente se decide en Asignación de Casos, que
     * crea un registro en `casos`. Esta columna era una segunda vía paralela
     * que ninguna pantalla escribía (0 filas la usaban) y que además dejaba dos
     * respuestas posibles a "quién lleva este expediente".
     */
    public function up(): void
    {
        if (! Schema::hasColumn('expedientes', 'asignado_a')) {
            return;
        }

        if ($this->existeClaveForanea('expedientes_asignado_a_foreign')) {
            Schema::table('expedientes', function (Blueprint $table) {
                $table->dropForeign(['asignado_a']);
            });
        }

        Schema::table('expedientes', function (Blueprint $table) {
            $table->dropColumn('asignado_a');
        });
    }

    public function down(): void
    {
        Schema::table('expedientes', function (Blueprint $table) {
            $table->foreignId('asignado_a')->nullable()->constrained('users');
        });
    }

    private function existeClaveForanea(string $nombre): bool
    {
        return DB::table('information_schema.TABLE_CONSTRAINTS')
            ->where('CONSTRAINT_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', 'expedientes')
            ->where('CONSTRAINT_NAME', $nombre)
            ->where('CONSTRAINT_TYPE', 'FOREIGN KEY')
            ->exists();
    }
};
