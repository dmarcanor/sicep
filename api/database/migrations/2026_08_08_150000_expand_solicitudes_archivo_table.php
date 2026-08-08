<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * El módulo de Solicitud de Archivos lleva el control del expediente
     * físico: dónde está guardado, quién lo pidió y en qué estado se encuentra.
     * La tabla sólo cubría el ciclo de la petición, así que esos datos no
     * tenían dónde guardarse y se perdían al recargar.
     */
    public function up(): void
    {
        Schema::table('solicitudes_archivo', function (Blueprint $table) {
            // Quien solicita físicamente el expediente, que no siempre es el
            // usuario del sistema que registra la solicitud (solicitante_id).
            $table->string('solicitante_nombre')->nullable()->after('solicitante_id');
            $table->string('cargo')->nullable()->after('solicitante_nombre');
            $table->string('caso')->nullable()->after('cargo');
            $table->text('motivo')->nullable()->after('caso');

            $table->date('fecha_solicitud')->nullable()->after('motivo');
            $table->date('fecha_prestamo')->nullable()->after('fecha_solicitud');
            $table->date('fecha_devolucion')->nullable()->after('fecha_prestamo');

            $table->string('ubicacion_archivo')->nullable()->after('fecha_devolucion');
            $table->string('ubicacion_estante')->nullable()->after('ubicacion_archivo');
            $table->string('ubicacion_nivel')->nullable()->after('ubicacion_estante');
            $table->string('ubicacion_caja')->nullable()->after('ubicacion_nivel');
        });

        // El formulario no pide un detalle de documentos: describe el caso y el
        // motivo. Se conserva la columna para las solicitudes ya registradas.
        DB::statement('ALTER TABLE solicitudes_archivo MODIFY documentos_solicitados TEXT NULL');

        // Al ciclo de la petición se suman los estados del expediente físico.
        DB::statement("
            ALTER TABLE solicitudes_archivo MODIFY estatus ENUM(
                'Pendiente',
                'En proceso',
                'Completado',
                'Rechazado',
                'Disponible',
                'Reservado',
                'Prestado',
                'Devuelto',
                'En consulta',
                'Extraviado',
                'En digitalización'
            ) NOT NULL DEFAULT 'Pendiente'
        ");
    }

    public function down(): void
    {
        DB::table('solicitudes_archivo')
            ->whereIn('estatus', [
                'Disponible', 'Reservado', 'Prestado', 'Devuelto',
                'En consulta', 'Extraviado', 'En digitalización',
            ])
            ->update(['estatus' => 'Pendiente']);

        DB::statement("
            ALTER TABLE solicitudes_archivo MODIFY estatus ENUM(
                'Pendiente', 'En proceso', 'Completado', 'Rechazado'
            ) NOT NULL DEFAULT 'Pendiente'
        ");

        DB::statement("UPDATE solicitudes_archivo SET documentos_solicitados = '' WHERE documentos_solicitados IS NULL");
        DB::statement('ALTER TABLE solicitudes_archivo MODIFY documentos_solicitados TEXT NOT NULL');

        Schema::table('solicitudes_archivo', function (Blueprint $table) {
            $table->dropColumn([
                'solicitante_nombre', 'cargo', 'caso', 'motivo',
                'fecha_solicitud', 'fecha_prestamo', 'fecha_devolucion',
                'ubicacion_archivo', 'ubicacion_estante', 'ubicacion_nivel', 'ubicacion_caja',
            ]);
        });
    }
};
