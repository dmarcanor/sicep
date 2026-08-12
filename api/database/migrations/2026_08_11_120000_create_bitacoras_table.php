<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bitácora de actuaciones del expediente. Hasta ahora vivía en el estado de
     * React: la pantalla decía "Bitácora guardada con éxito" y la anotación
     * desaparecía al recargar.
     *
     * Es un registro de valor legal, así que sólo se añade: no hay ruta para
     * editarla ni borrarla, igual que con los expedientes.
     */
    public function up(): void
    {
        Schema::create('bitacoras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expediente_id')->constrained('expedientes')->onDelete('restrict');
            $table->foreignId('usuario_id')->constrained('users');
            $table->date('fecha');
            $table->text('nota');
            $table->timestamps();

            $table->index(['expediente_id', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bitacoras');
    }
};
