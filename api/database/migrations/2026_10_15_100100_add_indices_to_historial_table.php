<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('historial', function (Blueprint $table) {
            $table->index('created_at');
            $table->index(['registro_tipo', 'registro_id']);
        });
    }

    public function down(): void
    {
        Schema::table('historial', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['registro_tipo', 'registro_id']);
        });
    }
};
