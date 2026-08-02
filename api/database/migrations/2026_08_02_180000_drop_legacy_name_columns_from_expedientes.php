<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Each step is guarded so a partially applied run can be resumed.
    public function up(): void
    {
        // A row still missing a foreign key would be orphaned by the column drop,
        // so recover the link from the name string before it goes away.
        if (Schema::hasColumn('expedientes', 'nino')) {
            DB::statement("
                UPDATE expedientes e
                JOIN nna n ON CONCAT(n.nombres, ' ', n.apellidos) = e.nino
                SET e.nna_id = n.id
                WHERE e.nna_id IS NULL
            ");
        }

        if (Schema::hasColumn('expedientes', 'representante')) {
            DB::statement("
                UPDATE expedientes e
                JOIN representantes r ON CONCAT(r.nombres, ' ', r.apellidos) = e.representante
                SET e.representante_id = r.id
                WHERE e.representante_id IS NULL
            ");
        }

        $huerfanos = DB::table('expedientes')
            ->whereNull('nna_id')
            ->orWhereNull('representante_id')
            ->count();

        if ($huerfanos > 0) {
            throw new RuntimeException(
                "No se puede continuar: {$huerfanos} expediente(s) sin nna_id o representante_id. " .
                'Asigne el NNA y el representante correspondientes antes de ejecutar esta migración.'
            );
        }

        $legacy = array_values(array_filter(
            ['nino', 'representante'],
            fn ($col) => Schema::hasColumn('expedientes', $col)
        ));

        if ($legacy !== []) {
            Schema::table('expedientes', function (Blueprint $table) use ($legacy) {
                $table->dropColumn($legacy);
            });
        }

        // representante_id was created with onDelete('set null'), which cannot survive a
        // NOT NULL column, so the constraint is rebuilt as restrict alongside nna_id
        // (which arrived as a plain column with no constraint at all).
        if ($this->foreignKeyExists('expedientes_representante_id_foreign')) {
            Schema::table('expedientes', function (Blueprint $table) {
                $table->dropForeign(['representante_id']);
            });
        }

        Schema::table('expedientes', function (Blueprint $table) {
            $table->foreignId('nna_id')->nullable(false)->change();
            $table->foreignId('representante_id')->nullable(false)->change();
        });

        if (! $this->foreignKeyExists('expedientes_nna_id_foreign')) {
            Schema::table('expedientes', function (Blueprint $table) {
                $table->foreign('nna_id')->references('id')->on('nna')->onDelete('restrict');
            });
        }

        if (! $this->foreignKeyExists('expedientes_representante_id_foreign')) {
            Schema::table('expedientes', function (Blueprint $table) {
                $table->foreign('representante_id')->references('id')->on('representantes')->onDelete('restrict');
            });
        }
    }

    private function foreignKeyExists(string $nombre): bool
    {
        return DB::table('information_schema.TABLE_CONSTRAINTS')
            ->where('CONSTRAINT_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', 'expedientes')
            ->where('CONSTRAINT_NAME', $nombre)
            ->where('CONSTRAINT_TYPE', 'FOREIGN KEY')
            ->exists();
    }

    public function down(): void
    {
        Schema::table('expedientes', function (Blueprint $table) {
            $table->dropForeign(['nna_id']);
            $table->dropForeign(['representante_id']);
            $table->string('nino')->nullable();
            $table->string('representante')->nullable();
        });

        DB::statement("
            UPDATE expedientes e
            JOIN nna n ON n.id = e.nna_id
            SET e.nino = CONCAT(n.nombres, ' ', n.apellidos)
        ");

        DB::statement("
            UPDATE expedientes e
            JOIN representantes r ON r.id = e.representante_id
            SET e.representante = CONCAT(r.nombres, ' ', r.apellidos)
        ");

        Schema::table('expedientes', function (Blueprint $table) {
            $table->foreignId('nna_id')->nullable()->change();
            $table->foreignId('representante_id')->nullable()->change();
        });

        Schema::table('expedientes', function (Blueprint $table) {
            $table->foreign('representante_id')->references('id')->on('representantes')->onDelete('set null');
        });
    }
};
