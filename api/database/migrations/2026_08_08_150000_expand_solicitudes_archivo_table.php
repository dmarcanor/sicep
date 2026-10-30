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
            // Verificar si las columnas ya existen antes de agregarlas
            if (!Schema::hasColumn('solicitudes_archivo', 'solicitante_nombre')) {
                $table->string('solicitante_nombre')->nullable()->after('solicitante_id');
            }
            if (!Schema::hasColumn('solicitudes_archivo', 'cargo')) {
                $table->string('cargo')->nullable()->after('solicitante_nombre');
            }
            if (!Schema::hasColumn('solicitudes_archivo', 'caso')) {
                $table->string('caso')->nullable()->after('cargo');
            }
            if (!Schema::hasColumn('solicitudes_archivo', 'motivo')) {
                $table->text('motivo')->nullable()->after('caso');
            }
            if (!Schema::hasColumn('solicitudes_archivo', 'fecha_solicitud')) {
                $table->date('fecha_solicitud')->nullable()->after('motivo');
            }
            if (!Schema::hasColumn('solicitudes_archivo', 'fecha_prestamo')) {
                $table->date('fecha_prestamo')->nullable()->after('fecha_solicitud');
            }
            if (!Schema::hasColumn('solicitudes_archivo', 'fecha_devolucion')) {
                $table->date('fecha_devolucion')->nullable()->after('fecha_prestamo');
            }
            if (!Schema::hasColumn('solicitudes_archivo', 'ubicacion_archivo')) {
                $table->string('ubicacion_archivo')->nullable()->after('fecha_devolucion');
            }
            if (!Schema::hasColumn('solicitudes_archivo', 'ubicacion_estante')) {
                $table->string('ubicacion_estante')->nullable()->after('ubicacion_archivo');
            }
            if (!Schema::hasColumn('solicitudes_archivo', 'ubicacion_nivel')) {
                $table->string('ubicacion_nivel')->nullable()->after('ubicacion_estante');
            }
            if (!Schema::hasColumn('solicitudes_archivo', 'ubicacion_caja')) {
                $table->string('ubicacion_caja')->nullable()->after('ubicacion_nivel');
            }
        });

        // MySQL-specific operations: MODIFY and ENUM are not supported in SQLite
        // SQLite is more flexible with types, so we can skip these modifications
        $driver = DB::getDriverName();
        
        if ($driver === 'mysql') {
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
        // For SQLite, the column types are more flexible and don't require modification
    }

    public function down(): void
    {
        DB::table('solicitudes_archivo')
            ->whereIn('estatus', [
                'Disponible', 'Reservado', 'Prestado', 'Devuelto',
                'En consulta', 'Extraviado', 'En digitalización',
            ])
            ->update(['estatus' => 'Pendiente']);

        $driver = DB::getDriverName();
        
        if ($driver === 'mysql') {
            DB::statement("
                ALTER TABLE solicitudes_archivo MODIFY estatus ENUM(
                    'Pendiente', 'En proceso', 'Completado', 'Rechazado'
                ) NOT NULL DEFAULT 'Pendiente'
            ");

            DB::statement("UPDATE solicitudes_archivo SET documentos_solicitados = '' WHERE documentos_solicitados IS NULL");
            DB::statement('ALTER TABLE solicitudes_archivo MODIFY documentos_solicitados TEXT NOT NULL');
        }

        Schema::table('solicitudes_archivo', function (Blueprint $table) {
            $table->dropColumn([
                'solicitante_nombre', 'cargo', 'caso', 'motivo',
                'fecha_solicitud', 'fecha_prestamo', 'fecha_devolucion',
                'ubicacion_archivo', 'ubicacion_estante', 'ubicacion_nivel', 'ubicacion_caja',
            ]);
        });
    }
};
